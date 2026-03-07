# Strata Competitor + Product Design Document

## 1) Context
Strata is becoming a PE/corp-dev expansion intelligence product: country-market screening, regulatory monitoring, scenario analysis, and IC/memo support.

This document does three things:
- Identifies 5 practical competitors/adjacent incumbents.
- Defines product asks to win against them.
- Proposes a concrete design for the next stage of Strata.

## 2) Competitor Set (5)

### Competitor 1: PitchBook
- Why it is relevant: widely used by PE deal teams for private market intelligence, comps, and deal sourcing workflows.
- Strengths: deep private market dataset, known workflow fit in PE shops, broad benchmarking.
- Weakness vs Strata opportunity: does not natively center country-entry decisioning with transparent multi-factor country-risk methodology tailored to expansion strategy.

### Competitor 2: S&P Capital IQ Pro (and Market Intelligence tools)
- Why it is relevant: large institutional footprint across corp-dev, strategy, and investment teams with macro/company/market data.
- Strengths: breadth, scale, enterprise trust, integrated market/financial data.
- Weakness vs Strata opportunity: high breadth can create workflow overhead for expansion-specific decisions; less opinionated for PE country-entry playbooks and deal-strategy-specific recommendations.

### Competitor 3: Preqin
- Why it is relevant: core alternative-assets platform for fund, manager, and PE market intelligence.
- Strengths: alternatives-focused market data and benchmarking.
- Weakness vs Strata opportunity: stronger on market/fund intelligence than an integrated country-regulatory expansion cockpit with scenario + actioning for deal teams.

### Competitor 4: Verisk Maplecroft
- Why it is relevant: strong focus on country risk analytics (political, regulatory, ESG, geopolitical dimensions).
- Strengths: robust risk framework and country-level risk depth.
- Weakness vs Strata opportunity: not purpose-built for PE deal workflow integration (deal strategy, sector fit, portfolio adjacency, IC memo generation in one loop).

### Competitor 5: Control Risks
- Why it is relevant: recognized provider for geopolitical/regulatory risk monitoring and advisory.
- Strengths: expert-led intelligence and monitoring depth.
- Weakness vs Strata opportunity: advisory-heavy model versus a productized self-serve system that produces repeatable, transparent rankings and direct deal workflow outputs.

## 3) What This Means for Strata
To win, Strata should not try to out-breadth incumbents. It should be:
- More opinionated for PE expansion decisions.
- Faster from question to decision artifact.
- More transparent in scoring assumptions and confidence.
- More operational (monitoring, alerting, auto-refresh, memo outputs).

## 4) Product Asks (Priority)

### A. Core decisioning asks
1. Add explicit investment committee mode:
- One-click IC view with top 3 markets, downside flags, and assumptions.

2. Add explainable scoring decomposition:
- Contribution waterfall by factor, scenario, and portfolio adjacency.

3. Add benchmark mode:
- Compare up to 5 countries side-by-side with delta explanation.

### B. Data and trust asks
4. Add data freshness SLAs per factor:
- Show expected refresh cadence and stale-data warnings.

5. Add citation traceability:
- Every score contribution should trace to source and timestamp.

6. Add confidence calibration:
- Confidence should degrade when inputs are stale, sparse, or conflicting.

### C. Workflow asks
7. Add saved theses:
- Save prompt + assumptions + shortlist as reusable “expansion thesis” objects.

8. Add watchlists + alerts:
- “Alert me if Germany regulatory complexity worsens by > X” style triggers.

9. Add memo generation from a template library:
- IC memo, market-entry memo, risk committee memo.

### D. Platform asks
10. Add API/webhook surface:
- So investment teams can pull rankings and deltas into their internal stack.

11. Add role-based views:
- Partner, principal, operating partner, risk/compliance each gets tailored outputs.

12. Add audit trail:
- Track who changed assumptions and when.

## 5) Strata Design Doc (Proposed)

## 5.1 Problem statement
PE/corp-dev teams need to decide where to expand under uncertainty. Existing tools are fragmented across private-market data, macro risk, and regulatory monitoring. Teams need one decision layer that is transparent, fast, and operational.

## 5.2 Users
- Partner/IC member: decision and capital allocation.
- Deal team: market shortlist and diligence framing.
- Operating partner: execution feasibility.
- Risk/compliance: regulatory and geopolitical oversight.

## 5.3 Product principles
- Explainable over black-box.
- Decision-speed over data-overload.
- Scenario-native by default.
- Operational continuity (monitoring + alerts + memo outputs).

## 5.4 Core surfaces
1. Radar page:
- Country ranking (table/cards), factor decomposition, top-3 summary.

2. Deal Lab page:
- Prompt-to-assumption parser, portfolio adjacency inputs, deal profile radar, tailored recommendation output.

3. Definitions page:
- Taxonomy, scenario definitions, methodology transparency.

4. Forthcoming Watchlist page:
- Monitored countries, trigger rules, recent alerts, trend deltas.

## 5.5 Functional requirements (next release)
- FR1: Compare mode for up to 5 countries with factor-level deltas.
- FR2: Saved thesis objects (prompt + assumptions + outputs).
- FR3: Alert rules by factor thresholds and trend direction.
- FR4: Memo templates with deterministic sections and source appendix.
- FR5: Score explanation API endpoint returning contribution breakdown.

## 5.6 Scoring/method requirements
- Keep deterministic strategy weights by strategy type.
- Keep 5-band recommendation scale (Very strong -> Very weak).
- Include portfolio adjacency as explicit additive overlay with visible cap.
- Ensure scenario adjustments are auditable and documented.

## 5.7 Non-functional requirements
- Performance: ranking response < 500ms for 20+ countries.
- Reliability: monitoring job success rate >= 99%.
- Traceability: every score stores source + timestamp + model version.
- Security: role-based access for sensitive watchlist/memo workflows.

## 5.8 KPIs
- Time from question to shortlist.
- % of IC memos generated from Strata.
- Alert precision (useful alerts / total alerts).
- User trust score on explanation clarity.

## 5.9 Delivery plan
Phase 1 (2 weeks):
- Compare mode + explanation waterfall.
- Saved thesis object model.

Phase 2 (2-3 weeks):
- Alert engine + watchlist UI.
- Memo template library.

Phase 3 (2 weeks):
- API/webhook + audit trail.
- Role-based view tuning.

## 6) Open Decisions / Asks for You
1. Target customer for v1 commercialization:
- Lower-mid PE funds, mid-market PE, or corporate strategy teams?

2. Positioning choice:
- “Expansion intelligence OS” vs “PE country-entry copilot.”

3. Confidence policy:
- Conservative (heavier stale-data penalties) vs balanced.

4. Memo standardization:
- Should we lock one IC memo format first, or support 2-3 templates immediately?

5. Alert fatigue tolerance:
- Default to fewer high-confidence alerts, or broader alert coverage?

## 7) Sources (competitor references)
- PitchBook: https://pitchbook.com/
- S&P Capital IQ Pro: https://www.capitaliq.spglobal.com/
- Preqin: https://www.preqin.com/
- Verisk Maplecroft: https://www.maplecroft.com/
- Control Risks: https://www.controlrisks.com/
