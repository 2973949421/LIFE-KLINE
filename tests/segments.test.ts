import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildYearlySegments, validateSegmentCoverage } from '../lib/server/life-kline/segments.ts';

function buildRows(total: number) {
  return Array.from({ length: total }, (_, index) => {
    const age = index + 1;
    const year = 2003 + age;
    return {
      row_id: `Y${year}_A${age}`,
      year,
      age,
    };
  });
}

describe('yearly segments', () => {
  it('splits yearly rows into the configured age ranges', () => {
    const rows = buildRows(81);
    const segments = buildYearlySegments(rows);

    assert.deepStrictEqual(
      segments.map((segment) => segment.label),
      ['1-18', '19-35', '36-55', '56+'],
    );
    assert.deepStrictEqual(
      segments.map((segment) => segment.rows.length),
      [18, 17, 20, 26],
    );
    assert.strictEqual(segments[0].rows[0].age, 1);
    assert.strictEqual(segments.at(-1)?.rows.at(-1)?.age, 81);
  });

  it('covers each row exactly once', () => {
    const rows = buildRows(89);
    const segments = buildYearlySegments(rows);

    assert.doesNotThrow(() => validateSegmentCoverage(segments, rows));

    const allRowIds = segments.flatMap((segment) => segment.rows.map((row) => row.row_id));
    assert.strictEqual(new Set(allRowIds).size, rows.length);
    assert.deepStrictEqual(allRowIds.sort(), rows.map((row) => row.row_id).sort());
  });

  it('omits empty tail segments for short row sets while preserving coverage', () => {
    const rows = buildRows(12);
    const segments = buildYearlySegments(rows);

    assert.deepStrictEqual(
      segments.map((segment) => segment.label),
      ['1-18'],
    );
    assert.doesNotThrow(() => validateSegmentCoverage(segments, rows));
  });

  it('rejects duplicate or missing segment rows', () => {
    const rows = buildRows(3);
    const duplicatedSegments = [
      { index: 0, label: 'bad', startAge: 1, endAge: 2, rows: [rows[0], rows[0]] },
    ];

    assert.throws(() => validateSegmentCoverage(duplicatedSegments, rows), /SEGMENT_COVERAGE_FAILED/);
  });
});
