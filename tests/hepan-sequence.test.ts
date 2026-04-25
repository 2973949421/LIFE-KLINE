import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHepanAiNarrativeLookup,
  buildHepanTimelineScaffold,
  computeLocalHepanBaseScore,
  getHepanTimelineKey,
} from '../lib/domain/hepan-local-timeline.ts';
import { buildHepanScoreSequence } from '../lib/domain/hepan-sequence.ts';
import { scoresToHepanOHLCList } from '../lib/domain/score-to-ohlc-hepan.ts';

test('monthly hepan sequence avoids long high-score plateaus', () => {
  const sequence = buildHepanScoreSequence(
    Array.from({ length: 12 }, (_, index) => ({
      baseScore: 92,
      year: 2026,
      month: index + 1,
      agePrimary: 32,
      ageSecondary: 30,
      rawAdjustments: {
        wu_xing_sheng_ke: { score: 12 },
        xing_sha_pei_he: { score: 10 },
        da_yun_tong_bu: { score: 8 },
        xingsu_relation: { score: 9 },
      },
    })),
    'monthly',
    'emotion',
    'couple',
  );

  const scores = sequence.map((entry) => entry.score);
  const highScores = scores.filter((score) => score >= 88);
  let longestRun = 0;
  let currentRun = 0;

  scores.forEach((score) => {
    if (score >= 88) {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  });

  assert.ok(highScores.length <= 5, `expected at most 5 high-score months, got ${highScores.length}`);
  assert.ok(longestRun <= 5, `expected no extreme high-score run, got ${longestRun}`);
  assert.ok(Math.max(...scores) - Math.min(...scores) >= 6, 'expected visible monthly fluctuation');
});

test('hepan OHLC mapping compresses repeated high scores', () => {
  const candles = scoresToHepanOHLCList(
    [92, 93, 94, 95, 96, 97, 98, 94, 93, 92, 91, 90],
    'emotion',
    'monthly',
    50,
  );

  const closes = candles.map((candle) => candle.c);
  assert.ok(Math.max(...closes) <= 94, 'hepan close should stay below hard ceiling');
  assert.ok(closes.filter((close) => close >= 90).length <= 4, 'hepan OHLC should avoid long 90+ close plateaus');
});

test('yearly hepan sequence does not open with a one-way spike then flat plateau', () => {
  const sequence = buildHepanScoreSequence(
    Array.from({ length: 10 }, (_, index) => ({
      baseScore: 74,
      year: 2020 + index,
      agePrimary: 30 + index,
      ageSecondary: 28 + index,
      rawAdjustments: {
        wu_xing_sheng_ke: { score: 11 },
        xing_sha_pei_he: { score: 9 },
        da_yun_tong_bu: { score: 7 },
        xingsu_relation: { score: 8 },
      },
    })),
    'yearly',
    'emotion',
    'couple',
  );

  const scores = sequence.map((entry) => entry.score);
  const firstJump = (scores[1] ?? scores[0] ?? 50) - (scores[0] ?? 50);
  const plateauCount = scores.filter((score) => score >= 72).length;
  const range = Math.max(...scores) - Math.min(...scores);
  const risingSegments = scores.slice(1).filter((score, index) => score > (scores[index] ?? score)).length;
  const fallingSegments = scores.slice(1).filter((score, index) => score < (scores[index] ?? score)).length;

  assert.ok(firstJump <= 8, `expected opening move to stay controlled, got ${firstJump}`);
  assert.ok(plateauCount <= 7, `expected yearly sequence to avoid near-flat high plateau, got ${plateauCount}`);
  assert.ok(range >= 8, `expected visible pullback/recovery range, got ${range}`);
  assert.ok(risingSegments >= 1, `expected at least one recovery segment, got ${risingSegments}`);
  assert.ok(fallingSegments >= 2, `expected some pullback segments, got ${fallingSegments}`);
});

test('hepan OHLC bodies are not uniformly tiny', () => {
  const candles = scoresToHepanOHLCList(
    [68, 74, 79, 76, 72, 75, 70, 66, 69, 73, 71, 67],
    'emotion',
    'monthly',
    58,
  );

  const bodySizes = candles.map((candle) => Math.abs(candle.c - candle.o));
  const averageBody = bodySizes.reduce((sum, value) => sum + value, 0) / bodySizes.length;
  const meaningfulBodies = bodySizes.filter((size) => size >= 3).length;

  assert.ok(averageBody >= 3, `expected average body size >= 3, got ${averageBody}`);
  assert.ok(meaningfulBodies >= 6, `expected at least 6 candles with body >= 3, got ${meaningfulBodies}`);
});

test('local hepan scaffold drives monthly timeline independently from AI score', () => {
  const scaffold = buildHepanTimelineScaffold({
    period: 'monthly',
    meetYear: 2020,
    analysisYear: 2026,
    primaryBirthYear: 1990,
    secondaryBirthYear: 1992,
  });

  assert.equal(scaffold.length, 12);
  assert.deepEqual(
    scaffold.slice(0, 3).map((entry) => entry.month),
    [1, 2, 3],
  );

  const localScores = scaffold.map((entry) =>
    computeLocalHepanBaseScore(entry, {
      period: 'monthly',
      dimension: 'emotion',
      relationType: 'couple',
      meetYear: 2020,
    }),
  );

  const scoreRange = Math.max(...localScores) - Math.min(...localScores);
  assert.ok(scoreRange >= 6, `expected local monthly scores to have their own rhythm, got ${scoreRange}`);
  assert.ok(localScores.every((score) => score >= 22 && score <= 84), 'expected local scores to stay in bounded range');
});

test('AI narrative lookup keeps text but does not need score to match scaffold points', () => {
  const lookup = buildHepanAiNarrativeLookup([
    {
      year: 2026,
      month: 1,
      analysis: '年初互动回暖',
      confidence: 0.82,
      score: 99,
    },
    {
      year: 2026,
      month: 2,
      analysis: '节奏转为平稳',
      confidence: 0.76,
      score: 12,
    },
  ]);

  const january = lookup.get(getHepanTimelineKey({ year: 2026, month: 1 }));
  const february = lookup.get(getHepanTimelineKey({ year: 2026, month: 2 }));
  const march = lookup.get(getHepanTimelineKey({ year: 2026, month: 3 }));

  assert.equal(january?.analysis, '年初互动回暖');
  assert.equal(february?.analysis, '节奏转为平稳');
  assert.equal(march, undefined);
});
