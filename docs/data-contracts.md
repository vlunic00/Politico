# Phase 2 database contracts

The initial migration defines the statistical foundation only. Later political and editorial entities are deliberately deferred to their implementation phases.

## Relationships

```text
Topic → IndicatorDefinition → IndicatorObservation ← GeographicArea
DataSource → SourceDataset → SourceRevision → IndicatorObservation
SourceDataset → IngestionRun
SourceDataset → IndicatorDefinition (after verification)
```

An observation's source and dataset are resolved through its immutable revision. This avoids storing conflicting source identifiers in multiple columns. `ObservationInput` in `src/lib/contracts.ts` is the future adapter boundary; its source/dataset IDs must be checked against that revision when an adapter is implemented.

## Definitions and coverage

Topic and indicator identifiers use stable slugs. Definitions have Croatian and English names, units, frequency, geographic coverage, optional source dataset and comparator, interpretation rules, limitations and minimum historical coverage. Every seeded definition is `AWAITING_VERIFICATION`. Candidate definitions and frequencies are planning metadata; dataset dimensions and precise methodology still require source verification.

An indicator may become `ACTIVE` only after its dataset, methodology URL, unit, geographic dimensions, frequency, historical requirements and interpretation notes are verified. `UNAVAILABLE` records a documented lack of suitable data. Do not convert related but different concepts into one series.

## Observations and revisions

- Dates are PostgreSQL `date`; retrieval and publication events use time-zone-aware timestamps. Reference periods are explicit start/end dates.
- Values are `Decimal(24, 8)`. Missing observations are omitted, never coerced to zero. Zero is a valid observation.
- Revision IDs retain historical values. The composite unique key covers indicator, geography, period and revision; queries must deliberately select the published revision instead of aggregating revisions together.
- `publishedAt = null` means staged, not public. Only approved observations with a publication timestamp may be queried for the public data layer in Phase 2.
- `FINAL`, `PROVISIONAL` and `REVISED` statuses remain available. A missing publication date stays null; it is not replaced by retrieval time.
- Each revision records a dataset, content hash, retrieval timestamp and snapshot location. Preserve a licensed snapshot or equivalent reproducible source record.
- Foreign-key deletion uses `Restrict` for sourced records, so deleting a source cannot silently remove observations.

The Zod boundary rejects invalid dates, reversed periods, missing provenance, numeric strings, nulls and non-finite values. Full frequency alignment, source dimensions, unit compatibility, revision publication and anomaly checks must be implemented and tested with the first adapter; the initial contract alone is not an ingestion pipeline.

## Import rules for the first adapter

1. Validate source structure and dataset metadata before staging.
2. Persist source revision and validated staging records in a transaction.
3. Preserve previous published observations when fetching or validation fails.
4. Record run status and separate staged/published counts; suspicious changes require review.
5. Compare only compatible definitions, periods, units and geographies. Use a published EU aggregate.
6. Expose actual publication, retrieval and last-successful-update dates separately.

The seed is transactional and repeatable. It upserts topics and institutions, inserts missing planned indicators without overwriting later verification work, and does not insert or delete observations. The frontend intentionally does not consume the database until those publication rules exist.
