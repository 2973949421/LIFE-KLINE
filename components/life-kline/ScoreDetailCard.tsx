'use client';

import { useState } from 'react';

interface AdjustmentItem {
  score: number;
  reason: string;
  details?: string[];
}

interface ScoreDetail {
  label: string;
  icon: string;
  adjustment: AdjustmentItem;
}

interface Props {
  adjustments: {
    wu_xing_sheng_ke?: AdjustmentItem;
    xing_sha_pei_he?: AdjustmentItem;
    da_yun_tong_bu?: AdjustmentItem;
    xingsu_relation?: AdjustmentItem;
    total_adjustment: number;
  };
  baseScore?: number;
  finalScore?: number;
}

export default function ScoreDetailCard({ adjustments, baseScore, finalScore }: Props) {
  const [expanded, setExpanded] = useState(true);

  // 构建评分细则列表
  const scoreDetails: ScoreDetail[] = [
    {
      label: '五行生克',
      icon: '五行',
      adjustment: adjustments.wu_xing_sheng_ke || { score: 0, reason: '未计算', details: [] }
    },
    {
      label: '星煞配合',
      icon: '星煞',
      adjustment: adjustments.xing_sha_pei_he || { score: 0, reason: '未计算', details: [] }
    },
    {
      label: '大运同步',
      icon: '大运',
      adjustment: adjustments.da_yun_tong_bu || { score: 0, reason: '未计算', details: [] }
    },
    {
      label: '星宿关系',
      icon: '星宿',
      adjustment: adjustments.xingsu_relation || { score: 0, reason: '未计算', details: [] }
    }
  ];

  // 分数颜色：正数红色，负数绿色
  const getScoreColor = (score: number) => {
    if (score > 0) return '#dc2626';  // 红色
    if (score < 0) return '#16a34a';  // 绿色
    return '#6b7280';  // 灰色
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '0.5px solid rgb(26, 35, 126)',
        boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)'
      }}
    >
      {/* 标题栏（可点击展开/收纳） */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{
          background: 'rgba(26, 35, 126, 0.05)',
          borderBottom: expanded ? '0.5px solid rgba(26, 35, 126, 0.2)' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
        >
          📊 评分细则
          <span
            className="text-sm font-normal"
            style={{ color: '#888' }}
          >
            （点击{expanded ? '收起' : '展开'}）
          </span>
        </h3>
        <div className="flex items-center gap-4">
          {baseScore !== undefined && finalScore !== undefined && (
            <div className="text-sm" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
              <span style={{ color: '#888' }}>基础分 </span>
              <span style={{ color: 'rgb(26, 35, 126)', fontWeight: 'bold' }}>{baseScore}</span>
              <span style={{ color: '#888' }}> → 最终分 </span>
              <span style={{ color: 'rgb(26, 35, 126)', fontWeight: 'bold' }}>{finalScore}</span>
            </div>
          )}
          <span
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: '20px',
              color: 'rgb(26, 35, 126)'
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="p-4">
          {/* 评分项目列表 */}
          <div className="space-y-3">
            {scoreDetails.map((detail, idx) => (
              <div
                key={idx}
                className="p-3 rounded"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '0.5px solid rgba(26, 35, 126, 0.2)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* 图标 */}
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold"
                      style={{
                        background: 'rgba(26, 35, 126, 0.1)',
                        color: 'rgb(26, 35, 126)',
                        fontFamily: 'STKaiti, KaiTi, serif'
                      }}
                    >
                      {detail.icon}
                    </div>
                    {/* 标签 */}
                    <div
                      className="font-medium"
                      style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                    >
                      {detail.label}
                    </div>
                  </div>
                  {/* 分数 */}
                  <div
                    className="text-2xl font-bold min-w-[80px] text-right"
                    style={{
                      color: getScoreColor(detail.adjustment.score),
                      fontFamily: 'Times New Roman, serif'
                    }}
                  >
                    {detail.adjustment.score > 0 ? '+' : ''}{detail.adjustment.score.toFixed(2)}
                  </div>
                </div>
                {/* 摘要原因 */}
                <div
                  className="text-sm mb-2"
                  style={{ color: '#666', fontFamily: 'STKaiti, KaiTi, serif' }}
                >
                  {detail.adjustment.reason}
                </div>
                {/* 详细明细 */}
                {detail.adjustment.details && detail.adjustment.details.length > 0 && (
                  <div
                    className="text-xs p-2 rounded"
                    style={{
                      background: 'rgba(26, 35, 126, 0.03)',
                      fontFamily: 'STKaiti, KaiTi, serif'
                    }}
                  >
                    <div className="font-medium mb-1" style={{ color: 'rgb(26, 35, 126)' }}>明细：</div>
                    {detail.adjustment.details.map((d, i) => (
                      <div key={i} style={{ color: '#888' }}>• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 总调整分 */}
          <div
            className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '0.5px solid rgba(26, 35, 126, 0.2)' }}
          >
            <span
              className="text-lg"
              style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
            >
              综合调整
            </span>
            <span
              className="text-3xl font-bold"
              style={{
                color: getScoreColor(adjustments.total_adjustment),
                fontFamily: 'Times New Roman, serif'
              }}
            >
              {adjustments.total_adjustment > 0 ? '+' : ''}{adjustments.total_adjustment.toFixed(2)}
            </span>
          </div>

          {/* 图例说明 */}
          <div
            className="mt-4 pt-3 flex items-center justify-center gap-6 text-xs"
            style={{ borderTop: '0.5px solid rgba(26, 35, 126, 0.2)', color: '#888' }}
          >
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: '#dc2626' }} />
              <span style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>正数（加分）</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: '#16a34a' }} />
              <span style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>负数（减分）</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}