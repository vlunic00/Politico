import { createHash } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "../generated/prisma/client";
import type { EditorialActor } from "./editorial-auth";

export const evidenceUrl = z.url().max(2000).refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
}, "Poveznica mora koristiti HTTPS bez pristupnih podataka.");
export const correctionSchema = z.object({
  pagePath: z.string().trim().max(400).regex(/^\/(?!\/)[a-zA-Z0-9/_-]*(#[a-zA-Z0-9_-]+)?$/, "Unesite putanju stranice bez domene i upita, npr. /accountability#financing."),
  claim: z.string().trim().min(10).max(4000),
  proposed: z.string().trim().min(10).max(4000),
  evidenceUrl,
}).strict();

export class CorrectionLimitError extends Error {}

export async function submitCorrection(db: PrismaClient, input: unknown) {
  const data = correctionSchema.parse(input);
  const fingerprint = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('public-corrections'))`;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicate = await tx.correction.findFirst({ where: { fingerprint, createdAt: { gte: since } } });
    if (duplicate) return duplicate.id;
    // shortcut: a shared database limit avoids retaining IP addresses; add edge abuse protection before a public launch.
    if (await tx.correction.count({ where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } }) >= 30) throw new CorrectionLimitError("Dosegnut je privremeni limit prijava. Pokušajte kasnije.");
    return (await tx.correction.create({ data: { ...data, fingerprint } })).id;
  });
}

export const correctionReviewSchema = z.object({
  action: z.enum(["ACCEPTED", "REJECTED"]), note: z.string().trim().min(10).max(4000),
  publicSummary: z.string().trim().max(4000), sourceUrl: z.union([z.literal(""), evidenceUrl]),
  applied: z.boolean(),
}).strict().superRefine((data, ctx) => {
  if (data.action === "ACCEPTED" && (!data.applied || data.publicSummary.length < 10 || !data.sourceUrl)) ctx.addIssue({ code: "custom", message: "Prvo primijenite ispravak i navedite javno objašnjenje te izvor." });
});

export async function reviewCorrection(db: PrismaClient, id: string, input: unknown, actor: EditorialActor) {
  if (actor.role !== "reviewer" || !/^[a-zA-Z0-9._-]{1,80}$/.test(actor.id)) throw new Error("Samo recenzent može zaključiti prijavu.");
  const data = correctionReviewSchema.parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const correction = await tx.correction.findUniqueOrThrow({ where: { id } });
    if (correction.status !== "PENDING") throw new Error("Prijava je već zaključena. Osvježite pregled.");
    await tx.correctionReview.create({ data: { correctionId: id, actorId: actor.id, action: data.action, note: data.note,
      publicSummary: data.action === "ACCEPTED" ? data.publicSummary : null, sourceUrl: data.action === "ACCEPTED" ? data.sourceUrl : null } });
    await tx.correction.update({ where: { id }, data: { status: data.action } });
  });
}

export async function publicCorrections(db: PrismaClient) {
  return db.correctionReview.findMany({ where: { action: "ACCEPTED" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
    select: { id: true, publicSummary: true, sourceUrl: true, createdAt: true, correction: { select: { pagePath: true } } } });
}
