import { NextRequest, NextResponse } from 'next/server';

import { paiPan } from '@/lib/domain/bazi';

interface LifeKlineBaziRequest {
  birth?: string;
  birthTime?: string;
  gender?: 'male' | 'female';
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LifeKlineBaziRequest;
    const { birth, birthTime, gender } = body;

    if (!birth || !gender) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const birthYear = parseInt(birth.split('-')[0], 10);
    const birthMonth = parseInt(birth.split('-')[1], 10);
    const birthDay = parseInt(birth.split('-')[2], 10);
    const birthHour = birthTime ? parseInt(birthTime.split(':')[0], 10) : 12;

    const bazi = paiPan(birthYear, birthMonth, birthDay, birthHour, gender);

    const hourMap: Record<number, { hour: string; attribute: string }> = {
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
      22: { hour: '亥时', attribute: '亥水' },
    };

    const hourInfo = hourMap[birthHour] || { hour: '子时', attribute: '子水' };

    return NextResponse.json({
      bazi: {
        nianZhu: bazi.formatted.nianZhu,
        yueZhu: bazi.formatted.yueZhu,
        riZhu: bazi.formatted.riZhu,
        shiZhu: bazi.formatted.shiZhu,
        riZhuWuXing: bazi.riZhuWuXing,
        riZhuYinYang: bazi.riZhuYinYang,
        wangShuai: bazi.wangShuai,
        wuXingCount: bazi.wuXingCount,
        shiShen: bazi.shiShen,
        daYun: bazi.daYun,
        qiYunAge: bazi.qiYunAge,
      },
      meta: {
        birthYear,
        birthTime,
        birthHour: hourInfo.hour,
        hourAttribute: hourInfo.attribute,
        gender,
      },
    });
  } catch (error: unknown) {
    console.error('Bazi API Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, '排盘失败，请检查输入') },
      { status: 500 },
    );
  }
}
