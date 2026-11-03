# Phase 5: Croatian summaries and editorial review

All generated and published explanatory text is **Croatian (`hr-HR`)**, including summaries of foreign-language sources. Evidence quotations stay verbatim in the original language. Human approval checks both source fidelity and Croatian language quality. An output language tag is validated automatically; it cannot establish linguistic quality by itself.

## Setup

Apply the additive migration with `npm run db:deploy`. Install Poppler's `pdfinfo` and `pdftotext` on the job host, or configure `PDFINFO_PATH` and `PDFTOTEXT_PATH`. PDFs remain in the existing durable `PROGRAM_DOCUMENT_DIR`. PDF processing is a maintainer CLI job, never triggered by public page loads or a public upload endpoint. Run document jobs as an unprivileged process in a restricted worker/container before exposing them to unattended production inputs.

Configure the server-only variables in `.env.example`:

- `LLM_BASE_URL`: a trusted provider's API base URL, default `https://api.openai.com/v1/`.
- `LLM_MODEL`: an explicit model identifier with strict JSON-schema Chat Completions support.
- `LLM_API_KEY`: that provider's key. The adapter uses standard `fetch`; no provider SDK is required. These variables must never use a `NEXT_PUBLIC_` prefix.
- `EDITORIAL_ORIGIN`: the exact browser origin, including its port, without a trailing slash. HTTPS is required except on localhost. Local `npm run dev` binds `127.0.0.1`; use `http://127.0.0.1:3000` consistently if configured that way.
- `EDITORIAL_USERS`: JSON array of individual `{id, role, tokenHash}` records. Empty/malformed configuration denies access. Each role is `editor` or `reviewer`.

Create an account credential locally:

```powershell
npm run editorial:user -- --id ana --role reviewer
```

The command prints a random 256-bit password once and its SHA-256 configuration record. Store the password securely, add only the hash record to `EDITORIAL_USERS`, and restart the server. Open `/admin/summaries` and use that ID/password in the browser's HTTP Basic prompt. Use a separate credential for every person. Removing an entry or changing its hash revokes it after a server restart. There is no signup, reusable default password, client-side role selector or public write credential. HTTP Basic is deliberately limited to this small maintainer interface; SSO/MFA/session management would require an authentication provider before expanding access beyond trusted maintainers. Close the browser session to clear its remembered credential.

The adapter follows the provider's [structured-output contract](https://developers.openai.com/api/docs/guides/structured-outputs), sends `store: false`, provides no tools, rejects redirects, and accepts HTTPS (HTTP only for a local model). No model is selected implicitly. Provider retention and billing still follow the provider's account settings; only verified public program text is sent, never editorial credentials.

## Retrieve, verify, extract and generate

Original source identity/context is still verified by a maintainer under the [Phase 4 rules](./party-directory.md). Download from a reviewed primary-source URL in the metadata:

```powershell
npm run parties:program -- --download --metadata docs/programs/mozemo-2024.json
# Or use the existing --file <local.pdf> option.
npm run parties:program -- --publish <document-version-id> --reviewer "Actual source reviewer"

# Extract only; no model credentials or API call:
npm run parties:summary -- --version <document-version-id> --extract

# Extract and generate a private draft:
npm run parties:summary -- --version <document-version-id>
```

Downloads reject redirects, failed responses, invalid PDFs and streamed bodies over 20 MB. Only shell-access maintainers can choose a source URL; no network retrieval endpoint accepts public input. Source verification must precede summary generation. Failed downloads never replace a stored source.

Extraction rechecks the archive's SHA-256 and uses the PDF's physical page count, independent from `pdftotext` form-feed page boundaries. Count mismatch, unusable text, excessive pages, subprocess timeout or oversized output fail explicitly. Physical PDF page numbers may differ from printed page labels. The extracted page text, extractor version, content hash and time are retained in PostgreSQL. Original documents are never overwritten.

A readable-text flag requires every page to contain sufficient text without replacement characters. It is conservative: a genuinely blank page also makes extraction incomplete, and a text layer may still omit material in graphics. It is not a visual-completeness guarantee. Scanned/image-only material needs OCR/manual source work; OCR is not implemented in this phase. Incomplete extraction cannot produce a public assertion that a topic is absent.

The initial November 3 extraction checked both existing archives: Možemo! has 96 physical pages and SDP 207. SDP's extraction is marked incomplete. This does not alter the source documents or publish a summary. No live model call or real human summary approval is implied by these extraction checks.

## Draft contract and validation

Every draft contains every supported comparison topic plus economy, public spending, employment/wages, demography, international relations, and justice/institutions. Each topic has `coverage` and zero to five proposals. A proposal contains Croatian text, a kind and one to four exact page-cited quotations:

- `commitment`: an explicitly proposed action or instrument; displayed as **Konkretan prijedlog**. It is not an assessment of fulfilment.
- `aspiration`: a desired outcome without a specified instrument; displayed as **Opći cilj**.
- `uncertain`: extraction/evidence is insufficient; this never claims that the original omits the topic.
- `not-addressed`: **Nije navedeno u analiziranom programu**; a reviewer may set this only after full-source review, and the application rejects it for an incomplete extraction.

The prompt requires Croatian, neutral attribution to the program, original-language quotations, preserved amounts/deadlines/conditions, no external knowledge, no evaluation or voting recommendation, and no inference from party identity. Documents and intermediate outputs are untrusted data, never privileged instructions. The model is instructed to use uncertainty for missing topics; only editorial review may assert absence.

All external JSON is validated with strict Zod schemas. Validation requires each topic exactly once, evidence for every proposal, valid physical pages, quotation matches on the cited page after Unicode/whitespace normalization, and matching numerical tokens. A quote on another page fails. This verifies mechanical grounding, **not** semantic entailment, completeness, neutrality, or Croatian fluency: those remain mandatory human checks.

Requests process complete pages in batches of at most 48,000 characters. More than 40 batches or a single oversized page fails rather than silently truncating. Multiple batches are consolidated in a second structured request and all final citations are rechecked against original extracted pages. Each request has a three-minute timeout and a 16,000 completion-token budget; refusals, truncation, invalid JSON, oversized responses and failed grounding save no summary. A provider/model change within a run also fails; use a pinned model identifier. There are no automatic billable retries.

Successful generation stores the original model JSON separately from editable JSON, requested/returned model identifiers, provider endpoint, prompt version, extraction identity, timestamp and source document version. Identical extraction/model/provider/prompt requests reuse the stored draft or decision. Public views read stored approved summaries and never call a model. Simultaneous CLI jobs may both incur provider calls before the persistence lock deduplicates their result; run one generation job per document.

## Review and publication

Open `/admin/summaries`, then the draft. The original source and archived PDF come first, followed by the rendered draft, page evidence, editable structured JSON, original model output, full extraction and review history. JSON editing is intentional for the initial maintainer-only interface; there is no visual form builder.

Editors can correct and save drafts with a required note. Reviewers can also approve or reject. Approval requires explicit confirmations for source/meaning/conditions/neutrality, Croatian quality and full-document coverage. Checks run again on every save/approval. The source archive and extracted text are hash-checked before publication. Roles and reviewer identity come from server configuration, never request fields.

Protected pages and mutations reauthenticate independently. POST requires the exact configured origin, bounded form input and a current revision number. Per-document transaction locks plus optimistic revisions prevent stale/concurrent edits from overwriting another decision. Private responses use `no-store`; review pages request no indexing and deny framing. Source text/model output is escaped as text, never rendered as HTML.

Every saved edit, approval and rejection has the authenticated actor, role, timestamp, note and before/after snapshots, including approval confirmations. Approved and rejected records are immutable. To prepare a correction:

```powershell
npm run parties:summary -- --revise <summary-id>
```

This creates a new private edition from the existing stored content (or returns the current draft), retaining original generation provenance. It requires a fresh review. New source bytes or metadata get a new document version under Phase 4; after source verification, generate its separate draft with `--version`. Neither operation overwrites previous published history. A draft behind a newer published document or approved summary cannot be approved.

Public profiles show approved summaries below the original program and source metadata, labelled AI-generated, Croatian, human-reviewed, with generation/approval dates and model/prompt version. All approved editions remain accessible with their exact document version. Comparisons use only the latest published document for the selected context and its latest approved summary. A new document with no approved summary displays the gap; an old summary is never substituted as if it described the new source. Existing manually verified excerpts remain a fallback where no summary is approved.

## Validation and remaining work

Run `npm test`, `npm run test:parties`, `npm run test:ingestion`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`, and `npm run test:editorial`.

Unit tests cover extraction boundaries, grounding, coverage, strict provider requests, refusals, response limits, authentication and origin checks. Isolated PostgreSQL tests cover real synthetic-PDF extraction, stubbed generation/cache behavior, role and human-check gates, concurrent revisions, audit snapshots, immutable approvals and stale-document protection. Isolated desktop/mobile browser tests exercise credential protection, CSRF refusal, editor/reviewer separation, corrections, stale edits, approval, public citations/comparison, overflow and automated accessibility. Test fixtures never enter the application database.

Live provider quality, Croatian editorial calibration, real human approvals and production account setup remain operational requirements. Wider program backfill, OCR, scheduled jobs, SSO/MFA, hardened processing workers, manual screen-reader/device checks and production deployment are not claimed here. Elections and regional exploration are Phase 6.
