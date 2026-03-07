import express from 'express'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (_req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const rootDir = process.cwd()
const dbPath = path.join(rootDir, '.strata', 'backend-store.json')
const port = Number(process.env.STRATA_BACKEND_PORT || 8787)

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

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'strata-backend', timestamp: new Date().toISOString() })
})

app.get('/api/snapshots', async (req, res) => {
  const store = await readStore()
  const country = req.query.country ? String(req.query.country).toUpperCase() : null
  const snapshots = country
    ? store.scoreSnapshots.filter((item) => item.countryCode === country)
    : store.scoreSnapshots
  res.json({ count: snapshots.length, snapshots })
})

app.post('/api/snapshots', async (req, res) => {
  const payload = req.body
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: 'Payload must be a JSON object.' })
    return
  }

  const store = await readStore()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  }

  store.scoreSnapshots.push(entry)
  await writeStore(store)

  res.status(201).json(entry)
})

app.get('/api/monitor-runs', async (_req, res) => {
  const store = await readStore()
  res.json({ count: store.monitorRuns.length, monitorRuns: store.monitorRuns })
})

app.post('/api/monitor-runs', async (req, res) => {
  const payload = req.body
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: 'Payload must be a JSON object.' })
    return
  }

  const store = await readStore()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  }

  store.monitorRuns.push(entry)
  await writeStore(store)

  res.status(201).json(entry)
})

const researchJobs = new Map()

app.post('/api/research', (req, res) => {
  const { countryCode, country, sector, strategy, model, personas, prompt } = req.body
  if (!countryCode || !country || !sector || !strategy) {
    res.status(400).json({ error: 'countryCode, country, sector, and strategy are required.' })
    return
  }

  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
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

  const job = { status: 'running', startedAt: new Date().toISOString(), countryCode, country, sector, strategy }
  researchJobs.set(jobId, job)

  let stderr = ''
  proc.stderr.on('data', (d) => { stderr += d.toString() })
  proc.on('close', (code) => {
    job.status = code === 0 ? 'completed' : 'failed'
    job.completedAt = new Date().toISOString()
    if (code !== 0) job.error = stderr.slice(0, 2000)
  })

  res.status(202).json({ jobId, status: 'running' })
})

app.get('/api/research/jobs/:id', (req, res) => {
  const job = researchJobs.get(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }
  res.json({ id: req.params.id, ...job })
})

app.post('/api/research/batch', (req, res) => {
  const { markets, sector, strategy, model, personas, prompt } = req.body
  if (!markets || !Array.isArray(markets) || !sector || !strategy) {
    res.status(400).json({ error: 'markets (array of {countryCode, country}), sector, and strategy are required.' })
    return
  }

  const batchId = `batch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const jobs = []

  for (const market of markets) {
    const jobId = `${batchId}-${market.countryCode}`
    const args = [
      '--import', 'tsx/esm', 'research/run.ts',
      '--country', market.countryCode,
      '--country-name', market.country,
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

    const job = { status: 'running', startedAt: new Date().toISOString(), countryCode: market.countryCode, country: market.country, sector, strategy }
    researchJobs.set(jobId, job)

    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    proc.on('close', (code) => {
      job.status = code === 0 ? 'completed' : 'failed'
      job.completedAt = new Date().toISOString()
      if (code !== 0) job.error = stderr.slice(0, 2000)
    })

    jobs.push({ jobId, countryCode: market.countryCode, country: market.country })
  }

  res.status(202).json({ batchId, jobs, totalMarkets: markets.length })
})

app.get('/api/research/results', async (_req, res) => {
  const resultsDir = path.join(rootDir, '.strata', 'research')
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

app.listen(port, () => {
  console.log(`Strata backend listening on http://localhost:${port}`)
})
