# Strata: PE Expansion Intelligence

Live frontend: [https://sarah-odell.github.io/Strata/](https://sarah-odell.github.io/Strata/)

Strata is a private equity and corporate development market-screening application for evaluating expansion markets by attractiveness, feasibility, and execution risk. It combines quantitative country scoring with an AI-powered multi-agent research pipeline to produce investment-grade market assessments.

## Product Surfaces

- **Deal Lab** — Prompt-driven recommendation logic, fund-size aware assumptions, strategy/sector/deal-size toggles, portfolio adjacency inputs, and memo export. Default landing tab.
- **Radar** — Country ranking table (sortable columns) and cards, selected-market detail panel, weighted factors with confidence/freshness/trend, and scenario sensitivity.
- **Deal Profile Radar** — Top-3 recommendation profile comparison with factor-level definitions.
- **Research** — Backend-orchestrated multi-agent market research with 5 specialist personas, prompt-driven analysis, single-market or batch scans (Top 5 / Top 10 / All 53), structured verdict cards with collapsible sections.

## Current Coverage

### Markets (53)

| Region | Markets |
|--------|---------|
| North America | US, CA |
| Europe | DE, GB, FR, NL, ES, IT, SE, PL, CH, DK, NO, FI, IE, AT, BE, CZ, PT, GR, HU, TR, RO |
| Asia-Pacific | SG, JP, AU, IN, ID, KR, CN, HK, TW, VN, TH, PH, MY, NZ |
| Middle East | AE, SA, IL, QA |
| Africa | ZA, NG, EG, KE, MA |
| Latin America | BR, MX, CL, CO, AR, PE, CR |

### Industries
Professional Services, Healthcare Services, Industrial Technology, Aerospace & Defense, Software & Data Services, Financial Services, Energy & Infrastructure, Consumer & Retail, Logistics & Transportation, Education & Training, Real Estate & Built Environment, Food & Agriculture

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

## Methodology

### Score Construction
- `Overall Score = 35% Sector Fit + 65% Country Factor Score`
- Country factor weights are dynamically rebalanced by strategy, sector, and deal size (always sum to 1.0).
- Recommendation bands: Very strong, Strong, Moderate, Weak, Very weak (strategy-specific thresholds).

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

### Scenario Stress Testing
Bull and bear cases apply independent shifts to each factor (e.g., bear: economicStrength -10, geopoliticalRisk +10) rather than flat score adjustments. This produces differentiated scenario spreads per country.

### Portfolio Adjacency Overlay
0 to +8 points based on existing sector/region footprint and operational capabilities.

### Transparency in UI
Per-factor value, weight, contribution, trend direction, confidence, and last refreshed timestamp. Explicit display of model assumptions in Deal Lab and Radar contexts.

## Data Sources (IC-grade priority)
Primary sources used in ingestion and market factors:
- International Monetary Fund (IMF)
- World Bank World Development Indicators (WDI)
- World Bank Global Financial Development Database (GFDD)
- OECD-linked national accounts and reference series where available

**Live indicator overrides:** The ingestion pipeline fetches GDP growth, FDI, inflation, tariff, and trade openness data from the World Bank and IMF APIs, scoring against absolute benchmarks (not relative ranking). Overrides `economicStrength` and `taxTariffFriction` for all 53 markets.

Core indicator mapping: `ingestion/update-indicators.mjs` → `src/data/indicatorOverrides.ts`

## Research Pipeline

5 AI analyst personas run in parallel via `claude -p` CLI:

| Persona | Focus |
|---------|-------|
| Senior Macroeconomist | GDP dynamics, inflation, FDI, currency risk, labor markets |
| Senior Regulatory Analyst | Foreign ownership, licensing, competition review, data protection |
| Senior Deal Execution Specialist | Deal volume, exit environment, legal infrastructure, advisor ecosystem |
| Senior Geopolitical Risk Analyst | Political stability, sanctions, trade tensions, institutional quality |
| Senior Industry Analyst | Market size, competitive landscape, M&A activity, growth drivers |

Each persona receives a data-sources skill with API references (World Bank, IMF, OECD, FRED, WGI, Transparency International, etc.) and CLI tool guidance for web search and data processing.

Results are aggregated into an ensemble score with confidence-weighted averaging and consensus detection (strong / moderate / split).

**Prompt-driven research:** The deal team provides a research prompt that becomes the primary driver of all 5 agent analyses. Agents address specific questions and concerns directly.

**Batch scanning:** Run research across Top 5, Top 10, or all 53 markets in parallel.

## Research Backend
The frontend can run with no backend for static scoring views, but `Research` requires a running backend.

### Local backend
```bash
npm run backend
```
Default URL: `http://localhost:8787`

### Backend environment variables
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

## Tech Stack
- React + TypeScript + Vite (frontend)
- Express (backend API)
- CSS custom design tokens ("Restrained Dark Intelligence" design system)
- `claude -p` CLI for agentic research
- World Bank / IMF APIs for live indicator ingestion
- Playwright for regulation monitoring

## Local Development

Install dependencies:
```bash
npm install
```

Frontend dev server (port 5173):
```bash
npm run dev
```

Backend (port 8787):
```bash
npm run backend
```

Both together:
```bash
npm run backend & npm run dev
```

Build/lint:
```bash
npm run build
npm run lint
```

Preview production build:
```bash
npm run build
npm run preview
```

## Operations Scripts

Indicator ingestion (World Bank + IMF data for all 53 markets):
```bash
npm run ingest:indicators
```

Research (single market):
```bash
npm run research -- --country US --countryCode US --sector "Professional Services" --strategy Buyout --prompt "What are the key risks?"
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

Memo export:
```bash
npm run memo:export -- --country DE --strategy Buyout --sector "Industrial Technology"
```

Persist score snapshots via backend:
```bash
STRATA_BACKEND_URL=http://localhost:8787 npm run snapshot:persist
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
- `.strata/` and `reports/` are gitignored local runtime artifacts.
