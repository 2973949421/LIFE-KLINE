import { readFile } from 'fs/promises';
import path from 'path';
import { Solar } from 'lunar-javascript';
import { paiPan, type BaZiResult } from '@/lib/domain/bazi';
import { adjustMeetYear, type RelationType } from '@/lib/domain/hepan-score';
import { RELATION_LABELS, normalizeLunarMonth } from '@/lib/domain/kline-constants';
import { getBailianConfig } from '@/lib/server/env';

interface HepanPartyInput {
  birth: string;
  birthTime?: string;
  gender: 'male' | 'female';
  name?: string;
}

export interface HepanKlineRequestInput {
  primary: HepanPartyInput;
  secondary: HepanPartyInput;
  relationType: RelationType;
  meetYear: number;
  analysisYears?: number;
  analysisYear?: number;
  analysisMonth?: number;
  dimension: string;
  period: string;
}

export interface HepanAiTimelineEntry extends Record<string, unknown> {
  year: number;
  month?: number;
  day?: number;
  score?: number;
  analysis?: string;
}

export interface HepanAiResult {
  hepan_meta?: {
    common_lifespan?: number;
  };
  meet_year_analysis?: {
    user_input?: number;
    ai_suggested_range?: number[];
    best_guess?: number;
    reasoning?: string;
    confidence?: number;
  };
  global_analysis?: Record<string, unknown>;
  timeline: HepanAiTimelineEntry[];
}

export interface HepanInferenceResult {
  aiResult: HepanAiResult;
  primaryBazi: BaZiResult;
  secondaryBazi: BaZiResult;
  adjustedMeetYear: number;
  primaryBirthYear: number;
  secondaryBirthYear: number;
  primaryBirthHour: number;
  secondaryBirthHour: number;
  primaryLunarDates: { month: number; day: number };
  secondaryLunarDates: { month: number; day: number };
}

const SKILL_PATH = path.join(process.cwd(), 'content/prompts/hepan-kline/skill.md');

async function loadSkillPrompt() {
  return readFile(SKILL_PATH, 'utf-8');
}

function extractJsonBlock(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1];
  }

  const plain = content.match(/\{[\s\S]*\}/);
  return plain?.[0] ?? '';
}

function generateUserPrompt(
  input: HepanKlineRequestInput,
  primaryBazi: BaZiResult,
  secondaryBazi: BaZiResult,
) {
  const dimensionNames: Record<string, string> = {
    wealth: '财富运势',
    life: '生命健康',
    emotion: '情感婚姻',
  };
  const periodNames: Record<string, string> = {
    yearly: '年K',
    year: '年K',
    monthly: '月K',
    month: '月K',
    daily: '日K',
    day: '日K',
  };

  const analysisYear = input.analysisYear ?? new Date().getFullYear();
  const analysisMonth = input.analysisMonth ?? new Date().getMonth() + 1;
  const analysisYears = input.analysisYears ?? 50;

  let timeRangeInstruction = `请生成从 ${input.meetYear} 年起连续 ${analysisYears} 年的年K时间序列。`;
  let timelineInstruction = `timeline 必须输出 ${analysisYears} 条记录，从 ${input.meetYear} 年开始逐年递增。`;

  if (input.period === 'monthly' || input.period === 'month') {
    timeRangeInstruction = `请生成 ${analysisYear} 年 1 月到 12 月的月K时间序列。`;
    timelineInstruction = `timeline 必须输出 12 条记录，month 为 1-12。`;
  }

  if (input.period === 'daily' || input.period === 'day') {
    timeRangeInstruction = `请生成 ${analysisYear} 年 ${analysisMonth} 月的日K时间序列，按 30 天处理。`;
    timelineInstruction = `timeline 必须输出 30 条记录，month 固定为 ${analysisMonth}，day 为 1-30。`;
  }

  return `
你现在要为“合盘 K 线”生成严格 JSON。

合盘信息：
- 关系类型：${RELATION_LABELS[input.relationType] || input.relationType}
- 相识年份：${input.meetYear}
- 分析维度：${dimensionNames[input.dimension] || input.dimension}
- 时间周期：${periodNames[input.period] || input.period}

主盘八字摘要：
- 年柱：${primaryBazi.formatted.nianZhu}
- 月柱：${primaryBazi.formatted.yueZhu}
- 日柱：${primaryBazi.formatted.riZhu}
- 时柱：${primaryBazi.formatted.shiZhu}
- 日主五行：${primaryBazi.riZhuWuXing}${primaryBazi.riZhuYinYang}
- 旺衰：${primaryBazi.wangShuai}

辅盘八字摘要：
- 年柱：${secondaryBazi.formatted.nianZhu}
- 月柱：${secondaryBazi.formatted.yueZhu}
- 日柱：${secondaryBazi.formatted.riZhu}
- 时柱：${secondaryBazi.formatted.shiZhu}
- 日主五行：${secondaryBazi.riZhuWuXing}${secondaryBazi.riZhuYinYang}
- 旺衰：${secondaryBazi.wangShuai}

输出要求：
1. 只输出一个 JSON 对象，不要输出额外解释。
2. score 必须是 0-100 的整数。
3. analysis 必须是简短中文句子。
4. 必须包含 meet_year_analysis、hepan_meta、timeline、global_analysis。
5. hepan_meta.common_lifespan 必须给出合理整数。
6. ${timeRangeInstruction}
7. ${timelineInstruction}
8. 相邻时间点 score 差异尽量不要超过 20。

JSON 结构示例：
{
  "hepan_meta": {
    "common_lifespan": 78
  },
  "meet_year_analysis": {
    "user_input": ${input.meetYear},
    "ai_suggested_range": [${Math.max(input.meetYear - 2, 1900)}, ${Math.max(input.meetYear - 1, 1900)}, ${input.meetYear}, ${input.meetYear + 1}, ${input.meetYear + 2}],
    "best_guess": ${input.meetYear},
    "reasoning": "根据双方八字与相识阶段推断，此年份附近缘分最强。",
    "confidence": 0.78
  },
  "timeline": [
    {
      "year": ${input.meetYear},
      "analysis": "关系建立，互动逐步升温",
      "score": 72
    }
  ],
  "global_analysis": {
    "dimension_analysis": "整体关系基础稳定，后续走势仍受双方互动影响。",
    "pattern_match": {
      "primary_pattern": "稳中有升",
      "confidence": 0.76
    },
    "key_insights": "适合关注关键年份的情绪与节奏变化。"
  }
}
`;
}

