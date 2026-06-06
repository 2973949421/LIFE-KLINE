# LifeKLINE Agent 工作规约

这份文档是给后续 Codex/agent 在本仓库工作的长期规约。它记录当前 LifeKLINE 项目最容易误判的地方、模型调用边界、验证方式和后续重构主线。

默认使用中文沟通。除非用户明确要求英文，或代码/API/字段名本身必须使用英文，否则计划、解释、风险说明、验收流程和总结都使用中文。

## 1. 仓库与初始检查

当前项目仓库位于：

```text
B:\sharewithlight\lifeKLINE
```

进入任何修改前先检查：

```text
git status --short --branch
```

本仓库可能存在未提交或未跟踪文件。不要覆盖、删除、回滚与当前任务无关的改动。尤其注意：

```text
.env.local 不可提交、不可打印 API key
AGENTS.md 可能是本地规约文件
test-my-bazi.mjs 如未明确要求，不要处理
```

## 2. 计划模式规则

当用户要求“先规划”“先别写”“看看怎么做”“给方案”“做设计”“评估能否做”“先总结路线”时，先不要改运行代码。计划模式不是闲聊，也不是空泛路线图；它是正式工程交付前的可验证方案。

如果用户明确要求更新计划文档或 AGENTS.md，本身就是文档任务，可以修改对应文档；但仍不得顺手实现运行代码。

一份有效计划至少要包含：

```text
1. 目标
   - 用中文复述用户真正想解决的问题。
   - 说明最终要达成的结果，不要只写“改某文件”。

2. 成功标准
   - 写清楚完成后如何判断“真的修好 / 真的落地”。
   - 成功标准必须是行为级、结果级或验收级，不是任务清单。

3. 已知上下文与初步判断
   - 当前 git 工作区状态。
   - 当前模型、供应商、环境变量边界和默认输入。
   - 相关模块、数据流、已有测试和框架约束。
   - 初步怀疑的问题来源或实现切入点，但不要把推测写成事实。

4. 范围边界
   - 明确 In scope：本次会处理什么。
   - 明确 Out of scope：本次不会处理什么。
   - 如果需求有过度设计风险，要直接指出，并给出当前阶段可落地的小版本。

5. 技术实现路径
   - 会改哪些包、模块、文件、prompt、schema 或文档。
   - 会不会影响 API route、response shape、schema、prompt、前端展示、测试或部署。
   - 如果会改核心契约，先说明契约变化，再写代码。
   - 优先沿用项目已有模式，不轻易引入新依赖或新抽象。

6. 分阶段执行步骤
   - 按依赖顺序列出实施步骤。
   - 每一步都要是可执行、可验证的动作。
   - 每一步说明为什么要做。
   - 第一版要足够窄，方便验证和回滚。

7. 预期改动清单
   - 列出预计会检查、修改或新增的文件 / 模块。
   - 这是预期清单，不要伪装成已经确认的事实。

8. 风险、未知项与替代方案
   - 写明可能失败在哪里。
   - 写明哪些前提尚未确认。
   - 写明如果主路径不成立，准备采用什么更小或更稳的替代方案。
   - 写明哪些尝试是无效或禁止的。

9. 自动化验证
   - 写清楚要跑哪些命令。
   - 默认至少考虑 pnpm test:run、pnpm build。
   - 不把重装依赖当作验证手段。
   - 如果某个检查跑不了，要说明替代检查。

10. 人工验收流程
   - 写清楚用户或 agent 怎么手动看结果。
   - 说明应该看到什么。
   - 说明什么现象代表失败。
   - 涉及真实模型时，要写清楚请求体、成功路径、失败路径和边界路径。

11. 阻塞性问题
   - 只有真正阻塞执行的问题才列出来。
   - 不要泛泛地问“你希望我怎么做”。
   - 如果可以通过读代码、读文档或局部验证自行消化，就不要把问题丢回给用户。

12. 最小化与回滚策略
   - 优先最小修复，不把顺手重构混入当前任务。
   - 如果发现系统性问题，单独提出下一阶段建议，不和本次修复绑在一起。
   - 失败时保留日志、错误体、请求信息和验证痕迹，不要用假数据掩盖。

13. 下一步交付物
   - 说明下一步应该写代码、补文档、加测试、改 prompt/schema，还是继续调查。
```

用户在计划过程中补充约束时，要把新信息吸收进原目标，而不是被中途插话带偏。不要因为用户举了几个例子，就把整体计划缩窄成那几个例子。

计划必须防止过度设计。长期想法可以记录为边界，但不能替代当前可验证的下一步实现。

