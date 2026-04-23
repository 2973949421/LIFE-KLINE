/**
 * Technical Analysis Math Library
 * 技术指标纯数学计算库
 *
 * 用于处理 AI 生成的 0-100 原始运势数据
 * 为人生 K 线图提供技术指标支撑
 */

/**
 * 数据点接口
 */
export interface DataPoint {
  year: number;
  age: number;
  o: number;  // Open
  h: number;  // High
  l: number;  // Low
  c: number;  // Close
  summary?: string;
}

/**
 * MA 结果接口
 */
export interface MAResult {
  year: number;
  age: number;
  value: number;
}

/**
 * MACD 结果接口
 */
export interface MACDResult {
  year: number;
  age: number;
  dif: number;    // DIF = EMA12 - EMA26
  dea: number;    // DEA = DIF 的 EMA9
  macd: number;   // MACD = (DIF - DEA) * 2
}

/**
 * RSI 结果接口
 */
export interface RSIResult {
  year: number;
  age: number;
  value: number;  // RSI 值 (0-100)
}

/**
 * KDJ 结果接口
 */
export interface KDJResult {
  year: number;
  age: number;
  k: number;      // K 值
  d: number;      // D 值
  j: number;      // J 值
}

/**
 * BOLL 结果接口
 */
export interface BOLLResult {
  year: number;
  age: number;
  upper: number;   // 上轨
  middle: number;  // 中轨
  lower: number;   // 下轨
}

/**
 * SMA - 简单移动平均线 (Simple Moving Average)
 *
 * 计算公式：SMA(n) = (P1 + P2 + ... + Pn) / n
 *
 * @param data - 收盘价数组
 * @param period - 周期 (如 5, 10, 20)
 * @returns SMA 数组 (前 period-1 个值为 null，用 NaN 表示)
 */
export function SMA(data: number[], period: number): (number | null)[] {
  if (period <= 0 || data.length < period) {
    return data.map(() => null);
  }

  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      // 前面不足 period 个数据点，返回 null
      result.push(null);
    } else {
      // 计算最近 period 个数据的平均值
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }

  return result;
}

/**
 * EMA - 指数移动平均线 (Exponential Moving Average)
 *
 * 计算公式：
 *   EMA(1) = 第一个数据点
 *   EMA(n) = α × 当日价格 + (1 - α) × 昨日EMA
 *   其中 α = 2 / (period + 1)
 *
 * 特点：对近期数据赋予更高权重，反应更灵敏
 *
 * @param data - 收盘价数组
 * @param period - 周期 (如 12, 26)
 * @returns EMA 数组
 */
export function EMA(data: number[], period: number): number[] {
  if (data.length === 0 || period <= 0) {
    return [];
  }

  const result: number[] = [];
  const multiplier = 2 / (period + 1); // 平滑系数 α

  // 第一个 EMA 值使用第一个数据点
  result.push(data[0]);

  for (let i = 1; i < data.length; i++) {
    const ema = data[i] * multiplier + result[i - 1] * (1 - multiplier);
    result.push(ema);
  }

  return result;
}

/**
 * MACD - 指数平滑异同移动平均线 (Moving Average Convergence Divergence)
 *
 * 计算公式：
 *   DIF = EMA(12) - EMA(26)  快线
 *   DEA = EMA(DIF, 9)        慢线 (信号线)
 *   MACD = (DIF - DEA) × 2   柱状图
 *
 * @param data - 收盘价数组
 * @returns MACD 结果对象数组
 */
export function MACD(data: number[]): MACDResult[] {
  if (data.length === 0) {
    return [];
  }

  // 计算 EMA12 和 EMA26
  const ema12 = EMA(data, 12);
  const ema26 = EMA(data, 26);

  // 计算 DIF
  const dif: number[] = [];
  for (let i = 0; i < data.length; i++) {
    dif.push(ema12[i] - ema26[i]);
  }

  // 计算 DEA (DIF 的 EMA9)
  const dea = EMA(dif, 9);

  // 计算 MACD 柱状图
  const results: MACDResult[] = [];
  for (let i = 0; i < data.length; i++) {
    results.push({
      year: 0,  // 调用方填充
      age: i + 1,
      dif: Math.round(dif[i] * 100) / 100,
      dea: Math.round(dea[i] * 100) / 100,
      macd: Math.round((dif[i] - dea[i]) * 2 * 100) / 100
    });
  }

  return results;
}

