import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const outputPath = path.join(rootDir, 'src', 'data', 'indicatorOverrides.ts')
const runDate = new Date().toISOString().slice(0, 10)

const countries = {
  US: 'USA', DE: 'DEU', SG: 'SGP', CA: 'CAN', AE: 'ARE',
  GB: 'GBR', FR: 'FRA', NL: 'NLD', JP: 'JPN', AU: 'AUS',
  IN: 'IND', BR: 'BRA', MX: 'MEX', ES: 'ESP', IT: 'ITA',
  KR: 'KOR', SA: 'SAU', SE: 'SWE', PL: 'POL', ID: 'IDN',
  CH: 'CHE', DK: 'DNK', NO: 'NOR', FI: 'FIN', IE: 'IRL',
  AT: 'AUT', BE: 'BEL', CZ: 'CZE', PT: 'PRT', GR: 'GRC',
  HU: 'HUN', TR: 'TUR', RO: 'ROU', CN: 'CHN', HK: 'HKG',
  TW: 'TWN', VN: 'VNM', TH: 'THA', PH: 'PHL', MY: 'MYS',
  NZ: 'NZL', IL: 'ISR', QA: 'QAT', ZA: 'ZAF', NG: 'NGA',
  EG: 'EGY', KE: 'KEN', MA: 'MAR', CL: 'CHL', CO: 'COL',
  AR: 'ARG', PE: 'PER', CR: 'CRI',
}

const wbIndicators = {
  gdpGrowth: 'NY.GDP.PCAP.KD.ZG',
  inflation: 'FP.CPI.TOTL.ZG',
  fdi: 'BX.KLT.DINV.WD.GD.ZS',
  tariff: 'TM.TAX.MRCH.SM.AR.ZS',
  tradeOpen: 'NE.TRD.GNFS.ZS',
}

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

// Absolute benchmark scoring — no relative ranking
const scoreGdpGrowth = (growth) => {
  // Absolute scale: negative growth is bad, 2% is solid, 5%+ is excellent
  if (growth <= 0) return clamp(15 + growth * 5)
  if (growth <= 1) return clamp(25 + growth * 20)
  if (growth <= 3) return clamp(45 + (growth - 1) * 12.5)
  if (growth <= 6) return clamp(70 + (growth - 3) * 7)
  return clamp(91 + (growth - 6) * 2)
}

const scoreFdi = (fdiPctGdp) => {
  // FDI as % of GDP: 0% = poor, 2% = decent, 5% = strong, 10%+ = excellent
  if (fdiPctGdp <= 0) return clamp(10 + fdiPctGdp * 5)
  if (fdiPctGdp <= 2) return clamp(20 + fdiPctGdp * 15)
  if (fdiPctGdp <= 5) return clamp(50 + (fdiPctGdp - 2) * 10)
  if (fdiPctGdp <= 15) return clamp(80 + (fdiPctGdp - 5) * 1.5)
  return 95
}

const scoreTradeOpenness = (tradePctGdp) => {
  // Trade as % of GDP: 30% = closed, 80% = moderate, 150%+ = very open
  if (tradePctGdp <= 20) return 15
  if (tradePctGdp <= 50) return clamp(15 + (tradePctGdp - 20) * 1.0)
  if (tradePctGdp <= 100) return clamp(45 + (tradePctGdp - 50) * 0.6)
  if (tradePctGdp <= 200) return clamp(75 + (tradePctGdp - 100) * 0.15)
  return 90
}

const scoreInflation = (inflation) => {
  // Distance from 2% target; both deflation and high inflation are bad
  const distance = Math.abs(inflation - 2)
  if (distance <= 0.5) return 95
  if (distance <= 1.5) return clamp(95 - (distance - 0.5) * 15)
  if (distance <= 4) return clamp(80 - (distance - 1.5) * 10)
  if (distance <= 10) return clamp(55 - (distance - 4) * 6)
  return clamp(20 - (distance - 10) * 2)
}

const scoreTariffRate = (tariffRate) => {
  // Simple mean tariff rate → friction score. 0% = no friction, 15%+ = high friction
  if (tariffRate <= 1) return clamp(5 + tariffRate * 5)
  if (tariffRate <= 5) return clamp(10 + (tariffRate - 1) * 10)
  if (tariffRate <= 10) return clamp(50 + (tariffRate - 5) * 7)
  if (tariffRate <= 20) return clamp(85 + (tariffRate - 10) * 1)
  return 95
}

