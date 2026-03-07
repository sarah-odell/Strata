# Strata: PE Expansion Intelligence

Live site: [https://sarah-odell.github.io/Strata/](https://sarah-odell.github.io/Strata/)

Strata is a PE/corp-dev decision support tool for market expansion screening.

## What it does
- Scores countries by strategy and industry.
- Shows transparent factor scoring with citations.
- Provides scenario views (`base`, `upside`, `downside`).
- Monitors regulation sources across all tracked markets on a schedule.
- Exports memo drafts (`.md` and `.pdf`).
- Stores snapshots and monitor runs via a lightweight backend API.

## Coverage
Tracked markets (20):
- United States
- Germany
- Singapore
- Canada
- United Arab Emirates
- United Kingdom
- France
- Netherlands
- Japan
- Australia
- India
- Brazil
- Mexico
- Spain
- Italy
- South Korea
- Saudi Arabia
- Sweden
- Poland
- Indonesia

Industries:
- Professional Services
- Healthcare Services
- Industrial Technology
- Aerospace & Defense

Strategies:
- `Buyout`
- `Growth`
- `Low-Risk Entry`

## Scoring model
Overall score:
- `35%` sector fit
- `65%` weighted country factors

Factors:
- Economic strength
- Regulatory complexity
- Tax/tariff friction
- Geopolitical risk
- Deal execution risk

Recommendation bands are strategy-specific (`Go`, `Maybe`, `Avoid`).

## Tech stack
- React + TypeScript + Vite
- CSS (custom design tokens and component styles)
- Node scripts for ingestion, monitoring, reporting
- Express for local backend persistence

## Run locally
Install:
```bash
npm install
```

Frontend:
```bash
npm run dev
```

Checks:
```bash
npm run build
npm run lint
```

## Key scripts
Indicator ingestion:
```bash
npm run ingest:indicators
```

Regulation monitor (one-shot):
```bash
npm run monitor:regulations:once
```

Regulation monitor (every 6h):
```bash
npm run monitor:regulations
```

Custom monitor schedule:
```bash
REG_MONITOR_CRON="0 */4 * * *" npm run monitor:regulations
```

Memo export:
```bash
npm run memo:export -- --country DE --strategy Buyout --sector "Industrial Technology"
```

Backend API:
```bash
npm run backend
```

Persist score snapshots:
```bash
STRATA_BACKEND_URL=http://localhost:8787 npm run snapshot:persist
```

## Auto-deploy
Frontend auto-deploys to GitHub Pages on every push to `main`.

Workflow:
- `.github/workflows/deploy-frontend.yml`

## Local data locations
- Indicator overrides: `src/data/indicatorOverrides.ts`
- Monitor state: `.strata/regulation-monitor-state.json`
- Backend store: `.strata/backend-store.json`
- Generated reports/memos: `reports/`
