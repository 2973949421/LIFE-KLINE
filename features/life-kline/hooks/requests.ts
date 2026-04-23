import type {
  FullAnalysisResult,
  BaziData,
  InstantBaziResult,
  HepanResult,
  PersonInput,
  RelationType,
  Dimension,
  Period,
  SingleMeta,
} from '@/features/life-kline/types';

async function parseJsonResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const errorBody = (await response.json()) as { error?: string };
      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch {
      // Fall back to status text when the body is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchSingleInstantBazi(input: {
  birth: string;
  birthTime: string;
  gender: 'male' | 'female';
}) {
  const response = await fetch('/api/life-kline/bazi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<{ bazi: BaziData; meta: SingleMeta }>(response);
}

export async function fetchSingleAnalysis(input: {
  birth: string;
  birthTime: string;
  gender: 'male' | 'female';
  dimension: Dimension;
  period: Period;
  targetYear?: number;
  targetMonth?: number;
}) {
  const response = await fetch('/api/life-kline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<FullAnalysisResult>(response);
}

export async function fetchHepanInstantBazi(input: {
  primary: PersonInput;
  secondary: PersonInput;
  relationType: RelationType;
  meetYear: number;
}) {
  const response = await fetch('/api/hepan-kline/bazi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<InstantBaziResult>(response);
}

export async function fetchHepanAnalysis(input: {
  primary: PersonInput;
  secondary: PersonInput;
  relationType: RelationType;
  meetYear: number;
  analysisYears: number;
  analysisYear: number;
  analysisYearMonth: string;
  dimension: Dimension;
  period: Period;
}) {
  const response = await fetch('/api/hepan-kline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<HepanResult>(response);
}
