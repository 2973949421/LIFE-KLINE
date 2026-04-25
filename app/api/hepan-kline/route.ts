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
  calcHepanAdjustments,
  type Dimension as HepanDimension,
  type RelationType,
} from '@/lib/domain/hepan-score';
import {
  buildFallbackHepanAnalysis,
  buildHepanAiNarrativeLookup,
  buildHepanTimelineScaffold,
  computeLocalHepanBaseScore,
  getHepanTimelineKey,
} from '@/lib/domain/hepan-local-timeline';
import { buildHepanScoreSequence } from '@/lib/domain/hepan-sequence';
import { RELATION_LABELS } from '@/lib/domain/kline-constants';
import { scoresToHepanOHLCList } from '@/lib/domain/score-to-ohlc-hepan';
import { type Dimension, type Period } from '@/lib/domain/score-to-ohlc';
import { isBailianConfigured } from '@/lib/server/env';
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
  wealth: 'wealth',
  life: 'life',
  emotion: 'emotion',
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
      ? `${relationLabel} stays above the key moving averages in the ${label} view.`
      : maTrend === 'bearish'
        ? `${relationLabel} remains under moving-average pressure in the ${label} view.`
        : `${relationLabel} is consolidating around the moving averages in the ${label} view.`;

  const macdText = recentMacdGolden
    ? 'MACD recently formed a golden cross, suggesting a short-term recovery window.'
    : recentMacdDeath
      ? 'MACD recently formed a death cross, suggesting short-term pressure.'
      : `MACD is currently ${(latestMacd?.macd ?? 0) >= 0 ? 'above' : 'below'} the zero line.`;

  const kdjText = recentKdjGolden
    ? 'KDJ recently turned upward and shows improving short-term rhythm.'
    : recentKdjDeath
      ? 'KDJ recently turned downward, so a pullback remains possible.'
      : latestKdj
        ? `KDJ is around K=${latestKdj.k?.toFixed(0) ?? '--'}, with mixed short-term momentum.`
        : 'KDJ is still accumulating enough data to form a clearer signal.';

  const rsiText = recentRsiOverbought
    ? 'RSI suggests the sequence is temporarily overheated.'
    : recentRsiOversold
      ? 'RSI suggests the sequence is temporarily oversold and may repair.'
      : latestRsi !== null && latestRsi !== undefined
        ? `RSI is around ${latestRsi.toFixed(1)}, still within an observable middle zone.`
        : 'RSI is still accumulating data.';

  const bollText = latestBoll
    ? `BOLL middle band is around ${latestBoll.middle?.toFixed(1) ?? '--'}, while the latest close is ${latestClose.toFixed(1)}.`
    : 'BOLL does not yet have enough data.';

  return {
    ma_trend: maText,
    macd_signal: macdText,
    kdj_signal: kdjText,
    rsi_signal: rsiText,
    boll_signal: bollText,
  };
}

