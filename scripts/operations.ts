import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sha256 } from "../src/lib/parties/ingestion";
import { seriesDefinitions } from "../src/lib/statistics/definitions";
import { accountability } from "../src/lib/accountability/data";
import manifest from "../src/lib/accountability/records/2026-11-04.sources.json";
import { hashFile } from "../src/lib/operations/backup";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
let failures = 0;
const issue = (id: string, problem: string) => { failures++; console.error(JSON.stringify({ id, problem })); };
try {
  if (process.argv.includes("--audit")) {
    const revisions = await db.sourceRevision.findMany({ include: { sourceDataset: { include: { source: true } } } });
    for (const revision of revisions) {
      try {
        const dataset = revision.sourceDataset;
        for (const url of [dataset.url, dataset.methodologyUrl, dataset.source.url]) if (new URL(url).protocol !== "https:") throw new Error("Missing HTTPS citation");
        const bytes = await readFile(revision.snapshotPath);
        let hash: string;
        if (dataset.sourceId === "mpudt-register") hash = sha256(bytes);
        else if (dataset.sourceId === "dip") {
          const stored = JSON.parse(bytes.toString("utf8"));
          hash = sha256(JSON.stringify({ definition: stored.definition, files: stored.snapshot.files }));
        } else {
          const snapshot = JSON.parse(bytes.toString("utf8"));
          const definition = snapshot.definition ?? seriesDefinitions.find((def) => `${def.source}:${def.slug}` === dataset.id);
          if (!definition || `${definition.source}:${definition.slug}` !== dataset.id) throw new Error("No matching statistical definition");
          hash = sha256(JSON.stringify({ definition, request: snapshot.request, metadata: snapshot.metadata, payload: snapshot.payload }));
        }
        if (hash !== revision.contentHash) throw new Error("Archive hash mismatch (historical statistics may require their original Git definition)");
      } catch (error) { issue(revision.id, error instanceof Error ? error.message : "Archive unavailable"); }
    }
    const documents = await db.programDocumentVersion.findMany();
    for (const document of documents) {
      try {
        if (new URL(document.documentUrl).protocol !== "https:" || await hashFile(document.storedDocumentPath) !== document.contentHash) throw new Error("Document citation/hash mismatch");
      } catch { issue(document.id, "Document citation or archive unavailable/invalid"); }
    }
    for (const source of accountability.sources) {
      const archived = manifest.find((entry) => entry.sourceId === source.id && entry.url === source.url);
      try {
        if (!archived || await hashFile(resolve(process.env.DATA_SNAPSHOT_DIR ?? ".data/snapshots", "accountability", archived.file)) !== archived.sha256) throw new Error();
      } catch { issue(source.id, "Accountability evidence missing or corrupt"); }
    }
    const uncited = await db.indicatorObservation.count({ where: { publishedAt: { not: null }, indicator: { sourceDatasetId: null } } });
    if (uncited) issue("observations", `${uncited} published records lack a dataset`);
    console.info(JSON.stringify({ event: "provenance_audit", revisions: revisions.length, documents: documents.length, evidence: accountability.sources.length, failures }));
  } else {
    const datasets = await db.sourceDataset.findMany({ orderBy: { id: "asc" }, include: { ingestionRuns: { orderBy: { startedAt: "desc" }, take: 1 } } });
    for (const dataset of datasets) {
      const run = dataset.ingestionRuns[0];
      console.info(JSON.stringify({ dataset: dataset.id, status: run?.status ?? "NOT_IMPORTED", startedAt: run?.startedAt, finishedAt: run?.finishedAt }));
      if (!run || run.status !== "SUCCEEDED") failures++;
    }
    console.info(JSON.stringify({ event: "ingestion_status", datasets: datasets.length, issues: failures }));
  }
  if (failures) process.exitCode = 1;
} finally { await db.$disconnect(); }
