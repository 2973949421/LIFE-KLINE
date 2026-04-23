/**
 * 合盘评分计算库
 *
 * 功能：
 * 1. 计算辅盘对主盘的五行生克影响
 * 2. 计算星煞配合影响
 * 3. 计算大运同步影响
 * 4. 计算二十七星宿关系影响
 * 5. 综合调整主盘评分
 */

import type { BaZiResult } from './bazi';
import {
  calcBenMingXingSu,
  calcXingSuRelation,
  type XingSu,
  type XingSuRelation
} from './xingsu';

// ==================== 类型定义 ====================

export type RelationType = 'couple' | 'business' | 'parent_child' | 'other';
export type Dimension = 'wealth' | 'life' | 'emotion';

export interface HepanAdjustment {
  score: number;
  reason: string;
  details?: string[];  // 详细加分/减分明细
}

export interface HepanAdjustments {
  wu_xing_sheng_ke: HepanAdjustment;
  xing_sha_pei_he: HepanAdjustment;
  da_yun_tong_bu: HepanAdjustment;
  xingsu_relation?: HepanAdjustment;  // 新增：星宿关系调整
  total_adjustment: number;
}

export interface HepanMeta {
  meet_year: number;           // 用户输入的相识年份
  meet_year_adjusted: number;  // AI校准后的相识年份
  common_lifespan: number;     // 共同寿元
  relation_type: RelationType;
}

export interface XingSuRelationResult {
  primary: XingSu;
  secondary: XingSu;
  relation: XingSuRelation;
  adjustment: HepanAdjustment;
}

// ==================== 五行生克计算 ====================

// 五行相生相克关系
const WU_XING_ORDER = ['木', '火', '土', '金', '水'];

/**
 * 获取五行生克关系
 * @returns 'sheng' (生我) | 'ke' (克我) | 'tong' (同我) | 'wo_sheng' (我生) | 'wo_ke' (我克)
 */
function getWuXingRelation(
  mainWuXing: string,  // 主盘日主五行
  auxWuXing: string    // 辅盘五行
): 'sheng' | 'ke' | 'tong' | 'wo_sheng' | 'wo_ke' {
  if (mainWuXing === auxWuXing) return 'tong';

  const mainIdx = WU_XING_ORDER.indexOf(mainWuXing);
  const auxIdx = WU_XING_ORDER.indexOf(auxWuXing);

  if (mainIdx === -1 || auxIdx === -1) return 'tong';

  // 辅盘五行生主盘日主（生我）
  if ((auxIdx + 1) % 5 === mainIdx) return 'sheng';
  // 辅盘五行克主盘日主（克我）
  if ((auxIdx + 2) % 5 === mainIdx) return 'ke';
  // 主盘日主生辅盘五行（我生）
  if ((mainIdx + 1) % 5 === auxIdx) return 'wo_sheng';
  // 主盘日主克辅盘五行（我克）
  if ((mainIdx + 2) % 5 === auxIdx) return 'wo_ke';

  return 'tong';
}

/**
 * 计算五行生克影响
 */
