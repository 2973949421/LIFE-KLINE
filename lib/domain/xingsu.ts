/**
 * 二十七星宿关系计算库
 *
 * 基于宿曜占星系统，计算两人的星宿关系
 */

// ==================== 星宿定义 ====================

/**
 * 二十七星宿（按顺时针顺序）
 * 排除了牛宿
 */
export const XING_SU_LIST = [
  '角', '亢', '氐', '房', '心', '尾', '箕',  // 东方青龙
  '斗', '女', '虚', '危', '室', '壁',        // 北方玄武
  '奎', '娄', '胃', '昴', '毕', '觜', '参',  // 西方白虎
  '井', '鬼', '柳', '星', '张', '翼', '轸'   // 南方朱雀
] as const;

export type XingSu = typeof XING_SU_LIST[number];

/**
 * 四方对应
 */
export const XING_SU_DIRECTION: Record<string, string> = {
  '角': '东方青龙', '亢': '东方青龙', '氐': '东方青龙', '房': '东方青龙',
  '心': '东方青龙', '尾': '东方青龙', '箕': '东方青龙',
  '斗': '北方玄武', '女': '北方玄武', '虚': '北方玄武', '危': '北方玄武',
  '室': '北方玄武', '壁': '北方玄武',
  '奎': '西方白虎', '娄': '西方白虎', '胃': '西方白虎', '昴': '西方白虎',
  '毕': '西方白虎', '觜': '西方白虎', '参': '西方白虎',
  '井': '南方朱雀', '鬼': '南方朱雀', '柳': '南方朱雀', '星': '南方朱雀',
  '张': '南方朱雀', '翼': '南方朱雀', '轸': '南方朱雀'
};

/**
 * 各月基准星宿
 */
export const MONTH_BASE: Record<number, XingSu> = {
  1: '室',   // 正月
  2: '奎',   // 二月
  3: '胃',   // 三月
  4: '毕',   // 四月
  5: '参',   // 五月
  6: '鬼',   // 六月
  7: '张',   // 七月
  8: '角',   // 八月
  9: '氐',   // 九月
  10: '心',  // 十月
  11: '斗',  // 十一月
  12: '虚'   // 十二月
};

// ==================== 关系类型 ====================

export type RelationType =
  | 'ming_zhixing'    // 命之星
  | 'ye_tai'          // 业胎
  | 'rong_qin'        // 荣亲
  | 'you_shuai'       // 友衰
  | 'an_huai'         // 安坏
  | 'wei_cheng';      // 危成

export type DistanceType = 'near' | 'medium' | 'far';

export interface XingSuRelation {
  type: RelationType;
  typeName: string;
  distance: DistanceType;
  distanceName: string;
  steps: number;
  role?: string;        // 角色（如：荣/亲、安/坏等）
  description: string;
}

/**
 * 关系类型中文名
 */
export const RELATION_NAMES: Record<RelationType, string> = {
  'ming_zhixing': '命之星',
  'ye_tai': '业胎',
  'rong_qin': '荣亲',
  'you_shuai': '友衰',
  'an_huai': '安坏',
  'wei_cheng': '危成'
};

/**
 * 距离类型中文名
 */
export const DISTANCE_NAMES: Record<DistanceType, string> = {
  'near': '近距离',
  'medium': '中距离',
  'far': '远距离'
};

/**
 * 关系类型描述
 */
export const RELATION_DESCRIPTIONS: Record<RelationType, string> = {
  'ming_zhixing': '相同星宿，宿命感强，性格极像，好坏减半',
  'ye_tai': '精神联结深，无须语言沟通，前世缘分感',
  'rong_qin': '最稳固的结合，相互成就，适合婚姻与家庭',
  'you_shuai': '情绪价值高，共同玩乐，但在现实物质上易互相削减',
  'an_huai': '强吸力与强杀伤力并存，一方为安（受），一方为坏（攻）',
  'wei_cheng': '职场/商业最佳拍档，一方为危（损），一方为成（利）'
};

// ==================== 计算函数 ====================

