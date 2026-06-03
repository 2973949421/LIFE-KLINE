# Git 操作指南

## 前置步骤：测试 API

在推送代码之前，请先测试 API 是否正常工作：

### 方法 1: 使用 Node.js 脚本（推荐）
```bash
cd B:/sharewithlight/lifeKLINE
node test-api.mjs
```

### 方法 2: 使用 curl（如果有 Git Bash）
```bash
bash test-api.sh
```

### 方法 3: 启动开发服务器直接测试
```bash
pnpm dev
```
然后访问 http://localhost:3000 生成一个人生 K 线

---

## 确认测试通过后，推送到 GitHub

### 1. 查看修改的文件
```bash
cd B:/sharewithlight/lifeKLINE
git status
```

你应该看到：
- `.env.example` (modified)
- `lib/server/env.ts` (modified)
- `README.md` (modified)
- `MIGRATION.md` (new file)
- `test-api.sh` (new file)
- `test-api.mjs` (new file)

### 2. 添加修改的文件
```bash
git add .env.example
git add lib/server/env.ts
git add README.md
git add MIGRATION.md
git add test-api.sh
git add test-api.mjs
```

**注意**: 不要添加 `.env.local` 文件（它包含真实的 API Key）

### 3. 提交更改
```bash
git commit -m "feat: migrate to OpenCode Go with DeepSeek V4 Flash

- Update API endpoint to https://opencode.ai/zen/go/v1
- Switch model from Qwen to DeepSeek V4 Flash
- Update default model in env.ts to deepseek-v4-flash
- Add API test scripts (test-api.mjs and test-api.sh)
- Update documentation with new configuration"
```

### 4. 推送到 GitHub
```bash
git push origin master
```

如果是 main 分支，使用：
```bash
git push origin main
```

---

## Vercel 自动部署

推送到 GitHub 后，Vercel 会自动触发部署。但是部署会失败，因为环境变量还没更新。

---

## 更新 Vercel 环境变量

1. 访问 Vercel 控制台: https://vercel.com/dashboard
2. 选择 `lifekline` 项目
3. 点击 **Settings** 标签
4. 点击左侧菜单的 **Environment Variables**
5. 找到以下三个变量并点击编辑：

   **ALI_BAILIAN_API_KEY**
   - 值: `sk-ykrhEuzmR7Egf2wUmq0OWubAltpSYNx2NpubuhdQhWOoytpp0ANl3ozaQqueIo6z`
   - 环境: Production, Preview, Development (全选)

   **ALI_BAILIAN_BASE_URL**
   - 值: `https://opencode.ai/zen/go/v1`
   - 环境: Production, Preview, Development (全选)

   **ALI_BAILIAN_MODEL_NAME**
   - 值: `deepseek-v4-flash`
   - 环境: Production, Preview, Development (全选)

6. 点击 **Save** 保存每个变量

---

## 触发重新部署

更新环境变量后，有两种方式触发重新部署：

### 方法 1: 在 Vercel 控制台重新部署
1. 点击 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的三个点 `...`
4. 选择 **Redeploy**
5. 确认重新部署

### 方法 2: 推送一个小更新到 GitHub
```bash
# 更新 README 添加一个空行
echo "" >> README.md
git add README.md
git commit -m "chore: trigger Vercel redeploy"
git push origin master
```

---

## 验证部署成功

1. 等待 Vercel 部署完成（通常 1-2 分钟）
2. 访问你的生产网站: https://labklife.lightinglab.top
3. 测试生成一个人生 K 线
4. 检查是否正常显示结果

如果正常显示，说明迁移成功！🎉

---

## 如果遇到问题

### 查看 Vercel 部署日志
1. Vercel 控制台 → Deployments
2. 点击最新的部署
3. 查看 **Build Logs** 和 **Function Logs**

### 常见错误

**错误: "Not Found"**
- BASE_URL 设置错误
- 应该是: `https://opencode.ai/zen/go/v1`

**错误: 401 Unauthorized**
- API Key 错误或过期
- 检查 Vercel 环境变量中的 API Key

**错误: 429 Too Many Requests**
- OpenCode Go 配额用完
- 检查账户余额

**错误: 500 Internal Server Error**
- 查看 Function Logs 获取详细错误
- 可能是模型名称错误

---

## 回滚方案

如果新配置有问题，可以回滚：

```bash
git revert HEAD
git push origin master
```

然后在 Vercel 中恢复旧的环境变量。
