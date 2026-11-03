import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { importElection, publishElectionRevision } from "./ingestion";
import { elections } from "./catalogue";
import { fixtureElectionSnapshot } from "./test-fixtures";

describe.skipIf(!process.env.DATABASE_URL)("election snapshots in isolated PostgreSQL", () => {
  const schema = `elections_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  let directory = "";
  const def = elections.find((def) => def.id === "predsjednicki-2024-1")!;
  beforeAll(async () => {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (const migration of (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort()) await pool.query(await readFile(join("prisma/migrations", migration, "migration.sql"), "utf8"));
    directory = await mkdtemp(resolve(".data", "elections-test-"));
  }, 20000);
  afterAll(async () => {
    await db.$disconnect(); await pool.end(); await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end();
    if (directory) { if (!resolve(directory).startsWith(`${resolve(".data")}${sep}`)) throw new Error("Invalid test directory."); await rm(directory, { recursive: true, force: true }); }
  });
  it("deduplicates concurrent imports, stages changed final results, rejects broken/partial sources and preserves publication history", async () => {
    const snapshot = fixtureElectionSnapshot(def);
    const load = async () => snapshot;
    const first = await Promise.all([importElection(db, def, { load, snapshotDirectory: directory }), importElection(db, def, { load, snapshotDirectory: directory })]);
    expect(first.map((result) => result.status).sort()).toEqual(["PUBLISHED", "UNCHANGED"]);
    expect(await db.electionContest.count()).toBe(23);
    const reformatted = { ...snapshot, files: snapshot.files.map((file) => ({ ...file, text: JSON.stringify(JSON.parse(file.text), null, 2) })) };
    expect((await importElection(db, def, { load: async () => reformatted, snapshotDirectory: directory })).status).toBe("UNCHANGED");
    expect(await db.sourceRevision.count()).toBe(2);
    expect(await db.electionPublication.count()).toBe(1);
    await expect(importElection(db, def, { load: async () => ({ ...snapshot, files: snapshot.files.slice(1) }), snapshotDirectory: directory })).rejects.toThrow(/Incomplete/);
    const later = await importElection(db, def, { load: async () => fixtureElectionSnapshot(def, 1), snapshotDirectory: directory });
    expect(later.status).toBe("NEEDS_REVIEW");
    expect(await db.electionPublication.count({ where: { publishedAt: { not: null } } })).toBe(1);
    await expect(publishElectionRevision(db, later.publicationId, " ")).rejects.toThrow();
    const latest = await importElection(db, def, { load: async () => fixtureElectionSnapshot(def, 2), snapshotDirectory: directory });
    await publishElectionRevision(db, latest.publicationId, "Synthetic source reviewer");
    await expect(publishElectionRevision(db, later.publicationId, "Synthetic source reviewer")).rejects.toThrow(/Newer/);
    await expect(importElection(db, def, { load, snapshotDirectory: directory })).rejects.toThrow(/Older/);
    const publication = await db.electionPublication.findUniqueOrThrow({ where: { id: latest.publicationId }, include: { revision: true } });
    await writeFile(publication.revision.snapshotPath, "corrupt");
    await expect(importElection(db, def, { load: async () => fixtureElectionSnapshot(def, 2), snapshotDirectory: directory })).rejects.toThrow();
    expect(await db.electionPublication.count({ where: { publishedAt: { not: null } } })).toBe(2);
    expect(await db.electionContest.count()).toBe(69);
    expect(await db.ingestionRun.count({ where: { status: "FAILED" } })).toBe(3);
  });
});
