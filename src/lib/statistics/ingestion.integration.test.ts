import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { cubeSnapshot } from "../../fixtures/statistics";
import { seriesDefinitions } from "./definitions";
import { ingest, publishReviewedRevision } from "./ingestion";

describe.skipIf(!process.env.DATABASE_URL)("PostgreSQL ingestion, isolated schema", () => {
  const schema = `ingestion_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  const def = { ...seriesDefinitions.find((d) => d.slug === "population")!, minimumHistory: 2 };
  let directory = "";

  beforeAll(async () => {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (const migration of (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort())
      await pool.query(await readFile(join("prisma/migrations", migration, "migration.sql"), "utf8"));
    await db.topic.create({ data: { id: "demography", slug: "demography", nameHr: "Test", nameEn: "Test", description: "Test only" } });
    await db.dataSource.create({ data: { id: "eurostat", name: "Test Eurostat", url: "https://ec.europa.eu/eurostat/" } });
    await db.indicatorDefinition.create({ data: { id: def.slug, slug: def.slug, topicId: "demography", nameHr: "Test", nameEn: "Test", definition: def.definition, unit: def.unit, frequency: def.frequency, geographicCoverage: ["HR", "EU27_2020"] } });
    await db.geographicArea.createMany({ data: ["HR", "EU27_2020"].map((id) => ({ id, nameHr: id, nameEn: id, level: "test" })) });
    await mkdir(".data", { recursive: true });
    directory = await mkdtemp(resolve(".data", "ingestion-test-"));
  }, 20_000);

  afterAll(async () => {
    await db.$disconnect();
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
    if (directory) {
      if (!resolve(directory).startsWith(`${resolve(".data")}${sep}`)) throw new Error("Unexpected test snapshot directory.");
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("publishes atomically, deduplicates concurrent reruns, retains data on failure, stages anomalies and preserves revisions", async () => {
    const load = async () => cubeSnapshot();
    const initial = await Promise.all([ingest(db, def, { load, snapshotDirectory: directory }), ingest(db, def, { load, snapshotDirectory: directory })]);
    expect(initial.map((r) => r.status).sort()).toEqual(["SUCCEEDED", "UNCHANGED"]);
    const first = initial.find((r) => r.status === "SUCCEEDED")!;
    expect(await db.indicatorObservation.count({ where: { publishedAt: { not: null } } })).toBe(4);
    const reruns = await Promise.all([ingest(db, def, { load, snapshotDirectory: directory }), ingest(db, def, { load, snapshotDirectory: directory })]);
    expect(reruns.map((r) => r.status)).toEqual(["UNCHANGED", "UNCHANGED"]);
    expect(await db.sourceRevision.count()).toBe(1);

    for (const failedLoad of [async () => { throw new Error("Source offline"); }, async () => cubeSnapshot({}), async () => ({ ...cubeSnapshot(), payload: { error: "invalid" } })])
      await expect(ingest(db, def, { load: failedLoad, snapshotDirectory: directory })).rejects.toThrow();
    expect(await db.ingestionRun.count({ where: { status: "FAILED" } })).toBe(3);
    expect(await db.indicatorObservation.count({ where: { publishedAt: { not: null } } })).toBe(4);

    const missing = await ingest(db, def, { load: async () => cubeSnapshot({ "0": 100, "1": 101, "3": 202 }), snapshotDirectory: directory });
    expect(missing.status).toBe("NEEDS_REVIEW");
    const revised = await ingest(db, def, { load: async () => cubeSnapshot({ "0": 140, "1": 141, "2": 200, "3": 202 }), snapshotDirectory: directory });
    expect(revised.status).toBe("NEEDS_REVIEW");
    expect(await db.indicatorObservation.count({ where: { publishedAt: { not: null } } })).toBe(4);
    const stagedFile = (await db.sourceRevision.findUniqueOrThrow({ where: { id: revised.revisionId } })).snapshotPath;
    const stagedBytes = await readFile(stagedFile);
    await writeFile(stagedFile, "{}");
    await expect(publishReviewedRevision(db, def, revised.revisionId)).rejects.toThrow(/hash verification/);
    await writeFile(stagedFile, stagedBytes);
    expect(await publishReviewedRevision(db, def, revised.revisionId)).toBe(4);
    expect(await db.indicatorObservation.count({ where: { revisionId: first.revisionId, publishedAt: { not: null } } })).toBe(4);
    const rolledBackSource = await ingest(db, def, { load, snapshotDirectory: directory });
    expect(rolledBackSource.status).toBe("NEEDS_REVIEW");
    expect(await db.ingestionRun.count({ where: { status: "SUCCEEDED", error: { contains: revised.revisionId } } })).toBe(1);
    expect(JSON.parse(await readFile((await db.sourceRevision.findUniqueOrThrow({ where: { id: revised.revisionId } })).snapshotPath, "utf8")).payload.value["0"]).toBe(140);
    const snapshotFile = (await db.sourceRevision.findUniqueOrThrow({ where: { id: first.revisionId } })).snapshotPath;
    expect(JSON.parse(await readFile(snapshotFile, "utf8")).definition).toEqual(def);
    await writeFile(snapshotFile, "{}", "utf8");
    await expect(ingest(db, def, { load, snapshotDirectory: directory })).rejects.toThrow(/hash verification/);
  }, 20_000);
});
