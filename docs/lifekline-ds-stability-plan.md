# LifeKLINE DeepSeek 年K稳定性改造计划

本文档用于指导后续 Codex/agent 有序执行 GPT Pro 给出的 DeepSeek 年K稳定性改造方案。目标是让后续工作不会因为上下文丢失而重新讨论同一个问题。

## 0. 版本定位

本计划只针对当前 DeepSeek V4 Flash / OpenCode Go 主链路。

历史上，2026 年 4 月底的版本可视为 Qwen Max 供应商路径下的成型版本基线，尤其是：

```text
0a1735c 2026-04-25 Finalize LifeKLINE standalone repository cleanup
```

这条 Qwen Max 路线可以作为产品语义和旧效果的参考，但由于原 LLM 供应商/模型访问已不可用，不再作为当前运行和重构主线。

当前 DS 改造目标不是复制 Qwen Max 供应商链路，也不是回滚到旧模型，而是在保留 DeepSeek V4 Flash 的基础上重构数据边界、提示词契约和 validator，让 DS 更稳定地承担命理判断与解释任务。

## 当前进度

截至 `7d86f63 Add DeepSeek yearly scaffold pipeline`：

```text
Phase 0-6 已完成：单人年K默认走 v4.2，本地掌握 row_id/year/age/OHLC/TA
Phase 7 基本完成：validator fail 后 repair 一次，仍失败则报错
Phase 8 功能完成：默认 4 段生成，但第一版为串行，真实接口约 268s
```

下一轮推进重点：

```text
固化 v4.2 基线
Phase 8 性能版：4 段受控并发 + segments 测试
真实接口稳定性脚本
Phase 9 第一版轻量命理标签
```

## 1. 目标

在保留 DeepSeek V4 Flash 主链路的前提下，提高单人年K的稳定性和准确性。

核心目标不是让本地完整替代命理师，而是建立更可靠的数据边界：

```text
本地负责事实、结构、边界、校验和 K 线计算
DeepSeek 负责命理判断、年度评分和解释
```

## 2. 成功标准

第一阶段成功标准：

```text
同一八字多次请求时，timeline 长度、year、age、row_id 固定
DeepSeek 不再决定 timeline 长度和年份
DeepSeek 不再输出 OHLC 和技术指标
DeepSeek 原始输出经过严格 validator
非法输出不会进入图表
不使用默认 50 或本地假补齐掩盖错误
回滚通过 Git revert 完成
pnpm test:run 通过
pnpm build 通过
```

真实接口默认验收输入：

```json
{
  "birth": "2004-06-20",
  "birthTime": "19:30",
  "gender": "male",
  "dimension": "emotion",
  "period": "yearly"
}
```

## 3. 已知根因

当前 v4.1 架构让模型一次性承担：

```text
命理判断
寿元/长度决定
75-89 年 timeline 规划
每年 score 曲线
每年 analysis
JSON 严格结构
全局分析
```

千问 Max 曾经能较好完成这类长结构化输出，不代表 DeepSeek V4 Flash 用同一 prompt 也稳定。

DeepSeek 网页版命理表现好，并不等于它适合一次性输出 75-89 条严格 JSON 年K。当前问题更像任务形态不匹配，而不是模型完全不懂命理。

另一个关键问题是当前 prompt、schema、后端职责不一致：

```text
prompt 要 DS 输出 analysis + score
schema.json 更像最终 API response，包含 OHLC/technical_commentary
route 又在本地生成 OHLC 和技术指标
```

因此需要拆分 DS 原始输出契约和最终 API 响应契约。

## 4. 总体路线

渐进式执行，不推倒重来：

```text
v4.1 legacy
  ↓
v4.2 固定年K scaffold
  ↓
v4.3 完整大运/流年上下文
  ↓
v4.4 validator + retry
  ↓
v4.5 分段生成
  ↓
v4.6 轻量命理标签
  ↓
v5 可选 base_score + score_delta
```

当前首批实际执行更激进的 v4.2 闭环：单人年K直接启用 v4.2、本地图表寿元、默认 4 段 DS 调用、validator + repair。v5 本地 base_score 仍然后置。

