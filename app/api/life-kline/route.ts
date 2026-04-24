import { NextRequest, NextResponse } from 'next/server';
import {
  BOLL,
  KDJ,
  MACD,
  RSI,
  SMA,
  detectKDJCross,
  detectMACDCross,
  detectRSISignal,
  getMATrend,
  identifyTrend,
} from '@/lib/domain/ta-math';
import { scoresToOHLCList, type Dimension, type Period } from '@/lib/domain/score-to-ohlc';
import { isBailianConfigured } from '@/lib/server/env';
import { runLifeKlineInference } from '@/lib/server/life-kline/service';

interface TechnicalIndicators {
  ma5: (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
  macd: Array<{ dif: number; dea: number; macd: number }>;
  rsi: (number | null)[];
  kdj: Array<{ k: number | null; d: number | null; j: number | null }>;
  boll: Array<{ upper: number | null; middle: number | null; lower: number | null }>;
}

interface CrossSignals {
  macd_golden: Array<{ index: number; year: number }>;
  macd_death: Array<{ index: number; year: number }>;
  kdj_golden: Array<{ index: number; year: number }>;
  kdj_death: Array<{ index: number; year: number }>;
  rsi_overbought: Array<{ index: number; year: number }>;
  rsi_oversold: Array<{ index: number; year: number }>;
}

interface MacdSeriesPoint {
  dif: number;
  dea: number;
  macd: number;
  year: number;
  age: number;
  month?: number;
}

type DimensionType = 'wealth' | 'life' | 'emotion';
type PeriodType = 'daily' | 'monthly' | 'yearly';

interface LifeKlineRequestBody {
  birth?: string;
  birthTime?: string;
  gender?: 'male' | 'female';
  dimension?: DimensionType;
  period?: PeriodType | 'day' | 'month' | 'year';
  targetYear?: number;
  targetMonth?: number;
}

interface TimelinePoint {
  year: number;
  month?: number;
  day?: number;
  age?: number;
  analysis?: string;
  summary?: string;
  score?: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

const DIMENSION_LABELS: Record<DimensionType, string> = {
  wealth: '财富',
  life: '生命状态',
  emotion: '情感关系',
};

function findNearestValueIndex<T>(
  values: T[],
  currentIndex: number,
  isValid: (value: T | undefined) => boolean,
) {
  for (let index = Math.min(currentIndex, values.length - 1); index >= 0; index -= 1) {
    if (isValid(values[index])) {
      return index;
    }
  }

  return values.findIndex((value) => isValid(value));
}

function findCurrentIndex(timeline: TimelinePoint[], period: PeriodType): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    const item = timeline[index];

    if (period === 'yearly' && item.year <= currentYear) {
      return index;
    }

    if (
      period === 'monthly' &&
      (item.year < currentYear || (item.year === currentYear && (item.month ?? 0) <= currentMonth))
    ) {
      return index;
    }

    if (
      period === 'daily' &&
      (item.year < currentYear ||
        (item.year === currentYear && (item.month ?? 0) < currentMonth) ||
        (item.year === currentYear &&
          (item.month ?? 0) === currentMonth &&
          (item.day ?? 0) <= currentDay))
    ) {
      return index;
    }
  }

  return timeline.length - 1;
}

