import type { PrismaClient } from "../../generated/prisma/client";
import { sha256 } from "./ingestion";
import { extractProgram } from "./extraction";
import { llmConfiguration, pageBatches, promptVersion, requestSummary } from "./llm";
import { extractionPagesSchema, validateSummary, type SummaryContent } from "./summary-contract";

export async function generateProgramSummary(db: PrismaClient, versionId: string, request: typeof fetch = fetch) {
  const extraction = await extractProgram(db, versionId);
  const config = llmConfiguration();
  const generationKey = sha256(JSON.stringify({ extraction: extraction.id, hash: extraction.contentHash, promptVersion, endpoint: config.endpoint, model: config.model }));
  const cached = await db.programSummary.findUnique({ where: { generationKey } });
  if (cached) return cached;
  const pages = extractionPagesSchema.parse(extraction.pages);
  const candidates: SummaryContent[] = [];
  // shortcut: concurrent CLI jobs may duplicate provider calls; add a job lease before parallel scheduled generation.
  let model: string | null = null;
  for (const batch of pageBatches(pages)) {
    const result = await requestSummary(config, { task: "Sažmi samo ove stranice. Ne zaključuj ništa o nepokazanim stranicama.", pages: batch }, request);
    if (model && result.model !== model) throw new Error("Provider changed model identity during generation. Retry with a pinned model.");
    const content = validateSummary(result.content, batch, false);
    candidates.push(content); model = result.model;
  }
  let content = candidates[0];
  if (candidates.length > 1) {
    const result = await requestSummary(config, { task: "Spoji kandidate u jedan sažetak cijelog dokumenta; zadrži najvažnije izričite prijedloge, njihove uvjete i citate. Ne izmišljaj odsutnost teme.", candidates }, request);
    if (result.model !== model) throw new Error("Provider changed model identity during generation. Retry with a pinned model.");
    content = validateSummary(result.content, pages, false); model = result.model;
  }
  content = validateSummary(content, pages, extraction.complete);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${versionId}))`;
    const existing = await tx.programSummary.findUnique({ where: { generationKey } });
    if (existing) return existing;
    const previous = await tx.programSummary.findFirst({ where: { versionId }, orderBy: { sequence: "desc" } });
    return tx.programSummary.create({ data: { versionId, extractionId: extraction.id, sequence: (previous?.sequence ?? 0) + 1, generationKey,
      provider: config.endpoint, requestedModel: config.model, modelIdentifier: model!, promptVersion, generatedJson: content, summaryJson: content } });
  });
}

export async function reviseProgramSummary(db: PrismaClient, summaryId: string) {
  return db.$transaction(async (tx) => {
    const original = await tx.programSummary.findUniqueOrThrow({ where: { id: summaryId } });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${original.versionId}))`;
    const previous = await tx.programSummary.findFirstOrThrow({ where: { versionId: original.versionId }, orderBy: { sequence: "desc" } });
    if (previous.status === "DRAFT") return previous;
    return tx.programSummary.create({ data: { versionId: original.versionId, extractionId: original.extractionId, sequence: previous.sequence + 1,
      provider: original.provider, requestedModel: original.requestedModel, modelIdentifier: original.modelIdentifier, promptVersion: original.promptVersion,
      generatedAt: original.generatedAt, generatedJson: original.generatedJson!, summaryJson: original.summaryJson! } });
  });
}
