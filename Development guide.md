# Project: Croatia Political Observatory
### A neutral, data-driven political information platform

## 1. Product vision

Build a production-quality, modern web application that provides a comprehensive, objective overview of Croatia's political landscape, national statistics, government history, and registered political parties.

**Primary purpose:** Help voters make informed electoral decisions by making verifiable public data, political programs, and historical trends accessible and understandable.

The platform must be politically independent. It must not endorse, promote, criticize, rank, or recommend political parties, candidates, or governments.

**Language:** Croatian (`hr-HR`) as the default, with architecture supporting English (`en`) translations.

**Target users:** Croatian voters, journalists, students, researchers, and interested citizens.

**Working project name:** Croatia Political Observatory. Keep the brand name configurable.

**Non-negotiable principle:** Never manufacture statistics, citations, political positions, or party information. Missing information must be identified as unavailable, not estimated by AI.

---

## 2. Technology stack

Use a modern, maintainable stack:

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui and Lucide icons |
| Charts | Recharts, with custom tooltips and annotations |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Data ingestion | TypeScript jobs, with Python adapters where necessary |
| AI summarization | Provider-agnostic server-side LLM adapter |
| File storage | S3-compatible object storage |
| Testing | Vitest and Playwright |
| Deployment | Vercel-compatible frontend and hosted PostgreSQL |
| Scheduling | Scheduled server jobs or GitHub Actions |

Implement strict TypeScript, reusable components, responsive layouts, server-side loading, error handling, logging, and accessibility.

External provider credentials must never be exposed in client-side code.

Create an `.env.example`, database migrations, a documented setup procedure, and reproducible data-import commands.

---

## 3. Core navigation

The application should have these main routes:

| Route | Page |
|---|---|
| `/` | National overview dashboard |
| `/topics` | All statistical topics |
| `/topics/[slug]` | Detailed topic and indicator analysis |
| `/government` | Current government |
| `/government/history` | Historical administrations |
| `/parties` | Political party directory |
| `/parties/[slug]` | Individual party profile |
| `/compare/parties` | Side-by-side party comparison |
| `/compare/governments` | Historical government comparison |
| `/elections` | Election overview |
| `/elections/[id]` | Specific election information |
| `/regions` | Regional statistics |
| `/regions/[slug]` | County or City of Zagreb dashboard |
| `/methodology` | Data definitions and impartiality rules |
| `/sources` | Source catalogue |
| `/admin` | Protected administrative interface |

Support deep links to individual indicators and selected comparison settings.

---

## 4. Main dashboard

The homepage should follow the general visual direction of the provided SugarCRM screenshot.

### Layout

- Narrow left navigation rail with icons and tooltips.
- Compact top navigation containing the platform name, search, language selector, and update status.
- Large heading: "Hrvatska u brojkama".
- A small subtitle explaining that the dashboard uses publicly verifiable data.
- A visible "Data last checked" indicator.
- A clean, spacious arrangement of cards and charts.
- Responsive behavior for tablet and mobile screens.

### Dashboard sections

**A. National indicators**

Show 8–12 prominently selected indicators, such as:

- Real GDP growth
- GDP per capita adjusted for purchasing power
- Harmonised inflation rate
- Unemployment rate
- Median or average real wage, clearly identified
- Government debt as a percentage of GDP
- Population
- Total fertility rate
- Housing affordability
- Poverty or social exclusion risk

Each card must show:

- Indicator name
- Latest available value
- Unit
- Reference month, quarter, or year
- Change against a comparable prior period
- Miniature historical chart
- EU comparison where compatible
- Link to a full indicator page
- Direct source and publication metadata

Do not imply that figures from different reference periods describe the same moment.

**B. Current government**

A distinct card showing:

- Prime minister
- Leading governing party
- Confirmed coalition partners
- Date the current government assumed office
- Parliamentary composition, where verified
- Link to the official government program
- Links to historical government comparisons

Highlight the current governing party using a neutral accent or understated border, not success-colored styling.

**C. Political landscape**

Show separate groups for:

- Parties participating in government
- Parliamentary opposition parties
- Other registered political parties
- Confirmed participants in the selected upcoming election

These statuses must be derived from authoritative records, not assumptions.

**D. Explore by topic**

A grid of topic cards, each with an icon, short description, a representative metric, and a link to the complete category.

**E. Croatia compared with Europe**

