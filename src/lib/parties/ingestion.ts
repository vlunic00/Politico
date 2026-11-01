import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PrismaClient } from "../../generated/prisma/client";
import { registerCatalogueUrl, registerDatasetId, registerMetadataUrl, registerUrl } from "./catalogue";
import { fetchRegisterText, parsePartyRegister } from "./registry";

export const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export async function saveImmutable(path: string, bytes: string | Uint8Array) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, bytes, { flag: "wx" });
  try {
    try { await link(temporary, path); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (sha256(await readFile(path)) !== sha256(bytes)) throw new Error("Existing archive has different contents.");
    }
  } finally {
    await unlink(temporary);
  }
}

export async function importPartyRegister(db: PrismaClient, options: { load?: () => Promise<string>; snapshotDirectory?: string } = {}) {
  await db.dataSource.upsert({ where: { id: "mpudt-register" }, create: { id: "mpudt-register", name: "MPUDT · Registar političkih stranaka", url: registerCatalogueUrl }, update: {} });
  await db.sourceDataset.upsert({ where: { id: registerDatasetId }, create: { id: registerDatasetId, sourceId: "mpudt-register", externalId: "1a766609-e55d-4c13-ad0c-7bd409496d34", url: registerUrl, methodologyUrl: registerCatalogueUrl, license: "Otvorena dozvola RH" }, update: {} });
  const run = await db.ingestionRun.create({ data: { sourceDatasetId: registerDatasetId } });
  try {
    const text = await (options.load ?? (() => fetchRegisterText()))();
    const rows = parsePartyRegister(JSON.parse(text));
    const retrievedAt = new Date();
    if (rows.some((row) => row.registeredAt > retrievedAt.toISOString().slice(0, 10) || (row.statusDate && row.statusDate > retrievedAt.toISOString().slice(0, 10)))) throw new Error("Future registration/status date in registry.");
    const contentHash = sha256(text);
    const directory = resolve(options.snapshotDirectory ?? process.env.DATA_SNAPSHOT_DIR ?? ".data/snapshots");
    await mkdir(directory, { recursive: true });
    const snapshotPath = resolve(directory, `political-parties-${contentHash}.json`);
    await saveImmutable(snapshotPath, text);
    if (!options.load) {
      const metadata = await fetchRegisterText(registerMetadataUrl);
      // CKAN's undated-timezone update field is retained verbatim, never invented as a publication date.
      await writeFile(resolve(directory, `political-parties-check-${run.id}.json`), JSON.stringify({ requestUrl: registerUrl, metadata: JSON.parse(metadata), retrievedAt: retrievedAt.toISOString(), contentHash }));
    }
    const result = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${registerDatasetId}))`;
      const previous = await tx.sourceRevision.findFirst({ where: { sourceDatasetId: registerDatasetId, registrations: { some: {} } }, orderBy: { retrievedAt: "desc" }, include: { registrations: { select: { partyId: true } } } });
      // Never interpret disappearance from a partial export as a cessation or erase the last complete register.
      if (rows.length < 100 || (previous && previous.registrations.some((registration) => !rows.some((row) => row.id === registration.partyId)))) throw new Error("Incomplete registry export: review missing records before importing.");
      const existing = await tx.sourceRevision.findUnique({ where: { sourceDatasetId_contentHash: { sourceDatasetId: registerDatasetId, contentHash } } });
      if (existing) {
        if (previous?.id !== existing.id) throw new Error("An older registry snapshot reappeared; review the source.");
        await tx.ingestionRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", finishedAt: new Date() } });
        return { status: "UNCHANGED", count: rows.length, revisionId: existing.id };
      }
      const revision = await tx.sourceRevision.create({ data: { sourceDatasetId: registerDatasetId, contentHash, snapshotPath, retrievedAt } });
      for (const row of rows) {
        const { id, slug, ...registration } = row;
        await tx.party.upsert({ where: { id }, create: { id, slug }, update: {} });
        await tx.partyRegistration.create({ data: { ...registration, partyId: id, revisionId: revision.id, registeredAt: new Date(row.registeredAt), statusDate: row.statusDate ? new Date(row.statusDate) : null, publishedAt: retrievedAt } });
      }
      await tx.ingestionRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", recordsStaged: rows.length, recordsPublished: rows.length, finishedAt: new Date() } });
      return { status: "PUBLISHED", count: rows.length, revisionId: revision.id };
    }, { timeout: 30000 });
    return result;
  } catch (error) {
    await db.ingestionRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: error instanceof Error ? error.message : "Registry import failed." } });
    throw error;
  }
}