一个差计划通常有这些特征：

```text
只有“我要改 A、改 B、跑测试”的任务清单。
没有成功标准。
没有体现代码库上下文。
没有明确 In scope / Out of scope。
没有验证路径。
没有暴露风险和未知项。
把预期改动说成既成事实。
```

一个优质计划至少要让用户在批准执行前判断三件事：

```text
它理解问题了吗？
它打算怎么改？
它怎么证明改对了？
```

## 3. 版本定位

当前仓库需要区分两条模型路线：

```text
2026-04-25 附近的 0a1735c：Qwen Max 供应商路径下的成型版本基线
2026-06-05 起的 763cad6 之后：DeepSeek V4 Flash / OpenCode Go 主链路
```

4 月底版本可以作为 Qwen Max 效果和产品语义的历史参考，但由于原 LLM 供应商/模型访问已不可用，不作为当前主链路继续维护。

当前新增的稳定性改造计划是针对 DeepSeek V4 Flash 的适配重构，不是回到 Qwen Max，也不是复制旧供应商实现。

## 4. 环境与命令

优先使用现有依赖，不要重装：

```text
不要运行 pnpm install，除非用户明确要求
不要删除 node_modules、.next、.pnpm-store
```

常用验证命令：

```text
pnpm test:run
pnpm build
pnpm dev
pnpm start
```

端口规则：

```text
next start 默认使用 3000，端口占用时会直接失败
next dev 可自动换端口，但同一项目目录不能同时跑多个 dev server
如出现 Another next dev server is already running，先查同项目残留进程
```

Windows 环境里 `rg` 可能被拒绝执行。第一次失败后不要反复尝试，可改用：

```text
git grep -n "<pattern>" -- .
git ls-files
Get-ChildItem -Recurse -File
Select-String -Encoding UTF8 -Path <path> -Pattern <pattern>
```

中文文档用 UTF-8 读取：

```text
Get-Content -Encoding UTF8 <path>
Get-Content -Raw -Encoding UTF8 <path>
Select-String -Encoding UTF8 -Path <path> -Pattern <pattern>
```

## 5. 当前模型与 API 边界

当前主模型为：

```text
ALI_BAILIAN_BASE_URL=https://opencode.ai/zen/go/v1
ALI_BAILIAN_MODEL_NAME=deepseek-v4-flash
```

服务层应使用 OpenCode Go `/chat/completions`：

```text
POST https://opencode.ai/zen/go/v1/chat/completions
model=deepseek-v4-flash
response_format={ "type": "json_object" }
```

如果配置中出现 `opencode-go/deepseek-v4-flash`，实际发给 API 时应去掉 `opencode-go/` 前缀。

不要默认回到 Qwen，不要继续使用 Qwen `/messages` 作为主链路。Qwen 相关分支只能作为后续实验，不是当前主路径。

DS 推理模型可能返回 reasoning 类字段。解析时只取最终回答内容：

```text
choices[0].message.content
```

明确忽略：

```text
reasoning_content
reasoning
thinking
```

## 6. 当前核心问题判断

同一八字多次生成年K不稳定，根因不是 DS 完全不适合命理，而是当前架构让模型一次性承担太多职责：

```text
命理判断
+ 寿元/长度决定
+ 75-89 年 timeline 规划
+ 每年 score 曲线
+ 每年 analysis
+ JSON 严格结构
+ 全局分析
```

当前正确方向不是本地重建完整命理知识库，也不是回到 Qwen，而是：

```text
本地负责事实、结构、边界、校验和 K 线计算
DeepSeek 负责命理判断、年度评分和解释
本地限制 DeepSeek 的输出自由度
```

最重要原则：

```text
先收回 timeline 主权
```

DS 不应决定：

```text
timeline 长度
year
age
row_id
OHLC
技术指标
```

DS 可以负责：

```text
score
analysis
confidence
global_analysis
```

详细执行计划见：

```text
docs/lifekline-ds-stability-plan.md
```

## 7. v4.2 改造主线

后续改造按渐进式路线执行：

```text
v4.1 当前 legacy 架构
  ↓
v4.2 固定年K scaffold
  ↓
v4.3 补全完整大运/流年上下文
  ↓
v4.4 严格 validator + retry
  ↓
v4.5 分段生成
  ↓
v4.6 轻量命理标签
  ↓
v5 可选：本地 base_score + DS score_delta
```

第一批只做单人年K，不碰：

```text
合盘
daily/monthly
完整本地命理知识库
复杂喜忌系统
base_score
大规模前端重构
```

## 8. 实施时必须遵守

