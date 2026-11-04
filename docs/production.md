# Production operations (Phase 8)

The application can be packaged and run locally as a non-root standalone web container. Deployment credentials, a public domain, TLS certificates, hosting and an external alert destination have not been supplied or provisioned. This is an operator runbook, not a claim that a public release has happened.

## Images and durable storage

`Dockerfile` has two targets. `web` contains Next's traced standalone server, public files and static assets. `maintenance` contains the full checkout, Prisma migration/seed tools, Poppler and PostgreSQL 17 clients. The web process does not run PDF parsers, imports or migrations. PDF processing belongs in the separate maintenance container with CPU/memory/process limits (for example `--cpus=1 --memory=1g --pids-limit=128`); keep Poppler and the base image patched. No PDF is accepted through a public upload endpoint.

Builds exclude `.env*`, `.data`, Git history and local walkthroughs. Only the public application name is a build argument. Never pass database, editorial or model credentials as build arguments. Rebuild to change `NEXT_PUBLIC_APP_NAME`; other secrets are runtime configuration. Build on Linux for Linux deployment; Windows standalone output can contain nonportable junctions.

1. Provision PostgreSQL 17 with TLS, a migration owner and a separate application role. Keep the database private. Give the application only the table/sequence privileges it needs; run migrations with the owner. The example local database credentials are not production credentials.
2. Make durable `snapshots` and `programs` directories, owned by the maintenance container's `node` UID (1000), and a separate protected backup directory. Restore all evidence, including accountability snapshots. The web container mounts evidence read-only. Do not store it in an ephemeral hosting filesystem.
3. Create the ignored `.env.production` from `.env.example`. Set the private database URL, exact HTTPS `PUBLIC_ORIGIN` and `EDITORIAL_ORIGIN`, and individual `EDITORIAL_USERS`. Configure model credentials only for maintenance work that needs them. Do not copy developer credentials into a production image.
4. Set `EVIDENCE_DIR` and `BACKUP_DIR` in your shell or an ignored Compose interpolation file to absolute host directories. These are host paths; inside both containers evidence is always `/data/snapshots` and `/data/programs`. Backups are `/backups` inside maintenance. Compose interpolation and `env_file` are separate mechanisms.
5. Build and apply migrations before starting the new web release:

```sh
docker compose -f compose.production.yaml --profile tools build
docker compose -f compose.production.yaml run --rm maintenance npm run db:deploy
docker compose -f compose.production.yaml run --rm maintenance npm run db:seed
docker compose -f compose.production.yaml up -d web
curl --fail http://127.0.0.1:3000/health
```

The production Compose file is standalone; do not merge it into the development Compose file. Its web port binds only to localhost. The named tools profile runs one-off jobs, not a second public web server. Persistent directories must be readable by UID 1000; read-only web mounts protect evidence even if web code is compromised.

Existing databases can contain absolute Windows archive paths or relative paths with Windows separators. Copying their files to Linux does not rewrite those records. On an **isolated restored database**, normalize `SourceRevision.snapshotPath` to `/data/snapshots/<original filename>` and `ProgramDocumentVersion.storedDocumentPath` to `/data/programs/<original filename>` using a reviewed migration. Preserve the basename and content hashes. Run `ops:audit` and download both programs from the deployed application before promoting it. Never bulk-rewrite paths on the original database as part of a restore drill.

## HTTPS and abuse protection

`deploy/nginx.conf` is a host-nginx example with TLS, HSTS, request/body timeouts, a 320 KiB body limit, streaming and separate rate limits for corrections and editorial routes. Install valid certificates at its configured paths and use a DNS name matching both exact origin settings. Validate it with `nginx -t` before reload. It assumes nginx accepts clients directly; if you put a load balancer in front, configure trusted proxy addresses explicitly before using client IP limits. Never trust arbitrary forwarded IP headers. Tune limits using real traffic without retaining political browsing profiles.

Access logging is disabled in the example because request paths can contain comparison selections. Error logging is restricted to critical messages. Review your hosting, CDN and database log/backup retention separately. Restrict `/admin` to maintainers at the network layer when practical. Basic authentication remains for individual trusted maintainers over HTTPS; use an identity provider before widening access. No user token was created by Phase 8.

Next adds `nosniff`, frame denial, a referrer policy, denied camera/microphone/geolocation and CSP restrictions on objects, framing, base URLs and form destinations. This CSP does **not** restrict scripts: Next's inline streaming scripts need a nonce or another separately tested strategy before a strict script policy can be enabled. `strict-origin-when-cross-origin` retains the same-origin `Origin` header needed by form CSRF checks. `no-referrer` was tested and rejected because Chromium sent a null origin for normal POST forms.