## 5. 本地与 DeepSeek 的职责边界

### 本地必须负责

```text
出生年
年份序列
年龄序列
row_id
displayYears
四柱
五行统计
十神基础
起运年龄
完整大运列表
每年所属大运
每年流年干支
OHLC
MA/MACD/RSI/KDJ/BOLL
validator
retry 决策
错误返回
```

### DeepSeek 负责

```text
score
analysis
confidence
global_analysis
命理解释
阶段总结
峰值期/风险期解释
```

### DeepSeek 禁止负责

```text
timeline 长度
year
age
row_id 集合
o/h/l/c
summary
technical_indicators
technical_commentary
lifespan.total_years 对图表长度的控制
```

## 6. Phase 0：主链路选择

### 目标

单人年K直接走 v4.2，日K/月K和合盘暂时保留 legacy。

### 规则

```text
single yearly/year -> v4.2
single daily/monthly -> legacy
hepan -> legacy
```

本轮不增加 `LIFE_KLINE_PIPELINE` 配置。需要回滚时使用 Git revert。

### 预期文件

```text
lib/server/env.ts
lib/server/life-kline/service.ts
.env.example
README.md
```

### 验收

```text
single yearly/year 不再走旧自由生成 timeline
single daily/monthly 行为不变
hepan 行为不变
```

### 回滚

```text
git revert <v4.2-refactor-commit>
```

## 7. Phase 1：yearly scaffold

### 目标

本地生成年K骨架，收回 timeline 主权。

### 新增文件

```text
lib/domain/life-kline/yearly-scaffold.ts
tests/yearly-scaffold.test.ts
```

### 类型建议

```ts
export interface YearlyScaffoldRow {
  row_id: string;
  year: number;
  age: number;
}
```

### row_id 规则

```text
Y{year}_A{age}
```

示例：

```text
Y2004_A1
Y2005_A2
Y2006_A3
```

### 图表寿元

第一版由本地轻量启发式计算 `75-89` 年，语义为“图表寿元”，不是医学或真实寿命判断。DS 不决定 timeline 长度。

### 测试

```text
displayYears=89 输出 89 行
第一行 year=birthYear
第一行 age=1
year 连续
age 连续
row_id 唯一
同一输入输出完全一致
```

## 8. Phase 2：annual context

### 目标

给 DeepSeek 更完整的年度命理事实，尤其是完整大运和流年干支，减少模型猜测。

### 新增文件

```text
lib/domain/life-kline/annual-context.ts
tests/annual-context.test.ts
```

### 类型建议

```ts
export interface AnnualContextRow {
  row_id: string;
  year: number;
  age: number;
  liu_nian: string;
  da_yun?: string;
  da_yun_start_age?: number;
  da_yun_end_age?: number;
}
```

### 第一版只做轻量事实

必须做：

```text
row_id
year
age
当前大运
大运起止年龄
流年干支
```

暂不做：

```text
复杂喜忌
完整格局判断
完整神煞
复杂冲合刑害优先级
本地 base_score
```

### 测试

```text
每个 scaffold row 都有 context
中晚年也有大运或明确 fallback
流年干支循环稳定
同一输入输出完全一致
```

## 9. Phase 3：DeepSeek 专用 prompt

### 目标

不要继续让 DS 使用千问 Max 风格的大 prompt。新增 DS 专用数据任务 prompt。

### 新增文件

```text
content/prompts/life-kline/skill.deepseek.md
```

### prompt 必须明确

```text
系统已经完成排盘
不得自行更改排盘
系统已经提供 row_id 集合
不得新增、删除、修改 row_id
只返回 row_id、score、analysis、confidence
不得返回 year、age、o、h、l、c
不得返回 technical_indicators
不得决定 lifespan 或 displayYears
必须返回 JSON object
不要 markdown
不要解释 JSON 之外的文字
```

### 输入给 DS 的结构

