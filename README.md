# Croatia Political Observatory

Phase 1 of [the development guide](./Development%20guide.md): a Croatian, responsive Next.js frontend with explicit empty states and a PostgreSQL foundation for Phase 2. No live political or statistical data are published.

## Local development

Requires Node.js 22.12+ (Node 24 LTS recommended), npm, and Docker Desktop with the Linux engine for the optional local database.

```powershell
npm ci
Copy-Item .env.example .env
docker compose up -d --wait
npm run db:deploy
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. The frontend also runs without PostgreSQL; it reads the planned catalogue and renders unavailable states. Do not overwrite an existing `.env` when repeating setup. `npm ci` generates the Prisma client without requiring a database connection.

Change `NEXT_PUBLIC_APP_NAME` in `.env` to rename the platform. Restart the development server after changing environment variables. The default interface is `hr-HR`; navigation messages are in `src/lib/i18n.ts`. English is reserved in the language control until the full translation is available.

The Compose database binds only to localhost. The credentials in `.env.example` are local development credentials. Use a separate PostgreSQL connection and credentials for hosting. `docker compose stop` preserves the database volume. Do not use `docker compose down --volumes` unless you intend to erase the local database.

## Implemented

- Next.js App Router, strict TypeScript, React, Tailwind v4, shadcn/ui, Lucide and Recharts.
- Desktop navigation rail, mobile navigation, search, configurable branding and Croatian interface.
- Dashboard with eight indicator cards, EU comparison layout, government card, topic explorer, political landscape and election empty states.
- All 16 topic categories and 32 planned indicator definitions, with deep links, units, frequency and availability.
- Topic, government and political party profile templates, consistent source disclosures, loading, error and 404 states.
- Source catalogue and public methodology; explicit uncertainty without inferred government composition, dates, party positions or statistics.
- A synthetic chart preview at `/preview` and a neutral party layout preview at `/parties/preview`. Neither represents actual records.
- Prisma schema, initial migration and repeatable metadata seed. Revisions and observations are separate; no observations are seeded.
- Vitest tests and desktop/mobile Playwright tests, including automated WCAG checks.

## Routes

| Route                                      | Phase 1 behavior                                                   |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `/`                                        | Dashboard with unavailable values                                  |
| `/topics`                                  | Category catalogue and coverage counts                             |
| `/topics/[slug]`                           | Definitions, empty chart and source state                          |
| `/government`                              | Government detail template without unverified names                |
| `/government/history`                      | History empty state                                                |
| `/parties`                                 | Directory empty state                                              |
| `/parties/preview`                         | Explicitly labelled profile template                               |
| `/compare/parties`, `/compare/governments` | Honest empty states for later phases                               |
| `/elections`, `/regions`                   | Navigation destinations with later-phase availability              |
| `/sources`, `/methodology`                 | Source catalogue and publication rules                             |
| `/search?q=plaće`                          | Server-rendered catalogue search, including diacritic-free queries |
| `/preview`                                 | Interactive synthetic chart with accessible table                  |

Unknown topic and party records return HTTP 404. There is no administrative interface or authentication in Phase 1; `/admin` returns 404. Development pages request that search engines do not index them. Review the robots metadata before a public release.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts the production build on port 3100; build first. It checks desktop Chrome and a Chromium mobile viewport, source/empty states, navigation, search, synthetic chart controls, real 404s, horizontal overflow and automated WCAG 2.2 AA rules. Screenshots and failure traces go in ignored `test-results/`. Automated checks do not replace manual screen-reader or real-device testing.

## Database and next phase

```powershell
# Apply committed migrations (also used on a fresh local database)
npm run db:deploy

# Create a migration after intentionally changing the Prisma schema
npm run db:migrate -- --name describe_change

# Seed catalogue metadata; safe to repeat, no observations are deleted
npm run db:seed
```

See [database contracts](./docs/data-contracts.md) and [coverage](./docs/coverage.md). Data adapters and import commands are intentionally deferred to Phase 2. The UI catalogue is static in Phase 1; database changes alone will not populate the dashboard. The party register, government history, AI summaries, admin, elections, regional maps, scheduling, S3 and deployment belong to subsequent phases.

Framework setup follows the official [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [shadcn/ui installation](https://ui.shadcn.com/docs/installation/next), and [Prisma 7 client generation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators) documentation. Prisma is pinned to the stable 7.x series rather than the 8.x release candidate.
