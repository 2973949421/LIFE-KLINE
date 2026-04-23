'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';

import { useHepanKline } from '@/features/life-kline/hooks/useHepanKline';
import { useSingleLifeKline } from '@/features/life-kline/hooks/useSingleLifeKline';
import { HepanInputPanel } from '@/features/life-kline/ui/HepanInputPanel';
import { HepanResultView } from '@/features/life-kline/ui/HepanResultView';
import { LoadingState } from '@/features/life-kline/ui/LoadingState';
import { ModeSidebar } from '@/features/life-kline/ui/ModeSidebar';
import { SingleInputPanel } from '@/features/life-kline/ui/SingleInputPanel';
import { SingleResultView } from '@/features/life-kline/ui/SingleResultView';
import type { KlineMode } from '@/features/life-kline/types';

const BaziDisplay = dynamic(() => import('@/components/life-kline/BaziDisplay'), { ssr: false });
const DualBaziDisplay = dynamic(() => import('@/components/life-kline/DualBaziDisplay'), { ssr: false });

export default function LifeKlineClient() {
  const [mode, setMode] = useState<KlineMode>('single');
  const single = useSingleLifeKline();
  const hepan = useHepanKline();

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--lab-border-strong)', borderWidth: '0.5px' }}>
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link
            href="/lab"
            className="lab-link mb-2 inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          >
            ← 返回实验场
          </Link>
          <h1 className="lab-body text-2xl font-bold" style={{ color: 'var(--lab-fg)' }}>
            人生 K 线图 / Life-Kline
          </h1>
          <p className="mt-1 text-sm text-gray-600" style={{ fontFamily: 'var(--font-times)' }}>
            将玄学定性叙事转成结构化的 K 线与指标视图
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl gap-4 px-4 py-6">
        <ModeSidebar mode={mode} setMode={setMode} />

        <div className="min-w-0 flex-1">
          {mode === 'single' ? (
            <SingleInputPanel
              birth={single.birth}
              setBirth={single.setBirth}
              birthTime={single.birthTime}
              setBirthTime={single.setBirthTime}
              gender={single.gender}
              setGender={single.setGender}
              dimension={single.dimension}
              setDimension={single.setDimension}
              period={single.period}
              setPeriod={single.setPeriod}
              targetYear={single.targetYear}
              setTargetYear={single.setTargetYear}
              targetMonth={single.targetMonth}
              setTargetMonth={single.setTargetMonth}
              loading={single.loading}
              error={single.error}
              submit={single.submit}
            />
          ) : (
            <HepanInputPanel
              primary={hepan.primary}
              setPrimary={hepan.setPrimary}
              secondary={hepan.secondary}
              setSecondary={hepan.setSecondary}
              relationType={hepan.relationType}
              setRelationType={hepan.setRelationType}
              meetYear={hepan.meetYear}
              setMeetYear={hepan.setMeetYear}
              analysisYears={hepan.analysisYears}
              setAnalysisYears={hepan.setAnalysisYears}
              analysisYear={hepan.analysisYear}
              setAnalysisYear={hepan.setAnalysisYear}
              analysisYearMonth={hepan.analysisYearMonth}
              setAnalysisYearMonth={hepan.setAnalysisYearMonth}
              dimension={hepan.dimension}
              setDimension={hepan.setDimension}
              period={hepan.period}
              setPeriod={hepan.setPeriod}
              loading={hepan.loading}
              error={hepan.error}
              submit={hepan.submit}
            />
          )}

          {mode === 'single' && single.loading && !single.result && <LoadingState text={single.loadingText} />}
          {mode === 'hepan' && hepan.loading && !hepan.result && <LoadingState text={hepan.loadingText} />}

          {mode === 'single' && single.instantBazi && !single.result && (
            <div className="space-y-4">
              <div className="lab-panel rounded-lg p-4">
                <div className="lab-body mb-2 text-center text-sm text-gray-600">
                  八字排盘结果已就绪，正在生成完整分析
                </div>
              </div>
              <BaziDisplay bazi={single.instantBazi} gender={single.instantMeta?.gender || single.gender} />
            </div>
          )}

          {mode === 'hepan' && hepan.instantBazi && !hepan.result && (
            <div className="mb-4">
              <div className="lab-card-soft mb-4 rounded-lg p-3 text-center">
                <span className="lab-body" style={{ color: 'var(--lab-fg)' }}>
                  双人八字排盘完成，正在生成合盘分析
                </span>
              </div>
              <DualBaziDisplay
                primaryBazi={hepan.instantBazi.primary.bazi}
                primaryMeta={hepan.instantBazi.primary.meta}
                primaryName={hepan.instantBazi.primary.name}
                secondaryBazi={hepan.instantBazi.secondary.bazi}
                secondaryMeta={hepan.instantBazi.secondary.meta}
                secondaryName={hepan.instantBazi.secondary.name}
                hepanPreview={hepan.instantBazi.hepan_preview}
              />
            </div>
          )}

          {mode === 'single' && single.result && !single.loading && (
            <SingleResultView
              result={single.result}
              instantBazi={single.instantBazi}
              instantMeta={single.instantMeta}
              gender={single.gender}
              selectedIndex={single.selectedIndex}
              setSelectedIndex={single.setSelectedIndex}
            />
          )}

          {mode === 'hepan' && hepan.result && !hepan.loading && (
            <HepanResultView
              result={hepan.result}
              selectedIndex={hepan.selectedIndex}
              setSelectedIndex={hepan.setSelectedIndex}
              analysisYear={hepan.analysisYear}
              analysisYearMonth={hepan.analysisYearMonth}
            />
          )}
        </div>
      </main>
    </div>
  );
}
