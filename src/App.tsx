import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { countryProfiles, supportedSectors, type FactorKey } from './data/countries'
import {
  type DealSize,
  type PortfolioAdjacencyInputs,
  type PortfolioCapability,
  type RecommendationLabel,
  rankCountries,
  getEffectiveFactorWeights,
  type ScenarioCase,
  type ScoredCountry,
  type Strategy,
} from './lib/scoring'
import { isResearchCreateResponse, isResearchJobResponse } from './lib/apiContracts'

const strategies: Strategy[] = ['Buyout', 'Growth', 'Low-Risk Entry']
type ViewMode = 'radar' | 'dealLab' | 'research'
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

type ResearchVerdict = {
  persona: string
  country: string
  countryCode: string
  sector: string
  strategy: string
  score: number
  confidence: number
  recommendation: RecommendationLabel
  narrative: string
  keyRisks: string[]
  keyOpportunities: string[]
  sources: { title: string; url: string; relevance: string }[]
  dataPoints: { label: string; value: string; source: string; asOf: string }[]
}

type ResearchResult = {
  country: string
  countryCode: string
  sector: string
  strategy: string
  prompt?: string
  runAt: string
  verdicts: ResearchVerdict[]
  aggregateScore: number
  aggregateConfidence: number
  consensus: 'strong' | 'moderate' | 'split'
  aggregateRecommendation: RecommendationLabel
}

type DealLabExportEntry = {
  id: string
  createdAt: string
  fileName: string
  summary: string
  content: string
}

const DEAL_LAB_EXPORTS_KEY = 'strata_deal_lab_exports_v1'

const personaLabel = (id: string): string =>
  ({
    'macro-economist': 'Macro Economist',
    'regulatory-analyst': 'Regulatory Analyst',
    'deal-execution': 'Deal Execution',
    'geopolitical-analyst': 'Geopolitical Analyst',
    'sector-specialist': 'Sector Specialist',
  })[id] ?? id

const DEFAULT_BACKEND_URL = import.meta.env.VITE_STRATA_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:8787' : '')
const BACKEND_URL_STORAGE_KEY = 'strata_backend_url'
const FACTOR_FRESHNESS_SLA_DAYS = 30

const formatResearchError = (raw: string): string => {
  const message = raw.trim()
  if (!message) {
    return 'Research job failed during execution.'
  }

  if (message.includes('spawn claude ENOENT')) {
    return 'Research runtime not found on backend host (missing `claude` CLI). Install Claude CLI or set STRATA_CLAUDE_CMD to a valid command.'
  }

  if (message.toLowerCase().includes('timed out')) {
    return 'Research runtime timed out. Retry or increase runtime timeout on backend.'
  }

  return message
}

const factorLabel = (key: FactorKey): string => {
  const labels: Record<FactorKey, string> = {
    economicStrength: 'Economic Strength',
    regulatoryComplexity: 'Regulatory Complexity',
    taxTariffFriction: 'Tax/Tariff Friction',
    geopoliticalRisk: 'Geopolitical Risk',
    dealExecutionRisk: 'Deal Execution Risk',
    marketSizeDepth: 'Market Size & Depth',
    marketGrowthMomentum: 'Market Growth Momentum',
    marketConcentrationRisk: 'Competition Intensity (Financial Proxy)',
    customerDensity: 'Customer Density',
    digitalReadiness: 'Digital Readiness',
    licensingComplexity: 'Licensing Complexity',
    languageBarrier: 'Language Barrier',
    talentAvailability: 'Talent Availability',
  }
  return labels[key]
}

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
  switzerland: 'CH',
  swiss: 'CH',
  denmark: 'DK',
  norway: 'NO',
  finland: 'FI',
  ireland: 'IE',
  austria: 'AT',
  belgium: 'BE',
  'czech republic': 'CZ',
  czechia: 'CZ',
  portugal: 'PT',
  greece: 'GR',
  hungary: 'HU',
  turkey: 'TR',
  turkiye: 'TR',
  romania: 'RO',
  china: 'CN',
  'hong kong': 'HK',
  hongkong: 'HK',
  taiwan: 'TW',
  vietnam: 'VN',
  thailand: 'TH',
  philippines: 'PH',
  malaysia: 'MY',
  'new zealand': 'NZ',
  israel: 'IL',
  qatar: 'QA',
  'south africa': 'ZA',
  nigeria: 'NG',
  egypt: 'EG',
  kenya: 'KE',
  morocco: 'MA',
  chile: 'CL',
  colombia: 'CO',
  argentina: 'AR',
  peru: 'PE',
  'costa rica': 'CR',
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