/**
 * 从 DataPoint 数组提取收盘价
 */
export function extractClosePrices(data: DataPoint[]): number[] {
  return data.map(d => d.c);
}

/**
 * 计算完整的均线数据 (MA5, MA10, MA20)
 */
export function calculateMASet(data: DataPoint[]): {
  ma5: (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
} {
  const closes = extractClosePrices(data);

  return {
    ma5: SMA(closes, 5),
    ma10: SMA(closes, 10),
    ma20: SMA(closes, 20)
  };
}

/**
 * 判断均线多头/空头排列
 *
 * 多头排列：MA5 > MA10 > MA20 (上升趋势)
 * 空头排列：MA5 < MA10 < MA20 (下降趋势)
 */
export function getMATrend(ma5: number | null, ma10: number | null, ma20: number | null): 'bullish' | 'bearish' | 'neutral' {
  if (ma5 === null || ma10 === null || ma20 === null) {
    return 'neutral';
  }

  if (ma5 > ma10 && ma10 > ma20) {
    return 'bullish';
  }

  if (ma5 < ma10 && ma10 < ma20) {
    return 'bearish';
  }

  return 'neutral';
}

/**
 * 判断 MACD 金叉/死叉
 *
 * 金叉：DIF 上穿 DEA (买入信号)
 * 死叉：DIF 下穿 DEA (卖出信号)
 */
export function detectMACDCross(macdData: MACDResult[]): Array<{
  index: number;
  type: 'golden' | 'death';
  dif: number;
  dea: number;
}> {
  const crosses: Array<{
    index: number;
    type: 'golden' | 'death';
    dif: number;
    dea: number;
  }> = [];

  for (let i = 1; i < macdData.length; i++) {
    const prev = macdData[i - 1];
    const curr = macdData[i];

    // 金叉：前一天 DIF < DEA，今天 DIF > DEA
    if (prev.dif < prev.dea && curr.dif > curr.dea) {
      crosses.push({
        index: i,
        type: 'golden',
        dif: curr.dif,
        dea: curr.dea
      });
    }

    // 死叉：前一天 DIF > DEA，今天 DIF < DEA
    if (prev.dif > prev.dea && curr.dif < curr.dea) {
      crosses.push({
        index: i,
        type: 'death',
        dif: curr.dif,
        dea: curr.dea
      });
    }
  }

  return crosses;
}

/**
 * 计算波动率 (用于衡量运势波动程度)
 *
 * 使用标准差公式
 */
export function calculateVolatility(data: number[], period: number = 20): (number | null)[] {
  if (period <= 1 || data.length < period) {
    return data.map(() => null);
  }

  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      // 计算最近 period 个数据的标准差
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const stdDev = Math.sqrt(variance);
      result.push(Math.round(stdDev * 100) / 100);
    }
  }

  return result;
}

/**
 * 识别趋势通道
 *
 * @returns 'uptrend' | 'downtrend' | 'sideways'
 */
export function identifyTrend(data: DataPoint[], lookback: number = 10): 'uptrend' | 'downtrend' | 'sideways' {
  if (data.length < lookback) {
    return 'sideways';
  }

  const recentData = data.slice(-lookback);
  const closes = recentData.map(d => d.c);

  // 计算首尾价格变化
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const change = (lastClose - firstClose) / firstClose;

  // 判断趋势
  if (change > 0.1) return 'uptrend';
  if (change < -0.1) return 'downtrend';
  return 'sideways';
}

// ============ RSI - 相对强弱指数 (Relative Strength Index) ============

/**
 * RSI - 相对强弱指数
 *
 * 计算公式：
 *   RS = 平均涨幅 / 平均跌幅
 *   RSI = 100 - 100 / (1 + RS)
 *
 * 玄学隐喻：运势过热/过冷的警戒线
 * - RSI > 80：超买区，运势过热，警惕回调
 * - RSI < 20：超卖区，运势过冷，可能反弹
 * - RSI 50：多空平衡线
 *
 * @param data - 收盘价数组
 * @param period - 周期 (默认 14)
 * @returns RSI 数组
 */
