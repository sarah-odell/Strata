import express from 'express'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const app = express()
app.use(express.json({ limit: '1mb' }))

const rootDir = process.cwd()
const stateDir = path.join(rootDir, '.strata')
const dbPath = path.join(stateDir, 'backend-store.json')
const jobsPath = path.join(stateDir, 'research-jobs.json')
const resultsDir = path.join(stateDir, 'research')

const port = Number(process.env.STRATA_BACKEND_PORT || 8787)
const apiKey = process.env.STRATA_BACKEND_API_KEY || ''
const allowedOrigins = (process.env.STRATA_BACKEND_CORS_ORIGINS || '*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const rateLimitWindowMs = Number(process.env.STRATA_RATE_LIMIT_WINDOW_MS || 60_000)
const rateLimitMax = Number(process.env.STRATA_RATE_LIMIT_MAX || 30)
const jobTtlMs = Number(process.env.STRATA_RESEARCH_JOB_TTL_HOURS || 24) * 60 * 60 * 1000
const maxBatchMarkets = Number(process.env.STRATA_RESEARCH_MAX_BATCH || 20)
const maxPromptChars = Number(process.env.STRATA_RESEARCH_MAX_PROMPT_CHARS || 5000)

const researchJobs = new Map()
const researchProcesses = new Map()
const rateLimitState = new Map()

const log = (level, message, metadata = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...metadata,
  }
  const line = JSON.stringify(payload)
  if (level === 'error' || level === 'warn') {
    console.error(line)
    return
  }
  console.log(line)
}

app.use((req, res, next) => {
  const requestId = randomUUID()
  const startedAt = Date.now()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  res.on('finish', () => {
    log('info', 'request.complete', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    })
  })
  next()
})

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

