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

type SectorFactorMultipliers = Partial<Record<FactorKey, number>>

const dealSizeFactorMultipliers: Record<DealSize, Partial<Record<FactorKey, number>>> = {
  small: {
    marketSizeDepth: 0.72,
    marketGrowthMomentum: 0.9,
    customerDensity: 1.1,
    digitalReadiness: 1.14,
    regulatoryComplexity: 1.18,
    licensingComplexity: 1.22,
    languageBarrier: 1.2,
    marketConcentrationRisk: 1.08,
    talentAvailability: 1.06,
    taxTariffFriction: 1.08,
    geopoliticalRisk: 1.1,
    dealExecutionRisk: 1.14,
  },
  mid: {
    marketSizeDepth: 1.08,
    marketGrowthMomentum: 1.02,
    customerDensity: 1.04,
    digitalReadiness: 1.0,
    regulatoryComplexity: 1.02,
    licensingComplexity: 1.06,
    languageBarrier: 1.04,
    marketConcentrationRisk: 1.1,
    talentAvailability: 1.02,
    taxTariffFriction: 1.0,
    geopoliticalRisk: 1.0,
    dealExecutionRisk: 1.0,
  },
  large: {
    marketSizeDepth: 1.35,
    marketGrowthMomentum: 1.1,
    customerDensity: 0.92,
    digitalReadiness: 0.9,
    regulatoryComplexity: 0.92,
    licensingComplexity: 0.9,
    languageBarrier: 0.85,
    marketConcentrationRisk: 1.15,
    talentAvailability: 1.04,
    taxTariffFriction: 0.98,
    geopoliticalRisk: 1.08,
    dealExecutionRisk: 0.9,
  },
}

const sectorFactorMultipliers: Record<string, SectorFactorMultipliers> = {
  'Software & Data Services': {
    digitalReadiness: 1.25,
    talentAvailability: 1.16,
    customerDensity: 1.08,
    marketConcentrationRisk: 1.06,
    taxTariffFriction: 0.9,
  },
  'Healthcare Services': {
    licensingComplexity: 1.22,
    regulatoryComplexity: 1.15,
    talentAvailability: 1.14,
    digitalReadiness: 1.06,
  },
  'Aerospace & Defense': {
    licensingComplexity: 1.3,
    geopoliticalRisk: 1.2,
    marketConcentrationRisk: 1.16,
    marketSizeDepth: 1.1,
    languageBarrier: 0.95,
  },
  'Financial Services': {
    licensingComplexity: 1.2,
    regulatoryComplexity: 1.2,
    digitalReadiness: 1.15,
    talentAvailability: 1.1,
    marketConcentrationRisk: 1.08,
  },
  'Industrial Technology': {
    marketSizeDepth: 1.16,
    customerDensity: 1.12,
    talentAvailability: 1.1,
    dealExecutionRisk: 1.08,
  },
  'Energy & Infrastructure': {
    marketSizeDepth: 1.2,
    licensingComplexity: 1.18,
    geopoliticalRisk: 1.16,
    marketConcentrationRisk: 1.08,
    languageBarrier: 0.95,
  },
  'Professional Services': {
    languageBarrier: 1.15,
    customerDensity: 1.1,
    talentAvailability: 1.12,
    digitalReadiness: 1.08,
  },
}

type RecommendationThreshold = {
  veryStrongMin: number
  strongMin: number
  moderateMin: number
  weakMin: number
}

