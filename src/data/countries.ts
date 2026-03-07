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
  | 'marketSizeDepth'
  | 'marketGrowthMomentum'
  | 'marketConcentrationRisk'

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
      trendDirection: 'up' | 'down' | 'flat'
      delta: number
    }
  >
}

export const supportedSectors = [
  'Professional Services',
  'Healthcare Services',
  'Industrial Technology',
  'Aerospace & Defense',
  'Software & Data Services',
  'Financial Services',
  'Energy & Infrastructure',
  'Consumer & Retail',
  'Logistics & Transportation',
  'Education & Training',
  'Real Estate & Built Environment',
  'Food & Agriculture',
] as const

const asOfDate = '2026-03-07'

const globalSources = {
  imf: { label: 'IMF DataMapper', url: 'https://www.imf.org/external/datamapper/' },
  wb: { label: 'World Bank Data API', url: 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589' },
  oecd: { label: 'OECD Data', url: 'https://data.oecd.org/' },
  wbGdp: { label: 'World Bank GDP (current US$)', url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD' },
  wbPopulation: { label: 'World Bank Population, total', url: 'https://data.worldbank.org/indicator/SP.POP.TOTL' },
  wbPrivateCredit: {
    label: 'World Bank Domestic credit to private sector by banks (% of GDP)',
    url: 'https://data.worldbank.org/indicator/FD.AST.PRVT.GD.ZS',
  },
  wbGdpGrowth: { label: 'World Bank GDP growth (annual %)', url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG' },
  wbGdpPerCapitaGrowth: {
    label: 'World Bank GDP per capita growth (annual %)',
    url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.KD.ZG',
  },
  wbBankConcentration: {
    label: 'World Bank Bank concentration (%)',
    url: 'https://data.worldbank.org/indicator/GFDD.OI.01',
  },
  wbFiveBankConcentration: {
    label: 'World Bank 5-bank asset concentration',
    url: 'https://data.worldbank.org/indicator/GFDD.OI.06',
  },
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
  CH: { label: 'Swiss National Bank publications', url: 'https://www.snb.ch/en/', lastChecked: asOfDate },
  DK: { label: 'Danmarks Nationalbank publications', url: 'https://www.nationalbanken.dk/en', lastChecked: asOfDate },
  NO: { label: 'Norges Bank publications', url: 'https://www.norges-bank.no/en/', lastChecked: asOfDate },
  FI: { label: 'Bank of Finland publications', url: 'https://www.bof.fi/en/', lastChecked: asOfDate },
  IE: { label: 'Central Bank of Ireland publications', url: 'https://www.centralbank.ie/', lastChecked: asOfDate },
  AT: { label: 'Austrian National Bank publications', url: 'https://www.oenb.at/en/', lastChecked: asOfDate },
  BE: { label: 'National Bank of Belgium publications', url: 'https://www.nbb.be/en', lastChecked: asOfDate },
  CZ: { label: 'Czech National Bank publications', url: 'https://www.cnb.cz/en/', lastChecked: asOfDate },
  PT: { label: 'Banco de Portugal publications', url: 'https://www.bportugal.pt/en', lastChecked: asOfDate },
  GR: { label: 'Bank of Greece publications', url: 'https://www.bankofgreece.gr/en/homepage', lastChecked: asOfDate },
  HU: { label: 'Magyar Nemzeti Bank publications', url: 'https://www.mnb.hu/en', lastChecked: asOfDate },
  TR: { label: 'Central Bank of Turkey publications', url: 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/', lastChecked: asOfDate },
  RO: { label: 'National Bank of Romania publications', url: 'https://www.bnr.ro/Home.aspx', lastChecked: asOfDate },
  CN: { label: "People's Bank of China publications", url: 'http://www.pbc.gov.cn/en/3688006/index.html', lastChecked: asOfDate },
  HK: { label: 'Hong Kong Monetary Authority publications', url: 'https://www.hkma.gov.hk/', lastChecked: asOfDate },
  TW: { label: 'Central Bank of Taiwan publications', url: 'https://www.cbc.gov.tw/en/', lastChecked: asOfDate },
  VN: { label: 'State Bank of Vietnam publications', url: 'https://www.sbv.gov.vn/webcenter/portal/en/home', lastChecked: asOfDate },
  TH: { label: 'Bank of Thailand publications', url: 'https://www.bot.or.th/en/homepage.html', lastChecked: asOfDate },
  PH: { label: 'Bangko Sentral ng Pilipinas publications', url: 'https://www.bsp.gov.ph/', lastChecked: asOfDate },
  MY: { label: 'Bank Negara Malaysia publications', url: 'https://www.bnm.gov.my/', lastChecked: asOfDate },
  NZ: { label: 'Reserve Bank of New Zealand publications', url: 'https://www.rbnz.govt.nz/', lastChecked: asOfDate },
  IL: { label: 'Bank of Israel publications', url: 'https://www.boi.org.il/en/', lastChecked: asOfDate },
  QA: { label: 'Qatar Central Bank publications', url: 'https://www.qcb.gov.qa/English/Pages/default.aspx', lastChecked: asOfDate },
  ZA: { label: 'South African Reserve Bank publications', url: 'https://www.resbank.co.za/', lastChecked: asOfDate },
  NG: { label: 'Central Bank of Nigeria publications', url: 'https://www.cbn.gov.ng/', lastChecked: asOfDate },
  EG: { label: 'Central Bank of Egypt publications', url: 'https://www.cbe.org.eg/en', lastChecked: asOfDate },
  KE: { label: 'Central Bank of Kenya publications', url: 'https://www.centralbank.go.ke/', lastChecked: asOfDate },
  MA: { label: 'Bank Al-Maghrib publications', url: 'https://www.bkam.ma/en', lastChecked: asOfDate },
  CL: { label: 'Central Bank of Chile publications', url: 'https://www.bcentral.cl/en/web/banco-central-de-chile', lastChecked: asOfDate },
  CO: { label: 'Banco de la Republica publications', url: 'https://www.banrep.gov.co/en', lastChecked: asOfDate },
  AR: { label: 'Banco Central de Argentina publications', url: 'https://www.bcra.gob.ar/default_i.asp', lastChecked: asOfDate },
  PE: { label: 'Banco Central de Reserva del Peru publications', url: 'https://www.bcrp.gob.pe/en', lastChecked: asOfDate },
  CR: { label: 'Banco Central de Costa Rica publications', url: 'https://www.bccr.fi.cr/', lastChecked: asOfDate },
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
    marketSizeDepth: [
      mkCitation(globalSources.wbGdp.label, globalSources.wbGdp.url),
      mkCitation(globalSources.wbPopulation.label, globalSources.wbPopulation.url),
      mkCitation(globalSources.wbPrivateCredit.label, globalSources.wbPrivateCredit.url),
    ],
    marketGrowthMomentum: [
      mkCitation(globalSources.imf.label, globalSources.imf.url),
      mkCitation(globalSources.wbGdpGrowth.label, globalSources.wbGdpGrowth.url),
      mkCitation(globalSources.wbGdpPerCapitaGrowth.label, globalSources.wbGdpPerCapitaGrowth.url),
    ],
    marketConcentrationRisk: [
      mkCitation(globalSources.wbBankConcentration.label, globalSources.wbBankConcentration.url),
      mkCitation(globalSources.wbFiveBankConcentration.label, globalSources.wbFiveBankConcentration.url),
      countryInstitution,
    ],
  }
}

type BaseCountryProfile = Omit<CountryProfile, 'factorCitations' | 'sources' | 'factorDataQuality' | 'factors'> & {
  factors: Partial<Record<FactorKey, number>>
}

const baseProfiles: BaseCountryProfile[] = [
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
  {
    code: 'CH',
    name: 'Switzerland',
    region: 'Europe',
    sectorFit: { 'Professional Services': 83, 'Healthcare Services': 80, 'Industrial Technology': 85, 'Aerospace & Defense': 74 },
    factors: { economicStrength: 83, regulatoryComplexity: 48, taxTariffFriction: 40, geopoliticalRisk: 30, dealExecutionRisk: 38 },
    notes: 'World-class financial center and innovation hub; high cost base and cantonal regulatory complexity require precise market-entry structuring.',
    confidence: 0.82,
    lastUpdated: asOfDate,
  },
  {
    code: 'DK',
    name: 'Denmark',
    region: 'Europe',
    sectorFit: { 'Professional Services': 80, 'Healthcare Services': 82, 'Industrial Technology': 81, 'Aerospace & Defense': 72 },
    factors: { economicStrength: 77, regulatoryComplexity: 47, taxTariffFriction: 51, geopoliticalRisk: 28, dealExecutionRisk: 40 },
    notes: 'Strong institutional quality and Scandinavian governance model; limited market scale favors focused sector theses.',
    confidence: 0.81,
    lastUpdated: asOfDate,
  },
  {
    code: 'NO',
    name: 'Norway',
    region: 'Europe',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 79, 'Industrial Technology': 77, 'Aerospace & Defense': 76 },
    factors: { economicStrength: 79, regulatoryComplexity: 50, taxTariffFriction: 53, geopoliticalRisk: 30, dealExecutionRisk: 42 },
    notes: 'Oil-anchored economy with robust sovereign wealth; limited PE market depth and high labor costs shape deal economics.',
    confidence: 0.80,
    lastUpdated: asOfDate,
  },
  {
    code: 'FI',
    name: 'Finland',
    region: 'Europe',
    sectorFit: { 'Professional Services': 79, 'Healthcare Services': 78, 'Industrial Technology': 83, 'Aerospace & Defense': 73 },
    factors: { economicStrength: 76, regulatoryComplexity: 46, taxTariffFriction: 50, geopoliticalRisk: 38, dealExecutionRisk: 41 },
    notes: 'Strong technology and innovation ecosystem; Russia border proximity adds latent geopolitical sensitivity.',
    confidence: 0.80,
    lastUpdated: asOfDate,
  },
  {
    code: 'IE',
    name: 'Ireland',
    region: 'Europe',
    sectorFit: { 'Professional Services': 84, 'Healthcare Services': 77, 'Industrial Technology': 82, 'Aerospace & Defense': 70 },
    factors: { economicStrength: 82, regulatoryComplexity: 44, taxTariffFriction: 32, geopoliticalRisk: 26, dealExecutionRisk: 37 },
    notes: 'Tax-efficient EU gateway with deep tech and pharma presence; concentrated sector exposure and post-Brexit dynamics require monitoring.',
    confidence: 0.81,
    lastUpdated: asOfDate,
  },
  {
    code: 'AT',
    name: 'Austria',
    region: 'Europe',
    sectorFit: { 'Professional Services': 77, 'Healthcare Services': 79, 'Industrial Technology': 80, 'Aerospace & Defense': 74 },
    factors: { economicStrength: 76, regulatoryComplexity: 56, taxTariffFriction: 52, geopoliticalRisk: 32, dealExecutionRisk: 44 },
    notes: 'Central European hub with strong industrial SME base; EU compliance layers and limited PE market depth constrain deal velocity.',
    confidence: 0.79,
    lastUpdated: asOfDate,
  },
  {
    code: 'BE',
    name: 'Belgium',
    region: 'Europe',
    sectorFit: { 'Professional Services': 79, 'Healthcare Services': 80, 'Industrial Technology': 78, 'Aerospace & Defense': 73 },
    factors: { economicStrength: 74, regulatoryComplexity: 60, taxTariffFriction: 57, geopoliticalRisk: 30, dealExecutionRisk: 46 },
    notes: 'EU institutional hub with diversified economy; complex federal/regional governance structure and high tax burden increase execution friction.',
    confidence: 0.78,
    lastUpdated: asOfDate,
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    region: 'Europe',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 72, 'Industrial Technology': 79, 'Aerospace & Defense': 74 },
    factors: { economicStrength: 76, regulatoryComplexity: 54, taxTariffFriction: 48, geopoliticalRisk: 38, dealExecutionRisk: 46 },
    notes: 'Strong manufacturing base integrated into European supply chains; growing PE market with improving advisor ecosystem.',
    confidence: 0.77,
    lastUpdated: asOfDate,
  },
  {
    code: 'PT',
    name: 'Portugal',
    region: 'Europe',
    sectorFit: { 'Professional Services': 76, 'Healthcare Services': 75, 'Industrial Technology': 73, 'Aerospace & Defense': 67 },
    factors: { economicStrength: 73, regulatoryComplexity: 52, taxTariffFriction: 50, geopoliticalRisk: 28, dealExecutionRisk: 48 },
    notes: 'Attractive cost base and improving economic trajectory; tech hub growth attracting increasing PE attention.',
    confidence: 0.77,
    lastUpdated: asOfDate,
  },
  {
    code: 'GR',
    name: 'Greece',
    region: 'Europe',
    sectorFit: { 'Professional Services': 72, 'Healthcare Services': 74, 'Industrial Technology': 69, 'Aerospace & Defense': 68 },
    factors: { economicStrength: 68, regulatoryComplexity: 58, taxTariffFriction: 55, geopoliticalRisk: 40, dealExecutionRisk: 54 },
    notes: 'Post-crisis recovery with improving fundamentals; residual institutional complexity and limited market depth constrain larger deployments.',
    confidence: 0.73,
    lastUpdated: asOfDate,
  },
  {
    code: 'HU',
    name: 'Hungary',
    region: 'Europe',
    sectorFit: { 'Professional Services': 73, 'Healthcare Services': 71, 'Industrial Technology': 76, 'Aerospace & Defense': 72 },
    factors: { economicStrength: 74, regulatoryComplexity: 56, taxTariffFriction: 49, geopoliticalRisk: 44, dealExecutionRisk: 50 },
    notes: 'Competitive manufacturing base and EU structural funds; political centralization and EU rule-of-law tensions add governance risk.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'TR',
    name: 'Turkey',
    region: 'Europe',
    sectorFit: { 'Professional Services': 76, 'Healthcare Services': 73, 'Industrial Technology': 77, 'Aerospace & Defense': 78 },
    factors: { economicStrength: 70, regulatoryComplexity: 64, taxTariffFriction: 56, geopoliticalRisk: 65, dealExecutionRisk: 58 },
    notes: 'Large domestic market with young demographics and industrial depth; macro volatility, currency risk, and governance concerns require robust downside structuring.',
    confidence: 0.71,
    lastUpdated: asOfDate,
  },
  {
    code: 'RO',
    name: 'Romania',
    region: 'Europe',
    sectorFit: { 'Professional Services': 72, 'Healthcare Services': 70, 'Industrial Technology': 74, 'Aerospace & Defense': 70 },
    factors: { economicStrength: 74, regulatoryComplexity: 58, taxTariffFriction: 50, geopoliticalRisk: 42, dealExecutionRisk: 52 },
    notes: 'Fast-growing EU member with strong IT services sector; institutional development gaps and judicial reform pace require careful navigation.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'CN',
    name: 'China',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 80, 'Healthcare Services': 82, 'Industrial Technology': 90, 'Aerospace & Defense': 65 },
    factors: { economicStrength: 85, regulatoryComplexity: 78, taxTariffFriction: 62, geopoliticalRisk: 75, dealExecutionRisk: 68 },
    notes: "World's second-largest economy with vast industrial depth; regulatory opacity, FDI restrictions, and geopolitical tensions create significant execution and exit risk.",
    confidence: 0.72,
    lastUpdated: asOfDate,
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 85, 'Healthcare Services': 77, 'Industrial Technology': 79, 'Aerospace & Defense': 62 },
    factors: { economicStrength: 78, regulatoryComplexity: 42, taxTariffFriction: 34, geopoliticalRisk: 58, dealExecutionRisk: 42 },
    notes: "Asia's premier financial gateway with deep capital markets; evolving regulatory landscape under National Security Law changes risk profile.",
    confidence: 0.76,
    lastUpdated: asOfDate,
  },
  {
    code: 'TW',
    name: 'Taiwan',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 76, 'Healthcare Services': 78, 'Industrial Technology': 92, 'Aerospace & Defense': 78 },
    factors: { economicStrength: 80, regulatoryComplexity: 52, taxTariffFriction: 48, geopoliticalRisk: 76, dealExecutionRisk: 48 },
    notes: 'Global semiconductor leadership and strong tech manufacturing; cross-strait tensions represent the highest concentration of geopolitical risk in global PE markets.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'VN',
    name: 'Vietnam',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 72, 'Healthcare Services': 68, 'Industrial Technology': 76, 'Aerospace & Defense': 60 },
    factors: { economicStrength: 82, regulatoryComplexity: 66, taxTariffFriction: 55, geopoliticalRisk: 44, dealExecutionRisk: 58 },
    notes: 'Fast-growing China+1 beneficiary with competitive labor costs; regulatory transparency and capital market depth remain development areas.',
    confidence: 0.72,
    lastUpdated: asOfDate,
  },
  {
    code: 'TH',
    name: 'Thailand',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 74, 'Industrial Technology': 75, 'Aerospace & Defense': 65 },
    factors: { economicStrength: 74, regulatoryComplexity: 58, taxTariffFriction: 50, geopoliticalRisk: 42, dealExecutionRisk: 52 },
    notes: 'Diversified economy with strong tourism and manufacturing bases; political instability cycles and foreign ownership limits shape deal structuring.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'PH',
    name: 'Philippines',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 75, 'Healthcare Services': 70, 'Industrial Technology': 72, 'Aerospace & Defense': 62 },
    factors: { economicStrength: 78, regulatoryComplexity: 64, taxTariffFriction: 54, geopoliticalRisk: 46, dealExecutionRisk: 56 },
    notes: 'Young demographics and BPO strength; infrastructure gaps and regulatory fragmentation increase operational complexity.',
    confidence: 0.72,
    lastUpdated: asOfDate,
  },
  {
    code: 'MY',
    name: 'Malaysia',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 74, 'Industrial Technology': 77, 'Aerospace & Defense': 68 },
    factors: { economicStrength: 76, regulatoryComplexity: 52, taxTariffFriction: 44, geopoliticalRisk: 38, dealExecutionRisk: 46 },
    notes: 'Diversified economy with strong electronics and Islamic finance sectors; bumiputera policies and political dynamics require local partnership strategies.',
    confidence: 0.76,
    lastUpdated: asOfDate,
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    region: 'Asia-Pacific',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 79, 'Industrial Technology': 74, 'Aerospace & Defense': 66 },
    factors: { economicStrength: 74, regulatoryComplexity: 46, taxTariffFriction: 48, geopoliticalRisk: 24, dealExecutionRisk: 40 },
    notes: 'Exceptional governance quality and transparent institutions; small market scale limits deployment capacity for larger funds.',
    confidence: 0.80,
    lastUpdated: asOfDate,
  },
  {
    code: 'IL',
    name: 'Israel',
    region: 'Middle East',
    sectorFit: { 'Professional Services': 82, 'Healthcare Services': 81, 'Industrial Technology': 90, 'Aerospace & Defense': 88 },
    factors: { economicStrength: 80, regulatoryComplexity: 50, taxTariffFriction: 48, geopoliticalRisk: 78, dealExecutionRisk: 44 },
    notes: 'World-class innovation and deep-tech ecosystem; ongoing security situation and regional conflict create elevated but understood geopolitical risk.',
    confidence: 0.75,
    lastUpdated: asOfDate,
  },
  {
    code: 'QA',
    name: 'Qatar',
    region: 'Middle East',
    sectorFit: { 'Professional Services': 77, 'Healthcare Services': 72, 'Industrial Technology': 73, 'Aerospace & Defense': 75 },
    factors: { economicStrength: 76, regulatoryComplexity: 48, taxTariffFriction: 30, geopoliticalRisk: 52, dealExecutionRisk: 50 },
    notes: 'High per-capita wealth and diversification ambition; small domestic market and Gulf regional dynamics shape investment thesis scope.',
    confidence: 0.74,
    lastUpdated: asOfDate,
  },
  {
    code: 'ZA',
    name: 'South Africa',
    region: 'Africa',
    sectorFit: { 'Professional Services': 76, 'Healthcare Services': 72, 'Industrial Technology': 71, 'Aerospace & Defense': 70 },
    factors: { economicStrength: 68, regulatoryComplexity: 58, taxTariffFriction: 54, geopoliticalRisk: 54, dealExecutionRisk: 54 },
    notes: 'Largest and most sophisticated African market; load-shedding crisis, political uncertainty, and crime levels weigh on operational execution.',
    confidence: 0.73,
    lastUpdated: asOfDate,
  },
  {
    code: 'NG',
    name: 'Nigeria',
    region: 'Africa',
    sectorFit: { 'Professional Services': 70, 'Healthcare Services': 65, 'Industrial Technology': 66, 'Aerospace & Defense': 58 },
    factors: { economicStrength: 72, regulatoryComplexity: 72, taxTariffFriction: 64, geopoliticalRisk: 62, dealExecutionRisk: 66 },
    notes: "Africa's largest population with massive untapped market potential; currency volatility, infrastructure gaps, and security concerns require experienced local operators.",
    confidence: 0.66,
    lastUpdated: asOfDate,
  },
  {
    code: 'EG',
    name: 'Egypt',
    region: 'Africa',
    sectorFit: { 'Professional Services': 71, 'Healthcare Services': 68, 'Industrial Technology': 68, 'Aerospace & Defense': 64 },
    factors: { economicStrength: 70, regulatoryComplexity: 68, taxTariffFriction: 60, geopoliticalRisk: 58, dealExecutionRisk: 62 },
    notes: 'Large population center with strategic geographic position; currency devaluations, regulatory unpredictability, and political risk shape deal economics.',
    confidence: 0.68,
    lastUpdated: asOfDate,
  },
  {
    code: 'KE',
    name: 'Kenya',
    region: 'Africa',
    sectorFit: { 'Professional Services': 73, 'Healthcare Services': 67, 'Industrial Technology': 70, 'Aerospace & Defense': 58 },
    factors: { economicStrength: 74, regulatoryComplexity: 62, taxTariffFriction: 54, geopoliticalRisk: 48, dealExecutionRisk: 56 },
    notes: "East Africa's economic hub with strong mobile money innovation; developing capital markets and governance gaps limit large-scale PE deployment.",
    confidence: 0.70,
    lastUpdated: asOfDate,
  },
  {
    code: 'MA',
    name: 'Morocco',
    region: 'Africa',
    sectorFit: { 'Professional Services': 73, 'Healthcare Services': 70, 'Industrial Technology': 72, 'Aerospace & Defense': 66 },
    factors: { economicStrength: 72, regulatoryComplexity: 56, taxTariffFriction: 50, geopoliticalRisk: 40, dealExecutionRisk: 52 },
    notes: 'Gateway to North Africa with improving infrastructure and EU proximity; legal complexity and limited PE ecosystem require patient capital approaches.',
    confidence: 0.71,
    lastUpdated: asOfDate,
  },
  {
    code: 'CL',
    name: 'Chile',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 78, 'Healthcare Services': 76, 'Industrial Technology': 76, 'Aerospace & Defense': 68 },
    factors: { economicStrength: 74, regulatoryComplexity: 50, taxTariffFriction: 46, geopoliticalRisk: 34, dealExecutionRisk: 44 },
    notes: "Latin America's most stable and open economy; strong institutional quality and deep pension fund ecosystem support PE activity.",
    confidence: 0.79,
    lastUpdated: asOfDate,
  },
  {
    code: 'CO',
    name: 'Colombia',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 72, 'Industrial Technology': 73, 'Aerospace & Defense': 64 },
    factors: { economicStrength: 74, regulatoryComplexity: 60, taxTariffFriction: 54, geopoliticalRisk: 48, dealExecutionRisk: 54 },
    notes: 'Growing middle class and improving business environment; security concerns and regulatory complexity require thorough operational due diligence.',
    confidence: 0.73,
    lastUpdated: asOfDate,
  },
  {
    code: 'AR',
    name: 'Argentina',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 73, 'Industrial Technology': 72, 'Aerospace & Defense': 66 },
    factors: { economicStrength: 66, regulatoryComplexity: 72, taxTariffFriction: 74, geopoliticalRisk: 42, dealExecutionRisk: 64 },
    notes: 'Large skilled workforce and industrial depth; chronic macro instability, capital controls, and regulatory unpredictability define the risk profile.',
    confidence: 0.66,
    lastUpdated: asOfDate,
  },
  {
    code: 'PE',
    name: 'Peru',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 72, 'Healthcare Services': 69, 'Industrial Technology': 70, 'Aerospace & Defense': 60 },
    factors: { economicStrength: 72, regulatoryComplexity: 58, taxTariffFriction: 52, geopoliticalRisk: 44, dealExecutionRisk: 54 },
    notes: 'Resource-rich economy with growing services sector; political instability cycles and infrastructure gaps affect deal execution timelines.',
    confidence: 0.72,
    lastUpdated: asOfDate,
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    region: 'Latin America',
    sectorFit: { 'Professional Services': 74, 'Healthcare Services': 72, 'Industrial Technology': 72, 'Aerospace & Defense': 58 },
    factors: { economicStrength: 72, regulatoryComplexity: 52, taxTariffFriction: 48, geopoliticalRisk: 28, dealExecutionRisk: 48 },
    notes: 'Stable democracy with strong environmental credentials; small market scale constrains deployment size but quality of life attracts nearshoring.',
    confidence: 0.76,
    lastUpdated: asOfDate,
  },
]