Keep search indexing disabled until source/editorial coverage and release checks are approved. Root metadata currently says `noindex, nofollow`. Synthetic preview routes stay explicitly labelled. Missing coverage and staged tourism data must remain visible as limitations.

## Monitoring and source drift

- `/health` is an uncached readiness check: 200 with `{"status":"ok"}` when the application can query `IngestionRun`, otherwise 503 with `{"status":"unavailable"}`. It exposes no connection strings, counts or error details. It does not certify data freshness, every migration, archives or backups.
- `/admin/operations` shows each dataset's latest run behind the same individual authorization and no-store boundary as the existing queues. `/admin/summaries` links to it.
- `npm run ops:status` emits JSON status rows and exits nonzero for missing, failed, running or review-required latest runs. An old successful run can still be stale: compare its timestamp with the source's documented release schedule. This command does not silently declare old data current.
- `npm run ops:audit` checks all retained revision files, dataset/source/methodology HTTPS links, every program version's file/hash/link, the six accountability evidence files and published statistical dataset linkage. It exits nonzero on any issue. This establishes archive identity and structural citation coverage, not the truth of every editorial claim or the present availability of every external web page.
- `npm run sources:check` fetches and parses all configured statistical, register and election sources without writing runs, observations or snapshots. Optional scopes are `statistics`, `parties`, `elections`. Changed histories use existing review guards; identical published statistics skip anomaly re-review just like ingestion. Changed final election results and disappeared registry entries require investigation. A nonzero exit is a review/failure signal, never permission to publish a revision.
- `src/instrumentation.ts` writes a structured `request_error` event with method, route template, time and framework digest. It omits error messages, raw URLs, query strings, headers, bodies and credentials. Hosting/framework logs may still have their own policy; this hook does not sanitize third-party logging.

Configure an external monitor against HTTPS `/health` every minute and alert after three consecutive failures. Run status after every scheduled import, audit nightly and after restores, and source checks before changing adapters. Keep maintenance jobs out of web requests. Schedule imports by source release cadence; alerts and schedules must be connected by the hosting operator. No external notification channel or scheduler was configured in this checkout.

### Known local audit finding

The initial audit checked 45 retained revisions, two program versions and six accountability archives. One old `eurostat:renewable-energy` revision (`cmvmikjn700upioi2hc33z9k7`, hash beginning `3b997fcc`) cannot reproduce its stored hash using the current definition. Older statistical archives omitted the definition that participated in hashing, so this finding cannot distinguish an old definition from changed bytes. Do not replace its hash, delete the archive or call it verified. Recover the original definition/backup and reproduce the hash before signing off the full archive. New statistical snapshots retain their exact definition without changing the existing hash calculation or rewriting old evidence.

Live checks parse all configured endpoints. Tourism remains staged for pandemic-era anomalies. The first checker also flagged unchanged reviewed regional migration anomalies; it now recognizes identical published revisions before applying change guards. Replay fixtures are actual archived Eurostat population and DZS net-wage responses, with synthetic mutations for dimension, unit, category, missing-history and revision drift.

## Backups and restore

PostgreSQL and evidence must be backed up together. Pause **all** imports, program processing, editorial review and correction submissions while creating a coordinated backup. Block POST traffic/put the service into a maintenance window, wait for in-flight writes, stop scheduled jobs, and leave read-only traffic available only if no writer remains. `--writers-paused` records the operator's assertion; the script cannot detect every external writer.

```sh
docker compose -f compose.production.yaml run --rm maintenance npm run ops:backup -- /backups/2026-11-04 --writers-paused
docker compose -f compose.production.yaml run --rm maintenance npm run ops:backup -- /backups/2026-11-04 --verify
```

The parent backup directory must already exist; the dated destination must not. The script makes a custom-format PostgreSQL dump, copies snapshots and programs, records a SHA-256 inventory and verifies it. It rejects symlinks, duplicate/escaping manifest paths, missing/extra/corrupt files and destinations inside evidence. It never overwrites a backup. Failed jobs leave an incomplete directory without a success manifest for investigation. A manifest is not an authenticity signature; protect both it and the bytes. A usable checksum does not prove the dump restores.