const requireAuthIfConfigured = (req, res, next) => {
  if (!apiKey) {
    next()
    return
  }
  const provided = String(req.headers['x-api-key'] || '')
  if (provided !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

const rateLimit = (bucketName) => (req, res, next) => {
  const identity = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
  const now = Date.now()
  const bucketId = `${bucketName}:${identity}`
  const current = rateLimitState.get(bucketId) || { count: 0, windowStart: now }
  if (now - current.windowStart > rateLimitWindowMs) {
    current.count = 0
    current.windowStart = now
  }
  current.count += 1
  rateLimitState.set(bucketId, current)
  if (current.count > rateLimitMax) {
    res.status(429).json({ error: 'Rate limit exceeded. Retry later.' })
    return
  }
  next()
}

const readStore = async () => {
  try {
    const raw = await readFile(dbPath, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      scoreSnapshots: Array.isArray(parsed.scoreSnapshots) ? parsed.scoreSnapshots : [],
      monitorRuns: Array.isArray(parsed.monitorRuns) ? parsed.monitorRuns : [],
    }
  } catch {
    return {
      scoreSnapshots: [],
      monitorRuns: [],
    }
  }
}

const writeStore = async (store) => {
  await mkdir(path.dirname(dbPath), { recursive: true })
  await writeFile(dbPath, `${JSON.stringify(store, null, 2)}\n`, 'utf-8')
}

const persistResearchJobs = async () => {
  const serializable = Array.from(researchJobs.values()).map((job) => {
    const { processPid, ...rest } = job
    return rest
  })
  await mkdir(path.dirname(jobsPath), { recursive: true })
  await writeFile(jobsPath, `${JSON.stringify({ jobs: serializable }, null, 2)}\n`, 'utf-8')
}

const hydrateResearchJobs = async () => {
  try {
    const raw = await readFile(jobsPath, 'utf-8')
    const parsed = JSON.parse(raw)
    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : []
    for (const job of jobs) {
      if (!job?.id) continue
      if (job.status === 'running') {
        job.status = 'failed'
        job.error = 'Backend restarted while job was running.'
        job.completedAt = new Date().toISOString()
      }
      researchJobs.set(job.id, job)
    }
  } catch {
    // nothing persisted yet
  }
}

const readCommandExists = (commandName) => {
  const result = spawnSync('sh', ['-lc', `command -v ${commandName}`], {
    cwd: rootDir,
    stdio: 'pipe',
  })
  return result.status === 0
}

const readiness = async () => {
  const checks = {
    stateDirWritable: false,
    resultsDirWritable: false,
    runtimeCommandPresent: false,
  }

  try {
    await mkdir(stateDir, { recursive: true })
    const probePath = path.join(stateDir, '.ready-probe')
    await writeFile(probePath, 'ok\n', 'utf-8')
    await rm(probePath)
    checks.stateDirWritable = true
  } catch {
    checks.stateDirWritable = false
  }

  try {
    await mkdir(resultsDir, { recursive: true })
    checks.resultsDirWritable = true
  } catch {
    checks.resultsDirWritable = false
  }

  const runtimeCommand = process.env.STRATA_CLAUDE_CMD || 'claude'
  checks.runtimeCommandPresent = readCommandExists(runtimeCommand)

  const ok = Object.values(checks).every(Boolean)
  return {
    ok,
    checks,
    runtimeCommand,
  }
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const validateResearchPayload = (payload) => {
  if (!isObject(payload)) return 'Payload must be a JSON object.'
  const { countryCode, country, sector, strategy, model, personas, prompt } = payload
  if (!countryCode || !country || !sector || !strategy) {
    return 'countryCode, country, sector, and strategy are required.'
  }
  if (String(countryCode).length > 8 || String(country).length > 120 || String(sector).length > 120 || String(strategy).length > 80) {
    return 'countryCode/country/sector/strategy length exceeded.'
  }
  if (model && String(model).length > 120) return 'model length exceeded.'
  if (personas && String(personas).length > 500) return 'personas length exceeded.'
  if (prompt && String(prompt).length > maxPromptChars) return `prompt is limited to ${maxPromptChars} characters.`
  return null
}

const validateBatchPayload = (payload) => {
  if (!isObject(payload)) return 'Payload must be a JSON object.'
  const { markets, sector, strategy, prompt } = payload
  if (!Array.isArray(markets) || !sector || !strategy) {
    return 'markets (array of {countryCode, country}), sector, and strategy are required.'
  }
  if (markets.length < 1 || markets.length > maxBatchMarkets) {
    return `markets must contain between 1 and ${maxBatchMarkets} entries.`
  }
  if (prompt && String(prompt).length > maxPromptChars) {
    return `prompt is limited to ${maxPromptChars} characters.`
  }
  for (const market of markets) {
    if (!isObject(market) || !market.countryCode || !market.country) {
      return 'each market requires countryCode and country.'
    }
  }
  return null
}

const validateEventPayload = (payload) => {
  if (!isObject(payload)) return 'Payload must be a JSON object.'
  const serialized = JSON.stringify(payload)
  if (serialized.length > 100_000) return 'Payload too large (max 100KB).'
  return null
}

const makeJob = ({ id, countryCode, country, sector, strategy, model, personas, prompt }) => ({
  id,
  status: 'running',
  startedAt: new Date().toISOString(),
  countryCode,
  country,
  sector,
  strategy,
  model: model || null,
  personas: personas || null,
  prompt: prompt || null,
  error: null,
  completedAt: null,
  canceledAt: null,
  processPid: null,
})

const startResearchJob = ({ id, countryCode, country, sector, strategy, model, personas, prompt }) => {
  const args = [
    '--import', 'tsx/esm', 'research/run.ts',
    '--country', countryCode,
    '--country-name', country,
    '--sector', sector,
    '--strategy', strategy,
  ]
  if (model) args.push('--model', model)
  if (personas) args.push('--personas', personas)
  if (prompt) args.push('--prompt', prompt)

  const childEnv = { ...process.env }
  delete childEnv.CLAUDECODE

  const proc = spawn('node', args, {
    cwd: rootDir,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const job = makeJob({ id, countryCode, country, sector, strategy, model, personas, prompt })
  job.processPid = proc.pid
  researchJobs.set(id, job)
  researchProcesses.set(id, proc)

  let stderr = ''
  proc.stderr.on('data', (d) => { stderr += d.toString() })
  proc.on('close', (code, signal) => {
    const latest = researchJobs.get(id)
    if (!latest) return
    if (latest.status === 'canceled') {
      latest.completedAt = new Date().toISOString()
      latest.error = latest.error || `Canceled (${signal || 'SIGTERM'})`
    } else {
      latest.status = code === 0 ? 'completed' : 'failed'
      latest.completedAt = new Date().toISOString()
      latest.error = code === 0 ? null : stderr.slice(0, 2000) || `Process exited with code ${code}`
    }
    latest.processPid = null
    researchProcesses.delete(id)
    persistResearchJobs().catch((error) => {
      log('error', 'research.persist_failed', { error: error.message, jobId: id })
    })
  })

  proc.on('error', (error) => {
    const latest = researchJobs.get(id)
    if (!latest) return
    latest.status = 'failed'
    latest.error = `Process spawn failed: ${error.message}`
    latest.completedAt = new Date().toISOString()
    latest.processPid = null
    researchProcesses.delete(id)
    persistResearchJobs().catch(() => {})
  })

  persistResearchJobs().catch(() => {})
  return job
}

const cleanupOldJobs = async () => {
  const cutoff = Date.now() - jobTtlMs
  let changed = false
  for (const [id, job] of researchJobs.entries()) {
    if (job.status === 'running') continue
    const timestamp = job.completedAt || job.canceledAt || job.startedAt
    const age = new Date(timestamp).getTime()
    if (Number.isFinite(age) && age < cutoff) {
      researchJobs.delete(id)
      changed = true
    }
  }
  if (changed) {
    await persistResearchJobs()
  }
}

setInterval(() => {
  cleanupOldJobs().catch((error) => {
    log('warn', 'jobs.cleanup_failed', { error: error.message })
  })
}, 60_000).unref()

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'strata-backend', timestamp: new Date().toISOString() })
})

app.get('/ready', async (_req, res) => {
  const state = await readiness()
  res.status(state.ok ? 200 : 503).json({
    service: 'strata-backend',
    timestamp: new Date().toISOString(),
    ...state,
  })
})

app.get('/api/snapshots', async (req, res) => {
  const store = await readStore()
  const country = req.query.country ? String(req.query.country).toUpperCase() : null
  const snapshots = country
    ? store.scoreSnapshots.filter((item) => item.countryCode === country)
    : store.scoreSnapshots
  res.json({ count: snapshots.length, snapshots })
})

app.post('/api/snapshots', requireAuthIfConfigured, rateLimit('snapshots'), async (req, res) => {
  const error = validateEventPayload(req.body)
  if (error) {
    res.status(400).json({ error })
    return
  }

  const store = await readStore()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...req.body,
  }

  store.scoreSnapshots.push(entry)
  await writeStore(store)
  res.status(201).json(entry)
})