Include several selectable indicators and a historical Croatia-versus-EU chart.

**F. Election information**

Show the next expected election of the selected type, its confirmation status, and official electoral resources.

Do not publish a speculative exact election date as official.

---

## 5. Complete statistical coverage

Create a metadata-driven indicator catalogue. Every indicator must belong to a topic and have its own documented definition.

Include these categories:

| Category | Core indicators |
|---|---|
| Economy | Real GDP, GDP growth, GDP per capita, purchasing-power-adjusted GDP, productivity, investment, exports, imports, trade balance, business formation |
| Employment and wages | Employment, unemployment, youth unemployment, labour participation, average wages, median wages, real wages, employment by sector |
| Prices and living standards | HICP inflation, food prices, energy prices, purchasing power, material deprivation, poverty, inequality |
| Public finances | Government revenue, expenditure, deficit, debt-to-GDP, interest costs, taxes, EU fund absorption |
| Demography | Population, births, birth rate, fertility rate, deaths, life expectancy, age structure, migration, population projections |
| Housing | House prices, rent levels, housing costs as a share of income, construction permits, housing completions, overcrowding |
| Healthcare | Health expenditure, life expectancy, preventable mortality, avoidable mortality, medical workforce, verified waiting-time data |
| Education | Education attainment, early school leaving, PISA results, tertiary attainment, public education expenditure |
| Research and technology | R&D spending, innovation indicators, digital skills, broadband coverage, digital public services |
| Infrastructure | Transport investment, road safety, railway use, public transport, connectivity, water and waste infrastructure |
| Energy and environment | Energy mix, renewable energy, import dependency, greenhouse gas emissions, air pollution, recycling |
| Justice and governance | Judicial efficiency, institutional transparency, verified governance indicators, electoral participation |
| Security and defence | Reported crime, road fatalities, defence expenditure, emergency preparedness |
| International affairs | Trade partners, EU funds, foreign investment, external debt, international agreements |
| Tourism and industry | Tourism arrivals, overnight stays, tourism economic contribution, industrial production, sector concentration |
| Regional development | County-level income, employment, population, migration, infrastructure, and development gaps |

Do not force every indicator into the first release.

Implement the complete category structure, then launch with approximately 30–40 highly reliable, properly sourced indicators. Extend toward 100+ indicators without redesigning the system.

Maintain a coverage report showing which planned indicators are active, unavailable, or awaiting verification.

### Indicator metadata

Each metric definition needs:

- Unique ID and slug
- Croatian and English display names
- Topic and description
- Statistical definition
- Unit and possible unit conversions
- Monthly, quarterly, or annual frequency
- Geographic coverage
- Official source dataset identifier
- Source methodology URL
- Preferred comparator
- Whether the indicator can reasonably be interpreted directionally
- Notes on interpretation and limitations
- Minimum historical coverage requirements

Distinguish related indicators carefully: crude birth rate is not total fertility rate; nominal wages are not real wages; nominal GDP is not real GDP.

---

## 6. Historical government performance

Implement an interactive historical comparison system.

### Government model

Represent governments as dated administrations rather than treating political parties and governments as interchangeable.

For each government, record:

- Start and end date
- Prime minister
- Governing parties and their participation periods
- Major coalition changes
- Cabinet changes
- Official government program
- Source documentation

Support the HDZ-led period beginning in 2016, including the distinct 2016, 2020, and 2024 administrations, and enough earlier administrations to establish an appropriate historical baseline.

Do not merge all HDZ administrations into one uninterrupted, unqualified governing record.

### Historical comparison

Users should be able to choose:

- Current administration
- Previous administration
- Any two available governments
- A custom date range
- Croatia versus EU
- Croatia versus selected comparable countries

For each metric, display:

1. Its value before the administration.
2. Its value at the beginning of the administration.
3. Its value at the end, or latest available observation.
4. Its absolute change, where meaningful.
5. Its percentage or percentage-point change, as appropriate.
6. The equivalent change in the EU comparator.
7. The complete historical time series.

Mark government transitions on graphs using subtle vertical dashed lines.

Use the last comparable observation available before the government took office, not an invented value for the inauguration day.

For annual data, clearly state that an observation can span the terms of two governments. Do not treat a calendar year as belonging exclusively to a particular administration.

### Critical neutrality rule

**Correlation with an administration's term must never be presented as proof of causation.**

