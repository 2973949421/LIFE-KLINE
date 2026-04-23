export type KlineMode = 'single' | 'hepan';
export type Dimension = 'wealth' | 'life' | 'emotion';
export type Period = 'daily' | 'monthly' | 'yearly';
export type RelationType = 'couple' | 'business' | 'parent_child' | 'other';

export interface TimelineEntry {
  year: number;
  month?: number;
  day?: number;
  age?: number;
  o: number;
  h: number;
  l: number;
  c: number;
  summary: string;
}

export interface BaziData {
  nianZhu: string;
  yueZhu: string;
  riZhu: string;
  shiZhu: string;
  riZhuWuXing: string;
  riZhuYinYang: string;
  wangShuai: string;
  wuXingCount: Record<string, number>;
  shiShen: {
    nian: { gan: string; zhi: string[] };
    yue: { gan: string; zhi: string[] };
    ri: { gan: string; zhi: string[] };
    shi: { gan: string; zhi: string[] };
  };
  daYun: Array<{
    age: number;
    gan: string;
    zhi: string;
    startYear: number;
    endYear: number;
  }>;
  qiYunAge: number;
}

export interface TechnicalIndicators {
  ma5: (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
  macd: Array<{ dif: number; dea: number; macd: number }>;
  rsi: (number | null)[];
  kdj: Array<{ k: number | null; d: number | null; j: number | null }>;
  boll: Array<{ upper: number | null; middle: number | null; lower: number | null }>;
  volatility?: (number | null)[];
}

export interface CrossSignals {
  macd_golden: Array<{ index: number; year: number }>;
  macd_death: Array<{ index: number; year: number }>;
  kdj_golden: Array<{ index: number; year: number }>;
  kdj_death: Array<{ index: number; year: number }>;
  rsi_overbought: Array<{ index: number; year: number }>;
  rsi_oversold: Array<{ index: number; year: number }>;
}

export interface TrendAnalysis {
  current_trend: 'uptrend' | 'downtrend' | 'sideways';
  ma_trend: 'bullish' | 'bearish' | 'neutral';
}

export interface GlobalAnalysis {
  dimension_analysis: string;
  pattern_match: {
    primary_pattern: string;
    confidence: number;
  };
  key_insights: string;
}

export interface TechnicalCommentary {
  ma_trend?: string;
  macd_signal?: string;
  kdj_signal?: string;
  rsi_signal?: string;
  boll_signal?: string;
}

export interface SingleMeta {
  birthYear?: number;
  birthTime?: string;
  birthHour?: string;
  hourAttribute?: string;
  gender: string;
  mainAttribute?: string;
  patternType?: string;
  patternName?: string;
}

export interface FullAnalysisResult {
  dimension: Dimension;
  period: Period;
  lifespan?: {
    total_years: number;
    confidence: number;
    reasoning: string;
  };
  bazi?: BaziData;
  meta: SingleMeta;
  timeline: TimelineEntry[];
  technical_indicators: TechnicalIndicators;
  cross_signals: CrossSignals;
  trend_analysis: TrendAnalysis;
  global_analysis?: GlobalAnalysis;
  technical_commentary?: TechnicalCommentary;
}

export interface PersonInput {
  birth: string;
  birthTime: string;
  gender: 'male' | 'female';
  name: string;
}

export interface HepanAdjustment {
  score: number;
  reason: string;
  details?: string[];
}

export interface HepanResult {
  relation_type: RelationType;
  primary: {
    name: string;
    bazi: BaziData;
    meta: {
      birthYear: number;
      birthTime?: string;
      birthHour?: string;
      hourAttribute?: string;
      gender: string;
    };
  };
  secondary: {
    name: string;
    bazi: BaziData;
    meta: {
      birthYear: number;
      birthTime?: string;
      birthHour?: string;
      hourAttribute?: string;
      gender: string;
    };
  };
  hepan_meta: {
    meet_year: number;
    meet_year_adjusted: number;
    common_lifespan: number;
    relation_type: RelationType;
    relation_label: string;
  };
  meet_year_analysis?: {
    user_input: number;
    ai_suggested_range: number[];
    best_guess: number;
    reasoning: string;
    confidence: number;
  };
  hepan_adjustments_detail?: {
    wu_xing_sheng_ke?: HepanAdjustment;
    xing_sha_pei_he?: HepanAdjustment;
    da_yun_tong_bu?: HepanAdjustment;
    xingsu_relation?: HepanAdjustment;
    total_adjustment: number;
  };
  dimension: Dimension;
  period: Period;
  timeline: Array<{
    year: number;
    month?: number;
    day?: number;
    age_primary?: number;
    age_secondary?: number;
    analysis: string;
    score: number;
    o: number;
    h: number;
    l: number;
    c: number;
    hepan_adjustment?: number;
    summary: string;
  }>;
  technical_indicators: TechnicalIndicators;
  cross_signals: CrossSignals;
  global_analysis: GlobalAnalysis;
  technical_commentary: TechnicalCommentary;
}

export interface InstantBaziResult {
  primary: {
    name: string;
    bazi: BaziData;
    meta: {
      birthYear: number;
      birthTime?: string;
      birthHour?: string;
      hourAttribute?: string;
      gender: string;
    };
  };
  secondary: {
    name: string;
    bazi: BaziData;
    meta: {
      birthYear: number;
      birthTime?: string;
      birthHour?: string;
      hourAttribute?: string;
      gender: string;
    };
  };
  hepan_preview: {
    relationType: RelationType;
    relationLabel: string;
    meetYear: number | null;
    wuXingShengKe: { score: number; reason: string };
    xingShaPeiHe: { score: number; reason: string };
    xingsu?: {
      benming: {
        primary: string;
        secondary: string;
        relation: {
          type: string;
          typeName: string;
          distance: string;
          distanceName: string;
          role?: string;
          description: string;
        };
      };
      zhir: {
        primary: string;
        secondary: string;
        relation: {
          type: string;
          typeName: string;
          distance: string;
          distanceName: string;
          role?: string;
          description: string;
        };
      };
      adjustment: { score: number; reason: string };
    };
  };
}
