import type { Dimension, Period, PersonInput, RelationType } from '@/features/life-kline/types';

interface HepanInputPanelProps {
  primary: PersonInput;
  setPrimary: (value: PersonInput) => void;
  secondary: PersonInput;
  setSecondary: (value: PersonInput) => void;
  relationType: RelationType;
  setRelationType: (value: RelationType) => void;
  meetYear: number;
  setMeetYear: (value: number) => void;
  analysisYears: number;
  setAnalysisYears: (value: number) => void;
  analysisYear: number;
  setAnalysisYear: (value: number) => void;
  analysisYearMonth: string;
  setAnalysisYearMonth: (value: string) => void;
  dimension: Dimension;
  setDimension: (value: Dimension) => void;
  period: Period;
  setPeriod: (value: Period) => void;
  loading: boolean;
  error: string;
  submit: () => void;
}

export function HepanInputPanel(props: HepanInputPanelProps) {
  const {
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
    loading,
    error,
    submit,
  } = props;

  return (
    <div className="lab-panel mb-6 rounded-lg p-4">
      <h2 className="lab-body mb-4 text-lg font-semibold" style={{ color: 'var(--lab-fg)' }}>
        双人信息输入
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        {[
          { title: '主盘（本人）', value: primary, setValue: setPrimary, placeholder: '甲方' },
          { title: '辅盘（对方）', value: secondary, setValue: setSecondary, placeholder: '乙方' },
        ].map((item) => (
          <div key={item.title} className="lab-panel-soft rounded-lg p-4">
            <h3 className="lab-body mb-3 text-base font-semibold" style={{ color: 'var(--lab-fg)' }}>
              {item.title}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lab-body mb-1 block text-xs">姓名/代号</label>
                <input
                  type="text"
                  value={item.value.name}
                  onChange={(e) => item.setValue({ ...item.value, name: e.target.value })}
                  className="lab-control text-sm"
                  placeholder={item.placeholder}
                />
              </div>
              <div>
                <label className="lab-body mb-1 block text-xs">性别</label>
                <select
                  value={item.value.gender}
                  onChange={(e) => item.setValue({ ...item.value, gender: e.target.value as 'male' | 'female' })}
                  className="lab-control text-sm"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div>
                <label className="lab-body mb-1 block text-xs">出生日期</label>
                <input
                  type="date"
                  value={item.value.birth}
                  onChange={(e) => item.setValue({ ...item.value, birth: e.target.value })}
                  className="lab-control text-sm"
                />
              </div>
              <div>
                <label className="lab-body mb-1 block text-xs">出生时间</label>
                <input
                  type="time"
                  value={item.value.birthTime}
                  onChange={(e) => item.setValue({ ...item.value, birthTime: e.target.value })}
                  className="lab-control text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div>
          <label className="lab-body mb-1 block text-sm">关系类型</label>
          <select value={relationType} onChange={(e) => setRelationType(e.target.value as RelationType)} className="lab-control">
            <option value="couple">情侣/夫妻</option>
            <option value="business">商业伙伴</option>
            <option value="parent_child">亲子</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label className="lab-body mb-1 block text-sm">相识年份</label>
          <input
            type="number"
            value={meetYear}
            onChange={(e) => setMeetYear(parseInt(e.target.value, 10))}
            min={1900}
            max={2100}
            className="lab-control"
          />
        </div>
        {period === 'yearly' && (
          <div>
            <label className="lab-body mb-1 block text-sm">分析年数</label>
            <input
              type="number"
              value={analysisYears}
              onChange={(e) => setAnalysisYears(Math.max(10, Math.min(100, parseInt(e.target.value, 10) || 50)))}
              min={10}
              max={100}
              className="lab-control"
            />
          </div>
        )}
        {period === 'monthly' && (
          <div>
            <label className="lab-body mb-1 block text-sm">分析年份</label>
            <input
              type="number"
              value={analysisYear}
              onChange={(e) => setAnalysisYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
              min={1900}
              max={2100}
              className="lab-control"
            />
          </div>
        )}
        {period === 'daily' && (
          <div>
            <label className="lab-body mb-1 block text-sm">分析年月</label>
            <input type="month" value={analysisYearMonth} onChange={(e) => setAnalysisYearMonth(e.target.value)} className="lab-control" />
          </div>
        )}
        <div>
          <label className="lab-body mb-1 block text-sm">分析维度</label>
          <select value={dimension} onChange={(e) => setDimension(e.target.value as Dimension)} className="lab-control">
            <option value="emotion">情感婚姻</option>
            <option value="wealth">财富运势</option>
            <option value="life">生命健康</option>
          </select>
        </div>
        <div>
          <label className="lab-body mb-1 block text-sm">时间周期</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="lab-control">
            <option value="yearly">年线（AI 推算）</option>
            <option value="monthly">月线（12 个月）</option>
            <option value="daily">日线（30 天）</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={submit} disabled={loading} className="lab-primary-button font-medium">
            {loading ? '合盘中...' : '开始合盘'}
          </button>
        </div>
      </div>
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>
  );
}
