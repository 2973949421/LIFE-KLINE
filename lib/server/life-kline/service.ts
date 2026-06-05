import { readFile } from 'fs/promises';
import path from 'path';
import { buildAnnualContext, type AnnualContextRow } from '@/lib/domain/life-kline/annual-context';
import {
  buildYearlyScaffold,
  calculateChartLifespan,
  type ChartLifespan,
} from '@/lib/domain/life-kline/yearly-scaffold';
import { getBailianConfig } from '@/lib/server/env';
import { paiPan, type BaZiResult } from '@/lib/domain/bazi';
import { getHourInfo, type HourInfo } from '@/lib/domain/hour-map';
import {
  DsScoreValidationError,
  type DsGlobalAnalysis,
  type DsScoreRow,
  validateDsGlobalAnalysis,
  validateDsScoreResponse,
} from '@/lib/server/life-kline/validate-ds-score';

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
  row_id?: string;
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
const LIFE_KLINE_DEEPSEEK_SKILL_PATH = path.join(process.cwd(), 'content/prompts/life-kline/skill.deepseek.md');

function isLifeKlineAiResult(value: unknown): value is LifeKlineAiResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LifeKlineAiResult>;
  return Array.isArray(candidate.timeline) && typeof candidate.dimension === 'string' && typeof candidate.period === 'string';
}

async function loadPrompt(filePath: string) {
  return readFile(filePath, 'utf-8');
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function normalizeModelName(modelName: string) {
  return modelName.replace(/^opencode-go\//, '');
}

function extractJsonBlock(content: string) {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i) || trimmed.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('AI 返回格式错误，无法解析 JSON。');
  }

  return jsonMatch[1] || jsonMatch[0];
}

function extractAssistantContent(data: any) {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item?.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n');
  }

  return '';
}

function getMaxTokens(period: string) {
  if (period === 'yearly' || period === 'year') {
    return 20000;
  }

  return 12000;
}

function isYearlyPeriod(period: string) {
  return period === 'yearly' || period === 'year';
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status: number) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

async function callChatCompletion({
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature = 0.3,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature?: number;
}) {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { apiKey, baseUrl, modelName } = getBailianConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const apiModelName = normalizeModelName(modelName);
      const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiModelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`API Error: ${response.status}${errorText ? `: ${errorText.slice(0, 500)}` : ''}`);

        if (isRetryableStatus(response.status) && attempt < maxAttempts) {
          lastError = error;
          await sleep(1500 * attempt);
          continue;
        }

        throw error;
      }

      const data = await response.json();
      const content = extractAssistantContent(data);
      return JSON.parse(extractJsonBlock(content));
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts && error instanceof Error && error.name === 'AbortError') {
        await sleep(1500 * attempt);
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI request failed');
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
    default:
      throw new Error(`Unsupported legacy period: ${input.period}`);
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
5. **评分连续性**：相邻时间点 score 差异不可过大（日K≤20，月K≤25）
6. **分析简洁**：analysis 必须 20-50 字，包含状态和依据
7. **字段完整**：日K含day，月K含month
8. **置信度**：confidence 为 0.6-0.95 之间的浮点数

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

function formatBaziProfile(input: LifeKlineRequestInput, bazi: BaZiResult, birthYear: number, chartLifespan: ChartLifespan) {
  return {
    birth: input.birth,
    birthTime: input.birthTime,
    gender: input.gender,
    dimension: input.dimension,
    period: 'year',
    chart_lifespan_years: chartLifespan.total_years,
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
      qiYunAge: bazi.qiYunAge,
      daYun: bazi.daYun.map((item) => ({
        ganZhi: `${item.gan}${item.zhi}`,
        startAge: item.age,
        endAge: item.age + 9,
        startYear: birthYear + item.age - 1,
        endYear: birthYear + item.age + 8,
      })),
    },
  };
}

