export type HepanPeriod = 'daily' | 'monthly' | 'yearly';
export type HepanDimension = 'wealth' | 'life' | 'emotion';
export type HepanRelationType = 'couple' | 'business' | 'parent_child' | 'other';

export interface HepanAdjustmentLike {
  score: number;
}

export interface HepanAdjustmentBundleLike {
  wu_xing_sheng_ke?: HepanAdjustmentLike;
  xing_sha_pei_he?: HepanAdjustmentLike;
  da_yun_tong_bu?: HepanAdjustmentLike;
  xingsu_relation?: HepanAdjustmentLike;
}

export interface HepanSequenceInput {
  baseScore: number;
  year: number;
  month?: number;
  day?: number;
  agePrimary: number;
  ageSecondary: number;
  rawAdjustments: HepanAdjustmentBundleLike;
}

export interface HepanSequencePoint {
  score: number;
  structuralAdjustment: number;
  dynamicAdjustment: number;
  temporalRhythm: number;
  appliedAdjustment: number;
}

const PERIOD_CONFIG = {
  yearly: {
    structuralWeight: 0.72,
    dynamicWeight: 0.82,
    rhythmAmplitude: 5.2,
    maxStep: 18,
    softCeiling: 88,
    softFloor: 8,
    softener: 0.35,
    highThreshold: 92,
    maxHighCount: 10,
    maxHighRun: 4,
    overflowPenalty: 2,
    plateauThreshold: 68,
    maxPlateauCount: 6,
    maxPlateauRun: 3,
    plateauPenalty: 3.8,
    pullbackDepth: 6,
  },
  monthly: {
    structuralWeight: 0.45,
    dynamicWeight: 0.55,
    rhythmAmplitude: 5.4,
    maxStep: 15,
    softCeiling: 86,
    softFloor: 12,
    softener: 0.35,
    highThreshold: 88,
    maxHighCount: 4,
    maxHighRun: 2,
    overflowPenalty: 3.5,
    plateauThreshold: 70,
    maxPlateauCount: 6,
    maxPlateauRun: 3,
    plateauPenalty: 2.8,
    pullbackDepth: 5,
  },
  daily: {
    structuralWeight: 0.22,
    dynamicWeight: 0.35,
    rhythmAmplitude: 6.3,
    maxStep: 9,
    softCeiling: 78,
    softFloor: 18,
    softener: 0.3,
    highThreshold: 84,
    maxHighCount: 9,
    maxHighRun: 4,
    overflowPenalty: 2.25,
    plateauThreshold: 66,
    maxPlateauCount: 14,
    maxPlateauRun: 6,
    plateauPenalty: 1.4,
    pullbackDepth: 3.2,
  },
} as const;

const DIMENSION_MULTIPLIER: Record<HepanDimension, number> = {
  wealth: 0.95,
  life: 0.7,
  emotion: 1.1,
};