```json
{
  "birth_profile": {
    "gender": "male",
    "bazi": {
      "nianZhu": "甲申",
      "yueZhu": "庚午",
      "riZhu": "庚午",
      "shiZhu": "丙戌",
      "riZhuWuXing": "金",
      "wangShuai": "身强"
    }
  },
  "dimension": "emotion",
  "period": "year",
  "rows": [
    {
      "row_id": "Y2004_A1",
      "year": 2004,
      "age": 1,
      "liu_nian": "甲申",
      "da_yun": "庚午",
      "da_yun_age_range": "1-10"
    }
  ]
}
```

注意：DS 可以看 `year/age`，但不能返回或修改它们。最终 `year/age` 只来自本地 scaffold。

## 10. Phase 4：DS 输出 schema 与 validator

### 目标

拆分 DS 原始输出 schema 和最终 API response schema。

### 新增文件

```text
content/prompts/life-kline/schema.ds-score.v1.json
content/prompts/life-kline/schema.final-response.v1.json
lib/server/life-kline/validate-ds-score.ts
tests/validate-ds-score.test.ts
```

旧文件保留：

```text
content/prompts/life-kline/schema.json
```

不要直接删除，先标记为 legacy/deprecated。

### DS 原始输出建议

```json
{
  "schema_version": "life_kline_ds_score_v1",
  "dimension": "emotion",
  "period": "year",
  "rows": [
    {
      "row_id": "Y2004_A1",
      "score": 52,
      "analysis": "幼年根基平稳，家庭环境对成长有一定扶助。",
      "confidence": 0.72
    }
  ],
  "global_analysis": {
    "pattern_summary": "震荡上行",
    "dimension_analysis": "整体情感走势随大运逐步展开。",
    "key_insights": "宜在上升期主动经营关系，在回撤期保持沟通。",
    "peak_periods": [
      {
        "start_age": 34,
        "end_age": 43,
        "reason": "大运承接较稳，情感机会集中。"
      }
    ],
    "risk_periods": [
      {
        "start_age": 51,
        "end_age": 56,
        "reason": "流年冲动较多，关系需防摩擦。"
      }
    ]
  }
}
```

### validator 必须校验

顶层：

```text
schema_version 正确
dimension 等于请求 dimension
period 等于 year
rows 是数组
global_analysis 存在
```

rows：

```text
rows.length === scaffold.length
row_id 必须全部来自 scaffold
row_id 不重复
没有缺失 row_id
没有未知 row_id
score 必须是 number/integer
score 0-100
analysis 非空
confidence 0-1
```

禁止字段：

```text
year
age
o
h
l
c
open
high
low
close
technical_commentary
technical_indicators
```

### 测试必须覆盖

```text
合法响应通过
缺 rows 失败
rows 数量不足失败
rows 数量过多失败
row_id 重复失败
row_id 未知失败
score 缺失失败
score 字符串失败
score < 0 失败
score > 100 失败
analysis 为空失败
confidence 非法失败
返回 year/age 失败
返回 o/h/l/c 失败
dimension 不匹配失败
period 不匹配失败
global_analysis 缺失失败
```

## 11. Phase 5：service v4.2 分支

### 目标

保留现有 `runLifeKlineInference()` 外部入口。单人 `yearly/year` 直接调用 v4.2，单人 `daily/monthly` 保持 legacy。

### 建议新增

```ts
runLifeKlineInferenceLegacy()
runLifeKlineInferenceV42()
```

### v4.2 流程

```text
读取配置
paiPan
buildYearlyScaffold
buildAnnualContext
生成 DeepSeek prompt
调用 /chat/completions
extractAssistantContent
extractJsonBlock
validateDsScoreResponse
返回 validated rows + scaffold + bazi
```

### 注意

不要改变 API key。

保持：

```text
response_format: { type: "json_object" }
Authorization: Bearer
错误体透传
reasoning 字段忽略
```

## 12. Phase 6：route 合成最终 timeline

### 目标

最终 timeline 只由本地 scaffold + DS score rows 合成。

### 合成规则

```text
for each scaffold row:
  用 row_id 找 DS row
  合成 year/age/score/analysis/confidence
  本地生成 summary
  本地 scoresToOHLCList
  本地生成技术指标
  本地生成 technical_commentary
```