function buildSegmentPrompt({
  input,
  bazi,
  birthYear,
  chartLifespan,
  rows,
  segmentIndex,
  totalSegments,
}: {
  input: LifeKlineRequestInput;
  bazi: BaZiResult;
  birthYear: number;
  chartLifespan: ChartLifespan;
  rows: AnnualContextRow[];
  segmentIndex: number;
  totalSegments: number;
}) {
  return JSON.stringify(
    {
      task: 'life_kline_yearly_segment_score',
      instructions: {
        segment: `${segmentIndex + 1}/${totalSegments}`,
        output: 'Return exactly one JSON object. Return rows only for the supplied row_id values.',
        forbidden_fields: ['year', 'age', 'o', 'h', 'l', 'c', 'open', 'high', 'low', 'close', 'technical_indicators'],
      },
      profile: formatBaziProfile(input, bazi, birthYear, chartLifespan),
      rows,
    },
    null,
    2,
  );
}

function buildRepairPrompt(originalPrompt: string, validationErrors: string[]) {
  return `
你上一次返回的 JSON 没有通过校验。

校验错误：
${validationErrors.map((error, index) => `${index + 1}. ${error}`).join('\n')}

请根据以下原始任务只返回修复后的完整 JSON。
不要解释，不要 markdown，不要改变 row_id 集合，不要输出 year、age、o、h、l、c。

原始任务：
${originalPrompt}
`;
}

function buildSegments(rows: AnnualContextRow[]) {
  const ranges = [
    { start: 1, end: 18 },
    { start: 19, end: 35 },
    { start: 36, end: 55 },
    { start: 56, end: Number.POSITIVE_INFINITY },
  ];

  return ranges.map((range) => rows.filter((row) => row.age >= range.start && row.age <= range.end)).filter((segment) => segment.length > 0);
}

async function requestAndValidateSegment({
  systemPrompt,
  userPrompt,
  expectedRowIds,
  dimension,
}: {
  systemPrompt: string;
  userPrompt: string;
  expectedRowIds: string[];
  dimension: string;
}): Promise<DsScoreRow[]> {
  try {
    const parsed = await callChatCompletion({
      systemPrompt,
      userPrompt,
      maxTokens: 9000,
      temperature: 0.2,
    });
    const validated = validateDsScoreResponse(parsed, { expectedRowIds, dimension });
    return validated.rows;
  } catch (error) {
    if (!(error instanceof DsScoreValidationError)) {
      throw error;
    }

    const repaired = await callChatCompletion({
      systemPrompt,
      userPrompt: buildRepairPrompt(userPrompt, error.validationErrors),
      maxTokens: 9000,
      temperature: 0.1,
    });
    const validated = validateDsScoreResponse(repaired, { expectedRowIds, dimension });
    return validated.rows;
  }
}

function buildGlobalAnalysisPrompt({
  input,
  bazi,
  birthYear,
  chartLifespan,
  rows,
}: {
  input: LifeKlineRequestInput;
  bazi: BaZiResult;
  birthYear: number;
  chartLifespan: ChartLifespan;
  rows: Array<AnnualContextRow & DsScoreRow>;
}) {
  return JSON.stringify(
    {
      task: 'life_kline_yearly_global_analysis',
      instructions: {
        output: 'Return exactly one JSON object containing global_analysis only.',
        global_analysis_shape: {
          pattern_summary: 'string',
          dimension_analysis: 'string',
          key_insights: 'string',
          peak_periods: [{ start_age: 'integer', end_age: 'integer', reason: 'string' }],
          risk_periods: [{ start_age: 'integer', end_age: 'integer', reason: 'string' }],
        },
      },
      profile: formatBaziProfile(input, bazi, birthYear, chartLifespan),
      timeline_summary: rows.map((row) => ({
        row_id: row.row_id,
        year: row.year,
        age: row.age,
        liu_nian: row.liu_nian,
        da_yun: row.da_yun,
        score: row.score,
        analysis: row.analysis,
      })),
    },
    null,
    2,
  );
}

async function requestGlobalAnalysis(systemPrompt: string, userPrompt: string): Promise<DsGlobalAnalysis> {
  try {
    const parsed = await callChatCompletion({
      systemPrompt,
      userPrompt,
      maxTokens: 6000,
      temperature: 0.2,
    });
    return validateDsGlobalAnalysis((parsed as { global_analysis?: unknown }).global_analysis);
  } catch (error) {
    if (!(error instanceof DsScoreValidationError)) {
      throw error;
    }

    const repaired = await callChatCompletion({
      systemPrompt,
      userPrompt: buildRepairPrompt(userPrompt, error.validationErrors),
      maxTokens: 6000,
      temperature: 0.1,
    });
    return validateDsGlobalAnalysis((repaired as { global_analysis?: unknown }).global_analysis);
  }
}