export async function POST(request: NextRequest) {
  if (!isBailianConfigured()) {
    return NextResponse.json({ error: 'Bailian API is not configured' }, { status: 503 });
  }

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
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!RELATION_TYPES.includes(relationType as RelationType)) {
      return NextResponse.json({ error: 'Invalid relationType' }, { status: 400 });
    }

    if (!DIMENSIONS.includes(dimension as ApiDimension)) {
      return NextResponse.json({ error: 'Invalid dimension' }, { status: 400 });
    }

    const normalizedPeriod = (
      period === 'year'
        ? 'yearly'
        : period === 'month'
          ? 'monthly'
          : period === 'day'
            ? 'daily'
            : period
    ) as ApiPeriod;

    if (!PERIODS.includes(normalizedPeriod)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
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

    const {
      aiResult,
      primaryBazi,
      secondaryBazi,
      adjustedMeetYear,
      primaryBirthYear,
      secondaryBirthYear,
      primaryBirthHour,
      secondaryBirthHour,
      primaryLunarDates,
      secondaryLunarDates,
    } = await runHepanKlineInference({
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

    const timelineScaffold = buildHepanTimelineScaffold({
      period: mappedPeriod,
      meetYear: adjustedMeetYear,
      analysisYears,
      analysisYear: parsedAnalysisYear,
      analysisMonth: parsedAnalysisMonth,
      primaryBirthYear,
      secondaryBirthYear,
    });
    const aiNarrativeLookup = buildHepanAiNarrativeLookup(aiResult.timeline ?? []);

    const normalizedTimeline = timelineScaffold.map((entry) => {
      const aiNarrative = aiNarrativeLookup.get(getHepanTimelineKey(entry));
      const adjustments = calcHepanAdjustments(
        primaryBazi,
        secondaryBazi,
        normalizedRelationType,
        hepanDimension,
        entry.age_primary,
        {
          primary: primaryLunarDates,
          secondary: secondaryLunarDates,
        },
      );
      const baseScore = computeLocalHepanBaseScore(entry, {
        period: mappedPeriod,
        dimension: hepanDimension,
        relationType: normalizedRelationType,
        meetYear: adjustedMeetYear,
      });
      const analysis =
        typeof aiNarrative?.analysis === 'string' && aiNarrative.analysis.trim().length > 0
          ? aiNarrative.analysis
          : buildFallbackHepanAnalysis(entry, baseScore, hepanDimension);

      return {
        year: entry.year,
        month: entry.month,
        day: entry.day,
        analysis,
        confidence: typeof aiNarrative?.confidence === 'number' ? aiNarrative.confidence : undefined,
        age_primary: entry.age_primary,
        age_secondary: entry.age_secondary,
        base_score: baseScore,
        adjustments,
      };
    });

    const sequencePoints = buildHepanScoreSequence(
      normalizedTimeline.map((entry) => ({
        baseScore: entry.base_score,
        year: entry.year,
        month: entry.month,
        day: entry.day,
        agePrimary: entry.age_primary,
        ageSecondary: entry.age_secondary,
        rawAdjustments: entry.adjustments,
      })),
      mappedPeriod,
      hepanDimension,
      normalizedRelationType,
    );

    const adjustedScores = sequencePoints.map((entry) => entry.score);
    const initialClose =
      adjustedScores.length > 0 ? Math.round((50 + (adjustedScores[0] ?? 50)) / 2) : 50;
    const ohlcList = scoresToHepanOHLCList(adjustedScores, hepanDimension, mappedPeriod, initialClose);

    const timeline: TimelinePoint[] = normalizedTimeline.map((entry, index) => ({
      year: entry.year,
      month: entry.month,
      day: entry.day,
      age_primary: entry.age_primary,
      age_secondary: entry.age_secondary,
      analysis: entry.analysis,
      score: sequencePoints[index]?.score ?? entry.base_score,
      confidence: entry.confidence,
      hepan_adjustment: sequencePoints[index]?.appliedAdjustment ?? entry.adjustments.total_adjustment,
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
    const currentAdjustments =
      normalizedTimeline[currentIndex]?.adjustments ?? normalizedTimeline[timeline.length - 1]?.adjustments;
    const currentSequencePoint =
      sequencePoints[currentIndex] ?? sequencePoints[sequencePoints.length - 1] ?? null;
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
        reasoning:
          aiResult.meet_year_analysis?.reasoning ??
          'The current result keeps the user-provided meet year and applies a light structure-based adjustment.',
        confidence: aiResult.meet_year_analysis?.confidence ?? 0.7,
      },
      hepan_adjustments_detail: currentAdjustments,
      hepan_adjustments_summary: {
        current_total_adjustment: currentSequencePoint?.appliedAdjustment ?? currentAdjustments?.total_adjustment ?? 0,
        structural_adjustment: currentSequencePoint?.structuralAdjustment ?? 0,
        dynamic_adjustment: currentSequencePoint?.dynamicAdjustment ?? 0,
        temporal_adjustment: currentSequencePoint?.temporalRhythm ?? 0,
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
          dimension_analysis: 'The relationship rhythm is generated locally and then interpreted with AI narrative context.',
          pattern_match: {
            primary_pattern: 'stable with fluctuation',
            confidence: 0.5,
          },
          key_insights: 'Watch the changing cadence instead of treating the entire sequence as a single uptrend or downtrend.',
        },
      technical_commentary: technicalCommentary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate hepan analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
