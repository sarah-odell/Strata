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

## Short-term roadmap
1. Replace seeded indicators with scheduled ingestion pipelines.
2. Add source-level citations (OECD, IMF, World Bank, regulators) per factor.
3. Add change alerts for major policy/geopolitical shifts.
4. Add memo export format for IC workflows.
