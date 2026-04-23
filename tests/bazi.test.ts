import test from 'node:test';
import assert from 'node:assert/strict';

import { paiPan, getCurrentDaYun } from '../lib/domain/bazi.ts';

test('paiPan returns stable formatted pillars and dayun', () => {
  const result = paiPan(2000, 1, 1, 12, 'male');

  assert.equal(typeof result.formatted.nianZhu, 'string');
  assert.equal(typeof result.formatted.yueZhu, 'string');
  assert.equal(typeof result.formatted.riZhu, 'string');
  assert.equal(typeof result.formatted.shiZhu, 'string');
  assert.ok(result.daYun.length > 0);
  assert.ok(result.qiYunAge >= 0);
});

test('getCurrentDaYun returns the matching decade bucket', () => {
  const result = paiPan(1998, 6, 18, 9, 'female');
  const current = getCurrentDaYun(result, result.qiYunAge + 3);

  assert.ok(current);
  assert.ok(current ? current.age <= result.qiYunAge + 3 : false);
});
