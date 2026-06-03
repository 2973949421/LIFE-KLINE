# OpenCode Go API 配置完成

## ✅ 已完成的配置更改

### 1. 环境变量配置
- **API Endpoint**: `https://opencode.ai/zen/go/v1` (完整路径: `https://opencode.ai/zen/go/v1/chat/completions`)
- **模型**: `deepseek-v4-flash` (DeepSeek V4 Flash)
- **API Key**: 已配置

### 2. 已更新的文件
- `.env.local` - 本地环境变量（包含 API Key）
- `.env.example` - 示例配置文件
- `lib/server/env.ts` - 默认模型名称改为 `deepseek-v4-flash`
- `README.md` - 更新文档说明

## 📋 本地测试步骤

### 步骤 1: 测试 API 连接
在项目目录运行：
```bash
bash test-api.sh
```

或者手动测试：
```bash
curl -X POST "https://opencode.ai/zen/go/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-ykrhEuzmR7Egf2wUmq0OWubAltpSYNx2NpubuhdQhWOoytpp0ANl3ozaQqueIo6z" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"你好"}],"max_tokens":10}'
```

预期看到 JSON 格式的响应，包含 `choices` 字段。

### 步骤 2: 启动开发服务器
```bash
cd B:/sharewithlight/lifeKLINE
pnpm install  # 如果还没安装依赖
pnpm dev
```

### 步骤 3: 测试完整功能
1. 访问 http://localhost:3000
2. 填写生日信息（例如：1990-01-01）
3. 选择性别、维度（财富/生命/情感）、周期（年度/月度/日度）
4. 点击生成，查看是否能正常返回 K 线分析

### 步骤 4: 确认结果
如果能看到：
- K 线图表正常显示
- 技术指标（MACD、KDJ、RSI、BOLL）正常显示
- 分析文本正常显示

说明配置成功！

## 🚀 推送到 GitHub

确认本地测试通过后，运行以下命令：

```bash
cd B:/sharewithlight/lifeKLINE

# 查看修改的文件
git status

# 添加所有更改
git add .env.example lib/server/env.ts README.md

# 提交更改
git commit -m "feat: migrate to OpenCode Go with DeepSeek V4 Flash

- Update API endpoint to https://opencode.ai/zen/go/v1
- Switch model from Qwen to DeepSeek V4 Flash
- Update environment variable examples and documentation"

# 推送到 GitHub
git push origin main
```

**注意**: 不要推送 `.env.local` 文件（它已经在 `.gitignore` 中）

## 🔧 Vercel 环境变量配置

推送到 GitHub 后，Vercel 会自动部署。你需要在 Vercel 中更新环境变量：

1. 登录 Vercel: https://vercel.com
2. 进入 `lifekline` 项目
3. 点击 **Settings** → **Environment Variables**
4. 更新以下变量（Production、Preview、Development 都要设置）：

```
ALI_BAILIAN_API_KEY = sk-ykrhEuzmR7Egf2wUmq0OWubAltpSYNx2NpubuhdQhWOoytpp0ANl3ozaQqueIo6z
ALI_BAILIAN_BASE_URL = https://opencode.ai/zen/go/v1
ALI_BAILIAN_MODEL_NAME = deepseek-v4-flash
```

5. 保存后，Vercel 会自动重新部署

## ⚠️ 如果遇到问题

### API 返回 401 Unauthorized
- 检查 API Key 是否正确
- 确认 OpenCode Go 账户状态

### API 返回 404 Not Found
- 确认 BASE_URL 是 `https://opencode.ai/zen/go/v1`
- 确认模型名称是 `deepseek-v4-flash`

### API 返回 429 Too Many Requests
- OpenCode Go 套餐额度用完
- 等待配额重置或升级套餐

### 本地可以但 Vercel 失败
- 检查 Vercel 环境变量是否正确设置
- 查看 Vercel Function Logs 获取详细错误信息

## 📝 技术说明

### 为什么选择 DeepSeek V4 Flash？
- 速度快，适合实时分析
- 成本低，适合高频调用
- 中文能力强，适合八字分析
- 支持 OpenAI 兼容 API，无需改代码

### API 兼容性
OpenCode Go 提供完整的 OpenAI 兼容 API，你的代码使用标准的 `/chat/completions` 端点，所以无需修改任何业务逻辑代码。

## ✅ 完成检查清单

- [x] 更新 `.env.local`
- [x] 更新 `.env.example`
- [x] 更新 `lib/server/env.ts`
- [x] 更新 `README.md`
- [ ] 运行 `test-api.sh` 测试 API
- [ ] 运行 `pnpm dev` 测试本地开发
- [ ] 推送到 GitHub
- [ ] 更新 Vercel 环境变量
- [ ] 验证生产环境正常工作