Use text such as:

"During this administration, the indicator changed by X."

Do not use:

"This administration caused the indicator to change by X."

Avoid automatic government performance scores, success percentages, rankings, or politically loaded descriptions.

Provide contextual notes for major methodological breaks, international crises, EU accession-related changes, and other documented influences.

---

## 7. European and global benchmarking

For every metric where comparable international data exist, offer an international reference.

Prioritize:

1. Croatia
2. EU-27 aggregate
3. Euro area, where relevant
4. Selected EU countries
5. World comparison, when a harmonized source exists

Use actual published EU aggregates when available, not a simple unweighted average of member-state values.

Allow users to select comparison countries such as Slovenia, Slovakia, Hungary, Poland, Austria, Italy, and Germany.

Ensure that geography, period, unit, frequency, and definitions are compatible.

### Comparison graph

Default visualization:

- Croatia: prominent dark line
- EU: blue-gray line
- Other countries: muted additional lines
- Government transitions: vertical markers
- Source and update information below

Offer both raw values and indexed comparisons where meaningful.

For selected suitable metrics, calculate the difference between Croatia's change and the EU's change. Clearly explain the calculation.

Never claim that this difference isolates the effect of government policy.

If reliable EU or global comparison data are unavailable, show "Nema usporedivih podataka" rather than substituting incompatible datasets.

---

## 8. Political party directory

The party directory must use the official Croatian register as its canonical source for registered party identity and registration status.

Do not confuse:

- Registered political parties
- Parties represented in parliament
- Parties participating in government
- Parties that contested previous elections
- Parties confirmed for an upcoming election
- Electoral alliances and candidate lists
- Independent candidates

The next parliamentary election should be the default election context, but provide selectors for presidential, European Parliament, and local elections.

### Party cards

Display:

- Official party name and abbreviation
- Logo, when licensed or otherwise permissible
- Registration status
- Current leader, if officially verified
- Political orientation, if supportable
- Current parliamentary representation, if applicable
- Current governing/opposition status
- Confirmed election participation status
- Link to party profile

Support search, alphabetical sorting, and filtering.

All registered parties should remain discoverable, even when they have no parliamentary representation, published program, or clear ideological classification.

### Ideological classifications

Allow these broad labels:

- Left
- Centre-left
- Centre
- Centre-right
- Right
- Not clearly classifiable

Use separate, carefully documented fields for economic and social policy orientation.

Do not infer political orientation from a party's name or a single isolated statement.

A classification requires an identifiable supporting source: for example, an explicit party self-description, established academic classification, or a clearly documented and consistent programmatic position.

Record the source, date, classification method, and whether it is self-described or externally classified.

Where different sources disagree, report the disagreement or mark the classification as uncertain.

Never force every party into a category.

---

## 9. Individual political party pages

Create a polished, consistent party detail template.

### Header

Use a two-column hero area.

Left:
- Official party name
- Acronym
- Short neutral factual summary
- Verified leader
- Registration status
- Governing or opposition status
- Available political orientation labels
- Official website link
- Official program link

Right:
- A relevant licensed image, party event photograph, or other permitted imagery
- A smooth gradient into the off-white page background

Use placeholder visual treatments rather than unauthorized photographs where appropriate.

### Sections

**Overview:** Founding and registration information, leadership history where available, parliamentary representation, and verified affiliations.

**Political program:** Original official documents, publication dates, archived versions, and AI-generated summaries.

**Policy positions:** Positions organized under economy, housing, healthcare, education, migration, environment, international affairs, and governance.

**Election history:** Official vote shares, seats, constituencies, and coalition relationships by election.

**Parliamentary activity:** Supported records of legislative initiatives, proposals, and votes where reliable records are available.

**Finance:** Publicly reported revenue, donations, campaign expenditures, and links to official financial reports.

**Sources:** The documents and datasets supporting all displayed information.

Keep visual structure and information availability rules identical for all political parties.

---

## 10. AI program summarization

The AI summarizer is a document interpretation tool, not an authority on politics.

### Input

Use party documents from verified official websites, official election materials, or other clearly identified primary sources.

Store the original program URL, document, publication date, retrieval timestamp, and content hash.

Extract the document text, retaining page numbers or sections for citations.

### Output

Generate structured summaries covering:

- Economic policy
- Taxation and public spending
- Employment and wages
- Housing
- Healthcare
- Education
- Demography and migration
- Environment and energy
- International affairs
- Justice and institutions

For each section, produce:

1. A concise, neutral description of explicitly stated proposals.
2. The relevant original quotations or document references needed to verify the summary.
3. An indication of whether the program addresses the topic.
4. A distinction between concrete commitments and general aspirations, using clearly defined criteria.

### Mandatory AI rules

- Never invent proposals.
- Never infer undocumented policy positions.
- Never add recommendations or evaluations.
- Never label a policy good, bad, progressive, regressive, effective, or ineffective without clearly attributable source context.
- Never fill an omitted topic using general knowledge about the party.
- Never use external political commentary as if it were part of the program.
- Preserve amounts, dates, conditions, and qualifications.
- Preserve the document language and provide Croatian summaries by default.
- Distinguish the party's statements from verified external facts.
- Show "Nije navedeno u analiziranom programu" for absent positions.
- Label the output as an AI-generated summary.
- Show the document version and AI generation timestamp.
- Require source-linked sections and human approval before public publication.

AI outputs should be stored and cached, not regenerated on every page load.

If a program changes, create a new version and regenerate a draft summary without silently overwriting the published historical version.

**The party's original program must always be more prominent as evidence than the AI's interpretation.**

---

## 11. Party comparison tool

Build a side-by-side comparison page allowing users to select up to four parties.

Use a neutral table with topic rows and party columns.

Each cell should contain a concise sourced summary, with a link to the original program section.

Possible rows:

- Income tax
- Corporate tax
- Housing policy
- Healthcare funding
- Education
- Pensions
- Immigration
- Energy
- European Union
- Defence
- Environmental policy

Missing positions must be visibly marked as not documented.

Do not assign scores, winners, ideological proximity percentages, or subjective grades.

Use equal screen space, typography, and prominence for all selected parties.

---

## 12. Elections and civic information

Create an election explorer containing:

- Upcoming elections
- Historical election results
- Election type
- Official election date, when confirmed
- Constituencies
- Candidates and electoral lists
- Official results
- Turnout
- Vote share
- Seats won
- Electoral coalitions
- Basic voting-system explanation
- Official voter information and deadlines

Prioritize information from Državno izborno povjerenstvo (DIP).

Before an election's official candidate lists are published, show registered parties separately from confirmed election participants.

When official lists are published, synchronize confirmed candidacies and preserve the source publication date.

Present preliminary results and final results as different statuses.

Never calculate or display an unsupported election forecast.

Optional later feature: verified opinion polls with fieldwork dates, sample sizes, methodology, and pollster identity. Polls must be visually distinguished from election results.

---

## 13. Regional explorer

Create an interactive Croatian regional comparison experience.

Support all counties and the City of Zagreb.

Offer:

- Clickable regional map
- County profiles
- Regional indicator comparisons
- Historical charts
- National reference values
- Regional rankings by a user-selected metric, clearly labeled as descriptive rather than an overall quality ranking

Do not extrapolate missing county figures from national averages.

Respect changing statistical boundaries and distinguish administrative counties from Eurostat NUTS regions where relevant.

---

## 14. Promise and legislative tracker

Implement this after the core statistical system is stable.

Track explicitly documented commitments from official political programs.

For each commitment, store:

- Exact original wording
- Political party or coalition
- Program version
- Publication date
- Topic
- Any stated deadline
- Any stated numerical target
- Relevant legislation, official actions, and outcome indicators
- Evidence links

Use descriptive states such as:

- Documented commitment
- Official action identified
- Implementation evidence available
- Deadline passed
- Evidence insufficient

Avoid an automatic "promise kept/broken" score.

Where fulfillment is disputed or cannot be directly measured, show the evidence and explain the limitation.

Do not attribute a coalition commitment to a single party unless the original evidence supports it.

---

## 15. Sources and data acquisition

### Primary sources

**Croatian Bureau of Statistics (DZS)**  
https://podaci.dzs.hr/en/

Main source for GDP, population, vital statistics, labour, tourism, and numerous domestic statistical indicators.

**Eurostat**  
https://ec.europa.eu/eurostat/

Primary source for internationally comparable European statistics.

API documentation:  
https://ec.europa.eu/eurostat/en/web/user-guides/data-browser/api-data-access/api-introduction