### 禁止

```text
从 DS 读取 year/age
从 DS 读取 o/h/l/c
score 非法时默认 50
timeline 缺行时本地补齐
```

### 测试

```text
同一 scaffold + 同一 DS rows 输出完全一致
OHLC 全部合法
h >= max(o,c)
l <= min(o,c)
无 NaN
无 Infinity
前端类型兼容
```

## 13. Phase 7：retry repair

### 目标

模型第一次格式不合格时，给一次修复机会，但不本地伪造数据。

### 规则

```text
第一次 validator fail
把 validation_errors 发回 DS
要求只返回修复后的完整 JSON
再次 validator
仍失败则返回 AI_SCORE_VALIDATION_FAILED
```

### repair prompt 要点

```text
列出具体错误
不要解释
不要 markdown
不要改变 row_id 集合
不要输出 year/age/o/h/l/c
只返回完整 JSON
```

### 测试

```text
第一次缺行，第二次成功
第一次 score 超范围，第二次成功
第二次仍失败，返回明确错误
不生成假 timeline
不填默认 50
```

## 14. Phase 8：分段生成

首批默认启用分段生成，因为当前按 token 计费，用户已确认多次请求可以接受。

### 分段建议

```text
1-18 岁
19-35 岁
36-55 岁
56-89 岁
```

### 新增文件

```text
lib/server/life-kline/segments.ts
tests/segments.test.ts
```

### 验收

```text
每段独立 validator
每段独立 retry
合并后 row_id 全覆盖
无重复 row_id
缺段失败
不补假段
```

## 15. Phase 9：轻量命理标签

只有当 DS 解释质量不足时再做。

### 新增文件

```text
lib/domain/life-kline/annual-tags.ts
tests/annual-tags.test.ts
```

### 第一批标签

```text
DA_YUN_CHANGE
WEALTH_RELATED
LIFE_PRESSURE_RELATED
EMOTION_RELATED
SPOUSE_PALACE_RELATED
```

标签只是提示，不直接决定 score。

## 16. Phase 10：可选 v5 base_score

不作为当前任务。

只有 v4.2-v4.6 后仍然主趋势不够稳定，才考虑：

```text
本地 base_score
DS score_delta
final_score = clamp(base_score + score_delta)
```

这一步会涉及更完整的本地命理规则沉淀，必须后置。

## 17. 自动化验证

每个实现阶段至少运行：

```text
pnpm test:run
pnpm build
```

新增模块必须有对应测试。

禁止把重装依赖当作验证方式。

## 18. 真实接口稳定性验收

使用默认年K输入，运行 3-5 次。

必须满足：

```text
HTTP 200
timeline.length 一致
year/age/row_id 完全一致
score 全部合法
OHLC 全部合法
global_analysis 存在
technical_commentary 存在
响应中无 reasoning/thinking 文本
```

期望稳定性：

```text
平均逐年 score 差异 <= 3
单年最大 score 差异 <= 8
高峰年龄段重合率 >= 80%
风险年龄段重合率 >= 80%
趋势方向一致率 >= 90%
```

如果达不到，优先继续缩小 DS 输出字段、增强 repair prompt 或调整分段上下文，而不是本地假补齐。

## 19. 明确禁止

```text
不碰 API key
不回 Qwen
不引入大依赖
不推倒重来
不先改合盘
不先改 daily/monthly
不一开始做完整本地命理知识库
不一开始做 base_score
不删除旧 prompt/schema
不使用默认 50 掩盖错误
不本地补假 timeline
```

## 20. 下一步推荐

下一次真正开始编码时，优先执行：

```text
Phase 8 performance + Phase 9 tags v1
```

也就是：

```text
抽出 segments 模块并补测试
4 段 DS 评分改为受控并发
新增不泄露 API key 的 live 验收脚本
给年度上下文加入轻量命理标签
更新 prompt，让 DS 正确使用标签但不机械套分
```

这一步继续只处理单人年K，不碰合盘、日K、月K和完整本地命理知识库。
