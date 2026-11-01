# Croatia Political Observatory

Phases 1–3 of [the development guide](./Development%20guide.md): a Croatian, responsive Next.js frontend with a PostgreSQL statistical platform and sourced government history. The dashboard uses validated Eurostat and DZS observations, historical charts, compatible EU comparisons, reference periods and source metadata. Political facts retain their separately dated, manually verified sources.

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
- Party cards and profiles with available leadership, licensed portraits, sourced self-descriptions and parliamentary shares. Unverified fields stay unavailable. The full non-parliamentary register remains unconnected.
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
| `/parties`                                 | Alphabetical directory of the 21 parties in the sourced snapshot   |
| `/parties/[slug]`                          | Consistent profile with available facts and source links           |
| `/parties/preview`                         | Explicitly labelled profile template                               |
| `/compare/governments`                      | Two administrations or a custom range, Croatia/EU changes and history |
| `/compare/parties`                          | Empty state awaiting the official register and programs            |
| `/elections`, `/regions`                   | Navigation destinations with later-phase availability              |
| `/sources`, `/methodology`                 | Source catalogue and publication rules                             |
| `/search?q=plaće`                          | Server-rendered catalogue search, including diacritic-free queries |
| `/preview`                                 | Interactive synthetic chart with accessible table                  |

Unknown topic, party and comparison records return HTTP 404. Topic and comparison validation runs in Next.js Proxy before a loading response can stream. There is no administrative interface or authentication yet; `/admin` returns 404. Development pages request that search engines do not index them. Review the robots metadata before a public release.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run test:ingestion
npm run db:validate
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts the production build on port 3100; build first. It checks desktop Chrome and a Chromium mobile viewport, source/empty states, navigation, search, chart controls, real GDP history, DZS comparison restrictions, real 404s, horizontal overflow and automated WCAG 2.2 AA rules. Live-data scenarios require an imported database. Screenshots and failure traces go in ignored `test-results/`. Automated checks do not replace manual screen-reader or real-device testing.

Phase 3 tests also cover administration/coalition boundaries, annual/quarterly/monthly alignment, the 1 January population stock, missing baselines/endpoints, percent versus percentage-point changes, EU compatibility and breaks, invalid/repeated URL inputs, and browser comparison flows. See [government history and comparison rules](./docs/government-history.md).

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

National histories start in 2015, so a full-term baseline for the 2011 administration is unavailable. DZS wages start in 2025 with NKD 2025, are explicitly nominal, and have no EU comparison or pre-2024-government baseline. Real wages and unconnected planned indicators remain unavailable. Do not concatenate incompatible wage classifications or use nominal wages as real wages. The official party register and directory expansion are next (Phase 4); AI summaries, admin, elections, regional maps, scheduling, S3 and deployment remain later work.

The initial political snapshot is in `src/lib/politics.ts`, separate from synthetic chart fixtures. Administration records are in `src/lib/governments.ts`, verified separately on 1 November 2026. See [political sources](./docs/political-sources.md) for verification dates, the parliamentary denominator and image credits. These records are not imported into PostgreSQL or refreshed automatically.

Framework setup follows the official [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [shadcn/ui installation](https://ui.shadcn.com/docs/installation/next), and [Prisma 7 client generation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators) documentation. Prisma is pinned to the stable 7.x series rather than the 8.x release candidate.
