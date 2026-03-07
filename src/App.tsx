import { useMemo, useState } from 'react'
import './App.css'
import { countryProfiles, supportedSectors, type FactorKey } from './data/countries'
import {
  type DealSize,
  rankCountries,
  strategyWeights,
  type ScenarioCase,
  type ScoredCountry,
  type Strategy,
} from './lib/scoring'

const strategies: Strategy[] = ['Buyout', 'Growth', 'Low-Risk Entry']
type ViewMode = 'radar' | 'definitions'
const scenarioOptions: { label: string; value: ScenarioCase }[] = [
  { label: 'Base Case', value: 'base' },
  { label: 'Bull Case', value: 'bull' },
  { label: 'Bear Case', value: 'bear' },
]
const dealSizeOptions: { label: string; value: DealSize }[] = [
  { label: 'Small Deal', value: 'small' },
  { label: 'Mid Deal', value: 'mid' },
  { label: 'Large Deal', value: 'large' },
]
const dealSizeRanges: Record<DealSize, string> = {
  small: 'Under $250M enterprise value',
  mid: '$250M to $1B enterprise value',
  large: 'Over $1B enterprise value',
}
const podiumLabels = ['1st place', '2nd place', '3rd place'] as const

const factorLabel = (key: FactorKey): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())

const trendArrow = (direction: 'up' | 'down' | 'flat'): string => {
  if (direction === 'up') {
    return '↑'
  }

  if (direction === 'down') {
    return '↓'
  }

  return '→'
}

