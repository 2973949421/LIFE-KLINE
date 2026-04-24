import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SMA,
  EMA,
  MACD,
  RSI,
  KDJ,
  BOLL,
  getMATrend,
} from '../lib/domain/ta-math.ts';

describe('ta-math', () => {
  // Test data: 20 days of closing prices
  const testCloses = [50, 52, 51, 53, 55, 54, 56, 58, 57, 59, 61, 60, 62, 64, 63, 65, 67, 66, 68, 70];
  const testOHLC = testCloses.map((c) => ({
    h: c + 2,
    l: c - 2,
    c: c,
  }));

  describe('SMA', () => {
    it('returns correct length matching input', () => {
      const result = SMA(testCloses, 5);
      assert.strictEqual(result.length, testCloses.length, 'SMA output length should match input');
    });

    it('returns null for initial insufficient data points', () => {
      const result = SMA(testCloses, 5);
      assert.strictEqual(result[0], null, 'first 4 values should be null');
      assert.strictEqual(result[3], null, 'first 4 values should be null');
    });

    it('returns valid numbers after sufficient data', () => {
      const result = SMA(testCloses, 5);
      assert.ok(result[4] !== null, '5th value should be valid');
      assert.ok(typeof result[4] === 'number', 'should be number');
    });

    it('handles short arrays gracefully', () => {
      const shortData = [50, 52];
      const result = SMA(shortData, 5);
      assert.strictEqual(result.length, shortData.length, 'short data length preserved');
      assert.strictEqual(result[0], null, 'short data returns null');
      assert.strictEqual(result[1], null, 'short data returns null');
    });
  });

  describe('EMA', () => {
    it('returns correct length matching input', () => {
      const result = EMA(testCloses, 12);
      assert.strictEqual(result.length, testCloses.length, 'EMA output length should match input');
    });

    it('returns all valid numbers (no nulls)', () => {
      const result = EMA(testCloses, 12);
      for (const val of result) {
        assert.ok(typeof val === 'number', 'EMA should return all numbers');
      }
    });

    it('handles empty array', () => {
      const result = EMA([], 12);
      assert.strictEqual(result.length, 0, 'empty input returns empty output');
    });
  });

  describe('MACD', () => {
    it('returns correct length matching input', () => {
      const result = MACD(testCloses);
      assert.strictEqual(result.length, testCloses.length, 'MACD output length should match input');
    });

    it('returns valid structure with dif, dea, macd fields', () => {
      const result = MACD(testCloses);
      for (const item of result) {
        assert.ok(typeof item.dif === 'number', 'dif should be number');
        assert.ok(typeof item.dea === 'number', 'dea should be number');
        assert.ok(typeof item.macd === 'number', 'macd should be number');
      }
    });

    it('handles empty array', () => {
      const result = MACD([]);
      assert.strictEqual(result.length, 0, 'empty input returns empty output');
    });
  });

  describe('RSI', () => {
    it('returns correct length matching input', () => {
      const result = RSI(testCloses, 14);
      assert.strictEqual(result.length, testCloses.length, 'RSI output length should match input');
    });

    it('returns null for initial insufficient data', () => {
      const result = RSI(testCloses, 14);
      // RSI needs period+1 data points
      assert.strictEqual(result[0], null, 'initial values should be null');
    });

    it('returns values within 0-100 range when valid', () => {
      const result = RSI(testCloses, 6); // Use shorter period for short test data
      for (const val of result) {
        if (val !== null) {
          assert.ok(val >= 0 && val <= 100, 'RSI should be in 0-100 range');
        }
      }
    });
  });

  describe('KDJ', () => {
    it('returns correct length matching input', () => {
      const result = KDJ(testOHLC, 9, 3, 3);
      assert.strictEqual(result.length, testOHLC.length, 'KDJ output length should match input');
    });

    it('returns valid structure with k, d, j fields', () => {
      const result = KDJ(testOHLC, 6, 3, 3); // Use shorter period
      for (const item of result) {
        if (item.k !== null && item.d !== null && item.j !== null) {
          assert.ok(typeof item.k === 'number', 'k should be number when not null');
          assert.ok(typeof item.d === 'number', 'd should be number when not null');
          assert.ok(typeof item.j === 'number', 'j should be number when not null');
        }
      }
    });

    it('handles short arrays', () => {
      const shortOHLC = [{ h: 52, l: 48, c: 50 }];
      const result = KDJ(shortOHLC, 9, 3, 3);
      assert.strictEqual(result.length, shortOHLC.length, 'short data length preserved');
    });
  });

  describe('BOLL', () => {
    it('returns correct length matching input', () => {
      const result = BOLL(testCloses, 20, 2);
      assert.strictEqual(result.length, testCloses.length, 'BOLL output length should match input');
    });

    it('returns valid structure with upper, middle, lower fields', () => {
      const result = BOLL(testCloses, 10, 2); // Use shorter period
      for (const item of result) {
        if (item.upper !== null && item.middle !== null && item.lower !== null) {
          assert.ok(typeof item.upper === 'number', 'upper should be number');
          assert.ok(typeof item.middle === 'number', 'middle should be number');
          assert.ok(typeof item.lower === 'number', 'lower should be number');
          // Upper > middle > lower for valid BOLL
          assert.ok(item.upper >= item.middle, 'upper >= middle');
          assert.ok(item.middle >= item.lower, 'middle >= lower');
        }
      }
    });
  });

  describe('getMATrend', () => {
    it('returns valid trend type', () => {
      const trend = getMATrend(60, 55, 50);
      assert.ok(['bullish', 'bearish', 'neutral'].includes(trend), 'should return valid trend type');
    });

    it('returns bullish for ascending MA', () => {
      const trend = getMATrend(60, 55, 50);
      assert.strictEqual(trend, 'bullish', 'MA5 > MA10 > MA20 should be bullish');
    });

    it('returns bearish for descending MA', () => {
      const trend = getMATrend(50, 55, 60);
      assert.strictEqual(trend, 'bearish', 'MA5 < MA10 < MA20 should be bearish');
    });

    it('returns neutral for mixed or null values', () => {
      const trend1 = getMATrend(55, 55, 55);
      assert.strictEqual(trend1, 'neutral', 'equal MAs should be neutral');

      const trend2 = getMATrend(null, 55, 60);
      assert.strictEqual(trend2, 'neutral', 'null values should return neutral');
    });
  });
});
