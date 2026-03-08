export type BackendHealthResponse = {
  ok: boolean
  service: string
  timestamp: string
}

export type ResearchJobResponse = {
  id: string
  status: 'running' | 'completed' | 'failed' | 'canceled'
  startedAt: string
  completedAt?: string | null
  error?: string | null
}

export type ResearchCreateResponse = {
  jobId: string
  status: 'running'
}

export const isResearchCreateResponse = (value: unknown): value is ResearchCreateResponse => {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return typeof obj.jobId === 'string' && obj.status === 'running'
}

export const isResearchJobResponse = (value: unknown): value is ResearchJobResponse => {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  const status = obj.status
  return typeof obj.id === 'string' && (status === 'running' || status === 'completed' || status === 'failed' || status === 'canceled')
}
