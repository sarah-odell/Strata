import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const outputPath = path.join(rootDir, 'src', 'data', 'indicatorOverrides.ts')
const rawSnapshotPath = path.join(rootDir, '.strata', 'indicator-raw-latest.json')
const qualitySnapshotPath = path.join(rootDir, '.strata', 'indicator-quality-latest.json')
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
  gdpCurrentUsd: 'NY.GDP.MKTP.CD',
  population: 'SP.POP.TOTL',
  gdpGrowth: 'NY.GDP.PCAP.KD.ZG',
  gdpTotalGrowth: 'NY.GDP.MKTP.KD.ZG',
  inflation: 'FP.CPI.TOTL.ZG',
  fdi: 'BX.KLT.DINV.WD.GD.ZS',
  tariff: 'TM.TAX.MRCH.SM.AR.ZS',
  tradeOpen: 'NE.TRD.GNFS.ZS',
  privateCredit: 'FD.AST.PRVT.GD.ZS',
  bankConcentration3: 'GFDD.OI.01',
  bankConcentration5: 'GFDD.OI.06',
  populationDensity: 'EN.POP.DNST',
  urbanShare: 'SP.URB.TOTL.IN.ZS',
  internetUsers: 'IT.NET.USER.ZS',
  fixedBroadband: 'IT.NET.BBND.P2',
  regulatoryQuality: 'RQ.EST',
  tertiaryEnrollment: 'SE.TER.ENRR',
  unemployment: 'SL.UEM.TOTL.ZS',
}

const indicatorFallbacks = {
  gdpCurrentUsd: 0,
  population: 0,
  gdpGrowthPerCapita: 0,
  gdpGrowthTotal: 0,
  inflation: 0,
  fdi: 0,
  tariff: 0,
  tradeOpen: 0,
  privateCredit: 0,
  bankConcentration3: 65,
  bankConcentration5: 75,
  populationDensity: 0,
  urbanShare: 0,
  internetUsers: 0,
  fixedBroadband: 0,
  regulatoryQuality: 0,
  tertiaryEnrollment: 0,
  unemployment: 8,
}

