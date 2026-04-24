import { readFile } from 'fs/promises';
import path from 'path';
import { getBailianConfig } from '@/lib/server/env';
import { paiPan, type BaZiResult } from '@/lib/domain/bazi';
import { getHourInfo, type HourInfo } from '@/lib/domain/hour-map';

export type LifeKlineDimension = 'wealth' | 'life' | 'emotion';
export type LifeKlinePeriod = 'daily' | 'monthly' | 'yearly' | 'day' | 'month' | 'year';

export interface LifeKlineRequestInput {
  birth: string;
  birthTime?: string;
  gender: 'male' | 'female';
  dimension: string;
  period: string;
  targetYear?: number;
  targetMonth?: number;
}

export interface LifeKlineAiTimelineEntry {
  year: number;
  month?: number;
  day?: number;
  age?: number;
  analysis?: string;
  score: number;
  confidence?: number;
}

export interface LifeKlineAiResult {
  dimension: string;
  period: string;
  lifespan?: {
    total_years: number;
    confidence: number;
    reasoning: string;
  };
  meta?: Record<string, unknown>;
  timeline: LifeKlineAiTimelineEntry[];
  global_analysis?: Record<string, unknown>;
}

export interface LifeKlineInferenceResult {
  aiResult: LifeKlineAiResult;
  bazi: BaZiResult;
  birthYear: number;
  hourInfo?: HourInfo;
}

const LIFE_KLINE_SKILL_PATH = path.join(process.cwd(), 'content/prompts/life-kline/skill.md');

function isLifeKlineAiResult(value: unknown): value is LifeKlineAiResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LifeKlineAiResult>;
  return Array.isArray(candidate.timeline) && typeof candidate.dimension === 'string' && typeof candidate.period === 'string';
}

async function loadSkillPrompt() {
  return readFile(LIFE_KLINE_SKILL_PATH, 'utf-8');
}

function extractJsonBlock(content: string) {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('AI 返回格式错误，无法解析 JSON。');
  }

  return jsonMatch[1] || jsonMatch[0];
}

