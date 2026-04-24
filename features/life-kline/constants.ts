import type { Dimension, Period, RelationType } from '@/features/life-kline/types';

export const DIMENSION_NAMES: Record<Dimension, string> = {
  wealth: '财富运势',
  life: '生命健康',
  emotion: '情感婚姻',
};

export const PERIOD_NAMES: Record<Period, string> = {
  daily: '日 K（30 天）',
  monthly: '月 K（12 个月）',
  yearly: '年 K（AI 推算）',
};

export const RELATION_LABELS: Record<RelationType, string> = {
  couple: '情侣/夫妻',
  business: '商业伙伴',
  parent_child: '亲子',
  other: '其他',
};

export const SINGLE_LOADING_TEXTS = [
  '命盘初开，星辰渐明...',
  '八字流转，运势成形...',
  '五行相生，卦象渐明...',
  '大运流转，命理推演...',
  '天干地支，玄机暗藏...',
  '阴阳调和，命格初定...',
  '流年更迭，命运揭晓...',
  '紫微斗数，星君降临...',
  '四柱八字，乾坤已定...',
  '命由天定，运在人为...',
];

export const HEPAN_LOADING_TEXTS = [
  '双星交汇，缘分初探...',
  '八字相合，命理交织...',
  '五行互补，合盘渐成...',
  '主从相生，运势成形...',
  '星宿相配，玄机暗藏...',
  '大运同步，命运相连...',
  '阴阳调和，合盘初定...',
  '红鸾天喜，缘分揭晓...',
  '夫妻宫位，乾坤已定...',
  '命中注定，运在人为...',
];
