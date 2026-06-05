/**
 * 八字排盘库 - 基于 lunar-javascript 实现
 *
 * 功能：
 * 1. 四柱排盘（年柱、月柱、日柱、时柱）
 * 2. 五行统计
 * 3. 十神配置
 * 4. 大运计算
 * 5. 日主旺衰判断
 */

import { Solar } from 'lunar-javascript';

// ==================== 类型定义 ====================

export interface BaZiResult {
  // 四柱
  nianZhu: { gan: string; zhi: string };  // 年柱
  yueZhu: { gan: string; zhi: string };   // 月柱
  riZhu: { gan: string; zhi: string };    // 日柱
  shiZhu: { gan: string; zhi: string };   // 时柱

  // 五行统计
  wuXingCount: Record<string, number>;

  // 十神配置
  shiShen: {
    nian: { gan: string; zhi: string[] };
    yue: { gan: string; zhi: string[] };
    ri: { gan: string; zhi: string[] };
    shi: { gan: string; zhi: string[] };
  };

  // 大运
  daYun: Array<{
    age: number;
    gan: string;
    zhi: string;
    startYear: number;
    endYear: number;
  }>;

  // 日主信息
  riZhuWuXing: string;
  riZhuYinYang: string;
  wangShuai: string;  // 旺衰判断

  // 起运年龄
  qiYunAge: number;

  // 格式化输出
  formatted: {
    nianZhu: string;
    yueZhu: string;
    riZhu: string;
    shiZhu: string;
  };
}

// ==================== 基础数据 ====================

// 天干五行
const TIAN_GAN_WU_XING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

// 天干阴阳
const TIAN_GAN_YIN_YANG: Record<string, string> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
};

// 十神关系（以日干为我）
function getShiShen(dayGan: string, targetGan: string): string {
  const dayWuXing = TIAN_GAN_WU_XING[dayGan];
  const targetWuXing = TIAN_GAN_WU_XING[targetGan];
  const dayYinYang = TIAN_GAN_YIN_YANG[dayGan];
  const targetYinYang = TIAN_GAN_YIN_YANG[targetGan];

  if (!dayWuXing || !targetWuXing) return '';

  const sameYinYang = dayYinYang === targetYinYang;

  // 五行相生相克关系
  const wuXingOrder = ['木', '火', '土', '金', '水'];
  const dayIndex = wuXingOrder.indexOf(dayWuXing);
  const targetIndex = wuXingOrder.indexOf(targetWuXing);

  // 生我（印星）
  if ((targetIndex + 1) % 5 === dayIndex) {
    return sameYinYang ? '偏印' : '正印';
  }
  // 我生（食伤）
  if ((dayIndex + 1) % 5 === targetIndex) {
    return sameYinYang ? '食神' : '伤官';
  }
  // 克我（官杀）
  if ((targetIndex + 2) % 5 === dayIndex) {
    return sameYinYang ? '七杀' : '正官';
  }
  // 我克（财星）
  if ((dayIndex + 2) % 5 === targetIndex) {
    return sameYinYang ? '偏财' : '正财';
  }
  // 同我（比劫）
  if (dayWuXing === targetWuXing) {
    return sameYinYang ? '比肩' : '劫财';
  }

  return '';
}

// 地支藏干
const DI_ZHI_CANG_GAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

// ==================== 八字排盘主函数 ====================

/**
 * 八字排盘主函数（使用 lunar-javascript）
 * @param birthYear 出生年（公历）
 * @param birthMonth 出生月（公历，1-12）
 * @param birthDay 出生日（公历，1-31）
 * @param birthHour 出生时辰（0-23）
 * @param gender 性别（'male' 或 'female'）
 */
