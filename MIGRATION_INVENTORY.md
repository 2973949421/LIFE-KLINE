# Migration Inventory - Life-Kline

**Source Project**: `B:\sharewithlight\personweb`
**Target Project**: `B:\sharewithlight\lifeKLINE`
**Generated**: 2026-04-22

---

## Summary

Total files to migrate: **33** (excluding tests and sandbox scripts)

Categories:
- UI (features): 12 files
- Components: 11 files
- API Routes: 4 files
- Domain Lib: 8 files
- Server Services: 3 files
- Prompts: 3 files
- Tests: 2 files

---

## 1. UI (features/life-kline)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `features/life-kline/constants.ts` | `features/life-kline/constants.ts` | - |
| `features/life-kline/types.ts` | `features/life-kline/types.ts` | - |
| `features/life-kline/hooks/requests.ts` | `features/life-kline/hooks/requests.ts` | - |
| `features/life-kline/hooks/useHepanKline.ts` | `features/life-kline/hooks/useHepanKline.ts` | - |
| `features/life-kline/hooks/useSingleLifeKline.ts` | `features/life-kline/hooks/useSingleLifeKline.ts` | - |
| `features/life-kline/ui/LifeKlineClient.tsx` | `features/life-kline/ui/LifeKlineClient.tsx` | Main client component |
| `features/life-kline/ui/HepanInputPanel.tsx` | `features/life-kline/ui/HepanInputPanel.tsx` | - |
| `features/life-kline/ui/HepanResultView.tsx` | `features/life-kline/ui/HepanResultView.tsx` | - |
| `features/life-kline/ui/LoadingState.tsx` | `features/life-kline/ui/LoadingState.tsx` | - |
| `features/life-kline/ui/ModeSidebar.tsx` | `features/life-kline/ui/ModeSidebar.tsx` | - |
| `features/life-kline/ui/SingleInputPanel.tsx` | `features/life-kline/ui/SingleInputPanel.tsx` | - |
| `features/life-kline/ui/SingleResultView.tsx` | `features/life-kline/ui/SingleResultView.tsx` | - |

**Imports to Update**: All imports using `@/features/life-kline/types` remain unchanged (alias `@/*` preserved).

---

## 2. Components (components/lab/life-kline)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `components/lab/life-kline/AnalysisPanel.tsx` | `components/life-kline/AnalysisPanel.tsx` | Remove `lab` from path |
| `components/lab/life-kline/BaziDisplay.tsx` | `components/life-kline/BaziDisplay.tsx` | - |
| `components/lab/life-kline/BOLLChart.tsx` | `components/life-kline/BOLLChart.tsx` | - |
| `components/lab/life-kline/chart-utils.ts` | `components/life-kline/chart-utils.ts` | - |
| `components/lab/life-kline/DualBaziDisplay.tsx` | `components/life-kline/DualBaziDisplay.tsx` | - |
| `components/lab/life-kline/KDJChart.tsx` | `components/life-kline/KDJChart.tsx` | - |
| `components/lab/life-kline/KlineMainChart.tsx` | `components/life-kline/KlineMainChart.tsx` | - |
| `components/lab/life-kline/MACDChart.tsx` | `components/life-kline/MACDChart.tsx` | - |
| `components/lab/life-kline/RSIChart.tsx` | `components/life-kline/RSIChart.tsx` | - |
| `components/lab/life-kline/ScoreDetailCard.tsx` | `components/life-kline/ScoreDetailCard.tsx` | - |

**Imports to Update**:
- `LifeKlineClient.tsx`: `@/components/lab/life-kline/*` → `@/components/life-kline/*`
- All chart components internal imports unchanged

---

## 3. API Routes (app/api)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `app/api/life-kline/route.ts` | `app/api/life-kline/route.ts` | - |
| `app/api/life-kline/bazi/route.ts` | `app/api/life-kline/bazi/route.ts` | - |
| `app/api/hepan-kline/route.ts` | `app/api/hepan-kline/route.ts` | - |
| `app/api/hepan-kline/bazi/route.ts` | `app/api/hepan-kline/bazi/route.ts` | - |

**Imports to Update**:
- `@/lib/bazi` → `@/lib/domain/bazi`
- `@/lib/hour-map` → `@/lib/domain/hour-map`
- `@/lib/hepan-score` → `@/lib/domain/hepan-score`
- `@/lib/kline-constants` → `@/lib/domain/kline-constants`
- `@/lib/score-to-ohlc` → `@/lib/domain/score-to-ohlc`
- `@/lib/xingsu` → `@/lib/domain/xingsu`
- `@/kline-sandbox/lib/ta-math` → `@/lib/domain/ta-math`
- `@/lib/server/life-kline/service` → unchanged
- `@/lib/server/hepan-kline/service` → unchanged

---

## 4. Domain Lib (lib)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `lib/bazi.ts` | `lib/domain/bazi.ts` | - |
| `lib/hour-map.ts` | `lib/domain/hour-map.ts` | - |
| `lib/score-to-ohlc.ts` | `lib/domain/score-to-ohlc.ts` | - |
| `lib/hepan-score.ts` | `lib/domain/hepan-score.ts` | - |
| `lib/kline-constants.ts` | `lib/domain/kline-constants.ts` | - |
| `lib/xingsu.ts` | `lib/domain/xingsu.ts` | - |
| `lib/wuxing-colors.ts` | `lib/domain/wuxing-colors.ts` | Used by DualBaziDisplay |
| `kline-sandbox/lib/ta-math.ts` | `lib/domain/ta-math.ts` | Moved from sandbox |

