import type { BaZiResult } from '@/lib/domain/bazi';
import type { YearlyScaffoldRow } from '@/lib/domain/life-kline/yearly-scaffold';

export interface AnnualContextRow extends YearlyScaffoldRow {
  liu_nian: string;
  da_yun?: string;
  da_yun_start_age?: number;
  da_yun_end_age?: number;
}

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const JIA_ZI_YEAR = 1984;

function positiveModulo(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

export function getLiuNianGanZhi(year: number) {
  const offset = year - JIA_ZI_YEAR;
  return `${GAN[positiveModulo(offset, GAN.length)]}${ZHI[positiveModulo(offset, ZHI.length)]}`;
}

export function buildAnnualContext(bazi: BaZiResult, scaffold: YearlyScaffoldRow[]): AnnualContextRow[] {
  return scaffold.map((row) => {
    const daYun = bazi.daYun.find((item) => row.age >= item.age && row.age < item.age + 10);

    return {
      ...row,
      liu_nian: getLiuNianGanZhi(row.year),
      da_yun: daYun ? `${daYun.gan}${daYun.zhi}` : undefined,
      da_yun_start_age: daYun?.age,
      da_yun_end_age: daYun ? daYun.age + 9 : undefined,
    };
  });
}
