'use client';

interface GlobalAnalysis {
  pattern_summary?: string;
  dimension_analysis?: string;
  hepen_analysis?: string;
  key_insights?: string;
  best_periods?: string[];
  caution_periods?: string[];
  peak_periods?: Array<string | { start_age: number; end_age: number; reason: string }>;
  risk_periods?: Array<string | { start_age: number; end_age: number; reason: string }>;
  timeline_milestones?: Array<{
    period: string;
    title: string;
    description: string;
  }>;
  risk_opportunity?: {
    risks?: Array<{
      period: string;
      description: string;
    }>;
    opportunities?: Array<{
      period: string;
      description: string;
    }>;
  };
  specific_suggestions?: {
    marriage?: string;
    cooperation?: string;
    investment?: string;
  };
}

interface TechnicalCommentary {
  ma_trend?: string;
  macd_signal?: string;
  kdj_signal?: string;
  rsi_signal?: string;
  boll_signal?: string;
}

interface Props {
  globalAnalysis?: GlobalAnalysis;
  technicalCommentary?: TechnicalCommentary;
  dimension: 'wealth' | 'life' | 'emotion';
}

const DIMENSION_TITLES = {
  wealth: '财富运势分析',
  life: '生命健康分析',
  emotion: '情感婚姻分析',
};

const NAVY = 'rgb(26, 35, 126)';
const MUTED = '#666';
const PANEL_BG = 'rgb(255, 251, 240)';
const BORDER = 'rgba(26, 35, 126, 0.2)';
const TECH_BG = 'rgba(26, 35, 126, 0.03)';

function formatPeriod(period: string | { start_age: number; end_age: number; reason: string }) {
  if (typeof period === 'string') {
    return period;
  }

  return `${period.start_age}-${period.end_age}岁：${period.reason}`;
}

function TextBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
      {children}
    </p>
  );
}

function CommentaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="p-2 rounded text-sm" style={{ background: TECH_BG }}>
      <span className="font-medium" style={{ color: NAVY }}>
        {label}：
      </span>
      <span style={{ color: '#374151' }}>{value}</span>
    </div>
  );
}

