/**
 * Score 转 OHLC 映射函数
 *
 * 功能：
 * 1. 将LLM输出的score（0-100）映射为OHLC数值
 * 2. 确定性计算，同score同结果
 * 3. 支持三个维度、三个周期的差异化处理
 */

// ==================== 类型定义 ====================

export type Dimension = 'wealth' | 'life' | 'emotion';
export type Period = 'daily' | 'monthly' | 'yearly';

export interface OHLC {
  o: number;  // Open
  h: number;  // High
  l: number;  // Low
  c: number;  // Close
}

export interface OhlcOptions {
  profile?: 'default' | 'hepan';
}

// ==================== 核心映射函数 ====================

/**
 * 将score转换为OHLC
 *
 * @param score LLM输出的评分（0-100）
 * @param prevClose 前一条K线的收盘价
 * @param dimension 维度（wealth/life/emotion）
 * @param period 周期（daily/monthly/yearly）
 * @param index 当前K线索引（用于确定性随机）
 */
export function scoreToOHLC(
  score: number,
  prevClose: number,
  dimension: Dimension,
  period: Period,
  index: number,
  options: OhlcOptions = {}
): OHLC {
  // 确定性随机数生成器（基于索引）
  const seed = index * 1000 + score;
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  const random3 = seededRandom(seed + 2);

  // 根据周期调整波动幅度
  const volatilityFactor = getVolatilityFactor(period);

  // 根据维度调整波动特性
  const dimensionAdjust = getDimensionAdjust(dimension);

  // 边界缓冲区：避免在95-100区域形成一字板
  const bufferZone = 8;  // 边界区域大小
  const minPrice = 3;
  const maxPrice = 100 - bufferZone;  // 92，为高分区域留出波动空间

  // Open：基于前一条Close，小幅波动
  const openNoise = (random1 - 0.5) * 6 * volatilityFactor;
  const open = clamp(prevClose + openNoise, minPrice, maxPrice);

  // Close：基于score，但避免触及上限形成一字板
  // 如果score接近100，允许有波动但不超过实际限制
  let close: number;
  if (score >= 90) {
    // 高分区域：允许波动到95-99，但保持合理波动
    close = clamp(score, minPrice, 99);
    // 确保有最小波动
    if (Math.abs(close - open) < 3) {
      close = clamp(open + (random1 > 0.5 ? 3 : -3) + random1 * 4, minPrice, 99);
    }
  } else if (score <= 10) {
    // 低分区域：同样处理
    close = clamp(score, minPrice, maxPrice);
    if (Math.abs(close - open) < 3) {
      close = clamp(open + (random1 > 0.5 ? 3 : -3) + random1 * 4, minPrice, maxPrice);
    }
  } else {
    close = clamp(score, minPrice, maxPrice);
  }

  // 计算基础波动
  const baseVolatility = Math.abs(close - open) + 5;
  const adjustedVolatility = baseVolatility * volatilityFactor * dimensionAdjust;

  // High：最高价（确保不超过100）
  const upperWick = adjustedVolatility * (0.3 + random2 * 0.4);
  const high = clamp(Math.max(open, close) + upperWick, 10, 100);

  // Low：最低价（确保不小于0）
  const lowerWick = adjustedVolatility * (0.3 + random3 * 0.4);
  const low = clamp(Math.min(open, close) - lowerWick, 0, 90);

  // 确保实体大小 >= 3（避免一字板）
  let finalOpen = open;
  let finalClose = close;
  const minBodySize = 3;
  if (Math.abs(finalClose - finalOpen) < minBodySize) {
    const direction = finalClose >= finalOpen ? 1 : -1;
    // 根据当前价格水平决定扩展方向
    if (finalClose >= 90) {
      // 高分区域向下扩展开盘价
      finalOpen = clamp(finalClose - minBodySize - random1 * 3, minPrice, maxPrice);
    } else if (finalClose <= 15) {
      // 低分区域向上扩展开盘价
      finalOpen = clamp(finalClose + minBodySize + random1 * 3, minPrice, maxPrice);
    } else {
      finalClose = clamp(finalOpen + direction * (minBodySize + random1 * 3), minPrice, 99);
    }
  }

  // 确保影线比例 <= 实体2倍
  const bodySize = Math.abs(finalClose - finalOpen);
  const maxWick = Math.max(bodySize * 2, 5);  // 至少5的影线

  let finalHigh = high;
  let finalLow = low;

  const upperWickSize = finalHigh - Math.max(finalOpen, finalClose);
  const lowerWickSize = Math.min(finalOpen, finalClose) - finalLow;

  if (upperWickSize > maxWick) {
    finalHigh = Math.max(finalOpen, finalClose) + maxWick;
  }
  if (lowerWickSize > maxWick) {
    finalLow = Math.min(finalOpen, finalClose) - maxWick;
  }

  return {
    o: Math.round(finalOpen),
    h: Math.round(finalHigh),
    l: Math.round(finalLow),
    c: Math.round(finalClose)
  };
}

