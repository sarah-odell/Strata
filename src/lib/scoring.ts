import { type CountryProfile, type FactorKey } from '../data/countries'

export type Strategy = 'Buyout' | 'Growth' | 'Low-Risk Entry'
export type ScenarioCase = 'base' | 'bull' | 'bear'
export type DealSize = 'small' | 'mid' | 'large'
export type PortfolioCapability =
  | 'regulatoryOperations'
  | 'integrationPlaybook'
  | 'governmentRelations'
  | 'digitalGoToMarket'
  | 'supplyChainOperations'

export type PortfolioAdjacencyInputs = {
  sectors: string[]
  regions: string[]
  capabilities: PortfolioCapability[]
}

export type FactorWeight = {
  key: FactorKey
  weight: number
  invert: boolean
}

type RecommendationThreshold = {
  veryStrongMin: number
  strongMin: number
  moderateMin: number
  weakMin: number
}

export const strategyWeights: Record<Strategy, FactorWeight[]> = {
  Buyout: [
    { key: 'economicStrength', weight: 0.3, invert: false },
    { key: 'regulatoryComplexity', weight: 0.18, invert: true },
    { key: 'taxTariffFriction', weight: 0.16, invert: true },
    { key: 'geopoliticalRisk', weight: 0.2, invert: true },
    { key: 'dealExecutionRisk', weight: 0.16, invert: true },
  ],
  Growth: [
    { key: 'economicStrength', weight: 0.32, invert: false },
    { key: 'regulatoryComplexity', weight: 0.18, invert: true },
    { key: 'taxTariffFriction', weight: 0.16, invert: true },
    { key: 'geopoliticalRisk', weight: 0.18, invert: true },
    { key: 'dealExecutionRisk', weight: 0.16, invert: true },
  ],
  'Low-Risk Entry': [
    { key: 'economicStrength', weight: 0.22, invert: false },
    { key: 'regulatoryComplexity', weight: 0.22, invert: true },
    { key: 'taxTariffFriction', weight: 0.18, invert: true },
    { key: 'geopoliticalRisk', weight: 0.24, invert: true },
    { key: 'dealExecutionRisk', weight: 0.14, invert: true },
  ],
}

const strategyRecommendationThresholds: Record<Strategy, RecommendationThreshold> = {
  Buyout: {
    veryStrongMin: 66,
    strongMin: 58,
    moderateMin: 50,
    weakMin: 43,
  },
  Growth: {
    veryStrongMin: 63,
    strongMin: 55,
    moderateMin: 48,
    weakMin: 41,
  },
  'Low-Risk Entry': {
    veryStrongMin: 68,
    strongMin: 60,
    moderateMin: 50,
    weakMin: 44,
  },
}

export type RecommendationLabel =
  | 'Very strong'
  | 'Strong'
  | 'Moderate'
  | 'Weak'
  | 'Very weak'

