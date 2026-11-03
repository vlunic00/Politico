import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { indicators } from "../catalogue";
import type { ObservationInput } from "../contracts";
import { datasetUrl, type SeriesDefinition } from "./definitions";
import { fetchSnapshot, parseSnapshot, type Snapshot } from "./adapters";

type Comparable = Pick<ObservationInput, "geographyId" | "periodStart" | "periodEnd" | "value" | "unit" | "frequency" | "methodologyVersion">;
const key = (point: Comparable) => `${point.geographyId}:${point.periodStart}:${point.periodEnd}`;
const contentHash = (def: SeriesDefinition, snapshot: Snapshot) => createHash("sha256").update(JSON.stringify({ definition: def, request: snapshot.request, metadata: snapshot.metadata, payload: snapshot.payload })).digest("hex");

export function reviewReasons(def: SeriesDefinition, incoming: Comparable[], previous: Comparable[]) {
  const reasons: string[] = [];
  for (const geography of def.geographies ?? ["HR"]) {
    const count = incoming.filter((point) => point.geographyId === geography).length;
    if (count < def.minimumHistory) reasons.push(`${geography === "HR" ? "Croatian" : geography} history requires ${def.minimumHistory} observations; received ${count}.`);
  }
  const current = new Map(incoming.map((point) => [key(point), point]));
  if (current.size !== incoming.length) throw new Error("Duplicate observations in source.");
  for (const point of previous) {
    const replacement = current.get(key(point));
    if (!replacement) { reasons.push(`Historical observation missing: ${key(point)}.`); continue; }
    if (point.unit !== replacement.unit || point.frequency !== replacement.frequency || point.methodologyVersion !== replacement.methodologyVersion)
      reasons.push(`Definition changed: ${key(point)}.`);
    if (Math.abs(replacement.value - point.value) > Math.max(Math.abs(point.value) * 0.1, 1))
      reasons.push(`Large historical revision: ${key(point)} (${point.value} → ${replacement.value}).`);
  }
  // shortcut: conservative fixed anomaly thresholds, calibrate per source after observing real revision patterns.
  for (const geo of def.geographies ?? ["HR", "EU27_2020"]) {
    const points = incoming.filter((p) => p.geographyId === geo).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      // Monthly tourism is strongly seasonal; compare with the same month a year earlier.
      const baseline = def.slug === "tourist-nights" ? points.find((p) => p.periodStart === `${Number(b.periodStart.slice(0, 4)) - 1}${b.periodStart.slice(4)}`) : a;
      if (baseline && Math.abs(b.value - baseline.value) > Math.max(Math.abs(baseline.value) * 0.75, def.change === "points" ? 20 : 100))
        reasons.push(`Unusually large change: ${key(b)}.`);
    }
  }
  return [...new Set(reasons)];
}

async function activate(tx: Prisma.TransactionClient, def: SeriesDefinition, revisionId: string) {
  const publishedAt = new Date();
  const result = await tx.indicatorObservation.updateMany({ where: { revisionId, publishedAt: null }, data: { publishedAt } });
  await tx.sourceDataset.update({ where: { id: `${def.source}:${def.slug}` }, data: { url: datasetUrl(def), methodologyUrl: def.methodologyUrl } });
  await tx.indicatorDefinition.update({
    where: { id: def.slug },
    data: {
      definition: def.definition, unit: def.unit, frequency: def.frequency,
      sourceDatasetId: `${def.source}:${def.slug}`, geographicCoverage: def.geographies ?? (def.source === "eurostat" ? ["HR", "EU27_2020"] : ["HR"]),
      preferredComparator: def.source === "eurostat" && !def.geographies ? "EU27_2020" : null,
      limitations: def.limitations,
      minimumHistoryPeriods: def.minimumHistory, coverageStatus: "ACTIVE",
    },
  });
  return result.count;
}