// ==================== 辅助函数 ====================

/**
 * 确定性随机数生成器
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 数值限制在范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 根据周期获取波动因子
 */
function getVolatilityFactor(period: Period): number {
  switch (period) {
    case 'daily':
      return 0.8;   // 日K波动较小
    case 'monthly':
      return 1.0;   // 月K中等波动
    case 'yearly':
      return 1.3;   // 年K波动较大
    default:
      return 1.0;
  }
}

/**
 * 根据维度获取调整因子
 */
function getDimensionAdjust(dimension: Dimension): number {
  switch (dimension) {
    case 'wealth':
      return 1.1;   // 财富波动较大
    case 'life':
      return 0.8;   // 生命相对稳定
    case 'emotion':
      return 1.3;   // 情感波动最大
    default:
      return 1.0;
  }
}

// ==================== 批量转换函数 ====================

/**
 * 批量将score数组转换为OHLC数组
 */
export function scoresToOHLCList(
  scores: number[],
  dimension: Dimension,
  period: Period,
  initialClose: number = 50
): OHLC[] {
  const result: OHLC[] = [];
  let prevClose = initialClose;

  scores.forEach((score, index) => {
    const ohlc = scoreToOHLC(score, prevClose, dimension, period, index);
    result.push(ohlc);
    prevClose = ohlc.c;
  });

  return result;
}

// ==================== 评分标准参考表 ====================

export const SCORE_STANDARDS = {
  wealth: {
    labels: {
      '90-100': '大富/暴富',
      '70-89': '财运亨通',
      '55-69': '财运上升',
      '45-54': '平稳',
      '30-44': '破财/下滑',
      '10-29': '大破财',
      '0-9': '破产'
    },
    description: '根据八字财星配置评分'
  },
  life: {
    labels: {
      '90-100': '极佳/逢凶化吉',
      '70-89': '健康/精力充沛',
      '55-69': '状态回升',
      '45-54': '无大病',
      '30-44': '小恙/下滑',
      '10-29': '大病风险',
      '0-9': '生命危险'
    },
    description: '根据日主根基与冲克评分'
  },
  emotion: {
    labels: {
      '90-100': '结婚/正缘天定',
      '70-89': '良缘/桃花旺',
      '55-69': '感情升温',
      '45-54': '感情平淡',
      '30-44': '感情受挫',
      '10-29': '分手/桃花劫',
      '0-9': '离婚/丧偶'
    },
    description: '根据财官星与夫妻宫评分'
  }
};

/**
 * 获取score对应的标签
 */
export function getScoreLabel(score: number, dimension: Dimension): string {
  const standards = SCORE_STANDARDS[dimension];

  if (score >= 90) return standards.labels['90-100'];
  if (score >= 70) return standards.labels['70-89'];
  if (score >= 55) return standards.labels['55-69'];
  if (score >= 45) return standards.labels['45-54'];
  if (score >= 30) return standards.labels['30-44'];
  if (score >= 10) return standards.labels['10-29'];
  return standards.labels['0-9'];
}
