import { indicatorFactorOverrides } from './indicatorOverrides'

export type FactorKey =
  | 'economicStrength'
  | 'regulatoryComplexity'
  | 'taxTariffFriction'
  | 'geopoliticalRisk'
  | 'dealExecutionRisk'

export type Citation = {
  label: string
  url: string
  lastChecked: string
}

export type CountryProfile = {
  code: string
  name: string
  region: string
  sectorFit: Record<string, number>
  factors: Record<FactorKey, number>
  notes: string
  confidence: number
  lastUpdated: string
  sources: Citation[]
  factorCitations: Record<FactorKey, Citation[]>
}

export const supportedSectors = [
  'Professional Services',
  'Healthcare Services',
  'Industrial Technology',
] as const

const asOfDate = '2026-03-07'

const globalSources = {
  imf: { label: 'IMF DataMapper', url: 'https://www.imf.org/external/datamapper/' },
  wb: { label: 'World Bank Data API', url: 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589' },
  oecd: { label: 'OECD Data', url: 'https://data.oecd.org/' },
}

const countryInstitutionLinks: Record<string, Citation> = {
  US: { label: 'US SEC / DOJ publications', url: 'https://www.sec.gov/news/pressreleases', lastChecked: asOfDate },
  DE: { label: 'BaFin and Bundesbank publications', url: 'https://www.bafin.de/', lastChecked: asOfDate },
  SG: { label: 'MAS publications', url: 'https://www.mas.gov.sg/news', lastChecked: asOfDate },
  CA: { label: 'Bank of Canada publications', url: 'https://www.bankofcanada.ca/', lastChecked: asOfDate },
  AE: { label: 'UAE Central Bank publications', url: 'https://www.centralbank.ae/en/', lastChecked: asOfDate },
  GB: { label: 'Bank of England and CMA updates', url: 'https://www.bankofengland.co.uk/news', lastChecked: asOfDate },
  FR: { label: 'Banque de France publications', url: 'https://www.banque-france.fr/en', lastChecked: asOfDate },
  NL: { label: 'De Nederlandsche Bank publications', url: 'https://www.dnb.nl/en/news/', lastChecked: asOfDate },
  JP: { label: 'Bank of Japan publications', url: 'https://www.boj.or.jp/en/announcements/', lastChecked: asOfDate },
  AU: { label: 'Reserve Bank of Australia updates', url: 'https://www.rba.gov.au/media-releases/', lastChecked: asOfDate },
  IN: { label: 'Reserve Bank of India publications', url: 'https://www.rbi.org.in/', lastChecked: asOfDate },
  BR: { label: 'Banco Central do Brasil updates', url: 'https://www.bcb.gov.br/en/pressdetail', lastChecked: asOfDate },
  MX: { label: 'Banco de México publications', url: 'https://www.banxico.org.mx/publications-and-press/', lastChecked: asOfDate },
}

const mkCitation = (label: string, url: string): Citation => ({
  label,
  url,
  lastChecked: asOfDate,
})

const factorCitationsFor = (countryCode: string): Record<FactorKey, Citation[]> => {
  const countryInstitution = countryInstitutionLinks[countryCode]

  return {
    economicStrength: [
      mkCitation(globalSources.imf.label, globalSources.imf.url),
      mkCitation(globalSources.wb.label, globalSources.wb.url),
    ],
    regulatoryComplexity: [
      mkCitation(globalSources.oecd.label, globalSources.oecd.url),
      countryInstitution,
    ],
    taxTariffFriction: [
      mkCitation(globalSources.oecd.label, globalSources.oecd.url),
      mkCitation(globalSources.wb.label, globalSources.wb.url),
    ],
    geopoliticalRisk: [
      mkCitation(globalSources.imf.label, globalSources.imf.url),
      countryInstitution,
    ],
    dealExecutionRisk: [countryInstitution, mkCitation(globalSources.oecd.label, globalSources.oecd.url)],
  }
}

const baseProfiles: Omit<CountryProfile, 'factorCitations' | 'sources'>[] = [
  {
    code: 'US',
    name: 'United States',
    region: 'North America',
    sectorFit: { 'Professional Services': 86, 'Healthcare Services': 88, 'Industrial Technology': 82 },
    factors: { economicStrength: 87, regulatoryComplexity: 54, taxTariffFriction: 47, geopoliticalRisk: 38, dealExecutionRisk: 41 },
    notes: 'Deep capital markets and strong demand profile; fragmentation across federal/state regimes increases compliance effort.',
    confidence: 0.84,
    lastUpdated: asOfDate,
  },
  {
    code: 'DE',
    name: 'Germany',
    region: 'Europe',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 81, 'Industrial Technology': 89 },
    factors: { economicStrength: 79, regulatoryComplexity: 63, taxTariffFriction: 56, geopoliticalRisk: 42, dealExecutionRisk: 49 },
    notes: 'High industrial depth and rule-of-law quality; EU and local compliance layers can extend time-to-close.',
    confidence: 0.83,
    lastUpdated: asOfDate,
  },
  {
    code: 'SG',
    name: 'Singapore',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 84, 'Healthcare Services': 75, 'Industrial Technology': 80 },
    factors: { economicStrength: 82, regulatoryComplexity: 39, taxTariffFriction: 33, geopoliticalRisk: 44, dealExecutionRisk: 36 },
    notes: 'Efficient regulatory regime and low friction tax environment; external trade dependency raises spillover sensitivity.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'CA',
    name: 'Canada',
    region: 'North America',
    sectorFit: { 'Professional Services': 79, 'Healthcare Services': 77, 'Industrial Technology': 74 },
    factors: { economicStrength: 76, regulatoryComplexity: 52, taxTariffFriction: 48, geopoliticalRisk: 32, dealExecutionRisk: 43 },
    notes: 'Stable policy baseline and close US integration; provincial differences require localized operating models.',
    confidence: 0.79,
    lastUpdated: asOfDate,
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    region: 'Middle East',
    sectorFit: { 'Professional Services': 81, 'Healthcare Services': 73, 'Industrial Technology': 76 },
    factors: { economicStrength: 74, regulatoryComplexity: 46, taxTariffFriction: 37, geopoliticalRisk: 57, dealExecutionRisk: 50 },
    notes: 'Attractive free-zone structures and pro-investment posture; regional geopolitical exposure requires scenario controls.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    region: 'Europe',
    sectorFit: { 'Professional Services': 85, 'Healthcare Services': 79, 'Industrial Technology': 77 },
    factors: { economicStrength: 78, regulatoryComplexity: 58, taxTariffFriction: 52, geopoliticalRisk: 37, dealExecutionRisk: 45 },
    notes: 'Deep services base and mature PE ecosystem; post-Brexit compliance interfaces can add transactional friction.',
    confidence: 0.82,
    lastUpdated: asOfDate,
  },
  {
    code: 'FR',
    name: 'France',
    region: 'Europe',
    sectorFit: { 'Professional Services': 77, 'Healthcare Services': 82, 'Industrial Technology': 81 },
    factors: { economicStrength: 77, regulatoryComplexity: 64, taxTariffFriction: 58, geopoliticalRisk: 40, dealExecutionRisk: 50 },
    notes: 'Large domestic market with strong healthcare and industrial assets; labor and administrative complexity can slow integration.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    region: 'Europe',
    sectorFit: { 'Professional Services': 82, 'Healthcare Services': 78, 'Industrial Technology': 83 },
    factors: { economicStrength: 80, regulatoryComplexity: 55, taxTariffFriction: 49, geopoliticalRisk: 36, dealExecutionRisk: 44 },
    notes: 'Trade-oriented economy and strong logistics/tech base; EU-level and local compliance requirements still require careful structuring.',
    confidence: 0.81,
    lastUpdated: asOfDate,
  },
  {
    code: 'JP',
    name: 'Japan',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 75, 'Healthcare Services': 83, 'Industrial Technology': 88 },
    factors: { economicStrength: 78, regulatoryComplexity: 60, taxTariffFriction: 54, geopoliticalRisk: 48, dealExecutionRisk: 52 },
    notes: 'High-quality industrial and healthcare ecosystems; demographic pressures and execution pace can affect value-creation timelines.',
    confidence: 0.79,
    lastUpdated: asOfDate,
  },
  {
    code: 'AU',
    name: 'Australia',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 80, 'Healthcare Services': 79, 'Industrial Technology': 76 },
    factors: { economicStrength: 79, regulatoryComplexity: 51, taxTariffFriction: 50, geopoliticalRisk: 34, dealExecutionRisk: 42 },
    notes: 'Stable legal framework and transparent institutions; sector-specific review regimes can shape timing for foreign acquirers.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'IN',
    name: 'India',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 86, 'Healthcare Services': 74, 'Industrial Technology': 82 },
    factors: { economicStrength: 84, regulatoryComplexity: 68, taxTariffFriction: 61, geopoliticalRisk: 52, dealExecutionRisk: 59 },
    notes: 'High growth potential and large domestic demand, with meaningful upside for services and tech; multi-layered compliance requires local execution depth.',
    confidence: 0.76,
    lastUpdated: asOfDate,
  },
  {
    code: 'BR',
    name: 'Brazil',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 76, 'Industrial Technology': 72 },
    factors: { economicStrength: 71, regulatoryComplexity: 67, taxTariffFriction: 66, geopoliticalRisk: 45, dealExecutionRisk: 58 },
    notes: 'Scale market with broad sector opportunities; tax complexity and operational execution variability are primary diligence drivers.',
    confidence: 0.73,
    lastUpdated: asOfDate,
  },
  {
    code: 'MX',
    name: 'Mexico',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 77, 'Healthcare Services': 71, 'Industrial Technology': 79 },
    factors: { economicStrength: 73, regulatoryComplexity: 62, taxTariffFriction: 57, geopoliticalRisk: 49, dealExecutionRisk: 56 },
    notes: 'Strong nearshoring relevance and US value-chain connectivity; security, policy, and enforcement variance must be underwritten explicitly.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
]

const withOverrides = (profile: Omit<CountryProfile, 'factorCitations' | 'sources'>): CountryProfile => {
  const override = indicatorFactorOverrides[profile.code] ?? {}
  const factors: Record<FactorKey, number> = {
    ...profile.factors,
    ...override,
  }

  const sources = [
    mkCitation(globalSources.imf.label, globalSources.imf.url),
    mkCitation(globalSources.wb.label, globalSources.wb.url),
    mkCitation(globalSources.oecd.label, globalSources.oecd.url),
    countryInstitutionLinks[profile.code],
  ]

  return {
    ...profile,
    factors,
    sources,
    factorCitations: factorCitationsFor(profile.code),
  }
}

export const countryProfiles: CountryProfile[] = baseProfiles.map(withOverrides)
