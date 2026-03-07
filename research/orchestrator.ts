import type { ResearchRuntime } from './runtime'
import type { AnalystVerdict, EnsembleResult, ResearchBrief } from './schema'
import { type Persona, buildPrompt, personas } from './personas'

function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch { /* fall through */ }

  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1])
    } catch { /* fall through */ }
  }

  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0])
    } catch { /* fall through */ }
  }

  throw new Error('No valid JSON found in agent response')
}

function toRecommendation(score: number): AnalystVerdict['recommendation'] {
  if (score >= 80) return 'Very strong'
  if (score >= 65) return 'Strong'
  if (score >= 50) return 'Moderate'
  if (score >= 35) return 'Weak'
  return 'Very weak'
}

async function runPersona(
  runtime: ResearchRuntime,
  persona: Persona,
  brief: ResearchBrief,
): Promise<AnalystVerdict> {
  const prompt = buildPrompt(persona, brief)
  const raw = await runtime.execute(prompt)
  const parsed = extractJSON(raw) as Record<string, unknown>

  return {
    persona: persona.id,
    country: brief.country,
    countryCode: brief.countryCode,
    sector: brief.sector,
    strategy: brief.strategy,
    score: Number(parsed.score) || 0,
    confidence: Number(parsed.confidence) || 0,
    recommendation: (parsed.recommendation as AnalystVerdict['recommendation']) ?? toRecommendation(Number(parsed.score) || 0),
    narrative: String(parsed.narrative ?? ''),
    keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks.map(String) : [],
    keyOpportunities: Array.isArray(parsed.keyOpportunities) ? parsed.keyOpportunities.map(String) : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources as AnalystVerdict['sources'] : [],
    dataPoints: Array.isArray(parsed.dataPoints) ? parsed.dataPoints as AnalystVerdict['dataPoints'] : [],
  }
}

export async function runEnsemble(
  runtime: ResearchRuntime,
  brief: ResearchBrief,
  selectedPersonas?: string[],
): Promise<EnsembleResult> {
  const active = selectedPersonas
    ? personas.filter((p) => selectedPersonas.includes(p.id))
    : personas

  const results = await Promise.allSettled(
    active.map((persona) => runPersona(runtime, persona, brief)),
  )

  const verdicts: AnalystVerdict[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      verdicts.push(result.value)
    } else {
      console.error(`Agent failed: ${result.reason}`)
    }
  }

  if (verdicts.length === 0) {
    throw new Error('All research agents failed')
  }

  const totalWeight = verdicts.reduce((sum, v) => sum + v.confidence, 0)
  const aggregateScore = totalWeight > 0
    ? Math.round(verdicts.reduce((sum, v) => sum + v.score * v.confidence, 0) / totalWeight)
    : Math.round(verdicts.reduce((sum, v) => sum + v.score, 0) / verdicts.length)
  const aggregateConfidence = verdicts.length > 0
    ? Number((verdicts.reduce((sum, v) => sum + v.confidence, 0) / verdicts.length).toFixed(2))
    : 0

  const scores = verdicts.map((v) => v.score)
  const spread = Math.max(...scores) - Math.min(...scores)
  const consensus: EnsembleResult['consensus'] =
    spread <= 15 ? 'strong' : spread <= 30 ? 'moderate' : 'split'

  return {
    country: brief.country,
    countryCode: brief.countryCode,
    sector: brief.sector,
    strategy: brief.strategy,
    runAt: new Date().toISOString(),
    verdicts,
    aggregateScore,
    aggregateConfidence,
    consensus,
    aggregateRecommendation: toRecommendation(aggregateScore),
  }
}