export function paiPan(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  gender: 'male' | 'female'
): BaZiResult {

  // 使用 lunar-javascript 进行排盘
  const solar = Solar.fromYmdHms(birthYear, birthMonth, birthDay, birthHour, 0, 0);
  const lunar = solar.getLunar();

  // 获取八字
  const bazi = lunar.getEightChar();

  // 获取四柱
  const nianGan = bazi.getYearGan();
  const nianZhi = bazi.getYearZhi();
  const yueGan = bazi.getMonthGan();
  const yueZhi = bazi.getMonthZhi();
  const riGan = bazi.getDayGan();
  const riZhi = bazi.getDayZhi();
  const shiGan = bazi.getTimeGan();
  const shiZhi = bazi.getTimeZhi();

  // ========== 五行统计 ==========
  const wuXingCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  // 统计天干五行
  [nianGan, yueGan, riGan, shiGan].forEach(gan => {
    const wx = TIAN_GAN_WU_XING[gan];
    if (wx) wuXingCount[wx] += 1;
  });

  // 统计地支五行（含藏干）
  [nianZhi, yueZhi, riZhi, shiZhi].forEach(zhi => {
    // 主气
    const zhiWuXing = getDiZhiWuXing(zhi);
    if (zhiWuXing) wuXingCount[zhiWuXing] += 0.6;

    // 藏干
    const cangGan = DI_ZHI_CANG_GAN[zhi] || [];
    cangGan.forEach((gan, idx) => {
      const weight = idx === 0 ? 0.3 : 0.15;
      const wx = TIAN_GAN_WU_XING[gan];
      if (wx) wuXingCount[wx] = (wuXingCount[wx] || 0) + weight;
    });
  });

  // ========== 十神配置 ==========
  const shiShen = {
    nian: {
      gan: getShiShen(riGan, nianGan),
      zhi: (DI_ZHI_CANG_GAN[nianZhi] || []).map(g => getShiShen(riGan, g))
    },
    yue: {
      gan: getShiShen(riGan, yueGan),
      zhi: (DI_ZHI_CANG_GAN[yueZhi] || []).map(g => getShiShen(riGan, g))
    },
    ri: {
      gan: '日主',
      zhi: (DI_ZHI_CANG_GAN[riZhi] || []).map(g => getShiShen(riGan, g))
    },
    shi: {
      gan: getShiShen(riGan, shiGan),
      zhi: (DI_ZHI_CANG_GAN[shiZhi] || []).map(g => getShiShen(riGan, g))
    }
  };

  // ========== 日主旺衰判断 ==========
  const riZhuWuXing = TIAN_GAN_WU_XING[riGan] || '';
  const riZhuYinYang = TIAN_GAN_YIN_YANG[riGan] || '';

  // 使用 lunar-javascript 的旺衰判断
  const wangShuai = getWangShuai(riGan, yueZhi, riZhi, wuXingCount);

  // ========== 大运计算 ==========
  // lunar-javascript: getYun 需要 gender 参数 (1=男, 0=女)
  const genderNum = gender === 'male' ? 1 : 0;
  const yun = bazi.getYun(genderNum);

  // 起运年龄
  const qiYunAge = yun.getStartAge ? yun.getStartAge() : 1;

  interface DaYunLike {
    getGanZhi?: () => string;
  }

  const daYunList = (yun.getDaYun ? yun.getDaYun() : []) as DaYunLike[];
  const daYun = daYunList.slice(0, 10).map((dy, idx: number) => {
    const startAge = qiYunAge + idx * 10;
    const ganZhi = dy.getGanZhi ? dy.getGanZhi() : '';
    return {
      age: startAge,
      gan: ganZhi.substring(0, 1),
      zhi: ganZhi.substring(1, 2),
      startYear: birthYear + startAge,
      endYear: birthYear + startAge + 9
    };
  });

  // ========== 返回结果 ==========
  return {
    nianZhu: { gan: nianGan, zhi: nianZhi },
    yueZhu: { gan: yueGan, zhi: yueZhi },
    riZhu: { gan: riGan, zhi: riZhi },
    shiZhu: { gan: shiGan, zhi: shiZhi },

    wuXingCount,

    shiShen,

    daYun,

    riZhuWuXing,
    riZhuYinYang,
    wangShuai,

    qiYunAge,

    formatted: {
      nianZhu: `${nianGan}${nianZhi}`,
      yueZhu: `${yueGan}${yueZhi}`,
      riZhu: `${riGan}${riZhi}`,
      shiZhu: `${shiGan}${shiZhi}`
    }
  };
}

