import type { Dimension, Period } from '@/features/life-kline/types';

interface SingleInputPanelProps {
  birth: string;
  setBirth: (value: string) => void;
  birthTime: string;
  setBirthTime: (value: string) => void;
  gender: 'male' | 'female';
  setGender: (value: 'male' | 'female') => void;
  dimension: Dimension;
  setDimension: (value: Dimension) => void;
  period: Period;
  setPeriod: (value: Period) => void;
  targetYear: number;
  setTargetYear: (value: number) => void;
  targetMonth: number;
  setTargetMonth: (value: number) => void;
  loading: boolean;
  error: string;
  submit: () => void;
}

export function SingleInputPanel(props: SingleInputPanelProps) {
  const {
    birth,
    setBirth,
    birthTime,
    setBirthTime,
    gender,
    setGender,
    dimension,
    setDimension,
    period,
    setPeriod,
    targetYear,
    setTargetYear,
    targetMonth,
    setTargetMonth,
    loading,
    error,
    submit,
  } = props;

  return (
    <div className="lab-panel mb-6 rounded-lg p-4">
      <h2 className="lab-body mb-4 text-lg font-semibold" style={{ color: 'var(--lab-fg)' }}>
        生辰输入
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className="lab-body mb-1 block text-sm">出生日期</label>
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="lab-control" />
        </div>
        <div>
          <label className="lab-body mb-1 block text-sm">出生时间</label>
          <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className="lab-control" />
        </div>
        <div>
          <label className="lab-body mb-1 block text-sm">性别</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className="lab-control">
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div>
          <label className="lab-body mb-1 block text-sm">分析维度</label>
          <select value={dimension} onChange={(e) => setDimension(e.target.value as Dimension)} className="lab-control">
            <option value="wealth">财富运势</option>
            <option value="life">生命健康</option>
            <option value="emotion">情感婚姻</option>
          </select>
        </div>
        <div>
          <label className="lab-body mb-1 block text-sm">时间周期</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="lab-control">
            <option value="yearly">年线（AI 推算寿元）</option>
            <option value="monthly">月线（12 个月）</option>
            <option value="daily">日线（30 天）</option>
          </select>
        </div>
        {period !== 'yearly' && (
          <div>
            <label className="lab-body mb-1 block text-sm">目标年份</label>
            <input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
              min={1900}
              max={2100}
              className="lab-control"
            />
          </div>
        )}
        {period === 'daily' && (
          <div>
            <label className="lab-body mb-1 block text-sm">目标月份</label>
            <select value={targetMonth} onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))} className="lab-control">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} 月
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <button onClick={submit} disabled={loading} className="lab-primary-button font-medium">
            {loading ? '分析中...' : '开始分析'}
          </button>
        </div>
      </div>
      {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>
  );
}