export function calcWuXingShengKe(
  mainBazi: BaZiResult,
  auxBazi: BaZiResult
): HepanAdjustment {
  const mainWuXing = mainBazi.riZhuWuXing;

  // 辅盘五行统计（加权）
  const auxWuXingCount: Record<string, number> = {
    '木': 0, '火': 0, '土': 0, '金': 0, '水': 0
  };

  // 天干五行（权重1.0）
  [auxBazi.nianZhu.gan, auxBazi.yueZhu.gan, auxBazi.riZhu.gan, auxBazi.shiZhu.gan].forEach(gan => {
    const wx = getTianGanWuXing(gan);
    if (wx) auxWuXingCount[wx] += 1.0;
  });

  // 地支五行（权重0.6）
  [auxBazi.nianZhu.zhi, auxBazi.yueZhu.zhi, auxBazi.riZhu.zhi, auxBazi.shiZhu.zhi].forEach(zhi => {
    const wx = getDiZhiWuXing(zhi);
    if (wx) auxWuXingCount[wx] += 0.6;
  });

  // 计算各五行的影响
  let totalScore = 0;
  const details: string[] = [];

  for (const [wx, count] of Object.entries(auxWuXingCount)) {
    if (count <= 0) continue;

    const relation = getWuXingRelation(mainWuXing, wx);
    let impact = 0;

    switch (relation) {
      case 'sheng':  // 辅盘五行生主盘日主
        impact = count * 3;
        details.push(`辅盘${wx}生主盘${mainWuXing} +${impact.toFixed(2)}`);
        break;
      case 'ke':     // 辅盘五行克主盘日主
        impact = -count * 3;
        details.push(`辅盘${wx}克主盘${mainWuXing} ${impact.toFixed(2)}`);
        break;
      case 'tong':   // 同五行
        impact = count * 1.5;
        details.push(`辅盘${wx}同主盘${mainWuXing} +${impact.toFixed(2)}`);
        break;
      case 'wo_sheng': // 主盘生辅盘
        impact = count * 0.5;
        details.push(`主盘${mainWuXing}生辅盘${wx} +${impact.toFixed(2)}`);
        break;
      case 'wo_ke':   // 主盘克辅盘
        impact = -count * 1;
        details.push(`主盘${mainWuXing}克辅盘${wx} ${impact.toFixed(2)}`);
        break;
    }

    totalScore += impact;
  }

  // 限制在 -15 ~ +15 范围内
  const clampedScore = Math.max(-15, Math.min(15, totalScore));

  let reason = '五行生克平衡';
  if (clampedScore > 5) {
    reason = `辅盘五行生助主盘，综合加分`;
  } else if (clampedScore < -5) {
    reason = `辅盘五行克制主盘，综合减分`;
  }

  return { score: Math.round(clampedScore * 100) / 100, reason, details };
}

// ==================== 星煞配合计算 ====================

// 地支六合
const DI_ZHI_LIU_HE: Record<string, string> = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午'
};

// 地支六冲
const DI_ZHI_LIU_CHONG: Record<string, string> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳'
};

// 地支三合
const DI_ZHI_SAN_HE: Record<string, string[]> = {
  '申子辰': ['申', '子', '辰'],  // 水局
  '亥卯未': ['亥', '卯', '未'],  // 木局
  '寅午戌': ['寅', '午', '戌'],  // 火局
  '巳酉丑': ['巳', '酉', '丑']   // 金局
};

/**
 * 计算星煞配合影响
 */
