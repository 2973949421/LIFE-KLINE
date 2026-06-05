export interface DsScoreRow {
  row_id: string;
  score: number;
  analysis: string;
  confidence: number;
}

export interface DsGlobalPeriod {
  start_age: number;
  end_age: number;
  reason: string;
}

export interface DsGlobalAnalysis {
  pattern_summary: string;
  dimension_analysis: string;
  key_insights: string;
  peak_periods?: DsGlobalPeriod[];
  risk_periods?: DsGlobalPeriod[];
}

export interface DsScoreResponse {
  schema_version: 'life_kline_ds_score_v1';
  dimension: string;
  period: 'year';
  rows: DsScoreRow[];
  global_analysis?: DsGlobalAnalysis;
}

export interface DsScoreValidationContext {
  expectedRowIds: string[];
  dimension: string;
  requireGlobalAnalysis?: boolean;
}

export class DsScoreValidationError extends Error {
  readonly validationErrors: string[];

  constructor(validationErrors: string[]) {
    super(`AI_SCORE_VALIDATION_FAILED: ${validationErrors.join('; ')}`);
    this.name = 'DsScoreValidationError';
    this.validationErrors = validationErrors;
  }
}

const FORBIDDEN_ROW_FIELDS = [
  'year',
  'age',
  'o',
  'h',
  'l',
  'c',
  'open',
  'high',
  'low',
  'close',
  'technical_commentary',
  'technical_indicators',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasForbiddenFields(value: Record<string, unknown>) {
  return FORBIDDEN_ROW_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(value, field));
}

function validateGlobalAnalysis(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push('global_analysis must be an object');
    return;
  }

  for (const field of ['pattern_summary', 'dimension_analysis', 'key_insights']) {
    if (typeof value[field] !== 'string' || !value[field]) {
      errors.push(`global_analysis.${field} is required`);
    }
  }

  for (const field of ['peak_periods', 'risk_periods']) {
    const periods = value[field];
    if (periods === undefined) {
      continue;
    }

    if (!Array.isArray(periods)) {
      errors.push(`global_analysis.${field} must be an array`);
      continue;
    }

    if (periods.length > 3) {
      errors.push(`global_analysis.${field} must have at most 3 items`);
    }

    periods.forEach((period, index) => {
      if (!isRecord(period)) {
        errors.push(`global_analysis.${field}[${index}] must be an object`);
        return;
      }

      if (!Number.isInteger(period.start_age) || !Number.isInteger(period.end_age)) {
        errors.push(`global_analysis.${field}[${index}] must include integer start_age/end_age`);
      }

      if (
        Number.isInteger(period.start_age) &&
        Number.isInteger(period.end_age) &&
        Number(period.start_age) > Number(period.end_age)
      ) {
        errors.push(`global_analysis.${field}[${index}] start_age must be <= end_age`);
      }

      if (typeof period.reason !== 'string' || !period.reason) {
        errors.push(`global_analysis.${field}[${index}].reason is required`);
      }
    });
  }
}

export function validateDsGlobalAnalysis(value: unknown): DsGlobalAnalysis {
  const errors: string[] = [];
  validateGlobalAnalysis(value, errors);

  if (errors.length) {
    throw new DsScoreValidationError(errors);
  }

  return value as DsGlobalAnalysis;
}

export function validateDsScoreResponse(value: unknown, context: DsScoreValidationContext): DsScoreResponse {
  const errors: string[] = [];

  if (!isRecord(value)) {
    throw new DsScoreValidationError(['response must be an object']);
  }

  if (value.schema_version !== 'life_kline_ds_score_v1') {
    errors.push('schema_version must be life_kline_ds_score_v1');
  }

  if (value.dimension !== context.dimension) {
    errors.push(`dimension must be ${context.dimension}`);
  }

  if (value.period !== 'year') {
    errors.push('period must be year');
  }

  if (!Array.isArray(value.rows)) {
    errors.push('rows must be an array');
  } else {
    const expected = new Set(context.expectedRowIds);
    const seen = new Set<string>();

    if (value.rows.length !== context.expectedRowIds.length) {
      errors.push(`rows length must be ${context.expectedRowIds.length}`);
    }

    value.rows.forEach((row, index) => {
      if (!isRecord(row)) {
        errors.push(`rows[${index}] must be an object`);
        return;
      }

      const forbidden = hasForbiddenFields(row);
      if (forbidden.length) {
        errors.push(`rows[${index}] contains forbidden fields: ${forbidden.join(', ')}`);
      }

      if (typeof row.row_id !== 'string' || !row.row_id) {
        errors.push(`rows[${index}].row_id is required`);
      } else {
        if (!expected.has(row.row_id)) {
          errors.push(`rows[${index}].row_id is unknown: ${row.row_id}`);
        }

        if (seen.has(row.row_id)) {
          errors.push(`rows[${index}].row_id is duplicated: ${row.row_id}`);
        }

        seen.add(row.row_id);
      }

      if (!Number.isInteger(row.score) || Number(row.score) < 0 || Number(row.score) > 100) {
        errors.push(`rows[${index}].score must be an integer from 0 to 100`);
      }

      if (typeof row.analysis !== 'string' || !row.analysis.trim()) {
        errors.push(`rows[${index}].analysis is required`);
      }

      if (typeof row.confidence !== 'number' || row.confidence < 0 || row.confidence > 1) {
        errors.push(`rows[${index}].confidence must be a number from 0 to 1`);
      }
    });

    for (const rowId of expected) {
      if (!seen.has(rowId)) {
        errors.push(`missing row_id: ${rowId}`);
      }
    }
  }

  if (context.requireGlobalAnalysis || value.global_analysis !== undefined) {
    validateGlobalAnalysis(value.global_analysis, errors);
  }

  if (errors.length) {
    throw new DsScoreValidationError(errors);
  }

  return value as unknown as DsScoreResponse;
}
