import type { BaZiResult } from '@/lib/domain/bazi';
import type { AnnualTaggedContextRow, AnnualTag } from '@/lib/domain/life-kline/annual-tags';
import type { ChartLifespan } from '@/lib/domain/life-kline/yearly-scaffold';
import type { LifeKlineRequestInput } from '@/lib/server/life-kline/service';
import type { DsScoreRow } from '@/lib/server/life-kline/validate-ds-score';

export interface DsCompactProfile {
  birth: string;
  birthTime?: string;
  gender: 'male' | 'female';
  dimension: string;
  period: 'year';
  chart_lifespan_years: number;
  bazi: {
    nianZhu: string;
    yueZhu: string;
    riZhu: string;
    shiZhu: string;
    riZhuWuXing: string;
    riZhuYinYang: string;
    wangShuai: string;
    qiYunAge: number;
    wuXingCount: Record<string, number>;
  };
}

export interface DsCompactRow {
  row_id: string;
  year: number;
  age: number;
  liu_nian: string;
  da_yun?: string;
  tags: AnnualTag[];
}

export const DS_TAG_LEGEND: Record<AnnualTag, string> = {
  DA_YUN_CHANGE: '大运切换或进入新阶段，重点关注趋势节奏变化。',
  WEALTH_RELATED: '与财星/资源议题相关，财富维度和现实资源更突出。',
  LIFE_PRESSURE_RELATED: '与压力、约束、健康节奏或风险管理相关。',
  EMOTION_RELATED: '与情感互动、亲密关系经营相关。',
  SPOUSE_PALACE_RELATED: '与伴侣星、夫妻宫或关系事件相关。',
};

export function buildDsCompactProfile(
  input: LifeKlineRequestInput,
  bazi: BaZiResult,
  chartLifespan: ChartLifespan,
): DsCompactProfile {
  return {
    birth: input.birth,
    birthTime: input.birthTime,
    gender: input.gender,
    dimension: input.dimension,
    period: 'year',
    chart_lifespan_years: chartLifespan.total_years,
    bazi: {
      nianZhu: bazi.formatted.nianZhu,
      yueZhu: bazi.formatted.yueZhu,
      riZhu: bazi.formatted.riZhu,
      shiZhu: bazi.formatted.shiZhu,
      riZhuWuXing: bazi.riZhuWuXing,
      riZhuYinYang: bazi.riZhuYinYang,
      wangShuai: bazi.wangShuai,
      qiYunAge: bazi.qiYunAge,
      wuXingCount: bazi.wuXingCount,
    },
  };
}

export function buildDsCompactRows(rows: AnnualTaggedContextRow[]): DsCompactRow[] {
  return rows.map((row) => ({
    row_id: row.row_id,
    year: row.year,
    age: row.age,
    liu_nian: row.liu_nian,
    da_yun: row.da_yun,
    tags: row.tags,
  }));
}

export function buildDsTimelineSummary(rows: Array<AnnualTaggedContextRow & DsScoreRow>) {
  return rows.map((row) => ({
    row_id: row.row_id,
    year: row.year,
    age: row.age,
    liu_nian: row.liu_nian,
    da_yun: row.da_yun,
    tags: row.tags,
    score: row.score,
    analysis: row.analysis,
  }));
}