export function calcXingShaPeiHe(
  mainBazi: BaZiResult,
  auxBazi: BaZiResult,
  relationType: RelationType,
  dimension: Dimension
): HepanAdjustment {
  void dimension;
  let score = 0;
  const details: string[] = [];

  const mainRiZhi = mainBazi.riZhu.zhi;
  const auxRiZhi = auxBazi.riZhu.zhi;

  // ========== 夫妻宫关系 ==========
  // 六合
  if (DI_ZHI_LIU_HE[mainRiZhi] === auxRiZhi) {
    score += 8;
    details.push(`夫妻宫六合（${mainRiZhi}${auxRiZhi}相合）+8.00`);
  }
  // 六冲
  if (DI_ZHI_LIU_CHONG[mainRiZhi] === auxRiZhi) {
    score -= 10;
    details.push(`夫妻宫六冲（${mainRiZhi}${auxRiZhi}相冲）-10.00`);
  }
  // 三合
  for (const [, zhiList] of Object.entries(DI_ZHI_SAN_HE)) {
    if (zhiList.includes(mainRiZhi) && zhiList.includes(auxRiZhi)) {
      score += 6;
      details.push(`夫妻宫三合 +6.00`);
      break;
    }
  }

  // ========== 根据关系类型调整 ==========
  if (relationType === 'couple') {
    // 情侣/夫妻：重点看财官星
    const auxShiShen = auxBazi.shiShen;

    // 辅盘财星/官星分析
    const auxGanShiShen = [
      auxShiShen.nian.gan,
      auxShiShen.yue.gan,
      auxShiShen.shi.gan
    ];

    // 男命看财星，女命看官星（简化判断，实际需要更精确）
    if (auxGanShiShen.some(s => s === '正财' || s === '偏财')) {
      score += 5;
      details.push(`辅盘财星显透 +5.00`);
    }
    if (auxGanShiShen.some(s => s === '正官' || s === '七杀')) {
      score += 4;
      details.push(`辅盘官星显透 +4.00`);
    }
  } else if (relationType === 'business') {
    // 商业伙伴：重点看财星、食伤
    const auxShiShen = auxBazi.shiShen;
    const auxGanShiShen = [
      auxShiShen.nian.gan,
      auxShiShen.yue.gan,
      auxShiShen.shi.gan
    ];

    if (auxGanShiShen.some(s => s === '食神' || s === '伤官')) {
      score += 6;
      details.push(`辅盘食伤透干，利于生财 +6.00`);
    }
    if (auxGanShiShen.some(s => s === '比肩' || s === '劫财')) {
      score -= 4;
      details.push(`辅盘比劫透干，需防分财 -4.00`);
    }
  } else if (relationType === 'parent_child') {
    // 亲子关系：重点看印星、食伤
    const auxShiShen = auxBazi.shiShen;
    const auxGanShiShen = [
      auxShiShen.nian.gan,
      auxShiShen.yue.gan,
      auxShiShen.shi.gan
    ];

    if (auxGanShiShen.some(s => s === '正印' || s === '偏印')) {
      score += 6;
      details.push(`辅盘印星透干，有护佑之象 +6.00`);
    }
    if (auxGanShiShen.some(s => s === '食神' || s === '伤官')) {
      score += 4;
      details.push(`辅盘食伤透干，利于沟通 +4.00`);
    }
  }

  // ========== 日主五行互补 ==========
  const mainWuXing = mainBazi.riZhuWuXing;
  const auxWuXing = auxBazi.riZhuWuXing;

  // 五行相生
  const mainIdx = WU_XING_ORDER.indexOf(mainWuXing || '');
  const auxIdx = WU_XING_ORDER.indexOf(auxWuXing || '');

  if (mainIdx !== -1 && auxIdx !== -1) {
    // 辅盘日主生主盘日主
    if ((auxIdx + 1) % 5 === mainIdx) {
      score += 5;
      details.push(`日主五行相生（${auxWuXing}生${mainWuXing}）+5.00`);
    }
  }

  // 限制在 -15 ~ +15 范围内
  const clampedScore = Math.max(-15, Math.min(15, score));

  let reason = '星煞配合一般';
  if (details.length > 0) {
    reason = details.slice(0, 2).join('；');
  }

  return { score: Math.round(clampedScore * 100) / 100, reason, details };
}

// ==================== 大运同步计算 ====================

/**
 * 判断大运吉凶
 * 简化判断：根据大运干支与日主的关系
 */
function judgeDaYunLuck(
  riGan: string,
  daYunGan: string,
  daYunZhi: string,
  wangShuai: string
): 'good' | 'bad' | 'neutral' {
  // 十神判断
  const shiShen = getShiShen(riGan, daYunGan);

  // 身强喜财官，身弱喜印比
  if (wangShuai === '身强') {
    // 身强喜财官食
    if (['正财', '偏财', '正官', '七杀', '食神', '伤官'].includes(shiShen)) {
      return 'good';
    }
  } else if (wangShuai === '身弱') {
    // 身弱喜印比
    if (['正印', '偏印', '比肩', '劫财'].includes(shiShen)) {
      return 'good';
    }
  } else {
    // 中和，视具体组合
    if (['正财', '正官', '正印', '食神'].includes(shiShen)) {
      return 'good';
    }
  }

  // 逆神则凶
  if (wangShuai === '身强' && ['正印', '偏印', '比肩', '劫财'].includes(shiShen)) {
    return 'bad';
  }
  if (wangShuai === '身弱' && ['正财', '偏财', '正官', '七杀'].includes(shiShen)) {
    return 'bad';
  }

  return 'neutral';
}