const ingestionFreshnessSlaDays = {
  economicStrength: 35,
  taxTariffFriction: 35,
  marketSizeDepth: 45,
  marketGrowthMomentum: 45,
  marketConcentrationRisk: 90,
  customerDensity: 90,
  digitalReadiness: 90,
  licensingComplexity: 120,
  talentAvailability: 120,
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

const scoreNominalGdp = (gdpUsd) => {
  // Log scale: $10B is very small; $10T+ is very deep.
  const logValue = Math.log10(Math.max(gdpUsd, 1))
  return clamp(((logValue - 10) / 4) * 100)
}

const scorePopulation = (population) => {
  // Log scale: 1M to 1B resident market.
  const logValue = Math.log10(Math.max(population, 1))
  return clamp(((logValue - 6) / 3) * 100)
}

const scorePrivateCreditDepth = (creditPctGdp) => {
  if (creditPctGdp <= 20) return 20
  if (creditPctGdp <= 60) return clamp(20 + (creditPctGdp - 20) * 1.1)
  if (creditPctGdp <= 120) return clamp(64 + (creditPctGdp - 60) * 0.45)
  if (creditPctGdp <= 220) return clamp(91 + (creditPctGdp - 120) * 0.07)
  return 98
}

const scoreGrowthMomentum = (gdpGrowth, gdpPerCapitaGrowth, fdiPctGdp) => {
  const headlineGrowth = scoreGdpGrowth(gdpGrowth)
  const perCapitaGrowth = scoreGdpGrowth(gdpPerCapitaGrowth)
  const fdiFlow = scoreFdi(fdiPctGdp)
  return Math.round(clamp(headlineGrowth * 0.45 + perCapitaGrowth * 0.35 + fdiFlow * 0.2))
}

const scoreBankConcentrationRisk = (concentration) => {
  if (concentration <= 30) return clamp(20 + concentration * 0.6)
  if (concentration <= 50) return clamp(38 + (concentration - 30) * 1.1)
  if (concentration <= 70) return clamp(60 + (concentration - 50) * 0.9)
  if (concentration <= 90) return clamp(78 + (concentration - 70) * 0.7)
  return clamp(92 + (concentration - 90) * 0.3)
}

const scorePopulationDensity = (density) => {
  const logValue = Math.log10(Math.max(density, 1))
  return clamp(((logValue - 1) / 3) * 100)
}

const scoreUrbanShare = (urbanShare) => {
  if (urbanShare <= 30) return 20
  if (urbanShare <= 55) return clamp(20 + (urbanShare - 30) * 1.5)
  if (urbanShare <= 75) return clamp(57.5 + (urbanShare - 55) * 1.4)
  if (urbanShare <= 90) return clamp(85.5 + (urbanShare - 75) * 0.6)
  return 95
}

const scoreInternetUsers = (internetUsersPct) => {
  if (internetUsersPct <= 30) return clamp(internetUsersPct * 0.9)
  if (internetUsersPct <= 60) return clamp(27 + (internetUsersPct - 30) * 1.2)
  if (internetUsersPct <= 85) return clamp(63 + (internetUsersPct - 60) * 1.0)
  return clamp(88 + (internetUsersPct - 85) * 0.4)
}

const scoreFixedBroadband = (subsPer100) => {
  if (subsPer100 <= 5) return clamp(subsPer100 * 4)
  if (subsPer100 <= 20) return clamp(20 + (subsPer100 - 5) * 2)
  if (subsPer100 <= 40) return clamp(50 + (subsPer100 - 20) * 1.2)
  return clamp(74 + (subsPer100 - 40) * 0.8)
}

const scoreRegQualityToLicensingComplexity = (regQualityEstimate) => {
  // WGI Regulatory Quality estimate usually spans roughly -2.5 to +2.5.
  const normalizedQuality = clamp(((regQualityEstimate + 2.5) / 5) * 100)
  return Math.round(100 - normalizedQuality)
}

const scoreTertiaryEnrollment = (enrollmentPct) => {
  if (enrollmentPct <= 20) return clamp(enrollmentPct * 1.5)
  if (enrollmentPct <= 50) return clamp(30 + (enrollmentPct - 20) * 1.2)
  if (enrollmentPct <= 90) return clamp(66 + (enrollmentPct - 50) * 0.75)
  return clamp(96 + (enrollmentPct - 90) * 0.2)
}

const scoreUnemploymentPenalty = (unemploymentPct) => {
  if (unemploymentPct <= 4) return 10
  if (unemploymentPct <= 7) return clamp(10 + (unemploymentPct - 4) * 7)
  if (unemploymentPct <= 12) return clamp(31 + (unemploymentPct - 7) * 8)
  return clamp(71 + (unemploymentPct - 12) * 3)
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
      const [
        gdpCurrentUsd,
        population,
        gdpGrowth,
        gdpTotalGrowth,
        inflation,
        fdi,
        tariff,
        tradeOpen,
        privateCredit,
        bankConcentration3,
        bankConcentration5,
        populationDensity,
        urbanShare,
        internetUsers,
        fixedBroadband,
        regulatoryQuality,
        tertiaryEnrollment,
        unemployment,
      ] = await Promise.all([
        fetchWbSeries(iso3, wbIndicators.gdpCurrentUsd),
        fetchWbSeries(iso3, wbIndicators.population),
        fetchWbSeries(iso3, wbIndicators.gdpGrowth),
        fetchWbSeries(iso3, wbIndicators.gdpTotalGrowth),
        fetchWbSeries(iso3, wbIndicators.inflation),
        fetchWbSeries(iso3, wbIndicators.fdi),
        fetchWbSeries(iso3, wbIndicators.tariff),
        fetchWbSeries(iso3, wbIndicators.tradeOpen),
        fetchWbSeries(iso3, wbIndicators.privateCredit),
        fetchWbSeries(iso3, wbIndicators.bankConcentration3),
        fetchWbSeries(iso3, wbIndicators.bankConcentration5),
        fetchWbSeries(iso3, wbIndicators.populationDensity),
        fetchWbSeries(iso3, wbIndicators.urbanShare),
        fetchWbSeries(iso3, wbIndicators.internetUsers),
        fetchWbSeries(iso3, wbIndicators.fixedBroadband),
        fetchWbSeries(iso3, wbIndicators.regulatoryQuality),
        fetchWbSeries(iso3, wbIndicators.tertiaryEnrollment),
        fetchWbSeries(iso3, wbIndicators.unemployment),
      ])

      const imfCountry = imfGrowthMap[iso3] || imfGrowthMap[code]
      const imfGrowthValues = imfCountry && typeof imfCountry === 'object' ? Object.values(imfCountry) : []
      const imfGrowth = imfGrowthValues.length > 0 ? Number(imfGrowthValues[imfGrowthValues.length - 1]) : null

      const imputation = {}
      const numericOrFallback = (name, value, fallback) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
          imputation[name] = {
            usedFallback: true,
            fallbackValue: fallback,
          }
          return Number(fallback)
        }
        imputation[name] = {
          usedFallback: false,
          fallbackValue: fallback,
        }
        return Number(value)
      }

      return {
        code,
        iso3,
        gdpCurrentUsd: numericOrFallback('gdpCurrentUsd', gdpCurrentUsd, indicatorFallbacks.gdpCurrentUsd),
        population: numericOrFallback('population', population, indicatorFallbacks.population),
        gdpGrowthPerCapita: numericOrFallback('gdpGrowthPerCapita', gdpGrowth ?? imfGrowth, indicatorFallbacks.gdpGrowthPerCapita),
        gdpGrowthTotal: numericOrFallback('gdpGrowthTotal', gdpTotalGrowth ?? imfGrowth, indicatorFallbacks.gdpGrowthTotal),
        inflation: numericOrFallback('inflation', inflation, indicatorFallbacks.inflation),
        fdi: numericOrFallback('fdi', fdi, indicatorFallbacks.fdi),
        tariff: numericOrFallback('tariff', tariff, indicatorFallbacks.tariff),
        tradeOpen: numericOrFallback('tradeOpen', tradeOpen, indicatorFallbacks.tradeOpen),
        privateCredit: numericOrFallback('privateCredit', privateCredit, indicatorFallbacks.privateCredit),
        bankConcentration3: numericOrFallback('bankConcentration3', bankConcentration3, indicatorFallbacks.bankConcentration3),
        bankConcentration5: numericOrFallback('bankConcentration5', bankConcentration5, indicatorFallbacks.bankConcentration5),
        populationDensity: numericOrFallback('populationDensity', populationDensity, indicatorFallbacks.populationDensity),
        urbanShare: numericOrFallback('urbanShare', urbanShare, indicatorFallbacks.urbanShare),
        internetUsers: numericOrFallback('internetUsers', internetUsers, indicatorFallbacks.internetUsers),
        fixedBroadband: numericOrFallback('fixedBroadband', fixedBroadband, indicatorFallbacks.fixedBroadband),
        regulatoryQuality: numericOrFallback('regulatoryQuality', regulatoryQuality, indicatorFallbacks.regulatoryQuality),
        tertiaryEnrollment: numericOrFallback('tertiaryEnrollment', tertiaryEnrollment, indicatorFallbacks.tertiaryEnrollment),
        unemployment: numericOrFallback('unemployment', unemployment, indicatorFallbacks.unemployment),
        imputation,
      }
    }),
  )

  return entries
}

