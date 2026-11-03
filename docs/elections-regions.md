# Phase 6: election history and county exploration

Implemented on 3 November 2026. This is an initial verified backfill, not the entire DIP archive. All UI labels and explanatory text are Croatian.

## Election coverage and primary sources

| Dataset | Main voting day | Imported result areas | Official allocation |
| --- | --- | --- | --- |
| Parliamentary 2020 | 5 July 2020 | I–XI plus six minority contests in XII | 151 seats |
| Parliamentary 2024 | 17 April 2024 | I–XI plus six minority contests in XII | 151 seats |
| European 2024 | 9 June 2024 | National, 21 counties, overseas | 12 seats nationally |
| Presidential 2024/25, round 1 | 29 December 2024 | National, 21 counties, overseas | No elected winner in round 1 |
| Presidential 2024/25, round 2 | 12 January 2025 | National, 21 counties, overseas | Officially elected candidate identified |

There are five datasets and 103 result areas in the current public snapshot. Voting abroad and repeated polling can occur on additional days; the date above is the main voting day, not a substitute for the full dates in the official decisions.

The [DIP archive](https://www.izbori.hr/arhiva-izbora/) exposes the JSON used by its own interface. Its official DAO files define the result paths; the importer uses those paths directly, not a third-party mirror. Parliamentary files use `data/parlament/<year>/rezultati/1/`; presidential files use `data/predsjednik/2024/rezultati/<round>/`; European files use `data/euparlament/2024/rezultati/1/`. Every displayed area links to its exact JSON.

Parliamentary seats and elected candidates come from the DIP decisions published in Narodne novine: [2020 I. constituency](https://narodne-novine.nn.hr/clanci/sluzbeni/2020_07_82_1530.html), [2024 I. constituency](https://narodne-novine.nn.hr/clanci/sluzbeni/2024_04_50_853.html), and each subsequent constituency/minority decision. European seats use the [2024 final decision](https://narodne-novine.nn.hr/clanci/sluzbeni/2024_06_75_1275.html). Candidate allocations are matched by complete names to their source lists and checked against each constituency's seat total. No D'Hondt allocation is recomputed locally. Deputies are excluded. The parser supports the actual numbered and unnumbered allocation layouts; an unknown layout fails rather than guessing.

The [official presidential report](https://www.izbori.hr/site/UserDocsImages/2024/Izbori_za_predsjednika_Republike_Hrvatske/Izvje%C5%A1%C4%87e%20o%20provedenim%20izborima%20za%20predsjednika%20Republike%20Hrvatske%202024-2025.docx.pdf) confirms both rounds and the elected president. Its 797,938 first-round votes and 1,122,859 second-round votes for Zoran Milanović were checked against the archive. Exact initial publication dates for the presidential results and historical candidate-list publications remain unknown; retrieval time never replaces them.

## Ballots, turnout, shares and identities

- Preserve eligible/source-listed voters, people who attended, submitted ballots, valid ballots and invalid ballots as separate counts. Attendance and submitted ballots can differ.
- Require complete polling-station coverage for these final-result imports. Valid plus invalid must equal submitted ballots; ordinary candidate/list votes must reconcile with valid ballots. National totals must equal the county-plus-overseas totals for the European and presidential imports.
- Ordinary list shares use valid ballots. First-round presidential shares use attending voters, matching the official first-round denominator. Second-round shares are calculated from valid ballots. The UI states each denominator.
- Serbian-minority voters can select up to three candidates. Minority candidate votes are not summed as ballots. The minority export's voter denominator may describe attending voters only, yielding 100%; the application suppresses that as a comparable turnout rate and does not manufacture a broader eligible electorate. Minority percentages are not inferred.
- Parliamentary overview turnout is explicitly the combined I–X source scope. It is not presented as the national/overseas/minority aggregate. Constituencies are not counties, and numbered constituency boundaries changed for 2024. Do not compare an identically numbered constituency across those elections as if its territory were unchanged.
- Keep coalition/list votes and seats at list level. Never apportion them to individual members. Presidential proposers are identified as proposers, not party candidacies or proof of a candidate's party membership.
- A reviewed, explicit full-name identity table connects selected source organizations to ministry IDs. Unmapped historical names, independent lists and associations remain visible without an inferred registry match. Renamed entities need explicit verification; abbreviations are not an identity algorithm.

Party profiles and participation filters consume the published historical evidence. Earlier manually verified evidence remains a fallback for contexts that have not been imported. Registration, present-day parliamentary representation and future candidacy stay separate.

## Election storage and operations

```powershell
npm run db:deploy
npm run elections:import
npm run elections:import -- --election parlamentarni-2024
```

`Election` identifies the event and round. `ElectionPublication` connects a whole published result set to an immutable `SourceRevision`. `ElectionContest` stores each area's validated typed JSON: ballot counts, choices, source organizations, candidates, preferences and verified seats. Party identities in historical source organizations are optional; preserving a source name does not require inventing a current party match.

The existing source/dataset/ingestion-run records retain provenance. Raw JSON and legal HTML are preserved together in hash-addressed snapshot files in `DATA_SNAPSHOT_DIR`. Hashes cover the definition and exact source responses; retrieval time is stored separately in PostgreSQL. Source dates, confirmed publication dates, retrieval time and application publication time remain separate.

The first complete, reconciled final dataset is published. Repeated imports reuse it. A changed HTML wrapper or JSON formatting with identical validated facts records a successful source check and retains the new raw revision, without republishing results or requiring a false result-change review. Changes to results or their substantive metadata stage a new whole publication. After inspecting its retained source and differences, a maintainer can publish it:

```powershell
npm run elections:import -- --review <publication-id> --reviewer "Actual source reviewer"
```

Publication revalidates the archived hash and exact stored contests, refuses stale revisions behind a newer published source, and records the reviewer in ingestion history. A transaction and per-election lock serialize publication. Empty, incomplete, malformed, unfinished or failed source reads preserve published results. There is no public election write endpoint or page-load upstream fetch. HTTP failures/timeouts are visible in ingestion history; rerun an explicit job after source recovery. During the initial backfill, some live requests timed out, so already retrieved official snapshots from the same session were reused with their original retrieval times. Subsequent live European re-imports succeeded and returned `UNCHANGED`.

The catalogue and UI distinguish final and preliminary statuses, but this adapter currently accepts the configured, verified final datasets only. No live preliminary feed is claimed. Historical participation is confirmed by final results; it is not a reconstruction of which candidate list was available on an earlier day.

## County data, geography and map

The explorer supports all 20 counties and the City of Zagreb. County IDs, names and geometry were taken from [Eurostat/GISCO NUTS 2024, level 3, 1:20 million](https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2024_4326_LEVL_3.geojson). Only the 21 Croatian features are retained locally in `src/lib/regions/counties.json`, with a simple geographic SVG projection. This is a generalized statistical map, not a cadastral boundary source. County profiles, a keyboard-accessible map and a full table expose the same areas. DIP county codes have their own explicit crosswalk; parliamentary constituencies are not mapped onto counties.

Map attribution is displayed beside the map: **© EuroGeographics for the administrative boundaries**. The [GISCO statistical-unit conditions](https://ec.europa.eu/eurostat/en/web/gisco/geodata/statistical-units) apply, including their restriction on commercial use without appropriate permission. Review licensing before commercial deployment; the included development map is not an unrestricted boundary dataset.

Two source-backed indicators are available:

| Indicator | Dataset / selection | Meaning |
| --- | --- | --- |
| County GDP per capita | `nama_10r_3gdp`, `unit=EUR_HAB` | Current-market-price EUR per inhabitant; nominal, with source rounding. Not real GDP growth or household income. |
| County net migration plus statistical adjustment | `demo_r_gind3`, `indic_de=CNMIGRAT` | Total population change minus natural change; signed annual count, including statistical adjustments. Not a direct arrivals-minus-departures measure or per-capita rate. |

See [regional accounts methodology](https://ec.europa.eu/eurostat/cache/metadata/en/reg_eco10_esms.htm) and [regional demographic methodology](https://ec.europa.eu/eurostat/cache/metadata/en/demo_r_gind3_esms.htm). Both selections request the exact 21 NUTS 3 codes plus a separate HR reference. No old/new codes are concatenated and no missing county is substituted with a national value. Historical coverage differs by county; newer codes can lack earlier observations.

```powershell
npm run db:seed
npm run data:import -- --indicator regional-gdp
npm run data:import -- --indicator regional-migration-adjusted
```

The existing statistical importer checks exact dimensions, permitted geography, units, calendar periods, duplicate observations and minimum history for **every** configured geography. Regional series use their own views; they are not silently exposed as national government-comparison indicators. An added observation definition preserves the distinction from the still-pending direct county migration measure.

Initial GDP import: 220 observations. Adjusted migration: 151 observations, initially staged by the existing anomaly guard. Before source-review publication, all 151 values were independently reconciled with `GROW - NATGROW` in the same official demographic dataset, including the large/signed changes. No anomaly guard was disabled. This source review does not claim human approval of an AI summary. Current statistical coverage is 33 active indicators of 46 definitions, with 2,825 published records including retained revisions.

The latest county year is 2024. National demographic data can be newer, but they do not advance the county selector or substitute a newer reference period in a county comparison. The selected year must exist in county data; a missing value stays missing. Historical charts include empty calendar years and use the matching HR period. Values, units, flags, definition, source URL, source update time, retrieval/check time and revision hash remain available. GDP comparisons are per capita; migration comparisons are absolute counts with their size limitation stated. Sorting is descriptive for the selected metric and is not a quality-of-life or government score.

## Validation and remaining coverage

Run `npm test`, `npm run test:elections`, `npm run test:ingestion`, `npm run test:parties`, `npm run build`, `npm run test:e2e`, and `npm run test:editorial`. Unit tests cover source identities, totals and share denominators, legal allocation layouts, deputy exclusion, map identities/geometry, geography restrictions and per-county history. Isolated PostgreSQL tests cover concurrent/idempotent imports, formatting-only source changes, failed/partial sources, staged result changes, review, old revision refusal, corruption and retained history. Browser tests cover source-backed seat/vote counts, minority rules, presidential rounds, filters/URL persistence, county map/profile/comparison, source qualifiers, search, real 404s, overflow and automated accessibility on desktop/mobile.

Still outside this initial backfill: older election cycles, local election results, polling-place maps, current upcoming schedules, synchronized future candidate-list feeds and reconstruction of their first publication times. Additional regional indicators and the direct DZS county migration adapter also remain coverage work. Detailed population/administrative boundary history, production scheduling, commercial map licensing, external-source resilience audits, manual screen-reader/physical-device checks and deployment remain later work. Phase 7 adds financing, parliamentary activity, commitment tracking and public corrections.