const RELATION_PHASE: Record<HepanRelationType, number> = {
  couple: 0.35,
  business: 1.2,
  parent_child: 2.1,
  other: 2.8,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function softClamp(value: number, softFloor: number, softCeiling: number, softener: number) {
  if (value > softCeiling) {
    return softCeiling + (value - softCeiling) * softener;
  }

  if (value < softFloor) {
    return softFloor - (softFloor - value) * softener;
  }

  return value;
}

export function computeHepanStructuralAdjustment(
  adjustments: HepanAdjustmentBundleLike,
  period: HepanPeriod,
) {
  const config = PERIOD_CONFIG[period];
  const structuralBase =
    (adjustments.wu_xing_sheng_ke?.score ?? 0) +
    (adjustments.xing_sha_pei_he?.score ?? 0) +
    (adjustments.xingsu_relation?.score ?? 0);

  const limit = period === 'yearly' ? 18 : period === 'monthly' ? 10 : 8;
  return round1(clamp(structuralBase * config.structuralWeight, -limit, limit));
}

export function computeHepanDynamicAdjustment(
  adjustments: HepanAdjustmentBundleLike,
  period: HepanPeriod,
) {
  const config = PERIOD_CONFIG[period];
  const dynamicBase = adjustments.da_yun_tong_bu?.score ?? 0;
  const limit = period === 'yearly' ? 10 : period === 'monthly' ? 6 : 4;
  return round1(clamp(dynamicBase * config.dynamicWeight, -limit, limit));
}

export function computeTemporalRhythm(
  point: Pick<HepanSequenceInput, 'agePrimary' | 'ageSecondary' | 'month' | 'day' | 'year'>,
  period: HepanPeriod,
  dimension: HepanDimension,
  relationType: HepanRelationType,
) {
  const config = PERIOD_CONFIG[period];
  const phase = RELATION_PHASE[relationType];
  const amplitude = config.rhythmAmplitude * DIMENSION_MULTIPLIER[dimension];
  const ageAnchor = (point.agePrimary + point.ageSecondary) / 2;

  if (period === 'monthly') {
    const month = point.month ?? 1;
    const monthWave = Math.sin((((month - 1) / 12) * Math.PI * 2) + phase);
    const halfYearWave = Math.cos((((month - 1) / 6) * Math.PI * 2) - phase / 2);
    const ageWave = Math.sin((((ageAnchor % 10) / 10) * Math.PI * 2) + phase / 3);

    return round1((monthWave * 0.55 + halfYearWave * 0.25 + ageWave * 0.2) * amplitude);
  }

  if (period === 'daily') {
    const day = point.day ?? 1;
    const dayWave = Math.sin((((day - 1) / 30) * Math.PI * 2) + phase);
    const shortWave = Math.cos((((day - 1) / 10) * Math.PI * 2) + phase / 2);
    const driftWave = Math.sin(((((point.year + day) % 14) / 14) * Math.PI * 2) - phase);

    return round1((dayWave * 0.5 + shortWave * 0.3 + driftWave * 0.2) * amplitude);
  }

  const ageWave = Math.sin((((ageAnchor % 12) / 12) * Math.PI * 2) + phase);
  const yearWave = Math.cos((((point.year % 8) / 8) * Math.PI * 2) - phase / 2);
  return round1((ageWave * 0.65 + yearWave * 0.35) * amplitude);
}

function applyStepLimit(rawScores: number[], maxStep: number) {
  const smoothed = [...rawScores];

  for (let index = 1; index < smoothed.length; index += 1) {
    const prev = smoothed[index - 1] ?? smoothed[index] ?? 50;
    smoothed[index] = clamp(smoothed[index] ?? prev, prev - maxStep, prev + maxStep);
  }

  return smoothed;
}

function applyHighPlateauControls(scores: number[], period: HepanPeriod) {
  const config = PERIOD_CONFIG[period];
  const controlled = [...scores];
  let highRun = 0;

  for (let index = 0; index < controlled.length; index += 1) {
    const value = controlled[index] ?? 50;

    if (value >= config.highThreshold) {
      highRun += 1;

      if (highRun > config.maxHighRun) {
        controlled[index] = round1(
          Math.min(
            config.highThreshold - 1,
            value - (highRun - config.maxHighRun) * config.overflowPenalty,
          ),
        );
        highRun = 0;
      }
    } else {
      highRun = 0;
    }
  }

  const highIndexes = controlled
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value >= config.highThreshold)
    .sort((left, right) => right.value - left.value);

  highIndexes.slice(config.maxHighCount).forEach((entry, offset) => {
    controlled[entry.index] = round1(
      Math.min(
        config.highThreshold - 1,
        entry.value - (offset + 1) * (config.overflowPenalty / 1.5),
      ),
    );
  });

  return controlled;
}

function applyMidHighPlateauControls(scores: number[], period: HepanPeriod) {
  const config = PERIOD_CONFIG[period];
  const controlled = [...scores];
  let plateauRun = 0;

  for (let index = 0; index < controlled.length; index += 1) {
    const value = controlled[index] ?? 50;

    if (value >= config.plateauThreshold) {
      plateauRun += 1;

      if (plateauRun > config.maxPlateauRun) {
        controlled[index] = round1(value - (plateauRun - config.maxPlateauRun) * config.plateauPenalty);
      }
    } else {
      plateauRun = 0;
    }
  }

  const plateauIndexes = controlled
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value >= config.plateauThreshold)
    .sort((left, right) => right.value - left.value);

  plateauIndexes.slice(config.maxPlateauCount).forEach((entry, offset) => {
    controlled[entry.index] = round1(entry.value - (offset + 1) * config.plateauPenalty);
  });

  return controlled;
}

