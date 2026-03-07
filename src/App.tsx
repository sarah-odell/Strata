import { useMemo, useState } from 'react'
import './App.css'
import { countryProfiles, supportedSectors, type FactorKey } from './data/countries'
import {
  type DealSize,
  type PortfolioAdjacencyInputs,
  type PortfolioCapability,
  rankCountries,
  strategyWeights,
  type ScenarioCase,
  type ScoredCountry,
  type Strategy,
} from './lib/scoring'

const strategies: Strategy[] = ['Buyout', 'Growth', 'Low-Risk Entry']
type ViewMode = 'radar' | 'dealLab' | 'definitions'
type RankingView = 'cards' | 'table'
const scenarioOptions: { label: string; value: ScenarioCase }[] = [
  { label: 'Base Case', value: 'base' },
  { label: 'Bull Case', value: 'bull' },
  { label: 'Bear Case', value: 'bear' },
]
const dealSizeOptions: { label: string; value: DealSize }[] = [
  { label: '< $250M EV', value: 'small' },
  { label: '$250M-$1B EV', value: 'mid' },
  { label: '> $1B EV', value: 'large' },
]
const dealSizeRanges: Record<DealSize, string> = {
  small: 'Under $250M enterprise value',
  mid: '$250M to $1B enterprise value',
  large: 'Over $1B enterprise value',
}
const podiumLabels = ['1st place', '2nd place', '3rd place'] as const
const scenarioLabel: Record<ScenarioCase, string> = {
  base: 'Base Case',
  bull: 'Bull Case',
  bear: 'Bear Case',
}
const capabilityOptions: { label: string; value: PortfolioCapability }[] = [
  { label: 'Regulatory Operations', value: 'regulatoryOperations' },
  { label: 'Integration Playbook', value: 'integrationPlaybook' },
  { label: 'Government Relations', value: 'governmentRelations' },
  { label: 'Digital Go-To-Market', value: 'digitalGoToMarket' },
  { label: 'Supply Chain Operations', value: 'supplyChainOperations' },
]

type PromptAssumptions = {
  strategy: Strategy
  sector: string
  scenarioCase: ScenarioCase
  dealSize: DealSize
  targetCountryCode: string | null
}

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
  if (recommendation === 'Very strong') {
    return 'badge badge-very-strong'
  }

  if (recommendation === 'Strong') {
    return 'badge badge-strong'
  }

  if (recommendation === 'Moderate') {
    return 'badge badge-moderate'
  }

  if (recommendation === 'Weak') {
    return 'badge badge-weak'
  }

  return 'badge badge-very-weak'
}

const parseMoneyToMillions = (raw: string): number | null => {
  const normalized = raw.trim().toLowerCase().replace(/,/g, '')
  if (!normalized) {
    return null
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)\s*([mbk]|bn|mm|million|billion)?/)
  if (!match) {
    return null
  }

  const value = Number(match[1])
  const unit = match[2] ?? 'm'

  if (!Number.isFinite(value)) {
    return null
  }

  if (unit === 'b' || unit === 'bn' || unit === 'billion') {
    return value * 1000
  }

  if (unit === 'k') {
    return value / 1000
  }

  return value
}

const dealSizeFromMillions = (valueMillions: number | null): DealSize | null => {
  if (valueMillions === null) {
    return null
  }

  if (valueMillions < 250) {
    return 'small'
  }

  if (valueMillions <= 1000) {
    return 'mid'
  }

  return 'large'
}

const countryAliases: Record<string, string> = {
  usa: 'US',
  'united states': 'US',
  us: 'US',
  germany: 'DE',
  deutschland: 'DE',
  singapore: 'SG',
  canada: 'CA',
  uae: 'AE',
  'united arab emirates': 'AE',
  uk: 'GB',
  'united kingdom': 'GB',
  britain: 'GB',
  france: 'FR',
  netherlands: 'NL',
  holland: 'NL',
  japan: 'JP',
  australia: 'AU',
  india: 'IN',
  brazil: 'BR',
  mexico: 'MX',
  spain: 'ES',
  italy: 'IT',
  'south korea': 'KR',
  korea: 'KR',
  'saudi arabia': 'SA',
  sweden: 'SE',
  poland: 'PL',
  indonesia: 'ID',
}