**Croatian National Bank (HNB)**  
https://www.hnb.hr/

Monetary, banking, financial, external-sector, and related statistics.

**Ministry of Finance**  
https://mfin.gov.hr/

Budgetary and public finance information.

**Croatian Government**  
https://vlada.gov.hr/

Government composition, official programs, and institutional information.

**Croatian Parliament (Sabor)**  
https://www.sabor.hr/

Parliamentary membership, government support, legislation, and public parliamentary records.

**State Electoral Commission (DIP)**  
https://www.izbori.hr/

Election participants, results, turnout, and campaign-finance information.

**Croatian Open Data Portal**  
https://data.gov.hr/

Official datasets, including the register of political parties.

### Additional sources

Use appropriate official or methodologically documented sources for specific indicators:

- World Bank
- OECD
- IMF
- European Commission
- European Environment Agency
- Croatian Institute of Public Health
- Relevant Croatian ministries and official institutions

Non-government indices may be included only when their methods and limitations are identified.

### Ingestion rules

Create separate, documented data adapters for each source.

Prefer official APIs and structured files. For PDF-only material, parse into a verified staging format; do not silently invent values when extraction fails.

Every successful ingestion must:

1. Fetch the latest published source version.
2. Validate its structure.
3. Validate units, dates, geography, and value types.
4. Normalize it into internal records.
5. Store a retrieval timestamp.
6. Preserve available flags such as provisional or revised.
7. Detect unexpectedly large changes or missing historical observations.
8. Stage suspicious results for review.
9. Publish only validated observations.
10. Retain enough source information to reproduce the published values.

Never replace validated data with an empty or failed import.

Schedule updates according to source release frequency; do not label annual observations as daily data simply because the importer runs daily.

Because sources such as Eurostat can revise historical observations without exposing old versions, retain local snapshots or revision records where licenses permit.

---

## 16. Database model

Design a normalized PostgreSQL schema.

Core entities:

```text
Party
PartyNameHistory
PartyLeadership
PartyRegistration
PartyAffiliation
PartyPoliticalPosition
Government
GovernmentParty
GovernmentProgram
Election
ElectionCandidacy
ElectionList
ElectionResult
ParliamentaryMembership
Topic
IndicatorDefinition
IndicatorObservation
GeographicArea
DataSource
SourceDataset
SourceRevision
IndicatorComparison
PartyProgram
ProgramDocumentVersion
ProgramSummary
PolicyCommitment
CommitmentEvidence
SourceDocument
MediaAsset
EditorialReview
AuditLog
IngestionRun
```

Use stable identifiers, appropriate unique constraints, and explicit temporal validity.

### IndicatorObservation

Include at least:

```text
id
indicatorId
geographyId
periodStart
periodEnd
frequency
value
unit
sourceId
sourceDatasetId
publicationDate
retrievedAt
observationStatus
revisionId
methodologyVersion
```

Maintain separate indicators for substantively different definitions rather than coercing everything into one numeric series.

### PartyProgram

Include:

```text
id
partyId
documentTitle
documentUrl
documentLanguage
publicationDate
retrievedAt
contentHash
storedDocumentPath
version
verificationStatus
```

### ProgramSummary

Include:

```text
id
programVersionId
modelIdentifier
promptVersion
generatedAt
reviewStatus
summaryJson
evidenceReferences
```

Include migrations and initial database seeds for topic definitions and known institutional data sources.

---

## 17. Visual design system

Create a restrained, premium dashboard aesthetic.

### Color palette

| Usage | Color |
|---|---|
| Primary background | `#F8F9F7` |
| Card background | `#FFFFFF` |
| Secondary surface | `#F1F3F4` |
| Primary text | `#171B20` |
| Secondary text | `#6B7280` |
| Borders | `#E6E9EC` |
| Accent | `#426B78` |
| Positive background | `#EAF5EE` |
| Negative background | `#FBEDEE` |
| Neutral background | `#F1F3F5` |

Use a contemporary sans-serif font such as Inter.

Design characteristics:

- Generous whitespace
- Rounded cards, approximately 16–20px
- Very subtle borders and shadows
- Clear typographic hierarchy
- Consistent visual spacing
- Minimal animation
- Elegant loading states
- Charts without unnecessary gradients or clutter
- Polished mobile layouts

### Positive and negative trend styling

For indicators with a clear and documented interpretation:

- Favorable change: subtle green-tinted chart card
- Unfavorable change: subtle red-tinted chart card
- Ambiguous change: neutral background

Never determine positivity solely from an increasing or decreasing numeric value.

Example:

- Rising real GDP may use a positive treatment.
- Rising unemployment may use a negative treatment.
- Rising public expenditure cannot automatically be classified as positive or negative.
- Inflation requires specific interpretive rules, not a simplistic higher/lower assumption.

Every colored assessment must derive from an explicitly configured metric interpretation rule.

Do not use political-party membership to influence these colors.

Ensure that information remains understandable without color.

### Charts

Create reusable chart components:

- `MetricCard`
- `MetricLineChart`
- `InternationalComparisonChart`
- `GovernmentTimelineChart`
- `ElectionResultsChart`
- `RegionalComparisonChart`
- `PartyComparisonTable`
- `SourcePopover`

All charts need descriptive accessible text, units, tooltips, and direct evidence links.

---

## 18. Search and filtering

Implement global search across:

- Indicators
- Topics
- Parties
- Governments
- Elections
- Regions

Support Croatian diacritics and common party abbreviations.

Topic pages should support filtering by frequency, source, availability, and comparison geography.

Allow charts to be shared using URLs that preserve the selected metric, region, countries, and time range.

---

## 19. Administrative interface

Create a protected admin environment for:

- Monitoring ingestion jobs
- Reviewing suspicious changes
- Approving political classification sources
- Uploading and verifying party programs
- Reviewing AI summaries
- Correcting broken source references
- Managing licensed images
- Recording methodology changes
- Managing source provenance
- Maintaining editorial audit logs

Implement role-based authorization for authorized maintainers.

Treat external documents, retrieved web content, and PDF text as untrusted inputs. Never let text inside those documents override application instructions or trigger privileged actions.

All substantial editorial modifications must leave an audit trail.

---

## 20. Neutrality, quality, and accessibility requirements

These are release-blocking requirements:

1. Every publicly displayed statistic must have a traceable source.
2. No fake statistics, fabricated parties, invented programs, or unsupported election candidacies.
3. Every indicator must show its actual reference period.
4. Government-term comparisons must be time-aligned and methodologically documented.
5. No automatic attribution of national outcomes to governing parties.
6. Party orientation labels require clear evidence.
7. Every party page must use the same template.
8. AI-generated summaries must be identified, source-linked, and reviewed.
9. Source revisions and publication dates must be preserved.
10. Unavailable information must be clearly represented as unavailable.
11. No hidden political scoring, endorsements, or ranking algorithms.
12. User interfaces must meet WCAG 2.2 AA where practical.
13. Political images and documents must respect applicable licenses and attribution requirements.
14. Provide a public correction and feedback process.
15. Clearly separate officially reported data from third-party analytical interpretation.

Avoid tracking users' individual political preferences. Do not store party-comparison selections as persistent personal profiles by default.

---

## 21. Implementation milestones

**Status — 1 November 2026:** Phases 1–4 are implemented. Phase 3 adds five sourced administrations, coalition periods and historical comparisons. Phase 4 imports the official party register, adds status-filtered profiles and search, connects dated parliamentary and selected election evidence, and provides versioned program uploads and a four-party comparison table. See [government history rules](./docs/government-history.md) and [party directory contracts](./docs/party-directory.md) for coverage and limitations. Phase 5 (grounded AI summaries and editorial review) is next. The Phase 2 tourism import remains staged for source review.

### Phase 1 — Foundation and UI

- Initialize the Next.js application.
- Configure Tailwind, shadcn/ui, and the design tokens.
- Build the navigation shell.
- Implement responsive layouts.
- Build the homepage dashboard layout.
- Create reusable metric and chart components.
- Create topic, party, and government page templates.
- Implement Croatian interface strings.
- Add realistic loading, empty, and error states.

Use clearly labeled development fixtures where live data are not yet connected. Do not present demo numbers as real observations.

**Deliverable:** A visually complete, navigable frontend with reusable components.

### Phase 2 — Statistical data platform

- Create the database schema.
- Build the Eurostat adapter.
- Build initial DZS adapters.
- Implement observation validation and source metadata.
- Populate 30–40 verified indicators.
- Implement historical time-series charts.
- Implement EU comparisons.
- Add last-updated and reference-period labels.
- Add automated ingestion tests.