function computePlateauProfile(scores: number[], threshold: number) {
  let longestRun = 0;
  let currentRun = 0;
  let count = 0;

  scores.forEach((value) => {
    if (value >= threshold) {
      count += 1;
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  });

  return { count, longestRun };
}

function nudgePlateau(scores: number[], period: HepanPeriod) {
  if (scores.length < 6) {
    return scores;
  }

  const config = PERIOD_CONFIG[period];
  const profile = computePlateauProfile(scores, config.plateauThreshold);
  const excessivePlateau =
    profile.longestRun > config.maxPlateauRun || profile.count > config.maxPlateauCount;

  if (!excessivePlateau) {
    return scores;
  }

  const adjusted = [...scores];
  const startIndex = Math.max(2, Math.floor(adjusted.length * 0.45));

  for (let index = startIndex; index < adjusted.length; index += 1) {
    const value = adjusted[index] ?? 50;
    if (value >= config.plateauThreshold) {
      const phase = ((index - startIndex) / Math.max(1, adjusted.length - startIndex)) * Math.PI * 2;
      const drift = Math.sin(phase) * (config.pullbackDepth * 0.35);
      adjusted[index] = round1(value - config.pullbackDepth * 0.2 + drift);
    }
  }

  return adjusted;
}

function dampOpeningSpike(scores: number[], period: HepanPeriod) {
  if (scores.length < 2) {
    return scores;
  }

  const adjusted = [...scores];
  const openingLimit = period === 'yearly' ? 7 : period === 'monthly' ? 6 : 4;

  adjusted[1] = round1(
    clamp(
      adjusted[1] ?? adjusted[0] ?? 50,
      (adjusted[0] ?? 50) - openingLimit,
      (adjusted[0] ?? 50) + openingLimit,
    ),
  );

  if (scores.length >= 3) {
    adjusted[2] = round1(
      clamp(
        adjusted[2] ?? adjusted[1] ?? adjusted[0] ?? 50,
        (adjusted[1] ?? 50) - openingLimit,
        (adjusted[1] ?? 50) + openingLimit,
      ),
    );
  }

  return adjusted;
}

export function buildHepanScoreSequence(
  inputs: HepanSequenceInput[],
  period: HepanPeriod,
  dimension: HepanDimension,
  relationType: HepanRelationType,
) {
  const config = PERIOD_CONFIG[period];

  const enriched = inputs.map((input) => {
    const structuralAdjustment = computeHepanStructuralAdjustment(input.rawAdjustments, period);
    const dynamicAdjustment = computeHepanDynamicAdjustment(input.rawAdjustments, period);
    const temporalRhythm = computeTemporalRhythm(input, period, dimension, relationType);

    return {
      ...input,
      structuralAdjustment,
      dynamicAdjustment,
      temporalRhythm,
    };
  });

  const softened = enriched.map((entry) => softClamp(
    entry.baseScore + entry.structuralAdjustment + entry.dynamicAdjustment + entry.temporalRhythm,
    config.softFloor,
    config.softCeiling,
    config.softener,
  ));

  const stepLimited = applyStepLimit(softened, config.maxStep);
  const plateauControlled = applyMidHighPlateauControls(
    applyHighPlateauControls(stepLimited, period),
    period,
  );
  const rhythmControlled = nudgePlateau(plateauControlled, period);
  const openingControlled = dampOpeningSpike(rhythmControlled, period);

  return openingControlled.map((score, index) => {
    const entry = enriched[index];
    const normalizedScore = round1(clamp(score, 0, 100));

    return {
      score: normalizedScore,
      structuralAdjustment: entry?.structuralAdjustment ?? 0,
      dynamicAdjustment: entry?.dynamicAdjustment ?? 0,
      temporalRhythm: entry?.temporalRhythm ?? 0,
      appliedAdjustment: round1(normalizedScore - (entry?.baseScore ?? normalizedScore)),
    } satisfies HepanSequencePoint;
  });
}
