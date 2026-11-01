import { z } from "zod";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PrismaClient } from "../../generated/prisma/client";
import { programEvidenceSchema } from "./catalogue";
import { saveImmutable, sha256 } from "./ingestion";

export const programMetadataSchema = z.object({
  partyId: z.string().regex(/^\d+$/), context: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300), documentUrl: z.url().refine((url) => new URL(url).protocol === "https:" && !new URL(url).username && !new URL(url).password),
  language: z.enum(["hr", "en"]), publicationDate: z.iso.date().nullable(),
  evidence: z.array(programEvidenceSchema).max(11).default([]),
}).strict().refine((metadata) => new Set(metadata.evidence.map((evidence) => evidence.topic)).size === metadata.evidence.length, "Only one cited position per topic and version.");

export const programStorageDirectory = () => resolve(process.env.PROGRAM_DOCUMENT_DIR ?? ".data/programs");
export function validateProgramDocument(bytes: Uint8Array) {
  if (bytes.byteLength < 10 || bytes.byteLength > 20_000_000 || Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new Error("Program must be a PDF between 10 bytes and 20 MB.");
}
export async function uploadPartyProgram(db: PrismaClient, bytes: Uint8Array, input: unknown, directory = programStorageDirectory()) {
  const metadata = programMetadataSchema.parse(input);
  validateProgramDocument(bytes);
  if (metadata.publicationDate && metadata.publicationDate > new Date().toISOString().slice(0, 10)) throw new Error("Publication date is in the future.");
  await db.party.findUniqueOrThrow({ where: { id: metadata.partyId } });
  const contentHash = sha256(bytes);
  const revisionHash = sha256(JSON.stringify({ contentHash, metadata }));
  await mkdir(directory, { recursive: true });
  const storedDocumentPath = resolve(directory, `${contentHash}.pdf`);
  await saveImmutable(storedDocumentPath, bytes);
  return db.$transaction(async (tx) => {
    const lock = `party-program:${metadata.partyId}:${metadata.context}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lock}))`;
    const program = await tx.partyProgram.upsert({ where: { partyId_context: { partyId: metadata.partyId, context: metadata.context } }, create: { partyId: metadata.partyId, context: metadata.context }, update: {} });
    const existing = await tx.programDocumentVersion.findUnique({ where: { programId_revisionHash: { programId: program.id, revisionHash } } });
    if (existing) return existing;
    const previous = await tx.programDocumentVersion.findFirst({ where: { programId: program.id }, orderBy: { version: "desc" } });
    return tx.programDocumentVersion.create({ data: { programId: program.id, version: (previous?.version ?? 0) + 1,
      title: metadata.title, documentUrl: metadata.documentUrl, language: metadata.language,
      publicationDate: metadata.publicationDate ? new Date(metadata.publicationDate) : null,
      retrievedAt: new Date(), contentHash, revisionHash, storedDocumentPath, evidence: metadata.evidence } });
  });
}

export async function publishPartyProgram(db: PrismaClient, versionId: string, reviewer: string) {
  const actor = z.string().trim().min(1).max(200).parse(reviewer);
  const version = await db.programDocumentVersion.findUniqueOrThrow({ where: { id: versionId }, include: { program: true } });
  const bytes = await readFile(version.storedDocumentPath);
  validateProgramDocument(bytes);
  if (sha256(bytes) !== version.contentHash) throw new Error("Archived PDF failed its SHA-256 check.");
  programMetadataSchema.parse({ partyId: version.program.partyId, context: version.program.context, title: version.title, documentUrl: version.documentUrl, language: version.language, publicationDate: version.publicationDate?.toISOString().slice(0, 10) ?? null, evidence: version.evidence });
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${version.programId}))`;
    const current = await tx.programDocumentVersion.findUniqueOrThrow({ where: { id: versionId } });
    if (current.publishedAt) return current;
    const newer = await tx.programDocumentVersion.findFirst({ where: { programId: version.programId, version: { gt: version.version }, publishedAt: { not: null } } });
    if (newer) throw new Error("Cannot publish a version behind a newer published program.");
    await tx.programReview.create({ data: { versionId, reviewer: actor } });
    return tx.programDocumentVersion.update({ where: { id: versionId }, data: { publishedAt: new Date(), reviewedBy: actor } });
  });
}
