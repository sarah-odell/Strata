import { describe, expect, test } from 'vitest'
import { countryProfiles } from '../src/data/countries'
import { getEffectiveFactorWeights, rankCountries } from '../src/lib/scoring'

describe('scoring model', () => {
  test('effective weights normalize to 100%', () => {
    for (const strategy of ['Buyout', 'Growth', 'Low-Risk Entry'] as const) {
      for (const size of ['small', 'mid', 'large'] as const) {
        const sum = getEffectiveFactorWeights(strategy, size, 'Professional Services')
          .reduce((acc, factor) => acc + factor.weight, 0)
        expect(sum).toBeCloseTo(1, 6)
      }
    }
  })

  test('deal size changes rankings for same strategy/sector', () => {
    const small = rankCountries(countryProfiles, 'Professional Services', 'Buyout', 'base', 'small')
      .slice(0, 5)
      .map((item) => item.code)
    const large = rankCountries(countryProfiles, 'Professional Services', 'Buyout', 'base', 'large')
      .slice(0, 5)
      .map((item) => item.code)

    expect(small.join(',')).not.toBe(large.join(','))
  })

  test('deployability score is bounded 0..100', () => {
    const ranked = rankCountries(countryProfiles, 'Industrial Technology', 'Growth', 'base', 'mid')
    for (const row of ranked) {
      expect(row.deployabilityScore).toBeGreaterThanOrEqual(0)
      expect(row.deployabilityScore).toBeLessThanOrEqual(100)
    }
  })
})
