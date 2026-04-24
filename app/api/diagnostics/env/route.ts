import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function summarizeEnvValue(value: string | undefined) {
  const normalized = value?.trim() ?? '';

  return {
    exists: normalized.length > 0,
    length: normalized.length,
  };
}

export async function GET() {
  const apiKey = summarizeEnvValue(process.env.ALI_BAILIAN_API_KEY);
  const baseUrl = summarizeEnvValue(process.env.ALI_BAILIAN_BASE_URL);
  const modelName = summarizeEnvValue(process.env.ALI_BAILIAN_MODEL_NAME);

  return NextResponse.json({
    ok: apiKey.exists && baseUrl.exists,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      VERCEL_URL: process.env.VERCEL_URL ?? null,
    },
    bailian: {
      apiKey,
      baseUrl,
      modelName,
    },
    checks: {
      missing: [
        ...(apiKey.exists ? [] : ['ALI_BAILIAN_API_KEY']),
        ...(baseUrl.exists ? [] : ['ALI_BAILIAN_BASE_URL']),
      ],
    },
    timestamp: new Date().toISOString(),
  });
}
