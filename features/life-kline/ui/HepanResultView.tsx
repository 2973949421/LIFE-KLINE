import dynamic from 'next/dynamic';

import { DIMENSION_NAMES, PERIOD_NAMES } from '@/features/life-kline/constants';
import type { HepanResult } from '@/features/life-kline/types';

const KlineMainChart = dynamic(() => import('@/components/life-kline/KlineMainChart'), { ssr: false });
const MACDChart = dynamic(() => import('@/components/life-kline/MACDChart'), { ssr: false });
const KDJChart = dynamic(() => import('@/components/life-kline/KDJChart'), { ssr: false });
const RSIChart = dynamic(() => import('@/components/life-kline/RSIChart'), { ssr: false });
const BOLLChart = dynamic(() => import('@/components/life-kline/BOLLChart'), { ssr: false });
const AnalysisPanel = dynamic(() => import('@/components/life-kline/AnalysisPanel'), { ssr: false });
const DualBaziDisplay = dynamic(() => import('@/components/life-kline/DualBaziDisplay'), { ssr: false });
const ScoreDetailCard = dynamic(() => import('@/components/life-kline/ScoreDetailCard'), { ssr: false });

interface HepanResultViewProps {
  result: HepanResult;
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
  analysisYear: number;
  analysisYearMonth: string;
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="lab-body" style={{ color: 'var(--lab-muted)' }}>
      {children}
    </span>
  );
}

export function HepanResultView({
  result,
  selectedIndex,
  setSelectedIndex,
  analysisYear,
  analysisYearMonth,
}: HepanResultViewProps) {
  const fallbackMonth = parseInt(analysisYearMonth.split('-')[1] || '1', 10);
  const periodLabel = PERIOD_NAMES[result.period] ?? result.period ?? '未知周期';

  return (
    <div className="space-y-4">
      <div className="lab-panel rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
          <div>
            <MetaLabel>关系：</MetaLabel>
            <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
              {result.hepan_meta.relation_label}
            </span>
          </div>
          {result.period === 'yearly' ? (
            <>
              <div>
                <MetaLabel>相识年份：</MetaLabel>
                <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                  {result.hepan_meta.meet_year} 年
                </span>
              </div>
              {result.meet_year_analysis && (
                <div className="md:col-span-2">
                  <MetaLabel>AI 建议范围：</MetaLabel>
                  <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                    {result.meet_year_analysis.ai_suggested_range?.join('、')} 年
                  </span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--lab-muted)' }}>
                    （置信度: {(result.meet_year_analysis.confidence * 100).toFixed(0)}%）
                  </span>
                </div>
              )}
              <div>
                <MetaLabel>共同寿元：</MetaLabel>
                <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                  {result.hepan_meta.common_lifespan} 年
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <MetaLabel>分析时间：</MetaLabel>
                <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                  {result.period === 'monthly'
                    ? `${result.timeline?.[0]?.year || analysisYear} 年全年`
                    : `${result.timeline?.[0]?.year || analysisYearMonth.split('-')[0]} 年 ${result.timeline?.[0]?.month || fallbackMonth} 月`}
                </span>
              </div>
              <div className="md:col-span-2">
                <MetaLabel>相识年份：</MetaLabel>
                <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
                  {result.hepan_meta.meet_year} 年
                </span>
                <span className="ml-2 text-xs" style={{ color: 'var(--lab-muted)' }}>
                  （用于八字合盘参考）
                </span>
              </div>
            </>
          )}
          <div>
            <MetaLabel>维度：</MetaLabel>
            <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
              {DIMENSION_NAMES[result.dimension]}
            </span>
          </div>
          <div>
            <MetaLabel>周期：</MetaLabel>
            <span className="font-medium" style={{ color: 'var(--lab-fg)' }}>
              {periodLabel}
              {result.period !== 'yearly' && '（当前运势）'}
            </span>
          </div>
        </div>

        {result.period === 'yearly' && result.meet_year_analysis?.reasoning && (
          <div
            className="mt-3 rounded p-3 text-sm"
            style={{
              background: 'rgba(26, 35, 126, 0.06)',
              border: '1px solid rgba(26, 35, 126, 0.16)',
            }}
          >
            <span style={{ color: 'var(--lab-fg)' }}>
              温馨提示：{result.meet_year_analysis.reasoning}
            </span>
          </div>
        )}
      </div>

      <DualBaziDisplay
        primaryBazi={result.primary.bazi}
        primaryMeta={result.primary.meta}
        primaryName={result.primary.name}
        secondaryBazi={result.secondary.bazi}
        secondaryMeta={result.secondary.meta}
        secondaryName={result.secondary.name}
      />

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

      <AnalysisPanel globalAnalysis={result.global_analysis} technicalCommentary={result.technical_commentary} dimension={result.dimension} />

      <ScoreDetailCard
        adjustments={{
          wu_xing_sheng_ke: result.hepan_adjustments_detail?.wu_xing_sheng_ke,
          xing_sha_pei_he: result.hepan_adjustments_detail?.xing_sha_pei_he,
          da_yun_tong_bu: result.hepan_adjustments_detail?.da_yun_tong_bu,
          xingsu_relation: result.hepan_adjustments_detail?.xingsu_relation,
          total_adjustment: result.hepan_adjustments_detail?.total_adjustment || 0,
        }}
      />
    </div>
  );
}
