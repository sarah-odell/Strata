# Strata: PE Expansion Intelligence

Live site: [https://sarah-odell.github.io/Strata/](https://sarah-odell.github.io/Strata/)

Strata is a PE/corp-dev decision support tool for market expansion screening. It combines quantitative country scoring with an AI-powered multi-agent research pipeline to produce investment-grade market assessments.

## App sections

- **Radar** — Scoring table with sortable columns, ranking cards, transparent factor breakdowns, deal profile radar chart bound to prompt context
- **Deal Lab** — Portfolio adjacency inputs, prompt-based tailored recommendations (parses fund size, target geography, strategy cues), deal-team memo exports
- **Research** — AI ensemble research with 5 specialist personas, prompt-driven analysis, single-market or batch scans (Top 5 / Top 10 / All 53), structured verdict cards with collapsible sections

## Coverage

53 tracked markets across 6 regions:

| Region | Markets |
|--------|---------|
| North America | US, CA |
| Europe | DE, GB, FR, NL, ES, IT, SE, PL, CH, DK, NO, FI, IE, AT, BE, CZ, PT, GR, HU, TR, RO |
| Asia-Pacific | SG, JP, AU, IN, ID, KR, CN, HK, TW, VN, TH, PH, MY, NZ |
| Middle East | AE, SA, IL, QA |
| Africa | ZA, NG, EG, KE, MA |
| Latin America | BR, MX, CL, CO, AR, PE, CR |

12 industries: Professional Services, Healthcare Services, Industrial Technology, Aerospace & Defense, Software & Data Services, Financial Services, Energy & Infrastructure, Consumer & Retail, Logistics & Transportation, Education & Training, Real Estate & Built Environment, Food & Agriculture

3 strategies: Buyout, Growth, Low-Risk Entry

## Scoring model

Overall score = 35% sector fit + 65% weighted country factors.

**Factors** (weights vary by strategy, always sum to 1.0):
- Economic strength
- Regulatory complexity (inverted — lower is better)
- Tax/tariff friction (inverted)
- Geopolitical risk (inverted)
- Deal execution risk (inverted)

**Scenario stress testing:** Bull and bear cases apply independent shifts to each factor (e.g., bear: economicStrength -10, geopoliticalRisk +10) rather than flat score adjustments. This produces differentiated scenario spreads per country.

**Deal size adjustment:** Small/large deals shift scores based on friction or scale factors.

**Portfolio adjacency overlay:** 0 to +8 points based on existing sector/region footprint and operational capabilities.

Recommendation bands are strategy-specific: Very strong, Strong, Moderate, Weak, Very weak.

**Live indicator overrides:** The ingestion pipeline fetches GDP growth, FDI, inflation, tariff, and trade openness data from the World Bank and IMF APIs, scoring against absolute benchmarks (not relative ranking). Overrides `economicStrength` and `taxTariffFriction` for all 53 markets.

## Research pipeline

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

## Tech stack

- React + TypeScript + Vite (frontend)
- Express (backend API on port 8787)
- CSS custom design tokens ("Restrained Dark Intelligence" design system)
- `claude -p` CLI for agentic research
- World Bank / IMF APIs for live indicator ingestion
- Playwright for regulation monitoring

## Run locally

```bash
npm install
```

Frontend (port 5173):
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

## Key scripts

Indicator ingestion (World Bank + IMF data for all 53 markets):
```bash
npm run ingest:indicators
```

Research (single market):
```bash
npm run research -- --country US --countryCode US --sector "Professional Services" --strategy Buyout --prompt "What are the key risks?"
```

Regulation monitor (one-shot):
```bash
npm run monitor:regulations:once
```

Regulation monitor (every 6h):
```bash
npm run monitor:regulations
```

Memo export:
```bash
npm run memo:export -- --country DE --strategy Buyout --sector "Industrial Technology"
```

Snapshot persistence:
```bash
STRATA_BACKEND_URL=http://localhost:8787 npm run snapshot:persist
```

Build and lint:
```bash
npm run build
npm run lint
```

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/snapshots` | List score snapshots |
| POST | `/api/snapshots` | Save a score snapshot |
| GET | `/api/monitor-runs` | List regulation monitor runs |
| POST | `/api/monitor-runs` | Save a monitor run |
| POST | `/api/research` | Start single-market research job |
| GET | `/api/research/jobs/:id` | Poll research job status |
| POST | `/api/research/batch` | Start multi-market batch research |
| GET | `/api/research/results` | List completed research results |

## Auto-deploy

Frontend auto-deploys to GitHub Pages on every push to `main`.

Workflow: `.github/workflows/deploy-frontend.yml`

## Local data locations

- Indicator overrides: `src/data/indicatorOverrides.ts`
- Research results: `.strata/research/`
- Monitor state: `.strata/regulation-monitor-state.json`
- Backend store: `.strata/backend-store.json`
- Generated reports/memos: `reports/`
