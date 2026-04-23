'use client';

import { WUXING_COLORS, WUXING_TEXT_COLORS } from '@/lib/domain/wuxing-colors';

interface BaziData {
  nianZhu: string;
  yueZhu: string;
  riZhu: string;
  shiZhu: string;
  riZhuWuXing: string;
  riZhuYinYang: string;
  wangShuai: string;
  wuXingCount: Record<string, number>;
  shiShen: {
    nian: { gan: string; zhi: string[] };
    yue: { gan: string; zhi: string[] };
    ri: { gan: string; zhi: string[] };
    shi: { gan: string; zhi: string[] };
  };
  daYun: Array<{
    age: number;
    gan: string;
    zhi: string;
    startYear: number;
    endYear: number;
  }>;
  qiYunAge: number;
}

interface HepanPreview {
  relationType: string;
  relationLabel: string;
  meetYear: number | null;
  wuXingShengKe: { score: number; reason: string };
  xingShaPeiHe: { score: number; reason: string };
  xingsu?: {
    // 本命星宿关系
    benming: {
      primary: string;
      secondary: string;
      relation: {
        type: string;
        typeName: string;
        distance: string;
        distanceName: string;
        role?: string;
        description: string;
      };
    };
    // 值日星宿关系
    zhir: {
      primary: string;
      secondary: string;
      relation: {
        type: string;
        typeName: string;
        distance: string;
        distanceName: string;
        role?: string;
        description: string;
      };
    };
    adjustment: { score: number; reason: string };
  };
}

interface Props {
  primaryBazi: BaziData;
  primaryMeta: {
    birthYear: number;
    birthTime?: string;
    birthHour?: string;
    hourAttribute?: string;
    gender: string;
  };
  primaryName: string;
  secondaryBazi: BaziData;
  secondaryMeta: {
    birthYear: number;
    birthTime?: string;
    birthHour?: string;
    hourAttribute?: string;
    gender: string;
  };
  secondaryName: string;
  hepanPreview?: HepanPreview;
}