export const strategyWeights: Record<Strategy, FactorWeight[]> = {
  Buyout: [
    { key: 'marketSizeDepth', weight: 0.12, invert: false },
    { key: 'marketGrowthMomentum', weight: 0.12, invert: false },
    { key: 'customerDensity', weight: 0.08, invert: false },
    { key: 'digitalReadiness', weight: 0.07, invert: false },
    { key: 'regulatoryComplexity', weight: 0.1, invert: true },
    { key: 'licensingComplexity', weight: 0.08, invert: true },
    { key: 'languageBarrier', weight: 0.07, invert: true },
    { key: 'marketConcentrationRisk', weight: 0.08, invert: true },
    { key: 'talentAvailability', weight: 0.08, invert: false },
    { key: 'taxTariffFriction', weight: 0.06, invert: true },
    { key: 'geopoliticalRisk', weight: 0.08, invert: true },
    { key: 'dealExecutionRisk', weight: 0.06, invert: true },
  ],
  Growth: [
    { key: 'marketSizeDepth', weight: 0.14, invert: false },
    { key: 'marketGrowthMomentum', weight: 0.17, invert: false },
    { key: 'customerDensity', weight: 0.09, invert: false },
    { key: 'digitalReadiness', weight: 0.12, invert: false },
    { key: 'regulatoryComplexity', weight: 0.08, invert: true },
    { key: 'licensingComplexity', weight: 0.06, invert: true },
    { key: 'languageBarrier', weight: 0.06, invert: true },
    { key: 'marketConcentrationRisk', weight: 0.06, invert: true },
    { key: 'talentAvailability', weight: 0.1, invert: false },
    { key: 'taxTariffFriction', weight: 0.04, invert: true },
    { key: 'geopoliticalRisk', weight: 0.05, invert: true },
    { key: 'dealExecutionRisk', weight: 0.03, invert: true },
  ],
  'Low-Risk Entry': [
    { key: 'marketSizeDepth', weight: 0.1, invert: false },
    { key: 'marketGrowthMomentum', weight: 0.08, invert: false },
    { key: 'customerDensity', weight: 0.06, invert: false },
    { key: 'digitalReadiness', weight: 0.07, invert: false },
    { key: 'regulatoryComplexity', weight: 0.15, invert: true },
    { key: 'licensingComplexity', weight: 0.13, invert: true },
    { key: 'languageBarrier', weight: 0.1, invert: true },
    { key: 'marketConcentrationRisk', weight: 0.08, invert: true },
    { key: 'talentAvailability', weight: 0.08, invert: false },
    { key: 'taxTariffFriction', weight: 0.08, invert: true },
    { key: 'geopoliticalRisk', weight: 0.1, invert: true },
    { key: 'dealExecutionRisk', weight: 0.07, invert: true },
  ],
}

