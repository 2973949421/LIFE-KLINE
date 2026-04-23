/**
 * K线维度常量
 *
 * 用于技术指标评价的维度相关映射
 */

export type DimensionType = 'wealth' | 'life' | 'emotion';
export type PeriodType = 'daily' | 'monthly' | 'yearly';
export type RelationType = 'couple' | 'business' | 'parent_child' | 'other';

/**
 * 关系类型标签
 */
export const RELATION_LABELS: Record<RelationType, string> = {
  couple: '情侣/夫妻',
  business: '商业伙伴',
  parent_child: '亲子',
  other: '其他'
};

/**
 * 维度名称
 */
export const DIMENSION_NAMES: Record<DimensionType, string> = {
  wealth: '财富运势',
  life: '生命健康',
  emotion: '情感婚姻'
};

/**
 * 周期名称
 */
export const PERIOD_NAMES: Record<PeriodType, string> = {
  daily: '日K（30天）',
  monthly: '月K（12个月）',
  yearly: '年K（AI推算）'
};

/**
 * 维度词汇映射（用于技术指标评价）
 */
export const DIMENSION_VOCAB: Record<DimensionType, {
  uptrend: string;
  downtrend: string;
  golden_cross: string;
  death_cross: string;
  overbought: string;
  oversold: string;
  strong: string;
  weak: string;
}> = {
  wealth: {
    uptrend: '财运看涨',
    downtrend: '财运走弱',
    golden_cross: '财运机会来临',
    death_cross: '财运受阻',
    overbought: '财运过热',
    oversold: '财运低谷',
    strong: '财运旺盛',
    weak: '财运疲软'
  },
  life: {
    uptrend: '健康向好',
    downtrend: '健康下滑',
    golden_cross: '健康回升信号',
    death_cross: '健康需关注',
    overbought: '精力透支',
    oversold: '状态低谷',
    strong: '精力充沛',
    weak: '状态欠佳'
  },
  emotion: {
    uptrend: '感情升温',
    downtrend: '感情降温',
    golden_cross: '桃花来临',
    death_cross: '感情受挫',
    overbought: '感情过热',
    oversold: '感情低谷',
    strong: '感情稳定',
    weak: '感情波动'
  }
};

/**
 * 维度操作建议映射
 */
export const DIMENSION_SUGGESTIONS: Record<DimensionType, {
  uptrend: string;
  downtrend: string;
  golden_cross: string;
  death_cross: string;
  overbought: string;
  oversold: string;
  strong: string;
  weak: string;
  sideways: string;
}> = {
  wealth: {
    uptrend: '顺势而为，把握机遇',
    downtrend: '稳健为主，减少风险',
    golden_cross: '积极布局，适当投资',
    death_cross: '收缩战线，规避风险',
    overbought: '见好就收，落袋为安',
    oversold: '耐心等待，伺机而动',
    strong: '乘势而上，扩大收益',
    weak: '养精蓄锐，积蓄力量',
    sideways: '观望为主，静待时机'
  },
  life: {
    uptrend: '保持节奏，稳步前进',
    downtrend: '注意休息，调整状态',
    golden_cross: '适合启动新计划',
    death_cross: '暂停冒险，安稳为主',
    overbought: '适当放松，避免透支',
    oversold: '加强锻炼，调整作息',
    strong: '保持良好习惯',
    weak: '关注身体，预防为主',
    sideways: '维持现状，平和心态'
  },
  emotion: {
    uptrend: '主动出击，表达心意',
    downtrend: '给彼此空间，冷静思考',
    golden_cross: '适合告白或表白',
    death_cross: '避免冲突，多沟通',
    overbought: '保持理性，冷静处理',
    oversold: '静待转机，提升自我',
    strong: '珍惜当下，用心经营',
    weak: '坦诚沟通，化解矛盾',
    sideways: '顺其自然，不强求'
  }
};

/**
 * 规范化农历月份
 * lunar-javascript 用负值表示闰月（如-2表示闰二月）或年初属于上一农历年
 * 闰月按正常月处理（闰二月 = 二月）
 */
export function normalizeLunarMonth(month: number): number {
  const absMonth = Math.abs(month);
  if (absMonth >= 1 && absMonth <= 12) return absMonth;
  return ((absMonth % 12) + 12) % 12 || 12;
}

/**
 * 根据系统时间定位当前索引
 */
export function findCurrentIndex(
  timeline: Array<{ year: number; month?: number; day?: number }>,
  period: PeriodType
): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  for (let i = timeline.length - 1; i >= 0; i--) {
    const item = timeline[i];
    if (period === 'yearly') {
      if (item.year <= currentYear) return i;
    } else if (period === 'monthly') {
      if (item.year < currentYear || (item.year === currentYear && item.month! <= currentMonth)) {
        return i;
      }
    } else if (period === 'daily') {
      if (item.year < currentYear ||
          (item.year === currentYear && item.month! < currentMonth) ||
          (item.year === currentYear && item.month === currentMonth && item.day! <= currentDay)) {
        return i;
      }
    }
  }
  return timeline.length - 1;
}