export function RSI(data: number[], period: number = 14): (number | null)[] {
  if (data.length < period + 1) {
    return data.map(() => null);
  }

  const result: (number | null)[] = [];

  // 前面的数据点返回 null
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  // 计算初始平均涨幅和跌幅
  let sumGain = 0;
  let sumLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      sumGain += change;
    } else {
      sumLoss += Math.abs(change);
    }
  }

  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;

  // 计算第一个 RSI
  if (avgLoss === 0) {
    result.push(100);
  } else {
    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  // 计算后续 RSI (使用平滑平均)
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

// ============ KDJ - 随机指标 (Stochastic Oscillator) ============

/**
 * KDJ - 随机指标
 *
 * 计算公式：
 *   RSV = (Close - LowestLow) / (HighestHigh - LowestLow) * 100
 *   K = SMA(RSV, M1)  默认 M1=3
 *   D = SMA(K, M2)    默认 M2=3
 *   J = 3K - 2D
 *
 * 玄学隐喻：天地人三才的和谐度
 * - K 线：天时，代表短期动能
 * - D 线：地利，代表中期趋势
 * - J 线：人和，代表综合信号
 *
 * 交叉信号：
 * - K 上穿 D：金叉，买入信号
 * - K 下穿 D：死叉，卖出信号
 * - J > 100：超买
 * - J < 0：超卖
 *
 * @param data - 包含 high, low, close 的数据数组
 * @param n - RSV 周期 (默认 9)
 * @param m1 - K 线平滑周期 (默认 3)
 * @param m2 - D 线平滑周期 (默认 3)
 * @returns KDJ 结果数组
 */
export function KDJ(
  data: Array<{ h: number; l: number; c: number }>,
  n: number = 9,
  m1: number = 3,
  m2: number = 3
): Array<{ k: number | null; d: number | null; j: number | null }> {
  const result: Array<{ k: number | null; d: number | null; j: number | null }> = [];

  // 计算 RSV
  const rsv: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      rsv.push(null);
    } else {
      // 获取最近 n 天的最高价和最低价
      let highestHigh = -Infinity;
      let lowestLow = Infinity;

      for (let j = 0; j < n; j++) {
        highestHigh = Math.max(highestHigh, data[i - j].h);
        lowestLow = Math.min(lowestLow, data[i - j].l);
      }

      const close = data[i].c;
      const range = highestHigh - lowestLow;

      if (range === 0) {
        rsv.push(50); // 避免除零
      } else {
        rsv.push(((close - lowestLow) / range) * 100);
      }
    }
  }

  // 计算 K, D, J
  let kValue: number | null = null;
  let dValue: number | null = null;

  // K 的前 m1-1 个 RSV 平均值作为初始 K
  // D 的前 m2-1 个 K 平均值作为初始 D

  for (let i = 0; i < data.length; i++) {
    if (rsv[i] === null) {
      result.push({ k: null, d: null, j: null });
      continue;
    }

    // 计算 K 值 (SMA of RSV)
    if (kValue === null) {
      // 初始化 K
      let sumRsv = 0;
      let count = 0;
      for (let j = 0; j <= i; j++) {
        if (rsv[j] !== null) {
          sumRsv += rsv[j]!;
          count++;
        }
      }
      kValue = sumRsv / count;
    } else {
      // K = (2/3) * 前K + (1/3) * 当前RSV (相当于 SMA 3)
      kValue = (kValue * (m1 - 1) + rsv[i]!) / m1;
    }

    // 计算 D 值 (SMA of K)
    if (dValue === null) {
      dValue = kValue; // 初始 D = K
    } else {
      // D = (2/3) * 前D + (1/3) * 当前K
      dValue = (dValue * (m2 - 1) + kValue) / m2;
    }

    // 计算 J 值
    const jValue = 3 * kValue - 2 * dValue;

    result.push({
      k: Math.round(kValue * 100) / 100,
      d: Math.round(dValue * 100) / 100,
      j: Math.round(jValue * 100) / 100
    });
  }

  return result;
}

// ============ BOLL - 布林带 (Bollinger Bands) ============

/**
 * BOLL - 布林带
 *
 * 计算公式：
 *   中轨 = SMA(Close, n)
 *   上轨 = 中轨 + k * 标准差
 *   下轨 = 中轨 - k * 标准差
 *
 * 默认参数：n=20, k=2
 *
 * 玄学隐喻：命运通道的弹性边界
 * - 上轨：运势上限，触及上轨表示能量过载
 * - 下轨：运势下限，触及下轨表示能量枯竭
 * - 中轨：运势中枢，多空平衡点
 * - 带宽收窄：变盘在即
 * - 带宽扩张：趋势确立
 *
 * @param data - 收盘价数组
 * @param n - 中轨周期 (默认 20)
 * @param k - 标准差倍数 (默认 2)
 * @returns BOLL 结果数组
 */
