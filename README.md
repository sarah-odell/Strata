# Strata: PE Expansion Intelligence

Strata is an early-stage decision-support tool for PE and corp-dev teams assessing market expansion.

This first MVP slice provides:
- Country ranking by strategy and sector
- Explicit factor scoring (economic, regulatory, tax/tariff, geopolitical, execution)
- Transparent weighted model and confidence metadata
- Baseline country coverage that includes **United States** and **Germany**

## Why this exists
Expansion decisions are often slowed by fragmented macro/regulatory inputs. Strata turns those inputs into a comparable, auditable scorecard.

## Current model
Overall score formula:
- `35%` sector fit
- `65%` risk-adjusted country factor bundle (weights vary by strategy)

Strategies currently supported:
- `Buyout`
- `Growth`
- `Low-Risk Entry`

## Run locally
```bash
npm install
npm run dev
```

## Build and lint
```bash
npm run build
npm run lint
```

## Regulation monitoring (US + Germany)
This repo now includes a scheduled regulation monitor aligned to a Dexter-style ops workflow.

What it does:
- Polls configured regulator sources for US and Germany
- Detects page-content changes via hash diffing
- Persists run state in `.strata/regulation-monitor-state.json`
- Writes timestamped run reports under `reports/`

Run once:
```bash
npm run monitor:regulations:once
```

Run as daemon every 6 hours:
```bash
npm run monitor:regulations
```

Customize schedule:
```bash
REG_MONITOR_CRON="0 */4 * * *" npm run monitor:regulations
```

## Short-term roadmap
1. Replace seeded indicators with scheduled ingestion pipelines.
2. Add source-level citations (OECD, IMF, World Bank, regulators) per factor.
3. Add change alerts for major policy/geopolitical shifts.
4. Add memo export format for IC workflows.