const inferTargetCountry = (prompt: string): string | null => {
  const normalized = prompt.toLowerCase()
  const aliasEntries = Object.entries(countryAliases).sort((a, b) => b[0].length - a[0].length)

  for (const [alias, code] of aliasEntries) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i')
    if (pattern.test(normalized)) {
      return code
    }
  }

  return null
}

const inferAssumptions = (
  prompt: string,
  fundSizeInput: string,
  defaults: { strategy: Strategy; sector: string; scenarioCase: ScenarioCase; dealSize: DealSize },
): PromptAssumptions => {
  const normalized = prompt.toLowerCase()

  const inferredStrategy =
    normalized.includes('low risk') ||
    normalized.includes('conservative') ||
    normalized.includes('downside')
      ? 'Low-Risk Entry'
      : normalized.includes('growth') || normalized.includes('scale')
        ? 'Growth'
        : normalized.includes('buyout') || normalized.includes('control') || normalized.includes('lbo')
          ? 'Buyout'
          : defaults.strategy

  const inferredScenario =
    normalized.includes('bull') || normalized.includes('upside') || normalized.includes('aggressive')
      ? 'bull'
      : normalized.includes('bear') || normalized.includes('recession') || normalized.includes('stress')
        ? 'bear'
        : defaults.scenarioCase

  const inferredSector = supportedSectors.find((candidate) => {
    const token = candidate.toLowerCase()
    return normalized.includes(token) || normalized.includes(token.replace(' & ', ' and '))
  })

  const fallbackSector = normalized.includes('health') || normalized.includes('care')
    ? 'Healthcare Services'
    : normalized.includes('software') || normalized.includes('saas') || normalized.includes('data')
      ? 'Software & Data Services'
      : normalized.includes('financial') || normalized.includes('fintech') || normalized.includes('bank')
        ? 'Financial Services'
        : normalized.includes('energy') || normalized.includes('power') || normalized.includes('infrastructure')
          ? 'Energy & Infrastructure'
          : normalized.includes('consumer') || normalized.includes('retail') || normalized.includes('ecommerce')
            ? 'Consumer & Retail'
            : normalized.includes('logistics') || normalized.includes('transport') || normalized.includes('supply chain')
              ? 'Logistics & Transportation'
              : normalized.includes('education') || normalized.includes('training') || normalized.includes('edtech')
                ? 'Education & Training'
                : normalized.includes('real estate') || normalized.includes('built environment') || normalized.includes('property')
                  ? 'Real Estate & Built Environment'
                  : normalized.includes('food') || normalized.includes('agri') || normalized.includes('agriculture')
                    ? 'Food & Agriculture'
                    : normalized.includes('aerospace') || normalized.includes('defense')
                      ? 'Aerospace & Defense'
                      : normalized.includes('industrial') || normalized.includes('manufacturing')
                        ? 'Industrial Technology'
                        : normalized.includes('professional services') || normalized.includes('business services')
                          ? 'Professional Services'
                          : defaults.sector

  const dealSizeFromPrompt = dealSizeFromMillions(parseMoneyToMillions(prompt))
  const fundSizeMillions = parseMoneyToMillions(fundSizeInput)
  const dealSizeFromFundHeuristic =
    fundSizeMillions === null ? null : dealSizeFromMillions(fundSizeMillions * 0.3)

  return {
    strategy: inferredStrategy,
    sector: inferredSector ?? fallbackSector,
    scenarioCase: inferredScenario,
    dealSize: dealSizeFromPrompt ?? dealSizeFromFundHeuristic ?? defaults.dealSize,
    targetCountryCode: inferTargetCountry(prompt),
  }
}

const topStrengths = (profile: ScoredCountry, strategy: Strategy): string[] => {
  return strategyWeights[strategy]
    .map((factor) => {
      const raw = profile.factors[factor.key]
      const directional = factor.invert ? 100 - raw : raw
      return {
        key: factor.key,
        weighted: directional * factor.weight,
      }
    })
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 2)
    .map((item) => factorLabel(item.key))
}

const toggleItem = <T,>(items: T[], value: T): T[] =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value]

type RadarMetric = {
  label: string
  value: number
}