本次 DS 年K首批重构已选择更直接的策略：单人 `yearly/year` 默认走 v4.2，`daily/monthly` 和合盘暂时保留 legacy。不要再为第一批补 `LIFE_KLINE_PIPELINE` 开关，除非用户后续明确要求。

```text
single yearly/year -> v4.2
single daily/monthly -> legacy
hepan -> legacy
```

第一阶段默认不要删除旧 prompt/schema。

新增 DS 年K稳定性链路时，优先新增文件，不要把所有逻辑塞进现有 `service.ts`：

```text
lib/domain/life-kline/yearly-scaffold.ts
lib/domain/life-kline/annual-context.ts
lib/server/life-kline/validate-ds-score.ts
content/prompts/life-kline/skill.deepseek.md
content/prompts/life-kline/schema.ds-score.v1.json
```

禁止用默认值掩盖模型错误：

```text
不要把非法 score 静默改成 50
不要本地补假 timeline
不要缺行时继续出图
不要让 DS 输出的 year/age/OHLC 进入最终响应
```

失败时应：

```text
validator fail
retry 修复一次
仍失败则返回明确错误
```

## 9. 推荐执行顺序

每次只做一小段，完成后跑测试。

当前 `7d86f63 Add DeepSeek yearly scaffold pipeline` 与 `ad67e58 Improve DeepSeek yearly stability checks` 已完成 v4.2 首批闭环和 Phase 8/9 第一轮推进：

```text
yearly scaffold
annual context
DS prompt/schema/validator
单人年K v4.2 service
4 段受控并发 + retry repair
route 本地合成 OHLC/TA
live 验收脚本
轻量命理标签
DS compact context
```

后续优先顺序：

```text
1. 用 live accuracy_summary 收集 3-5 个典型样本。
2. 对比网页版 DS / GPT Pro / 当前 API 输出的主峰、风险段和走势。
3. 只调 prompt、tag legend 和 compact context，暂不改 scaffold/validator 主契约。
4. 如果多样本主趋势仍漂移，再讨论 Phase 10 base_score。
```

历史执行顺序如下，供理解当前代码来源：

1. 实现 `yearly-scaffold` 和图表寿元，本地生成 `row_id/year/age`。
2. 实现 `annual-context`，补完整大运和流年干支。
3. 新增 DeepSeek 专用 prompt，只让 DS 返回 `row_id/score/analysis/confidence`。
4. 新增 DS 输出 schema 和 validator。
5. 改造 service，让单人年K直接走 v4.2，日/月K保留 legacy。
6. 默认 4 段生成，并对每段增加 retry repair。
7. 单独生成并校验 `global_analysis`。
8. 改造 route 合成逻辑，最终 `year/age/OHLC/TA` 全来自本地。
9. 如果解释质量不足，再加轻量命理标签。

## 10. 验证标准

自动化：

```text
pnpm test:run
pnpm build
pnpm test:live:life-kline -- --runs 3
```

真实接口验收默认输入：

```json
{
  "birth": "2004-06-20",
  "birthTime": "19:30",
  "gender": "male",
  "dimension": "emotion",
  "period": "yearly"
}
```

单次请求必须满足：

```text
HTTP 200
dimension === emotion
period === yearly
timeline.length 固定且符合配置
第一条 year=2004
第一条 age=1
row_id 覆盖率 100%
score 全部 0-100
OHLC 合法
global_analysis 存在
technical_commentary 存在
响应中不含 reasoning/thinking 文本
```

稳定性验收：

```text
同一输入运行 3-5 次
timeline 长度一致率 100%
year/age/row_id 一致率 100%
主峰年龄段不应大幅漂移
风险年龄段不应大幅漂移
```

## 11. 回滚原则

当前 v4.2 首批实现不使用 env pipeline 开关。回滚方式是 Git revert 对应重构提交；如后续需要运行时切换，再单独增加 pipeline 开关。

```text
git revert <v4.2-refactor-commit>
```

如果 DS 输出仍不稳定，优先：

```text
缩小 DS 输出字段
加强 validator
增加 retry
启用分段生成
精简 prompt
```

不要优先：

```text
回 Qwen
本地假补齐
默认 50
完整重写命理引擎
一次性大重构
```

## 12. Git 与发布

提交前确认：

```text
git status --short --branch
git diff --check
pnpm test:run
pnpm build
```

只暂存本次任务相关文件。不要因为图省事 `git add -A` 把 `.env.local`、临时测试脚本或用户未确认文件带进去。

提交信息保持具体，例如：

```text
Add LifeKLINE yearly scaffold
Validate DeepSeek score responses
Segment yearly DeepSeek generation
```