/**
 * 根据农历月份和日期计算本命星宿
 *
 * @param lunarMonth 农历月份（1-12，负值表示闰月，如-2表示闰二月）
 * @param lunarDay 农历日期（1-30）
 */
export function calcBenMingXingSu(lunarMonth: number, lunarDay: number): XingSu {
  // 处理农历月份：
  // 1. lunar-javascript 用负值表示闰月，如 -2 表示闰二月
  // 2. 闰月按正常月处理，闰二月 = 二月
  // 3. 年初公历日期可能返回负值表示上一农历年，取绝对值后归一化
  let normalizedMonth = Math.abs(lunarMonth);

  // 确保月份在 1-12 范围内
  if (normalizedMonth < 1 || normalizedMonth > 12) {
    normalizedMonth = ((normalizedMonth % 12) + 12) % 12 || 12;
  }

  const baseXingSu = MONTH_BASE[normalizedMonth];
  if (!baseXingSu) {
    throw new Error(`无效的农历月份: ${lunarMonth} (规范化后: ${normalizedMonth})`);
  }

  const baseIndex = XING_SU_LIST.indexOf(baseXingSu);
  const targetIndex = (baseIndex + lunarDay - 1) % 27;

  return XING_SU_LIST[targetIndex];
}

/**
 * 计算两个星宿之间的顺时针距离
 *
 * @param from 起始星宿
 * @param to 目标星宿
 * @returns 顺时针步数（0-26）
 */
export function calcClockwiseDistance(from: XingSu, to: XingSu): number {
  const fromIndex = XING_SU_LIST.indexOf(from);
  const toIndex = XING_SU_LIST.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    throw new Error('无效的星宿名称');
  }

  return (toIndex - fromIndex + 27) % 27;
}

/**
 * 计算两个星宿之间的最短距离（用于判定近/中/远距离）
 *
 * @param from 起始星宿
 * @param to 目标星宿
 * @returns 最短步数（0-13）
 */
export function calcMinDistance(from: XingSu, to: XingSu): number {
  const clockwise = calcClockwiseDistance(from, to);
  return Math.min(clockwise, 27 - clockwise);
}

/**
 * 根据距离判定关系类型
 *
 * 规则（基于宿曜占星学）：
 * 1. 命之星：D = 0
 * 2. 业胎：D = 9 (胎), D = 18 (业)
 * 3. 其他关系：排除 0, 9, 18 后，按 1-8 位周期循环排列
 *
 * 核心原则：正向位置与逆向位置配对！
 * - 正向位置 n 配对逆向位置 (9-n)
 * - 位置1正向 + 位置8逆向 → 荣亲（正向为荣，逆向为亲）
 * - 位置2正向 + 位置7逆向 → 友衰（正向为友，逆向为衰）
 * - 位置3正向 + 位置6逆向 → 安坏（正向为安，逆向为坏）
 * - 位置4正向 + 位置5逆向 → 危成（正向为成，逆向为危）
 *
 * 这确保了：A→B 和 B→A 的关系类型一致，只是角色互换
 */
