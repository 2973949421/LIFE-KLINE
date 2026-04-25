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
  confidence?: number;
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
    wealth: 'wealth compatibility',
    life: 'life compatibility',
    emotion: 'emotional compatibility',
  };
  const periodNames: Record<string, string> = {
    yearly: 'yearly',
    year: 'yearly',
    monthly: 'monthly',
    month: 'monthly',
    daily: 'daily',
    day: 'daily',
  };

  const analysisYear = input.analysisYear ?? new Date().getFullYear();
  const analysisMonth = input.analysisMonth ?? new Date().getMonth() + 1;
  const analysisYears = input.analysisYears ?? 50;

  let timeRangeInstruction = `Produce a yearly timeline starting in ${input.meetYear} for ${analysisYears} consecutive years.`;
  let timelineInstruction = `timeline must contain ${analysisYears} entries with year increasing from ${input.meetYear}.`;

  if (input.period === 'monthly' || input.period === 'month') {
    timeRangeInstruction = `Produce a monthly timeline for January to December of ${analysisYear}.`;
    timelineInstruction = 'timeline must contain 12 entries with month values from 1 to 12.';
  }

  if (input.period === 'daily' || input.period === 'day') {
    timeRangeInstruction = `Produce a daily timeline for ${analysisYear}-${analysisMonth}, using 30 days.`;
    timelineInstruction = `timeline must contain 30 entries, month fixed to ${analysisMonth}, day from 1 to 30.`;
  }

  return `You are generating strict JSON for a relationship compatibility K-line analysis.

Relationship context:
- relation type: ${RELATION_LABELS[input.relationType] || input.relationType}
- meet year: ${input.meetYear}
- dimension: ${dimensionNames[input.dimension] || input.dimension}
- period: ${periodNames[input.period] || input.period}

Primary BaZi summary:
- year pillar: ${primaryBazi.formatted.nianZhu}
- month pillar: ${primaryBazi.formatted.yueZhu}
- day pillar: ${primaryBazi.formatted.riZhu}
- hour pillar: ${primaryBazi.formatted.shiZhu}
- day master element: ${primaryBazi.riZhuWuXing}${primaryBazi.riZhuYinYang}
- strength: ${primaryBazi.wangShuai}

Secondary BaZi summary:
- year pillar: ${secondaryBazi.formatted.nianZhu}
- month pillar: ${secondaryBazi.formatted.yueZhu}
- day pillar: ${secondaryBazi.formatted.riZhu}
- hour pillar: ${secondaryBazi.formatted.shiZhu}
- day master element: ${secondaryBazi.riZhuWuXing}${secondaryBazi.riZhuYinYang}
- strength: ${secondaryBazi.wangShuai}

Output requirements:
1. Return exactly one JSON object and nothing else.
2. The JSON must include meet_year_analysis, hepan_meta, timeline, and global_analysis.
3. timeline is primarily narrative. Each entry must include the correct date fields for the requested period and a short Chinese analysis sentence.
4. score is optional. If you include score, keep it conservative and treat it as a weak narrative hint only.
5. Do not produce exaggerated patterns such as a long all-high plateau, a one-way collapse, or repeated ceiling values.
6. ${timeRangeInstruction}
7. ${timelineInstruction}
8. hepan_meta.common_lifespan must be a reasonable integer.

JSON example:
{
  "hepan_meta": {
    "common_lifespan": 78
  },
  "meet_year_analysis": {
    "user_input": ${input.meetYear},
    "ai_suggested_range": [${Math.max(input.meetYear - 2, 1900)}, ${Math.max(input.meetYear - 1, 1900)}, ${input.meetYear}, ${input.meetYear + 1}, ${input.meetYear + 2}],
    "best_guess": ${input.meetYear},
    "reasoning": "根据双方八字与相识阶段推断，此年份附近缘分更容易建立。",
    "confidence": 0.78
  },
  "timeline": [
    {
      "year": ${input.meetYear},
      "analysis": "关系建立，互动开始升温"
    }
  ],
  "global_analysis": {
    "dimension_analysis": "整体关系基础存在协同，也会随阶段变化出现起伏。",
    "pattern_match": {
      "primary_pattern": "稳中有波动",
      "confidence": 0.76
    },
    "key_insights": "适合结合关键年份与互动节奏来理解关系变化。"
  }
}`;
}

export async function runHepanKlineInference(input: HepanKlineRequestInput): Promise<HepanInferenceResult> {
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

  const adjustedMeetYear = adjustMeetYear(input.meetYear, primaryBirthYear, secondaryBirthYear);
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
      throw new Error('AI returned invalid content: JSON block not found');
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
