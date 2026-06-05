import type { BaZiResult } from '@/lib/domain/bazi';

export interface YearlyScaffoldRow {
  row_id: string;
  year: number;
  age: number;
}

export interface ChartLifespan {
  total_years: number;
  confidence: number;
  reasoning: string;
}

const MIN_CHART_LIFESPAN = 75;
const MAX_CHART_LIFESPAN = 89;
const DEFAULT_CHART_LIFESPAN = 82;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getElementCoverageScore(bazi: BaZiResult) {
  const presentElements = Object.values(bazi.wuXingCount).filter((count) => count > 0).length;

  if (presentElements >= 5) {
    return 1;
  }

  if (presentElements <= 3) {
    return -1;
  }

  return 0;
}

function getElementBalanceScore(bazi: BaZiResult) {
  const counts = Object.values(bazi.wuXingCount);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const spread = max - min;

  if (spread <= 2) {
    return 1;
  }

  if (spread >= 5) {
    return -1;
  }

  return 0;
}

function getWangShuaiScore(bazi: BaZiResult) {
  if (bazi.wangShuai === '中和') {
    return 2;
  }

  if (bazi.wangShuai === '身强') {
    return 1;
  }

  return 0;
}

export function calculateChartLifespan(bazi: BaZiResult, gender: 'male' | 'female'): ChartLifespan {
  const pillarKey = [
    bazi.formatted.nianZhu,
    bazi.formatted.yueZhu,
    bazi.formatted.riZhu,
    bazi.formatted.shiZhu,
    gender,
  ].join('|');
  const hashAdjustment = (stableHash(pillarKey) % 5) - 2;
  const score =
    DEFAULT_CHART_LIFESPAN +
    getWangShuaiScore(bazi) +
    getElementCoverageScore(bazi) +
    getElementBalanceScore(bazi) +
    hashAdjustment;
  const totalYears = clamp(score, MIN_CHART_LIFESPAN, MAX_CHART_LIFESPAN);

  return {
    total_years: totalYears,
    confidence: 0.72,
    reasoning: `本地图表寿元启发式：${bazi.wangShuai}${bazi.riZhuWuXing}，五行分布与四柱稳定因子综合定为${totalYears}年。`,
  };
}

export function buildYearlyScaffold(birthYear: number, totalYears: number): YearlyScaffoldRow[] {
  const safeTotalYears = clamp(Math.round(totalYears), MIN_CHART_LIFESPAN, MAX_CHART_LIFESPAN);

  return Array.from({ length: safeTotalYears }, (_, index) => {
    const age = index + 1;
    const year = birthYear + index;

    return {
      row_id: `Y${year}_A${age}`,
      year,
      age,
    };
  });
}
