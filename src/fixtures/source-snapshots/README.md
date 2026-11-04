# Official source replay fixtures

`population.json` and `nominal-net-wages.json` are unmodified source snapshots copied from the local immutable archive for Phase 8. Each records its real retrieval time, request and original response; DZS includes the category metadata. These are test inputs, never imported by the seed or application. Source URLs and reuse attribution remain in the files and statistical definitions.

Tests replay their actual layout, then simulate source drift. `npm run sources:check` checks live official sources against published records without writing observations, archives or ingestion runs. Passing replay tests alone does not prove that today's endpoints remain compatible.