/**
 * 计算大运同步影响
 */
export function calcDaYunTongBu(
  mainBazi: BaZiResult,
  auxBazi: BaZiResult,
  currentAge: number
): HepanAdjustment {
  // 获取两人当前大运
  const mainDaYun = mainBazi.daYun.find(d => currentAge >= d.age && currentAge < d.age + 10);
  const auxDaYun = auxBazi.daYun.find(d => currentAge >= d.age && currentAge < d.age + 10);

  if (!mainDaYun || !auxDaYun) {
    return { score: 0, reason: '大运信息缺失', details: ['无法获取大运信息'] };
  }

  // 判断两人大运吉凶
  const mainLuck = judgeDaYunLuck(
    mainBazi.riZhu.gan,
    mainDaYun.gan,
    mainDaYun.zhi,
    mainBazi.wangShuai
  );

  const auxLuck = judgeDaYunLuck(
    auxBazi.riZhu.gan,
    auxDaYun.gan,
    auxDaYun.zhi,
    auxBazi.wangShuai
  );

  const mainDaYunStr = `${mainDaYun.gan}${mainDaYun.zhi}（${mainLuck === 'good' ? '吉' : mainLuck === 'bad' ? '凶' : '平'}）`;
  const auxDaYunStr = `${auxDaYun.gan}${auxDaYun.zhi}（${auxLuck === 'good' ? '吉' : auxLuck === 'bad' ? '凶' : '平'}）`;

  // 判断同步程度
  if (mainLuck === 'good' && auxLuck === 'good') {
    return {
      score: 10,
      reason: '两人大运同步向好',
      details: [`主盘${mainDaYunStr}`, `辅盘${auxDaYunStr}`, '同吉 +10.00']
    };
  } else if (mainLuck === 'bad' && auxLuck === 'bad') {
    return {
      score: -8,
      reason: '两人大运同步走衰',
      details: [`主盘${mainDaYunStr}`, `辅盘${auxDaYunStr}`, '同凶 -8.00']
    };
  } else if (mainLuck === 'good' || auxLuck === 'good') {
    return {
      score: 3,
      reason: '一人运势向好',
      details: [`主盘${mainDaYunStr}`, `辅盘${auxDaYunStr}`, '一吉一平/凶 +3.00']
    };
  } else if (mainLuck === 'bad' || auxLuck === 'bad') {
    return {
      score: -3,
      reason: '一人运势走衰',
      details: [`主盘${mainDaYunStr}`, `辅盘${auxDaYunStr}`, '一凶一平 -3.00']
    };
  }

  return {
    score: 0,
    reason: '大运平稳',
    details: [`主盘${mainDaYunStr}`, `辅盘${auxDaYunStr}`, '均平稳 0.00']
  };
}

// ==================== 二十七星宿关系计算 ====================

/**
 * 计算二十七星宿关系影响
 *
 * @param primaryLunarMonth 主盘农历月份
 * @param primaryLunarDay 主盘农历日期
 * @param secondaryLunarMonth 辅盘农历月份
 * @param secondaryLunarDay 辅盘农历日期
 */
