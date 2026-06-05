import type { BaZiResult } from '@/lib/domain/bazi';
import type { AnnualContextRow } from '@/lib/domain/life-kline/annual-context';

export type AnnualTag =
  | 'DA_YUN_CHANGE'
  | 'WEALTH_RELATED'
  | 'LIFE_PRESSURE_RELATED'
  | 'EMOTION_RELATED'
  | 'SPOUSE_PALACE_RELATED';

export interface AnnualTaggedContextRow extends AnnualContextRow {
  tags: AnnualTag[];
  tag_reasons: Partial<Record<AnnualTag, string>>;
}

const GAN_TO_ELEMENT: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const ELEMENTS = ['木', '火', '土', '金', '水'];
const BRANCH_CLASH: Record<string, string> = {
  子: '午',
  丑: '未',
  寅: '申',
  卯: '酉',
  辰: '戌',
  巳: '亥',
  午: '子',
  未: '丑',
  申: '寅',
  酉: '卯',
  戌: '辰',
  亥: '巳',
};

function relationToDayMaster(dayElement: string, targetElement: string) {
  const dayIndex = ELEMENTS.indexOf(dayElement);
  const targetIndex = ELEMENTS.indexOf(targetElement);

  if (dayIndex < 0 || targetIndex < 0) {
    return 'unknown';
  }

  if (dayIndex === targetIndex) {
    return 'peer';
  }

  if ((dayIndex + 1) % ELEMENTS.length === targetIndex) {
    return 'output';
  }

  if ((dayIndex + 2) % ELEMENTS.length === targetIndex) {
    return 'wealth';
  }

  if ((targetIndex + 2) % ELEMENTS.length === dayIndex) {
    return 'authority';
  }

  if ((targetIndex + 1) % ELEMENTS.length === dayIndex) {
    return 'resource';
  }

  return 'unknown';
}

function addTag(
  tags: AnnualTag[],
  reasons: Partial<Record<AnnualTag, string>>,
  tag: AnnualTag,
  reason: string,
) {
  if (!tags.includes(tag)) {
    tags.push(tag);
    reasons[tag] = reason;
  }
}

export function addAnnualTagsToContext(
  bazi: BaZiResult,
  gender: 'male' | 'female',
  dimension: string,
  rows: AnnualContextRow[],
): AnnualTaggedContextRow[] {
  const dayElement = bazi.riZhuWuXing;
  const spousePalace = bazi.riZhu.zhi;

  return rows.map((row) => {
    const tags: AnnualTag[] = [];
    const tag_reasons: Partial<Record<AnnualTag, string>> = {};
    const liuNianGan = row.liu_nian.slice(0, 1);
    const liuNianZhi = row.liu_nian.slice(1, 2);
    const liuNianElement = GAN_TO_ELEMENT[liuNianGan];
    const relation = relationToDayMaster(dayElement, liuNianElement);

    if (row.da_yun_start_age === row.age) {
      addTag(tags, tag_reasons, 'DA_YUN_CHANGE', '该年进入或切换大运阶段，趋势判断需关注节奏变化。');
    }

    if (relation === 'wealth') {
      addTag(tags, tag_reasons, 'WEALTH_RELATED', '流年天干与日主形成财星关系，财富与资源议题更突出。');
    }

    if (relation === 'authority' || bazi.wangShuai !== '中和') {
      addTag(tags, tag_reasons, 'LIFE_PRESSURE_RELATED', '流年或命局旺衰提示压力管理与健康节奏需谨慎。');
    }

    if (dimension === 'emotion') {
      addTag(tags, tag_reasons, 'EMOTION_RELATED', '本次分析维度为情感，年度解释需聚焦关系互动与亲密经营。');
    }

    const spouseStarRelation = gender === 'male' ? 'wealth' : 'authority';
    if (relation === spouseStarRelation || liuNianZhi === spousePalace || BRANCH_CLASH[liuNianZhi] === spousePalace) {
      addTag(tags, tag_reasons, 'SPOUSE_PALACE_RELATED', '该年与伴侣星或夫妻宫相关，情感判断需关注关系事件。');
    }

    return {
      ...row,
      tags,
      tag_reasons,
    };
  });
}