function generateTechnicalCommentary(
  indicators: TechnicalIndicators,
  crossSignals: CrossSignals,
  timeline: TimelinePoint[],
  closes: number[],
  dimension: DimensionType,
  period: PeriodType,
) {
  const currentIndex = findCurrentIndex(timeline, period);
  const label = DIMENSION_LABELS[dimension];
  const maTrend = getMATrend(
    indicators.ma5[currentIndex] ?? null,
    indicators.ma10[currentIndex] ?? null,
    indicators.ma20[currentIndex] ?? null,
  );
  const latestClose = closes[currentIndex] ?? closes[closes.length - 1] ?? 50;
  const rsiIndex = findNearestValueIndex(indicators.rsi, currentIndex, (value) => value !== null && value !== undefined);
  const kdjIndex = findNearestValueIndex(indicators.kdj, currentIndex, (value) => value?.k !== null && value?.k !== undefined);
  const bollIndex = findNearestValueIndex(indicators.boll, currentIndex, (value) => value?.middle !== null && value?.middle !== undefined);
  const latestRsi = rsiIndex >= 0 ? indicators.rsi[rsiIndex] : null;
  const latestMacd = indicators.macd[currentIndex] ?? indicators.macd[indicators.macd.length - 1];
  const latestKdj = kdjIndex >= 0 ? indicators.kdj[kdjIndex] : null;
  const latestBoll = bollIndex >= 0 ? indicators.boll[bollIndex] : null;

  const recentMacdGolden = crossSignals.macd_golden.some((item) => item.index >= currentIndex - 3);
  const recentMacdDeath = crossSignals.macd_death.some((item) => item.index >= currentIndex - 3);
  const recentKdjGolden = crossSignals.kdj_golden.some((item) => item.index >= currentIndex - 3);
  const recentKdjDeath = crossSignals.kdj_death.some((item) => item.index >= currentIndex - 3);
  const recentRsiOverbought = crossSignals.rsi_overbought.some((item) => item.index >= currentIndex - 2);
  const recentRsiOversold = crossSignals.rsi_oversold.some((item) => item.index >= currentIndex - 2);

  const maText =
    maTrend === 'bullish'
      ? `${label}维度位于均线偏强区间，阶段趋势仍有支撑。`
      : maTrend === 'bearish'
        ? `${label}维度仍受均线压制，短期宜降低预期。`
        : `${label}维度围绕均线震荡，当前更适合观察节奏变化。`;

  const macdText = recentMacdGolden
    ? 'MACD 最近出现金叉，动能有转强迹象。'
    : recentMacdDeath
      ? 'MACD 最近出现死叉，动能短期偏弱。'
      : `MACD 柱体当前${(latestMacd?.macd ?? 0) >= 0 ? '位于零轴上方' : '位于零轴下方'}。`;

  const kdjText = recentKdjGolden
    ? 'KDJ 低位金叉，短期修复信号增强。'
    : recentKdjDeath
      ? 'KDJ 高位死叉，短期存在回落压力。'
      : latestKdj
        ? `KDJ 当前约为 K=${latestKdj.k?.toFixed(0) ?? '--'}，短线节奏保持观察。`
        : 'KDJ 数据窗口仍在积累，暂不形成有效判断。';

  const rsiText = recentRsiOverbought
    ? 'RSI 接近过热区间，需警惕阶段性回落。'
    : recentRsiOversold
      ? 'RSI 接近超卖区间，后续存在修复空间。'
      : latestRsi !== null && latestRsi !== undefined
        ? `RSI 当前约为 ${latestRsi.toFixed(1)}，强弱处于可观察区间。`
        : 'RSI 数据窗口仍在积累，暂不形成有效判断。';

  const bollText = latestBoll
    ? `BOLL 中轨约为 ${latestBoll.middle?.toFixed(1) ?? '--'}，当前收盘为 ${latestClose.toFixed(1)}。`
    : 'BOLL 数据窗口仍在积累，当前以价格波动本身为主。';

  return {
    ma_trend: maText,
    macd_signal: macdText,
    kdj_signal: kdjText,
    rsi_signal: rsiText,
    boll_signal: bollText,
  };
}

