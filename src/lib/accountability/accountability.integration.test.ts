import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { CorrectionLimitError, publicCorrections, reviewCorrection, submitCorrection } from "../corrections";

describe.skipIf(!process.env.DATABASE_URL)("corrections in isolated PostgreSQL", () => {
  const schema = `accountability_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  const submission = { pagePath: "/accountability#financing", claim: "Synthetic private claim for testing.", proposed: "Synthetic private proposed correction.", evidenceUrl: "https://www.sabor.hr/synthetic" };
  const review = { action: "ACCEPTED", note: "Private reviewer note, never public.", publicSummary: "Synthetic correction applied to the displayed amount.", sourceUrl: "https://www.sabor.hr/synthetic", applied: true };
  const reviewer = { id: "fixture-reviewer", role: "reviewer" as const };
  beforeAll(async () => {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (const migration of (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort()) await pool.query(await readFile(join("prisma/migrations", migration, "migration.sql"), "utf8"));
  }, 20000);
  beforeEach(async () => { await db.correctionReview.deleteMany(); await db.correction.deleteMany(); });
  afterAll(async () => {
    await db.$disconnect(); await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end();
  });
  it("deduplicates concurrent public submissions and never publishes unreviewed claims", async () => {
    const ids = await Promise.all([submitCorrection(db, submission), submitCorrection(db, submission)]);
    expect(ids[0]).toBe(ids[1]); expect(await db.correction.count()).toBe(1);
    expect(await publicCorrections(db)).toEqual([]);
    await expect(submitCorrection(db, { ...submission, evidenceUrl: "javascript:alert(1)" })).rejects.toThrow();
    expect(await db.correction.count()).toBe(1);
  });
  it("authorizes reviewers, rejects incomplete acceptance, serializes competing decisions and exposes only the public projection", async () => {
    const id = await submitCorrection(db, submission);
    await expect(reviewCorrection(db, id, review, { id: "fixture-editor", role: "editor" })).rejects.toThrow(/recenzent/);
    await expect(reviewCorrection(db, id, { ...review, applied: false }, reviewer)).rejects.toThrow();
    expect(await db.correctionReview.count()).toBe(0);
    expect((await db.correction.findUniqueOrThrow({ where: { id } })).status).toBe("PENDING");
    const decisions = await Promise.allSettled([reviewCorrection(db, id, review, reviewer), reviewCorrection(db, id, review, reviewer)]);
    expect(decisions.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(await db.correctionReview.count()).toBe(1);
    const published = await publicCorrections(db);
    expect(published).toHaveLength(1);
    expect(published[0].publicSummary).toBe(review.publicSummary);
    expect(published[0].correction).toEqual({ pagePath: submission.pagePath });
    const json = JSON.stringify(published);
    for (const privateText of [submission.claim, submission.proposed, review.note, reviewer.id, "fingerprint"]) expect(json).not.toContain(privateText);
    await expect(reviewCorrection(db, id, { ...review, action: "REJECTED" }, reviewer)).rejects.toThrow(/zaključena/);
  });
  it("keeps rejection private and enforces a shared persistent hourly limit, while permitting duplicate acknowledgments", async () => {
    const id = await submitCorrection(db, submission);
    await reviewCorrection(db, id, { action: "REJECTED", note: "Synthetic evidence does not support this report.", publicSummary: "", sourceUrl: "", applied: false }, reviewer);
    expect(await publicCorrections(db)).toEqual([]);
    for (let index = 1; index < 30; index++) await submitCorrection(db, { ...submission, claim: `Synthetic private claim number ${index}.` });
    expect(await submitCorrection(db, submission)).toBe(id);
    await expect(submitCorrection(db, { ...submission, claim: "A different claim above the hourly limit." })).rejects.toBeInstanceOf(CorrectionLimitError);
    await db.correction.updateMany({ data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
    expect(await submitCorrection(db, submission)).not.toBe(id);
  });
});
