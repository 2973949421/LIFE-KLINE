import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildAccuracySummary, buildConsistency, summarize } from '../scripts/check-life-kline-live.mjs';

function buildResponse(scores: number[]) {
  return {
    dimension: 'emotion',
    period: 'yearly',
    lifespan: { total_years: scores.length, confidence: 0.8, reasoning: 'chart only' },
    global_analysis: {
      peak_periods: [{ start_age: 3, end_age: 4, reason: 'test peak' }],
      risk_periods: [{ start_age: 1, end_age: 2, reason: 'test risk' }],
    },
    technical_commentary: 'test',
    timeline: scores.map((score, index) => {
      const age = index + 1;
      const year = 2003 + age;
      return {
        row_id: `Y${year}_A${age}`,
        year,
        age,
        score,
      };
    }),
  };
}

describe('live summary helpers', () => {
  it('summarizes accuracy comparison metrics without judging correctness', () => {
    const summary = buildAccuracySummary(buildResponse([40, 55, 70, 65, 50]));

    assert.strictEqual(summary.score_min, 40);
    assert.strictEqual(summary.score_max, 70);
    assert.strictEqual(summary.score_avg, 56);
    assert.deepStrictEqual(summary.top_score_ages.slice(0, 2), [3, 4]);
    assert.deepStrictEqual(summary.low_score_ages.slice(0, 2), [1, 5]);
    assert.deepStrictEqual(summary.peak_periods, [{ start_age: 3, end_age: 4, reason: 'test peak' }]);
  });

  it('builds consistency metrics with avg p50 and reasoning pollution count', () => {
    const runs = [
      {
        ok: true,
        elapsed_ms: 100,
        timeline_count: 5,
        first_row_id: 'Y2004_A1',
        first_year: 2004,
        first_age: 1,
        last_row_id: 'Y2008_A5',
        last_year: 2008,
        last_age: 5,
        lifespan: 5,
        contains_reasoning_text: false,
      },
      {
        ok: true,
        elapsed_ms: 300,
        timeline_count: 5,
        first_row_id: 'Y2004_A1',
        first_year: 2004,
        first_age: 1,
        last_row_id: 'Y2008_A5',
        last_year: 2008,
        last_age: 5,
        lifespan: 5,
        contains_reasoning_text: true,
      },
      { ok: false, elapsed_ms: 50 },
    ];

    const consistency = buildConsistency(runs);

    assert.strictEqual(consistency.requested_runs, 3);
    assert.strictEqual(consistency.successful_runs, 2);
    assert.strictEqual(consistency.structure_consistent, true);
    assert.strictEqual(consistency.reasoning_polluted_runs, 1);
    assert.strictEqual(consistency.avg_elapsed_ms, 200);
    assert.strictEqual(consistency.p50_elapsed_ms, 100);
    assert.strictEqual(consistency.max_elapsed_ms, 300);
  });

  it('includes accuracy summary in successful run summaries', () => {
    const run = summarize(buildResponse([45, 50, 60]), 200, 1234);

    assert.strictEqual(run.ok, true);
    assert.strictEqual(run.timeline_count, 3);
    assert.strictEqual(run.accuracy_summary.score_max, 60);
  });
});