**Deliverable:** A functioning evidence-backed national dashboard.

### Phase 3 — Government history

- Implement administration and coalition timelines.
- Verify the current government and historical dates.
- Connect time-series observations to government comparison periods.
- Add government transition markers.
- Implement before/during comparison calculations.
- Show EU changes over identical periods.

**Deliverable:** A transparent historical comparison system.

### Phase 4 — Political party directory

- Import the official party register.
- Implement party search and status filters.
- Build individual party pages.
- Connect parliamentary and election records.
- Implement program upload and versioning.
- Add documented ideological classifications where supportable.
- Build the party comparison table.

**Deliverable:** A comprehensive, nonpartisan political party directory.

### Phase 5 — AI integration

- Implement document retrieval and extraction.
- Create grounded summarization prompts.
- Return structured summary JSON with evidence references.
- Validate summary structure.
- Build an editorial review workflow.
- Implement program version history.
- Publish approved program summaries.

**Deliverable:** Source-verifiable AI summaries of political programs.

### Phase 6 — Elections and regional analytics

- Import historical election results.
- Distinguish registered parties from confirmed candidacies.
- Implement election detail pages.
- Implement turnout and results visualization.
- Build county dashboards and geographic comparisons.

**Deliverable:** Election and regional exploration features.

### Phase 7 — Advanced accountability features

- Implement political financing data.
- Add parliamentary activity where dependable records exist.
- Add the evidence-based commitment tracker.
- Add the public corrections interface.
- Expand supported indicators.

**Deliverable:** A richer public accountability platform without editorialized scoring.

### Phase 8 — Production hardening

- Test the ETL pipelines against real source changes.
- Audit citation completeness and data provenance.
- Test authorization and document-processing security.
- Perform keyboard and screen-reader testing.
- Add monitoring, backups, and database migration procedures.
- Optimize bundle size and page performance.
- Configure production deployment.

**Deliverable:** A secure, maintainable, deployable application.

---

## 22. Testing and acceptance criteria

Create automated tests for:

- Correct source-to-observation mapping.
- Accurate percentage and percentage-point changes.
- Annual/quarterly alignment.
- Geographic comparison compatibility.
- Missing data handling.
- Provisional and revised data.
- Government boundary calculations.
- Coalition membership changes.
- Political party status classification.
- AI summary grounding.
- Source-link availability.
- Responsive rendering.
- Accessibility.

Required end-to-end scenarios:

**Scenario A:** A user opens real GDP growth, sees Croatia's latest officially published figure, its historical chart, the EU comparator, its reference period, and source.

**Scenario B:** A user compares the current administration with a previous administration. The application calculates changes from comparable observations and never claims that the administration caused them.

**Scenario C:** A newly registered political party is imported. It appears in the directory but is not marked as a confirmed election participant.

**Scenario D:** A party has no verifiable election program. Its page clearly says so and does not fabricate a summary.

**Scenario E:** An official program is updated. The previous version and approved summary remain accessible.

**Scenario F:** A source fails to update. Existing validated observations remain available, with the correct last-successful-update status.

**Scenario G:** An EU comparison uses incompatible units or missing reference periods. The application refuses to produce a misleading comparison.

**Scenario H:** A party's political orientation is disputed or unsupported. The application displays uncertainty instead of an invented classification.

---

## 23. Definition of done

The application is considered ready for its first public release only when:

- All core routes function.
- The homepage contains genuine, verified statistics.
- The official source for each active datapoint is accessible.
- At least 30 indicators have validated observations and appropriate histories.
- EU comparison works for supported indicators.
- Government history and current government status are evidence-backed.
- Registered political parties can be explored independently of election candidacy.
- Party programs have original document links wherever available.
- AI summaries are published only after validation and review.
- No demo content is mistaken for live data.
- The application is responsive, accessible, and deployable.
- The methodology and correction process are public.

## Final implementation instruction

Do not attempt to implement the entire product as one undifferentiated task.

Start with Phase 1, while defining the database contracts required for Phase 2. Create a working repository, write the necessary code, and validate it before advancing.

Use real institutional datasets instead of invented statistics as soon as the data integration begins.

Prioritize correctness, source transparency, neutrality, maintainability, and user experience over feature quantity.

When data are unavailable or classification is genuinely uncertain, preserve that uncertainty in the interface rather than hiding it.