export function calcXingSuRelationAdjustment(
  primaryLunarMonth: number,
  primaryLunarDay: number,
  secondaryLunarMonth: number,
  secondaryLunarDay: number
): XingSuRelationResult {
  // 计算两人的本命星宿
  const primaryXingSu = calcBenMingXingSu(primaryLunarMonth, primaryLunarDay);
  const secondaryXingSu = calcBenMingXingSu(secondaryLunarMonth, secondaryLunarDay);

  // 计算星宿关系
  const relation = calcXingSuRelation(primaryXingSu, secondaryXingSu);

  // 根据关系类型和距离确定分值调整
  let score = 0;
  let reason = '';
  const details: string[] = [];

  switch (relation.type) {
    case 'ming_zhixing':
      score = 8;
      reason = `命之星，相同星宿，宿命感强`;
      details.push(`主盘${primaryXingSu}宿`, `辅盘${secondaryXingSu}宿`, `命之星关系 +8.00`);
      break;
    case 'ye_tai':
      score = 10;
      reason = `业胎关系，精神联结深`;
      details.push(`主盘${primaryXingSu}宿`, `辅盘${secondaryXingSu}宿`, `业胎关系 +10.00`);
      break;
    case 'rong_qin':
      score = relation.distance === 'near' ? 15 :
              relation.distance === 'medium' ? 12 : 8;
      reason = `荣亲关系（${relation.distanceName}），稳固结合`;
      details.push(`主盘${primaryXingSu}宿`, `辅盘${secondaryXingSu}宿`, `荣亲关系（${relation.distanceName}）+${score.toFixed(2)}`);
      break;
    case 'you_shuai':
      score = relation.distance === 'near' ? 0 :
              relation.distance === 'medium' ? 2 : -3;
      reason = `友衰关系（${relation.distanceName}），情绪价值高`;
      details.push(`主盘${primaryXingSu}宿`, `辅盘${secondaryXingSu}宿`, `友衰关系（${relation.distanceName}）${score >= 0 ? '+' : ''}${score.toFixed(2)}`);
      break;
    case 'an_huai':
      score = relation.distance === 'near' ? -5 :
              relation.distance === 'medium' ? 0 : 3;
      reason = `安坏关系（${relation.distanceName}），强吸力与杀伤力并存`;
      details.push(`主盘${primaryXingSu}宿`, `辅盘${secondaryXingSu}宿`, `安坏关系（${relation.distanceName}）${score >= 0 ? '+' : ''}${score.toFixed(2)}`);
      break;
    case 'wei_cheng':
      score = relation.distance === 'near' ? 8 :
              relation.distance === 'medium' ? 10 : 5;
      reason = `危成关系（${relation.distanceName}），职场/商业最佳拍档`;
      details.push(`主盘${primaryXingSu}宿`, `辅盘${secondaryXingSu}宿`, `危成关系（${relation.distanceName}）+${score.toFixed(2)}`);
      break;
  }

  // 根据角色微调
  if (relation.role) {
    reason += `，角色：${relation.role}`;
    details.push(`角色：${relation.role}`);
  }

  return {
    primary: primaryXingSu,
    secondary: secondaryXingSu,
    relation,
    adjustment: { score, reason, details }
  };
}

// ==================== 综合调整计算 ====================

/**
 * 计算合盘综合调整分
 */
export function calcHepanAdjustments(
  mainBazi: BaZiResult,
  auxBazi: BaZiResult,
  relationType: RelationType,
  dimension: Dimension,
  currentAge?: number,
  lunarDates?: {
    primary: { month: number; day: number };
    secondary: { month: number; day: number };
  }
): HepanAdjustments & { xingsu_relation?: HepanAdjustment } {
  // 五行生克影响
  const wuXingShengKe = calcWuXingShengKe(mainBazi, auxBazi);

  // 星煞配合影响
  const xingShaPeiHe = calcXingShaPeiHe(mainBazi, auxBazi, relationType, dimension);

  // 大运同步影响（需要当前年龄）
  const daYunTongBu = currentAge
    ? calcDaYunTongBu(mainBazi, auxBazi, currentAge)
    : { score: 0, reason: '未提供年龄' };

  // 星宿关系影响（需要农历日期）
  let xingsuAdjustment: HepanAdjustment | undefined;
  if (lunarDates) {
    const xingsuResult = calcXingSuRelationAdjustment(
      lunarDates.primary.month,
      lunarDates.primary.day,
      lunarDates.secondary.month,
      lunarDates.secondary.day
    );
    xingsuAdjustment = xingsuResult.adjustment;
  }

  // 总调整分
  let totalAdjustment = wuXingShengKe.score + xingShaPeiHe.score + daYunTongBu.score;
  if (xingsuAdjustment) {
    totalAdjustment += xingsuAdjustment.score;
  }

  return {
    wu_xing_sheng_ke: wuXingShengKe,
    xing_sha_pei_he: xingShaPeiHe,
    da_yun_tong_bu: daYunTongBu,
    xingsu_relation: xingsuAdjustment,
    total_adjustment: Math.max(-30, Math.min(30, totalAdjustment)) // 限制在 ±30 范围内
  };
}