function generateUserPrompt(input: LifeKlineRequestInput, bazi: BaZiResult): string {
  const birthYear = parseInt(input.birth.split('-')[0], 10);

  const dimensionNames: Record<string, string> = {
    wealth: '财富运势',
    life: '生命健康',
    emotion: '情感婚恋',
  };

  const dimensionName = dimensionNames[input.dimension] || '财富运势';

  const baziInfo = `
### 八字排盘（系统自动计算）

- **年柱**：${bazi.formatted.nianZhu}（${bazi.shiShen.nian.gan}）
- **月柱**：${bazi.formatted.yueZhu}（${bazi.shiShen.yue.gan}）
- **日柱**：${bazi.formatted.riZhu}（日主）
- **时柱**：${bazi.formatted.shiZhu}（${bazi.shiShen.shi.gan}）
- **日主五行**：${bazi.riZhuWuXing}${bazi.riZhuYinYang}
- **旺衰判断**：${bazi.wangShuai}
- **五行分布**：木${Math.round(bazi.wuXingCount['木'])} 火${Math.round(bazi.wuXingCount['火'])} 土${Math.round(bazi.wuXingCount['土'])} 金${Math.round(bazi.wuXingCount['金'])} 水${Math.round(bazi.wuXingCount['水'])}
- **大运**：${bazi.qiYunAge}岁起运，${bazi.daYun.slice(0, 3).map((item) => `${item.gan}${item.zhi}运 ${item.age}岁`).join(' → ')}...
`;

  let timeDescription = '';
  let dataCountInstruction = '';
  let periodLabel = '';
  let timelineExample = '';

  switch (input.period) {
    case 'daily':
    case 'day':
      timeDescription = `生成 ${input.targetYear} 年 ${input.targetMonth} 月的日K数据（共 30 天）`;
      dataCountInstruction = '精确 30 条记录';
      periodLabel = '日K';
      timelineExample = `"timeline": [
        { "year": ${input.targetYear}, "month": ${input.targetMonth}, "day": 1, "analysis": "财运平稳，收支均衡", "score": 52, "confidence": 0.75 },
        { "year": ${input.targetYear}, "month": ${input.targetMonth}, "day": 2, "analysis": "财运上升，有进账之喜", "score": 68, "confidence": 0.80 }
      ]`;
      break;
    case 'monthly':
    case 'month':
      timeDescription = `生成 ${input.targetYear} 年的月K数据（共 12 个月）`;
      dataCountInstruction = '精确 12 条记录';
      periodLabel = '月K';
      timelineExample = `"timeline": [
        { "year": ${input.targetYear}, "month": 1, "analysis": "年初财运起步，宜守不宜攻", "score": 48, "confidence": 0.70 },
        { "year": ${input.targetYear}, "month": 2, "analysis": "春节财运亨通，财星透干", "score": 72, "confidence": 0.82 }
      ]`;
      break;
    case 'yearly':
    case 'year':
    default:
      timeDescription = `生成 ${birthYear} 年起的年K数据`;
      dataCountInstruction = 'AI 根据命理推算寿元，生成 75-89 条记录';
      periodLabel = '年K';
      timelineExample = `"timeline": [
        { "year": ${birthYear}, "age": 1, "analysis": "命定开局，根基渐稳", "score": 52, "confidence": 0.75 },
        { "year": ${birthYear + 1}, "age": 2, "analysis": "运势平稳，健康无忧", "score": 55, "confidence": 0.72 }
      ]`;
      break;
  }

  return `
## 本次任务

请为以下用户生成**${periodLabel}**的人生 K 线数据：

### 用户信息
- 出生日期：${input.birth}（公历）
- 性别：${input.gender === 'male' ? '男' : '女'}
- 分析维度：${dimensionName}

${baziInfo}

### 时间范围
${timeDescription}

### 严格规则（v4.1）
1. **八字为本**：基于上述八字排盘信息进行分析，不得随意更改
2. **维度聚焦**：专注于"${dimensionName}"相关指标
3. **数据量**：${dataCountInstruction}
4. **评分规则**：score 为 0-100 整数，根据八字特征合理评分
5. **评分连续性**：相邻时间点 score 差异不可过大（日K≤20，月K≤25，年K≤30）
6. **分析简洁**：analysis 必须 20-50 字，包含状态和依据
7. **寿元推算**（仅年K）：在 lifespan 字段中输出推算的寿元年数，75-89区间
8. **字段完整**：日K含day，月K含month，年K含age
9. **置信度**：confidence 为 0.6-0.95 之间的浮点数
${input.period === 'yearly' || input.period === 'year'
    ? `
### 年K波段规则

**禁止输出两条直线**：必须有明显的波段起伏：
1. 少年期 0-18岁 震荡 → 青年期 19-35岁 趋势 → 中年期 36-55岁 主浪 → 晚年期 56+岁 回归
2. 每 15-20 年必须有一次大反转
3. 波段内每 5 年必须有回调`
    : ''}

### JSON 输出格式（v4.1：analysis + score，代码自动映射OHLC）
\`\`\`json
{
  "dimension": "${input.dimension}",
  "period": "${input.period === 'daily' ? 'day' : input.period === 'monthly' ? 'month' : 'year'}",
  "bazi": {
    "nianZhu": "${bazi.formatted.nianZhu}",
    "yueZhu": "${bazi.formatted.yueZhu}",
    "riZhu": "${bazi.formatted.riZhu}",
    "shiZhu": "${bazi.formatted.shiZhu}",
    "riZhuWuXing": "${bazi.riZhuWuXing}",
    "wangShuai": "${bazi.wangShuai}"
  },
  "lifespan": { "total_years": 82, "confidence": 0.75, "reasoning": "推算依据" },
  "meta": {
    "birthYear": ${birthYear},
    "gender": "${input.gender}",
    "mainAttribute": "${bazi.wangShuai}${bazi.riZhuWuXing}",
    "patternType": "根据八字判断",
    "patternName": "根据八字判断"
  },
  ${timelineExample},
  "global_analysis": {
    "pattern_summary": "震荡上行，中期看涨",
    "dimension_analysis": "基于八字分析约100字",
    "key_insights": "关键洞察约100字",
    "peak_periods": ["2030-2035年"],
    "risk_periods": ["2028-2029年"]
  }
}
\`\`\`

请严格按照 JSON 格式输出，不要添加任何解释文字。必须基于八字排盘信息进行分析。
**注意：只需输出 analysis 和 score，OHLC 由系统代码自动计算。**
`;
}

export async function runLifeKlineInference(input: LifeKlineRequestInput): Promise<LifeKlineInferenceResult> {
  // Check Bailian API configuration first
  const { apiKey, baseUrl, modelName } = getBailianConfig();

  const systemPrompt = await loadSkillPrompt();
  const birthYear = parseInt(input.birth.split('-')[0], 10);
  const birthMonth = parseInt(input.birth.split('-')[1], 10);
  const birthDay = parseInt(input.birth.split('-')[2], 10);
  const birthHour = input.birthTime ? parseInt(input.birthTime.split(':')[0], 10) : 12;
  const bazi = paiPan(birthYear, birthMonth, birthDay, birthHour, input.gender);
  const userPrompt = generateUserPrompt(input, bazi);

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
        temperature: 0.3,
        max_tokens: 8000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(extractJsonBlock(content));

    if (!isLifeKlineAiResult(parsed)) {
      throw new Error('AI 返回格式错误，缺少有效 timeline。');
    }

    return {
      aiResult: parsed,
      bazi,
      birthYear,
      hourInfo: input.birthTime ? getHourInfo(birthHour) : undefined,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
