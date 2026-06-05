import test from 'node:test';
import assert from 'node:assert/strict';

import { paiPan } from '../lib/domain/bazi.ts';
import { buildAnnualContext, getLiuNianGanZhi } from '../lib/domain/life-kline/annual-context.ts';
import { buildYearlyScaffold, calculateChartLifespan } from '../lib/domain/life-kline/yearly-scaffold.ts';

test('calculateChartLifespan is deterministic and stays in 75-89 range', () => {
  const bazi = paiPan(2004, 6, 20, 19, 'male');
  const first = calculateChartLifespan(bazi, 'male');
  const second = calculateChartLifespan(bazi, 'male');

  assert.deepEqual(first, second);
  assert.ok(first.total_years >= 75);
  assert.ok(first.total_years <= 89);
  assert.match(first.reasoning, /图表寿元/);
});

test('buildYearlyScaffold creates continuous year age and row ids', () => {
  const scaffold = buildYearlyScaffold(2004, 89);

  assert.equal(scaffold.length, 89);
  assert.deepEqual(scaffold[0], { row_id: 'Y2004_A1', year: 2004, age: 1 });
  assert.deepEqual(scaffold[88], { row_id: 'Y2092_A89', year: 2092, age: 89 });
  assert.equal(new Set(scaffold.map((row) => row.row_id)).size, 89);
});

test('buildYearlyScaffold clamps total years into chart lifespan range', () => {
  assert.equal(buildYearlyScaffold(2000, 70).length, 75);
  assert.equal(buildYearlyScaffold(2000, 120).length, 89);
});

test('getLiuNianGanZhi uses 1984 JiaZi cycle', () => {
  assert.equal(getLiuNianGanZhi(1984), '甲子');
  assert.equal(getLiuNianGanZhi(2004), '甲申');
  assert.equal(getLiuNianGanZhi(2024), '甲辰');
});

test('buildAnnualContext maps scaffold rows to liu nian and da yun', () => {
  const bazi = paiPan(2004, 6, 20, 19, 'male');
  const scaffold = buildYearlyScaffold(2004, 89);
  const context = buildAnnualContext(bazi, scaffold);

  assert.equal(context.length, scaffold.length);
  assert.equal(context[0]?.row_id, 'Y2004_A1');
  assert.equal(context[0]?.liu_nian, '甲申');
  assert.ok(context.some((row) => row.da_yun));
  assert.deepEqual(
    context.map((row) => row.row_id),
    scaffold.map((row) => row.row_id),
  );
});