const dealProfileMetrics = (profile: ScoredCountry): RadarMetric[] => {
  const technology =
    ((profile.sectorFit['Industrial Technology'] ?? 0) +
      (profile.sectorFit['Software & Data Services'] ?? 0)) /
    2
  const customerQuality =
    ((profile.sectorFit['Professional Services'] ?? 0) +
      (profile.sectorFit['Consumer & Retail'] ?? 0) +
      (profile.sectorFit['Healthcare Services'] ?? 0)) /
    3

  return [
    { label: 'Market Position', value: profile.scenarioScore },
    { label: 'Growth', value: profile.factors.economicStrength },
    { label: 'Technology', value: Math.round(technology) },
    { label: 'Customer Quality', value: Math.round(customerQuality) },
    { label: 'Regulatory Risk', value: profile.factors.regulatoryComplexity },
    { label: 'Integration Risk', value: profile.factors.dealExecutionRisk },
  ]
}

const radarPoint = (
  index: number,
  total: number,
  value: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number } => {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2
  const scaledRadius = (Math.max(0, Math.min(100, value)) / 100) * radius
  return {
    x: cx + Math.cos(angle) * scaledRadius,
    y: cy + Math.sin(angle) * scaledRadius,
  }
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('radar')
  const [rankingView, setRankingView] = useState<RankingView>('table')
  const [sector, setSector] = useState<string>(supportedSectors[0])
  const [strategy, setStrategy] = useState<Strategy>('Buyout')
  const [scenarioCase, setScenarioCase] = useState<ScenarioCase>('base')
  const [dealSize, setDealSize] = useState<DealSize>('mid')
  const [expandedCountryCode, setExpandedCountryCode] = useState<string | null>('US')
  const [dealPrompt, setDealPrompt] = useState<string>(
    'We run a control-focused fund and need our next platform in a politically stable OECD market with strong logistics density and manageable execution risk; we are considering an initial foothold in the Netherlands.',
  )
  const [fundSizeInput, setFundSizeInput] = useState<string>('2000')
  const [portfolioSectors, setPortfolioSectors] = useState<string[]>([])
  const [portfolioRegions, setPortfolioRegions] = useState<string[]>([])
  const [portfolioCapabilities, setPortfolioCapabilities] = useState<PortfolioCapability[]>([])

  const regionOptions = useMemo(
    () => Array.from(new Set(countryProfiles.map((profile) => profile.region))),
    [],
  )
  const portfolioAdjacency = useMemo<PortfolioAdjacencyInputs>(
    () => ({
      sectors: portfolioSectors,
      regions: portfolioRegions,
      capabilities: portfolioCapabilities,
    }),
    [portfolioCapabilities, portfolioRegions, portfolioSectors],
  )

  const ranked = useMemo(
    () => rankCountries(countryProfiles, sector, strategy, scenarioCase, dealSize, portfolioAdjacency),
    [sector, strategy, scenarioCase, dealSize, portfolioAdjacency],
  )
  const promptAssumptions = useMemo(
    () => inferAssumptions(dealPrompt, fundSizeInput, { strategy, sector, scenarioCase, dealSize }),
    [dealPrompt, fundSizeInput, strategy, sector, scenarioCase, dealSize],
  )
  const tailoredRanked = useMemo(
    () =>
      rankCountries(
        countryProfiles,
        promptAssumptions.sector,
        promptAssumptions.strategy,
        promptAssumptions.scenarioCase,
        promptAssumptions.dealSize,
        portfolioAdjacency,
      ),
    [promptAssumptions, portfolioAdjacency],
  )
  const tailoredTopThree = tailoredRanked.slice(0, 3)
  const targetCountryProfile = promptAssumptions.targetCountryCode
    ? tailoredRanked.find((country) => country.code === promptAssumptions.targetCountryCode)
    : null
  const targetCountryPosition =
    promptAssumptions.targetCountryCode === null || targetCountryProfile === null
      ? null
      : tailoredRanked.findIndex((country) => country.code === promptAssumptions.targetCountryCode) + 1

  const topThree = ranked.slice(0, 3)
  const trackedCountries = ranked.length
  const radarProfile = tailoredRanked[0] ?? ranked[0]
  const radarContextLabel = `#1 tailored recommendation: ${radarProfile.name}`
  const radarMetrics = dealProfileMetrics(radarProfile)
  const radarSize = 320
  const radarCenter = radarSize / 2
  const radarRadius = 110
  const radarLevels = [20, 40, 60, 80, 100]
  const radarPolygonPoints = radarMetrics
    .map((metric, index) => {
      const point = radarPoint(index, radarMetrics.length, metric.value, radarCenter, radarCenter, radarRadius)
      return `${point.x},${point.y}`
    })
    .join(' ')

  const applyPromptDrivenSelections = (nextPrompt: string, nextFundSizeInput: string) => {
    const inferred = inferAssumptions(nextPrompt, nextFundSizeInput, {
      strategy,
      sector,
      scenarioCase,
      dealSize,
    })
    setStrategy(inferred.strategy)
    setSector(inferred.sector)
    setScenarioCase(inferred.scenarioCase)
    setDealSize(inferred.dealSize)
  }

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
          className={viewMode === 'dealLab' ? 'view-btn active' : 'view-btn'}
          onClick={() => setViewMode('dealLab')}
        >
          Deal Lab
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
            Deal size bands are based on target enterprise value.
          </p>

          <section className="grid-header">
            <div className="grid-header-top">
              <div>
                <h3>Country ranking ({trackedCountries} markets)</h3>
                <p>
                  Overall score = 35% sector fit + 65% weighted risk-adjusted country factors for{' '}
                  <strong>{strategy}</strong> ·{' '}
                  <strong>{scenarioOptions.find((s) => s.value === scenarioCase)?.label}</strong> ·{' '}
                  <strong>{dealSizeOptions.find((d) => d.value === dealSize)?.label}</strong> + portfolio
                  adjacency overlay
                </p>
              </div>
              <div className="ranking-view-toggle">
                <button
                  type="button"
                  className={rankingView === 'cards' ? 'scenario-btn active' : 'scenario-btn'}
                  onClick={() => setRankingView('cards')}
                >
                  Cards
                </button>
                <button
                  type="button"
                  className={rankingView === 'table' ? 'scenario-btn active' : 'scenario-btn'}
                  onClick={() => setRankingView('table')}
                >
                  Table
                </button>
              </div>
            </div>
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

          {rankingView === 'cards' ? (
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
                      <p>Portfolio adjacency adjustment: +{profile.portfolioAdjacencyAdjustment}</p>
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
          ) : (
            <section className="table-shell">
              <table className="country-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Country</th>
                    <th>Region</th>
                    <th>Score</th>
                    <th>Recommendation</th>
                    <th>Sector Fit</th>
                    <th>Country Factors</th>
                    <th>Adjacency</th>
                    <th>Confidence</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((profile, index) => (
                    <tr key={`table-${profile.code}`}>
                      <td>#{index + 1}</td>
                      <td>
                        <span className="table-country-name">{profile.name}</span>
                        <span className="table-country-code">{profile.code}</span>
                      </td>
                      <td>{profile.region}</td>
                      <td>{profile.scenarioScore}</td>
                      <td>
                        <span className={badgeClass(profile.scenarioRecommendation)}>
                          {profile.scenarioRecommendation}
                        </span>
                      </td>
                      <td>{profile.sectorScore}</td>
                      <td>{profile.weightedFactorScore}</td>
                      <td>+{profile.portfolioAdjacencyAdjustment}</td>
                      <td>{Math.round(profile.confidence * 100)}%</td>
                      <td>{profile.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      ) : viewMode === 'dealLab' ? (
        <>
          <section className="adjacency-panel">
            <p className="weights-title">Portfolio Adjacency Inputs</p>
            <p className="prompt-subtitle">
              Add existing portfolio footprint so ranking captures expansion adjacencies.
            </p>
            <p className="adjacency-label">Existing portfolio sectors</p>
            <div className="chip-grid">
              {supportedSectors.map((item) => (
                <button
                  key={`adj-sector-${item}`}
                  type="button"
                  className={portfolioSectors.includes(item) ? 'scenario-btn active' : 'scenario-btn'}
                  onClick={() => setPortfolioSectors((current) => toggleItem(current, item))}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="adjacency-label">Existing portfolio regions</p>
            <div className="chip-grid">
              {regionOptions.map((region) => (
                <button
                  key={`adj-region-${region}`}
                  type="button"
                  className={portfolioRegions.includes(region) ? 'scenario-btn active' : 'scenario-btn'}
                  onClick={() => setPortfolioRegions((current) => toggleItem(current, region))}
                >
                  {region}
                </button>
              ))}
            </div>
            <p className="adjacency-label">In-house capabilities</p>
            <div className="chip-grid">
              {capabilityOptions.map((capability) => (
                <button
                  key={`adj-capability-${capability.value}`}
                  type="button"
                  className={
                    portfolioCapabilities.includes(capability.value) ? 'scenario-btn active' : 'scenario-btn'
                  }
                  onClick={() =>
                    setPortfolioCapabilities((current) => toggleItem(current, capability.value))
                  }
                >
                  {capability.label}
                </button>
              ))}
            </div>
          </section>

          <section className="prompt-tool">
            <p className="weights-title">Deal Team Prompt</p>
            <p className="prompt-subtitle">
              Enter your deal context to generate a tailored top-3 recommendation view.
            </p>
            <label>
              Prompt
              <textarea
                value={dealPrompt}
                onChange={(event) => {
                  const nextPrompt = event.target.value
                  setDealPrompt(nextPrompt)
                  applyPromptDrivenSelections(nextPrompt, fundSizeInput)
                }}
                placeholder="I am a $2B fund evaluating expansion options in Germany for aerospace & defense. Where should we prioritize?"
              />
            </label>
            <label>
              Fund size (USD millions)
              <input
                type="text"
                value={fundSizeInput}
                onChange={(event) => {
                  const nextFundSize = event.target.value
                  setFundSizeInput(nextFundSize)
                  applyPromptDrivenSelections(dealPrompt, nextFundSize)
                }}
                placeholder="2000"
              />
            </label>

            <div className="prompt-assumptions">
              <span>Strategy: {promptAssumptions.strategy}</span>
              <span>Sector: {promptAssumptions.sector}</span>
              <span>Scenario: {scenarioLabel[promptAssumptions.scenarioCase]}</span>
              <span>Deal size: {dealSizeOptions.find((option) => option.value === promptAssumptions.dealSize)?.label}</span>
              {targetCountryProfile ? <span>Target country detected: {targetCountryProfile.name}</span> : null}
            </div>

            <div className="prompt-results">
              {tailoredTopThree.map((profile, index) => (
                <article key={`tailored-${profile.code}`} className="prompt-result-card">
                  <p className="top-rank">{podiumLabels[index]}</p>
                  <h4>{profile.name}</h4>
                  <p className="top-score">Score {profile.scenarioScore}</p>
                  <p className={badgeClass(profile.scenarioRecommendation)}>{profile.scenarioRecommendation}</p>
                  <p className="summary">
                    Why: strong {topStrengths(profile, promptAssumptions.strategy).join(' + ')} under{' '}
                    {promptAssumptions.strategy.toLowerCase()} weighting.
                  </p>
                </article>
              ))}
            </div>

            {targetCountryPosition ? (
              <p className="prompt-target-note">
                Target country position: <strong>#{targetCountryPosition}</strong> ({targetCountryProfile?.name}) in
                the tailored ranking.
              </p>
            ) : null}
          </section>

          <section className="radar-panel">
            <div className="radar-header">
              <div>
                <p className="weights-title">Deal Profile Radar</p>
                <p className="prompt-subtitle">
                  Instant profile view across market, growth, technology, customer quality, and risks.
                </p>
              </div>
              <p className="radar-context">{radarContextLabel}</p>
            </div>

            <div className="radar-layout">
              <svg
                viewBox={`0 0 ${radarSize} ${radarSize}`}
                role="img"
                aria-label={`Deal profile radar for ${radarProfile.name}`}
                className="radar-chart"
              >
                {radarLevels.map((level) => {
                  const ringPoints = radarMetrics
                    .map((_, index) => {
                      const point = radarPoint(
                        index,
                        radarMetrics.length,
                        level,
                        radarCenter,
                        radarCenter,
                        radarRadius,
                      )
                      return `${point.x},${point.y}`
                    })
                    .join(' ')
                  return (
                    <polygon
                      key={`ring-${level}`}
                      points={ringPoints}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                    />
                  )
                })}

                {radarMetrics.map((_, index) => {
                  const end = radarPoint(index, radarMetrics.length, 100, radarCenter, radarCenter, radarRadius)
                  return (
                    <line
                      key={`axis-${index}`}
                      x1={radarCenter}
                      y1={radarCenter}
                      x2={end.x}
                      y2={end.y}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                    />
                  )
                })}

                <polygon
                  points={radarPolygonPoints}
                  fill="rgba(245, 158, 11, 0.22)"
                  stroke="rgba(245, 158, 11, 0.9)"
                  strokeWidth="2"
                />
              </svg>

              <div className="radar-legend">
                {radarMetrics.map((metric) => (
                  <p key={`legend-${metric.label}`}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </p>
                ))}
                <p className="radar-note">
                  Risk axes are displayed as risk intensity (higher value = higher risk).
                </p>
              </div>
            </div>
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

          <article className="definition-card">
            <h4>Software &amp; Data Services</h4>
            <p>
              Software-led and data-intensive businesses delivering mission-critical workflows,
              analytics, and recurring subscription or usage-based products.
            </p>
            <p>
              Includes: vertical SaaS, workflow software, data infrastructure, applied AI tooling,
              and enterprise information services.
            </p>
            <p>
              Excludes: ad-dependent consumer apps and non-differentiated IT resale businesses.
            </p>
          </article>

          <article className="definition-card">
            <h4>Financial Services</h4>
            <p>
              Regulated and adjacent financial platforms delivering payments, lending, insurance,
              wealth, and capital markets enablement.
            </p>
            <p>
              Includes: specialty finance, payments infrastructure, wealth operations, reg-tech,
              and risk/compliance platforms.
            </p>
            <p>
              Excludes: highly speculative trading-led models without durable operating earnings.
            </p>
          </article>

          <article className="definition-card">
            <h4>Energy &amp; Infrastructure</h4>
            <p>
              Businesses that build, operate, or service critical energy, utilities, transport, and
              core infrastructure systems.
            </p>
            <p>
              Includes: grid and transmission services, distributed energy, utility services,
              environmental infrastructure, and operations technology.
            </p>
            <p>
              Excludes: pure commodity exposure without defensible operating capabilities.
            </p>
          </article>

          <article className="definition-card">
            <h4>Consumer &amp; Retail</h4>
            <p>
              Consumer-facing brands and retail platforms with repeat demand, pricing discipline,
              and scalable multichannel distribution.
            </p>
            <p>
              Includes: specialty retail, consumer health/wellness, digitally enabled commerce, and
              franchise-like service chains.
            </p>
            <p>
              Excludes: trend-dependent low-moat products with weak retention or margin durability.
            </p>
          </article>

          <article className="definition-card">
            <h4>Logistics &amp; Transportation</h4>
            <p>
              Businesses enabling goods movement, distribution, and supply chain reliability across
              domestic and cross-border networks.
            </p>
            <p>
              Includes: contract logistics, freight forwarding, transport software, warehouse
              automation, and last-mile optimization.
            </p>
            <p>
              Excludes: pure commodity shipping exposure without differentiated service capabilities.
            </p>
          </article>

          <article className="definition-card">
            <h4>Education &amp; Training</h4>
            <p>
              Platforms and service providers delivering workforce, professional, and institutional
              learning outcomes with recurring demand.
            </p>
            <p>
              Includes: vocational training, corporate learning platforms, assessment systems, and
              compliance training solutions.
            </p>
            <p>
              Excludes: unaccredited, low-completion models without measurable learner outcomes.
            </p>
          </article>

          <article className="definition-card">
            <h4>Real Estate &amp; Built Environment</h4>
            <p>
              Businesses tied to property operations, facility performance, and built-environment
              modernization.
            </p>
            <p>
              Includes: property technology, facility services, construction-adjacent services, and
              asset operations platforms.
            </p>
            <p>
              Excludes: pure land speculation and highly cyclical assets without operating leverage.
            </p>
          </article>

          <article className="definition-card">
            <h4>Food &amp; Agriculture</h4>
            <p>
              Businesses in food value chains and agricultural systems with defensible processing,
              distribution, and compliance capabilities.
            </p>
            <p>
              Includes: food processing, agri-services, specialty inputs, cold-chain infrastructure,
              and traceability software.
            </p>
            <p>
              Excludes: undifferentiated commodity exposure lacking value-added operations.
            </p>
          </article>
        </section>
      )}
    </main>
  )
}

export default App
