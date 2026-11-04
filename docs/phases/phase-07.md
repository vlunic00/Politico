# Phase 7: building a public accountability workflow

Implemented on 4 November 2026. This is the first phase walkthrough; earlier phases have their existing technical documentation, but their development history has not been reconstructed.

This document explains the actual implementation and verification process, including the unsuccessful attempts. The aim is to show how to make decisions in an existing application, not just list the finished files.

## 1. Establish the starting point before changing code

I first read `AGENTS.md`, `README.md`, the Phase 7 requirements and the sections on political profiles, commitments, administration and neutrality in `Development guide.md`. I inspected the file tree, package scripts, Git status and recent commits. The tracked working tree was clean at the start.

The application already separated three different kinds of information:

- Statistical observations flow through validated source adapters into PostgreSQL. They have immutable source revisions and explicit publication.
- Selected government facts are dated editorial records in the repository. Git preserves their change history.
- AI program summaries use private database drafts, individual editorial accounts and a separate reviewer role.

That distinction matters. A small, explicitly dated parliamentary dossier can use the government-history pattern. Anonymous feedback, however, needs persistent storage and authorization; it cannot live in a source file or browser state.

I read the installed Next.js route-handler and form documentation under `node_modules/next/dist/docs/01-app/`. In particular, route `params` are asynchronous, and a mutation must check authorization itself even when its containing page is protected. I used the existing Route Handler/form convention rather than introducing another API style.

The implementation reused Zod, Prisma, PostgreSQL advisory locks, `boundedResponse`, editorial authentication, the page heading, source disclosure patterns and the existing design tokens. No dependency was added.

## 2. Turn the milestone into concrete work

Phase 7 requires financing, parliamentary activity, commitment tracking, corrections and more indicators. The initial implementation reaches each requirement with a stated coverage boundary:

| Requirement | Delivered coverage |
| --- | --- |
| Political financing | All 34 recipients in Sabor's 2024 regular national-budget funding report; allocated and paid amounts separately |
| Parliamentary activity | Four institution-level measures for 15 January–15 July 2026, plus a separately dated confidence-vote record |
| Commitment tracking | One documented government-program commitment with its original wording, two monetary targets, evidence chronology and related indicator |
| Public corrections | Anonymous submissions, private editorial queue, reviewer decisions, audit records and a public accepted-corrections log |
| Indicator expansion | COFOG education and defence expenditure, annual Croatia/EU-27 histories |

This is initial source coverage, not a claim to cover all finances, all parliamentary acts or every party's commitments. Missing donations, campaign expenses and individual votes are explicitly unavailable. There is no overall political score.

The change had to reach more than the new pages: navigation and Croatian strings, global search, party-profile links, the sources catalogue, methodology, database schema/migration, CLI scripts, browser-server environment configuration, unit/integration/browser tests and project documentation.

## 3. Find primary evidence and preserve its scope

I checked official sources rather than filling gaps from general political knowledge:

