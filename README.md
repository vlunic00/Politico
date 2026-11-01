# Croatia Political Observatory

Phases 1–4 of [the development guide](./Development%20guide.md): a Croatian, responsive Next.js frontend with a PostgreSQL statistical platform, sourced government history and the official political-party register. The dashboard uses validated Eurostat and DZS observations, historical charts, compatible EU comparisons, reference periods and source metadata. Political facts retain their separately dated sources.

## Local development

Requires Node.js 22.12+ (Node 24 LTS recommended), npm, and Docker Desktop with the Linux engine for the optional local database.

```powershell
npm ci
Copy-Item .env.example .env
docker compose up -d --wait
npm run db:deploy
npm run db:seed
npm run data:import
npm run dev
```

Open <http://localhost:3000>. The frontend also runs without PostgreSQL and renders unavailable states. Do not overwrite an existing `.env` when repeating setup. `npm ci` generates the Prisma client without requiring a database connection. Imports return a nonzero exit code if any series fails or needs review; successful series remain published. The initial tourism history needs review because pandemic-era swings trigger the anomaly guard.

Change `NEXT_PUBLIC_APP_NAME` in `.env` to rename the platform. Restart the development server after changing environment variables. The default interface is `hr-HR`; navigation messages are in `src/lib/i18n.ts`. English is reserved in the language control until the full translation is available.

The Compose database binds only to localhost. The credentials in `.env.example` are local development credentials. Use a separate PostgreSQL connection and credentials for hosting. `docker compose stop` preserves the database volume. Do not use `docker compose down --volumes` unless you intend to erase the local database.

## Implemented

- Next.js App Router, strict TypeScript, React, Tailwind v4, shadcn/ui, Lucide and Recharts.
- Desktop navigation rail, mobile navigation, search, configurable branding and Croatian interface.
- Government hero with a prime minister portrait, a gradient transition and sourced mandate details; a scrollable row of all 20 other parties in the dated parliamentary snapshot.
- Official ministry party-register import, immutable source revisions, alphabetical search and independent registration/parliament/government/election filters. The 1 November 2026 import contains 436 records: 157 active and 279 with cessation status; neither status implies candidacy.
- Consistent party profiles, stable registry identity, preserved parliamentary profile URLs, available leadership, licensed portraits, sourced self-descriptions and dated parliamentary shares. Unknown facts remain unavailable.
- Maintainer PDF upload, immutable program versions, explicit source review/publication and verified archive downloads. Two initial official 2024 programs have page-cited excerpts; unreviewed topics are not filled with assumptions or AI text.
- Equal-width comparison of up to four parties, with original programs, version references, verified quotations and explicit missing information. The next parliamentary election is the default context; historical, presidential, European and local contexts remain separate.
- Eight sourced national indicator cards below the political overview, sparklines, annual changes and same-period EU values.
- All 16 topic categories and 45 indicator definitions, with deep links, units, frequency and availability. Initial live import published 31 series; tourism remains staged for review.
- Eurostat JSON-stat adapter and DZS PxWeb net/gross wage imports; explicit dimension selections, source flags, revisions, raw snapshots and anomaly review.
- Historical Croatia/EU charts with accessible tables; dashboard indicator and time-range selections survive in the URL.
- Five distinct administrations from 2011, sourced coalition periods, selected cabinet changes and original government programs. The 2016, 2020 and 2024 Plenković terms stay separate; caretaker service is included up to handover.
- Government comparisons with URL-preserved administration/indicator selections and custom date ranges, actual baseline/start/end periods, compatible same-period EU changes, and exact-date transition markers. Missing history and methodology breaks suppress changes.
- Topic, government and political party profile templates, consistent source disclosures, loading, error and 404 states.
- Source catalogue and public methodology; explicit uncertainty without inferred government composition, dates, party positions or statistics.
- A synthetic chart preview at `/preview` and a neutral party layout preview at `/parties/preview`. Neither represents actual records.
- Prisma schema, additive migrations and repeatable metadata seed. Only imports publish observations; rerunning the seed preserves them.
- Vitest tests and desktop/mobile Playwright tests, including automated WCAG checks.

## Routes

| Route                                      | Current behavior                                                   |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `/`                                        | Government hero, party cards, then national indicators             |
| `/topics`                                  | Category catalogue and coverage counts                             |
| `/topics/[slug]`                           | Definitions, published histories, EU comparisons and source metadata |
| `/government`                              | Government detail template without unverified names                |
| `/government/history`                      | Five sourced administrations, coalition timeline, changes and programs |
| `/parties`                                 | Searchable, paginated official register with independent status filters |
| `/parties/[slug]`                          | Consistent profile with available facts and source links           |
| `/parties/preview`                         | Explicitly labelled profile template                               |
| `/compare/governments`                      | Two administrations or a custom range, Croatia/EU changes and history |
| `/compare/parties`                          | Up to four parties, context-specific programs, citations and gaps   |
| `/programs/[id]/document`                   | Hash-checked download of an explicitly published archived PDF      |
| `/elections`, `/regions`                   | Navigation destinations with later-phase availability              |
| `/sources`, `/methodology`                 | Source catalogue and publication rules                             |
| `/search?q=plaće`                          | Server-rendered catalogue search, including diacritic-free queries |
| `/preview`                                 | Interactive synthetic chart with accessible table                  |

