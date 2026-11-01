import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { importPartyRegister } from "./ingestion";
import { uploadPartyProgram, publishPartyProgram } from "./programs";

describe.skipIf(!process.env.DATABASE_URL)("party imports and program versions, isolated PostgreSQL schema", () => {
  const schema = `parties_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  let directory = "";
  const rows = Array.from({ length: 100 }, (_, index) => ({ SBT_ID: 1000 + index, NAZIV: `Fixture ${index}`, SKRACENI_NAZIV: null, STATUS: "AKTIVAN", REGISTARSKI_BROJ: String(index + 1), BROJ_KNJIGE: 1, DATUM_UPISA: "2020-01-01T00:00:00", DATUM_STATUSA: null as string | null, SJEDISTE: null }));
  beforeAll(async () => {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (const migration of (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort()) await pool.query(await readFile(join("prisma/migrations", migration, "migration.sql"), "utf8"));
    directory = await mkdtemp(resolve(".data", "parties-test-"));
  }, 20000);
  afterAll(async () => {
    await db.$disconnect(); await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end();
    if (directory) {
      if (!resolve(directory).startsWith(`${resolve(".data")}${sep}`)) throw new Error("Unexpected test archive directory.");
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("deduplicates concurrent imports, retains whole revisions, and preserves registrations on source failure or disappearance", async () => {
    const load = async () => JSON.stringify(rows);
    const results = await Promise.all([importPartyRegister(db, { load, snapshotDirectory: directory }), importPartyRegister(db, { load, snapshotDirectory: directory })]);
    expect(results.map((result) => result.status).sort()).toEqual(["PUBLISHED", "UNCHANGED"]);
    expect(await db.party.count()).toBe(100);
    for (const load of [async () => "[]", async () => "<html>offline</html>", async () => JSON.stringify(rows.slice(1)), async () => { throw new Error("Source offline"); }]) await expect(importPartyRegister(db, { load, snapshotDirectory: directory })).rejects.toThrow();
    expect(await db.partyRegistration.count()).toBe(100);
    expect(await db.ingestionRun.count({ where: { status: "FAILED" } })).toBe(4);
    const revised = rows.map((row, index) => index === 0 ? { ...row, NAZIV: "Changed source name", STATUS: "PRESTANAK", DATUM_STATUSA: "2024-01-01T00:00:00" } : row);
    await importPartyRegister(db, { load: async () => JSON.stringify(revised), snapshotDirectory: directory });
    expect(await db.partyRegistration.count()).toBe(200);
    expect((await db.party.findUniqueOrThrow({ where: { id: "1000" } })).slug).toBe("registar-1000");
    await expect(importPartyRegister(db, { load, snapshotDirectory: directory })).rejects.toThrow(/older registry/);
    const revision = await db.sourceRevision.findFirstOrThrow();
    await writeFile(revision.snapshotPath, "corrupt snapshot");
    await expect(importPartyRegister(db, { load, snapshotDirectory: directory })).rejects.toThrow(/different contents/);
  });

  it("stages uploads, publishes only explicitly reviewed documents, retains earlier versions and rejects damaged archives", async () => {
    const metadata = { partyId: "1000", context: "parliamentary-2024", title: "Fixture program", documentUrl: "https://example.org/program.pdf", language: "hr", publicationDate: null, evidence: [{ topic: "housing", quote: "Fixture quotation", page: 1 }] };
    const bytes = Buffer.from("%PDF-1.7\nsynthetic test fixture only\n%%EOF");
    const first = await uploadPartyProgram(db, bytes, metadata, directory);
    expect(first.publishedAt).toBeNull();
    expect(await db.programDocumentVersion.count({ where: { publishedAt: { not: null } } })).toBe(0);
    expect((await uploadPartyProgram(db, bytes, metadata, directory)).id).toBe(first.id);
    await expect(publishPartyProgram(db, first.id, " ")).rejects.toThrow();
    await Promise.all([publishPartyProgram(db, first.id, "Test reviewer"), publishPartyProgram(db, first.id, "Test reviewer")]);
    expect(await db.programReview.count()).toBe(1);
    const [second, repeated] = await Promise.all([uploadPartyProgram(db, bytes, { ...metadata, title: "Changed metadata" }, directory), uploadPartyProgram(db, bytes, { ...metadata, title: "Changed metadata" }, directory)]);
    expect(second.id).toBe(repeated.id);
    expect(second.version).toBe(2);
    expect(second.publishedAt).toBeNull();
    expect((await db.programDocumentVersion.findUniqueOrThrow({ where: { id: first.id } })).publishedAt).not.toBeNull();
    const third = await uploadPartyProgram(db, bytes, { ...metadata, title: "Third revision" }, directory);
    await publishPartyProgram(db, third.id, "Test reviewer");
    await expect(publishPartyProgram(db, second.id, "Test reviewer")).rejects.toThrow(/newer published/);
    const changed = await uploadPartyProgram(db, Buffer.concat([bytes, Buffer.from("changed bytes")]), metadata, directory);
    await writeFile(changed.storedDocumentPath, "damaged");
    await expect(publishPartyProgram(db, changed.id, "Test reviewer")).rejects.toThrow();
    expect(await db.programDocumentVersion.count({ where: { publishedAt: { not: null } } })).toBe(2);
  });
});
