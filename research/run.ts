import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { runEnsemble } from './orchestrator'
import { personas } from './personas'
import { createRuntime, type RuntimeConfig } from './runtime'
import type { ResearchBrief } from './schema'

const args = process.argv.slice(2)
const arg = (flag: string, fallback?: string): string | undefined => {
  const idx = args.indexOf(flag)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}

const country = arg('--country', 'US')!
const countryName = arg('--country-name', country)
const sector = arg('--sector', 'Professional Services')!
const strategy = arg('--strategy', 'Buyout')!
const runtimeType = arg('--runtime', 'local') as 'local' | 'sandbox'
const model = arg('--model')
const personaFilter = arg('--personas')
const userPrompt = arg('--prompt')

const outputDir = path.join(process.cwd(), '.strata', 'research')

const brief: ResearchBrief = {
  country: countryName,
  countryCode: country,
  sector,
  strategy,
  prompt: userPrompt,
}

const runtimeConfig: RuntimeConfig = runtimeType === 'sandbox'
  ? { type: 'sandbox', apiKey: process.env.TANGLE_API_KEY }
  : { type: 'local', model }

const selectedPersonas = personaFilter
  ? personaFilter.split(',').map((s) => s.trim())
  : undefined

async function main() {
  console.log(`Research: ${brief.country} | ${brief.sector} | ${brief.strategy}`)
  console.log(`Runtime: ${runtimeType}${model ? ` (${model})` : ''}`)
  console.log(`Personas: ${selectedPersonas ? selectedPersonas.join(', ') : personas.map((p) => p.id).join(', ')}`)
  console.log('')

  const runtime = await createRuntime(runtimeConfig)
  const result = await runEnsemble(runtime, brief, selectedPersonas)

  await mkdir(outputDir, { recursive: true })
  const slug = [
    result.countryCode,
    result.sector.replace(/[^a-zA-Z0-9]+/g, '-'),
    result.strategy.replace(/[^a-zA-Z0-9]+/g, '-'),
    result.runAt.slice(0, 10),
  ].join('--')
  const outPath = path.join(outputDir, `${slug}.json`)
  await writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf-8')

  console.log(`\nResults: ${outPath}`)
  console.log(`Aggregate score: ${result.aggregateScore} (${result.aggregateRecommendation})`)
  console.log(`Confidence: ${result.aggregateConfidence} | Consensus: ${result.consensus}`)
  console.log('')
  for (const v of result.verdicts) {
    console.log(`  ${v.persona}: ${v.score} (${v.recommendation}) [confidence: ${v.confidence}]`)
  }
}

main().catch((err) => {
  console.error(`Research failed: ${err.message}`)
  process.exitCode = 1
})
