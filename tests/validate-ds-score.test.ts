import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DsScoreValidationError,
  validateDsScoreResponse,
} from '../lib/server/life-kline/validate-ds-score.ts';

const expectedRowIds = ['Y2004_A1', 'Y2005_A2'];

function validResponse() {
  return {
    schema_version: 'life_kline_ds_score_v1',
    dimension: 'emotion',
    period: 'year',
    rows: [
      { row_id: 'Y2004_A1', score: 52, analysis: '幼年根基平稳，情感安全感渐稳。', confidence: 0.72 },
      { row_id: 'Y2005_A2', score: 55, analysis: '家庭气场平顺，情绪互动较为稳定。', confidence: 0.74 },
    ],
    global_analysis: {
      pattern_summary: '震荡上行',
      dimension_analysis: '情感走势整体平稳，随大运展开逐步形成更明确的关系需求。',
      key_insights: '宜在上升期主动经营关系，在回撤期保持沟通。',
      peak_periods: [{ start_age: 30, end_age: 38, reason: '关系机会集中。' }],
      risk_periods: [{ start_age: 52, end_age: 56, reason: '流年冲动较多。' }],
    },
  };
}

function assertValidationFails(value: unknown, pattern: RegExp) {
  assert.throws(
    () => validateDsScoreResponse(value, { expectedRowIds, dimension: 'emotion', requireGlobalAnalysis: true }),
    (error: unknown) => {
      assert.ok(error instanceof DsScoreValidationError);
      assert.match(error.message, pattern);
      return true;
    },
  );
}

test('validateDsScoreResponse accepts valid DS score response', () => {
  const result = validateDsScoreResponse(validResponse(), {
    expectedRowIds,
    dimension: 'emotion',
    requireGlobalAnalysis: true,
  });

  assert.equal(result.rows.length, 2);
});

test('validateDsScoreResponse rejects missing rows', () => {
  const response = validResponse();
  delete (response as Record<string, unknown>).rows;

  assertValidationFails(response, /rows must be an array/);
});

test('validateDsScoreResponse rejects wrong row count', () => {
  const response = validResponse();
  response.rows.pop();

  assertValidationFails(response, /rows length must be 2/);
});

test('validateDsScoreResponse rejects duplicate row ids', () => {
  const response = validResponse();
  response.rows[1].row_id = 'Y2004_A1';

  assertValidationFails(response, /duplicated/);
});

test('validateDsScoreResponse rejects unknown row ids', () => {
  const response = validResponse();
  response.rows[1].row_id = 'Y2099_A96';

  assertValidationFails(response, /unknown/);
});

test('validateDsScoreResponse rejects invalid score', () => {
  const response = validResponse();
  response.rows[0].score = 101;

  assertValidationFails(response, /score must be an integer/);
});

test('validateDsScoreResponse rejects empty analysis', () => {
  const response = validResponse();
  response.rows[0].analysis = '';

  assertValidationFails(response, /analysis is required/);
});

test('validateDsScoreResponse rejects invalid confidence', () => {
  const response = validResponse();
  response.rows[0].confidence = 2;

  assertValidationFails(response, /confidence must be a number/);
});

test('validateDsScoreResponse rejects forbidden local-owned fields', () => {
  const response = validResponse();
  (response.rows[0] as Record<string, unknown>).year = 2004;
  (response.rows[0] as Record<string, unknown>).o = 50;

  assertValidationFails(response, /forbidden fields/);
});

test('validateDsScoreResponse rejects dimension mismatch', () => {
  const response = validResponse();
  response.dimension = 'wealth';

  assertValidationFails(response, /dimension must be emotion/);
});

test('validateDsScoreResponse rejects missing global analysis when required', () => {
  const response = validResponse();
  delete (response as Record<string, unknown>).global_analysis;

  assertValidationFails(response, /global_analysis must be an object/);
});