**Imports to Update**:
- `hepan-score.ts`: imports from `./bazi` and `./xingsu` → `./bazi` and `./xingsu` (same directory)
- `ta-math.ts`: no imports, standalone
- `DualBaziDisplay.tsx`: `@/lib/wuxing-colors` → `@/lib/domain/wuxing-colors`

---

## 5. Server Services (lib/server)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `lib/server/life-kline/service.ts` | `lib/server/life-kline/service.ts` | - |
| `lib/server/hepan-kline/service.ts` | `lib/server/hepan-kline/service.ts` | - |
| `lib/server/llm/bailian.ts` | `lib/server/llm/bailian.ts` | Extracted Bailian config |

**Imports to Update**:
- `service.ts` (life-kline): `@/lib/bazi` → `@/lib/domain/bazi`
- `service.ts` (life-kline): `@/lib/hour-map` → `@/lib/domain/hour-map`
- `service.ts` (life-kline): `content/skills/life-kline/skill.md` → `content/prompts/life-kline/skill.md`
- `service.ts` (hepan-kline): `@/lib/bazi` → `@/lib/domain/bazi`
- `service.ts` (hepan-kline): `@/lib/hepan-score` → `@/lib/domain/hepan-score`
- `service.ts` (hepan-kline): `@/lib/kline-constants` → `@/lib/domain/kline-constants`
- `service.ts` (hepan-kline): `content/skills/hepan-kline/skill.md` → `content/prompts/hepan-kline/skill.md`

**env.ts Special Handling**:
- Source: `lib/server/env.ts` requires Supabase env vars
- Target: `lib/server/env.ts` must only require Bailian env vars, no Supabase

---

## 6. Prompts (content)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `content/skills/life-kline/skill.md` | `content/prompts/life-kline/skill.md` | - |
| `content/skills/life-kline/schema.json` | `content/prompts/life-kline/schema.json` | - |
| `content/skills/hepan-kline/skill.md` | `content/prompts/hepan-kline/skill.md` | - |

---

## 7. Tests (tests)

| Source Path | Target Path | Notes |
|-------------|-------------|-------|
| `tests/bazi.test.ts` | `tests/bazi.test.ts` | Update import path |
| `tests/score-to-ohlc.test.ts` | `tests/score-to-ohlc.test.ts` | - |

**New Tests Required**:
- `tests/hepan-score.test.ts` - verify adjustment calculation
- `tests/ta-math.test.ts` - verify indicator calculations
- `tests/api-validation.test.ts` - verify 400 responses

---

## 8. NOT Migrated (Shared or Unused)

| Path | Reason |
|------|--------|
| `lib/server/supabase.ts` | Supabase not needed in standalone project |
| `lib/supabase.ts` | Supabase not needed |
| `lib/server/env.ts` (Supabase vars) | Replaced with Life-Kline-only env |
| `lib/fonts.ts` | Personweb-specific fonts |
| `lib/utils.ts` | Generic utility, may copy if needed |
| `lib/site/content/*` | Personweb site content |
| `content/skills/financial-analysis/*` | Financial feature, not Life-Kline |
| `kline-sandbox/scripts/*` | Dev/test scripts, not production code |
| `hepan-sandbox/*` | Dev/test scripts, not production code |
| `app/(lab)/lab/life-kline/page.tsx` | Personweb routing, replaced with new page.tsx |
| `app/tools/life-kline/page.tsx` | Personweb routing, not needed |
| `features/life-kline/state/.gitkeep` | Empty, not needed |

---

## 9. External Dependencies

**Required npm packages** (from personweb package.json):
- `next@16.2.1`
- `react@19.2.4`
- `react-dom@19.2.4`
- `lunar-javascript` - for bazi calculations
- `echarts` and `echarts-for-react` - for chart components
- `@ai-sdk/openai` - for Bailian LLM integration

**Optional packages** (check if needed):
- `date-fns` - may be used in components
- `clsx` or similar - for className utilities

---

## 10. Import Path Mapping Summary

```
Source Pattern                      → Target Pattern
@/lib/bazi                          → @/lib/domain/bazi
@/lib/hour-map                      → @/lib/domain/hour-map
@/lib/score-to-ohlc                 → @/lib/domain/score-to-ohlc
@/lib/hepan-score                   → @/lib/domain/hepan-score
@/lib/kline-constants               → @/lib/domain/kline-constants
@/lib/xingsu                        → @/lib/domain/xingsu
@/kline-sandbox/lib/ta-math         → @/lib/domain/ta-math
@/components/lab/life-kline/*       → @/components/life-kline/*
content/skills/life-kline/skill.md  → content/prompts/life-kline/skill.md
content/skills/hepan-kline/skill.md → content/prompts/hepan-kline/skill.md
```

---

## Acceptance Checklist for Phase 0

- [x] All UI files inventoried (12 files)
- [x] All component files inventoried (11 files)
- [x] All API routes inventoried (4 routes)
- [x] All domain lib files inventoried (8 files)
- [x] All server service files inventoried (3 files)
- [x] All prompt files inventoried (3 files)
- [x] Hepan prompt and API included
- [x] Import path mappings defined
- [x] Shared files identified as NOT migrated
- [x] External dependencies listed

---

**Status**: READY for Phase 1 (Scaffold)