// 获取地支五行
function getDiZhiWuXing(zhi: string): string {
  const map: Record<string, string> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };
  return map[zhi] || '';
}

// 判断旺衰
function getWangShuai(
  riGan: string,
  yueZhi: string,
  riZhi: string,
  wuXingCount: Record<string, number>
): string {
  const riWuXing = TIAN_GAN_WU_XING[riGan];
  const yueWuXing = getDiZhiWuXing(yueZhi);
  const riZhiWuXing = getDiZhiWuXing(riZhi);

  // 五行相生关系
  const wuXingOrder = ['木', '火', '土', '金', '水'];
  const riIndex = wuXingOrder.indexOf(riWuXing || '');
  const yueIndex = wuXingOrder.indexOf(yueWuXing || '');

  // 得令：月支生助日主
  const deLing = (yueIndex + 1) % 5 === riIndex || yueWuXing === riWuXing;

  // 得地：日支生助日主
  const riZhiIndex = wuXingOrder.indexOf(riZhiWuXing || '');
  const deDi = (riZhiIndex + 1) % 5 === riIndex || riZhiWuXing === riWuXing;

  // 得势：印比数量
  const yinCount = wuXingCount[wuXingOrder[(riIndex + 4) % 5]] || 0;
  const biCount = wuXingCount[riWuXing || ''] || 0;

  // 综合判断
  const score = (deLing ? 3 : 0) + (deDi ? 2 : 0) + yinCount + biCount * 0.5;

  if (score >= 5) return '身强';
  if (score >= 3) return '中和';
  return '身弱';
}

/**
 * 获取当前大运
 */
export function getCurrentDaYun(bazi: BaZiResult, currentAge: number) {
  return bazi.daYun.find(d => currentAge >= d.age && currentAge < d.age + 10);
}

/**
 * 格式化八字排盘结果（用于前端展示）
 */
export function formatBaZiForDisplay(bazi: BaZiResult) {
  return {
    四柱: {
      年柱: bazi.formatted.nianZhu,
      月柱: bazi.formatted.yueZhu,
      日柱: bazi.formatted.riZhu,
      时柱: bazi.formatted.shiZhu
    },
    五行分布: {
      木: Math.round(bazi.wuXingCount['木'] * 10) / 10,
      火: Math.round(bazi.wuXingCount['火'] * 10) / 10,
      土: Math.round(bazi.wuXingCount['土'] * 10) / 10,
      金: Math.round(bazi.wuXingCount['金'] * 10) / 10,
      水: Math.round(bazi.wuXingCount['水'] * 10) / 10
    },
    十神: {
      年柱: `${bazi.shiShen.nian.gan}（${bazi.shiShen.nian.zhi.join('、')}）`,
      月柱: `${bazi.shiShen.yue.gan}（${bazi.shiShen.yue.zhi.join('、')}）`,
      日柱: `日主（${bazi.shiShen.ri.zhi.join('、')}）`,
      时柱: `${bazi.shiShen.shi.gan}（${bazi.shiShen.shi.zhi.join('、')}）`
    },
    日主: {
      五行: bazi.riZhuWuXing,
      阴阳: bazi.riZhuYinYang,
      旺衰: bazi.wangShuai
    },
    大运: bazi.daYun.map(d => `${d.age}岁起${d.gan}${d.zhi}运`).join('，'),
    起运年龄: `${bazi.qiYunAge}岁起运`
  };
}
