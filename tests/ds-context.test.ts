import { describe, it } from 'node:test';
import assert from 'node:assert';
import { paiPan } from '../lib/domain/bazi.ts';
import { addAnnualTagsToContext } from '../lib/domain/life-kline/annual-tags.ts';
import { buildAnnualContext } from '../lib/domain/life-kline/annual-context.ts';
import { buildYearlyScaffold } from '../lib/domain/life-kline/yearly-scaffold.ts';
import {
  buildDsCompactProfile,
  buildDsCompactRows,
  buildDsTimelineSummary,
  DS_TAG_LEGEND,
} from '../lib/server/life-kline/ds-context.ts';

const input = {
  birth: '2004-06-20',
  birthTime: '19:30',
  gender: 'male' as const,
  dimension: 'emotion',
  period: 'yearly',
};

describe('ds compact context', () => {
  it('builds a compact profile without full shiShen or daYun payloads', () => {
    const bazi = paiPan(2004, 6, 20, 19, 'male');
    const profile = buildDsCompactProfile(input, bazi, { total_years: 81, confidence: 0.72, reasoning: 'test' });

    assert.strictEqual(profile.birth, '2004-06-20');
    assert.strictEqual(profile.period, 'year');
    assert.strictEqual(profile.chart_lifespan_years, 81);
    assert.strictEqual(profile.bazi.riZhuWuXing, bazi.riZhuWuXing);
    assert.ok(!Object.prototype.hasOwnProperty.call(profile.bazi, 'shiShen'));
    assert.ok(!Object.prototype.hasOwnProperty.call(profile.bazi, 'daYun'));
  });

  it('keeps row identity facts and removes long tag reasons from rows', () => {
    const bazi = paiPan(2004, 6, 20, 19, 'male');
    const rows = addAnnualTagsToContext(
      bazi,
      'male',
      'emotion',
      buildAnnualContext(bazi, buildYearlyScaffold(2004, 75)).slice(0, 12),
    );
    const compactRows = buildDsCompactRows(rows);

    assert.strictEqual(compactRows.length, 12);
    assert.deepStrictEqual(
      compactRows[0],
      {
        row_id: rows[0].row_id,
        year: rows[0].year,
        age: rows[0].age,
        liu_nian: rows[0].liu_nian,
        da_yun: rows[0].da_yun,
        tags: rows[0].tags,
      },
    );
    assert.ok(!Object.prototype.hasOwnProperty.call(compactRows[0], 'tag_reasons'));
  });

  it('provides a single tag legend and compact timeline summaries', () => {
    assert.ok(DS_TAG_LEGEND.EMOTION_RELATED.includes('情感'));

    const bazi = paiPan(2004, 6, 20, 19, 'male');
    const rows = addAnnualTagsToContext(
      bazi,
      'male',
      'emotion',
      buildAnnualContext(bazi, buildYearlyScaffold(2004, 75)).slice(0, 2),
    );
    const summary = buildDsTimelineSummary(
      rows.map((row, index) => ({
        ...row,
        score: 50 + index,
        analysis: '结构稳定测试',
        confidence: 0.8,
      })),
    );

    assert.deepStrictEqual(summary.map((row) => row.score), [50, 51]);
    assert.ok(!Object.prototype.hasOwnProperty.call(summary[0], 'tag_reasons'));
  });
});
