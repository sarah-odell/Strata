# Strata: PE Expansion Intelligence

Strata is a PE/corp-dev decision support tool for market expansion screening.

It currently combines:
- Country scoring by strategy and sector
- Source-cited factor intelligence (IMF, World Bank, OECD, regulator links)
- Scenario scoring (base/upside/downside)
- Cron-capable regulation monitoring across all tracked markets
- Memo export (`.md` + `.pdf`)
- Simple backend storage for score snapshots and monitoring runs

## Current country coverage
13 markets:
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

Markets are handled without US/DE priority bias in monitoring and ranking display.

## Scoring model
Overall score:
- `35%` sector fit
- `65%` weighted country risk-adjusted factors

Factors:
- Economic strength
- Regulatory complexity
- Tax/tariff friction
- Geopolitical risk
- Deal execution risk

Strategies:
- `Buyout`
- `Growth`
- `Low-Risk Entry`

## Local development
Install:
```bash
npm install
```

Run app:
```bash
npm run dev
```

Quality checks:
```bash
npm run build
npm run lint
```

## Indicator ingestion pipeline
Pulls live macro/tariff signals and regenerates factor overrides used by the app:

```bash
npm run ingest:indicators
```

Generated file:
- `src/data/indicatorOverrides.ts`

## Regulation monitoring (all markets)
### One-shot run
```bash
npm run monitor:regulations:once
```

### Scheduled daemon (every 6 hours)
```bash
npm run monitor:regulations
```

### Custom schedule
```bash
REG_MONITOR_CRON="0 */4 * * *" npm run monitor:regulations
```

### Materiality and alerting
The monitor now classifies changes by severity (`HIGH`, `MEDIUM`, `LOW`, `NONE`) using:
- Source criticality
- Change type
- Material keyword hits

Reports are written to `reports/`.

## Memo export
Generate IC-style country memo:

```bash
npm run memo:export -- --country DE --strategy Buyout --sector "Industrial Technology"
```

Outputs:
- `reports/memo-<...>.md`
- `reports/memo-<...>.pdf`

## Backend storage API
Start backend:
```bash
npm run backend
```

Health check:
```bash
curl http://localhost:8787/health
```

Persist current scoring snapshot set:
```bash
STRATA_BACKEND_URL=http://localhost:8787 npm run snapshot:persist
```

API endpoints:
- `GET /api/snapshots`
- `POST /api/snapshots`
- `GET /api/monitor-runs`
- `POST /api/monitor-runs`

Storage file:
- `.strata/backend-store.json`

## Next steps
1. Add direct OECD/IMF indicator adapters beyond current baseline pulls.
2. Add factor-level confidence bands driven by data freshness and source quality.
3. Build country detail routes with compare mode and saved watchlists.
4. Add monitor-to-alert delivery channels (Slack/email/webhook) with approval gates.
5. Migrate backend storage from local JSON to Postgres/Supabase.
