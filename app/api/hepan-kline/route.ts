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
import { getHourInfo } from '@/lib/domain/hour-map';
import {
  applyHepanAdjustment,
  calcHepanAdjustments,
  type Dimension as HepanDimension,
  type HepanAdjustments,
  type RelationType,
} from '@/lib/domain/hepan-score';
import { RELATION_LABELS } from '@/lib/domain/kline-constants';
import { scoresToOHLCList, type Dimension, type Period } from '@/lib/domain/score-to-ohlc';
import { runHepanKlineInference } from '@/lib/server/hepan-kline/service';

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

interface TimelinePoint {
  year: number;
  month?: number;
  day?: number;
  age_primary?: number;
  age_secondary?: number;
  analysis: string;
  score: number;
  confidence?: number;
  hepan_adjustment: number;
  o: number;
  h: number;
  l: number;
  c: number;
  summary: string;
}

interface MacdSeriesPoint {
  dif: number;
  dea: number;
  macd: number;
  year: number;
  age: number;
  month?: number;
}

type ApiDimension = 'wealth' | 'life' | 'emotion';
type ApiPeriod = 'daily' | 'monthly' | 'yearly';
const RELATION_TYPES: RelationType[] = ['couple', 'business', 'parent_child', 'other'];
const DIMENSIONS: ApiDimension[] = ['wealth', 'life', 'emotion'];
const PERIODS: ApiPeriod[] = ['daily', 'monthly', 'yearly'];

const DIMENSION_LABELS: Record<ApiDimension, string> = {
  wealth: '财富',
  life: '生命状态',
  emotion: '情感关系',
};

function findCurrentIndex(timeline: TimelinePoint[], period: ApiPeriod): number {
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
  dimension: ApiDimension,
  period: ApiPeriod,
  relationType: RelationType,
) {
  const currentIndex = findCurrentIndex(timeline, period);
  const label = DIMENSION_LABELS[dimension];
  const relationLabel = RELATION_LABELS[relationType] || relationType;
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
      ? `${relationLabel}在当前${label}维度上仍处于均线偏强区间。`
      : maTrend === 'bearish'
        ? `${relationLabel}在当前${label}维度上仍受均线压制，宜降低预期。`
        : `${relationLabel}在当前${label}维度上仍以震荡整理为主。`;

  const macdText = recentMacdGolden
    ? 'MACD 最近出现黄金交叉，关系节奏有回暖迹象。'
    : recentMacdDeath
      ? 'MACD 最近出现死亡交叉，关系节奏短期偏弱。'
      : `MACD 当前${(latestMacd?.macd ?? 0) >= 0 ? '位于零轴上方' : '位于零轴下方'}。`;

  const kdjText = recentKdjGolden
    ? 'KDJ 低位金叉，短期共振开始改善。'
    : recentKdjDeath
      ? 'KDJ 高位死叉，短期容易出现回落或分歧。'
      : `KDJ 当前约为 K=${latestKdj?.k?.toFixed(0) ?? '--'}。`;

  const rsiText = recentRsiOverbought
    ? 'RSI 提示阶段性过热，适合控制情绪预期。'
    : recentRsiOversold
      ? 'RSI 提示阶段性超卖，存在修复空间。'
      : `RSI 当前约为 ${latestRsi?.toFixed(1) ?? '--'}。`;

  const bollText = latestBoll
    ? `BOLL 中轨约为 ${latestBoll.middle?.toFixed(1) ?? '--'}，当前收盘为 ${latestClose.toFixed(1)}。`
    : 'BOLL 数据仍不足，当前以价格波动本身为主。';

  return {
    ma_trend: maText,
    macd_signal: macdText,
    kdj_signal: kdjText,
    rsi_signal: rsiText,
    boll_signal: bollText,
  };
}

