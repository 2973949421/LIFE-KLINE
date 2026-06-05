import { describe, it } from 'node:test';
import assert from 'node:assert';
import { paiPan } from '../lib/domain/bazi.ts';
import { buildAnnualContext } from '../lib/domain/life-kline/annual-context.ts';
import { addAnnualTagsToContext } from '../lib/domain/life-kline/annual-tags.ts';
import { buildYearlyScaffold } from '../lib/domain/life-kline/yearly-scaffold.ts';

describe('annual tags', () => {
  it('adds deterministic lightweight tags without changing scaffold facts', () => {
    const bazi = paiPan(2004, 6, 20, 19, 'male');
    const scaffold = buildYearlyScaffold(2004, 81);
    const annualContext = buildAnnualContext(bazi, scaffold);

    const first = addAnnualTagsToContext(bazi, 'male', 'emotion', annualContext);
    const second = addAnnualTagsToContext(bazi, 'male', 'emotion', annualContext);

    assert.deepStrictEqual(first, second);
    assert.strictEqual(first.length, scaffold.length);
    assert.strictEqual(first[0].row_id, 'Y2004_A1');
    assert.strictEqual(first[0].year, 2004);
    assert.strictEqual(first[0].age, 1);
  });

  it('adds emotion tags for emotion dimension and keeps tags as prompt hints', () => {
    const bazi = paiPan(2004, 6, 20, 19, 'male');
    const rows = addAnnualTagsToContext(bazi, 'male', 'emotion', buildAnnualContext(bazi, buildYearlyScaffold(2004, 12)));

    assert.ok(rows.every((row) => row.tags.includes('EMOTION_RELATED')));
    assert.ok(rows.every((row) => typeof row.tag_reasons.EMOTION_RELATED === 'string'));
    assert.ok(rows.every((row) => !Object.prototype.hasOwnProperty.call(row, 'score')));
  });

  it('marks da yun changes and relation-specific years when present', () => {
    const bazi = paiPan(2004, 6, 20, 19, 'male');
    const rows = addAnnualTagsToContext(bazi, 'male', 'wealth', buildAnnualContext(bazi, buildYearlyScaffold(2004, 81)));
    const allTags = new Set(rows.flatMap((row) => row.tags));

    assert.ok(allTags.has('DA_YUN_CHANGE'));
    assert.ok(allTags.has('WEALTH_RELATED'));
    assert.ok(allTags.has('LIFE_PRESSURE_RELATED'));
  });
});