export function calcXingSuRelation(primary: XingSu, secondary: XingSu): XingSuRelation {
  // 相同星宿：命之星
  if (primary === secondary) {
    return {
      type: 'ming_zhixing',
      typeName: '命之星',
      distance: 'near',
      distanceName: '近距离',
      steps: 0,
      description: RELATION_DESCRIPTIONS['ming_zhixing']
    };
  }

  const distance = calcClockwiseDistance(primary, secondary);

  // 业胎关系
  if (distance === 9) {
    return {
      type: 'ye_tai',
      typeName: '业胎（胎）',
      distance: 'medium',
      distanceName: '中距离',
      steps: distance,
      role: '胎',
      description: RELATION_DESCRIPTIONS['ye_tai']
    };
  }

  if (distance === 18) {
    return {
      type: 'ye_tai',
      typeName: '业胎（业）',
      distance: 'medium',
      distanceName: '中距离',
      steps: distance,
      role: '业',
      description: RELATION_DESCRIPTIONS['ye_tai']
    };
  }

  // 判定是否为正向区间（距离1-8）
  const isForward = distance >= 1 && distance <= 8;

  // 计算位置（排除9和18后，按1-8循环）
  // 正向区间：distance 直接就是 position (1-8)
  // 逆向区间：distance - 9 或 distance - 18 得到 position (1-8)
  let position: number;
  if (distance < 9) {
    position = distance;
  } else if (distance < 18) {
    position = distance - 9;  // 跳过9
  } else {
    position = distance - 18;  // 跳过18
  }

  // 关系类型与角色配对原则：
  // 荣↔亲, 友↔衰, 安↔坏, 成↔危
  // 正向位置 n 配对逆向位置 (9-n)，两者角色互补
  //
  // 逆向位置的角色映射：
  // 位置1-4: 亲/衰/坏/危（逆向角色）
  // 位置5-8: 成/安/友/荣（正向角色，与位置4-1配对）
  const backwardRoles: Record<number, { type: RelationType; role: string }> = {
    1: { type: 'rong_qin', role: '亲' },
    2: { type: 'you_shuai', role: '衰' },
    3: { type: 'an_huai', role: '坏' },
    4: { type: 'wei_cheng', role: '危' },
    5: { type: 'wei_cheng', role: '成' },  // 配对位置4，正向角色
    6: { type: 'an_huai', role: '安' },    // 配对位置3，正向角色
    7: { type: 'you_shuai', role: '友' },  // 配对位置2，正向角色
    8: { type: 'rong_qin', role: '荣' }    // 配对位置1，正向角色
  };

  // 正向位置的角色映射：
  // 位置1-4: 亲/衰/坏/危（逆向角色，与逆向位置8-5配对）
  // 位置5-8: 成/安/友/荣（正向角色，与逆向位置4-1配对）
  const forwardRoles: Record<number, { type: RelationType; role: string }> = {
    1: { type: 'rong_qin', role: '亲' },  // 配对逆向位置8
    2: { type: 'you_shuai', role: '衰' },  // 配对逆向位置7
    3: { type: 'an_huai', role: '坏' },    // 配对逆向位置6
    4: { type: 'wei_cheng', role: '危' },  // 配对逆向位置5
    5: { type: 'wei_cheng', role: '成' },  // 配对逆向位置4
    6: { type: 'an_huai', role: '安' },    // 配对逆向位置3
    7: { type: 'you_shuai', role: '友' },  // 配对逆向位置2
    8: { type: 'rong_qin', role: '荣' }    // 配对逆向位置1
  };

  // 根据区间选择角色映射
  const relation = isForward ? forwardRoles[position] : backwardRoles[position];

  // 判定距离类型
  // 使用最短距离判定：近距离(1-4)、中距离(5-10)、远距离(11-13)
  // 业胎(9, 18)和命之星(0)已在前文处理，此处不涉及
  const minDistance = calcMinDistance(primary, secondary);

  let distType: DistanceType;
  let distName: string;

  if (minDistance >= 1 && minDistance <= 4) {
    distType = 'near';
    distName = '近距离';
  } else if (minDistance >= 5 && minDistance <= 10) {
    distType = 'medium';
    distName = '中距离';
  } else {
    // minDistance 11-13 都是远距离
    distType = 'far';
    distName = '远距离';
  }

  return {
    type: relation.type,
    typeName: RELATION_NAMES[relation.type],
    distance: distType,
    distanceName: distName,
    steps: distance,
    role: relation.role,
    description: RELATION_DESCRIPTIONS[relation.type]
  };
}

/**
 * 获取两人星宿关系的完整描述
 */
export function getXingSuRelationDescription(primary: XingSu, secondary: XingSu): string {
  const relation = calcXingSuRelation(primary, secondary);

  let desc = `${relation.typeName}`;
  if (relation.role) {
    desc += `（${relation.role}）`;
  }
  desc += `，${relation.distanceName}`;
  desc += `\n${relation.description}`;

  return desc;
}