export async function ingest(
  db: PrismaClient, def: SeriesDefinition,
  options: { load?: typeof fetchSnapshot; snapshotDirectory?: string } = {},
) {
  const indicator = indicators.find((item) => item.slug === def.slug);
  if (!indicator) throw new Error(`Unknown indicator: ${def.slug}`);
  const datasetId = `${def.source}:${def.slug}`;
  await db.sourceDataset.upsert({
    where: { id: datasetId }, update: {},
    create: { id: datasetId, sourceId: def.source, externalId: `${def.dataset}:${def.slug}`, url: datasetUrl(def), methodologyUrl: def.methodologyUrl,
      license: def.source === "eurostat" ? "European Commission reuse policy; acknowledge Eurostat and retain flags." : "DZS: cite Croatian Bureau of Statistics as source." },
  });
  const run = await db.ingestionRun.create({ data: { sourceDatasetId: datasetId } });
  try {
    const snapshot = await (options.load ?? fetchSnapshot)(def);
    const parsed = parseSnapshot(def, snapshot);
    if (!parsed.observations.length) throw new Error("Empty import; published data preserved.");
    if (parsed.observations.some((point) => point.periodStart > snapshot.retrievedAt.slice(0, 10))) throw new Error("Future reference period.");
    const boundedShare = ["PC", "PC_ACT", "PC_POP"].includes(def.dimensions.unit) || def.slug === "income-inequality";
    if (parsed.observations.some((p) => (boundedShare && (p.value < 0 || p.value > 100)) || (def.change === "percent" && def.dimensions.indic_de !== "CNMIGRAT" && p.value < 0)))
      throw new Error("Value outside the indicator's valid range.");
    const hash = contentHash(def, snapshot);
    const directory = options.snapshotDirectory ?? process.env.DATA_SNAPSHOT_DIR ?? ".data/snapshots";
    await mkdir(directory, { recursive: true });
    const snapshotPath = join(directory, `${def.slug}-${hash}.json`);
    return await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${datasetId}))`;
      await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
        if (contentHash(def, JSON.parse(await readFile(snapshotPath, "utf8"))) !== hash) throw new Error("Existing snapshot failed hash verification.");
      });
      const latest = await tx.indicatorObservation.findFirst({ where: { indicatorId: def.slug, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, select: { revisionId: true, revision: true } });
      const existing = await tx.sourceRevision.findUnique({ where: { sourceDatasetId_contentHash: { sourceDatasetId: datasetId, contentHash: hash } }, include: { observations: { select: { publishedAt: true } } } });
      if (existing) {
        const published = existing.observations.some((point) => point.publishedAt) && latest?.revisionId === existing.id;
        if (published) await tx.sourceDataset.update({ where: { id: datasetId }, data: { url: datasetUrl(def), methodologyUrl: def.methodologyUrl } });
        await tx.ingestionRun.update({ where: { id: run.id }, data: { status: published ? "SUCCEEDED" : "NEEDS_REVIEW", finishedAt: new Date(), error: published ? null : `Revision ${existing.id} remains staged for review.` } });
        return { status: published ? "UNCHANGED" : "NEEDS_REVIEW", count: 0, revisionId: existing.id };
      }
      const previous = latest ? await tx.indicatorObservation.findMany({ where: { revisionId: latest.revisionId, publishedAt: { not: null } } }) : [];
      const reasons = reviewReasons(def, parsed.observations, previous.map((p) => ({ ...p, value: Number(p.value), periodStart: p.periodStart.toISOString().slice(0, 10), periodEnd: p.periodEnd.toISOString().slice(0, 10) })));
      if (latest && parsed.sourceUpdatedAt && latest.revision.sourceUpdatedAt && parsed.sourceUpdatedAt < latest.revision.sourceUpdatedAt)
        reasons.push("Source update timestamp regressed.");
      const revision = await tx.sourceRevision.create({ data: {
        sourceDatasetId: datasetId, contentHash: hash, snapshotPath,
        retrievedAt: new Date(snapshot.retrievedAt), sourceUpdatedAt: parsed.sourceUpdatedAt,
      } });
      await tx.indicatorObservation.createMany({ data: parsed.observations.map((point) => ({
        indicatorId: point.indicatorId, geographyId: point.geographyId,
        periodStart: new Date(point.periodStart), periodEnd: new Date(point.periodEnd),
        frequency: point.frequency, value: point.value, unit: point.unit,
        publicationDate: null, retrievedAt: new Date(point.retrievedAt),
        observationStatus: point.observationStatus, sourceFlags: point.sourceFlags ?? "",
        revisionId: revision.id, methodologyVersion: point.methodologyVersion,
      })) });
      const count = reasons.length ? 0 : await activate(tx, def, revision.id);
      await tx.ingestionRun.update({ where: { id: run.id }, data: {
        status: reasons.length ? "NEEDS_REVIEW" : "SUCCEEDED", finishedAt: new Date(),
        recordsStaged: parsed.observations.length, recordsPublished: count,
        error: reasons.length ? `Revision ${revision.id}: ${reasons.join(" ")}` : null,
      } });
      return { status: reasons.length ? "NEEDS_REVIEW" : "SUCCEEDED", count, revisionId: revision.id, reasons };
    }, { timeout: 30_000 });
  } catch (error) {
    await db.ingestionRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: error instanceof Error ? error.message : "Import failed." } });
    throw error;
  }
}

export async function publishReviewedRevision(db: PrismaClient, def: SeriesDefinition, revisionId: string) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${def.source}:${def.slug}`}))`;
    const revision = await tx.sourceRevision.findUniqueOrThrow({ where: { id: revisionId }, include: { observations: true } });
    if (revision.sourceDatasetId !== `${def.source}:${def.slug}` || !revision.observations.length || revision.observations.some((p) => p.publishedAt)) throw new Error("Revision is not a staged series for this definition.");
    if ((def.geographies ?? ["HR"]).some((geography) => revision.observations.filter((p) => p.geographyId === geography).length < def.minimumHistory) || revision.observations.some((p) => !(def.geographies ?? ["HR", "EU27_2020"]).includes(p.geographyId) || p.unit !== def.unit || p.frequency !== def.frequency || p.methodologyVersion !== `${def.dataset}:${JSON.stringify(def.dimensions)}`))
      throw new Error("Staged data do not meet the definition or minimum history requirements.");
    const newer = await tx.indicatorObservation.findFirst({ where: { indicatorId: def.slug, publishedAt: { not: null }, retrievedAt: { gt: revision.retrievedAt } } });
    if (newer) throw new Error("A newer series is already published; refusing to roll back.");
    const count = await activate(tx, def, revisionId);
    await tx.ingestionRun.create({ data: { sourceDatasetId: revision.sourceDatasetId, status: "SUCCEEDED", finishedAt: new Date(), recordsPublished: count, error: `Manually reviewed and published revision ${revisionId}.` } });
    return count;
  });
}
