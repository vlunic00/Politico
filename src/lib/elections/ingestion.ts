import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { PrismaClient } from "../../generated/prisma/client";
import { saveImmutable, sha256 } from "../parties/ingestion";
import { fetchElectionSnapshot, parseElectionSnapshot, type ElectionSnapshot } from "./adapters";
import { archiveBase, type ElectionDefinition } from "./catalogue";

export async function importElection(db: PrismaClient, def: ElectionDefinition, options: { load?: (def: ElectionDefinition) => Promise<ElectionSnapshot>; snapshotDirectory?: string } = {}) {
  const datasetId = `dip:${def.id}`;
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"dip-source-initialization"}))`;
    await tx.dataSource.upsert({ where: { id: "dip" }, create: { id: "dip", name: "Državno izborno povjerenstvo", url: "https://www.izbori.hr/" }, update: {} });
    await tx.sourceDataset.upsert({ where: { id: datasetId }, create: { id: datasetId, sourceId: "dip", externalId: def.id, url: `${archiveBase}data/${def.archive}/`, methodologyUrl: def.referenceUrl, license: "DIP official results; source attribution. Legal allocation: Narodne novine." }, update: {} });
    await tx.election.upsert({ where: { id: def.id }, create: { id: def.id, title: def.title, kind: def.kind, date: new Date(def.date), round: def.round, context: def.context }, update: {} });
  });
  const run = await db.ingestionRun.create({ data: { sourceDatasetId: datasetId } });
  try {
    const snapshot = await (options.load ?? fetchElectionSnapshot)(def);
    const parsed = parseElectionSnapshot(def, snapshot);
    const hash = sha256(JSON.stringify({ definition: def, files: snapshot.files }));
    const directory = resolve(options.snapshotDirectory ?? process.env.DATA_SNAPSHOT_DIR ?? ".data/snapshots");
    await mkdir(directory, { recursive: true });
    const snapshotPath = resolve(directory, `${def.id}-${hash}.json`);
    const archived = { definition: def, snapshot: { electionId: snapshot.electionId, files: snapshot.files } };
    const previousArchive = await readFile(snapshotPath, "utf8").catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return null; throw error; });
    if (previousArchive) {
      const stored = JSON.parse(previousArchive) as { definition: ElectionDefinition; snapshot: ElectionSnapshot };
      if (sha256(JSON.stringify({ definition: stored.definition, files: stored.snapshot.files })) !== hash) throw new Error("Existing election archive failed its hash check.");
    } else await saveImmutable(snapshotPath, JSON.stringify(archived));
    return await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${datasetId}))`;
      const current = await tx.electionPublication.findFirst({ where: { electionId: def.id, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, include: { contests: { orderBy: { code: "asc" } } } });
      const existing = await tx.sourceRevision.findUnique({ where: { sourceDatasetId_contentHash: { sourceDatasetId: datasetId, contentHash: hash } }, include: { electionPublications: true } });
      if (current && isDeepStrictEqual(current.metadata, parsed.metadata) && isDeepStrictEqual(current.contests.map((contest) => contest.data), [...parsed.contests].sort((a, b) => a.code.localeCompare(b.code)))) {
        const checkedRevision = existing ?? await tx.sourceRevision.create({ data: { sourceDatasetId: datasetId, contentHash: hash, snapshotPath, retrievedAt: new Date(snapshot.retrievedAt), publicationDate: def.publicationDate ? new Date(def.publicationDate) : null } });
        await tx.ingestionRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", finishedAt: new Date(), error: `Verified unchanged results against source revision ${checkedRevision.id}.` } });
        return { status: "UNCHANGED", count: 0, publicationId: current.id, checkedRevisionId: checkedRevision.id };
      }
      if (existing) {
        const publication = existing.electionPublications[0];
        if (!publication || (publication.publishedAt && publication.id !== current?.id)) throw new Error("Older election revision reappeared; published results preserved.");
        const published = publication.publishedAt !== null;
        await tx.ingestionRun.update({ where: { id: run.id }, data: { status: published ? "SUCCEEDED" : "NEEDS_REVIEW", finishedAt: new Date(), error: published ? null : `Review election publication ${publication.id}.` } });
        return { status: published ? "UNCHANGED" : "NEEDS_REVIEW", count: 0, publicationId: publication.id };
      }
      const revision = await tx.sourceRevision.create({ data: { sourceDatasetId: datasetId, contentHash: hash, snapshotPath, retrievedAt: new Date(snapshot.retrievedAt), publicationDate: def.publicationDate ? new Date(def.publicationDate) : null } });
      const publication = await tx.electionPublication.create({ data: { electionId: def.id, revisionId: revision.id, status: "FINAL", metadata: parsed.metadata, publishedAt: current ? null : new Date(),
        contests: { create: parsed.contests.map((contest) => ({ code: contest.code, data: contest })) } } });
      await tx.ingestionRun.update({ where: { id: run.id }, data: { status: current ? "NEEDS_REVIEW" : "SUCCEEDED", finishedAt: new Date(), recordsStaged: parsed.contests.length, recordsPublished: current ? 0 : parsed.contests.length, error: current ? `Changed final results require explicit source review: ${publication.id}.` : null } });
      return { status: current ? "NEEDS_REVIEW" : "PUBLISHED", count: current ? 0 : parsed.contests.length, publicationId: publication.id };
    }, { timeout: 20000 });
  } catch (error) {
    await db.ingestionRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: error instanceof Error ? error.message : "Election import failed." } });
    throw error;
  }
}

export async function publishElectionRevision(db: PrismaClient, publicationId: string, reviewer: string) {
  if (!reviewer.trim() || reviewer.length > 200) throw new Error("An actual source reviewer is required.");
  const publication = await db.electionPublication.findUniqueOrThrow({ where: { id: publicationId }, include: { revision: true } });
  const stored = JSON.parse(await readFile(publication.revision.snapshotPath, "utf8")) as { definition: ElectionDefinition; snapshot: ElectionSnapshot };
  if (sha256(JSON.stringify({ definition: stored.definition, files: stored.snapshot.files })) !== publication.revision.contentHash || stored.definition.id !== publication.electionId) throw new Error("Election snapshot failed its identity/hash check.");
  const parsed = parseElectionSnapshot(stored.definition, { ...stored.snapshot, retrievedAt: publication.revision.retrievedAt.toISOString() });
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${publication.revision.sourceDatasetId}))`;
    const current = await tx.electionPublication.findUniqueOrThrow({ where: { id: publicationId }, include: { contests: { orderBy: { code: "asc" } } } });
    if (current.publishedAt) return current;
    if (!isDeepStrictEqual(current.contests.map((contest) => contest.data), [...parsed.contests].sort((a, b) => a.code.localeCompare(b.code))) || !isDeepStrictEqual(current.metadata, parsed.metadata) || current.status !== "FINAL") throw new Error("Stored contests differ from validated source data.");
    const newer = await tx.electionPublication.findFirst({ where: { electionId: publication.electionId, publishedAt: { not: null }, revision: { retrievedAt: { gt: publication.revision.retrievedAt } } } });
    if (newer) throw new Error("Newer published election results already exist.");
    const published = await tx.electionPublication.update({ where: { id: publicationId }, data: { publishedAt: new Date() } });
    await tx.ingestionRun.create({ data: { sourceDatasetId: publication.revision.sourceDatasetId, status: "SUCCEEDED", finishedAt: new Date(), recordsPublished: current.contests.length, error: `Source reviewed by ${reviewer.trim()}; published election revision ${publicationId}.` } });
    return published;
  });
}
