import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const cwd = process.cwd();
const routePath = path.join(cwd, '.next/server/app/api/life-kline/route.js');

const DEFAULT_REQUEST = {
  birth: '2004-06-20',
  birthTime: '19:30',
  gender: 'male',
  dimension: 'emotion',
  period: 'yearly',
};

function readArgNumber(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  const value = Number(process.argv[index + 1]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function loadLocalEnv() {
  const envPath = path.join(cwd, '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function buildAccuracySummary(data) {
  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
  const scores = timeline.map((row) => Number(row.score)).filter((score) => Number.isFinite(score));

  if (!scores.length) {
    return {
      score_min: null,
      score_max: null,
      score_avg: null,
      top_score_ages: [],
      low_score_ages: [],
      peak_periods: data?.global_analysis?.peak_periods ?? [],
      risk_periods: data?.global_analysis?.risk_periods ?? [],
      first_20_year_trend: 'unknown',
      middle_year_trend: 'unknown',
      late_year_trend: 'unknown',
    };
  }

  const sortedHigh = [...timeline]
    .filter((row) => Number.isFinite(Number(row.score)))
    .sort((a, b) => Number(b.score) - Number(a.score));
  const sortedLow = [...timeline]
    .filter((row) => Number.isFinite(Number(row.score)))
    .sort((a, b) => Number(a.score) - Number(b.score));

  return {
    score_min: Math.min(...scores),
    score_max: Math.max(...scores),
    score_avg: Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)),
    top_score_ages: sortedHigh.slice(0, 5).map((row) => row.age),
    low_score_ages: sortedLow.slice(0, 5).map((row) => row.age),
    peak_periods: data?.global_analysis?.peak_periods ?? [],
    risk_periods: data?.global_analysis?.risk_periods ?? [],
    first_20_year_trend: describeTrend(timeline.filter((row) => row.age >= 1 && row.age <= 20)),
    middle_year_trend: describeTrend(timeline.filter((row) => row.age >= 21 && row.age <= 55)),
    late_year_trend: describeTrend(timeline.filter((row) => row.age >= 56)),
  };
}

function describeTrend(rows) {
  const scores = rows.map((row) => Number(row.score)).filter((score) => Number.isFinite(score));
  if (scores.length < 2) {
    return 'unknown';
  }

  const delta = scores.at(-1) - scores[0];
  if (delta >= 8) {
    return 'up';
  }
  if (delta <= -8) {
    return 'down';
  }
  return 'flat';
}

export function summarize(data, status, elapsedMs) {
  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
  const body = JSON.stringify(data ?? {});

  return {
    status,
    ok: status === 200,
    elapsed_ms: elapsedMs,
    dimension: data?.dimension,
    period: data?.period,
    timeline_count: timeline.length,
    first_row_id: timeline[0]?.row_id,
    first_year: timeline[0]?.year,
    first_age: timeline[0]?.age,
    last_row_id: timeline.at(-1)?.row_id,
    last_year: timeline.at(-1)?.year,
    last_age: timeline.at(-1)?.age,
    lifespan: data?.lifespan?.total_years,
    has_global_analysis: Boolean(data?.global_analysis),
    has_technical_commentary: Boolean(data?.technical_commentary),
    contains_reasoning_text: /reasoning_content|thinking|推理过程/.test(body),
    sample_scores: timeline.slice(0, 5).map((row) => row.score),
    accuracy_summary: buildAccuracySummary(data),
  };
}

export function buildConsistency(runs) {
  const successful = runs.filter((run) => run.ok);
  const elapsed = successful.map((run) => run.elapsed_ms).sort((a, b) => a - b);
  const signatures = successful.map((run) =>
    [
      run.timeline_count,
      run.first_row_id,
      run.first_year,
      run.first_age,
      run.last_row_id,
      run.last_year,
      run.last_age,
      run.lifespan,
    ].join('|'),
  );

  return {
    requested_runs: runs.length,
    successful_runs: successful.length,
    structure_consistent: signatures.length > 0 && new Set(signatures).size === 1,
    reasoning_polluted_runs: successful.filter((run) => run.contains_reasoning_text).length,
    avg_elapsed_ms: elapsed.length
      ? Number((elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length).toFixed(2))
      : null,
    p50_elapsed_ms: elapsed.length ? elapsed[Math.floor((elapsed.length - 1) / 2)] : null,
    max_elapsed_ms: successful.length ? Math.max(...successful.map((run) => run.elapsed_ms)) : null,
    min_elapsed_ms: successful.length ? Math.min(...successful.map((run) => run.elapsed_ms)) : null,
  };
}

async function callRoute(post) {
  const started = Date.now();
  const request = new Request('http://localhost/api/life-kline', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(DEFAULT_REQUEST),
  });
  const response = await post(request);
  const text = await response.text();
  const elapsedMs = Date.now() - started;

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return {
      status: response.status,
      ok: false,
      elapsed_ms: elapsedMs,
      parse_error: error instanceof Error ? error.message : String(error),
      preview: text.slice(0, 500),
    };
  }

  if (response.status !== 200) {
    return {
      status: response.status,
      ok: false,
      elapsed_ms: elapsedMs,
      error: data?.error,
      details: typeof data?.details === 'string' ? data.details.slice(0, 500) : undefined,
    };
  }

  return summarize(data, response.status, elapsedMs);
}

async function main() {
  const runs = readArgNumber('--runs', 3);
  loadLocalEnv();

  if (!fs.existsSync(routePath)) {
    throw new Error('Built route not found. Run pnpm build before pnpm test:live:life-kline.');
  }

  const route = require(routePath);
  const post = route?.routeModule?.userland?.POST;
  if (typeof post !== 'function') {
    throw new Error('Built life-kline route does not expose POST.');
  }

  const results = [];
  for (let index = 0; index < runs; index += 1) {
    results.push(await callRoute(post));
  }

  console.log(JSON.stringify({ runs: results, consistency: buildConsistency(results) }, null, 2));

  if (!results.every((run) => run.ok) || !buildConsistency(results).structure_consistent) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
