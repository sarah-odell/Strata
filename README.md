# Strata: PE Expansion Intelligence

Live frontend: [https://sarah-odell.github.io/Strata/](https://sarah-odell.github.io/Strata/)

Strata is a private equity and corporate development market-screening application for evaluating expansion markets by attractiveness, feasibility, and execution risk.

## Product Surfaces
- `Radar`: country ranking table/cards, selected-market detail, weighted factors, confidence, freshness, trend direction, and scenario sensitivity.
- `Deal Lab`: prompt-driven recommendation logic, fund-size aware assumptions, strategy/sector/deal-size toggles, and memo export.
- `Deal Profile Radar`: top-3 recommendation profile comparison with factor-level definitions.
- `Industry Definitions`: plain-language definitions for sectors, strategies, and scenario assumptions.
- `Research`: backend-orchestrated multi-agent market research runs, result history, and batch analysis.

## Current Coverage

### Markets (20)
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

### Industries
- Professional Services
- Healthcare Services
- Industrial Technology
- Aerospace & Defense
- Software & Data Services
- Financial Services
- Energy & Infrastructure
- Consumer & Retail
- Logistics & Transportation
- Education & Training
- Real Estate & Built Environment
- Food & Agriculture

### Deal Strategy Modes
- `Buyout`
- `Growth`
- `Low-Risk Entry`

### Scenario Modes
- `Base Case`: baseline macro and policy assumptions.
- `Bull Case`: more favorable demand/execution environment.
- `Bear Case`: stressed operating and policy environment.

### Deal Size Modes (USD)
- `$25M-$250M`
- `$250M-$1B`
- `$1B+`

## Methodology (Current)

### Score Construction
- `Overall Score = 35% Sector Fit + 65% Country Factor Score`
- Country factor weights are dynamically rebalanced by strategy, sector, and deal size.
- Recommendation bands:
  - `Very strong`
  - `Strong`
  - `Moderate`
  - `Weak`
  - `Very weak`

### Attractiveness Factors
- Market size and depth
- Market growth momentum
- Customer density
- Digital readiness
- Strategic adjacency overlay (from Deal Lab profile)

### Feasibility and Execution Factors
- Regulatory complexity
- Licensing complexity
- Language barriers (execution proxy)
- Competition intensity (financial proxy)
- Talent availability
- Tax and tariff friction
- Geopolitical risk
- Deal execution risk

### Transparency in UI
- Per-factor value, weight, contribution, trend direction, confidence, and last refreshed timestamp.
- Explicit display of model assumptions in Deal Lab and Radar contexts.

## Data Sources (IC-grade priority)
Primary sources used in ingestion and market factors:
- International Monetary Fund (IMF)
- World Bank World Development Indicators (WDI)
- World Bank Global Financial Development Database (GFDD)
- OECD-linked national accounts and reference series where available

Core indicator mapping is implemented in:
- `ingestion/update-indicators.mjs`
- Generated output: `src/data/indicatorOverrides.ts`

## Research Backend
The frontend can run with no backend for static scoring views, but `Research` requires a running backend.

### Local backend
```bash
npm run backend
```
Default URL: `http://localhost:8787`

### Optional backend environment variables
- `STRATA_BACKEND_PORT` (default `8787`)
- `STRATA_BACKEND_API_KEY` (enables `X-API-Key` auth)
- `STRATA_BACKEND_CORS_ORIGINS` (comma-separated allowlist or `*`)
- `STRATA_RATE_LIMIT_WINDOW_MS` (default `60000`)
- `STRATA_RATE_LIMIT_MAX` (default `30`)
- `STRATA_RESEARCH_JOB_TTL_HOURS` (default `24`)
- `STRATA_RESEARCH_MAX_BATCH` (default `20`)
- `STRATA_RESEARCH_MAX_PROMPT_CHARS` (default `5000`)
- `STRATA_CLAUDE_CMD` (default `claude`)

### Backend endpoints
- `GET /health`
- `GET /ready`
- `POST /api/research`
- `GET /api/research/jobs/:id`
- `POST /api/research/jobs/:id/cancel`
- `POST /api/research/batch`
- `GET /api/research/results`
- `GET /api/score-snapshots`
- `POST /api/score-snapshots`
- `GET /api/monitor-runs`
- `POST /api/monitor-runs`

Detailed runbook: [docs/backend-runbook.md](/Users/sarahodell/Documents/New%20project/docs/backend-runbook.md)

## Local Development
Install dependencies:
```bash
npm install
```

Frontend dev server:
```bash
npm run dev
```

Build/lint/test:
```bash
npm run build
npm run lint
npm test
```

Preview production build:
```bash
npm run build
npm run preview
```

## Operations Scripts
Indicator ingestion:
```bash
npm run ingest:indicators
```

Regulation monitor once:
```bash
npm run monitor:regulations:once
```

Regulation monitor schedule:
```bash
npm run monitor:regulations
```

Custom monitor cron:
```bash
REG_MONITOR_CRON="0 */4 * * *" npm run monitor:regulations
```

Persist score snapshots via backend:
```bash
STRATA_BACKEND_URL=http://localhost:8787 npm run snapshot:persist
```

Memo export:
```bash
npm run memo:export -- --country DE --strategy Buyout --sector "Industrial Technology"
```

## Deployment
- Frontend auto-deploys to GitHub Pages from `main` via `.github/workflows/deploy-frontend.yml`.
- Research backend deployment is not included in this repository's GitHub Pages deployment.

If you do not see the latest frontend, force refresh with:
- [https://sarah-odell.github.io/Strata/?v=latest](https://sarah-odell.github.io/Strata/?v=latest)

## Local Artifacts
- Backend store: `.strata/backend-store.json`
- Research jobs: `.strata/research-jobs.json`
- Research output files: `.strata/research/`
- Regulation monitor state: `.strata/regulation-monitor-state.json`
- Indicator quality outputs:
  - `.strata/indicator-raw-latest.json`
  - `.strata/indicator-quality-latest.json`

## Notes
- The `dexter/` directory is retained only as reference context; the current product and scoring engine are implemented in this Strata codebase.
- `.strata/` and `reports/` are gitignored local runtime artifacts.