- [Sabor's financing report page](https://www.sabor.hr/hr/odbori-i-povjerenstva/ostala-aktivnost/izvjesce-o-iznosu-rasporedenih-i-isplacenih-sredstava-iz-3) links the two-page financial table.
- [Sabor's activity overview](https://www.sabor.hr/hr/press/javnost-rada/pregled-rada-hrvatskoga-sabora-u-11-sazivu-od-15-sijecnja-do-15-srpnja-2026) contains both a half-year section and a whole-term section. Only the half-year measures were selected. Combining those scopes would misstate the reference period.
- [The confidence-vote record](https://www.sabor.hr/hr/sjednice-sabora/predstavljanje-vlade-republike-hrvatske-i-glasovanje-o-povjerenju-vladi-republike-8) supports an institutional event. It does not by itself establish every member's individual vote.
- [The original government program](https://vlada.gov.hr/UserDocsImages/ZPPI/Dokumenti%20Vlada/2024/Program_16_Vlade_RH.pdf?vel=989567) identifies the commitment and its shared government ownership.
- [The 2026 minimum-wage regulation](https://narodne-novine.nn.hr/clanci/sluzbeni/2025_10_132_1931.html) and [the ministry's 2027 announcement](https://mrosp.gov.hr/vijesti/donesena-uredba-o-visini-minimalne-place-za-2027-godinu/14162) support dated official actions. A future effective period is not a current wage payment.
- [Eurostat's COFOG metadata](https://webgate.ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm) defines the additional expenditure series.

Sources have separate publication and retrieval fields. An event date, a year in a title and the date we downloaded a document are not interchangeable.

## 4. Investigate the scanned financing PDF

### Failure: text extraction produced no table

I downloaded the financial report and ran `pdftotext -layout`. The output consisted only of page breaks. The PDF is an image scan, so it has no usable text layer. An extractor returning no text does not mean that no financial activity was reported.

I rendered both pages with `pdftoppm`, inspected the images and transcribed the two columns. Each row retains its PDF page. Amounts are integer euro cents, so addition is exact and cannot introduce a floating-point rounding error. Croatian currency formatting is applied only for display.

### Failure: the first reconciliation stopped the dossier from loading

The first schema required the rows to sum exactly to each printed total. Both the archive command and the new unit-test suite failed with `Finance allocatedCents does not reconcile`.

I calculated each sum and rechecked the entries against the images:

| Measure | Amount |
| --- | ---: |
| Sum of allocated rows | EUR 9,740,919.01 |
| Printed allocated total | EUR 9,740,919.00 |
| Sum of paid rows | EUR 9,740,919.06 |
| Printed paid total | EUR 9,740,919.06 |

There are two different discrepancies: the printed allocated total is one cent below its rows, and the two printed totals differ by six cents. Neither is evidence of wrongdoing, and neither should be silently removed.

The fix was to preserve the source rows and printed totals, add an explicit signed reconciliation entry of minus one cent for the allocated column, and explain it publicly. Validation still checks exact arithmetic: `sum(rows) + documented discrepancy = printed total`. Changing a row without updating the documented evidence continues to fail. Tests lock down these specific values.

### Source problem: the report's date is inconsistent

The scan prints 18 February 2024, reports the full 2024 year, and has document identifiers referring to 2025. I did not substitute a guessed 2025 publication date. The publication field remains `null`, and the source note explains the conflict.

The table preserves historical recipient names and independent-member status. It does not fuzzy-match those names to today's party identities. A similarly named organization is not sufficient proof of continuity.

## 5. Define a small, validated editorial dossier

The records are in `src/lib/accountability/records/2026-11-04.json`. `contracts.ts` validates them, and `data.ts` exports the parsed result. This deliberately follows the existing dated government-history pattern instead of adding a second database publishing system for a small editorial dataset.

Validation rejects missing source references, duplicate identities, reversed reference periods, unsupported source hosts, future-dated evidence, financial sums that do not match the documented discrepancy, action/implementation states without evidence and an overdue state without an actual past deadline.

This has a defined limit, recorded in a `shortcut:` comment: changes require code review and a build. If this grows into a regularly maintained editorial catalogue, move the dossier into authenticated database drafts and publication history. Do not add that second system until there is enough content and editorial use to justify it.

## 6. Archive the evidence without rewriting history

`scripts/archive-accountability.ts` fetches the dossier's six official sources on initial creation. It restricts redirect destinations, bounds response sizes, checks the response format and uses SHA-256 to address the stored bytes. Files are written exclusively, so an existing archive is verified rather than overwritten.

The manifest is committed beside the dossier as `2026-11-04.sources.json`. It records source identity, URL, content hash, original retrieval timestamp and archive filename. Raw files remain under `DATA_SNAPSHOT_DIR/accountability` (normally `.data/snapshots/accountability`). Back up that directory: a Git manifest is proof of identity, not a backup of the bytes.

### Failure: a live HTML hash changed during a repeat run

The first archive implementation fetched every URL on every invocation and compared the new bytes with the pinned hash. The second run rejected Sabor's activity page even though the evidence had already been archived successfully. Inspection found generated `js-view-dom-id` values and `/index.php/` navigation-link variants in the HTML. Whole-page byte changes do not, on their own, establish changes to the article's facts.

The fix was to clarify the command's job. Initial creation fetches and pins evidence; repeat runs verify the existing local archive and preserve its retrieval dates. They do **not** refresh the dossier. New factual coverage requires a new dated dossier and manifest, with the previous versions retained. We keep exact raw hashes; we do not weaken integrity checking by stripping arbitrary HTML before hashing.

The completed archive run retained six files, and the revised repeat run verified all six without network refresh.

On another machine, restore the archive from backup before verifying the pinned manifest. The public pages can render from the committed records and manifest, but those files cannot reconstruct a missing original HTML snapshot.

## 7. Model a commitment without inventing a verdict

The first record concerns average net and minimum gross wages in the 2024–2028 government program. I extracted PDF page 9 to verify the quotation and page reference; the printed page number is 7. PDF positions and printed page numbers often differ, so the record explicitly uses the PDF position.

The record stores the original wording, shared government owner, government identity, program version/source, topic, targets and units, deadline uncertainty, evidence chronology, related statistical indicator and limitations.

The status is “official action identified.” The evidence concerns changes to minimum gross wages; it does not prove the average-net-wage target or completion of the whole commitment. The linked DZS average-net-wage series has a separate population and NKD 2025 methodology. No fulfilment percentage is calculated from incompatible definitions.

The program horizon is 2028, but the quoted text does not give a precise day. `deadline` remains `null`, with a human-readable explanation. Automatically inserting 31 December and declaring a broken promise afterward would add precision the source does not contain.

The supported descriptive states are documented, action identified, implementation evidence available, deadline passed and evidence insufficient. A reviewer changes the dated dossier when evidence changes; the UI does not automatically infer a verdict from an indicator value or the current clock.

## 8. Add persistence for public corrections

The additive migration `20261104120000_public_corrections` creates two tables without touching existing observations, political records or program documents:

- `Correction` stores the submitted page path, disputed claim, proposed correction, evidence URL, deduplication fingerprint, time and current status.
- `CorrectionReview` stores the authenticated actor, decision, private explanation, optional public explanation/source and time.

Database constraints restrict status values and require public fields on accepted decisions. A rejected review cannot accidentally retain public text. The relation restricts deletion of a correction with review history. The application exposes no edit/delete path for concluded reviews; this is application-level history, not protection against a privileged database administrator.

I regenerated the Prisma client, validated the schema, applied the migration to the local database and reran the metadata seed. The seed is repeatable and does not create or remove observations.

### Submission path

The public form posts to `/corrections/submit`. It uses the existing native form and Route Handler approach, so submission does not depend on client JavaScript.

The handler checks an exact configured origin, accepts only the expected form encoding, reads a bounded body, rejects repeated fields and validates the schema. The page path must be an internal path, optionally with a fragment. Query strings are excluded so the application does not retain party-comparison selections as feedback metadata. Evidence links must use HTTPS and contain no credentials; the server never fetches a submitted link.

No name, email, IP-address field or political profile is stored by this feature. Users are asked not to include personal details in free text. Hosting/access-log policy remains a separate deployment responsibility.

The database transaction serializes submission checks. Identical normalized content within 24 hours returns the existing report rather than creating another row. A shared limit of 30 new reports per hour is checked in PostgreSQL, so restarting a server or running multiple workers does not reset it. A hidden form field supplies a small additional bot check.

This shared limit is intentionally basic and can be exhausted by an attacker. Edge abuse protection is a production task; no IP retention or CAPTCHA dependency was added here.

### Review and publication path

`/admin/corrections` uses the existing individual editorial accounts. Proxy protects the page, and the POST handler independently checks credentials, the reviewer role and the configured origin. An editor can read reports but cannot conclude them.

A reviewer first checks the evidence and applies the actual source/code/data correction through the appropriate existing workflow. Acceptance then requires a private note, public explanation, verified source URL and explicit confirmation that the change was applied. This confirmation is a human assertion; the application cannot independently verify an arbitrary external editorial change.

The review transaction locks the correction, checks it is still pending, inserts the review and updates the status together. If two reviewers submit simultaneously, only the first decision succeeds. A stale form cannot rewrite the concluded decision.

The public log selects only the approved public explanation, verified source, affected page and decision time. It does not send the submitted claim, proposal, fingerprint, private note or reviewer identity to the public page. Rejected and pending reports stay private. Both queues currently show the latest 100 records; pagination and a retention policy are future operational work.

If PostgreSQL is unavailable, the form is disabled with an explicit message. The mutation returns an unavailable response rather than pretending to have saved the report.

## 9. Expand indicators through the existing pipeline

I added two definitions to `seriesDefinitions`, using Eurostat `gov_10a_exp`:

| Dimension | Education | Defence |
| --- | --- | --- |
| Frequency | `A` | `A` |
| Unit | `PC_GDP` | `PC_GDP` |
| Sector | `S13` | `S13` |
| Transaction | `TE` | `TE` |
| COFOG function | `GF09` | `GF02` |
| Geographies | `HR`, `EU27_2020` | `HR`, `EU27_2020` |

The defence indicator already existed in the planned catalogue; I connected it rather than creating a duplicate. Education spending needed one new catalogue entry. Existing adapters, revision storage, anomaly checks, charts and government comparisons handle both series without a new ingestion framework.

Both series express shares of GDP; changes are percentage points. Neither higher education spending nor higher defence spending automatically establishes a better outcome. COFOG defence is also not NATO's expenditure definition. Those limitations are visible with the series.

Both live imports succeeded without review flags and published 20 observations each. Regenerating `docs/coverage.md` reported 47 definitions: 35 active (33 national and two regional), and 12 awaiting verification. Tourism remains staged; these imports did not publish it.

## 10. Connect the features to the existing interface

The new `/accountability` page uses the existing shell, typography and source-link style. Financing has row headers, a caption, separate totals and per-row PDF references. On narrow screens its table scrolls inside a keyboard-focusable labelled region. Parliamentary measures state their institution and reference period. Commitments show the source before the interpretation.

I added a navigation entry and Croatian/English navigation strings, searchable section links, a financing link in every real party profile, source hashes and retrieval dates in `/sources`, the corrections link in the footer, a connection between both editorial queues and the public methodology explanation. Existing party profile rendering remains shared across parties.

`PUBLIC_ORIGIN` controls anonymous correction submissions and falls back to `EDITORIAL_ORIGIN` for existing local setups. Both Playwright servers set their own exact public origin. This prevents development port 3000, public-test port 3100 and isolated-editorial port 3101 from being treated as interchangeable trusted origins.

## 11. Verify behavior and investigate failures

### Unit and database checks

Unit tests cover financial reconciliation, source manifests, invalid references/states/dates, internal links, search, COFOG dimension selections, hostile correction inputs and incomplete review decisions.

The new isolated PostgreSQL suite creates a random schema, applies every committed migration, exercises real transactions, and removes only that schema afterward. It checks concurrent deduplication, role enforcement, incomplete acceptance, competing decisions, public/private field separation, rejection, the shared rate limit and deduplication expiry. Synthetic records never enter the application's public schema.

I also ran the existing statistical-ingestion, party and election integration suites because the new migration is applied by all of their test setups. All passed.

### Failed browser assertions: selectors must match actual behavior

The first new indicator-browser test expected a link named “Izvorni skup podataka.” The existing source component actually uses “Izvorna objava” inside a closed disclosure. Both desktop and mobile failed. I corrected the test to open “Izvor: Eurostat,” then assert the real link points to `gov_10a_exp`. The UI did not need to be renamed to satisfy a mistaken test.

The first correction-review browser test selected every `role=alert` on the page. Next.js also inserts a route-announcement alert, so Playwright found two elements and rejected the ambiguous locator. Scoping the assertion to the main content fixed the test while retaining the accessible framework announcer.

### Actual layout bug: the original overflow assertion gave a false pass

The initial full public browser suite passed all 44 tests. I then inspected the desktop and mobile screenshots. The mobile image had a blank strip on the right, despite the passing overflow check.

The check compared document scroll width to `window.innerWidth`. In the emulated mobile browser both had expanded to 514 pixels while the actual layout viewport was 390 pixels. Comparing two expanded values proved nothing about the intended viewport.

I replaced the new page's assertion with:

```ts
document.documentElement.scrollWidth <= document.documentElement.clientWidth
```

It immediately failed on mobile: scroll width 514, viewport 390. Geometry diagnostics identified the `sr-only` spans inside the financing table's source links. These spans are absolutely positioned. Without a suitable positioned containing block, their off-screen boxes escaped the scroll container's clipping and enlarged document overflow.

The smallest fix was to replace those extra hidden spans with an informative `aria-label` on each source link. This preserves the recipient/page context for assistive technology without adding an absolutely positioned box. I removed the temporary diagnostic logging, rebuilt production and reran the Phase 7 browser tests. All four passed with the stronger check. The corrected mobile screenshot is 1170 physical pixels wide, matching a 390-pixel layout viewport at device scale 3; the previous image was 1542 pixels wide.

This is the main UI learning point: automated accessibility checks, geometric tests and visual inspection answer different questions. A passing test with the wrong comparison can still miss a visible bug.

### Tooling issues

ESLint initially inspected an existing ignored `.data/commit-history.mjs` helper and reported an unused-variable warning. `.gitignore` does not automatically configure ESLint. I added `.data/**` to ESLint's global ignores, alongside the existing generated/output directories. The next lint run was clean.

On Windows, a search using an unexpanded directory wildcard and a PowerShell read of a `[slug]` path both failed. Directory searches and `Get-Content -LiteralPath` avoid those shell-specific interpretations. A temporary Python HTML-diff diagnostic also hit the console's legacy character encoding; a focused rerun with `python -X utf8` printed the relevant generated-ID/link differences successfully. These were investigation-command failures, not application defects.

### Recorded results

| Check | Result |
| --- | --- |
| `npm run lint` | Passed without warnings after excluding generated local data |
| `npm run typecheck` | Passed |
| `npm test` | 75 passed; eight database tests intentionally skipped without a process-level database URL |
| `npm run test:accountability` | Three isolated PostgreSQL tests passed |
| `npm run test:ingestion` | One isolated PostgreSQL test passed |
| `npm run test:parties` | Three isolated PostgreSQL tests passed |
| `npm run test:elections` | One isolated PostgreSQL test passed |
| `npm run db:validate` | Passed |
| `npm run build` | Passed, including the rebuild after the mobile fix |
| `npm run test:e2e` | Final full run: all 44 public desktop/mobile cases passed, including the stronger overflow check after the fix |
| `npm run test:e2e -- tests/phase-seven.spec.ts` | All four passed after the layout fix, including the stronger viewport check |
| `npm run test:editorial` | Six isolated desktop/mobile cases passed |
| Archive command | Six source snapshots created; repeat verification passed |
| Live spending imports | Two successful imports, 40 published observations in total |
| Visual inspection | Both financing PDF pages and final desktop/mobile accountability screenshots inspected |

The editorial suite uses synthetic PDFs and its own random PostgreSQL schema on port 3101. Passing those tests demonstrates the workflow; it does not mean a real human has reviewed a real AI summary or a real correction.

## 12. Run and maintain the result

For an existing checkout, preserve its `.env`. After installing dependencies and starting the existing database:

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
npm run data:import -- --indicator education-spending
npm run data:import -- --indicator defence-spending
npm run data:coverage
npm run dev
```

Open `/accountability`, `/corrections`, `/topics/education#education-spending` and `/topics/security#defence-spending`. Configure individual editorial accounts using the existing `npm run editorial:user` workflow before opening `/admin/corrections`. No account or token was silently created by this phase.

Set `PUBLIC_ORIGIN` and `EDITORIAL_ORIGIN` to the exact origins actually serving those forms. Use HTTPS outside localhost. A request from a different hostname or port is deliberately rejected.

For a future dossier update:

1. Inspect the original documents and their actual reference periods.
2. Add a new dated records file with an incremented version. Keep the previous dossier and source manifest.
3. Update the current dossier import in `data.ts` and the manifest imports in the sources page and tests. Do not leave the page pointing at the old manifest.
4. Run `npm run accountability:archive` to fetch and pin the new dossier's sources. Restore earlier raw archives from backup when verifying older versions; do not regenerate old manifests with new retrieval dates.
5. Reconcile any money in integer cents, verify quotations against the precise PDF pages, and explain source discrepancies.
6. Run unit tests, the relevant browser tests and a production build. Review screenshots and citations before publishing the code change.
7. If the change resolves a submitted correction, apply it first, then accept that report with a public before/after explanation and a verified evidence link.

Back up PostgreSQL, statistical snapshots, program documents and accountability snapshots together. Deployment and backup automation belong to Phase 8.

## 13. Boundaries and next work

This phase does not add live parliamentary feeds, donor-level disclosure, campaign-expense imports, a full commitment backfill, automatic fulfilment scores, an editorial dossier CMS, external notifications or hosting. The one initial commitment is not a representative political comparison.

Real reviewer accounts must be configured before operational editorial review. Public launch still needs abuse protection, a feedback retention policy, broader source coverage, manual screen-reader/real-device testing and the other Phase 8 hardening tasks. Existing AI-summary model/account requirements remain unchanged.

Future phase walkthroughs should use this same directory and explain the work performed, the reasons for decisions, actual failed checks and their fixes. Do not invent a development history for earlier phases.
