# LifeKLINE

LifeKLINE is a standalone full-stack Next.js application for Life-Kline and Hepan-Kline analysis. It converts BaZi-based qualitative interpretation into structured K-line timelines, technical indicators, and narrative summaries.

Production site: [https://labklife.lightinglab.top](https://labklife.lightinglab.top)

## Model Lineage

- The late-April 2026 baseline, especially commit `0a1735c` from 2026-04-25, is treated as the mature Qwen Max implementation line.
- That Qwen Max line is no longer the active runtime path because the original LLM supplier/model access is unavailable.
- The current active line targets DeepSeek V4 Flash through OpenCode Go. The DS-specific stability plan is documented in `docs/lifekline-ds-stability-plan.md`.

## Features

- Single-person Life-Kline analysis
- Dual-person Hepan-Kline analysis
- BaZi calculation without calling AI
- K-line views for yearly, monthly, and daily periods
- Technical indicators including `MACD`, `KDJ`, `RSI`, and `BOLL`
- Structured AI prompt files stored in-repo
- Standalone deployment on Vercel

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ECharts
- `lunar-javascript`

## Local Development

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the real values:

```env
ALI_BAILIAN_API_KEY=your_opencode_go_api_key
ALI_BAILIAN_BASE_URL=https://opencode.ai/zen/go/v1
ALI_BAILIAN_MODEL_NAME=deepseek-v4-flash
```

Notes:

- `ALI_BAILIAN_API_KEY` and `ALI_BAILIAN_BASE_URL` are required
- The project uses **OpenCode Go** with DeepSeek V4 Flash through the `/chat/completions` endpoint
- `.env.local` must never be committed
- when the API is not configured, the analysis APIs return `503` instead of failing later with a generic `500`

## Quality Checks

```bash
pnpm lint
pnpm test:run
pnpm build
```

Current test coverage includes:

- BaZi calculation
- Hepan score rules
- TA math utilities
- score-to-OHLC conversion
- prompt file existence/loading
- route validation for bad requests

## Deployment

Recommended deployment target: Vercel.

1. Push the repository to GitHub
2. Import the project into Vercel
3. Configure the Bailian environment variables in Vercel project settings
4. Deploy
5. Bind the production domain `labklife.lightinglab.top` if needed

## Project Structure

```text
app/                         Next.js app router and API routes
components/life-kline/       charts and result components
content/prompts/             AI prompt sources
features/life-kline/         feature-layer hooks, ui, constants, types
lib/domain/                  BaZi, Hepan, TA, scoring, K-line logic
lib/server/                  server-side inference and env helpers
tests/                       node test suites
```

## Maintenance Boundary

This repository is now the independent source of truth for LifeKLINE. It is deployed and maintained separately from the personal site.

## License

MIT