export function BOLL(
  data: number[],
  n: number = 20,
  k: number = 2
): Array<{ upper: number | null; middle: number | null; lower: number | null }> {
  const result: Array<{ upper: number | null; middle: number | null; lower: number | null }> = [];

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      result.push({ upper: null, middle: null, lower: null });
      continue;
    }

    // 计算中轨 (SMA)
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += data[i - j];
    }
    const middle = sum / n;

    // 计算标准差
    let sumSquaredDiff = 0;
    for (let j = 0; j < n; j++) {
      const diff = data[i - j] - middle;
      sumSquaredDiff += diff * diff;
    }
    const stdDev = Math.sqrt(sumSquaredDiff / n);

    // 计算上下轨
    const upper = middle + k * stdDev;
    const lower = middle - k * stdDev;

    result.push({
      upper: Math.round(upper * 100) / 100,
      middle: Math.round(middle * 100) / 100,
      lower: Math.round(lower * 100) / 100
    });
  }

  return result;
}

// ============ KDJ 交叉检测 ============

/**
 * 检测 KDJ 交叉信号
 *
 * @returns 金叉和死叉列表
 */
export function detectKDJCross(
  kdjData: Array<{ k: number | null; d: number | null; j: number | null }>
): Array<{
  index: number;
  type: 'golden' | 'death';
  k: number;
  d: number;
}> {
  const crosses: Array<{
    index: number;
    type: 'golden' | 'death';
    k: number;
    d: number;
  }> = [];

  for (let i = 1; i < kdjData.length; i++) {
    const prev = kdjData[i - 1];
    const curr = kdjData[i];

    if (prev.k === null || prev.d === null || curr.k === null || curr.d === null) {
      continue;
    }

    // 金叉：K 上穿 D
    if (prev.k < prev.d && curr.k > curr.d) {
      crosses.push({
        index: i,
        type: 'golden',
        k: curr.k,
        d: curr.d
      });
    }

    // 死叉：K 下穿 D
    if (prev.k > prev.d && curr.k < curr.d) {
      crosses.push({
        index: i,
        type: 'death',
        k: curr.k,
        d: curr.d
      });
    }
  }

  return crosses;
}

// ============ RSI 超买超卖检测 ============

/**
 * 检测 RSI 超买超卖信号
 *
 * @returns 超买/超卖信号列表
 */
export function detectRSISignal(
  rsiData: (number | null)[],
  overbought: number = 80,
  oversold: number = 20
): Array<{
  index: number;
  type: 'overbought' | 'oversold';
  value: number;
}> {
  const signals: Array<{
    index: number;
    type: 'overbought' | 'oversold';
    value: number;
  }> = [];

  for (let i = 0; i < rsiData.length; i++) {
    const rsi = rsiData[i];
    if (rsi === null) continue;

    if (rsi >= overbought) {
      signals.push({ index: i, type: 'overbought', value: rsi });
    } else if (rsi <= oversold) {
      signals.push({ index: i, type: 'oversold', value: rsi });
    }
  }

  return signals;
}

// ============ 测试用例 ============

/**
 * 测试函数 - 验证算法正确性
 */
export function testTAMath(): void {
  // 模拟 20 天收盘价数据
  const testData = [
    50, 52, 51, 53, 55, 54, 56, 58, 57, 59,
    61, 60, 62, 64, 63, 65, 67, 66, 68, 70
  ];

  console.log('=== TA-Math 测试 ===\n');

  // 测试 SMA
  const sma5 = SMA(testData, 5);
  console.log('SMA5 (前 10 个值):');
  console.log(sma5.slice(0, 10));

  // 测试 EMA
  const ema12 = EMA(testData, 12);
  console.log('\nEMA12 (前 10 个值):');
  console.log(ema12.slice(0, 10).map(v => Math.round(v * 100) / 100));

  // 测试 MACD
  const macdResult = MACD(testData);
  console.log('\nMACD 结果:');
  console.log(macdResult.map(m => ({
    dif: m.dif,
    dea: m.dea,
    macd: m.macd
  })));

  // 测试波动率
  const volatility = calculateVolatility(testData, 5);
  console.log('\n波动率 (周期 5):');
  console.log(volatility);

  console.log('\n=== 测试完成 ===');
}

// 如果直接运行此文件，执行测试
if (typeof require !== 'undefined' && require.main === module) {
  testTAMath();
}