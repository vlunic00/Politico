# Phase 4: political party directory

## Sources and coverage

The ministry's [official register dataset](https://data.gov.hr/ckan/hr/dataset/registar-politickih-stranaka-republike-hrvatske) publishes the [party JSON export](https://data.gov.hr/ckan/dataset/197ea086-e03b-42d1-b3c1-0496c85faf1e/resource/1a766609-e55d-4c13-ad0c-7bd409496d34/download/data.json), resource `1a766609-e55d-4c13-ad0c-7bd409496d34`, under Otvorena dozvola RH. Imported on **1 November 2026**: **436 records, 157 `AKTIVAN`, 279 `PRESTANAK`**. Counts describe this snapshot, not a promise of live updates. The personal-representative and branch datasets are not used.

`SBT_ID` is the stable identity. Registry book/number, exact name, supplied abbreviation, registration date, status/date and seat are retained. Missing dates and addresses stay null. The export contains 13 ceased records without a cessation date; status remains authoritative without inventing a date. Tax numbers are not copied into application tables.

The explicit identity crosswalk in `src/lib/parties/catalogue.ts` connects the existing 21 parliamentary profiles to registry IDs. Existing profile slugs and dated display names remain stable; profiles separately display the exact registry name. New records use `registar-<SBT_ID>`, so renames and duplicate abbreviations cannot collide. Unknown new records need no rebuild to become discoverable.

Parliamentary membership and leadership retain their 24 October verification date and 24 August Sabor reference table. Coalition participation uses separately sourced Phase 3 evidence; unverified parties are not automatically called opposition. Existing orientation labels remain sourced self-descriptions, with no inferred labels for other parties.

Selected historical participation is connected to [DIP's official 2024 V-constituency publication in Narodne novine](https://narodne-novine.nn.hr/clanci/sluzbeni/2024_04_50_857.html). It identifies joint lists separately from parties. It does not allocate coalition votes/seats to individual parties and does not claim to cover every contestant or constituency. Missing participation evidence stays unverified. Future parliamentary, presidential, European and local contexts have no inferred candidacies. Comprehensive historical result imports remain Phase 6.

## Registry persistence and imports

```powershell
npm run db:deploy
npm run parties:import
```

`Party` holds stable identity/slug; each `PartyRegistration` belongs to an immutable `SourceRevision` and published whole-register snapshot. The existing source, dataset, revision and ingestion-run models retain provenance. Raw JSON is hash-addressed in `DATA_SNAPSHOT_DIR`; each live check also retains the CKAN resource metadata. Its timezone-unspecified update timestamp is preserved verbatim rather than presented as a publication date.

The importer validates statuses, real dates, identifiers and book/number uniqueness. It refuses empty/malformed exports, initial exports below 100 records, disappearing existing identities and reappearing older revisions. A future genuine removal/reorganization requires source review and an adapter change; it is never treated automatically as a cessation. A failure records its reason without changing published registrations. Per-dataset advisory locks and transactions make concurrent/repeated imports idempotent. New source revisions preserve old names/statuses. Seeds never erase them.

Snapshot writes use an atomic hard link from a completed temporary file and check existing hashes; archive storage must support same-directory hard links. No imports or document retrieval run on page loads. Scheduling remains later work.

## Programs: upload, review, publish

Only maintainers with shell/database access can write program records. There is no unauthenticated upload endpoint. Upload a local PDF and a metadata JSON file; the metadata must identify the canonical party ID, exact original HTTPS URL, title, context, language, known publication date (or null), and optional page-cited quotations. See [the Možemo! metadata](./programs/mozemo-2024.json) and [the SDP metadata](./programs/sdp-2024.json).

```powershell
# Download the official original to a local file, then stage it:
npm run parties:program -- --file path/to/program.pdf --metadata path/to/metadata.json

# Inspect the original, context, publication date and each cited PDF page.
# Publish the returned version ID, identifying the actual reviewer:
npm run parties:program -- --publish <version-id> --reviewer "Reviewer name"
```

Uploads accept PDFs up to 20 MB and reject invalid magic bytes, unsafe source URLs, malformed dates or duplicate/invalid topic citations. The original file, SHA-256, retrieval time and metadata revision hash are retained. Identical uploads reuse a version; changed bytes **or metadata** create a new draft version within the party/context. A transaction and advisory lock allocate version numbers. Existing published versions and their source metadata are not overwritten.

Explicit publication hash-checks the archived bytes and records `ProgramReview` with the reviewer and time. A draft is excluded from all public queries and downloads. Publishing an older unpublished version behind a newer published one is refused. Repeated publication does not duplicate review events. These are original documents and verbatim excerpts, not AI-generated summaries; the later AI workflow still requires human approval.

The initial archived documents are [Možemo!'s 2024 national program](https://mozemo.hr/wp-content/uploads/2024/04/A4-program-2024b.pdf) and [SDP's 2024 program on its official archive](https://arhiva.sdp.hr/wp/wp-content/uploads/2024/03/sdp_program_2024.pdf). Their selected housing excerpts were checked against complete PDF pages 44 and 48, respectively, using text extraction and rendered-page inspection. The initial source reviewer is recorded as Codex, without claiming human review. Exact publication days were not verified and remain null. The current SDP host returned 403; the official archive supplied the original PDF. The linked HDZ 2024 campaign site could not be retrieved, so no substitute program was published for that party. This is incomplete program coverage, exposed equally by the UI.

Reproduce the initial staging after downloading those URLs:

```powershell
npm run parties:program -- --file path/to/mozemo-2024.pdf --metadata docs/programs/mozemo-2024.json
npm run parties:program -- --file path/to/sdp-2024.pdf --metadata docs/programs/sdp-2024.json
```

Archived bytes use `PROGRAM_DOCUMENT_DIR` (default `.data/programs`). Public downloads derive filenames from validated SHA-256 hashes, verify bytes, and return PDF attachments with `nosniff`. They never accept filesystem paths from a request. Unsupported write methods return 405. A missing/corrupt archive returns 503 while the original-source link remains available on the profile. Keep this directory, statistical snapshots and PostgreSQL backed up together on durable storage; deployable object storage is later work.

## Public behavior and validation

- Directory search handles Croatian diacritics, alphabetical ordering and pagination. Registry, dated parliamentary, government and election statuses are independent filters preserved in the URL. Ceased records remain discoverable.
- Profiles use one template, including registration provenance, available leadership/classification, original programs, every published version, historical participation evidence and explicit unknowns.
- Comparisons accept up to four distinct parties, allocate equal column widths and require an explicit program context. They show original documents before any excerpts, cite PDF pages and retain unknown topics. A missing reviewed excerpt is not described as proof that the original program omits the topic. There are no political scores or recommendations.
- Database/source failures preserve published records. With no database configured, the older parliamentary overview remains explicitly separate from an unavailable register. Proxy validates dynamic party identities before streaming; database outages return 503 rather than false 404s.

Run `npm test`, `npm run test:parties`, `npm run test:ingestion`, `npm run build`, then `npm run test:e2e`. Database tests use random isolated schemas, apply every migration and remove only their own schema/archive directory. Tests cover trust-boundary validation, idempotency, concurrency, failed/partial sources, preserved names/statuses, draft publication rules, archive integrity, version retention, public downloads, nonparliamentary discovery, status separation, equal comparison columns, citations, keyboard-scrollable tables and automated accessibility.

Phase 5 is next: document extraction, grounded summaries, evidence validation and an authenticated editorial-review workflow. A broad program backfill and full election-history coverage are not claimed by Phase 4.