// ==================== 验证函数 ====================

/**
 * 打印星宿关系表（用于验证）
 */
export function printXingSuRelationTable() {
  console.log('二十七星宿关系表（以角宿为例）：\n');

  XING_SU_LIST.forEach((target, idx) => {
    const distance = calcClockwiseDistance('角', target);
    const relation = calcXingSuRelation('角', target);

    console.log(`${idx + 1}. 角 → ${target}: 距离${distance}步 → ${relation.typeName}${relation.role ? `（${relation.role}）` : ''} ${relation.distanceName}`);
  });
}

// ==================== 值日星宿计算 ====================

/**
 * 值日星宿基准日期
 * 根据《宿曜经》，值日星宿按公历日期循环，27天一个周期
 *
 * 基准日期设定：
 * - 2024年1月1日 = 翼宿（索引22）
 *
 * 注意：不同流派可能有不同的基准日期，此处采用通用标准
 */
const ZHIRI_BASE_DATE = new Date(2024, 0, 1);  // 2024年1月1日
const ZHIRI_BASE_XINGSU_INDEX = 17;  // 毕宿在XING_SU_LIST中的索引

/**
 * 计算值日星宿
 *
 * 值日星宿是根据公历日期循环计算的，每天对应一个星宿，27天一个周期。
 * 与本命星宿（根据农历月日计算）不同，值日星宿反映的是当日的能量场。
 *
 * @param year 公历年份
 * @param month 公历月份（1-12）
 * @param day 公历日期（1-31）
 * @returns 值日星宿
 */
export function calcZhiRiXingSu(year: number, month: number, day: number): XingSu {
  const targetDate = new Date(year, month - 1, day);

  // 计算与基准日期的天数差
  const diffTime = targetDate.getTime() - ZHIRI_BASE_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 对27取模得到值日星宿索引
  // 使用 ((diffDays % 27) + 27) % 27 确保结果为正数
  let index = ((diffDays % 27) + 27) % 27;
  index = (ZHIRI_BASE_XINGSU_INDEX + index) % 27;

  return XING_SU_LIST[index];
}

/**
 * 星宿关系结果（包含本命和值日两种）
 */
export interface FullXingSuResult {
  // 本命星宿关系
  benming: {
    primary: XingSu;
    secondary: XingSu;
    relation: XingSuRelation;
  };
  // 值日星宿关系
  zhir: {
    primary: XingSu;
    secondary: XingSu;
    relation: XingSuRelation;
  };
}

/**
 * 计算完整的星宿关系（包含本命星宿和值日星宿）
 *
 * @param primaryBirth 主盘出生信息 { year, month, day, lunarMonth, lunarDay }
 * @param secondaryBirth 辅盘出生信息
 * @returns 完整星宿关系结果
 */
export function calcFullXingSuRelation(
  primaryBirth: { year: number; month: number; day: number; lunarMonth: number; lunarDay: number },
  secondaryBirth: { year: number; month: number; day: number; lunarMonth: number; lunarDay: number }
): FullXingSuResult {
  // 本命星宿
  const primaryBenMing = calcBenMingXingSu(primaryBirth.lunarMonth, primaryBirth.lunarDay);
  const secondaryBenMing = calcBenMingXingSu(secondaryBirth.lunarMonth, secondaryBirth.lunarDay);

  // 值日星宿
  const primaryZhiRi = calcZhiRiXingSu(primaryBirth.year, primaryBirth.month, primaryBirth.day);
  const secondaryZhiRi = calcZhiRiXingSu(secondaryBirth.year, secondaryBirth.month, secondaryBirth.day);

  return {
    benming: {
      primary: primaryBenMing,
      secondary: secondaryBenMing,
      relation: calcXingSuRelation(primaryBenMing, secondaryBenMing)
    },
    zhir: {
      primary: primaryZhiRi,
      secondary: secondaryZhiRi,
      relation: calcXingSuRelation(primaryZhiRi, secondaryZhiRi)
    }
  };
}