const computeOverrides = (rows) => {
  const overrides = {}
  const diagnostics = []

  for (const row of rows) {
    const growthScore = scoreGdpGrowth(row.gdpGrowthPerCapita)
    const fdiScore = scoreFdi(row.fdi)
    const tradeScore = scoreTradeOpenness(row.tradeOpen)
    const inflationScore = scoreInflation(row.inflation)

    const economicStrength = Math.round(
      growthScore * 0.34 + fdiScore * 0.24 + tradeScore * 0.2 + inflationScore * 0.22,
    )

    const marketSizeDepth = Math.round(
      clamp(
        scoreNominalGdp(row.gdpCurrentUsd) * 0.55 +
          scorePopulation(row.population) * 0.25 +
          scorePrivateCreditDepth(row.privateCredit) * 0.2,
      ),
    )

    const marketGrowthMomentum = scoreGrowthMomentum(row.gdpGrowthTotal, row.gdpGrowthPerCapita, row.fdi)
    const customerDensity = Math.round(
      clamp(scorePopulationDensity(row.populationDensity) * 0.55 + scoreUrbanShare(row.urbanShare) * 0.45),
    )
    const digitalReadiness = Math.round(
      clamp(scoreInternetUsers(row.internetUsers) * 0.65 + scoreFixedBroadband(row.fixedBroadband) * 0.35),
    )
    const tariffFriction = scoreTariffRate(row.tariff)
    const taxTariffFriction = Math.round(clamp(tariffFriction * 0.65 + (100 - tradeScore) * 0.35))
    const licensingComplexity = Math.round(
      clamp(scoreRegQualityToLicensingComplexity(row.regulatoryQuality) * 0.8 + taxTariffFriction * 0.2),
    )
    const talentAvailability = Math.round(
      clamp(
        scoreTertiaryEnrollment(row.tertiaryEnrollment) * 0.45 +
          (100 - scoreUnemploymentPenalty(row.unemployment)) * 0.3 +
          digitalReadiness * 0.25,
      ),
    )

    const concentration3 = scoreBankConcentrationRisk(row.bankConcentration3)
    const concentration5 = scoreBankConcentrationRisk(row.bankConcentration5)
    const marketConcentrationRisk = Math.round(clamp(concentration3 * 0.6 + concentration5 * 0.4))

    overrides[row.code] = {
      economicStrength,
      taxTariffFriction,
      marketSizeDepth,
      marketGrowthMomentum,
      marketConcentrationRisk,
      customerDensity,
      digitalReadiness,
      licensingComplexity,
      talentAvailability,
    }

    diagnostics.push({
      code: row.code,
      imputation: row.imputation,
      derived: {
        economicStrength,
        taxTariffFriction,
        marketSizeDepth,
        marketGrowthMomentum,
        marketConcentrationRisk,
        customerDensity,
        digitalReadiness,
        licensingComplexity,
        talentAvailability,
      },
    })
  }

  return { overrides, diagnostics }
}