/**
 * 应用合盘调整到评分
 */
export function applyHepanAdjustment(
  baseScore: number,
  adjustments: HepanAdjustments
): number {
  const adjustedScore = baseScore + adjustments.total_adjustment;
  return Math.max(0, Math.min(100, adjustedScore));
}

// ==================== 辅助函数 ====================

function getTianGanWuXing(gan: string): string | null {
  const map: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  };
  return map[gan] || null;
}

function getDiZhiWuXing(zhi: string): string | null {
  const map: Record<string, string> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };
  return map[zhi] || null;
}

function getShiShen(dayGan: string, targetGan: string): string {
  const dayWuXing = getTianGanWuXing(dayGan);
  const targetWuXing = getTianGanWuXing(targetGan);

  if (!dayWuXing || !targetWuXing) return '';

  const dayYinYang = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan) ? '阳' : '阴';
  const targetYinYang = ['甲', '丙', '戊', '庚', '壬'].includes(targetGan) ? '阳' : '阴';
  const sameYinYang = dayYinYang === targetYinYang;

  const dayIdx = WU_XING_ORDER.indexOf(dayWuXing);
  const targetIdx = WU_XING_ORDER.indexOf(targetWuXing);

  // 生我（印星）
  if ((targetIdx + 1) % 5 === dayIdx) {
    return sameYinYang ? '偏印' : '正印';
  }
  // 我生（食伤）
  if ((dayIdx + 1) % 5 === targetIdx) {
    return sameYinYang ? '食神' : '伤官';
  }
  // 克我（官杀）
  if ((targetIdx + 2) % 5 === dayIdx) {
    return sameYinYang ? '七杀' : '正官';
  }
  // 我克（财星）
  if ((dayIdx + 2) % 5 === targetIdx) {
    return sameYinYang ? '偏财' : '正财';
  }
  // 同我（比劫）
  if (dayWuXing === targetWuXing) {
    return sameYinYang ? '比肩' : '劫财';
  }

  return '';
}

// ==================== 共同寿元计算 ====================

/**
 * 计算共同寿元
 * 取两人寿元的较小值
 */
export function calcCommonLifespan(
  mainLifespan: number,
  auxLifespan: number
): number {
  return Math.min(mainLifespan, auxLifespan);
}

// ==================== 相识年份校准 ====================

/**
 * 校准相识年份
 * 基于用户输入，结合八字特征微调
 */
export function adjustMeetYear(
  inputYear: number,
  mainBazi: BaZiResult,
  auxBazi: BaZiResult
): number {
  // 简化实现：检查输入年份是否有桃花特征
  // 完整实现需要流年分析

  // 检查是否在两人年龄合理范围内
  const mainBirthYear = parseInt(mainBazi.formatted.nianZhu);
  const auxBirthYear = parseInt(auxBazi.formatted.nianZhu);

  // 相识年份必须晚于两人出生
  const minYear = Math.max(mainBirthYear, auxBirthYear);

  if (inputYear < minYear) {
    return minYear;
  }

  // 检查当前年份
  const currentYear = new Date().getFullYear();
  if (inputYear > currentYear) {
    return currentYear;
  }

  return inputYear;
}
