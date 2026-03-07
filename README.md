# Strata: PE Expansion Intelligence

Live site: [https://sarah-odell.github.io/Strata/](https://sarah-odell.github.io/Strata/)

Strata is a PE/corp-dev decision support tool for market expansion screening.

App sections:
- `Radar`: scoring, ranking table/cards, and transparent factor breakdowns
- `Deal Lab`: portfolio adjacency inputs, prompt-based tailored recommendations, and deal profile radar chart
- `Industry Definitions`: shared taxonomy and strategy/deal-size definitions

## What it does
- Scores countries by strategy and industry.
- Shows transparent factor scoring with citations.
- Provides scenario views (`base`, `upside`, `downside`).
- Adds a deal-team prompt tool that parses user context (fund size, target geography, strategy cues) and returns a tailored top-3 market view.
- Supports portfolio adjacency modeling (existing sectors, regions, and capabilities) that adjusts market rankings.
- Includes a deal-profile radar chart for each market (market position, growth, technology, customer quality, regulatory risk, integration risk).
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

Deal size bands:
- `Small Deal`: Under $250 million enterprise value
- `Mid Deal`: $250 million to $1 billion enterprise value
- `Large Deal`: Over $1 billion enterprise value

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
- Portfolio adjacency overlay (0 to +8 points)

Recommendation bands are strategy-specific (`Very strong`, `Strong`, `Moderate`, `Weak`, `Very weak`).

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