app.get('/api/monitor-runs', async (_req, res) => {
  const store = await readStore()
  res.json({ count: store.monitorRuns.length, monitorRuns: store.monitorRuns })
})

app.post('/api/monitor-runs', requireAuthIfConfigured, rateLimit('monitor-runs'), async (req, res) => {
  const error = validateEventPayload(req.body)
  if (error) {
    res.status(400).json({ error })
    return
  }

  const store = await readStore()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...req.body,
  }

  store.monitorRuns.push(entry)
  await writeStore(store)
  res.status(201).json(entry)
})

app.post('/api/research', requireAuthIfConfigured, rateLimit('research'), (req, res) => {
  const error = validateResearchPayload(req.body)
  if (error) {
    res.status(400).json({ error })
    return
  }

  const { countryCode, country, sector, strategy, model, personas, prompt } = req.body
  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  startResearchJob({
    id: jobId,
    countryCode: String(countryCode).toUpperCase(),
    country: String(country),
    sector: String(sector),
    strategy: String(strategy),
    model: model ? String(model) : undefined,
    personas: personas ? String(personas) : undefined,
    prompt: prompt ? String(prompt) : undefined,
  })

  res.status(202).json({ jobId, status: 'running' })
})

app.get('/api/research/jobs/:id', (req, res) => {
  const job = researchJobs.get(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }
  const { processPid, ...safeJob } = job
  res.json({ id: req.params.id, ...safeJob })
})

app.post('/api/research/jobs/:id/cancel', requireAuthIfConfigured, rateLimit('research-cancel'), async (req, res) => {
  const job = researchJobs.get(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }
  if (job.status !== 'running') {
    res.status(409).json({ error: `Job is already ${job.status}` })
    return
  }
  const proc = researchProcesses.get(req.params.id)
  if (!proc) {
    job.status = 'failed'
    job.error = 'Process handle missing; unable to cancel cleanly.'
    job.completedAt = new Date().toISOString()
    await persistResearchJobs()
    res.status(409).json({ error: 'Job process not found; marked failed.' })
    return
  }

  job.status = 'canceled'
  job.canceledAt = new Date().toISOString()
  job.error = 'Canceled by request.'
  proc.kill('SIGTERM')
  await persistResearchJobs()
  res.json({ id: req.params.id, status: 'canceled' })
})

app.post('/api/research/batch', requireAuthIfConfigured, rateLimit('research-batch'), (req, res) => {
  const error = validateBatchPayload(req.body)
  if (error) {
    res.status(400).json({ error })
    return
  }

  const { markets, sector, strategy, model, personas, prompt } = req.body
  const batchId = `batch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const jobs = []

  for (const market of markets) {
    const jobId = `${batchId}-${String(market.countryCode).toUpperCase()}`
    startResearchJob({
      id: jobId,
      countryCode: String(market.countryCode).toUpperCase(),
      country: String(market.country),
      sector: String(sector),
      strategy: String(strategy),
      model: model ? String(model) : undefined,
      personas: personas ? String(personas) : undefined,
      prompt: prompt ? String(prompt) : undefined,
    })
    jobs.push({ jobId, countryCode: String(market.countryCode).toUpperCase(), country: String(market.country) })
  }

  res.status(202).json({ batchId, jobs, totalMarkets: markets.length })
})

app.get('/api/research/results', async (_req, res) => {
  try {
    const files = await readdir(resultsDir)
    const results = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const raw = await readFile(path.join(resultsDir, file), 'utf-8')
      results.push(JSON.parse(raw))
    }
    results.sort((a, b) => (b.runAt || '').localeCompare(a.runAt || ''))
    res.json({ count: results.length, results })
  } catch {
    res.json({ count: 0, results: [] })
  }
})

await hydrateResearchJobs()
await cleanupOldJobs()

app.listen(port, () => {
  log('info', 'backend.started', {
    service: 'strata-backend',
    port,
    cors: allowedOrigins,
    authEnabled: Boolean(apiKey),
    rateLimitWindowMs,
    rateLimitMax,
  })
})
