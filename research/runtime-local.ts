import { spawn } from 'node:child_process'
import type { ResearchRuntime, LocalRuntimeConfig } from './runtime'

export class LocalRuntime implements ResearchRuntime {
  private command: string
  private model: string | undefined
  private timeoutMs: number

  constructor(config?: Partial<LocalRuntimeConfig>) {
    this.command = config?.command ?? process.env.STRATA_CLAUDE_CMD ?? 'claude'
    this.model = config?.model
    this.timeoutMs = config?.timeoutMs ?? 300_000
  }

  async execute(prompt: string): Promise<string> {
    const args = ['-p', prompt]
    if (this.model) {
      args.push('--model', this.model)
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      const timer = setTimeout(() => {
        proc.kill()
        reject(new Error(`Research agent timed out after ${this.timeoutMs}ms`))
      }, this.timeoutMs)

      let stdout = ''
      let stderr = ''
      proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
      proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      proc.on('error', (err) => { clearTimeout(timer); reject(err) })
      proc.on('close', (code) => {
        clearTimeout(timer)
        if (code !== 0) {
          reject(new Error(`${this.command} exited with code ${code}: ${stderr}`))
        } else {
          resolve(stdout)
        }
      })
    })
  }
}