async function runLifeKlineInferenceLegacy(
  input: LifeKlineRequestInput,
  bazi: BaZiResult,
  birthYear: number,
  hourInfo?: HourInfo,
): Promise<LifeKlineInferenceResult> {
  const systemPrompt = await loadPrompt(LIFE_KLINE_SKILL_PATH);
  const userPrompt = generateUserPrompt(input, bazi);
  const parsed = await callChatCompletion({
    systemPrompt,
    userPrompt,
    maxTokens: getMaxTokens(input.period),
  });

  if (!isLifeKlineAiResult(parsed)) {
    throw new Error('AI 返回格式错误，缺少有效 timeline。');
  }

  return {
    aiResult: parsed,
    bazi,
    birthYear,
    hourInfo,
  };
}

async function runLifeKlineInferenceV42(
  input: LifeKlineRequestInput,
  bazi: BaZiResult,
  birthYear: number,
  hourInfo?: HourInfo,
): Promise<LifeKlineInferenceResult> {
  const systemPrompt = await loadPrompt(LIFE_KLINE_DEEPSEEK_SKILL_PATH);
  const chartLifespan = calculateChartLifespan(bazi, input.gender);
  const scaffold = buildYearlyScaffold(birthYear, chartLifespan.total_years);
  const annualContext = buildAnnualContext(bazi, scaffold);
  const segments = buildSegments(annualContext);
  const scoredRows: DsScoreRow[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const userPrompt = buildSegmentPrompt({
      input,
      bazi,
      birthYear,
      chartLifespan,
      rows: segment,
      segmentIndex: index,
      totalSegments: segments.length,
    });
    const rows = await requestAndValidateSegment({
      systemPrompt,
      userPrompt,
      expectedRowIds: segment.map((row) => row.row_id),
      dimension: input.dimension,
    });
    scoredRows.push(...rows);
  }

  const scoreByRowId = new Map(scoredRows.map((row) => [row.row_id, row]));
  const mergedRows = annualContext.map((row) => {
    const scored = scoreByRowId.get(row.row_id);

    if (!scored) {
      throw new Error(`AI_SCORE_VALIDATION_FAILED: missing row_id after merge: ${row.row_id}`);
    }

    return { ...row, ...scored };
  });
  const globalAnalysisPrompt = buildGlobalAnalysisPrompt({
    input,
    bazi,
    birthYear,
    chartLifespan,
    rows: mergedRows,
  });
  const globalAnalysis = await requestGlobalAnalysis(systemPrompt, globalAnalysisPrompt);

  return {
    aiResult: {
      dimension: input.dimension,
      period: 'year',
      lifespan: chartLifespan,
      meta: {
        birthYear,
        gender: input.gender,
        mainAttribute: `${bazi.wangShuai}${bazi.riZhuWuXing}`,
        chart_lifespan_years: chartLifespan.total_years,
      },
      timeline: mergedRows.map((row) => ({
        row_id: row.row_id,
        year: row.year,
        age: row.age,
        analysis: row.analysis,
        score: row.score,
        confidence: row.confidence,
      })),
      global_analysis: globalAnalysis as unknown as Record<string, unknown>,
    },
    bazi,
    birthYear,
    hourInfo,
  };
}

export async function runLifeKlineInference(input: LifeKlineRequestInput): Promise<LifeKlineInferenceResult> {
  const birthYear = parseInt(input.birth.split('-')[0], 10);
  const birthMonth = parseInt(input.birth.split('-')[1], 10);
  const birthDay = parseInt(input.birth.split('-')[2], 10);
  const birthHour = input.birthTime ? parseInt(input.birthTime.split(':')[0], 10) : 12;
  const bazi = paiPan(birthYear, birthMonth, birthDay, birthHour, input.gender);
  const hourInfo = input.birthTime ? getHourInfo(birthHour) : undefined;

  if (isYearlyPeriod(input.period)) {
    return runLifeKlineInferenceV42(input, bazi, birthYear, hourInfo);
  }

  return runLifeKlineInferenceLegacy(input, bazi, birthYear, hourInfo);
}