const strategyRecommendationThresholds: Record<Strategy, Record<DealSize, RecommendationThreshold>> = {
  Buyout: {
    small: { veryStrongMin: 67, strongMin: 59, moderateMin: 51, weakMin: 44 },
    mid: { veryStrongMin: 64, strongMin: 56, moderateMin: 48, weakMin: 42 },
    large: { veryStrongMin: 62, strongMin: 54, moderateMin: 46, weakMin: 40 },
  },
  Growth: {
    small: { veryStrongMin: 66, strongMin: 58, moderateMin: 50, weakMin: 43 },
    mid: { veryStrongMin: 63, strongMin: 55, moderateMin: 48, weakMin: 41 },
    large: { veryStrongMin: 61, strongMin: 53, moderateMin: 46, weakMin: 39 },
  },
  'Low-Risk Entry': {
    small: { veryStrongMin: 69, strongMin: 61, moderateMin: 52, weakMin: 45 },
    mid: { veryStrongMin: 67, strongMin: 59, moderateMin: 50, weakMin: 43 },
    large: { veryStrongMin: 65, strongMin: 57, moderateMin: 48, weakMin: 41 },
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
  deployabilityScore: number
  portfolioAdjacencyAdjustment: number
  scenarios: {
    base: number
    bull: number
    bear: number
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const getEffectiveFactorWeights = (
  strategy: Strategy,
  dealSize: DealSize,
  sector?: string,
): FactorWeight[] => {
  const base = strategyWeights[strategy]
  const multipliers = dealSizeFactorMultipliers[dealSize]
  const sectorMultipliers = sector ? (sectorFactorMultipliers[sector] ?? {}) : {}
  const adjusted = base.map((factor) => ({
    ...factor,
    weight: factor.weight * (multipliers[factor.key] ?? 1) * (sectorMultipliers[factor.key] ?? 1),
  }))
  const totalWeight = adjusted.reduce((sum, factor) => sum + factor.weight, 0)
  return adjusted.map((factor) => ({ ...factor, weight: factor.weight / totalWeight }))
}

const dealSizeAdjustment = (profile: CountryProfile, dealSize: DealSize): number => {
  if (dealSize === 'small') {
    const executionFit =
      (100 - profile.factors.regulatoryComplexity) * 0.22 +
      (100 - profile.factors.licensingComplexity) * 0.24 +
      (100 - profile.factors.dealExecutionRisk) * 0.2 +
      (100 - profile.factors.languageBarrier) * 0.16 +
      profile.factors.customerDensity * 0.1 +
      profile.factors.digitalReadiness * 0.08
    return Math.round(clamp((executionFit - 55) / 7, -7, 7))
  }

  if (dealSize === 'mid') {
    const deployabilityScore =
      profile.factors.marketSizeDepth * 0.55 +
      profile.factors.customerDensity * 0.15 +
      (100 - profile.factors.marketConcentrationRisk) * 0.2 +
      (100 - profile.factors.licensingComplexity) * 0.1
    return Math.round(clamp((deployabilityScore - 55) / 8, -5, 5))
  }

  const scaleScore =
    profile.factors.marketSizeDepth * 0.62 +
    profile.factors.marketGrowthMomentum * 0.16 +
    profile.factors.talentAvailability * 0.08 +
    (100 - profile.factors.marketConcentrationRisk) * 0.08 +
    (100 - profile.factors.geopoliticalRisk) * 0.06

  return Math.round(clamp((scaleScore - 55) / 7, -8, 8))
}

const deployabilityScoreForDealSize = (profile: CountryProfile, dealSize: DealSize): number => {
  if (dealSize === 'small') {
    return Math.round(
      clamp(
        (100 - profile.factors.licensingComplexity) * 0.24 +
          (100 - profile.factors.regulatoryComplexity) * 0.2 +
          (100 - profile.factors.languageBarrier) * 0.16 +
          (100 - profile.factors.dealExecutionRisk) * 0.16 +
          profile.factors.customerDensity * 0.12 +
          profile.factors.digitalReadiness * 0.12,
        0,
        100,
      ),
    )
  }

  if (dealSize === 'mid') {
    return Math.round(
      clamp(
        profile.factors.marketSizeDepth * 0.4 +
          profile.factors.customerDensity * 0.2 +
          profile.factors.talentAvailability * 0.14 +
          (100 - profile.factors.marketConcentrationRisk) * 0.12 +
          (100 - profile.factors.licensingComplexity) * 0.14,
        0,
        100,
      ),
    )
  }

  return Math.round(
    clamp(
      profile.factors.marketSizeDepth * 0.58 +
        profile.factors.marketGrowthMomentum * 0.16 +
        profile.factors.talentAvailability * 0.1 +
        (100 - profile.factors.marketConcentrationRisk) * 0.1 +
        (100 - profile.factors.geopoliticalRisk) * 0.06,
      0,
      100,
    ),
  )
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
  dealSize: DealSize,
): ScoredCountry['recommendation'] => {
  const threshold = strategyRecommendationThresholds[strategy][dealSize]

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
  const effectiveWeights = getEffectiveFactorWeights(strategy, dealSize, sector)
  const weightedFactorScore = effectiveWeights.reduce((acc, factor) => {
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
      marketSizeDepth: 2,
      marketGrowthMomentum: 7,
      marketConcentrationRisk: -3,
      customerDensity: 2,
      digitalReadiness: 4,
      licensingComplexity: -3,
      languageBarrier: -2,
      talentAvailability: 3,
    },
    bear: {
      economicStrength: -10,
      regulatoryComplexity: 6,
      taxTariffFriction: 8,
      geopoliticalRisk: 10,
      dealExecutionRisk: 5,
      marketSizeDepth: -3,
      marketGrowthMomentum: -9,
      marketConcentrationRisk: 5,
      customerDensity: -2,
      digitalReadiness: -3,
      licensingComplexity: 4,
      languageBarrier: 3,
      talentAvailability: -4,
    },
  }
  const computeScenario = (sc: ScenarioCase): number => {
    const shifts = scenarioShifts[sc]
    const stressed = effectiveWeights.reduce((acc, factor) => {
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
  const deployabilityScore = deployabilityScoreForDealSize(profile, dealSize)
  const adjacencyAdjustment = portfolioAdjacencyAdjustment(profile, sector, portfolioAdjacency)
  const scenarioScore = clamp(scenarios[scenarioCase] + sizeAdjustment + adjacencyAdjustment, 0, 100)

  return {
    ...profile,
    sectorScore,
    weightedFactorScore: Math.round(weightedFactorScore),
    overallScore,
    recommendation: scoreBucket(overallScore, strategy, dealSize),
    scenarioScore,
    scenarioRecommendation: scoreBucket(scenarioScore, strategy, dealSize),
    dealSizeAdjustment: sizeAdjustment,
    deployabilityScore,
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
