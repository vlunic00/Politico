<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Phase walkthroughs

Starting with Phase 7, maintain a local Markdown walkthrough for each implemented phase at `docs/phases/phase-XX.md`. Keep `docs/phases/` in `.gitignore`; do not stage or commit walkthroughs. Explain the steps, technical decisions and reasons in plain English for a learner. Give extra detail to actual bugs, failed tests, root causes and fixes. Record verification results and coverage limits honestly; do not reconstruct unsupported histories of earlier phases.
