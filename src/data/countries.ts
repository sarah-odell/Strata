export type FactorKey =
  | 'economicStrength'
  | 'regulatoryComplexity'
  | 'taxTariffFriction'
  | 'geopoliticalRisk'
  | 'dealExecutionRisk'

export type CountryProfile = {
  code: string
  name: string
  region: string
  sectorFit: Record<string, number>
  factors: Record<FactorKey, number>
  notes: string
  confidence: number
  lastUpdated: string
  sources: string[]
}

export const supportedSectors = [
  'Business Services',
  'Healthcare Services',
  'Industrial Technology',
] as const

export const countryProfiles: CountryProfile[] = [
  {
    code: 'US',
    name: 'United States',
    region: 'North America',
    sectorFit: {
      'Business Services': 86,
      'Healthcare Services': 88,
      'Industrial Technology': 82,
    },
    factors: {
      economicStrength: 87,
      regulatoryComplexity: 54,
      taxTariffFriction: 47,
      geopoliticalRisk: 38,
      dealExecutionRisk: 41,
    },
    notes:
      'Deep capital markets and strong demand profile; fragmentation across federal/state regimes increases compliance effort.',
    confidence: 0.84,
    lastUpdated: '2026-03-07',
    sources: [
      'IMF WEO database',
      'World Bank WDI',
      'OECD tax statistics',
      'US SEC / DOJ guidance',
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    region: 'Europe',
    sectorFit: {
      'Business Services': 78,
      'Healthcare Services': 81,
      'Industrial Technology': 89,
    },
    factors: {
      economicStrength: 79,
      regulatoryComplexity: 63,
      taxTariffFriction: 56,
      geopoliticalRisk: 42,
      dealExecutionRisk: 49,
    },
    notes:
      'High industrial depth and rule-of-law quality; EU and local compliance layers can extend time-to-close.',
    confidence: 0.83,
    lastUpdated: '2026-03-07',
    sources: [
      'IMF Article IV / WEO',
      'Bundesbank statistics',
      'OECD indicators',
      'EU competition and trade publications',
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    region: 'Asia-Pacific',
    sectorFit: {
      'Business Services': 84,
      'Healthcare Services': 75,
      'Industrial Technology': 80,
    },
    factors: {
      economicStrength: 82,
      regulatoryComplexity: 39,
      taxTariffFriction: 33,
      geopoliticalRisk: 44,
      dealExecutionRisk: 36,
    },
    notes:
      'Efficient regulatory regime and low friction tax environment; external trade dependency raises spillover sensitivity.',
    confidence: 0.8,
    lastUpdated: '2026-03-07',
    sources: ['MAS publications', 'World Bank WDI', 'IMF WEO', 'OECD datasets'],
  },
  {
    code: 'CA',
    name: 'Canada',
    region: 'North America',
    sectorFit: {
      'Business Services': 79,
      'Healthcare Services': 77,
      'Industrial Technology': 74,
    },
    factors: {
      economicStrength: 76,
      regulatoryComplexity: 52,
      taxTariffFriction: 48,
      geopoliticalRisk: 32,
      dealExecutionRisk: 43,
    },
    notes:
      'Stable policy baseline and close US integration; provincial differences require localized operating models.',
    confidence: 0.79,
    lastUpdated: '2026-03-07',
    sources: ['Bank of Canada', 'IMF', 'World Bank', 'OECD'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    region: 'Middle East',
    sectorFit: {
      'Business Services': 81,
      'Healthcare Services': 73,
      'Industrial Technology': 76,
    },
    factors: {
      economicStrength: 74,
      regulatoryComplexity: 46,
      taxTariffFriction: 37,
      geopoliticalRisk: 57,
      dealExecutionRisk: 50,
    },
    notes:
      'Attractive free-zone structures and pro-investment posture; regional geopolitical exposure requires scenario controls.',
    confidence: 0.74,
    lastUpdated: '2026-03-07',
    sources: ['Central Bank of the UAE', 'IMF', 'World Bank', 'OECD'],
  },
]