const writeOverridesFile = async (overrides) => {
  const output = `import type { FactorKey } from './countries'\n\nexport type FactorOverrides = Record<string, Partial<Record<FactorKey, number>>>\n\n// Generated by ingestion/update-indicators.mjs on ${runDate}\nexport const indicatorOverridesGeneratedAt = '${runDate}'\n\nexport const liveFactorConfidence: Partial<Record<FactorKey, number>> = {\n  economicStrength: 0.82,\n  taxTariffFriction: 0.8,\n  marketSizeDepth: 0.85,\n  marketGrowthMomentum: 0.83,\n  marketConcentrationRisk: 0.8,\n  customerDensity: 0.82,\n  digitalReadiness: 0.81,\n  licensingComplexity: 0.76,\n  talentAvailability: 0.79,\n}\n\nexport const indicatorFactorOverrides: FactorOverrides = ${JSON.stringify(overrides, null, 2)}\n`
  await writeFile(outputPath, output, 'utf-8')
}

const writeQualityArtifacts = async (rows, diagnostics) => {
  await mkdir(path.join(rootDir, '.strata'), { recursive: true })
  await writeFile(
    rawSnapshotPath,
    `${JSON.stringify({ runDate, source: 'ingestion/update-indicators.mjs', rows }, null, 2)}\n`,
    'utf-8',
  )
  await writeFile(
    qualitySnapshotPath,
    `${JSON.stringify(
      {
        runDate,
        indicatorFallbacks,
        ingestionFreshnessSlaDays,
        diagnostics,
      },
      null,
      2,
    )}\n`,
    'utf-8',
  )
}

const main = async () => {
  const rows = await collectIndicatorValues()
  const { overrides, diagnostics } = computeOverrides(rows)
  await writeOverridesFile(overrides)
  await writeQualityArtifacts(rows, diagnostics)
  console.log(`Indicator ingestion complete (${rows.length} countries).`)
  console.log(`Wrote ${outputPath}`)
  console.log(`Wrote ${rawSnapshotPath}`)
  console.log(`Wrote ${qualitySnapshotPath}`)
}

main().catch((error) => {
  console.error(`Indicator ingestion failed: ${error.message}`)
  process.exitCode = 1
})
