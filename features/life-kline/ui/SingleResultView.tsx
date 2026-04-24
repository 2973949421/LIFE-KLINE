import dynamic from 'next/dynamic';

import { DIMENSION_NAMES, PERIOD_NAMES } from '@/features/life-kline/constants';
import type { BaziData, FullAnalysisResult, SingleMeta } from '@/features/life-kline/types';

const KlineMainChart = dynamic(() => import('@/components/life-kline/KlineMainChart'), { ssr: false });
const MACDChart = dynamic(() => import('@/components/life-kline/MACDChart'), { ssr: false });
const KDJChart = dynamic(() => import('@/components/life-kline/KDJChart'), { ssr: false });
const RSIChart = dynamic(() => import('@/components/life-kline/RSIChart'), { ssr: false });
const BOLLChart = dynamic(() => import('@/components/life-kline/BOLLChart'), { ssr: false });
const AnalysisPanel = dynamic(() => import('@/components/life-kline/AnalysisPanel'), { ssr: false });
const BaziDisplay = dynamic(() => import('@/components/life-kline/BaziDisplay'), { ssr: false });

interface SingleResultViewProps {
  result: FullAnalysisResult;
  instantBazi: BaziData | null;
  instantMeta: SingleMeta | null;
  gender: 'male' | 'female';
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
}

export function SingleResultView({
  result,
  instantBazi,
  instantMeta,
  gender,
  selectedIndex,
  setSelectedIndex,
}: SingleResultViewProps) {
  const periodLabel = PERIOD_NAMES[result.period] ?? result.period ?? '未知周期';

  return (
    <div className="space-y-4">
      <div className="lab-panel rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="lab-body" style={{ color: 'var(--lab-muted)' }}>
              维度：
            </span>
            <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
              {DIMENSION_NAMES[result.dimension]}
            </span>
          </div>
          <div>
            <span className="lab-body" style={{ color: 'var(--lab-muted)' }}>
              周期：
            </span>
            <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
              {periodLabel}
            </span>
          </div>
          {result.lifespan && (
            <div>
              <span className="lab-body" style={{ color: 'var(--lab-muted)' }}>
                推算寿元：
              </span>
              <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                {result.lifespan.total_years} 年
              </span>
            </div>
          )}
          {result.meta.birthHour && (
            <div>
              <span className="lab-body" style={{ color: 'var(--lab-muted)' }}>
                出生时辰：
              </span>
              <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                {result.meta.birthHour} ({result.meta.hourAttribute})
              </span>
            </div>
          )}
        </div>
      </div>

      {(result.bazi || instantBazi) && (
        <BaziDisplay bazi={result.bazi || instantBazi!} gender={result.meta?.gender || instantMeta?.gender || gender} />
      )}

      <KlineMainChart
        data={result.timeline}
        indicators={result.technical_indicators}
        period={result.period}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />

      <div className="grid grid-cols-2 gap-4">
        <MACDChart data={result.technical_indicators.macd} timeline={result.timeline} crossSignals={result.cross_signals} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <KDJChart data={result.technical_indicators.kdj} timeline={result.timeline} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <RSIChart data={result.technical_indicators.rsi} timeline={result.timeline} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <BOLLChart data={result.technical_indicators.boll} timeline={result.timeline} indicators={result.technical_indicators} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      </div>

      <AnalysisPanel
        globalAnalysis={result.global_analysis}
        technicalCommentary={result.technical_commentary}
        dimension={result.dimension}
      />
    </div>
  );
}
