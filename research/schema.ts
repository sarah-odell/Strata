export interface ResearchBrief {
  country: string
  countryCode: string
  sector: string
  strategy: string
}

export interface AnalystVerdict {
  persona: string
  country: string
  countryCode: string
  sector: string
  strategy: string
  score: number
  confidence: number
  recommendation: 'Very strong' | 'Strong' | 'Moderate' | 'Weak' | 'Very weak'
  narrative: string
  keyRisks: string[]
  keyOpportunities: string[]
  sources: { title: string; url: string; relevance: string }[]
  dataPoints: { label: string; value: string; source: string; asOf: string }[]
}

export interface EnsembleResult {
  country: string
  countryCode: string
  sector: string
  strategy: string
  runAt: string
  verdicts: AnalystVerdict[]
  aggregateScore: number
  aggregateConfidence: number
  consensus: 'strong' | 'moderate' | 'split'
  aggregateRecommendation: 'Very strong' | 'Strong' | 'Moderate' | 'Weak' | 'Very weak'
}
