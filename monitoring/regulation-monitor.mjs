import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import cron from 'node-cron'

const rootDir = process.cwd()
const sourcesPath = path.join(rootDir, 'monitoring', 'sources.json')
const statePath = path.join(rootDir, '.strata', 'regulation-monitor-state.json')
const reportsDir = path.join(rootDir, 'reports')

const args = process.argv.slice(2)
const once = args.includes('--once')
const scheduleArgIndex = args.indexOf('--schedule')
const schedule =
  (scheduleArgIndex >= 0 ? args[scheduleArgIndex + 1] : undefined) ||
  process.env.REG_MONITOR_CRON ||
  '0 */6 * * *'

const nowIso = () => new Date().toISOString()

const stableHash = (value) => createHash('sha256').update(value).digest('hex')

const readJson = async (filePath, fallback) => {
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const writeJson = async (filePath, payload) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
}

const sanitize = (text) => text.replace(/\s+/g, ' ').trim()

const extractTitle = (html) => {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i)
  return match ? sanitize(match[1]) : 'Untitled page'
}

const fetchSource = async (source) => {
  const startedAt = nowIso()
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'strata-regulation-monitor/0.1',
      },
      signal: AbortSignal.timeout(30000),
    })

    const body = await response.text()
    const normalizedBody = sanitize(body)

    return {
      ...source,
      startedAt,
      checkedAt: nowIso(),
      ok: response.ok,
      status: response.status,
      title: extractTitle(body),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      hash: stableHash(normalizedBody),
      bodyLength: body.length,
      error: null,
    }
  } catch (error) {
    return {
      ...source,
      startedAt,
      checkedAt: nowIso(),
      ok: false,
      status: null,
      title: null,
      etag: null,
      lastModified: null,
      hash: null,
      bodyLength: 0,
      error: error instanceof Error ? error.message : 'Unknown fetch error',
    }
  }
}

const determineChanges = (current, previousState) => {
  const previousById = previousState.sources ?? {}

  return current.map((snapshot) => {
    const previous = previousById[snapshot.id]

    if (!previous) {
      return { ...snapshot, changeType: 'new' }
    }

    if (!snapshot.ok) {
      return { ...snapshot, changeType: 'error' }
    }

    if (snapshot.hash !== previous.hash) {
      return { ...snapshot, changeType: 'changed' }
    }

    return { ...snapshot, changeType: 'unchanged' }
  })
}

const toMarkdownReport = (runAt, evaluated, changed) => {
  const lines = [
    '# Regulation Monitoring Report',
    '',
    `- Run at: ${runAt}`,
    `- Sources checked: ${evaluated.length}`,
    `- New or changed: ${changed.length}`,
    '',
    '## Tracked countries',
    '- US',
    '- DE',
    '',
    '## Change summary',
  ]

  if (changed.length === 0) {
    lines.push('- No source-content changes detected this run.')
  } else {
    for (const item of changed) {
      lines.push(
        `- [${item.country}] ${item.institution}: ${item.changeType.toUpperCase()} (${item.status ?? 'error'})`,
      )
      lines.push(`  - URL: ${item.url}`)
      lines.push(`  - Title: ${item.title ?? 'Unavailable'}`)
      lines.push(`  - Checked at: ${item.checkedAt}`)
      if (item.error) {
        lines.push(`  - Error: ${item.error}`)
      }
    }
  }

  lines.push('', '## Full status')

  for (const item of evaluated) {
    lines.push(`- ${item.id}: ok=${item.ok} status=${item.status ?? 'error'} hash=${item.hash ?? 'none'}`)
  }

  return `${lines.join('\n')}\n`
}

const runMonitor = async () => {
  const runAt = nowIso()
  const sources = await readJson(sourcesPath, [])

  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error('No monitoring sources found in monitoring/sources.json')
  }

  const previousState = await readJson(statePath, { lastRunAt: null, sources: {} })
  const snapshots = await Promise.all(sources.map((source) => fetchSource(source)))
  const evaluated = determineChanges(snapshots, previousState)
  const changed = evaluated.filter((item) => item.changeType === 'new' || item.changeType === 'changed')

  const nextState = {
    lastRunAt: runAt,
    sources: Object.fromEntries(
      evaluated.map((item) => [
        item.id,
        {
          checkedAt: item.checkedAt,
          ok: item.ok,
          status: item.status,
          hash: item.hash,
          title: item.title,
          url: item.url,
          country: item.country,
          institution: item.institution,
        },
      ]),
    ),
  }

  await writeJson(statePath, nextState)

  const reportName = `reg-monitor-${runAt.replace(/[:.]/g, '-')}.md`
  const reportPath = path.join(reportsDir, reportName)
  await mkdir(reportsDir, { recursive: true })
  await writeFile(reportPath, toMarkdownReport(runAt, evaluated, changed), 'utf-8')

  console.log(`Regulation monitor run complete at ${runAt}`)
  console.log(`Report written: ${reportPath}`)
  console.log(`Changes detected: ${changed.length}`)
}

if (once) {
  runMonitor().catch((error) => {
    console.error(`Regulation monitor failed: ${error.message}`)
    process.exitCode = 1
  })
} else {
  if (!cron.validate(schedule)) {
    console.error(`Invalid cron schedule: ${schedule}`)
    process.exit(1)
  }

  console.log(`Starting regulation monitor daemon on schedule: ${schedule}`)
  runMonitor().catch((error) => {
    console.error(`Initial monitor run failed: ${error.message}`)
  })

  cron.schedule(schedule, () => {
    runMonitor().catch((error) => {
      console.error(`Scheduled monitor run failed: ${error.message}`)
    })
  })
}