export type ScoredCountry = CountryProfile & {
  sectorScore: number
  weightedFactorScore: number
  overallScore: number
  recommendation: RecommendationLabel
  scenarioScore: number
  scenarioRecommendation: RecommendationLabel
  dealSizeAdjustment: number
  portfolioAdjacencyAdjustment: number
  scenarios: {
    base: number
    bull: number
    bear: number
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const dealSizeAdjustment = (profile: CountryProfile, dealSize: DealSize): number => {
  if (dealSize === 'mid') {
    return 0
  }

  if (dealSize === 'small') {
    const lowFrictionScore =
      ((100 - profile.factors.regulatoryComplexity) +
        (100 - profile.factors.dealExecutionRisk) +
        (100 - profile.factors.taxTariffFriction)) /
      3
    return Math.round(clamp((lowFrictionScore - 50) / 8, -6, 6))
  }

  const scaleScore =
    profile.factors.economicStrength * 0.55 +
    (100 - profile.factors.geopoliticalRisk) * 0.25 +
    (100 - profile.factors.taxTariffFriction) * 0.2

  return Math.round(clamp((scaleScore - 50) / 8, -6, 6))
}

const capabilityAdjustment = (
  profile: CountryProfile,
  sector: string,
  capabilities: PortfolioCapability[],
): number => {
  let bonus = 0

  if (capabilities.includes('regulatoryOperations')) {
    bonus += (profile.factors.regulatoryComplexity / 100) * 1.8
  }

  if (capabilities.includes('integrationPlaybook')) {
    bonus += (profile.factors.dealExecutionRisk / 100) * 1.8
  }

  if (
    capabilities.includes('governmentRelations') &&
    ['Aerospace & Defense', 'Energy & Infrastructure', 'Financial Services'].includes(sector)
  ) {
    bonus += 1.8
  }

  if (
    capabilities.includes('digitalGoToMarket') &&
    ['Software & Data Services', 'Professional Services', 'Financial Services'].includes(sector)
  ) {
    bonus += 1.4
  }

  if (
    capabilities.includes('supplyChainOperations') &&
    ['Industrial Technology', 'Logistics & Transportation', 'Food & Agriculture'].includes(sector)
  ) {
    bonus += 1.4
  }

  return bonus
}

const portfolioAdjacencyAdjustment = (
  profile: CountryProfile,
  sector: string,
  adjacency: PortfolioAdjacencyInputs | undefined,
): number => {
  if (!adjacency) {
    return 0
  }

  let adjustment = 0

  if (adjacency.sectors.includes(sector)) {
    adjustment += 3.2
  }

  if (adjacency.regions.includes(profile.region)) {
    adjustment += 2.2
  }

  adjustment += capabilityAdjustment(profile, sector, adjacency.capabilities)

  return Math.round(clamp(adjustment, 0, 8))
}

const scoreBucket = (
  score: number,
  strategy: Strategy,
): ScoredCountry['recommendation'] => {
  const threshold = strategyRecommendationThresholds[strategy]

  if (score >= threshold.veryStrongMin) {
    return 'Very strong'
  }

  if (score >= threshold.strongMin) {
    return 'Strong'
  }

  if (score >= threshold.moderateMin) {
    return 'Moderate'
  }

  if (score >= threshold.weakMin) {
    return 'Weak'
  }

  return 'Very weak'
}

export const scoreCountry = (
  profile: CountryProfile,
  sector: string,
  strategy: Strategy,
  scenarioCase: ScenarioCase = 'base',
  dealSize: DealSize = 'mid',
  portfolioAdjacency?: PortfolioAdjacencyInputs,
): ScoredCountry => {
  const sectorScore = profile.sectorFit[sector] ?? 0
  const weightedFactorScore = strategyWeights[strategy].reduce((acc, factor) => {
    const raw = profile.factors[factor.key]
    const directional = factor.invert ? 100 - raw : raw

    return acc + directional * factor.weight
  }, 0)

  const overallScore = Math.round(sectorScore * 0.35 + weightedFactorScore * 0.65)

  // Factor-level scenario stress testing
  const scenarioShifts: Record<ScenarioCase, Partial<Record<FactorKey, number>>> = {
    base: {},
    bull: {
      economicStrength: 8,
      regulatoryComplexity: -4,
      taxTariffFriction: -5,
      geopoliticalRisk: -6,
      dealExecutionRisk: -3,
    },
    bear: {
      economicStrength: -10,
      regulatoryComplexity: 6,
      taxTariffFriction: 8,
      geopoliticalRisk: 10,
      dealExecutionRisk: 5,
    },
  }
  const computeScenario = (sc: ScenarioCase): number => {
    const shifts = scenarioShifts[sc]
    const stressed = strategyWeights[strategy].reduce((acc, factor) => {
      const raw = clamp(profile.factors[factor.key] + (shifts[factor.key] ?? 0), 0, 100)
      const directional = factor.invert ? 100 - raw : raw
      return acc + directional * factor.weight
    }, 0)
    return Math.round(sectorScore * 0.35 + stressed * 0.65)
  }
  const scenarios = {
    base: overallScore,
    bull: computeScenario('bull'),
    bear: computeScenario('bear'),
  }

  const sizeAdjustment = dealSizeAdjustment(profile, dealSize)
  const adjacencyAdjustment = portfolioAdjacencyAdjustment(profile, sector, portfolioAdjacency)
  const scenarioScore = clamp(scenarios[scenarioCase] + sizeAdjustment + adjacencyAdjustment, 0, 100)

  return {
    ...profile,
    sectorScore,
    weightedFactorScore: Math.round(weightedFactorScore),
    overallScore,
    recommendation: scoreBucket(overallScore, strategy),
    scenarioScore,
    scenarioRecommendation: scoreBucket(scenarioScore, strategy),
    dealSizeAdjustment: sizeAdjustment,
    portfolioAdjacencyAdjustment: adjacencyAdjustment,
    scenarios: {
      base: scenarios.base,
      bull: scenarios.bull,
      bear: scenarios.bear,
    },
  }
}

export const rankCountries = (
  profiles: CountryProfile[],
  sector: string,
  strategy: Strategy,
  scenarioCase: ScenarioCase = 'base',
  dealSize: DealSize = 'mid',
  portfolioAdjacency?: PortfolioAdjacencyInputs,
): ScoredCountry[] => {
  return profiles
    .map((profile) =>
      scoreCountry(profile, sector, strategy, scenarioCase, dealSize, portfolioAdjacency),
    )
    .sort((a, b) => b.scenarioScore - a.scenarioScore)
}
