export interface LifeKlineSegment<T extends { age: number; row_id: string }> {
  index: number;
  label: string;
  startAge: number;
  endAge: number;
  rows: T[];
}

const YEARLY_SEGMENT_RANGES = [
  { label: '1-18', startAge: 1, endAge: 18 },
  { label: '19-35', startAge: 19, endAge: 35 },
  { label: '36-55', startAge: 36, endAge: 55 },
  { label: '56+', startAge: 56, endAge: Number.POSITIVE_INFINITY },
];

export function buildYearlySegments<T extends { age: number; row_id: string }>(rows: T[]): LifeKlineSegment<T>[] {
  return YEARLY_SEGMENT_RANGES.map((range, index) => ({
    index,
    ...range,
    rows: rows.filter((row) => row.age >= range.startAge && row.age <= range.endAge),
  })).filter((segment) => segment.rows.length > 0);
}

export function validateSegmentCoverage<T extends { age: number; row_id: string }>(
  segments: Array<LifeKlineSegment<T>>,
  rows: T[],
) {
  const expected = new Set(rows.map((row) => row.row_id));
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const segment of segments) {
    for (const row of segment.rows) {
      if (!expected.has(row.row_id)) {
        errors.push(`unknown row_id in segment ${segment.label}: ${row.row_id}`);
      }

      if (seen.has(row.row_id)) {
        errors.push(`duplicated row_id in segments: ${row.row_id}`);
      }

      seen.add(row.row_id);
    }
  }

  for (const rowId of expected) {
    if (!seen.has(rowId)) {
      errors.push(`missing row_id in segments: ${rowId}`);
    }
  }

  if (errors.length) {
    throw new Error(`SEGMENT_COVERAGE_FAILED: ${errors.join('; ')}`);
  }
}