export async function POST(request: NextRequest) {
  // Check if Bailian API is configured
  if (!isBailianConfigured()) {
    return NextResponse.json({ error: 'Bailian API is not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as LifeKlineRequestBody;
    const { birth, birthTime, gender, dimension, period, targetYear, targetMonth } = body;

    if (!birth || !gender || !dimension || !period) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (new Date(birth) > new Date()) {
      return NextResponse.json({ error: 'Birth date cannot be in the future' }, { status: 400 });
    }

    const { aiResult, bazi, birthYear, hourInfo } = await runLifeKlineInference({
      birth,
      birthTime,
      gender,
      dimension,
      period,
      targetYear,
      targetMonth,
    });

    if (!aiResult.timeline?.length) {
      throw new Error('AI timeline is empty');
    }

    const dimMap: Record<string, Dimension> = {
      wealth: 'wealth',
      life: 'life',
      emotion: 'emotion',
    };
    const periodMap: Record<string, Period> = {
      day: 'daily',
      daily: 'daily',
      month: 'monthly',
      monthly: 'monthly',
      year: 'yearly',
      yearly: 'yearly',
    };

    const mappedDimension = dimMap[dimension] || 'wealth';
    const mappedPeriod = (periodMap[period] || periodMap[aiResult.period] || 'yearly') as PeriodType;
    const scores = aiResult.timeline.map((entry) => {
      const score = Number(entry.score);
      return Number.isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
    });
    const ohlcList = scoresToOHLCList(scores, mappedDimension, mappedPeriod, 50);

    const timeline: TimelinePoint[] = aiResult.timeline.map((entry, index) => ({
      ...entry,
      o: ohlcList[index].o,
      h: ohlcList[index].h,
      l: ohlcList[index].l,
      c: ohlcList[index].c,
      summary: entry.analysis?.substring(0, 8) || 'analyzing',
    }));

    const closes = timeline.map((entry) => entry.c);
    const compactPeriod = timeline.length <= 15;
    const ma5 = SMA(closes, 5);
    const ma10 = SMA(closes, 10);
    const ma20 = SMA(closes, 20);
    const macdResult = MACD(closes);
    const rsiResult = RSI(closes, compactPeriod ? 6 : 14);
    const kdjResult = KDJ(
      timeline.map((entry) => ({ h: entry.h, l: entry.l, c: entry.c })),
      compactPeriod ? 6 : 9,
      3,
      3,
    );
    const bollResult = BOLL(closes, compactPeriod ? 10 : 20, 2);

    const macdCrosses = detectMACDCross(
      macdResult.map((item, index) => ({
        ...item,
        year: timeline[index]?.year || 0,
        age: timeline[index]?.age ?? 0,
        month: timeline[index]?.month,
      }) as MacdSeriesPoint),
    );
    const kdjCrosses = detectKDJCross(kdjResult);
    const rsiSignals = detectRSISignal(rsiResult, 80, 20);

    const technicalIndicators: TechnicalIndicators = {
      ma5,
      ma10,
      ma20,
      macd: macdResult.map((item) => ({ dif: item.dif, dea: item.dea, macd: item.macd })),
      rsi: rsiResult,
      kdj: kdjResult,
      boll: bollResult,
    };

    const crossSignals: CrossSignals = {
      macd_golden: macdCrosses.filter((item) => item.type === 'golden').map((item) => ({ index: item.index, year: timeline[item.index]?.year || 0 })),
      macd_death: macdCrosses.filter((item) => item.type === 'death').map((item) => ({ index: item.index, year: timeline[item.index]?.year || 0 })),
      kdj_golden: kdjCrosses.filter((item) => item.type === 'golden').map((item) => ({ index: item.index, year: timeline[item.index]?.year || 0 })),
      kdj_death: kdjCrosses.filter((item) => item.type === 'death').map((item) => ({ index: item.index, year: timeline[item.index]?.year || 0 })),
      rsi_overbought: rsiSignals.filter((item) => item.type === 'overbought').map((item) => ({ index: item.index, year: timeline[item.index]?.year || 0 })),
      rsi_oversold: rsiSignals.filter((item) => item.type === 'oversold').map((item) => ({ index: item.index, year: timeline[item.index]?.year || 0 })),
    };

    const lastIndex = timeline.length - 1;
    const maTrend = getMATrend(ma5[lastIndex], ma10[lastIndex], ma20[lastIndex]);
    const currentTrend = identifyTrend(
      timeline.map((entry) => ({
        year: entry.year,
        age: entry.age || 0,
        o: entry.o,
        h: entry.h,
        l: entry.l,
        c: entry.c,
        summary: entry.summary || '',
      })),
      10,
    );

    return NextResponse.json({
      dimension: aiResult.dimension,
      period: mappedPeriod,
      lifespan: aiResult.lifespan,
      bazi: {
        nianZhu: bazi.formatted.nianZhu,
        yueZhu: bazi.formatted.yueZhu,
        riZhu: bazi.formatted.riZhu,
        shiZhu: bazi.formatted.shiZhu,
        riZhuWuXing: bazi.riZhuWuXing,
        riZhuYinYang: bazi.riZhuYinYang,
        wangShuai: bazi.wangShuai,
        wuXingCount: bazi.wuXingCount,
        shiShen: bazi.shiShen,
        daYun: bazi.daYun,
        qiYunAge: bazi.qiYunAge,
      },
      meta: {
        birthYear,
        birthTime,
        birthHour: hourInfo?.hour,
        hourAttribute: hourInfo?.attribute,
        gender,
        ...aiResult.meta,
      },
      timeline,
      technical_indicators: technicalIndicators,
      cross_signals: crossSignals,
      trend_analysis: {
        current_trend: currentTrend,
        ma_trend: maTrend,
      },
      global_analysis: aiResult.global_analysis,
      technical_commentary: generateTechnicalCommentary(
        technicalIndicators,
        crossSignals,
        timeline,
        closes,
        dimension,
        mappedPeriod,
      ),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. Try monthly or daily mode.' }, { status: 408 });
    }

    console.error('Life-Kline API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Life-Kline inference failed' },
      { status: 500 },
    );
  }
}
