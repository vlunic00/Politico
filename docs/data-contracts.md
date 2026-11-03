# Statistical database contracts

The statistical foundation is PostgreSQL and Prisma. Phase 4 adds sourced party registrations and immutable program versions; see [party data contracts](./party-directory.md). Dated government, parliamentary and leadership editorial records retain their separate sources.

Phase 5 adds `ProgramExtraction` (page text/hash per source version), `ProgramSummary` (generation provenance, original JSON, editable draft, review status and approved editions), and append-only `SummaryReview` snapshots. All summaries require Croatian (`hr-HR`) and exact source quotations; only approved records are public. See [summary contracts and editorial authorization](./program-summaries.md). The migration is additive and preserves existing sources, programs and observations.

Phase 6 adds `Election`, immutable `ElectionPublication` records tied to source revisions, and per-area `ElectionContest` typed JSON. Regional indicators reuse the observation platform with explicit geography allowlists and minimum history for every configured county. Election dates/rounds, candidate/list votes, minority multi-selection rules, result status, confirmed party/proposer identities and publication provenance remain distinct. See [election and regional contracts](./elections-regions.md). The new migration is additive.

```text
Topic → IndicatorDefinition → IndicatorObservation ← GeographicArea
DataSource → SourceDataset → SourceRevision → IndicatorObservation
SourceDataset → IngestionRun
```

## Publication and revisions

`ObservationInput` in `src/lib/contracts.ts` validates finite numeric values, provenance, ISO dates and complete calendar-aligned annual, quarterly or monthly periods. Missing observations are omitted; zero is a value. Adapters verify source-specific dimensions, frequency, units, geography and structure before storage. Source/dataset relationships come from the configured revision, not external payloads.

Every source selection has a stable dataset ID (`eurostat:<indicator>` or `dzs:<indicator>`). Snapshots contain the exact URL, POST body when applicable, metadata and raw response. SHA-256 covers the definition, request, metadata and response; retrieval timestamps are excluded so reruns are idempotent. Existing snapshot files are hash-checked before reuse. `DATA_SNAPSHOT_DIR` must be durable for production imports.

An ingestion run records start, finish, state, staged count, published count and error/review reasons. Network/parse/validation failures do not modify observations. A transaction, protected by a per-dataset PostgreSQL advisory lock, persists an immutable revision and observations, then publishes only if checks pass. Concurrent identical imports create one revision. An older previously published snapshot reappearing is flagged rather than treated as a successful current update.

`publishedAt = null` means staged and never public. Public queries select the newest **whole published revision** for each active indicator, then read published observations from that revision. They do not merge revisions or silently backfill missing history from an old revision. Older published and staged records remain available for audit.

Large revisions, missing historical cells, short Croatian histories, large time-series changes and regressing upstream timestamps require review. Empty imports always fail. A maintainer can inspect a revision with `npm run data:import -- --review <id>` and publish it with the additional `--publish` flag. Publication creates an explicit review entry in ingestion history. Minimum history, matching definitions and protection against publishing behind a newer retrieval still apply. There is no public review endpoint.

## Metadata

- Values use `Decimal(24,8)`; period boundaries and publication dates use PostgreSQL `date`.
- Retrieval, source update, ingestion and publication events use timezone-aware timestamps.
- `SourceRevision.sourceUpdatedAt` is the upstream dataset update timestamp, **not** an observation publication date.
- Unknown original publication dates stay null and are never replaced by retrieval time.
- Last successful check comes from the latest successful ingestion run, including unchanged responses. Current failed/review state is separately visible in the source catalogue.
- `sourceFlags` preserves raw flags, including estimates and breaks. `p`/`e` map to provisional, `r` to revised. `FINAL` means no provisional/revision marker was supplied, not that future revision is impossible.
- Foreign keys restrict deletion of sourced records. Imports and seeds never delete observations.

The additive Phase 2 migration adds upstream update timestamps and raw flags without resetting foundation tables. The seed inserts missing definitions and preserves verification work and observations.

## Comparisons

Croatia and the published `EU27_2020` aggregate must have identical period boundaries, frequency, unit and methodology version. Different-definition flags suppress comparisons. A missing current EU period stays missing; an older EU value is never relabelled as current. Charts insert null points for missing periods without interpolation or lines across gaps.

Changes compare with the same period one year earlier, require the same methodology, and are suppressed across flagged breaks/different definitions. Rate differences use percentage points; Gini uses points. Level/index changes use percentages and reject a zero denominator. Population is explicitly the count on 1 January, not a calendar-year average. No trend colors or government scores are inferred from numerical direction.

See [source definitions](./statistical-sources.md) and the generated [coverage report](./coverage.md).