const badgeClass = (recommendation: ScoredCountry['recommendation']): string => {
  if (recommendation === 'Go') {
    return 'badge badge-go'
  }

  if (recommendation === 'Maybe') {
    return 'badge badge-maybe'
  }

  return 'badge badge-avoid'
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('radar')
  const [sector, setSector] = useState<string>(supportedSectors[0])
  const [strategy, setStrategy] = useState<Strategy>('Buyout')
  const [scenarioCase, setScenarioCase] = useState<ScenarioCase>('base')
  const [dealSize, setDealSize] = useState<DealSize>('mid')
  const [expandedCountryCode, setExpandedCountryCode] = useState<string | null>('US')

  const ranked = useMemo(
    () => rankCountries(countryProfiles, sector, strategy, scenarioCase, dealSize),
    [sector, strategy, scenarioCase, dealSize],
  )

  const topThree = ranked.slice(0, 3)
  const trackedCountries = ranked.length

  return (
    <main className="app-shell">
      <div className="ambient-orb orb-top" aria-hidden="true" />
      <div className="ambient-orb orb-right" aria-hidden="true" />

      <header className="hero">
        <p className="eyebrow">Strata Intelligence</p>
        <h1>PE Expansion Radar</h1>
        <p>
          Decision support for PE and corporate development teams evaluating country expansion
          exposure across macro, regulatory, tax, and geopolitical dimensions.
        </p>
      </header>

      <section className="view-switch">
        <button
          type="button"
          className={viewMode === 'radar' ? 'view-btn active' : 'view-btn'}
          onClick={() => setViewMode('radar')}
        >
          Radar
        </button>
        <button
          type="button"
          className={viewMode === 'definitions' ? 'view-btn active' : 'view-btn'}
          onClick={() => setViewMode('definitions')}
        >
          Industry Definitions
        </button>
      </section>

      {viewMode === 'radar' ? (
        <>
          <section className="controls">
            <label>
              Deal strategy
              <select value={strategy} onChange={(event) => setStrategy(event.target.value as Strategy)}>
                {strategies.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sector focus
              <select value={sector} onChange={(event) => setSector(event.target.value)}>
                {supportedSectors.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="scenario-toggle">
            {scenarioOptions.map((scenario) => (
              <button
                key={scenario.value}
                type="button"
                className={scenarioCase === scenario.value ? 'scenario-btn active' : 'scenario-btn'}
                onClick={() => setScenarioCase(scenario.value)}
              >
                {scenario.label}
              </button>
            ))}
          </section>

          <section className="scenario-toggle">
            {dealSizeOptions.map((sizeOption) => (
              <button
                key={sizeOption.value}
                type="button"
                className={dealSize === sizeOption.value ? 'scenario-btn active' : 'scenario-btn'}
                onClick={() => setDealSize(sizeOption.value)}
              >
                {sizeOption.label}
              </button>
            ))}
          </section>
          <p className="deal-size-note">
            Deal size bands: Small = {dealSizeRanges.small}; Mid = {dealSizeRanges.mid}; Large ={' '}
            {dealSizeRanges.large}.
          </p>

          <section className="grid-header">
            <h3>Country ranking ({trackedCountries} markets)</h3>
            <p>
              Overall score = 35% sector fit + 65% weighted risk-adjusted country factors for{' '}
              <strong>{strategy}</strong> · <strong>{scenarioOptions.find((s) => s.value === scenarioCase)?.label}</strong> ·{' '}
              <strong>{dealSizeOptions.find((d) => d.value === dealSize)?.label}</strong>
            </p>
          </section>

          <section className="weights-panel">
            <p className="weights-title">Current factor weights ({strategy})</p>
            <div className="weights-grid">
              {strategyWeights[strategy].map((factor) => (
                <div key={`weight-${factor.key}`} className="weight-chip">
                  <p>{factorLabel(factor.key)}</p>
                  <span>{Math.round(factor.weight * 100)}% · {factor.invert ? 'Lower is better' : 'Higher is better'}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="top-three-grid">
            {topThree.map((profile, index) => (
              <article key={`top-${profile.code}`} className="top-market-card">
                <p className="top-rank">{podiumLabels[index] ?? `${index + 1}th place`}</p>
                <h4>{profile.name}</h4>
                <p className="region">{profile.region}</p>
                <p className="top-score">Score {profile.scenarioScore}</p>
                <p className={badgeClass(profile.scenarioRecommendation)}>
                  {profile.scenarioRecommendation}
                </p>
              </article>
            ))}
          </section>

          <section className="country-grid">
            {ranked.map((profile, index) => {
              const expanded = expandedCountryCode === profile.code
              const isTopThree = index < 3

              return (
                <article key={profile.code} className={isTopThree ? 'country-card is-top' : 'country-card'}>
                  <div className="top-row">
                    <div>
                      <p className="country-code">{profile.code}</p>
                      <h4>{profile.name}</h4>
                      <p className="region">{profile.region}</p>
                    </div>
                    <div className="score-stack">
                      <p className="rank-pill">#{index + 1}</p>
                      <p className="score">{profile.scenarioScore}</p>
                      <p className={badgeClass(profile.scenarioRecommendation)}>
                        {profile.scenarioRecommendation}
                      </p>
                    </div>
                  </div>

                  <div className="factor-block">
                    <p>Sector fit: {profile.sectorScore}</p>
                    <p>Weighted country factors: {profile.weightedFactorScore}</p>
                  </div>

                  <ul>
                    {strategyWeights[strategy].map((factor) => {
                      const raw = profile.factors[factor.key]
                      const directional = factor.invert ? 100 - raw : raw
                      const quality = profile.factorDataQuality[factor.key]
                      const trendClass = `factor-trend factor-trend-${quality.trendDirection}`
                      const signedDelta =
                        quality.delta > 0 ? `+${quality.delta.toFixed(1)}` : quality.delta.toFixed(1)

                      return (
                        <li key={factor.key}>
                          {factorLabel(factor.key)}: {raw} (model impact: {directional}, weight{' '}
                          {(factor.weight * 100).toFixed(0)}%)
                          <span className={trendClass}>
                            {trendArrow(quality.trendDirection)} {signedDelta}
                          </span>
                          <span className="factor-quality">
                            Refreshed {quality.lastRefreshed} · Confidence{' '}
                            {Math.round(quality.confidence * 100)}%
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  <p className="summary">{profile.notes}</p>
                  <p className="meta">
                    Confidence {Math.round(profile.confidence * 100)}% · Updated {profile.lastUpdated}
                  </p>

                  <button
                    className="detail-toggle"
                    type="button"
                    onClick={() => setExpandedCountryCode(expanded ? null : profile.code)}
                  >
                    {expanded ? 'Hide details' : 'View details'}
                  </button>

                  {expanded ? (
                    <div className="detail-panel">
                      <p className="detail-title">Scenario scores</p>
                      <p>Base: {profile.scenarios.base}</p>
                      <p>Bull: {profile.scenarios.bull}</p>
                      <p>Bear: {profile.scenarios.bear}</p>
                      <p className="detail-title">Factor citations</p>
                      {Object.entries(profile.factorCitations).map(([factor, citations]) => (
                        <div key={factor} className="citation-group">
                          <p>{factorLabel(factor as FactorKey)}</p>
                          <ul>
                            {citations.map((citation) => (
                              <li key={`${factor}-${citation.url}`}>
                                <a href={citation.url} target="_blank" rel="noreferrer">
                                  {citation.label}
                                </a>{' '}
                                (checked {citation.lastChecked})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </section>
        </>
      ) : (
        <section className="definitions-panel">
          <h3>Industry Definitions</h3>
          <p>
            These definitions standardize how sectors are used in screening and memo generation.
          </p>

          <article className="definition-card">
            <h4>Deal Strategy Definitions</h4>
            <p>
              <strong>Buyout:</strong> Control-oriented acquisitions focused on operational improvement
              and multiple pathways to value creation.
            </p>
            <p>
              <strong>Growth:</strong> Expansion capital or minority-led strategies prioritizing
              revenue scaling, market share capture, and capability buildout.
            </p>
            <p>
              <strong>Low-Risk Entry:</strong> Capital deployment emphasizing downside protection,
              stable policy environments, and lower execution volatility.
            </p>
          </article>

          <article className="definition-card">
            <h4>Deal Size Definitions</h4>
            <p>
              <strong>Small Deal:</strong> {dealSizeRanges.small}
            </p>
            <p>
              <strong>Mid Deal:</strong> {dealSizeRanges.mid}
            </p>
            <p>
              <strong>Large Deal:</strong> {dealSizeRanges.large}
            </p>
          </article>

          <article className="definition-card">
            <h4>Professional Services</h4>
            <p>
              B2B service-led businesses that primarily generate revenue through recurring contracts,
              advisory, outsourced workflows, or managed delivery.
            </p>
            <p>
              Includes: BPO, compliance/risk services, tech-enabled advisory, managed IT services,
              data and analytics services.
            </p>
            <p>
              Excludes: consumer services and pure software license businesses without service-led
              delivery.
            </p>
          </article>

          <article className="definition-card">
            <h4>Healthcare Services</h4>
            <p>
              Service providers operating in care delivery, diagnostics, care enablement, and
              healthcare operations support.
            </p>
            <p>
              Includes: provider platforms, diagnostics/labs, care management, revenue cycle and
              payer-support services.
            </p>
            <p>
              Excludes: pure biotech/pharma R&amp;D and medical device manufacturing.
            </p>
          </article>

          <article className="definition-card">
            <h4>Industrial Technology</h4>
            <p>
              Industrial and infrastructure-adjacent technology businesses with hardware, software,
              and automation capabilities embedded in operations.
            </p>
            <p>
              Includes: automation systems, industrial software, advanced manufacturing technology,
              and process optimization solutions.
            </p>
            <p>
              Excludes: low-tech commoditized manufacturing without differentiated technology IP.
            </p>
          </article>

          <article className="definition-card">
            <h4>Aerospace &amp; Defense</h4>
            <p>
              Defense, aerospace, and dual-use technology businesses serving government and
              mission-critical commercial programs.
            </p>
            <p>
              Includes: defense electronics, aerospace systems, secure communications, MRO,
              simulation/training, and certified mission software.
            </p>
            <p>
              Excludes: non-compliant suppliers without required certifications, export-control
              readiness, or government contracting capability.
            </p>
          </article>
        </section>
      )}
    </main>
  )
}

export default App
