import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

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

function summarize(data, status, elapsedMs) {
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
  };
}

function buildConsistency(runs) {
  const successful = runs.filter((run) => run.ok);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
