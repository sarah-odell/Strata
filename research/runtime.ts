export interface ResearchRuntime {
  execute(prompt: string): Promise<string>
}

export interface LocalRuntimeConfig {
  type: 'local'
  command?: string
  model?: string
  timeoutMs?: number
}

export interface SandboxRuntimeConfig {
  type: 'sandbox'
  apiKey?: string
  image?: string
  timeoutMs?: number
}

export type RuntimeConfig = LocalRuntimeConfig | SandboxRuntimeConfig

export async function createRuntime(config: RuntimeConfig): Promise<ResearchRuntime> {
  if (config.type === 'sandbox') {
    const { SandboxRuntime } = await import('./runtime-sandbox')
    return new SandboxRuntime(config)
  }
  const { LocalRuntime } = await import('./runtime-local')
  return new LocalRuntime(config)
}