const baseFactorDefaults: Record<FactorKey, number> = {
  economicStrength: 60,
  regulatoryComplexity: 55,
  taxTariffFriction: 55,
  geopoliticalRisk: 50,
  dealExecutionRisk: 52,
  marketSizeDepth: 55,
  marketGrowthMomentum: 55,
  marketConcentrationRisk: 50,
}

const withOverrides = (profile: BaseCountryProfile): CountryProfile => {
  const override = indicatorFactorOverrides[profile.code] ?? {}
  const factors: Record<FactorKey, number> = {
    ...baseFactorDefaults,
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
      trendDirection: 'up',
      delta: 1.6,
    },
    taxTariffFriction: {
      lastRefreshed: indicatorOverridesGeneratedAt,
      confidence: liveFactorConfidence.taxTariffFriction ?? 0.78,
      trendDirection: 'down',
      delta: -1.2,
    },
    regulatoryComplexity: {
      lastRefreshed: asOfDate,
      confidence: 0.68,
      trendDirection: 'flat',
      delta: 0.1,
    },
    geopoliticalRisk: {
      lastRefreshed: asOfDate,
      confidence: 0.65,
      trendDirection: 'up',
      delta: 0.8,
    },
    dealExecutionRisk: {
      lastRefreshed: asOfDate,
      confidence: 0.67,
      trendDirection: 'down',
      delta: -0.6,
    },
    marketSizeDepth: {
      lastRefreshed: indicatorOverridesGeneratedAt,
      confidence: liveFactorConfidence.marketSizeDepth ?? 0.83,
      trendDirection: 'up',
      delta: 1.1,
    },
    marketGrowthMomentum: {
      lastRefreshed: indicatorOverridesGeneratedAt,
      confidence: liveFactorConfidence.marketGrowthMomentum ?? 0.81,
      trendDirection: 'up',
      delta: 1.4,
    },
    marketConcentrationRisk: {
      lastRefreshed: indicatorOverridesGeneratedAt,
      confidence: liveFactorConfidence.marketConcentrationRisk ?? 0.79,
      trendDirection: 'flat',
      delta: 0,
    },
  }

  const professionalServices = profile.sectorFit['Professional Services'] ?? 0
  const industrialTechnology = profile.sectorFit['Industrial Technology'] ?? 0
  const healthcareServices = profile.sectorFit['Healthcare Services'] ?? 0
  const aerospaceDefense = profile.sectorFit['Aerospace & Defense'] ?? 0

  const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)))

  const expandedSectorFit: Record<string, number> = {
    ...profile.sectorFit,
    'Software & Data Services': clampScore(
      professionalServices * 0.58 +
        industrialTechnology * 0.32 +
        (100 - factors.regulatoryComplexity) * 0.1,
    ),
    'Financial Services': clampScore(
      professionalServices * 0.45 +
        factors.economicStrength * 0.4 +
        (100 - factors.regulatoryComplexity) * 0.15,
    ),
    'Energy & Infrastructure': clampScore(
      industrialTechnology * 0.5 + aerospaceDefense * 0.25 + factors.economicStrength * 0.25,
    ),
    'Consumer & Retail': clampScore(
      professionalServices * 0.45 +
        healthcareServices * 0.2 +
        factors.economicStrength * 0.2 +
        (100 - factors.taxTariffFriction) * 0.15,
    ),
    'Logistics & Transportation': clampScore(
      industrialTechnology * 0.45 +
        factors.economicStrength * 0.25 +
        (100 - factors.taxTariffFriction) * 0.2 +
        (100 - factors.regulatoryComplexity) * 0.1,
    ),
    'Education & Training': clampScore(
      professionalServices * 0.52 +
        healthcareServices * 0.16 +
        factors.economicStrength * 0.2 +
        (100 - factors.dealExecutionRisk) * 0.12,
    ),
    'Real Estate & Built Environment': clampScore(
      industrialTechnology * 0.4 +
        factors.economicStrength * 0.28 +
        (100 - factors.dealExecutionRisk) * 0.2 +
        (100 - factors.geopoliticalRisk) * 0.12,
    ),
    'Food & Agriculture': clampScore(
      healthcareServices * 0.18 +
        professionalServices * 0.24 +
        factors.economicStrength * 0.24 +
        (100 - factors.taxTariffFriction) * 0.18 +
        (100 - factors.geopoliticalRisk) * 0.16,
    ),
  }

  return {
    ...profile,
    sectorFit: expandedSectorFit,
    factors,
    sources,
    factorCitations: factorCitationsFor(profile.code),
    factorDataQuality,
  }
}

export const countryProfiles: CountryProfile[] = baseProfiles.map(withOverrides)
