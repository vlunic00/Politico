# Statistical coverage

Generated 2026-10-24T15:03:02.592Z by `npm run data:coverage`.

31 active indicators; 14 awaiting verification; 2454 published observation records including retained revisions. UI reads only the newest published revision for each series. All 16 topic categories remain available.

| Indicator | Coverage | Source dataset | Latest reference start | Latest import |
| --- | --- | --- | --- | --- |
| Real GDP growth | ACTIVE | eurostat: namq_10_gdp | 2026-04-01 | SUCCEEDED |
| GDP per capita in PPS | ACTIVE | eurostat: nama_10_pc | 2025-01-01 | SUCCEEDED |
| Unemployment rate | ACTIVE | eurostat: une_rt_m | 2026-08-01 | SUCCEEDED |
| Real wages | AWAITING_VERIFICATION | Not connected | — | Not imported |
| HICP inflation | ACTIVE | eurostat: prc_hicp_minr | 2026-09-01 | SUCCEEDED |
| Risk of poverty or social exclusion | ACTIVE | eurostat: ilc_peps01n | 2025-01-01 | SUCCEEDED |
| Government debt | ACTIVE | eurostat: gov_10q_ggdebt | 2026-04-01 | SUCCEEDED |
| Government balance | ACTIVE | eurostat: gov_10dd_edpt1 | 2025-01-01 | SUCCEEDED |
| Population | ACTIVE | eurostat: demo_pjan | 2025-01-01 | SUCCEEDED |
| Total fertility rate | ACTIVE | eurostat: demo_find | 2024-01-01 | SUCCEEDED |
| House prices | ACTIVE | eurostat: prc_hpi_q | 2026-04-01 | SUCCEEDED |
| Housing cost overburden | ACTIVE | eurostat: ilc_lvho07a | 2025-01-01 | SUCCEEDED |
| Life expectancy | ACTIVE | eurostat: demo_mlexpec | 2024-01-01 | SUCCEEDED |
| Health expenditure | ACTIVE | eurostat: hlth_sha11_hf | 2024-01-01 | SUCCEEDED |
| Early school leaving | ACTIVE | eurostat: edat_lfse_14 | 2025-01-01 | SUCCEEDED |
| Tertiary attainment | ACTIVE | eurostat: edat_lfse_03 | 2025-01-01 | SUCCEEDED |
| Research and development expenditure | ACTIVE | eurostat: rd_e_gerdtot | 2024-01-01 | SUCCEEDED |
| Digital skills | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Rail passenger transport | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Public water supply access | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Renewable energy share | ACTIVE | eurostat: nrg_ind_ren | 2025-01-01 | SUCCEEDED |
| Greenhouse gas emissions | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Court disposition time | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Electoral turnout | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Road fatalities | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Defence expenditure | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Foreign direct investment | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Gross external debt | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Tourist nights | AWAITING_VERIFICATION | eurostat: tour_occ_nim | — | NEEDS_REVIEW |
| Industrial production | ACTIVE | eurostat: sts_inpr_m | 2026-08-01 | SUCCEEDED |
| County GDP per capita | AWAITING_VERIFICATION | Not connected | — | Not imported |
| County net migration | AWAITING_VERIFICATION | Not connected | — | Not imported |
| Youth unemployment | ACTIVE | eurostat: une_rt_m | 2026-06-01 | SUCCEEDED |
| Employment rate (20–64) | ACTIVE | eurostat: lfsi_emp_a | 2025-01-01 | SUCCEEDED |
| Gross fixed capital formation | ACTIVE | eurostat: nama_10_gdp | 2025-01-01 | SUCCEEDED |
| Exports of goods and services | ACTIVE | eurostat: nama_10_gdp | 2025-01-01 | SUCCEEDED |
| Imports of goods and services | ACTIVE | eurostat: nama_10_gdp | 2025-01-01 | SUCCEEDED |
| Government revenue | ACTIVE | eurostat: gov_10a_main | 2025-01-01 | SUCCEEDED |
| Government expenditure | ACTIVE | eurostat: gov_10a_main | 2025-01-01 | SUCCEEDED |
| Income inequality (Gini) | ACTIVE | eurostat: ilc_di12 | 2025-01-01 | SUCCEEDED |
| Overcrowding rate | ACTIVE | eurostat: ilc_lvho05a | 2025-01-01 | SUCCEEDED |
| Food and non-alcoholic beverage inflation | ACTIVE | eurostat: prc_hicp_minr | 2026-09-01 | SUCCEEDED |
| Household energy inflation | ACTIVE | eurostat: prc_hicp_minr | 2026-09-01 | SUCCEEDED |
| Average net earnings (nominal) | ACTIVE | dzs: Zaposlenost i plaće/Od 2025/T01.px | 2026-08-01 | SUCCEEDED |
| Average gross earnings (nominal) | ACTIVE | dzs: Zaposlenost i plaće/Od 2025/T01.px | 2026-08-01 | SUCCEEDED |

Sources and exact dimension selections: [definitions](../src/lib/statistics/definitions.ts). Eurostat histories start in 2015; DZS wages start in 2025 (NKD 2025). Pending definitions are planning metadata and are never substituted with estimates.

Tourism history is staged because pandemic-era changes trigger the anomaly guard. Inspect and review the stored snapshot before publication; do not disable validation. Real wages, county data and other unconnected definitions remain pending. No indicators have been declared permanently unavailable.