function normalizeScore(value: unknown) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 50;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      primary,
      secondary,
      relationType,
      meetYear,
      analysisYears,
      analysisYear,
      analysisYearMonth,
      dimension,
      period,
    } = body;

    if (
      !primary?.birth ||
      !primary?.gender ||
      !secondary?.birth ||
      !secondary?.gender ||
      !relationType ||
      !meetYear ||
      !dimension ||
      !period
    ) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (!RELATION_TYPES.includes(relationType as RelationType)) {
      return NextResponse.json({ error: '关系类型无效' }, { status: 400 });
    }

    if (!DIMENSIONS.includes(dimension as ApiDimension)) {
      return NextResponse.json({ error: '分析维度无效' }, { status: 400 });
    }

    const normalizedPeriod = (period === 'year' ? 'yearly' : period === 'month' ? 'monthly' : period === 'day' ? 'daily' : period) as ApiPeriod;
    if (!PERIODS.includes(normalizedPeriod)) {
      return NextResponse.json({ error: '时间周期无效' }, { status: 400 });
    }

    const normalizedRelationType = relationType as RelationType;
    const normalizedDimension = dimension as ApiDimension;

    const parsedAnalysisMonth =
      typeof analysisYearMonth === 'string' && analysisYearMonth.includes('-')
        ? parseInt(analysisYearMonth.split('-')[1] ?? '', 10)
        : undefined;

    const parsedAnalysisYear =
      typeof analysisYear === 'number'
        ? analysisYear
        : typeof analysisYearMonth === 'string' && analysisYearMonth.includes('-')
          ? parseInt(analysisYearMonth.split('-')[0] ?? '', 10)
          : undefined;

    const { aiResult, primaryBazi, secondaryBazi, adjustedMeetYear, primaryBirthYear, secondaryBirthYear, primaryBirthHour, secondaryBirthHour, primaryLunarDates, secondaryLunarDates } =
      await runHepanKlineInference({
        primary,
        secondary,
        relationType: normalizedRelationType,
        meetYear,
        analysisYears,
        analysisYear: parsedAnalysisYear,
        analysisMonth: parsedAnalysisMonth,
        dimension: normalizedDimension,
        period: normalizedPeriod,
      });

    if (!aiResult.timeline?.length) {
      throw new Error('AI 返回的 timeline 为空');
    }

    const dimensionMap: Record<string, Dimension> = {
      wealth: 'wealth',
      life: 'life',
      emotion: 'emotion',
    };
    const hepanDimension = (dimensionMap[normalizedDimension] || 'emotion') as HepanDimension;

    const periodMap: Record<string, Period> = {
      day: 'daily',
      daily: 'daily',
      month: 'monthly',
      monthly: 'monthly',
      year: 'yearly',
      yearly: 'yearly',
    };
    const mappedPeriod = (periodMap[normalizedPeriod] || 'yearly') as ApiPeriod;

    const normalizedTimeline = aiResult.timeline.map((entry) => {
      const year = Number(entry.year);
      const month = typeof entry.month === 'number' ? entry.month : undefined;
      const day = typeof entry.day === 'number' ? entry.day : undefined;
      const agePrimary = typeof entry.age_primary === 'number' ? entry.age_primary : year - primaryBirthYear;
      const ageSecondary = typeof entry.age_secondary === 'number' ? entry.age_secondary : year - secondaryBirthYear;
      const adjustments = calcHepanAdjustments(primaryBazi, secondaryBazi, normalizedRelationType, hepanDimension, agePrimary, {
        primary: primaryLunarDates,
        secondary: secondaryLunarDates,
      });
      const adjustedScore = applyHepanAdjustment(normalizeScore(entry.score), adjustments as HepanAdjustments);

      return {
        year,
        month,
        day,
        analysis: typeof entry.analysis === 'string' ? entry.analysis : '合盘分析生成中',
        confidence: typeof entry.confidence === 'number' ? entry.confidence : undefined,
        age_primary: agePrimary,
        age_secondary: ageSecondary,
        base_score: normalizeScore(entry.score),
        adjusted_score: adjustedScore,
        adjustments,
      };
    });

    const adjustedScores = normalizedTimeline.map((entry) => entry.adjusted_score);
    const ohlcList = scoresToOHLCList(adjustedScores, hepanDimension, mappedPeriod, 50);

    const timeline: TimelinePoint[] = normalizedTimeline.map((entry, index) => ({
      year: entry.year,
      month: entry.month,
      day: entry.day,
      age_primary: entry.age_primary,
      age_secondary: entry.age_secondary,
      analysis: entry.analysis,
      score: entry.adjusted_score,
      confidence: entry.confidence,
      hepan_adjustment: entry.adjustments.total_adjustment,
      o: ohlcList[index]?.o ?? 50,
      h: ohlcList[index]?.h ?? 55,
      l: ohlcList[index]?.l ?? 45,
      c: ohlcList[index]?.c ?? 50,
      summary: entry.analysis.slice(0, 12) || '合盘分析',
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
        year: timeline[index]?.year ?? 0,
        age: timeline[index]?.age_primary ?? 0,
        month: timeline[index]?.month,
      })) as MacdSeriesPoint[],
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
      macd_golden: macdCrosses
        .filter((item) => item.type === 'golden')
        .map((item) => ({ index: item.index, year: timeline[item.index]?.year ?? 0 })),
      macd_death: macdCrosses
        .filter((item) => item.type === 'death')
        .map((item) => ({ index: item.index, year: timeline[item.index]?.year ?? 0 })),
      kdj_golden: kdjCrosses
        .filter((item) => item.type === 'golden')
        .map((item) => ({ index: item.index, year: timeline[item.index]?.year ?? 0 })),
      kdj_death: kdjCrosses
        .filter((item) => item.type === 'death')
        .map((item) => ({ index: item.index, year: timeline[item.index]?.year ?? 0 })),
      rsi_overbought: rsiSignals
        .filter((item) => item.type === 'overbought')
        .map((item) => ({ index: item.index, year: timeline[item.index]?.year ?? 0 })),
      rsi_oversold: rsiSignals
        .filter((item) => item.type === 'oversold')
        .map((item) => ({ index: item.index, year: timeline[item.index]?.year ?? 0 })),
    };

    const currentIndex = findCurrentIndex(timeline, mappedPeriod);
    const currentAdjustments = normalizedTimeline[currentIndex]?.adjustments ?? normalizedTimeline[timeline.length - 1]?.adjustments;
    const technicalCommentary = generateTechnicalCommentary(
      technicalIndicators,
      crossSignals,
      timeline,
      closes,
      hepanDimension,
      mappedPeriod,
      normalizedRelationType,
    );

    return NextResponse.json({
      relation_type: normalizedRelationType,
      primary: {
        name: primary.name || '甲方',
        bazi: {
          nianZhu: primaryBazi.formatted.nianZhu,
          yueZhu: primaryBazi.formatted.yueZhu,
          riZhu: primaryBazi.formatted.riZhu,
          shiZhu: primaryBazi.formatted.shiZhu,
          riZhuWuXing: primaryBazi.riZhuWuXing,
          riZhuYinYang: primaryBazi.riZhuYinYang,
          wangShuai: primaryBazi.wangShuai,
          wuXingCount: primaryBazi.wuXingCount,
          shiShen: primaryBazi.shiShen,
          daYun: primaryBazi.daYun,
          qiYunAge: primaryBazi.qiYunAge,
        },
        meta: {
          birthYear: primaryBirthYear,
          birthTime: primary.birthTime,
          birthHour: getHourInfo(primaryBirthHour).hour,
          hourAttribute: getHourInfo(primaryBirthHour).attribute,
          gender: primary.gender,
        },
      },
      secondary: {
        name: secondary.name || '乙方',
        bazi: {
          nianZhu: secondaryBazi.formatted.nianZhu,
          yueZhu: secondaryBazi.formatted.yueZhu,
          riZhu: secondaryBazi.formatted.riZhu,
          shiZhu: secondaryBazi.formatted.shiZhu,
          riZhuWuXing: secondaryBazi.riZhuWuXing,
          riZhuYinYang: secondaryBazi.riZhuYinYang,
          wangShuai: secondaryBazi.wangShuai,
          wuXingCount: secondaryBazi.wuXingCount,
          shiShen: secondaryBazi.shiShen,
          daYun: secondaryBazi.daYun,
          qiYunAge: secondaryBazi.qiYunAge,
        },
        meta: {
          birthYear: secondaryBirthYear,
          birthTime: secondary.birthTime,
          birthHour: getHourInfo(secondaryBirthHour).hour,
          hourAttribute: getHourInfo(secondaryBirthHour).attribute,
          gender: secondary.gender,
        },
      },
      hepan_meta: {
        meet_year: meetYear,
        meet_year_adjusted: adjustedMeetYear,
        common_lifespan: aiResult.hepan_meta?.common_lifespan ?? 80,
        relation_type: normalizedRelationType,
        relation_label: RELATION_LABELS[normalizedRelationType] || normalizedRelationType,
      },
      meet_year_analysis: {
        user_input: aiResult.meet_year_analysis?.user_input ?? meetYear,
        ai_suggested_range: aiResult.meet_year_analysis?.ai_suggested_range ?? [adjustedMeetYear],
        best_guess: aiResult.meet_year_analysis?.best_guess ?? adjustedMeetYear,
        reasoning: aiResult.meet_year_analysis?.reasoning ?? '当前结果以输入相识年份为主，结合八字结构做轻微校准。',
        confidence: aiResult.meet_year_analysis?.confidence ?? 0.7,
      },
      hepan_adjustments_detail: currentAdjustments,
      hepan_adjustments_summary: {
        current_total_adjustment: currentAdjustments?.total_adjustment ?? 0,
      },
      dimension: normalizedDimension,
      period: mappedPeriod,
      timeline,
      technical_indicators: technicalIndicators,
      cross_signals: crossSignals,
      trend_analysis: {
        current_trend: identifyTrend(
          timeline.map((entry) => ({
            year: entry.year,
            age: entry.age_primary ?? 0,
            o: entry.o,
            h: entry.h,
            l: entry.l,
            c: entry.c,
            summary: entry.summary,
          })),
          5,
        ),
        ma_trend: getMATrend(
          technicalIndicators.ma5[currentIndex] ?? null,
          technicalIndicators.ma10[currentIndex] ?? null,
          technicalIndicators.ma20[currentIndex] ?? null,
        ),
      },
      global_analysis:
        aiResult.global_analysis ?? {
          dimension_analysis: '合盘结果已生成，但整体分析字段为空。',
          pattern_match: {
            primary_pattern: '待补充',
            confidence: 0.5,
          },
          key_insights: '建议结合时间轴与技术指标综合判断。',
        },
      technical_commentary: technicalCommentary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '合盘分析失败，请稍后重试';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
