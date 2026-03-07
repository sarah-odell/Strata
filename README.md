# Strata: PE Expansion Intelligence

Live site: [https://sarah-odell.github.io/Strata/](https://sarah-odell.github.io/Strata/)

Strata is a PE/corp-dev decision support tool for market expansion screening.

App sections:
- `Radar`: scoring, ranking table/cards, selected-market detail panel, and transparent factor breakdowns
- `Deal Lab`: portfolio adjacency inputs, prompt-based tailored recommendations, and a deal profile radar chart auto-bound to prompt context
- `Industry Definitions`: shared taxonomy and strategy/deal-size definitions

## What it does
- Scores countries by strategy and industry.
- Shows transparent factor scoring with citations.
- Provides scenario views (`base`, `bull`, `bear`).
- Defaults to table view in Radar, with the selected-market panel above the ranking table.
- Adds a deal-team prompt tool that parses user context (fund size, target geography, strategy cues) and returns a tailored top-3 market view.
- Supports portfolio adjacency modeling (existing sectors, regions, and capabilities) that adjusts market rankings.
- Includes a deal-profile radar chart for each market (market position, growth, technology, customer quality, regulatory risk, integration risk).
- Monitors regulation sources across all tracked markets on a schedule.
- Exports Deal Lab memo drafts in-app as `.md`.
- Supports CLI memo export as `.md` and `.pdf` into `reports/`.
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
- Software & Data Services
- Financial Services
- Energy & Infrastructure
- Consumer & Retail
- Logistics & Transportation
- Education & Training
- Real Estate & Built Environment
- Food & Agriculture

Strategies:
- `Buyout`
- `Growth`
- `Low-Risk Entry`

Scenario cases:
- `Base Case`: Most likely operating environment under current macro and policy assumptions.
- `Bull Case`: Upside environment with stronger demand/execution and more favorable policy conditions.
- `Bear Case`: Downside environment with weaker growth and higher regulatory/geopolitical friction.

Deal size bands:
- `$25M-$250M`
- `$250M-$1B`
- `$1B+`

## Scoring model
Overall score:
- `35%` sector fit
- `65%` weighted country factors
- Factor weights are dynamically rebalanced by deal size (`$25M-$250M`, `$250M-$1B`, `$1B+`) so small, mid, and large funds receive size-appropriate rankings.

Factors:
- Attractiveness:
- Market size & depth
- Market growth momentum
- Customer density
- Digital readiness
- Strategic adjacency (modeled as portfolio adjacency overlay, `0` to `+8`)
- Feasibility:
- Regulatory complexity
- Licensing complexity
- Language barriers (execution proxy)
- Competition intensity
- Talent availability
- Additional risk controls:
- Tax/tariff friction
- Geopolitical risk
- Deal execution risk

Recommendation bands are strategy-specific (`Very strong`, `Strong`, `Moderate`, `Weak`, `Very weak`).

## IC-Grade Data Sources
Strata’s core market factor ingestion uses primary institutional datasets:
- International Monetary Fund (IMF) DataMapper / IFS-backed series
- World Bank World Development Indicators (WDI) API
- World Bank Global Financial Development Database (GFDD), including banking concentration metrics
- OECD National Accounts and related reference series surfaced through WDI metadata

Key indicators used for the added market-structure factors:
- `Market size & depth`: `NY.GDP.MKTP.CD`, `SP.POP.TOTL`, `FD.AST.PRVT.GD.ZS`
- `Market growth momentum`: `NY.GDP.MKTP.KD.ZG`, `NY.GDP.PCAP.KD.ZG`, `BX.KLT.DINV.WD.GD.ZS`
- `Market concentration risk`: `GFDD.OI.01`, `GFDD.OI.06`
- `Customer density`: `EN.POP.DNST`, `SP.URB.TOTL.IN.ZS`, `SP.POP.TOTL`
- `Digital readiness`: `IT.NET.USER.ZS`, `IT.NET.BBND.P2`
- `Licensing complexity`: `RQ.EST` (regulatory quality estimate, inverted), with tax/tariff friction overlay
- `Talent availability`: `SE.TER.ENRR`, `SL.UEM.TOTL.ZS`, and digital readiness

Data transform and scoring logic live in:
- `ingestion/update-indicators.mjs`
- `src/data/indicatorOverrides.ts` (generated output snapshot)

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

If you do not see the latest UI on the live site, force refresh and load:
- [https://sarah-odell.github.io/Strata/?v=latest](https://sarah-odell.github.io/Strata/?v=latest)

## Local data locations
- Indicator overrides: `src/data/indicatorOverrides.ts`
- Monitor state: `.strata/regulation-monitor-state.json`
- Backend store: `.strata/backend-store.json`
- Generated reports/memos: `reports/`
