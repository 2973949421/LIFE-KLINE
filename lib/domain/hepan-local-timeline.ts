import type { RelationType } from './hepan-score';

export type HepanDimension = 'wealth' | 'life' | 'emotion';
export type HepanPeriod = 'daily' | 'monthly' | 'yearly';

export interface HepanAiNarrativeEntry {
  year: number;
  month?: number;
  day?: number;
  analysis?: string;
  confidence?: number;
}

export interface HepanTimelineScaffoldEntry {
  year: number;
  month?: number;
  day?: number;
  age_primary: number;
  age_secondary: number;
}

const RELATION_DIMENSION_BASE: Record<RelationType, Record<HepanDimension, number>> = {
  couple: {
    wealth: 51,
    life: 53,
    emotion: 58,
  },
  business: {
    wealth: 58,
    life: 50,
    emotion: 46,
  },
  parent_child: {
    wealth: 48,
    life: 57,
    emotion: 54,
  },
  other: {
    wealth: 52,
    life: 52,
    emotion: 52,
  },
};

const RELATION_PHASE: Record<RelationType, number> = {
  couple: 0.45,
  business: 1.1,
  parent_child: 2.05,
  other: 2.7,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function getHepanTimelineKey(entry: Pick<HepanAiNarrativeEntry, 'year' | 'month' | 'day'>) {
  return `${entry.year}-${entry.month ?? 0}-${entry.day ?? 0}`;
}

export function buildHepanTimelineScaffold(options: {
  period: HepanPeriod;
  meetYear: number;
  analysisYears?: number;
  analysisYear?: number;
  analysisMonth?: number;
  primaryBirthYear: number;
  secondaryBirthYear: number;
}) {
  const {
    period,
    meetYear,
    analysisYears = 50,
    analysisYear,
    analysisMonth = 1,
    primaryBirthYear,
    secondaryBirthYear,
  } = options;

  const entries: HepanTimelineScaffoldEntry[] = [];

  if (period === 'yearly') {
    for (let offset = 0; offset < analysisYears; offset += 1) {
      const year = meetYear + offset;
      entries.push({
        year,
        age_primary: year - primaryBirthYear,
        age_secondary: year - secondaryBirthYear,
      });
    }

    return entries;
  }

  if (period === 'monthly') {
    const targetYear = analysisYear ?? new Date().getFullYear();

    for (let month = 1; month <= 12; month += 1) {
      entries.push({
        year: targetYear,
        month,
        age_primary: targetYear - primaryBirthYear,
        age_secondary: targetYear - secondaryBirthYear,
      });
    }

    return entries;
  }

  const targetYear = analysisYear ?? new Date().getFullYear();
  for (let day = 1; day <= 30; day += 1) {
    entries.push({
      year: targetYear,
      month: analysisMonth,
      day,
      age_primary: targetYear - primaryBirthYear,
      age_secondary: targetYear - secondaryBirthYear,
    });
  }

  return entries;
}

export function buildHepanAiNarrativeLookup(entries: HepanAiNarrativeEntry[]) {
  const lookup = new Map<string, HepanAiNarrativeEntry>();

  entries.forEach((entry) => {
    lookup.set(getHepanTimelineKey(entry), entry);
  });

  return lookup;
}

export function computeLocalHepanBaseScore(
  entry: HepanTimelineScaffoldEntry,
  context: {
    period: HepanPeriod;
    dimension: HepanDimension;
    relationType: RelationType;
    meetYear: number;
  },
) {
  const { period, dimension, relationType, meetYear } = context;
  const base = RELATION_DIMENSION_BASE[relationType][dimension];
  const phase = RELATION_PHASE[relationType];
  const ageAnchor = (entry.age_primary + entry.age_secondary) / 2;
  const yearsSinceMeet =
    entry.year -
    meetYear +
    ((entry.month ?? 6) - 6) / 12 +
    ((entry.day ?? 15) - 15) / 365;

  const relationWave = Math.sin((yearsSinceMeet / 3.6) + phase) * 6.5;
  const longWave = Math.cos((yearsSinceMeet / 7.8) - phase / 2) * 4.2;
  const ageWave = Math.sin(((ageAnchor % 18) / 18) * Math.PI * 2 + phase / 3) * 2.3;

  let shortWave = 0;
  if (period === 'monthly') {
    const month = entry.month ?? 1;
    shortWave =
      Math.sin((((month - 1) / 12) * Math.PI * 2) + phase) * 3.8 +
      Math.cos((((month - 1) / 6) * Math.PI * 2) - phase) * 1.6;
  } else if (period === 'daily') {
    const day = entry.day ?? 1;
    shortWave =
      Math.sin((((day - 1) / 30) * Math.PI * 2) + phase) * 3.2 +
      Math.cos((((day - 1) / 9) * Math.PI * 2) - phase / 2) * 1.4;
  }

  const score = base + relationWave + longWave + ageWave + shortWave;
  const floor = period === 'daily' ? 28 : 22;
  const ceiling = period === 'daily' ? 80 : 84;

  return round1(clamp(score, floor, ceiling));
}

export function buildFallbackHepanAnalysis(
  entry: HepanTimelineScaffoldEntry,
  score: number,
  dimension: HepanDimension,
) {
  const dimensionLabel =
    dimension === 'wealth' ? '财富节奏' : dimension === 'life' ? '生活状态' : '情感互动';

  const tone =
    score >= 70
      ? '保持协同上扬'
      : score >= 58
        ? '维持温和推进'
        : score >= 45
          ? '存在磨合与起伏'
          : '需要更多耐心调整';

  const timeLabel =
    entry.day !== undefined
      ? `${entry.month ?? 1}月${entry.day}日`
      : entry.month !== undefined
        ? `${entry.month}月`
        : `${entry.year}年`;

  return `${timeLabel}${dimensionLabel}${tone}`;
}