export default function AnalysisPanel({ globalAnalysis, technicalCommentary, dimension }: Props) {
  if (!globalAnalysis && !technicalCommentary) {
    return null;
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: `0.5px solid ${NAVY}`,
        boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)',
        background: PANEL_BG,
        color: NAVY,
      }}
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>
        {DIMENSION_TITLES[dimension]}
      </h2>

      {globalAnalysis?.pattern_summary && (
        <div
          className="mb-4 p-3 rounded text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.1) 0%, rgba(26, 35, 126, 0.05) 100%)',
            border: `1px solid ${BORDER}`,
          }}
        >
          <span className="text-xl font-bold tracking-wide" style={{ color: NAVY }}>
            {globalAnalysis.pattern_summary}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {globalAnalysis && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: NAVY }}>
                深度分析
              </h3>
              <TextBlock>{globalAnalysis.hepen_analysis || globalAnalysis.dimension_analysis}</TextBlock>
            </div>

            {globalAnalysis.key_insights && (
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: NAVY }}>
                  关键洞察
                </h3>
                <TextBlock>{globalAnalysis.key_insights}</TextBlock>
              </div>
            )}

            {(globalAnalysis.peak_periods?.length || globalAnalysis.risk_periods?.length) && (
              <div className="grid grid-cols-2 gap-2">
                {globalAnalysis.peak_periods && globalAnalysis.peak_periods.length > 0 && (
                  <div className="p-2 rounded text-xs" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                    <div className="font-medium mb-1" style={{ color: '#15803d' }}>
                      巅峰时期
                    </div>
                    {globalAnalysis.peak_periods.map((period) => (
                      <div key={formatPeriod(period)} style={{ color: MUTED }}>
                        {formatPeriod(period)}
                      </div>
                    ))}
                  </div>
                )}
                {globalAnalysis.risk_periods && globalAnalysis.risk_periods.length > 0 && (
                  <div className="p-2 rounded text-xs" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <div className="font-medium mb-1" style={{ color: '#b91c1c' }}>
                      风险时期
                    </div>
                    {globalAnalysis.risk_periods.map((period) => (
                      <div key={formatPeriod(period)} style={{ color: MUTED }}>
                        {formatPeriod(period)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {globalAnalysis.risk_opportunity && (
              <div className="grid grid-cols-2 gap-2">
                {globalAnalysis.risk_opportunity.risks && globalAnalysis.risk_opportunity.risks.length > 0 && (
                  <div
                    className="p-2 rounded text-xs"
                    style={{ background: 'rgba(220, 38, 38, 0.05)', border: '0.5px solid rgba(220, 38, 38, 0.2)' }}
                  >
                    <div className="font-medium mb-1" style={{ color: '#b91c1c' }}>
                      风险提示
                    </div>
                    {globalAnalysis.risk_opportunity.risks.map((risk) => (
                      <div key={`${risk.period}-${risk.description}`} className="mb-1" style={{ color: MUTED }}>
                        <span className="font-bold" style={{ color: '#dc2626' }}>
                          {risk.period}：
                        </span>
                        {risk.description}
                      </div>
                    ))}
                  </div>
                )}
                {globalAnalysis.risk_opportunity.opportunities && globalAnalysis.risk_opportunity.opportunities.length > 0 && (
                  <div
                    className="p-2 rounded text-xs"
                    style={{ background: 'rgba(22, 163, 74, 0.05)', border: '0.5px solid rgba(22, 163, 74, 0.2)' }}
                  >
                    <div className="font-medium mb-1" style={{ color: '#15803d' }}>
                      机会窗口
                    </div>
                    {globalAnalysis.risk_opportunity.opportunities.map((opportunity) => (
                      <div key={`${opportunity.period}-${opportunity.description}`} className="mb-1" style={{ color: MUTED }}>
                        <span className="font-bold" style={{ color: '#16a34a' }}>
                          {opportunity.period}：
                        </span>
                        {opportunity.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {technicalCommentary && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium" style={{ color: NAVY }}>
              技术指标解读
            </h3>
            <CommentaryRow label="均线" value={technicalCommentary.ma_trend} />
            <CommentaryRow label="MACD" value={technicalCommentary.macd_signal} />
            <CommentaryRow label="KDJ" value={technicalCommentary.kdj_signal} />
            <CommentaryRow label="RSI" value={technicalCommentary.rsi_signal} />
            <CommentaryRow label="BOLL" value={technicalCommentary.boll_signal} />
          </div>
        )}
      </div>

      {globalAnalysis?.timeline_milestones && globalAnalysis.timeline_milestones.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: `0.5px solid ${BORDER}` }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: NAVY }}>
            时间线关键节点
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {globalAnalysis.timeline_milestones.map((milestone) => (
              <div
                key={`${milestone.period}-${milestone.title}`}
                className="p-2 rounded"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: `0.5px solid ${BORDER}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: 'rgba(26, 35, 126, 0.1)',
                      color: NAVY,
                    }}
                  >
                    {milestone.period}
                  </span>
                  <span className="font-medium text-sm" style={{ color: NAVY }}>
                    {milestone.title}
                  </span>
                </div>
                <div className="text-xs" style={{ color: MUTED }}>
                  {milestone.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {globalAnalysis?.specific_suggestions && (
        <div className="mt-4 pt-4" style={{ borderTop: `0.5px solid ${BORDER}` }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: NAVY }}>
            具体建议
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {globalAnalysis.specific_suggestions.marriage && (
              <div className="p-2 rounded text-center" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                <div className="text-xs mb-1" style={{ color: '#888' }}>
                  婚姻建议
                </div>
                <div className="text-sm" style={{ color: NAVY }}>
                  {globalAnalysis.specific_suggestions.marriage}
                </div>
              </div>
            )}
            {globalAnalysis.specific_suggestions.cooperation && (
              <div className="p-2 rounded text-center" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                <div className="text-xs mb-1" style={{ color: '#888' }}>
                  合作建议
                </div>
                <div className="text-sm" style={{ color: NAVY }}>
                  {globalAnalysis.specific_suggestions.cooperation}
                </div>
              </div>
            )}
            {globalAnalysis.specific_suggestions.investment && (
              <div className="p-2 rounded text-center" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                <div className="text-xs mb-1" style={{ color: '#888' }}>
                  投资建议
                </div>
                <div className="text-sm" style={{ color: NAVY }}>
                  {globalAnalysis.specific_suggestions.investment}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t text-xs text-center" style={{ borderColor: BORDER, color: '#6b7280' }}>
        以上分析仅供娱乐参考，不构成任何人生决策建议。命运掌握在自己手中。
      </div>
    </div>
  );
}
