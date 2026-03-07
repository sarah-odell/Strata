import { type CountryProfile, type FactorKey } from '../data/countries'

export type Strategy = 'Buyout' | 'Growth' | 'Low-Risk Entry'

export type FactorWeight = {
  key: FactorKey
  weight: number
  invert: boolean
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
    { key: 'regulatoryComplexity', weight: 0.16, invert: true },
    { key: 'taxTariffFriction', weight: 0.14, invert: true },
    { key: 'geopoliticalRisk', weight: 0.14, invert: true },
    { key: 'dealExecutionRisk', weight: 0.1, invert: true },
  ],
  'Low-Risk Entry': [
    { key: 'economicStrength', weight: 0.22, invert: false },
    { key: 'regulatoryComplexity', weight: 0.22, invert: true },
    { key: 'taxTariffFriction', weight: 0.18, invert: true },
    { key: 'geopoliticalRisk', weight: 0.24, invert: true },
    { key: 'dealExecutionRisk', weight: 0.14, invert: true },
  ],
}

export type ScoredCountry = CountryProfile & {
  sectorScore: number
  weightedFactorScore: number
  overallScore: number
  recommendation: 'Go' | 'Watchlist' | 'Avoid'
}

const scoreBucket = (score: number): ScoredCountry['recommendation'] => {
  if (score >= 75) {
    return 'Go'
  }

  if (score >= 62) {
    return 'Watchlist'
  }

  return 'Avoid'
}

export const scoreCountry = (
  profile: CountryProfile,
  sector: string,
  strategy: Strategy,
): ScoredCountry => {
  const sectorScore = profile.sectorFit[sector] ?? 0
  const weightedFactorScore = strategyWeights[strategy].reduce((acc, factor) => {
    const raw = profile.factors[factor.key]
    const directional = factor.invert ? 100 - raw : raw

    return acc + directional * factor.weight
  }, 0)

  const overallScore = Math.round(sectorScore * 0.35 + weightedFactorScore * 0.65)

  return {
    ...profile,
    sectorScore,
    weightedFactorScore: Math.round(weightedFactorScore),
    overallScore,
    recommendation: scoreBucket(overallScore),
  }
}

export const rankCountries = (
  profiles: CountryProfile[],
  sector: string,
  strategy: Strategy,
): ScoredCountry[] => {
  return profiles
    .map((profile) => scoreCountry(profile, sector, strategy))
    .sort((a, b) => b.overallScore - a.overallScore)
}
