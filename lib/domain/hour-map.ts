/**
 * 时辰映射工具
 *
 * 用于将小时数映射到中国十二时辰及其五行属性
 */

export interface HourInfo {
  hour: string;
  attribute: string;
}

/**
 * 时辰映射表
 * 键：小时数（0-23）
 * 值：时辰名称和五行属性
 */
export const HOUR_MAP: Record<number, HourInfo> = {
  23: { hour: '子时', attribute: '子水' },
  0: { hour: '子时', attribute: '子水' },
  1: { hour: '丑时', attribute: '丑土' },
  2: { hour: '丑时', attribute: '丑土' },
  3: { hour: '寅时', attribute: '寅木' },
  4: { hour: '寅时', attribute: '寅木' },
  5: { hour: '卯时', attribute: '卯木' },
  6: { hour: '卯时', attribute: '卯木' },
  7: { hour: '辰时', attribute: '辰土' },
  8: { hour: '辰时', attribute: '辰土' },
  9: { hour: '巳时', attribute: '巳火' },
  10: { hour: '巳时', attribute: '巳火' },
  11: { hour: '午时', attribute: '午火' },
  12: { hour: '午时', attribute: '午火' },
  13: { hour: '未时', attribute: '未土' },
  14: { hour: '未时', attribute: '未土' },
  15: { hour: '申时', attribute: '申金' },
  16: { hour: '申时', attribute: '申金' },
  17: { hour: '酉时', attribute: '酉金' },
  18: { hour: '酉时', attribute: '酉金' },
  19: { hour: '戌时', attribute: '戌土' },
  20: { hour: '戌时', attribute: '戌土' },
  21: { hour: '亥时', attribute: '亥水' },
  22: { hour: '亥时', attribute: '亥水' }
};

/**
 * 获取时辰信息
 */
export function getHourInfo(hour: number): HourInfo {
  return HOUR_MAP[hour] || { hour: '子时', attribute: '子水' };
}