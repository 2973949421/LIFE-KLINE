import { NextRequest, NextResponse } from 'next/server';
import { Solar } from 'lunar-javascript';

import { paiPan } from '@/lib/domain/bazi';
import { getHourInfo } from '@/lib/domain/hour-map';
import {
  calcWuXingShengKe,
  calcXingShaPeiHe,
  calcXingSuRelationAdjustment,
  type RelationType,
} from '@/lib/domain/hepan-score';
import { normalizeLunarMonth, RELATION_LABELS } from '@/lib/domain/kline-constants';
import { calcFullXingSuRelation } from '@/lib/domain/xingsu';

interface HepanBaziPersonInput {
  birth?: string;
  birthTime?: string;
  gender?: 'male' | 'female';
  name?: string;
}

interface HepanBaziRequest {
  primary?: HepanBaziPersonInput;
  secondary?: HepanBaziPersonInput;
  relationType?: RelationType;
  meetYear?: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HepanBaziRequest;
    const { primary, secondary, relationType = 'couple', meetYear } = body;

    if (!primary?.birth || !primary?.gender || !secondary?.birth || !secondary?.gender) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const primaryBirthYear = parseInt(primary.birth.split('-')[0], 10);
    const primaryBirthMonth = parseInt(primary.birth.split('-')[1], 10);
    const primaryBirthDay = parseInt(primary.birth.split('-')[2], 10);
    const primaryBirthHour = primary.birthTime ? parseInt(primary.birthTime.split(':')[0], 10) : 12;

    const secondaryBirthYear = parseInt(secondary.birth.split('-')[0], 10);
    const secondaryBirthMonth = parseInt(secondary.birth.split('-')[1], 10);
    const secondaryBirthDay = parseInt(secondary.birth.split('-')[2], 10);
    const secondaryBirthHour = secondary.birthTime ? parseInt(secondary.birthTime.split(':')[0], 10) : 12;

    const primaryBazi = paiPan(primaryBirthYear, primaryBirthMonth, primaryBirthDay, primaryBirthHour, primary.gender);
    const secondaryBazi = paiPan(
      secondaryBirthYear,
      secondaryBirthMonth,
      secondaryBirthDay,
      secondaryBirthHour,
      secondary.gender,
    );

    const primaryHourInfo = getHourInfo(primaryBirthHour);
    const secondaryHourInfo = getHourInfo(secondaryBirthHour);

    const primarySolar = Solar.fromYmdHms(primaryBirthYear, primaryBirthMonth, primaryBirthDay, primaryBirthHour, 0, 0);
    const primaryLunar = primarySolar.getLunar();
    const primaryLunarMonth = normalizeLunarMonth(primaryLunar.getMonth());
    const primaryLunarDay = primaryLunar.getDay();

    const secondarySolar = Solar.fromYmdHms(
      secondaryBirthYear,
      secondaryBirthMonth,
      secondaryBirthDay,
      secondaryBirthHour,
      0,
      0,
    );
    const secondaryLunar = secondarySolar.getLunar();
    const secondaryLunarMonth = normalizeLunarMonth(secondaryLunar.getMonth());
    const secondaryLunarDay = secondaryLunar.getDay();

    const fullXingSuResult = calcFullXingSuRelation(
      {
        year: primaryBirthYear,
        month: primaryBirthMonth,
        day: primaryBirthDay,
        lunarMonth: primaryLunarMonth,
        lunarDay: primaryLunarDay,
      },
      {
        year: secondaryBirthYear,
        month: secondaryBirthMonth,
        day: secondaryBirthDay,
        lunarMonth: secondaryLunarMonth,
        lunarDay: secondaryLunarDay,
      },
    );

    const xingsuResult = calcXingSuRelationAdjustment(
      primaryLunarMonth,
      primaryLunarDay,
      secondaryLunarMonth,
      secondaryLunarDay,
    );

    const wuXingShengKe = calcWuXingShengKe(primaryBazi, secondaryBazi);
    const xingShaPeiHe = calcXingShaPeiHe(primaryBazi, secondaryBazi, relationType, 'emotion');

    return NextResponse.json({
      primary: {
        name: primary.name || '主盘',
        bazi: {
          nianZhu: primaryBazi.formatted.nianZhu,
          yueZhu: primaryBazi.formatted.yueZhu,
          riZhu: primaryBazi.formatted.riZhu,
          shiZhu: primaryBazi.formatted.shiZhu,
          riZhuWuXing: primaryBazi.riZhuWuXing,
          riZhuYinYang: primaryBazi.riZhuYinYang,
          wangShuai: primaryBazi.wangShuai,
          wuXingCount: primaryBazi.wuXingCount,
          shiShen: primaryBazi.shiShen,
          daYun: primaryBazi.daYun,
          qiYunAge: primaryBazi.qiYunAge,
        },
        meta: {
          birthYear: primaryBirthYear,
          birthTime: primary.birthTime,
          birthHour: primaryHourInfo.hour,
          hourAttribute: primaryHourInfo.attribute,
          gender: primary.gender,
          lunarMonth: primaryLunarMonth,
          lunarDay: primaryLunarDay,
        },
      },
      secondary: {
        name: secondary.name || '辅盘',
        bazi: {
          nianZhu: secondaryBazi.formatted.nianZhu,
          yueZhu: secondaryBazi.formatted.yueZhu,
          riZhu: secondaryBazi.formatted.riZhu,
          shiZhu: secondaryBazi.formatted.shiZhu,
          riZhuWuXing: secondaryBazi.riZhuWuXing,
          riZhuYinYang: secondaryBazi.riZhuYinYang,
          wangShuai: secondaryBazi.wangShuai,
          wuXingCount: secondaryBazi.wuXingCount,
          shiShen: secondaryBazi.shiShen,
          daYun: secondaryBazi.daYun,
          qiYunAge: secondaryBazi.qiYunAge,
        },
        meta: {
          birthYear: secondaryBirthYear,
          birthTime: secondary.birthTime,
          birthHour: secondaryHourInfo.hour,
          hourAttribute: secondaryHourInfo.attribute,
          gender: secondary.gender,
          lunarMonth: secondaryLunarMonth,
          lunarDay: secondaryLunarDay,
        },
      },
      hepan_preview: {
        relationType,
        relationLabel: RELATION_LABELS[relationType] || '其他',
        meetYear: meetYear || null,
        wuXingShengKe,
        xingShaPeiHe,
        xingsu: {
          benming: {
            primary: fullXingSuResult.benming.primary,
            secondary: fullXingSuResult.benming.secondary,
            relation: {
              type: fullXingSuResult.benming.relation.type,
              typeName: fullXingSuResult.benming.relation.typeName,
              distance: fullXingSuResult.benming.relation.distance,
              distanceName: fullXingSuResult.benming.relation.distanceName,
              role: fullXingSuResult.benming.relation.role,
              description: fullXingSuResult.benming.relation.description,
            },
          },
          zhir: {
            primary: fullXingSuResult.zhir.primary,
            secondary: fullXingSuResult.zhir.secondary,
            relation: {
              type: fullXingSuResult.zhir.relation.type,
              typeName: fullXingSuResult.zhir.relation.typeName,
              distance: fullXingSuResult.zhir.relation.distance,
              distanceName: fullXingSuResult.zhir.relation.distanceName,
              role: fullXingSuResult.zhir.relation.role,
              description: fullXingSuResult.zhir.relation.description,
            },
          },
          adjustment: xingsuResult.adjustment,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Hepan Bazi API Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, '排盘失败，请检查输入') },
      { status: 500 },
    );
  }
}
