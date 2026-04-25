import type { Dimension, OHLC, Period } from './score-to-ohlc.ts';

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getVolatilityFactor(period: Period): number {
  switch (period) {
    case 'daily':
      return 0.65;
    case 'monthly':
      return 0.85;
    case 'yearly':
      return 1.05;
    default:
      return 0.85;
  }
}

function getDimensionAdjust(dimension: Dimension): number {
  switch (dimension) {
    case 'wealth':
      return 1;
    case 'life':
      return 0.72;
    case 'emotion':
      return 1.05;
    default:
      return 1;
  }
}

function compressHighScore(score: number) {
  if (score <= 84) {
    return score;
  }

  return 84 + (score - 84) * 0.45;
}

export function scoreToHepanOHLC(
  score: number,
  prevClose: number,
  dimension: Dimension,
  period: Period,
  index: number,
): OHLC {
  const seed = index * 1000 + score;
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  const random3 = seededRandom(seed + 2);

  const volatilityFactor = getVolatilityFactor(period);
  const dimensionAdjust = getDimensionAdjust(dimension);
  const minPrice = 5;
  const maxPrice = 92;
  const targetClose = clamp(compressHighScore(score), minPrice, 94);

  const scoreInfluence = clamp((targetClose - prevClose) * 0.42, -8, 8);
  const openNoise = (random1 - 0.5) * 3.8 * volatilityFactor;
  const open = clamp(prevClose + scoreInfluence + openNoise, minPrice, maxPrice);

  let close = targetClose;
  if (score <= 12) {
    close = clamp(score + 4, minPrice, 80);
  }

  if (Math.abs(close - open) < 2.5) {
    const direction = close >= open ? 1 : -1;
    close = clamp(open + direction * (2.5 + random1 * 1.8), minPrice, 94);
  }

  const baseVolatility = Math.abs(close - open) + 4.2;
  const adjustedVolatility = baseVolatility * volatilityFactor * dimensionAdjust;
  const upperWick = adjustedVolatility * (0.22 + random2 * 0.28);
  const lowerWick = adjustedVolatility * (0.22 + random3 * 0.28);

  let finalOpen = open;
  let finalClose = close;
  const minBodySize = 2.8;

  if (Math.abs(finalClose - finalOpen) < minBodySize) {
    if (finalClose >= 86) {
      finalOpen = clamp(finalClose - minBodySize - random1 * 1.2, minPrice, maxPrice);
    } else {
      const direction = finalClose >= finalOpen ? 1 : -1;
      finalClose = clamp(finalOpen + direction * (minBodySize + random1 * 1.2), minPrice, 94);
    }
  }

  let finalHigh = clamp(Math.max(finalOpen, finalClose) + upperWick, 8, 96);
  let finalLow = clamp(Math.min(finalOpen, finalClose) - lowerWick, 0, 88);

  const bodySize = Math.abs(finalClose - finalOpen);
  const maxWick = Math.max(bodySize * 1.6, 3.5);
  const upperWickSize = finalHigh - Math.max(finalOpen, finalClose);
  const lowerWickSize = Math.min(finalOpen, finalClose) - finalLow;

  if (upperWickSize > maxWick) {
    finalHigh = Math.max(finalOpen, finalClose) + maxWick;
  }

  if (lowerWickSize > maxWick) {
    finalLow = Math.min(finalOpen, finalClose) - maxWick;
  }

  return {
    o: Math.round(finalOpen),
    h: Math.round(finalHigh),
    l: Math.round(finalLow),
    c: Math.round(finalClose),
  };
}

export function scoresToHepanOHLCList(
  scores: number[],
  dimension: Dimension,
  period: Period,
  initialClose: number = 50,
) {
  const result: OHLC[] = [];
  let prevClose = initialClose;

  scores.forEach((score, index) => {
    const ohlc = scoreToHepanOHLC(score, prevClose, dimension, period, index);
    result.push(ohlc);
    prevClose = ohlc.c;
  });

  return result;
}
