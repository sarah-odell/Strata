import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import process from 'node:process'

const port = 8799
const baseUrl = `http://localhost:${port}`
let server: ChildProcessWithoutNullStreams

async function waitForBackend(timeoutMs = 8000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`)
      if (response.ok) return
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error('Backend did not start in time')
}

beforeAll(async () => {
  server = spawn('node', ['backend/server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      STRATA_BACKEND_PORT: String(port),
      STRATA_BACKEND_API_KEY: 'test-key',
      STRATA_RATE_LIMIT_MAX: '200',
    },
    stdio: 'pipe',
  })
  await waitForBackend()
})

afterAll(async () => {
  if (server && !server.killed) {
    server.kill('SIGTERM')
  }
})

describe('backend contracts', () => {
  test('health and ready endpoints return structured payloads', async () => {
    const health = await fetch(`${baseUrl}/health`)
    expect(health.status).toBe(200)
    const healthBody = await health.json()
    expect(healthBody.ok).toBe(true)

    const ready = await fetch(`${baseUrl}/ready`)
    expect([200, 503]).toContain(ready.status)
    const readyBody = await ready.json()
    expect(typeof readyBody.ok).toBe('boolean')
    expect(typeof readyBody.checks).toBe('object')
  })

  test('research endpoint enforces auth when API key is configured', async () => {
    const response = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: 'US', country: 'United States', sector: 'Professional Services', strategy: 'Buyout' }),
    })
    expect(response.status).toBe(401)
  })

  test('research endpoint returns validation errors with auth', async () => {
    const response = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': 'test-key' },
      body: JSON.stringify({ countryCode: 'US' }),
    })
    expect(response.status).toBe(400)
  })

  test('research endpoint returns a job envelope on accepted request', async () => {
    const response = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': 'test-key' },
      body: JSON.stringify({ countryCode: 'US', country: 'United States', sector: 'Professional Services', strategy: 'Buyout', prompt: 'test prompt' }),
    })
    expect(response.status).toBe(202)
    const body = await response.json()
    expect(typeof body.jobId).toBe('string')

    const jobResponse = await fetch(`${baseUrl}/api/research/jobs/${body.jobId}`)
    expect(jobResponse.status).toBe(200)
    const job = await jobResponse.json()
    expect(typeof job.status).toBe('string')
  })
})
