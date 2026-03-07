import type { ResearchRuntime, SandboxRuntimeConfig } from './runtime'

export class SandboxRuntime implements ResearchRuntime {
  private apiKey: string
  private image: string
  private timeoutMs: number

  constructor(config: SandboxRuntimeConfig) {
    this.apiKey = config.apiKey ?? process.env.TANGLE_API_KEY ?? ''
    this.image = config.image ?? 'node:20'
    this.timeoutMs = config.timeoutMs ?? 600_000
  }

  async execute(prompt: string): Promise<string> {
    // Dynamic import — install or link @tangle/sandbox to use this runtime
    const { Sandbox } = await import('@tangle/sandbox')
    const client = new Sandbox({ apiKey: this.apiKey })
    const box = await client.create({
      name: `strata-research-${Date.now()}`,
      image: this.image,
    })

    try {
      await box.waitForRunning({ timeoutMs: 120_000 })
      const result = await box.task(prompt, {
        maxTurns: 30,
      })
      if (!result.success) {
        throw new Error(result.error ?? 'Sandbox agent task failed')
      }
      return result.response ?? ''
    } finally {
      await box.delete().catch(() => {})
    }
  }
}
