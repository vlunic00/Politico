import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "../../generated/prisma/client";
import type { EditorialActor } from "../editorial-auth";
import { extractionPagesSchema, validateSummary } from "./summary-contract";

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

export const summaryReviewSchema = z.object({
  revision: z.number().int().positive(), action: z.enum(["save", "approve", "reject"]),
  content: z.unknown(), note: z.string().trim().min(1).max(2000),
  sourceChecked: z.boolean(), croatianChecked: z.boolean(), coverageChecked: z.boolean(),
}).strict();

export async function reviewProgramSummary(db: PrismaClient, summaryId: string, input: unknown, actor: EditorialActor) {
  const reviewer = z.object({ id: z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/), role: z.enum(["editor", "reviewer"]) }).strict().parse(actor);
  const review = summaryReviewSchema.parse(input);
  if (review.action !== "save" && reviewer.role !== "reviewer") throw new Error("Samo recenzent može odobriti ili odbiti sažetak.");
  if (review.action === "approve" && (!review.sourceChecked || !review.croatianChecked || !review.coverageChecked)) throw new Error("Potvrdite provjeru izvornika, hrvatskog jezika i obuhvata tema.");
  return db.$transaction(async (tx) => {
    const summary = await tx.programSummary.findUniqueOrThrow({ where: { id: summaryId }, include: { extraction: true, version: true } });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${summary.version.programId}))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${summary.versionId}))`;
    const current = await tx.programSummary.findUniqueOrThrow({ where: { id: summaryId } });
    if (current.revision !== review.revision || current.status !== "DRAFT") throw new Error("Sažetak je u međuvremenu promijenjen ili zaključen. Ponovno otvorite zapis.");
    const pages = extractionPagesSchema.parse(summary.extraction.pages);
    const content = review.action === "reject" ? current.summaryJson! : validateSummary(review.content, pages, summary.extraction.complete);
    if (review.action === "approve") {
      if (!summary.version.publishedAt) throw new Error("Izvorni program nije objavljen.");
      if (sha256(await readFile(summary.version.storedDocumentPath)) !== summary.version.contentHash || sha256(JSON.stringify(pages)) !== summary.extraction.contentHash) throw new Error("Provjera cjelovitosti izvornika ili ekstrakcije nije uspjela.");
      const newerDocument = await tx.programDocumentVersion.findFirst({ where: { programId: summary.version.programId, version: { gt: summary.version.version }, publishedAt: { not: null } } });
      const newerSummary = await tx.programSummary.findFirst({ where: { versionId: summary.versionId, sequence: { gt: summary.sequence }, status: "APPROVED" } });
      if (newerDocument || newerSummary) throw new Error("Postoji novija objavljena verzija. Ovaj zastarjeli nacrt ne može se objaviti.");
    }
    const status = review.action === "approve" ? "APPROVED" : review.action === "reject" ? "REJECTED" : "DRAFT";
    const after = { content, status, revision: current.revision + 1 };
    await tx.summaryReview.create({ data: { summaryId, actorId: reviewer.id, role: reviewer.role, action: review.action, note: review.note,
      beforeJson: { content: current.summaryJson, status: current.status, revision: current.revision },
      afterJson: { ...after, sourceChecked: review.sourceChecked, croatianChecked: review.croatianChecked, coverageChecked: review.coverageChecked } } });
    return tx.programSummary.update({ where: { id: summaryId }, data: { summaryJson: content, status, revision: after.revision, publishedAt: status === "APPROVED" ? new Date() : null } });
  });
}
