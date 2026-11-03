# Statistical source mappings

Verified against live official responses on 24 October 2026. Executable selections and Croatian definitions are in [`definitions.ts`](../src/lib/statistics/definitions.ts); the catalogue supplies bilingual names. All active series have explicit units, frequency, limits, minimum history and methodology links. Refresh the current state with `npm run data:coverage`.

## Eurostat

The adapter uses the official [Statistics API](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-detailed-guidelines/api-statistics) and validates JSON-stat 2.0 row-major indexes, sparse/dense values and exact dimensions. It requests Croatia and the published EU-27 aggregate within the same cube, from 2015 onward. Every non-geography/time dimension is explicitly selected. No averages of member-state values are calculated.

Source revisions are retained locally because Eurostat's API exposes its [current dataset version](https://ec.europa.eu/eurostat/en/web/user-guides/data-browser/api-data-access/api-introduction). Missing values stay missing. The dataset `updated` field is stored separately from retrieval and publication dates.

| Indicators | Dataset | Critical selections |
| --- | --- | --- |
| Real GDP growth | `namq_10_gdp` | `B1GQ`, `CLV_PCH_SM`, `SCA`; year-on-year volume growth |
| GDP per capita in PPS | `nama_10_pc` | `B1GQ`, `CP_PPS_EU27_2020_HAB`; PPS level, not EU=100 |
| Unemployment / youth unemployment | `une_rt_m` | `PC_ACT`, `SA`, sex `T`, age `TOTAL` / `Y_LT25` |
| Overall / food / household energy inflation | `prc_hicp_minr` | `RCH_A`, `coicop18=TOTAL` / `CP01` / `CP045` |
| Poverty or exclusion | `ilc_peps01n` | `PC`, total age and sex; EU 2030 definition |
| Quarterly government debt | `gov_10q_ggdebt` | `S13`, `GD`, `PC_GDP` |
| Annual government balance | `gov_10dd_edpt1` | `S13`, `B9`, `PC_GDP` |
| Population | `demo_pjan` | `NR`, total age and sex; 1 January |
| Fertility | `demo_find` | `TOTFERRT`; children per woman |
| House prices | `prc_hpi_q` | `TOTAL`, `I15_Q`; 2015=100 |
| Housing cost overburden / overcrowding | `ilc_lvho07a` / `ilc_lvho05a` | `PC`, total poverty status, age and sex |
| Life expectancy at birth | `demo_mlexpec` | `YR`, `Y_LT1`, sex `T` |
| Current health expenditure | `hlth_sha11_hf` | `TOT_HF`, `PC_GDP` |
| Early school leaving | `edat_lfse_14` | `Y18-24`, `POP`, `PC`, sex `T` |
| Tertiary attainment | `edat_lfse_03` | `Y25-34`, `ED5-8`, `PC`, sex `T` |
| R&D expenditure | `rd_e_gerdtot` | `TOTAL` sectors, `PC_GDP` |
| Renewable energy share | `nrg_ind_ren` | `REN`, `PC` |
| Tourist nights (staged) | `tour_occ_nim` | `I551-I553`, `NR`, total residence |
| Industrial production | `sts_inpr_m` | `B-D`, `PRD`, `SCA`, `I21`; 2021=100 |
| Employment rate | `lfsi_emp_a` | `EMP_LFS`, `Y20-64`, `PC_POP`, sex `T` |
| Investment / exports / imports | `nama_10_gdp` | `P51G` / `P6` / `P7`, `PC_GDP` |
| Government revenue / expenditure | `gov_10a_main` | `TR` / `TE`, `S13`, `PC_GDP` |
| Income inequality | `ilc_di12` | `GINI_HND`, age `TOTAL`; 0–100 points |

Archived HICP `prc_hicp_manr` ends in 2025. The application uses `prc_hicp_minr` with ECOICOP version 2 and current 2026 observations. See [HICP methodology](https://ec.europa.eu/eurostat/cache/metadata/en/prc_hicp_esms.htm) for classification changes and possible January 2026 breaks. Renewable energy follows [Eurostat energy methodology](https://ec.europa.eu/eurostat/web/energy/methodology). EU-SILC reference years are survey years; income generally refers to the preceding year. National-accounts EU trade totals are not consolidated for intra-EU trade; see [national accounts metadata](https://ec.europa.eu/eurostat/cache/metadata/en/nama_10_gdp_esms.htm).

## DZS

The [official PxWeb endpoint](https://web.dzs.hr/PXWeb/api/v1/en/) supplies metadata and selected data via POST. Two initial selections import average nominal net and gross earnings from `Zaposlenost i plaće/Od 2025/T01.px`:

- `DJELATNOST=000` (total activities), `PLAĆA=2` (net) or `1` (gross).
- Individual `PERIOD=1…12` only; annual, quarterly and cumulative records are excluded.
- `GODINA` values from 2025, euros, legal entities, JOPPD administrative source, NKD 2025.

The adapter checks every returned key and separates documented missing markers from numeric zero. Currency and population coverage were verified against the [official earnings release and methodology](https://podaci.dzs.hr/2026/en/121344); snapshots retain metadata and data. PxWeb's update timestamp is preserved as supplied and is not treated as a release date.

These are nominal averages, not medians, not real wages and not all employed persons. The old activity classification is not concatenated with NKD 2025. No EU wage comparator is attached. Real wages remain an unconnected definition.

## Review and operations

Initial tourism data are staged because pandemic-era year-on-year changes exceed the conservative anomaly threshold. Review the source snapshot and documented context before explicit publication; no exception bypass is coded. Phase 6 connects county GDP and a separate net-migration-plus-statistical-adjustment definition through Eurostat; see [regional selections and source review](./elections-regions.md). Direct county migration remains pending. Election results use a separate DIP pipeline and do not substitute an irregular-election series into annual statistical observations.

Imports are explicit CLI jobs, not page-load fetches. Scheduling, object storage, an authenticated review UI and production deployment remain later work. Keep PostgreSQL and the snapshot directory backed up together. Source-link checks and a live import were run during implementation; future source availability is not guaranteed.