export async function runHepanKlineInference(input: HepanKlineRequestInput): Promise<HepanInferenceResult> {
  // Check Bailian API configuration first
  const { apiKey, baseUrl, modelName } = getBailianConfig();

  const systemPrompt = await loadSkillPrompt();

  const primaryBirthYear = parseInt(input.primary.birth.split('-')[0], 10);
  const primaryBirthMonth = parseInt(input.primary.birth.split('-')[1], 10);
  const primaryBirthDay = parseInt(input.primary.birth.split('-')[2], 10);
  const primaryBirthHour = input.primary.birthTime ? parseInt(input.primary.birthTime.split(':')[0], 10) : 12;

  const secondaryBirthYear = parseInt(input.secondary.birth.split('-')[0], 10);
  const secondaryBirthMonth = parseInt(input.secondary.birth.split('-')[1], 10);
  const secondaryBirthDay = parseInt(input.secondary.birth.split('-')[2], 10);
  const secondaryBirthHour = input.secondary.birthTime ? parseInt(input.secondary.birthTime.split(':')[0], 10) : 12;

  const primaryBazi = paiPan(primaryBirthYear, primaryBirthMonth, primaryBirthDay, primaryBirthHour, input.primary.gender);
  const secondaryBazi = paiPan(
    secondaryBirthYear,
    secondaryBirthMonth,
    secondaryBirthDay,
    secondaryBirthHour,
    input.secondary.gender,
  );

  const primarySolar = Solar.fromYmdHms(primaryBirthYear, primaryBirthMonth, primaryBirthDay, primaryBirthHour, 0, 0);
  const secondarySolar = Solar.fromYmdHms(
    secondaryBirthYear,
    secondaryBirthMonth,
    secondaryBirthDay,
    secondaryBirthHour,
    0,
    0,
  );

  const primaryLunar = primarySolar.getLunar();
  const secondaryLunar = secondarySolar.getLunar();

  const primaryLunarDates = {
    month: normalizeLunarMonth(primaryLunar.getMonth()),
    day: primaryLunar.getDay(),
  };
  const secondaryLunarDates = {
    month: normalizeLunarMonth(secondaryLunar.getMonth()),
    day: secondaryLunar.getDay(),
  };

  const adjustedMeetYear = adjustMeetYear(input.meetYear, primaryBazi, secondaryBazi);
  const userPrompt = generateUserPrompt({ ...input, meetYear: adjustedMeetYear }, primaryBazi, secondaryBazi);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.35,
        max_tokens: 8000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonText = extractJsonBlock(content);

    if (!jsonText) {
      throw new Error('AI 返回格式错误，无法解析 JSON');
    }

    const aiResult = JSON.parse(jsonText) as HepanAiResult;

    return {
      aiResult,
      primaryBazi,
      secondaryBazi,
      adjustedMeetYear,
      primaryBirthYear,
      secondaryBirthYear,
      primaryBirthHour,
      secondaryBirthHour,
      primaryLunarDates,
      secondaryLunarDates,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
