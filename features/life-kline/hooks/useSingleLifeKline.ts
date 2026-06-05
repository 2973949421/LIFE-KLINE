import { useCallback, useEffect, useRef, useState } from 'react';
import { SINGLE_LOADING_TEXTS } from '@/features/life-kline/constants';
import { fetchSingleAnalysis, fetchSingleInstantBazi } from '@/features/life-kline/hooks/requests';
import type { BaziData, Dimension, FullAnalysisResult, Period, SingleMeta } from '@/features/life-kline/types';

export function useSingleLifeKline() {
  const [birth, setBirth] = useState('2004-06-20');
  const [birthTime, setBirthTime] = useState('19:30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dimension, setDimension] = useState<Dimension>('emotion');
  const [period, setPeriod] = useState<Period>('yearly');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [instantBazi, setInstantBazi] = useState<BaziData | null>(null);
  const [instantMeta, setInstantMeta] = useState<SingleMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      const startTimer = () => {
        const randomDelay = 5000 + Math.random() * 3000;
        loadingTimerRef.current = setTimeout(() => {
          setLoadingTextIndex((prev) => (prev + 1) % SINGLE_LOADING_TEXTS.length);
          startTimer();
        }, randomDelay);
      };
      startTimer();
    } else {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      // Reset loading text index asynchronously to avoid cascading renders
      setTimeout(() => setLoadingTextIndex(0), 0);
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [loading]);

  const submit = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setInstantBazi(null);
    setInstantMeta(null);

    try {
      const baziData = await fetchSingleInstantBazi({ birth, birthTime, gender });
      setInstantBazi(baziData.bazi);
      setInstantMeta(baziData.meta);

      const analysis = await fetchSingleAnalysis({
        birth,
        birthTime,
        gender,
        dimension,
        period,
        targetYear: period !== 'yearly' ? targetYear : undefined,
        targetMonth: period === 'daily' ? targetMonth : undefined,
      });

      setResult(analysis);
      if (analysis.bazi) {
        setInstantBazi(analysis.bazi);
        setInstantMeta(analysis.meta);
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('analysis failed');
      setError(err.message || 'analysis failed');
    } finally {
      setLoading(false);
    }
  }, [birth, birthTime, gender, dimension, period, targetYear, targetMonth]);

  return {
    birth,
    setBirth,
    birthTime,
    setBirthTime,
    gender,
    setGender,
    dimension,
    setDimension,
    period,
    setPeriod,
    targetYear,
    setTargetYear,
    targetMonth,
    setTargetMonth,
    result,
    instantBazi,
    instantMeta,
    loading,
    error,
    selectedIndex,
    setSelectedIndex,
    loadingText: SINGLE_LOADING_TEXTS[loadingTextIndex],
    submit,
  };
}