const latestValue = (rows) => {
  const point = rows.find((row) => row.value !== null && row.value !== undefined)
  return point?.value ?? null
}

const fetchWbSeries = async (iso3, indicator) => {
  const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}?format=json&per_page=80`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) })

    if (!response.ok) {
      console.warn(`World Bank returned ${response.status} for ${iso3} ${indicator}, using null`)
      return null
    }

    const payload = await response.json()
    const rows = Array.isArray(payload) ? payload[1] : []

    return latestValue(Array.isArray(rows) ? rows : [])
  } catch (err) {
    console.warn(`World Bank fetch failed for ${iso3} ${indicator}: ${err.message}`)
    return null
  }
}

const fetchImfGrowth = async () => {
  try {
    const response = await fetch('https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH', {
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return {}
    }

    const payload = await response.json()
    const values = payload?.values?.NGDP_RPCH
    return typeof values === 'object' && values ? values : {}
  } catch {
    return {}
  }
}

const collectIndicatorValues = async () => {
  const imfGrowthMap = await fetchImfGrowth()
  const entries = await Promise.all(
    Object.entries(countries).map(async ([code, iso3]) => {
      const [gdpGrowth, inflation, fdi, tariff, tradeOpen] = await Promise.all([
        fetchWbSeries(iso3, wbIndicators.gdpGrowth),
        fetchWbSeries(iso3, wbIndicators.inflation),
        fetchWbSeries(iso3, wbIndicators.fdi),
        fetchWbSeries(iso3, wbIndicators.tariff),
        fetchWbSeries(iso3, wbIndicators.tradeOpen),
      ])

      const imfCountry = imfGrowthMap[iso3] || imfGrowthMap[code]
      const imfGrowthValues = imfCountry && typeof imfCountry === 'object' ? Object.values(imfCountry) : []
      const imfGrowth = imfGrowthValues.length > 0 ? Number(imfGrowthValues[imfGrowthValues.length - 1]) : null

      return {
        code,
        iso3,
        gdpGrowth: Number(gdpGrowth ?? imfGrowth ?? 0),
        inflation: Number(inflation ?? 0),
        fdi: Number(fdi ?? 0),
        tariff: Number(tariff ?? 0),
        tradeOpen: Number(tradeOpen ?? 0),
      }
    }),
  )

  return entries
}

const computeOverrides = (rows) => {
  const overrides = {}

  for (const row of rows) {
    const growthScore = scoreGdpGrowth(row.gdpGrowth)
    const fdiScore = scoreFdi(row.fdi)
    const tradeScore = scoreTradeOpenness(row.tradeOpen)
    const inflationScore = scoreInflation(row.inflation)

    const economicStrength = Math.round(
      growthScore * 0.34 + fdiScore * 0.24 + tradeScore * 0.2 + inflationScore * 0.22,
    )

    const tariffFriction = scoreTariffRate(row.tariff)
    const taxTariffFriction = Math.round(clamp(tariffFriction * 0.65 + (100 - tradeScore) * 0.35))

    overrides[row.code] = {
      economicStrength,
      taxTariffFriction,
    }
  }

  return overrides
}

const writeOverridesFile = async (overrides) => {
  const output = `import type { FactorKey } from './countries'\n\nexport type FactorOverrides = Record<string, Partial<Record<FactorKey, number>>>\n\n// Generated by ingestion/update-indicators.mjs on ${runDate}\nexport const indicatorOverridesGeneratedAt = '${runDate}'\n\nexport const liveFactorConfidence: Partial<Record<FactorKey, number>> = {\n  economicStrength: 0.82,\n  taxTariffFriction: 0.8,\n}\n\nexport const indicatorFactorOverrides: FactorOverrides = ${JSON.stringify(overrides, null, 2)}\n`
  await writeFile(outputPath, output, 'utf-8')
}

const main = async () => {
  const rows = await collectIndicatorValues()
  const overrides = computeOverrides(rows)
  await writeOverridesFile(overrides)
  console.log(`Indicator ingestion complete (${rows.length} countries).`)
  console.log(`Wrote ${outputPath}`)
}

main().catch((error) => {
  console.error(`Indicator ingestion failed: ${error.message}`)
  process.exitCode = 1
})
