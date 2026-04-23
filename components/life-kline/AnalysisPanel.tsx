'use client';

interface GlobalAnalysis {
  pattern_summary?: string;
  dimension_analysis?: string;
  hepen_analysis?: string;
  key_insights?: string;
  best_periods?: string[];
  caution_periods?: string[];
  peak_periods?: string[];
  risk_periods?: string[];
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
  emotion: '情感婚姻分析'
};

export default function AnalysisPanel({ globalAnalysis, technicalCommentary, dimension }: Props) {
  if (!globalAnalysis && !technicalCommentary) {
    return null;
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: '0.5px solid rgb(26, 35, 126)',
        boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)',
        background: 'rgb(255, 251, 240)'
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
      >
        {DIMENSION_TITLES[dimension]}
      </h2>

      {/* 形态总评（突出显示） */}
      {globalAnalysis?.pattern_summary && (
        <div
          className="mb-4 p-3 rounded text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.1) 0%, rgba(26, 35, 126, 0.05) 100%)',
            border: '1px solid rgba(26, 35, 126, 0.2)'
          }}
        >
          <span
            className="text-xl font-bold tracking-wide"
            style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
          >
            {globalAnalysis.pattern_summary}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左侧：全局分析 */}
        {globalAnalysis && (
          <div className="space-y-4">
            {/* 维度分析 */}
            <div>
              <h3
                className="text-sm font-medium mb-2"
                style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
              >
                深度分析
              </h3>
              <p
                className="text-sm leading-relaxed text-gray-700"
                style={{ fontFamily: 'STKaiti, KaiTi, serif' }}
              >
                {globalAnalysis.hepen_analysis || globalAnalysis.dimension_analysis}
              </p>
            </div>

            {/* 关键洞察 */}
            {globalAnalysis.key_insights && (
              <div>
                <h3
                  className="text-sm font-medium mb-2"
                  style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  关键洞察
                </h3>
                <p
                  className="text-sm leading-relaxed text-gray-700"
                  style={{ fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  💡 {globalAnalysis.key_insights}
                </p>
              </div>
            )}

            {/* 巅峰/风险时期 */}
            {(globalAnalysis.peak_periods?.length || globalAnalysis.risk_periods?.length) && (
              <div className="grid grid-cols-2 gap-2">
                {globalAnalysis.peak_periods && globalAnalysis.peak_periods.length > 0 && (
                  <div
                    className="p-2 rounded text-xs"
                    style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                  >
                    <div className="font-medium text-green-700 mb-1">📈 巅峰时期</div>
                    {globalAnalysis.peak_periods.map((p, i) => (
                      <div key={i} className="text-gray-600">
                        {p}
                      </div>
                    ))}
                  </div>
                )}
                {globalAnalysis.risk_periods && globalAnalysis.risk_periods.length > 0 && (
                  <div
                    className="p-2 rounded text-xs"
                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <div className="font-medium text-red-700 mb-1">⚠️ 风险时期</div>
                    {globalAnalysis.risk_periods.map((p, i) => (
                      <div key={i} className="text-gray-600">
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 风险与机会 */}
            {globalAnalysis.risk_opportunity && (
              <div className="grid grid-cols-2 gap-2">
                {globalAnalysis.risk_opportunity.risks && globalAnalysis.risk_opportunity.risks.length > 0 && (
                  <div
                    className="p-2 rounded text-xs"
                    style={{ background: 'rgba(220, 38, 38, 0.05)', border: '0.5px solid rgba(220, 38, 38, 0.2)' }}
                  >
                    <div className="font-medium text-red-700 mb-1">⚠️ 风险提示</div>
                    {globalAnalysis.risk_opportunity.risks.map((r, i) => (
                      <div key={i} className="text-gray-600 mb-1">
                        <span className="font-bold text-red-600">{r.period}：</span>
                        {r.description}
                      </div>
                    ))}
                  </div>
                )}
                {globalAnalysis.risk_opportunity.opportunities && globalAnalysis.risk_opportunity.opportunities.length > 0 && (
                  <div
                    className="p-2 rounded text-xs"
                    style={{ background: 'rgba(22, 163, 74, 0.05)', border: '0.5px solid rgba(22, 163, 74, 0.2)' }}
                  >
                    <div className="font-medium text-green-700 mb-1">✅ 机会窗口</div>
                    {globalAnalysis.risk_opportunity.opportunities.map((o, i) => (
                      <div key={i} className="text-gray-600 mb-1">
                        <span className="font-bold text-green-600">{o.period}：</span>
                        {o.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 右侧：技术解读 */}
        {technicalCommentary && (
          <div className="space-y-3">
            <h3
              className="text-sm font-medium"
              style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
            >
              技术指标解读
            </h3>

            {technicalCommentary.ma_trend && (
              <div
                className="p-2 rounded text-sm"
                style={{ background: 'rgba(26, 35, 126, 0.03)' }}
              >
                <span className="font-medium" style={{ color: 'rgb(26, 35, 126)' }}>均线：</span>
                <span className="text-gray-700" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                  {technicalCommentary.ma_trend}
                </span>
              </div>
            )}

            {technicalCommentary.macd_signal && (
              <div
                className="p-2 rounded text-sm"
                style={{ background: 'rgba(26, 35, 126, 0.03)' }}
              >
                <span className="font-medium" style={{ color: 'rgb(26, 35, 126)' }}>MACD：</span>
                <span className="text-gray-700" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                  {technicalCommentary.macd_signal}
                </span>
              </div>
            )}

            {technicalCommentary.kdj_signal && (
              <div
                className="p-2 rounded text-sm"
                style={{ background: 'rgba(26, 35, 126, 0.03)' }}
              >
                <span className="font-medium" style={{ color: 'rgb(26, 35, 126)' }}>KDJ：</span>
                <span className="text-gray-700" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                  {technicalCommentary.kdj_signal}
                </span>
              </div>
            )}

            {technicalCommentary.rsi_signal && (
              <div
                className="p-2 rounded text-sm"
                style={{ background: 'rgba(26, 35, 126, 0.03)' }}
              >
                <span className="font-medium" style={{ color: 'rgb(26, 35, 126)' }}>RSI：</span>
                <span className="text-gray-700" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                  {technicalCommentary.rsi_signal}
                </span>
              </div>
            )}

            {technicalCommentary.boll_signal && (
              <div
                className="p-2 rounded text-sm"
                style={{ background: 'rgba(26, 35, 126, 0.03)' }}
              >
                <span className="font-medium" style={{ color: 'rgb(26, 35, 126)' }}>BOLL：</span>
                <span className="text-gray-700" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                  {technicalCommentary.boll_signal}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 时间线关键节点 */}
      {globalAnalysis?.timeline_milestones && globalAnalysis.timeline_milestones.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid rgba(26, 35, 126, 0.2)' }}>
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
          >
            📈 时间线关键节点
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {globalAnalysis.timeline_milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="p-2 rounded"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '0.5px solid rgba(26, 35, 126, 0.2)'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: 'rgba(26, 35, 126, 0.1)',
                      color: 'rgb(26, 35, 126)',
                      fontFamily: 'STKaiti, KaiTi, serif'
                    }}
                  >
                    {milestone.period}
                  </span>
                  <span
                    className="font-medium text-sm"
                    style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                  >
                    {milestone.title}
                  </span>
                </div>
                <div
                  className="text-xs"
                  style={{ color: '#666', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  {milestone.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 具体建议 */}
      {globalAnalysis?.specific_suggestions && (
        <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid rgba(26, 35, 126, 0.2)' }}>
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
          >
            💡 具体建议
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {globalAnalysis.specific_suggestions.marriage && (
              <div
                className="p-2 rounded text-center"
                style={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <div
                  className="text-xs mb-1"
                  style={{ color: '#888', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  💒 婚姻建议
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  {globalAnalysis.specific_suggestions.marriage}
                </div>
              </div>
            )}
            {globalAnalysis.specific_suggestions.cooperation && (
              <div
                className="p-2 rounded text-center"
                style={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <div
                  className="text-xs mb-1"
                  style={{ color: '#888', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  🤝 合作建议
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  {globalAnalysis.specific_suggestions.cooperation}
                </div>
              </div>
            )}
            {globalAnalysis.specific_suggestions.investment && (
              <div
                className="p-2 rounded text-center"
                style={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <div
                  className="text-xs mb-1"
                  style={{ color: '#888', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  💰 投资建议
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  {globalAnalysis.specific_suggestions.investment}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 免责声明 */}
      <div
        className="mt-4 pt-3 border-t text-xs text-gray-500 text-center"
        style={{ borderColor: 'rgba(26, 35, 126, 0.2)' }}
      >
        ⚠️ 以上分析仅供娱乐参考，不构成任何人生决策建议。命运掌握在自己手中。
      </div>
    </div>
  );
}