Use a PostgreSQL client at least as new as the server (the maintenance image supplies 17); see the official [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) and [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html) references. The script removes Prisma's `schema` URL parameter; `pg_dump` backs up the **whole database**, including editorial private reports, roles' owned data and migration history, not just one Prisma schema. Passwords are passed through `PGPASSWORD`, not process arguments. It does not back up PostgreSQL cluster roles or TLS/provider secrets. Keep those separately in your secret-management system. Do not use unsupported provider/Prisma URL query parameters with libpq; use an operator-approved direct backup connection if needed.

After a successful job, resume writers, encrypt the backup, copy it off-host and verify that copy. Suggested initial policy: daily backups, seven daily and four weekly encrypted copies, quarterly restore drills, 24-hour recovery point objective. Adjust this to actual operational needs. No automatic retention/deletion or off-host destination is configured by the script. Raw correction reports have no automated retention policy yet; agree on that before opening anonymous intake publicly. Back up Git release ID, migrations, source manifests and deployment configuration alongside the protected evidence backup, without publishing secrets.

Restore into a **new isolated database**, never over the running database. Set libpq connection variables from your secret manager, then run the following against that explicitly verified destination (a value from `PGDATABASE` is a database name, not a URL):

```sh
pg_restore --dbname="$PGDATABASE" --no-owner --no-acl --exit-on-error --single-transaction /backups/2026-11-04/database.dump
```

Restore `snapshots/` and `programs/` to new empty durable directories, preserve originals, reconcile stored paths as described above, and run backup verification, `ops:audit`, `prisma migrate status`, `/health`, representative sourced pages and document downloads against the restored instance. Compare source revision/program counts and retained audit history. Resolve the known legacy hash finding separately; a successful restore cannot repair an unverified original. Only then consider switching traffic. Keep the old instance and backup for rollback.

## Migrations and rollback

1. Review additive SQL in Git and test it on a restored staging database. All committed migrations must apply to a fresh database; isolated PostgreSQL suites exercise this.
2. Take and verify a coordinated backup. Ensure a restore drill has succeeded. Acquire one deployment lock in your release system; do not run concurrent migration jobs.
3. Run `npm run db:deploy` using the migration role, then the repeatable metadata seed. Never use `migrate dev`, `db push`, `migrate reset` or volume deletion on production.
4. Deploy the tested image by immutable digest, set runtime secrets, check readiness, source pages, private authorization, correction forms and program downloads. Rebuild the public app name at build time.
5. Roll the web image back only if it remains compatible with the migrated schema. Prisma does not automatically reverse committed migrations. Use a forward corrective migration; for data loss, restore to a new database and switch traffic after verification. Never reset the running database to make a migration appear successful.

## Verification and release limits

GitHub checks install from the lockfile on Linux, apply migrations/seed, run lint/type/unit and isolated database suites, build, run Phase 8 desktop/mobile smoke checks plus the isolated editorial suite, and build the web image. They avoid live source imports and public synthetic records. The full local public browser suite additionally uses the existing imported database; CI's small fixture database cannot claim that coverage. The workflow itself still needs its first hosted run.

Charts defer the Recharts renderer until the plot is within 300 pixels of the viewport. Tables/captions are server rendered and remain outside the deferred module. The fixed 288-pixel plot container reserves space. Existing chart tests scroll plots into view before asserting lines; keyboard tests wait for streamed content to be visible after navigation. Do not treat a bare `rows.count()` immediately after navigation as a settled UI check.

Automated keyboard tests cover the skip link, tab order to chart controls, Space to expand/collapse, table column/row semantics and accessible missing-value text on desktop/mobile Chromium. Existing axe checks cover the public and editorial pages. Accessibility-tree inspection is not a manual NVDA/VoiceOver test. A no-JavaScript experiment found Next's streamed content can remain in hidden fragments: full no-JavaScript usability is not claimed. Test NVDA/Chrome and VoiceOver/Safari, zoom, reduced motion and real mobile devices before public accessibility signoff. Source links and actual political claims still need ongoing human source review.

Local verification completed on 4 November 2026: 89 unit/database cases on Linux, 50 public browser cases and eight editorial browser cases passed. Both container targets built; nginx syntax and production Compose configuration validated; the coordinated 55-file backup verified and its database restored in isolation. The standalone web smoke covered sourced routes and a published PDF, and a separate unconfigured container returned the expected generic 503 readiness response. The restored database still needs a complete deployment smoke test after archive-path normalization. The legacy hash finding remains an explicit audit failure.
