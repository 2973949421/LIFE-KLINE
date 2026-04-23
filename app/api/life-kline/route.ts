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
  wealth: 'wealth',
  life: 'life',
  emotion: 'emotion',
};

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
  const latestRsi = indicators.rsi[currentIndex];
  const latestMacd = indicators.macd[currentIndex];
  const latestKdj = indicators.kdj[currentIndex];
  const latestBoll = indicators.boll[currentIndex];

  const recentMacdGolden = crossSignals.macd_golden.some((item) => item.index >= currentIndex - 3);
  const recentMacdDeath = crossSignals.macd_death.some((item) => item.index >= currentIndex - 3);
  const recentKdjGolden = crossSignals.kdj_golden.some((item) => item.index >= currentIndex - 3);
  const recentKdjDeath = crossSignals.kdj_death.some((item) => item.index >= currentIndex - 3);
  const recentRsiOverbought = crossSignals.rsi_overbought.some((item) => item.index >= currentIndex - 2);
  const recentRsiOversold = crossSignals.rsi_oversold.some((item) => item.index >= currentIndex - 2);

  const maText =
    maTrend === 'bullish'
      ? `${label} trend is above the moving averages.`
      : maTrend === 'bearish'
        ? `${label} trend is below the moving averages.`
        : `${label} trend is moving sideways around the averages.`;

  const macdText = recentMacdGolden
    ? 'MACD shows a recent golden cross.'
    : recentMacdDeath
      ? 'MACD shows a recent death cross.'
      : `MACD histogram is ${(latestMacd?.macd ?? 0) >= 0 ? 'above' : 'below'} zero.`;

  const kdjText = recentKdjGolden
    ? 'KDJ shows a low-position golden cross.'
    : recentKdjDeath
      ? 'KDJ shows a high-position death cross.'
      : `KDJ currently sits near K=${latestKdj?.k?.toFixed(0) ?? '--'}.`;

  const rsiText = recentRsiOverbought
    ? 'RSI is near an overbought zone.'
    : recentRsiOversold
      ? 'RSI is near an oversold zone.'
      : `RSI is around ${latestRsi?.toFixed(1) ?? '--'}.`;

  const bollText = latestBoll
    ? `BOLL middle band is near ${latestBoll.middle?.toFixed(1) ?? '--'}, latest close is ${latestClose.toFixed(1)}.`
    : 'BOLL signal is currently limited.';

  return {
    ma_trend: maText,
    macd_signal: macdText,
    kdj_signal: kdjText,
    rsi_signal: rsiText,
    boll_signal: bollText,
  };
}

export async function POST(request: NextRequest) {
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
      period: aiResult.period,
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