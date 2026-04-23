import { useCallback, useEffect, useRef, useState } from 'react';
import { HEPAN_LOADING_TEXTS } from '@/features/life-kline/constants';
import { fetchHepanAnalysis, fetchHepanInstantBazi } from '@/features/life-kline/hooks/requests';
import type { Dimension, HepanResult, InstantBaziResult, Period, PersonInput, RelationType } from '@/features/life-kline/types';

export function useHepanKline() {
  const [primary, setPrimary] = useState<PersonInput>({
    birth: '1994-06-15',
    birthTime: '08:30',
    gender: 'male',
    name: '甲方',
  });
  const [secondary, setSecondary] = useState<PersonInput>({
    birth: '1996-03-20',
    birthTime: '14:00',
    gender: 'female',
    name: '乙方',
  });
  const [relationType, setRelationType] = useState<RelationType>('couple');
  const [meetYear, setMeetYear] = useState(2020);
  const [analysisYears, setAnalysisYears] = useState(50);
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());
  const [analysisYearMonth, setAnalysisYearMonth] = useState(
    `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
  );
  const [dimension, setDimension] = useState<Dimension>('emotion');
  const [period, setPeriod] = useState<Period>('yearly');
  const [result, setResult] = useState<HepanResult | null>(null);
  const [instantBazi, setInstantBazi] = useState<InstantBaziResult | null>(null);
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
          setLoadingTextIndex((prev) => (prev + 1) % HEPAN_LOADING_TEXTS.length);
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

    try {
      const baziData = await fetchHepanInstantBazi({
        primary,
        secondary,
        relationType,
        meetYear,
      });
      setInstantBazi(baziData);

      const analysis = await fetchHepanAnalysis({
        primary,
        secondary,
        relationType,
        meetYear,
        analysisYears,
        analysisYear,
        analysisYearMonth,
        dimension,
        period,
      });
      setResult(analysis);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('analysis failed');
      setError(err.message || 'analysis failed');
    } finally {
      setLoading(false);
    }
  }, [primary, secondary, relationType, meetYear, analysisYears, analysisYear, analysisYearMonth, dimension, period]);

  return {
    primary,
    setPrimary,
    secondary,
    setSecondary,
    relationType,
    setRelationType,
    meetYear,
    setMeetYear,
    analysisYears,
    setAnalysisYears,
    analysisYear,
    setAnalysisYear,
    analysisYearMonth,
    setAnalysisYearMonth,
    dimension,
    setDimension,
    period,
    setPeriod,
    result,
    instantBazi,
    loading,
    error,
    selectedIndex,
    setSelectedIndex,
    loadingText: HEPAN_LOADING_TEXTS[loadingTextIndex],
    submit,
  };
}
