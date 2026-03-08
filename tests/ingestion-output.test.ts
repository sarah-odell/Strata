import { describe, expect, test } from 'vitest'
import { indicatorFactorOverrides } from '../src/data/indicatorOverrides'

const requiredKeys = [
  'marketSizeDepth',
  'marketGrowthMomentum',
  'marketConcentrationRisk',
  'customerDensity',
  'digitalReadiness',
  'licensingComplexity',
  'talentAvailability',
]

describe('indicator overrides output', () => {
  test('contains expanded methodology factors for core tracked markets', () => {
    for (const code of ['US', 'DE', 'SG', 'GB', 'SE', 'DK']) {
      const row = indicatorFactorOverrides[code]
      expect(row).toBeTruthy()
      for (const key of requiredKeys) {
        expect(typeof (row as Record<string, unknown>)[key]).toBe('number')
      }
    }
  })
})
