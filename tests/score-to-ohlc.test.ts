import test from 'node:test';
import assert from 'node:assert/strict';

import { scoreToOHLC, scoresToOHLCList } from '../lib/domain/score-to-ohlc.ts';

test('scoreToOHLC is deterministic for the same inputs', () => {
  const first = scoreToOHLC(72, 50, 'wealth', 'monthly', 3);
  const second = scoreToOHLC(72, 50, 'wealth', 'monthly', 3);

  assert.deepEqual(first, second);
});

test('scoreToOHLC keeps values within expected bounds', () => {
  const candle = scoreToOHLC(95, 88, 'emotion', 'yearly', 7);

  assert.ok(candle.o >= 0 && candle.o <= 100);
  assert.ok(candle.h >= 0 && candle.h <= 100);
  assert.ok(candle.l >= 0 && candle.l <= 100);
  assert.ok(candle.c >= 0 && candle.c <= 100);
  assert.ok(candle.h >= Math.max(candle.o, candle.c));
  assert.ok(candle.l <= Math.min(candle.o, candle.c));
});

test('scoresToOHLCList preserves list length and close chaining', () => {
  const list = scoresToOHLCList([40, 55, 70], 'life', 'daily', 50);

  assert.equal(list.length, 3);
  assert.equal(typeof list[0]?.c, 'number');
  assert.equal(typeof list[1]?.c, 'number');
});
