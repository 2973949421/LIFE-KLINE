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

## 2. 版本定位

当前仓库需要区分两条模型路线：

```text
2026-04-25 附近的 0a1735c：Qwen Max 供应商路径下的成型版本基线
2026-06-05 起的 763cad6 之后：DeepSeek V4 Flash / OpenCode Go 主链路
```

4 月底版本可以作为 Qwen Max 效果和产品语义的历史参考，但由于原 LLM 供应商/模型访问已不可用，不作为当前主链路继续维护。

当前新增的稳定性改造计划是针对 DeepSeek V4 Flash 的适配重构，不是回到 Qwen Max，也不是复制旧供应商实现。

## 3. 环境与命令

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

## 4. 当前模型与 API 边界

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

## 5. 当前核心问题判断

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

## 6. v4.2 改造主线

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

## 7. 实施时必须遵守

必须保留 legacy pipeline，新增功能通过开关进入：

```text
LIFE_KLINE_PIPELINE=v4_legacy
LIFE_KLINE_PIPELINE=v4_2_scaffold
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

## 8. 推荐执行顺序

每次只做一小段，完成后跑测试。

1. 增加 pipeline 开关。
2. 实现 `yearly-scaffold`，本地生成 `row_id/year/age`。
3. 实现 `annual-context`，补完整大运和流年干支。
4. 新增 DeepSeek 专用 prompt，只让 DS 返回 `row_id/score/analysis/confidence`。
5. 新增 DS 输出 schema 和 validator。
6. 改造 service 增加 v4.2 分支，legacy 保持可回退。
7. 改造 route 合成逻辑，最终 `year/age/OHLC/TA` 全来自本地。
8. 增加 retry repair。
9. 如果一次性 89 rows 仍不稳，再做分段生成。
10. 如果解释质量不足，再加轻量命理标签。

## 9. 验证标准

自动化：

```text
pnpm test:run
pnpm build
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

## 10. 回滚原则

任何 v4.2+ 改动都必须能通过配置回滚：

```text
LIFE_KLINE_PIPELINE=v4_legacy
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

## 11. Git 与发布

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
Add LifeKLINE yearly scaffold pipeline
Validate DeepSeek score responses
Segment yearly DeepSeek generation
```
