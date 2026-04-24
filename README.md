# lifeKLINE

人生 K 线图 - 基于八字命理的人生运势量化系统

## 功能

- 单人 Life-Kline 分析：基于八字生成人生运势 K 线图
- Hepan 合盘分析：双人八字合盘，分析关系运势
- 多维度分析：财富运势、生命健康、情感婚恋
- 多周期视图：年K、月K、日K
- 技术指标展示：MACD、KDJ、RSI、BOLL 等
- 即时八字排盘：无需 AI 的本地排盘功能

## 本地开发

```bash
pnpm install
pnpm dev
```

开发服务器启动后访问 http://localhost:3000

## 测试

```bash
pnpm test:run
```

## 构建

```bash
pnpm build
```

## 代码检查

```bash
pnpm lint
```

## 环境变量

本项目需要配置以下环境变量：

```env
# Bailian LLM API (必需)
ALI_BAILIAN_API_KEY=        # 百炼 API Key
ALI_BAILIAN_BASE_URL=       # 百炼 API Base URL
ALI_BAILIAN_MODEL_NAME=qwen-max  # 模型名称

# Site URLs (可选)
NEXT_PUBLIC_SITE_URL=https://labklife.lightinglab.top  # 本站 URL
NEXT_PUBLIC_PERSON_SITE_LAB_URL=https://lightinglab.top/lab  # 返回 LAB 链接
```

### 本地配置

1. 复制 `.env.example` 为 `.env.local`
2. 填入真实的 API Key 和 Base URL
3. **注意：不要提交 `.env.local` 到 Git**

## Vercel 部署

1. 将本仓库推送到 GitHub
2. 在 Vercel 中导入该仓库
3. 在 Vercel 项目设置中配置环境变量
4. 绑定自定义域名 `labklife.lightinglab.top`

## 安全注意事项

- **不要提交真实 API Key**：`.env.local` 已被 `.gitignore` 忽略
- API 未配置时会返回 503 错误，不会尝试无效请求
- 所有 API 请求在服务端执行，Key 不会暴露到客户端

## 项目结构

```
├─ app/                    # Next.js App Router
│  ├─ page.tsx             # 首页
│  ├─ layout.tsx           # 布局
│  └─ api/                 # API 路由
├─ features/life-kline/    # 功能模块
│  ├─ ui/                  # UI 组件
│  ├─ hooks/               # React Hooks
│  ├─ types.ts             # 类型定义
│  └─ constants.ts         # 常量
├─ components/life-kline/  # 图表等组件
├─ lib/
│  ├─ domain/              # 域名逻辑（八字、技术指标等）
│  └─ server/              # 服务端逻辑（AI 调用等）
├─ content/prompts/        # AI 提示词
└─ tests/                  # 测试文件
```

## License

MIT