Unknown topic, party and comparison records return HTTP 404. Proxy validates these records before a loading response can stream; party identities come from the published register at request time. A party database outage returns 503 for detail routes rather than falsely declaring valid records absent. There is no public write endpoint, administrative interface or authentication yet; `/admin` returns 404. Development pages request that search engines do not index them. Review the robots metadata before a public release.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run test:ingestion
npm run test:parties
npm run db:validate
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts the production build on port 3100; build first. It checks desktop Chrome and a Chromium mobile viewport, source/empty states, navigation, search, chart controls, real GDP history, DZS comparison restrictions, real 404s, horizontal overflow and automated WCAG 2.2 AA rules. Live-data scenarios require an imported database. Screenshots and failure traces go in ignored `test-results/`. Automated checks do not replace manual screen-reader or real-device testing.

Phase 3 tests also cover administration/coalition boundaries, annual/quarterly/monthly alignment, the 1 January population stock, missing baselines/endpoints, percent versus percentage-point changes, EU compatibility and breaks, invalid/repeated URL inputs, and browser comparison flows. See [government history and comparison rules](./docs/government-history.md).

Phase 4 adds registry/parser/status tests, isolated PostgreSQL tests for concurrent/repeated imports and retained versions, and desktop/mobile tests for nonparliamentary search, ceased records, four-party comparison, citations, PDF hashes and read-only downloads. See [party data contracts and maintainer commands](./docs/party-directory.md).

`test:ingestion` loads `.env`, applies all migrations in a randomly named isolated PostgreSQL schema, and removes only that schema afterward. It checks concurrent reruns, failed/empty imports, anomaly staging, manual publication, retained revisions and snapshot integrity without writing test data into the public schema. `npm test` runs the unit tests; it also runs the isolated database test if `DATABASE_URL` is already in the process environment.

## Database and statistical imports

```powershell
# Apply committed migrations (also used on a fresh local database)
npm run db:deploy

# Create a migration after intentionally changing the Prisma schema
npm run db:migrate -- --name describe_change

# Seed catalogue metadata; safe to repeat, no observations are deleted
npm run db:seed
```

```powershell
# Fetch and validate current official data
npm run data:import
npm run data:import -- --source eurostat
npm run data:import -- --source dzs
npm run data:import -- --indicator real-gdp-growth

# Rebuild the coverage report from the current database
npm run data:coverage

# Inspect a staged revision and its reasons; read the saved snapshot
npm run data:import -- --review <revision-id>

# After a maintainer has reviewed it, explicitly publish that revision
npm run data:import -- --review <revision-id> --publish
```

See [database contracts](./docs/data-contracts.md), [source mapping and import rules](./docs/statistical-sources.md) and [coverage](./docs/coverage.md). Pages read the newest fully published revision per series at request time; imports do not require a frontend rebuild. A failed or staged import preserves the published series. Repeated identical imports record a successful check without duplicating observations. An older source revision returning after a newer publication is flagged for review.

Raw responses, DZS metadata and exact requests are retained in `DATA_SNAPSHOT_DIR` (default `.data/snapshots`, gitignored), with SHA-256 hashes in PostgreSQL. Store this directory on durable storage and back it up alongside PostgreSQL when running imports outside local development. Do not run import jobs on an ephemeral frontend filesystem. Publication dates remain unknown when the source API supplies only a dataset update timestamp.

National histories start in 2015, so a full-term baseline for the 2011 administration is unavailable. DZS wages start in 2025 with NKD 2025, are explicitly nominal, and have no EU comparison or pre-2024-government baseline. Real wages and unconnected planned indicators remain unavailable. Do not concatenate incompatible wage classifications or use nominal wages as real wages. Phase 5 (grounded AI summaries and editorial review) is next; the full historical election import, regional maps, scheduling, S3 and deployment remain later work.

The dated parliamentary/leadership snapshot is in `src/lib/politics.ts`, separate from synthetic fixtures. Administration records are in `src/lib/governments.ts`, verified separately on 1 November 2026. These editorial facts retain their own verification dates. Registry identities and program revisions persist in PostgreSQL. Register updates use `npm run parties:import`, never page-load fetching. PDF storage uses `PROGRAM_DOCUMENT_DIR` (default `.data/programs`); back it up with PostgreSQL and statistical snapshots. See [party maintainer commands](./docs/party-directory.md) and [political sources](./docs/political-sources.md).

Framework setup follows the official [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [shadcn/ui installation](https://ui.shadcn.com/docs/installation/next), and [Prisma 7 client generation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators) documentation. Prisma is pinned to the stable 7.x series rather than the 8.x release candidate.
