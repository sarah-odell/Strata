import {
  indicatorFactorOverrides,
  indicatorOverridesGeneratedAt,
  liveFactorConfidence,
} from './indicatorOverrides'

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
  factorDataQuality: Record<
    FactorKey,
    {
      lastRefreshed: string
      confidence: number
    }
  >
}

export const supportedSectors = [
  'Professional Services',
  'Healthcare Services',
  'Industrial Technology',
  'Aerospace & Defense',
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
  ES: { label: 'Bank of Spain publications', url: 'https://www.bde.es/wbe/en/noticias-eventos/notas-prensa/', lastChecked: asOfDate },
  IT: { label: 'Banca d’Italia publications', url: 'https://www.bancaditalia.it/media/notizia/index.html?com.dotmarketing.htmlpage.language=1', lastChecked: asOfDate },
  KR: { label: 'Bank of Korea publications', url: 'https://www.bok.or.kr/eng/bbs/E0000634/list.do?menuNo=400069', lastChecked: asOfDate },
  SA: { label: 'Saudi Central Bank publications', url: 'https://www.sama.gov.sa/en-US/News/Pages/default.aspx', lastChecked: asOfDate },
  SE: { label: 'Sveriges Riksbank publications', url: 'https://www.riksbank.se/en-gb/press-and-published/', lastChecked: asOfDate },
  PL: { label: 'National Bank of Poland publications', url: 'https://www.nbp.pl/home.aspx?f=/en/onbp/news.html', lastChecked: asOfDate },
  ID: { label: 'Bank Indonesia publications', url: 'https://www.bi.go.id/en/publikasi/ruang-media/news-release/default.aspx', lastChecked: asOfDate },
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

const baseProfiles: Omit<CountryProfile, 'factorCitations' | 'sources' | 'factorDataQuality'>[] = [
  {
    code: 'US',
    name: 'United States',
    region: 'North America',
    sectorFit: { 'Professional Services': 86, 'Healthcare Services': 88, 'Industrial Technology': 82, 'Aerospace & Defense': 90 },
    factors: { economicStrength: 87, regulatoryComplexity: 54, taxTariffFriction: 47, geopoliticalRisk: 38, dealExecutionRisk: 41 },
    notes: 'Deep capital markets and strong demand profile; fragmentation across federal/state regimes increases compliance effort.',
    confidence: 0.84,
    lastUpdated: asOfDate,
  },
  {
    code: 'DE',
    name: 'Germany',
    region: 'Europe',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 81, 'Industrial Technology': 89, 'Aerospace & Defense': 85 },
    factors: { economicStrength: 79, regulatoryComplexity: 63, taxTariffFriction: 56, geopoliticalRisk: 42, dealExecutionRisk: 49 },
    notes: 'High industrial depth and rule-of-law quality; EU and local compliance layers can extend time-to-close.',
    confidence: 0.83,
    lastUpdated: asOfDate,
  },
  {
    code: 'SG',
    name: 'Singapore',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 84, 'Healthcare Services': 75, 'Industrial Technology': 80, 'Aerospace & Defense': 67 },
    factors: { economicStrength: 82, regulatoryComplexity: 39, taxTariffFriction: 33, geopoliticalRisk: 44, dealExecutionRisk: 36 },
    notes: 'Efficient regulatory regime and low friction tax environment; external trade dependency raises spillover sensitivity.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'CA',
    name: 'Canada',
    region: 'North America',
    sectorFit: { 'Professional Services': 79, 'Healthcare Services': 77, 'Industrial Technology': 74, 'Aerospace & Defense': 75 },
    factors: { economicStrength: 76, regulatoryComplexity: 52, taxTariffFriction: 48, geopoliticalRisk: 32, dealExecutionRisk: 43 },
    notes: 'Stable policy baseline and close US integration; provincial differences require localized operating models.',
    confidence: 0.79,
    lastUpdated: asOfDate,
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    region: 'Middle East',
    sectorFit: { 'Professional Services': 81, 'Healthcare Services': 73, 'Industrial Technology': 76, 'Aerospace & Defense': 80 },
    factors: { economicStrength: 74, regulatoryComplexity: 46, taxTariffFriction: 37, geopoliticalRisk: 57, dealExecutionRisk: 50 },
    notes: 'Attractive free-zone structures and pro-investment posture; regional geopolitical exposure requires scenario controls.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    region: 'Europe',
    sectorFit: { 'Professional Services': 85, 'Healthcare Services': 79, 'Industrial Technology': 77, 'Aerospace & Defense': 88 },
    factors: { economicStrength: 78, regulatoryComplexity: 58, taxTariffFriction: 52, geopoliticalRisk: 37, dealExecutionRisk: 45 },
    notes: 'Deep services base and mature PE ecosystem; post-Brexit compliance interfaces can add transactional friction.',
    confidence: 0.82,
    lastUpdated: asOfDate,
  },
  {
    code: 'FR',
    name: 'France',
    region: 'Europe',
    sectorFit: { 'Professional Services': 77, 'Healthcare Services': 82, 'Industrial Technology': 81, 'Aerospace & Defense': 84 },
    factors: { economicStrength: 77, regulatoryComplexity: 64, taxTariffFriction: 58, geopoliticalRisk: 40, dealExecutionRisk: 50 },
    notes: 'Large domestic market with strong healthcare and industrial assets; labor and administrative complexity can slow integration.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    region: 'Europe',
    sectorFit: { 'Professional Services': 82, 'Healthcare Services': 78, 'Industrial Technology': 83, 'Aerospace & Defense': 70 },
    factors: { economicStrength: 80, regulatoryComplexity: 55, taxTariffFriction: 49, geopoliticalRisk: 36, dealExecutionRisk: 44 },
    notes: 'Trade-oriented economy and strong logistics/tech base; EU-level and local compliance requirements still require careful structuring.',
    confidence: 0.81,
    lastUpdated: asOfDate,
  },
  {
    code: 'JP',
    name: 'Japan',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 75, 'Healthcare Services': 83, 'Industrial Technology': 88, 'Aerospace & Defense': 72 },
    factors: { economicStrength: 78, regulatoryComplexity: 60, taxTariffFriction: 54, geopoliticalRisk: 48, dealExecutionRisk: 52 },
    notes: 'High-quality industrial and healthcare ecosystems; demographic pressures and execution pace can affect value-creation timelines.',
    confidence: 0.79,
    lastUpdated: asOfDate,
  },
  {
    code: 'AU',
    name: 'Australia',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 80, 'Healthcare Services': 79, 'Industrial Technology': 76, 'Aerospace & Defense': 78 },
    factors: { economicStrength: 79, regulatoryComplexity: 51, taxTariffFriction: 50, geopoliticalRisk: 34, dealExecutionRisk: 42 },
    notes: 'Stable legal framework and transparent institutions; sector-specific review regimes can shape timing for foreign acquirers.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'IN',
    name: 'India',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 86, 'Healthcare Services': 74, 'Industrial Technology': 82, 'Aerospace & Defense': 82 },
    factors: { economicStrength: 84, regulatoryComplexity: 68, taxTariffFriction: 61, geopoliticalRisk: 52, dealExecutionRisk: 59 },
    notes: 'High growth potential and large domestic demand, with meaningful upside for services and tech; multi-layered compliance requires local execution depth.',
    confidence: 0.76,
    lastUpdated: asOfDate,
  },
  {
    code: 'BR',
    name: 'Brazil',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 76, 'Industrial Technology': 72, 'Aerospace & Defense': 68 },
    factors: { economicStrength: 71, regulatoryComplexity: 67, taxTariffFriction: 66, geopoliticalRisk: 45, dealExecutionRisk: 58 },
    notes: 'Scale market with broad sector opportunities; tax complexity and operational execution variability are primary diligence drivers.',
    confidence: 0.73,
    lastUpdated: asOfDate,
  },
  {
    code: 'MX',
    name: 'Mexico',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 77, 'Healthcare Services': 71, 'Industrial Technology': 79, 'Aerospace & Defense': 65 },
    factors: { economicStrength: 73, regulatoryComplexity: 62, taxTariffFriction: 57, geopoliticalRisk: 49, dealExecutionRisk: 56 },
    notes: 'Strong nearshoring relevance and US value-chain connectivity; security, policy, and enforcement variance must be underwritten explicitly.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'ES',
    name: 'Spain',
    region: 'Europe',
    sectorFit: { 'Professional Services': 79, 'Healthcare Services': 78, 'Industrial Technology': 76, 'Aerospace & Defense': 80 },
    factors: { economicStrength: 75, regulatoryComplexity: 59, taxTariffFriction: 55, geopoliticalRisk: 37, dealExecutionRisk: 47 },
    notes: 'Large EU market with improving industrial and services momentum; regional policy and labor dynamics require careful structuring.',
    confidence: 0.78,
    lastUpdated: asOfDate,
  },
  {
    code: 'IT',
    name: 'Italy',
    region: 'Europe',
    sectorFit: { 'Professional Services': 76, 'Healthcare Services': 79, 'Industrial Technology': 82, 'Aerospace & Defense': 83 },
    factors: { economicStrength: 72, regulatoryComplexity: 62, taxTariffFriction: 60, geopoliticalRisk: 39, dealExecutionRisk: 52 },
    notes: 'Strong advanced manufacturing footprint and attractive mid-market assets; administrative complexity and timeline risk need active management.',
    confidence: 0.77,
    lastUpdated: asOfDate,
  },
  {
    code: 'KR',
    name: 'South Korea',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 80, 'Industrial Technology': 90, 'Aerospace & Defense': 81 },
    factors: { economicStrength: 81, regulatoryComplexity: 57, taxTariffFriction: 52, geopoliticalRisk: 58, dealExecutionRisk: 50 },
    notes: 'High-tech industrial strength and robust innovation ecosystem; geopolitical exposure elevates downside-case planning requirements.',
    confidence: 0.8,
    lastUpdated: asOfDate,
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    region: 'Middle East',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 72, 'Industrial Technology': 75, 'Aerospace & Defense': 86 },
    factors: { economicStrength: 77, regulatoryComplexity: 53, taxTariffFriction: 44, geopoliticalRisk: 62, dealExecutionRisk: 54 },
    notes: 'Large-scale transformation programs and capital deployment create opportunity; geopolitical and execution dependencies require robust controls.',
    confidence: 0.75,
    lastUpdated: asOfDate,
  },
  {
    code: 'SE',
    name: 'Sweden',
    region: 'Europe',
    sectorFit: { 'Professional Services': 81, 'Healthcare Services': 80, 'Industrial Technology': 84, 'Aerospace & Defense': 76 },
    factors: { economicStrength: 78, regulatoryComplexity: 50, taxTariffFriction: 48, geopoliticalRisk: 35, dealExecutionRisk: 43 },
    notes: 'High institutional quality and strong digital/industrial capability; market size constraints favor focused expansion theses.',
    confidence: 0.81,
    lastUpdated: asOfDate,
  },
  {
    code: 'PL',
    name: 'Poland',
    region: 'Europe',
    sectorFit: { 'Professional Services': 75, 'Healthcare Services': 73, 'Industrial Technology': 78, 'Aerospace & Defense': 79 },
    factors: { economicStrength: 76, regulatoryComplexity: 58, taxTariffFriction: 53, geopoliticalRisk: 51, dealExecutionRisk: 49 },
    notes: 'Compelling nearshoring and industrial supply-chain relevance; legal and geopolitical sensitivity require explicit diligence overlays.',
    confidence: 0.77,
    lastUpdated: asOfDate,
  },
  {
    code: 'ID',
    name: 'Indonesia',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 79, 'Healthcare Services': 70, 'Industrial Technology': 74, 'Aerospace & Defense': 66 },
    factors: { economicStrength: 80, regulatoryComplexity: 65, taxTariffFriction: 59, geopoliticalRisk: 47, dealExecutionRisk: 57 },
    notes: 'Large domestic demand and favorable growth trajectory; regulatory heterogeneity and execution complexity require strong local partnerships.',
    confidence: 0.75,
    lastUpdated: asOfDate,
  },
]

const withOverrides = (
  profile: Omit<CountryProfile, 'factorCitations' | 'sources' | 'factorDataQuality'>,
): CountryProfile => {
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

  const factorDataQuality: CountryProfile['factorDataQuality'] = {
    economicStrength: {
      lastRefreshed: indicatorOverridesGeneratedAt,
      confidence: liveFactorConfidence.economicStrength ?? 0.8,
    },
    taxTariffFriction: {
      lastRefreshed: indicatorOverridesGeneratedAt,
      confidence: liveFactorConfidence.taxTariffFriction ?? 0.78,
    },
    regulatoryComplexity: {
      lastRefreshed: asOfDate,
      confidence: 0.68,
    },
    geopoliticalRisk: {
      lastRefreshed: asOfDate,
      confidence: 0.65,
    },
    dealExecutionRisk: {
      lastRefreshed: asOfDate,
      confidence: 0.67,
    },
  }

  return {
    ...profile,
    factors,
    sources,
    factorCitations: factorCitationsFor(profile.code),
    factorDataQuality,
  }
}

export const countryProfiles: CountryProfile[] = baseProfiles.map(withOverrides)