const topStrengths = (profile: ScoredCountry, strategy: Strategy, dealSize: DealSize, sector: string): string[] => {
  return getEffectiveFactorWeights(strategy, dealSize, sector)
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
    { label: 'Growth', value: profile.factors.marketGrowthMomentum },
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

const downloadTextFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

const loadDealLabExports = (): DealLabExportEntry[] => {
  try {
    if (typeof window === 'undefined') {
      return []
    }

    const raw = window.localStorage.getItem(DEAL_LAB_EXPORTS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as DealLabExportEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dealLab')
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
  const [autoApplyPromptInference, setAutoApplyPromptInference] = useState<boolean>(true)
  const [portfolioSectors, setPortfolioSectors] = useState<string[]>([])
  const [portfolioRegions, setPortfolioRegions] = useState<string[]>([])
  const [portfolioCapabilities, setPortfolioCapabilities] = useState<PortfolioCapability[]>([])
  const [researchCountry, setResearchCountry] = useState<string>('US')
  const [researchSector, setResearchSector] = useState<string>(supportedSectors[0])
  const [researchStrategy, setResearchStrategy] = useState<Strategy>('Buyout')
  const [researchPrompt, setResearchPrompt] = useState<string>('')
  const [researchStatus, setResearchStatus] = useState<'idle' | 'running' | 'completed' | 'failed' | 'canceled'>('idle')
  const [researchError, setResearchError] = useState<string | null>(null)
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([])
  const [selectedResearch, setSelectedResearch] = useState<ResearchResult | null>(null)
  const [batchStatus, setBatchStatus] = useState<{ total: number; completed: number; running: boolean }>({ total: 0, completed: 0, running: false })
  const [expandedVerdictSections, setExpandedVerdictSections] = useState<Record<string, Set<string>>>({})

  const toggleVerdictSection = (persona: string, section: string) => {
    setExpandedVerdictSections((prev) => {
      const current = prev[persona] ?? new Set<string>()
      const next = new Set(current)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return { ...prev, [persona]: next }
    })
  }
  const isVerdictSectionOpen = (persona: string, section: string) =>
    expandedVerdictSections[persona]?.has(section) ?? false
  const [sortColumn, setSortColumn] = useState<string>('score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedTableCountryCode, setSelectedTableCountryCode] = useState<string | null>(null)
  const [dealLabExportHistory, setDealLabExportHistory] = useState<DealLabExportEntry[]>(() =>
    loadDealLabExports(),
  )
  const [backendUrlInput, setBackendUrlInput] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_BACKEND_URL
    }
    return window.localStorage.getItem(BACKEND_URL_STORAGE_KEY) || DEFAULT_BACKEND_URL
  })
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'checking' | 'online' | 'offline'>(
    'unknown',
  )

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
  const sortedRanked = useMemo(() => {
    const sorted = [...ranked]
    const dir = sortDirection === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      switch (sortColumn) {
        case 'country': return dir * a.name.localeCompare(b.name)
        case 'region': return dir * a.region.localeCompare(b.region)
        case 'score': return dir * (a.scenarioScore - b.scenarioScore)
        case 'recommendation': return dir * (a.scenarioScore - b.scenarioScore)
        case 'deployability': return dir * (a.deployabilityScore - b.deployabilityScore)
        case 'sectorFit': return dir * (a.sectorScore - b.sectorScore)
        case 'factors': return dir * (a.weightedFactorScore - b.weightedFactorScore)
        case 'adjacency': return dir * (a.portfolioAdjacencyAdjustment - b.portfolioAdjacencyAdjustment)
        case 'confidence': return dir * (a.confidence - b.confidence)
        default: return dir * (a.scenarioScore - b.scenarioScore)
      }
    })
    return sorted
  }, [ranked, sortColumn, sortDirection])

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'country' || column === 'region' ? 'asc' : 'desc')
    }
  }
  const sortIndicator = (column: string) =>
    sortColumn === column ? (sortDirection === 'asc' ? ' \u25B2' : ' \u25BC') : ''

  const selectedTableProfile =
    sortedRanked.find((profile) => profile.code === selectedTableCountryCode) ?? sortedRanked[0] ?? null
  const backendBaseUrl = useMemo(
    () => backendUrlInput.trim().replace(/\/+$/g, ''),
    [backendUrlInput],
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

  const trackedCountries = ranked.length
  const radarProfiles = (tailoredTopThree.length > 0 ? tailoredTopThree : ranked.slice(0, 3)).slice(0, 3)
  const activeWeights = useMemo(
    () => getEffectiveFactorWeights(strategy, dealSize, sector),
    [strategy, dealSize, sector],
  )
  const radarSize = 380
  const radarCenter = radarSize / 2
  const radarRadius = 120
  const radarLevels = [20, 40, 60, 80, 100]

  const loadResearchResults = async () => {
    if (!backendBaseUrl) {
      return
    }
    try {
      const response = await fetch(`${backendBaseUrl}/api/research/results`)
      const data = await response.json()
      setResearchResults(data.results ?? [])
    } catch { /* backend may not be running */ }
  }

  const checkBackendConnection = async (baseUrl: string) => {
    if (!baseUrl) {
      setBackendStatus('unknown')
      return false
    }
    setBackendStatus('checking')
    try {
      const response = await fetch(`${baseUrl}/health`)
      if (!response.ok) {
        throw new Error('Health check failed')
      }
      setBackendStatus('online')
      return true
    } catch {
      setBackendStatus('offline')
      return false
    }
  }

  useEffect(() => {
    if (viewMode === 'research') {
      checkBackendConnection(backendBaseUrl)
    }
  }, [viewMode, backendBaseUrl])

  const triggerResearch = async () => {
    const countryName = countryProfiles.find((c) => c.code === researchCountry)?.name ?? researchCountry
    setResearchError(null)
    const isBackendOnline = await checkBackendConnection(backendBaseUrl)
    if (!isBackendOnline) {
      setResearchStatus('failed')
      setResearchError(`Backend is not reachable at ${backendBaseUrl}.`)
      return
    }
    setResearchStatus('running')
    try {
      const response = await fetch(`${backendBaseUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: researchCountry,
          country: countryName,
          sector: researchSector,
          strategy: researchStrategy,
          prompt: researchPrompt || undefined,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Request failed with HTTP ${response.status}`)
      }
      const createPayload = await response.json()
      if (!isResearchCreateResponse(createPayload)) {
        throw new Error('Unexpected response shape from research endpoint.')
      }
      const { jobId } = createPayload
      const poll = setInterval(async () => {
        try {
          const jobRes = await fetch(`${backendBaseUrl}/api/research/jobs/${jobId}`)
          if (!jobRes.ok) {
            throw new Error(`Job polling failed with HTTP ${jobRes.status}`)
          }
          const job = await jobRes.json()
          if (!isResearchJobResponse(job)) {
            throw new Error('Unexpected response shape while polling research job.')
          }
          if (job.status !== 'running') {
            clearInterval(poll)
            setResearchStatus(job.status)
            if (job.status === 'completed') {
              setResearchError(null)
              loadResearchResults()
            } else if (job.status === 'failed') {
              setResearchError(formatResearchError(job.error || 'Research job failed during execution.'))
            }
          }
        } catch (error) {
          clearInterval(poll)
          setResearchStatus('failed')
          setResearchError(
            formatResearchError(
              error instanceof Error ? error.message : 'Failed while polling research job status.',
            ),
          )
        }
      }, 5000)
    } catch (error) {
      setResearchStatus('failed')
      setResearchError(
        formatResearchError(error instanceof Error ? error.message : 'Failed to submit research request.'),
      )
    }
  }

  const triggerBatchScan = async (marketCodes: string[]) => {
    const markets = marketCodes.map((code) => ({
      countryCode: code,
      country: countryProfiles.find((c) => c.code === code)?.name ?? code,
    }))
    setBatchStatus({ total: markets.length, completed: 0, running: true })
    try {
      const response = await fetch(`${backendBaseUrl}/api/research/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markets,
          sector: researchSector,
          strategy: researchStrategy,
          prompt: researchPrompt || undefined,
        }),
      })
      const { jobs } = await response.json()
      const jobIds = jobs.map((j: { jobId: string }) => j.jobId)

      const poll = setInterval(async () => {
        let done = 0
        let allDone = true
        for (const jobId of jobIds) {
          try {
            const jobRes = await fetch(`${backendBaseUrl}/api/research/jobs/${jobId}`)
            const job = await jobRes.json()
            if (job.status !== 'running') done++
            else allDone = false
          } catch {
            done++
          }
        }
        setBatchStatus((prev) => ({ ...prev, completed: done }))
        if (allDone) {
          clearInterval(poll)
          setBatchStatus((prev) => ({ ...prev, running: false }))
          loadResearchResults()
        }
      }, 8000)
    } catch {
      setBatchStatus({ total: 0, completed: 0, running: false })
    }
  }

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

  const saveBackendUrl = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, backendBaseUrl)
    }
    checkBackendConnection(backendBaseUrl)
  }

  const factorIsStale = (lastRefreshed: string): boolean => {
    const parsed = new Date(lastRefreshed)
    if (Number.isNaN(parsed.getTime())) {
      return true
    }
    return Date.now() - parsed.getTime() > FACTOR_FRESHNESS_SLA_DAYS * 24 * 60 * 60 * 1000
  }

  const createDealLabMemo = (): string => {
    const generatedAt = new Date().toISOString()
    const topThreeLines = tailoredTopThree
      .map((profile, index) => {
        const strengths = topStrengths(
          profile,
          promptAssumptions.strategy,
          promptAssumptions.dealSize,
          promptAssumptions.sector,
        ).join(' + ')
        return `${index + 1}. ${profile.name} (${profile.code}) — Score ${profile.scenarioScore} · ${profile.scenarioRecommendation}\n   - Why: ${strengths}\n   - Region: ${profile.region}`
      })
      .join('\n')

    return [
      '# Strata Deal Lab Memo',
      '',
      `Generated: ${generatedAt}`,
      '',
      '## Input Context',
      `- Prompt: ${dealPrompt}`,
      `- Fund size (USD millions): ${fundSizeInput || 'Not provided'}`,
      `- Inferred strategy: ${promptAssumptions.strategy}`,
      `- Inferred sector: ${promptAssumptions.sector}`,
      `- Inferred scenario: ${scenarioLabel[promptAssumptions.scenarioCase]}`,
      `- Inferred deal size: ${dealSizeOptions.find((option) => option.value === promptAssumptions.dealSize)?.label ?? promptAssumptions.dealSize}`,
      `- Target country detected: ${targetCountryProfile ? `${targetCountryProfile.name} (${targetCountryProfile.code})` : 'None'}`,
      '',
      '## Top 3 Tailored Recommendations',
      topThreeLines || 'No recommendations available.',
      '',
      '## Portfolio Adjacency Inputs',
      `- Portfolio sectors: ${portfolioSectors.length > 0 ? portfolioSectors.join(', ') : 'None selected'}`,
      `- Portfolio regions: ${portfolioRegions.length > 0 ? portfolioRegions.join(', ') : 'None selected'}`,
      `- Portfolio capabilities: ${portfolioCapabilities.length > 0 ? portfolioCapabilities.join(', ') : 'None selected'}`,
      '',
      '## Notes',
      '- Recommendation labels use the five-band scale: Very strong, Strong, Moderate, Weak, Very weak.',
      '- Scenario and adjacency overlays are included in scenario scores shown above.',
      '',
    ].join('\n')
  }

  const handleExportDealLabMemo = () => {
    const content = createDealLabMemo()
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `strata-deal-lab-${stamp}.md`

    downloadTextFile(fileName, content)

    const nextEntry: DealLabExportEntry = {
      id: stamp,
      createdAt: new Date().toISOString(),
      fileName,
      summary: `${promptAssumptions.strategy} · ${promptAssumptions.sector} · ${scenarioLabel[promptAssumptions.scenarioCase]}`,
      content,
    }

    setDealLabExportHistory((current) => {
      const next = [nextEntry, ...current].slice(0, 12)
      window.localStorage.setItem(DEAL_LAB_EXPORTS_KEY, JSON.stringify(next))
      return next
    })
  }

  const handleDownloadFromHistory = (entry: DealLabExportEntry) => {
    downloadTextFile(entry.fileName, entry.content)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-identity">
          <p className="eyebrow">Strata</p>
          <h1>PE Expansion Radar</h1>
        </div>
        <p className="hero-meta">{countryProfiles.length} markets · {countryProfiles[0]?.lastUpdated}</p>
      </header>

      <nav className="view-switch">
        <button
          type="button"
          className={viewMode === 'dealLab' ? 'view-btn active' : 'view-btn'}
          onClick={() => setViewMode('dealLab')}
        >
          Deal Lab
        </button>
        <button
          type="button"
          className={viewMode === 'radar' ? 'view-btn active' : 'view-btn'}
          onClick={() => setViewMode('radar')}
        >
          Radar
        </button>
        <button
          type="button"
          className={viewMode === 'research' ? 'view-btn active' : 'view-btn'}
          onClick={() => { setViewMode('research'); loadResearchResults() }}
        >
          Research
        </button>
      </nav>

      {viewMode === 'radar' ? (
        <>
          <section className="toolbar">
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

            <div className="toolbar-toggles">
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

              <span className="toolbar-divider" />

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
            </div>
          </section>

          <section className="grid-header">
            <div className="grid-header-top">
              <div>
                <h3>Country Ranking</h3>
                <p>
                  {trackedCountries} markets · {strategy} · {scenarioOptions.find((s) => s.value === scenarioCase)?.label} · {dealSizeOptions.find((d) => d.value === dealSize)?.label}
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
                      {activeWeights.map((factor) => {
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
                              Refreshed {quality.lastRefreshed}
                              {factorIsStale(quality.lastRefreshed) ? ' · Stale' : ''}
                              {' '}· Confidence{' '}
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
            <>
            <section className="table-shell">
              {selectedTableProfile ? (
                <div className="table-focus-panel">
                  <div className="table-focus-header">
                    <div>
                      <p className="top-rank">Selected market</p>
                      <h4>{selectedTableProfile.name}</h4>
                      <p className="region">{selectedTableProfile.region}</p>
                    </div>
                    <div className="score-stack">
                      <p className="score">{selectedTableProfile.scenarioScore}</p>
                      <p className={badgeClass(selectedTableProfile.scenarioRecommendation)}>
                        {selectedTableProfile.scenarioRecommendation}
                      </p>
                    </div>
                  </div>
                  <p className="summary">{selectedTableProfile.notes}</p>
                  <p className="meta">
                    Deployability: {selectedTableProfile.deployabilityScore} · Strongest modeled factors: {topStrengths(selectedTableProfile, strategy, dealSize, sector).join(' + ')}
                  </p>
                </div>
              ) : null}

              <table className="country-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th className="sortable-th" onClick={() => toggleSort('country')}>Country{sortIndicator('country')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('region')}>Region{sortIndicator('region')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('score')}>Score{sortIndicator('score')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('recommendation')}>Rec.{sortIndicator('recommendation')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('deployability')}>Deployability{sortIndicator('deployability')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('sectorFit')}>Sector Fit{sortIndicator('sectorFit')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('factors')}>Factors{sortIndicator('factors')}</th>
                    <th className="sortable-th" onClick={() => toggleSort('adjacency')}>
                      <abbr title="Adjacency adjustment">Adj.</abbr>
                      {sortIndicator('adjacency')}
                    </th>
                    <th className="sortable-th" onClick={() => toggleSort('confidence')}>
                      <abbr title="Confidence">Conf.</abbr>
                      {sortIndicator('confidence')}
                    </th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRanked.map((profile, index) => (
                    <tr
                      key={`table-${profile.code}`}
                      className={
                        (selectedTableProfile?.code ?? sortedRanked[0]?.code) === profile.code
                          ? 'is-selected'
                          : undefined
                      }
                      onClick={() => setSelectedTableCountryCode(profile.code)}
                    >
                      <td>#{index + 1}</td>
                      <td>
                        <span className="table-country-name">{profile.name}</span>
                        <span className="table-country-code">{profile.code}</span>
                      </td>
                      <td>{profile.region}</td>
                      <td>
                        <span className="score-cell" style={{ '--w': `${profile.scenarioScore}%` } as React.CSSProperties}>
                          {profile.scenarioScore}
                        </span>
                      </td>
                      <td>
                        <span className={badgeClass(profile.scenarioRecommendation)}>
                          {profile.scenarioRecommendation}
                        </span>
                      </td>
                      <td>{profile.deployabilityScore}</td>
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
            </>
          )}

          <section className="weights-panel">
            <p className="weights-title">Factor Weights — {strategy} · {dealSizeOptions.find((option) => option.value === dealSize)?.label}</p>
            <div className="weights-grid">
              {activeWeights.map((factor) => (
                <div key={`weight-${factor.key}`} className="weight-chip">
                  <p>{factorLabel(factor.key)}</p>
                  <span>{Math.round(factor.weight * 100)}% · {factor.invert ? 'Lower is better' : 'Higher is better'}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="weights-panel">
            <p className="weights-title">Methodology Transparency</p>
            <div className="weights-grid">
              <div className="weight-chip">
                <p>Attractiveness</p>
                <span>Market Size & Depth · Market Growth Momentum · Customer Density · Digital Readiness · Strategic Adjacency</span>
              </div>
              <div className="weight-chip">
                <p>Feasibility</p>
                <span>Regulatory Complexity · Licensing Complexity · Language Barrier · Competition Intensity · Talent Availability</span>
              </div>
              <div className="weight-chip">
                <p>Risk Controls</p>
                <span>Tax/Tariff Friction · Geopolitical Risk · Deal Execution Risk</span>
              </div>
              <div className="weight-chip">
                <p>Source caveats</p>
                <span>Competition Intensity currently uses financial concentration proxies; language barrier can use modeled proxies where direct data coverage is limited.</span>
              </div>
            </div>
          </section>
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
                  if (autoApplyPromptInference) {
                    applyPromptDrivenSelections(nextPrompt, fundSizeInput)
                  }
                }}
                placeholder="I am a $2B fund evaluating expansion options in Germany for aerospace & defense. Where should we prioritize?"
              />
            </label>
            <label className="fund-size-label">
              Fund size (USD millions)
              <input
                type="text"
                value={fundSizeInput}
                onChange={(event) => {
                  const nextFundSize = event.target.value
                  setFundSizeInput(nextFundSize)
                  if (autoApplyPromptInference) {
                    applyPromptDrivenSelections(dealPrompt, nextFundSize)
                  }
                }}
                placeholder="2000"
              />
            </label>

            <div className="prompt-assumptions">
              <span>Strategy: {promptAssumptions.strategy}</span>
              <span>Sector: {promptAssumptions.sector}</span>
              <span>Scenario: {scenarioLabel[promptAssumptions.scenarioCase]}</span>
              <span>Deal size: {dealSizeOptions.find((option) => option.value === promptAssumptions.dealSize)?.label}</span>
              <span>Prompt inference mode: {autoApplyPromptInference ? 'Auto-apply' : 'Manual apply'}</span>
              {targetCountryProfile ? <span>Target country detected: {targetCountryProfile.name}</span> : null}
            </div>
            <div className="scenario-toggle">
              <button
                type="button"
                className={autoApplyPromptInference ? 'scenario-btn active' : 'scenario-btn'}
                onClick={() => setAutoApplyPromptInference((current) => !current)}
              >
                {autoApplyPromptInference ? 'Auto Inference On' : 'Auto Inference Off'}
              </button>
              {!autoApplyPromptInference ? (
                <button
                  type="button"
                  className="scenario-btn"
                  onClick={() => applyPromptDrivenSelections(dealPrompt, fundSizeInput)}
                >
                  Apply Inferred Assumptions
                </button>
              ) : null}
            </div>

            <div className="prompt-results">
              {tailoredTopThree.map((profile, index) => (
                <article key={`tailored-${profile.code}`} className="prompt-result-card">
                  <p className="top-rank">{podiumLabels[index]}</p>
                  <h4>{profile.name}</h4>
                  <p className="top-score">{profile.scenarioScore}</p>
                  <p className={badgeClass(profile.scenarioRecommendation)}>{profile.scenarioRecommendation}</p>
                  <p className="summary">
                    Why: strong {topStrengths(profile, promptAssumptions.strategy, promptAssumptions.dealSize, promptAssumptions.sector).join(' + ')} under{' '}
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

          <section className="export-panel">
            <div className="export-panel-header">
              <div>
                <p className="weights-title">Memo Export</p>
                <p className="prompt-subtitle">
                  Export a Deal Lab memo draft from your current prompt assumptions and top recommendations.
                </p>
              </div>
              <button type="button" className="export-btn" onClick={handleExportDealLabMemo}>
                Export memo (.md)
              </button>
            </div>

            <div className="export-history">
              <p className="adjacency-label">Recent exports</p>
              {dealLabExportHistory.length === 0 ? (
                <p className="export-empty">No exports yet.</p>
              ) : (
                <div className="export-list">
                  {dealLabExportHistory.map((entry) => (
                    <div key={entry.id} className="export-item">
                      <div>
                        <p>{entry.fileName}</p>
                        <span>
                          {new Date(entry.createdAt).toLocaleString()} · {entry.summary}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="scenario-btn"
                        onClick={() => handleDownloadFromHistory(entry)}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="radar-panel">
            <div className="radar-header">
              <div>
                <p className="weights-title">Deal Profile Radar</p>
                <p className="prompt-subtitle">
                  Top 3 tailored recommendations side by side across market, growth, technology,
                  customer quality, and risks.
                </p>
              </div>
            </div>

            <div className="radar-grid">
              {radarProfiles.map((profile, index) => {
                const radarMetrics = dealProfileMetrics(profile)
                const radarPolygonPoints = radarMetrics
                  .map((metric, metricIndex) => {
                    const point = radarPoint(
                      metricIndex,
                      radarMetrics.length,
                      metric.value,
                      radarCenter,
                      radarCenter,
                      radarRadius,
                    )
                    return `${point.x},${point.y}`
                  })
                  .join(' ')

                return (
                  <article key={`radar-${profile.code}`} className="radar-card">
                    <div className="radar-card-head">
                      <p className="top-rank">{podiumLabels[index] ?? `${index + 1}th place`}</p>
                      <p className="radar-card-score">{profile.scenarioScore}</p>
                    </div>
                    <h4>{profile.name}</h4>
                    <p className="region">{profile.region}</p>
                    <p className={badgeClass(profile.scenarioRecommendation)}>{profile.scenarioRecommendation}</p>

                    <svg
                      viewBox={`0 0 ${radarSize} ${radarSize}`}
                      role="img"
                      aria-label={`Deal profile radar for ${profile.name}`}
                      className="radar-chart"
                    >
                      {radarLevels.map((level) => {
                        const ringPoints = radarMetrics
                          .map((_, metricIndex) => {
                            const point = radarPoint(
                              metricIndex,
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
                            key={`ring-${profile.code}-${level}`}
                            points={ringPoints}
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                          />
                        )
                      })}

                      {radarMetrics.map((metric, metricIndex) => {
                        const end = radarPoint(
                          metricIndex,
                          radarMetrics.length,
                          100,
                          radarCenter,
                          radarCenter,
                          radarRadius,
                        )
                        const labelPos = radarPoint(
                          metricIndex,
                          radarMetrics.length,
                          100,
                          radarCenter,
                          radarCenter,
                          radarRadius + 24,
                        )
                        const angle = -Math.PI / 2 + (metricIndex / radarMetrics.length) * Math.PI * 2
                        const textAnchor =
                          Math.abs(Math.cos(angle)) < 0.15 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
                        return (
                          <g key={`axis-${profile.code}-${metricIndex}`}>
                            <line
                              x1={radarCenter}
                              y1={radarCenter}
                              x2={end.x}
                              y2={end.y}
                              stroke="rgba(255,255,255,0.08)"
                              strokeWidth="1"
                            />
                            <text
                              x={labelPos.x}
                              y={labelPos.y}
                              textAnchor={textAnchor}
                              dominantBaseline="middle"
                              fill="rgba(255,255,255,0.5)"
                              fontSize="10"
                              fontFamily="Inter, system-ui, sans-serif"
                            >
                              {metric.label}
                            </text>
                          </g>
                        )
                      })}

                      <polygon
                        points={radarPolygonPoints}
                        fill="rgba(196, 153, 60, 0.2)"
                        stroke="rgba(196, 153, 60, 0.85)"
                        strokeWidth="1.5"
                      />

                      {radarMetrics.map((metric, metricIndex) => {
                        const pt = radarPoint(
                          metricIndex,
                          radarMetrics.length,
                          metric.value,
                          radarCenter,
                          radarCenter,
                          radarRadius,
                        )
                        return (
                          <circle
                            key={`dot-${profile.code}-${metricIndex}`}
                            cx={pt.x}
                            cy={pt.y}
                            r="3"
                            fill="rgba(196, 153, 60, 0.9)"
                          />
                        )
                      })}
                    </svg>

                    <div className="radar-legend">
                      {radarMetrics.map((metric) => (
                        <p key={`legend-${profile.code}-${metric.label}`}>
                          <span>{metric.label}</span>
                          <strong>{metric.value}</strong>
                        </p>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
            <p className="radar-note">
              Risk axes are displayed as risk intensity (higher value = higher risk).
            </p>
          </section>
        </>
      ) : viewMode === 'research' ? (
        <>
          <section className="research-hero">
            <div className="research-hero-text">
              <h2>AI Research Ensemble</h2>
              <p>
                Deploy 5 specialist AI analysts — macro-economist, regulatory analyst, deal execution specialist,
                geopolitical risk analyst, and sector specialist — to independently research any market.
                Each agent searches live data sources, synthesizes findings, and scores the opportunity.
                Results are aggregated into a consensus view with full source citations.
              </p>
            </div>
            <div className="research-hero-agents">
              <span className="agent-pip">Macro</span>
              <span className="agent-pip">Regulatory</span>
              <span className="agent-pip">Deal Exec</span>
              <span className="agent-pip">Geopolitical</span>
              <span className="agent-pip">Sector</span>
            </div>
          </section>

          <section className="research-trigger-panel">
            <p className="weights-title">New Research</p>
            <div className="backend-config">
              <label>
                Backend API URL
                <input
                  type="text"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder={DEFAULT_BACKEND_URL || 'https://your-backend.example.com'}
                />
              </label>
              <div className="backend-actions">
                <button type="button" className="scenario-btn" onClick={() => setBackendUrlInput('http://localhost:8787')}>
                  Use Localhost
                </button>
                {import.meta.env.VITE_STRATA_BACKEND_URL ? (
                  <button
                    type="button"
                    className="scenario-btn"
                    onClick={() => setBackendUrlInput(import.meta.env.VITE_STRATA_BACKEND_URL)}
                  >
                    Use Hosted Backend
                  </button>
                ) : null}
                <button type="button" className="scenario-btn" onClick={saveBackendUrl}>
                  Save & Check
                </button>
                <p className={`backend-status backend-status-${backendStatus}`}>
                  {backendStatus === 'online'
                    ? `Connected (${backendBaseUrl})`
                    : backendStatus === 'checking'
                      ? 'Checking backend...'
                      : backendStatus === 'offline'
                        ? `Not reachable (${backendBaseUrl})`
                        : backendBaseUrl
                          ? 'Connection not checked yet'
                          : 'No backend URL configured'}
                </p>
              </div>
            </div>
            <p className="prompt-subtitle">Describe your deal thesis, research question, or investment focus. The AI analysts will use this as context for their research.</p>
            <label>
              Research prompt
              <textarea
                className="research-prompt-input"
                value={researchPrompt}
                onChange={(e) => setResearchPrompt(e.target.value)}
                placeholder="e.g. We're a $3B buyout fund evaluating industrial automation platforms in Germany. Key concerns: post-acquisition integration complexity, works council dynamics, and whether the Mittelstand succession pipeline is real or overhyped. We need current data on deal flow, leverage availability, and exit multiples for mid-market industrial tech."
              />
            </label>
            <div className="research-trigger-grid">
              <label>
                Market
                <select value={researchCountry} onChange={(e) => setResearchCountry(e.target.value)}>
                  {countryProfiles.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </label>
              <label>
                Sector
                <select value={researchSector} onChange={(e) => setResearchSector(e.target.value)}>
                  {supportedSectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Strategy
                <select value={researchStrategy} onChange={(e) => setResearchStrategy(e.target.value as Strategy)}>
                  {strategies.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="research-trigger-action">
                <button
                  type="button"
                  className="research-run-btn"
                  onClick={triggerResearch}
                  disabled={researchStatus === 'running'}
                >
                  {researchStatus === 'running' ? 'Agents working...' : 'Deploy Research Ensemble'}
                </button>
              </div>
            </div>
            {researchStatus === 'running' && (
              <div className="research-progress">
                <div className="research-progress-bar" />
                <p className="research-status-text">5 AI analyst agents researching in parallel — this typically takes 2-4 minutes...</p>
              </div>
            )}
            {researchStatus === 'failed' && (
              <p className="research-status-text research-error">
                Research failed. {researchError ?? `Ensure backend is reachable at ${backendBaseUrl || 'your configured backend URL'}.`} For local use run
                {' '}`npm run backend`.
              </p>
            )}
            {researchStatus === 'completed' && !selectedResearch && (
              <p className="research-status-text research-success">Research complete. Select a result below to view the full report.</p>
            )}
            {researchStatus === 'canceled' && (
              <p className="research-status-text">Research was canceled.</p>
            )}
            <div className="research-batch-section">
              <p className="batch-label">Or scan multiple markets at once:</p>
              <div className="batch-actions">
                <button
                  type="button"
                  className="scenario-btn"
                  disabled={batchStatus.running}
                  onClick={() => triggerBatchScan(ranked.slice(0, 5).map((c) => c.code))}
                >
                  Top 5 Markets
                </button>
                <button
                  type="button"
                  className="scenario-btn"
                  disabled={batchStatus.running}
                  onClick={() => triggerBatchScan(ranked.slice(0, 10).map((c) => c.code))}
                >
                  Top 10 Markets
                </button>
                <button
                  type="button"
                  className="scenario-btn"
                  disabled={batchStatus.running}
                  onClick={() => triggerBatchScan(countryProfiles.map((c) => c.code))}
                >
                  All {countryProfiles.length} Markets
                </button>
              </div>
              {batchStatus.running && (
                <div className="research-progress">
                  <div className="research-progress-bar" />
                  <p className="research-status-text">
                    Batch scan: {batchStatus.completed}/{batchStatus.total} markets complete...
                  </p>
                </div>
              )}
            </div>
          </section>

          {selectedResearch ? (
            <>
              <section className="research-aggregate-panel">
                <button type="button" className="detail-toggle" onClick={() => setSelectedResearch(null)}>
                  \u2190 All results
                </button>
                <div className="research-aggregate-header">
                  <div className="aggregate-left">
                    <p className="eyebrow">Ensemble Research Report</p>
                    <h3>{selectedResearch.country} \u00B7 {selectedResearch.sector}</h3>
                    <p className="prompt-subtitle">
                      {selectedResearch.strategy} \u00B7 {new Date(selectedResearch.runAt).toLocaleDateString()} \u00B7 {selectedResearch.verdicts.length} analysts
                    </p>
                    {selectedResearch.prompt && (
                      <p className="research-prompt-display">\u201C{selectedResearch.prompt}\u201D</p>
                    )}
                  </div>
                  <div className="aggregate-score-block">
                    <p className="aggregate-score">{selectedResearch.aggregateScore}</p>
                    <p className={badgeClass(selectedResearch.aggregateRecommendation)}>
                      {selectedResearch.aggregateRecommendation}
                    </p>
                    <p className={`research-consensus consensus-${selectedResearch.consensus}`}>
                      {selectedResearch.consensus} consensus
                    </p>
                    <p className="meta">Confidence {Math.round(selectedResearch.aggregateConfidence * 100)}%</p>
                  </div>
                </div>
                <div className="analyst-score-strip">
                  {selectedResearch.verdicts.map((v) => (
                    <div key={v.persona} className="analyst-score-pip">
                      <span className="analyst-pip-label">{personaLabel(v.persona).split(' ').map(w => w[0]).join('')}</span>
                      <span className="analyst-pip-bar">
                        <span className="analyst-pip-fill" style={{ width: `${v.score}%` }} />
                      </span>
                      <span className="analyst-pip-score">{v.score}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="research-verdicts-grid">
                {selectedResearch.verdicts.map((v) => {
                  const sectionCounts = {
                    risks: v.keyRisks.length,
                    opportunities: v.keyOpportunities.length,
                    data: v.dataPoints.length,
                    sources: v.sources.length,
                  }
                  return (
                    <article key={v.persona} className="verdict-card">
                      <div className="verdict-header">
                        <div className="verdict-identity">
                          <p className="verdict-persona">{personaLabel(v.persona)}</p>
                          <div className="verdict-confidence-bar">
                            <div className="verdict-confidence-fill" style={{ width: `${Math.round(v.confidence * 100)}%` }} />
                          </div>
                          <p className="verdict-confidence-label">{Math.round(v.confidence * 100)}% confidence</p>
                        </div>
                        <div className="verdict-score-block">
                          <p className="verdict-score">{v.score}</p>
                          <p className={badgeClass(v.recommendation)}>{v.recommendation}</p>
                        </div>
                      </div>

                      <div className="verdict-narrative">
                        <p>{v.narrative}</p>
                      </div>

                      <div className="verdict-sections">
                        {sectionCounts.risks > 0 && (
                          <div className={`verdict-accordion ${isVerdictSectionOpen(v.persona, 'risks') ? 'is-open' : ''}`}>
                            <button type="button" className="verdict-accordion-trigger" onClick={() => toggleVerdictSection(v.persona, 'risks')}>
                              <span className="verdict-accordion-icon">{isVerdictSectionOpen(v.persona, 'risks') ? '\u2212' : '+'}</span>
                              <span>Key Risks</span>
                              <span className="verdict-count">{sectionCounts.risks}</span>
                            </button>
                            {isVerdictSectionOpen(v.persona, 'risks') && (
                              <ul className="verdict-accordion-body">
                                {v.keyRisks.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            )}
                          </div>
                        )}
                        {sectionCounts.opportunities > 0 && (
                          <div className={`verdict-accordion ${isVerdictSectionOpen(v.persona, 'opps') ? 'is-open' : ''}`}>
                            <button type="button" className="verdict-accordion-trigger" onClick={() => toggleVerdictSection(v.persona, 'opps')}>
                              <span className="verdict-accordion-icon">{isVerdictSectionOpen(v.persona, 'opps') ? '\u2212' : '+'}</span>
                              <span>Key Opportunities</span>
                              <span className="verdict-count">{sectionCounts.opportunities}</span>
                            </button>
                            {isVerdictSectionOpen(v.persona, 'opps') && (
                              <ul className="verdict-accordion-body">
                                {v.keyOpportunities.map((o, i) => <li key={i}>{o}</li>)}
                              </ul>
                            )}
                          </div>
                        )}
                        {sectionCounts.data > 0 && (
                          <div className={`verdict-accordion ${isVerdictSectionOpen(v.persona, 'data') ? 'is-open' : ''}`}>
                            <button type="button" className="verdict-accordion-trigger" onClick={() => toggleVerdictSection(v.persona, 'data')}>
                              <span className="verdict-accordion-icon">{isVerdictSectionOpen(v.persona, 'data') ? '\u2212' : '+'}</span>
                              <span>Data Points</span>
                              <span className="verdict-count">{sectionCounts.data}</span>
                            </button>
                            {isVerdictSectionOpen(v.persona, 'data') && (
                              <div className="verdict-accordion-body data-points-grid">
                                {v.dataPoints.map((d, i) => (
                                  <div key={i} className="data-point-chip">
                                    <p className="data-point-label">{d.label}</p>
                                    <p className="data-point-value">{d.value}</p>
                                    <p className="data-point-meta">{d.source} · {d.asOf}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {sectionCounts.sources > 0 && (
                          <div className={`verdict-accordion ${isVerdictSectionOpen(v.persona, 'sources') ? 'is-open' : ''}`}>
                            <button type="button" className="verdict-accordion-trigger" onClick={() => toggleVerdictSection(v.persona, 'sources')}>
                              <span className="verdict-accordion-icon">{isVerdictSectionOpen(v.persona, 'sources') ? '\u2212' : '+'}</span>
                              <span>Sources</span>
                              <span className="verdict-count">{sectionCounts.sources}</span>
                            </button>
                            {isVerdictSectionOpen(v.persona, 'sources') && (
                              <ul className="verdict-accordion-body verdict-sources">
                                {v.sources.map((s, i) => (
                                  <li key={i}>
                                    <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                                    <span className="verdict-source-relevance">{s.relevance}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </section>
            </>
          ) : (
            <>
              <section className="grid-header research-results-header">
                <h3>Research Results</h3>
                <p>Completed ensemble analyses from AI research agents.</p>
              </section>
              {researchResults.length === 0 ? (
                <p className="prompt-subtitle research-empty-state">
                  No research results yet. Run your first analysis above.
                </p>
              ) : (
                <section className="research-results-list">
                  {researchResults.map((r, i) => (
                    <article
                      key={i}
                      className="result-card"
                      onClick={() => setSelectedResearch(r)}
                    >
                      <div className="result-card-header">
                        <div className="result-card-left">
                          <p className="result-card-code">{r.countryCode}</p>
                          <div>
                            <h4 className="result-card-country">{r.country}</h4>
                            <p className="result-card-meta">{r.sector} \u00B7 {r.strategy}</p>
                          </div>
                        </div>
                        <div className="result-card-score-block">
                          <p className="result-card-score">{r.aggregateScore}</p>
                          <p className={badgeClass(r.aggregateRecommendation)}>{r.aggregateRecommendation}</p>
                        </div>
                      </div>
                      <div className="result-card-footer">
                        <p className={`research-consensus consensus-${r.consensus}`}>{r.consensus} consensus</p>
                        <p className="result-card-date">{new Date(r.runAt).toLocaleDateString()}</p>
                        <p className="result-card-analysts">{r.verdicts.length} analysts</p>
                      </div>
                      <div className="result-card-score-bar">
                        <div className="result-card-score-fill" style={{ width: `${r.aggregateScore}%` }} />
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </>
      ) : null}
    </main>
  )
}

export default App
