'use client';

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

interface Props {
  bazi: BaziData;
  gender: string;
}

export default function BaziDisplay({ bazi }: Props) {
  // 五行颜色映射（按用户指定）
  const wuXingColors: Record<string, string> = {
    '木': 'rgb(39, 64, 139)',      // 深蓝
    '火': 'rgb(205, 0, 0)',        // 红色
    '土': 'rgb(255, 215, 0)',      // 金黄
    '金': 'rgb(255, 255, 255)',    // 白色
    '水': 'rgb(0, 0, 0)'           // 黑色
  };

  // 五行文字颜色（针对浅色背景）
  const wuXingTextColors: Record<string, string> = {
    '木': 'rgb(39, 64, 139)',
    '火': 'rgb(205, 0, 0)',
    '土': 'rgb(180, 140, 0)',      // 金黄文字用深一点的颜色
    '金': 'rgb(100, 100, 100)',    // 白色背景用灰色文字
    '水': 'rgb(0, 0, 0)'
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: '0.5px solid rgb(26, 35, 126)',
        boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)',
        background: 'rgba(26, 35, 126, 0.02)'
      }}
    >
      <h3
        className="text-lg font-semibold mb-4 text-center"
        style={{ color: 'rgb(26, 35, 126)', fontFamily: 'STKaiti, KaiTi, serif' }}
      >
        八字排盘
      </h3>

      {/* 四柱展示 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
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
              className="text-2xl font-bold"
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
        className="text-center p-3 rounded mb-4"
        style={{
          background: 'rgba(26, 35, 126, 0.05)',
          border: '0.5px solid rgb(26, 35, 126)'
        }}
      >
        <span style={{ fontFamily: 'STKaiti, KaiTi, serif', fontSize: '14px' }}>
          日主：<strong style={{ color: wuXingColors[bazi.riZhuWuXing] || 'rgb(26, 35, 126)' }}>{bazi.riZhuWuXing}</strong>
          {bazi.riZhuYinYang} · 旺衰：<strong style={{ color: bazi.wangShuai === '身强' ? '#ef4444' : bazi.wangShuai === '身弱' ? '#3b82f6' : '#666' }}>{bazi.wangShuai}</strong>
        </span>
      </div>

      {/* 五行分布 */}
      <div className="mb-4">
        <div
          className="text-sm mb-2 text-center"
          style={{ fontFamily: 'STKaiti, KaiTi, serif', color: 'rgb(26, 35, 126)' }}
        >
          五行分布
        </div>
        <div className="flex justify-center items-end gap-3" style={{ minHeight: '60px' }}>
          {['木', '火', '土', '金', '水'].map(wx => {
            const count = Math.round(bazi.wuXingCount[wx] || 0);
            // 高度根据数量变化：数量0时15px，每增加1个增加12px，最高60px
            const height = Math.max(15, Math.min(count * 12 + 15, 60));
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
                    width: '28px',
                    height: `${height}px`,
                    background: wuXingColors[wx],
                    border: isWhite ? '1px solid rgb(200, 200, 200)' : 'none',
                    marginBottom: '4px',
                    boxShadow: wx === '土' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                  }}
                />
                <div style={{ color: wuXingTextColors[wx], fontWeight: 'bold' }}>{wx}</div>
                <div style={{ color: 'rgb(26, 35, 126)' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 大运 */}
      <div>
        <div
          className="text-sm mb-2 text-center"
          style={{ fontFamily: 'STKaiti, KaiTi, serif', color: 'rgb(26, 35, 126)' }}
        >
          大运（{bazi.qiYunAge}岁起运）
        </div>
        <div className="flex justify-center flex-wrap gap-2">
          {bazi.daYun.slice(0, 6).map((yun, idx) => (
            <div
              key={idx}
              className="px-3 py-1 rounded text-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '0.5px solid rgb(26, 35, 126)',
                fontFamily: 'STKaiti, KaiTi, serif'
              }}
            >
              <span style={{ color: 'rgb(26, 35, 126)' }}>{yun.gan}{yun.zhi}</span>
              <span style={{ color: '#888' }}>（{yun.age}岁）</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
