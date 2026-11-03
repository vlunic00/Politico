import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { importPartyRegister } from "./ingestion";
import { uploadPartyProgram, publishPartyProgram } from "./programs";
import { extractProgram } from "./extraction";
import { generateProgramSummary, reviseProgramSummary } from "./summaries";
import { reviewProgramSummary } from "./summary-review";
import { fixturePdf, fixtureSummary } from "./summary-fixture";

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
    vi.unstubAllEnvs();
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

  it("extracts real PDF pages, caches generation, gates publication by role and human checks, audits edits, and retains approved history", async () => {
    vi.stubEnv("LLM_API_KEY", "isolated-test-key"); vi.stubEnv("LLM_MODEL", "isolated-test-model"); vi.stubEnv("LLM_BASE_URL", "https://provider.example/v1/");
    const metadata = { partyId: "1000", context: "summary-test", title: "Synthetic test document", documentUrl: "https://example.org/fixture.pdf", language: "hr", publicationDate: null };
    const version = await uploadPartyProgram(db, fixturePdf(), metadata, directory);
    await expect(extractProgram(db, version.id)).rejects.toThrow(/Verify/);
    await publishPartyProgram(db, version.id, "Fixture source reviewer");
    const request = vi.fn(async () => Response.json({ model: "isolated-test-model", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(fixtureSummary()) } }] }));
    const generated = await generateProgramSummary(db, version.id, request);
    expect(generated.status).toBe("DRAFT");
    expect((await generateProgramSummary(db, version.id, request)).id).toBe(generated.id);
    expect(request).toHaveBeenCalledTimes(1);
    const editor = { id: "editor", role: "editor" as const }, reviewer = { id: "reviewer", role: "reviewer" as const };
    const review = { revision: 1, action: "save", content: fixtureSummary(), note: "Checked synthetic evidence", sourceChecked: true, croatianChecked: true, coverageChecked: true };
    await expect(reviewProgramSummary(db, generated.id, { ...review, action: "approve" }, editor)).rejects.toThrow(/recenzent/);
    await expect(reviewProgramSummary(db, generated.id, { ...review, action: "approve", croatianChecked: false }, reviewer)).rejects.toThrow(/Potvrdite/);
    expect(await db.programSummary.count({ where: { status: "APPROVED" } })).toBe(0);
    const edits = await Promise.allSettled([reviewProgramSummary(db, generated.id, review, editor), reviewProgramSummary(db, generated.id, review, editor)]);
    expect(edits.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.summaryReview.count()).toBe(1);
    const approved = await reviewProgramSummary(db, generated.id, { ...review, revision: 2, action: "approve" }, reviewer);
    expect(approved.publishedAt).not.toBeNull();
    expect(approved.generatedJson).toEqual(fixtureSummary());
    await expect(reviewProgramSummary(db, generated.id, { ...review, revision: 3 }, editor)).rejects.toThrow(/zaključen/);
    const second = await reviseProgramSummary(db, generated.id);
    expect(second.sequence).toBe(2);
    await reviewProgramSummary(db, second.id, { ...review, action: "approve" }, reviewer);
    const third = await reviseProgramSummary(db, second.id);
    await reviewProgramSummary(db, third.id, { ...review, action: "reject", content: null }, reviewer);
    expect(await db.programSummary.count({ where: { status: "APPROVED" } })).toBe(2);
    const fourth = await reviseProgramSummary(db, second.id);
    const laterDocument = await uploadPartyProgram(db, fixturePdf(), { ...metadata, title: "New source metadata" }, directory);
    await publishPartyProgram(db, laterDocument.id, "Fixture source reviewer");
    await expect(reviewProgramSummary(db, fourth.id, { ...review, action: "approve" }, reviewer)).rejects.toThrow(/novija/);
    expect((await db.programSummary.findUniqueOrThrow({ where: { id: generated.id } })).status).toBe("APPROVED");
    const logs = await db.summaryReview.findMany({ where: { summaryId: generated.id }, orderBy: { createdAt: "asc" } });
    expect(logs.map((log) => log.actorId)).toEqual(["editor", "reviewer"]);
    expect(logs[0].beforeJson).toHaveProperty("revision", 1);
    expect(logs[1].afterJson).toHaveProperty("status", "APPROVED");
    await writeFile(version.storedDocumentPath, "damaged archive");
    await expect(extractProgram(db, version.id)).rejects.toThrow();
    expect(await db.programSummary.count({ where: { status: "APPROVED" } })).toBe(2);
  }, 30000);
});