export default function DualBaziDisplay({
  primaryBazi,
  primaryMeta,
  primaryName,
  secondaryBazi,
  secondaryMeta,
  secondaryName,
  hepanPreview
}: Props) {
  // 渲染单个八字卡片
  const renderBaziCard = (
    bazi: BaziData,
    meta: { birthYear: number; birthTime?: string; birthHour?: string; hourAttribute?: string; gender: string },
    name: string,
    isPrimary: boolean
  ) => (
    <div
      className="rounded-lg p-4"
      style={{
        border: '0.5px solid rgb(26, 35, 126)',
        boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)',
        background: 'rgba(26, 35, 126, 0.02)'
      }}
    >
      {/* 名称和基本信息 */}
      <div className="flex justify-between items-center mb-3">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
        >
          {isPrimary ? '主盘' : '辅盘'} · {name}
        </h3>
        <span className="text-sm text-gray-600" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
          {meta.gender === 'male' ? '男' : '女'} · {meta.birthYear}年
          {meta.birthHour && ` · ${meta.birthHour}`}
        </span>
      </div>

      {/* 四柱展示 */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: '年柱', value: bazi.nianZhu, shiShen: bazi.shiShen.nian.gan },
          { label: '月柱', value: bazi.yueZhu, shiShen: bazi.shiShen.yue.gan },
          { label: '日柱', value: bazi.riZhu, shiShen: '日主' },
          { label: '时柱', value: bazi.shiZhu, shiShen: bazi.shiShen.shi.gan }
        ].map((zhu, idx) => (
          <div
            key={idx}
            className="text-center p-2 rounded"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '0.5px solid rgb(26, 35, 126)'
            }}
          >
            <div
              className="text-xs mb-1"
              style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
            >
              {zhu.label}
            </div>
            <div
              className="text-xl font-bold"
              style={{ fontFamily: 'STKaiti, KaiTi, serif', color: 'rgb(26, 35, 126)' }}
            >
              {zhu.value}
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: '#666', fontFamily: 'STKaiti, KaiTi, serif' }}
            >
              {zhu.shiShen}
            </div>
          </div>
        ))}
      </div>

      {/* 日主信息 */}
      <div
        className="text-center p-2 rounded mb-3"
        style={{
          background: 'rgba(26, 35, 126, 0.05)',
          border: '0.5px solid rgb(26, 35, 126)'
        }}
      >
        <span style={{ fontFamily: 'STKaiti, KaiTi, serif', fontSize: '13px' }}>
          日主：<strong style={{ color: WUXING_COLORS[bazi.riZhuWuXing] || 'rgb(26, 35, 126)' }}>{bazi.riZhuWuXing}</strong>
          {bazi.riZhuYinYang} · 旺衰：<strong style={{ color: bazi.wangShuai === '身强' ? '#ef4444' : bazi.wangShuai === '身弱' ? '#3b82f6' : '#666' }}>{bazi.wangShuai}</strong>
        </span>
      </div>

      {/* 五行分布 */}
      <div className="mb-3">
        <div
          className="text-xs mb-1 text-center"
          style={{ fontFamily: 'STKaiti, KaiTi, serif', color: 'rgb(26, 35, 126)' }}
        >
          五行分布
        </div>
        <div className="flex justify-center items-end gap-2" style={{ minHeight: '50px' }}>
          {['木', '火', '土', '金', '水'].map(wx => {
            const count = Math.round(bazi.wuXingCount[wx] || 0);
            const height = Math.max(12, Math.min(count * 10 + 12, 50));
            const isWhite = wx === '金';
            return (
              <div
                key={wx}
                className="text-center text-xs"
                style={{ fontFamily: 'STKaiti, KaiTi, serif' }}
              >
                <div
                  className="mx-auto rounded transition-all duration-300"
                  style={{
                    width: '24px',
                    height: `${height}px`,
                    background: WUXING_COLORS[wx],
                    border: isWhite ? '1px solid rgb(200, 200, 200)' : 'none',
                    marginBottom: '3px'
                  }}
                />
                <div style={{ color: WUXING_TEXT_COLORS[wx], fontWeight: 'bold' }}>{wx}</div>
                <div style={{ color: 'rgb(26, 35, 126)', fontSize: '11px' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 大运 */}
      <div>
        <div
          className="text-xs mb-1 text-center"
          style={{ fontFamily: 'STKaiti, KaiTi, serif', color: 'rgb(26, 35, 126)' }}
        >
          大运（{bazi.qiYunAge}岁起运）
        </div>
        <div className="flex justify-center flex-wrap gap-1">
          {bazi.daYun.slice(0, 5).map((yun, idx) => (
            <div
              key={idx}
              className="px-2 py-0.5 rounded text-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '0.5px solid rgb(26, 35, 126)',
                fontFamily: 'STKaiti, KaiTi, serif'
              }}
            >
              <span style={{ color: 'rgb(26, 35, 126)' }}>{yun.gan}{yun.zhi}</span>
              <span style={{ color: '#888' }}>({yun.age}岁)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 双人八字展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBaziCard(primaryBazi, primaryMeta, primaryName, true)}
        {renderBaziCard(secondaryBazi, secondaryMeta, secondaryName, false)}
      </div>

      {/* 合盘预览（如果有） */}
      {hepanPreview && (
        <div
          className="rounded-lg p-4"
          style={{
            border: '0.5px solid rgb(26, 35, 126)',
            background: 'rgba(26, 35, 126, 0.03)'
          }}
        >
          <h3
            className="text-md font-semibold mb-3 text-center"
            style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
          >
            合盘预览 · {hepanPreview.relationLabel}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* 五行生克 */}
            <div
              className="p-3 rounded text-center"
              style={{ background: 'rgba(255, 255, 255, 0.8)' }}
            >
              <div
                className="text-xs mb-1"
                style={{ fontFamily: 'STKaiti, KaiTi, serif', color: '#666' }}
              >
                五行生克
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{
                  color: hepanPreview.wuXingShengKe.score > 0 ? '#dc2626' :
                         hepanPreview.wuXingShengKe.score < 0 ? '#16a34a' : 'rgb(26, 35, 126)'
                }}
              >
                {hepanPreview.wuXingShengKe.score > 0 ? '+' : ''}{hepanPreview.wuXingShengKe.score}
              </div>
              <div
                className="text-xs"
                style={{ fontFamily: 'STKaiti, KaiTi, serif', color: '#888' }}
              >
                {hepanPreview.wuXingShengKe.reason}
              </div>
            </div>

            {/* 星煞配合 */}
            <div
              className="p-3 rounded text-center"
              style={{ background: 'rgba(255, 255, 255, 0.8)' }}
            >
              <div
                className="text-xs mb-1"
                style={{ fontFamily: 'STKaiti, KaiTi, serif', color: '#666' }}
              >
                星煞配合
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{
                  color: hepanPreview.xingShaPeiHe.score > 0 ? '#dc2626' :
                         hepanPreview.xingShaPeiHe.score < 0 ? '#16a34a' : 'rgb(26, 35, 126)'
                }}
              >
                {hepanPreview.xingShaPeiHe.score > 0 ? '+' : ''}{hepanPreview.xingShaPeiHe.score}
              </div>
              <div
                className="text-xs"
                style={{ fontFamily: 'STKaiti, KaiTi, serif', color: '#888' }}
              >
                {hepanPreview.xingShaPeiHe.reason}
              </div>
            </div>

            {/* 星宿关系 */}
            {hepanPreview.xingsu && (
              <>
                {/* 本命星宿关系 */}
                <div
                  className="p-3 rounded text-center"
                  style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ fontFamily: 'STKaiti, KaiTi, serif', color: '#666' }}
                  >
                    本命星宿关系
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span
                      className="text-lg font-bold"
                      style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                    >
                      {hepanPreview.xingsu.benming.primary}宿
                    </span>
                    <span style={{ color: '#888' }}>↔</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                    >
                      {hepanPreview.xingsu.benming.secondary}宿
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span
                      className="text-lg font-bold"
                      style={{
                        color: 'rgb(26, 35, 126)',
                        fontFamily: 'STKaiti, KaiTi, serif'
                      }}
                    >
                      {hepanPreview.xingsu.benming.relation.typeName}
                      {hepanPreview.xingsu.benming.relation.role && `（${hepanPreview.xingsu.benming.relation.role}）`}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(26, 35, 126, 0.1)',
                        color: 'rgb(26, 35, 126)',
                        fontFamily: 'STKaiti, KaiTi, serif'
                      }}
                    >
                      {hepanPreview.xingsu.benming.relation.distanceName}
                    </span>
                  </div>
                </div>

                {/* 值日星宿关系 */}
                <div
                  className="p-3 rounded text-center"
                  style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ fontFamily: 'STKaiti, KaiTi, serif', color: '#666' }}
                  >
                    值日星宿关系
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span
                      className="text-lg font-bold"
                      style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                    >
                      {hepanPreview.xingsu.zhir.primary}宿
                    </span>
                    <span style={{ color: '#888' }}>↔</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
                    >
                      {hepanPreview.xingsu.zhir.secondary}宿
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span
                      className="text-lg font-bold"
                      style={{
                        color: 'rgb(26, 35, 126)',
                        fontFamily: 'STKaiti, KaiTi, serif'
                      }}
                    >
                      {hepanPreview.xingsu.zhir.relation.typeName}
                      {hepanPreview.xingsu.zhir.relation.role && `（${hepanPreview.xingsu.zhir.relation.role}）`}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(26, 35, 126, 0.1)',
                        color: 'rgb(26, 35, 126)',
                        fontFamily: 'STKaiti, KaiTi, serif'
                      }}
                    >
                      {hepanPreview.xingsu.zhir.relation.distanceName}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}