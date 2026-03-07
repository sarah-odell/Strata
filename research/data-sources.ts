/**
 * Data Sources Skill — Comprehensive API and CLI reference for research agents.
 *
 * This module exports a prompt fragment that gets injected into persona prompts,
 * giving each AI analyst agent knowledge of real-world data APIs, financial data
 * providers, and CLI tools they can use to ground their analysis.
 */

export const dataSourcesSkill = `
## Data Sources & APIs

Use the following data sources to ground your analysis in current, authoritative data.
Search the web and query these APIs to find real numbers, not estimates.

### Economic Data (Free, No Key Required)

**World Bank Open Data API**
- GDP: https://api.worldbank.org/v2/country/{ISO2}/indicator/NY.GDP.MKTP.CD?format=json&date=2020:2025
- GDP Growth: https://api.worldbank.org/v2/country/{ISO2}/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2020:2025
- GDP Per Capita (PPP): https://api.worldbank.org/v2/country/{ISO2}/indicator/NY.GDP.PCAP.PP.CD?format=json
- FDI Inflows (% GDP): https://api.worldbank.org/v2/country/{ISO2}/indicator/BX.KLT.DINV.WD.GD.ZS?format=json
- Inflation (CPI): https://api.worldbank.org/v2/country/{ISO2}/indicator/FP.CPI.TOTL.ZG?format=json
- Trade (% GDP): https://api.worldbank.org/v2/country/{ISO2}/indicator/NE.TRD.GNFS.ZS?format=json
- Ease of Doing Business: https://api.worldbank.org/v2/country/{ISO2}/indicator/IC.BUS.EASE.XQ?format=json
- Tariff Rate (weighted mean): https://api.worldbank.org/v2/country/{ISO2}/indicator/TM.TAX.MRCH.WM.AR.ZS?format=json
- Unemployment: https://api.worldbank.org/v2/country/{ISO2}/indicator/SL.UEM.TOTL.ZS?format=json
- Population: https://api.worldbank.org/v2/country/{ISO2}/indicator/SP.POP.TOTL?format=json

**IMF Data**
- World Economic Outlook: https://www.imf.org/external/datamapper/NGDP_RPCH@WEO/OEMDC/ADVEC/{ISO3}
- Article IV Reports: Search "IMF Article IV {country} {year}" for latest country assessment
- Fiscal Monitor data for government debt/deficit ratios

**OECD Data**
- Economic Outlook: https://data.oecd.org/gdp/real-gdp-forecast.htm
- Tax Revenue (% GDP): https://data.oecd.org/tax/tax-revenue.htm
- FDI Restrictiveness Index: https://data.oecd.org/fdi/fdi-restrictiveness.htm
- Corporate Tax Rates: https://stats.oecd.org/Index.aspx?DataSetCode=TABLE_II1
- OECD Economic Surveys: Search "OECD economic survey {country} {year}"

**FRED (Federal Reserve Economic Data)**
- US-specific macro data: https://fred.stlouisfed.org/
- Interest rates, yield curves, credit spreads
- Exchange rates: Search FRED for "DEXUS{currency}" series

### Governance & Risk Data

**World Bank Worldwide Governance Indicators (WGI)**
- https://info.worldbank.org/governance/wgi/
- Six dimensions: Voice & Accountability, Political Stability, Government Effectiveness,
  Regulatory Quality, Rule of Law, Control of Corruption
- Percentile ranks (0-100) available for 200+ countries

**Transparency International Corruption Perceptions Index**
- https://www.transparency.org/en/cpi/
- Annual CPI scores (0-100) and global rankings
- Search "Transparency International CPI {country} {year}"

**Heritage Foundation Economic Freedom Index**
- https://www.heritage.org/index/
- Covers trade freedom, investment freedom, financial freedom, property rights
- Search "Heritage Economic Freedom {country} {year}"

**Sovereign Credit Ratings**
- S&P: Search "S&P sovereign rating {country} {year}"
- Moody's: Search "Moody's sovereign rating {country} {year}"
- Fitch: Search "Fitch sovereign rating {country} {year}"
- Key: AAA/Aaa (lowest risk) to D/C (default)

### PE / M&A / Deal Data

**PitchBook** (search for summary data)
- Search "PitchBook PE deal activity {country} {year}"
- Regional PE/VC breakdowns published quarterly
- Mid-market deal volumes, entry multiples, exit data

**Preqin** (search for summary data)
- Search "Preqin private equity {region} {year}"
- Fund performance benchmarks, dry powder data
- Sector and geography allocation trends

**Mergermarket** (search for summary data)
- Search "Mergermarket M&A {country} {sector} {year}"
- Deal value and volume trends by geography and sector
- Financial sponsor involvement percentages

**S&P Capital IQ / LCD**
- Search "leveraged loan market {region} {year}"
- Leverage multiples, pricing trends, direct lending data
- Unitranche and senior secured market conditions

### Sector-Specific Data

**Healthcare:** WHO Global Health Observatory, OECD Health Statistics, local health ministry data
**Industrial/Manufacturing:** UNIDO Industrial Development Report, World Bank manufacturing value-added data
**Technology:** WIPO patent statistics, ITU digital development data, local tech ecosystem reports
**Defense:** SIPRI Military Expenditure Database (https://www.sipri.org/databases/milex)
**Energy:** IEA World Energy Outlook, IRENA renewable capacity statistics
**Financial Services:** BIS banking statistics, FSB Global Monitoring Report on NBFI

### Trade & Tariff Data

**WTO Tariff Profiles**
- https://www.wto.org/english/res_e/statis_e/tariff_profiles_list_e.htm
- Applied MFN tariffs by product group and country
- Search "WTO tariff profile {country} {year}"

**UN Comtrade**
- https://comtrade.un.org/
- Bilateral trade flows by product and partner
- Search "UN Comtrade {country} trade {partner} {product}"

**UNCTAD World Investment Report**
- https://unctad.org/topic/investment/world-investment-report
- FDI inflows/outflows by country and sector
- Investment policy trends and BIT network data

### Country-Specific Central Bank & Regulatory Sources

Always check the target country's:
1. Central bank website for monetary policy stance, financial stability reports
2. Securities regulator for capital market rules, listing requirements
3. Competition authority for merger control thresholds, review timelines
4. Investment promotion agency for FDI incentives, special zones
5. Tax authority for corporate tax rates, withholding taxes, treaty network

### How to Use These Sources

1. **Always cite your sources** — Include the exact data source, URL, and date
2. **Prioritize recency** — Data from the last 12 months; note when older
3. **Cross-reference** — Verify key claims across at least 2-3 sources
4. **Be specific** — Report actual numbers (GDP growth: 2.3%, not "moderate growth")
5. **Note data gaps** — If you cannot find current data, state this explicitly
6. **Include data points** — Every metric you cite should appear in your dataPoints array
`

export const cliToolsSkill = `
## CLI Tools Available

You can use these command-line tools to fetch and process data:

### Web Search
- Use your built-in web search to find current data, news, and reports
- Search for: "{country} PE M&A activity {year}", "{country} GDP growth forecast {year}",
  "{country} FDI screening regulation", "{sector} market size {country}"

### Data Processing
- Parse JSON responses from APIs
- Extract specific data points from search results
- Cross-reference multiple sources for consistency
`
