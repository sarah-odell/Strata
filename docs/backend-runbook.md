# Backend Runbook

This runbook covers local operation of the Strata backend used by the `Research` page and persistence endpoints.

## Purpose
The backend provides:
- Research job submission and polling
- Batch research orchestration
- Snapshot/monitor run persistence
- Basic health/readiness probes

## Start
```bash
npm run backend
```

Default bind:
- `http://localhost:8787`

## Health and Readiness
- `GET /health`: process-level liveness
- `GET /ready`: operational checks for writable state, results directory, and configured runtime command availability

Quick check:
```bash
curl -s http://localhost:8787/health
curl -s http://localhost:8787/ready
```

## Environment Variables
- `STRATA_BACKEND_PORT`: server port (default `8787`)
- `STRATA_BACKEND_API_KEY`: enables API key protection (header `X-API-Key`)
- `STRATA_BACKEND_CORS_ORIGINS`: comma-separated origins or `*`
- `STRATA_RATE_LIMIT_WINDOW_MS`: rate-limit window (default `60000`)
- `STRATA_RATE_LIMIT_MAX`: max requests per window per identity (default `30`)
- `STRATA_RESEARCH_JOB_TTL_HOURS`: retention for completed/failed/canceled jobs (default `24`)
- `STRATA_RESEARCH_MAX_BATCH`: max markets in one batch request (default `20`)
- `STRATA_RESEARCH_MAX_PROMPT_CHARS`: prompt length cap (default `5000`)
- `STRATA_CLAUDE_CMD`: command used for research runtime (default `claude`)

## API Endpoints
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

## Local State
Written under `.strata/`:
- `backend-store.json`
- `research-jobs.json`
- `research/` (result payload files)

## Common Issues

### Frontend says backend not reachable
- Confirm backend process is running.
- Confirm frontend backend URL matches backend host/port.
- If using hosted backend, verify CORS allowlist includes frontend origin.

### `/ready` fails runtime command check
- Install the required runtime command (default `claude`) or set `STRATA_CLAUDE_CMD` to a valid command.

### 401 Unauthorized
- Backend API key mode is enabled; provide `X-API-Key` matching `STRATA_BACKEND_API_KEY`.

### 429 Rate limit exceeded
- Increase `STRATA_RATE_LIMIT_MAX` and/or `STRATA_RATE_LIMIT_WINDOW_MS`, or reduce request burst rate.

### Research jobs stuck after restart
- On restart, previously running jobs are marked failed by design to avoid ghost-running state.

## Verification Checklist
- `npm run backend` starts without error.
- `GET /health` returns `ok: true`.
- `GET /ready` returns checks and `ok` status.
- Frontend `Research` tab can submit and poll a job.
- `npm test` passes backend contract tests.
