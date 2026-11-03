import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { importPartyRegister } from "../src/lib/parties/ingestion";
import { publishPartyProgram, uploadPartyProgram } from "../src/lib/parties/programs";
import { generateProgramSummary } from "../src/lib/parties/summaries";
import { fixturePdf, fixtureSummary } from "../src/lib/parties/summary-fixture";

export default async function setup() {
  const schema = process.env.EDITORIAL_TEST_SCHEMA;
  if (!schema || !/^summary_e2e_[a-f0-9]{32}$/.test(schema)) throw new Error("Invalid isolated test schema.");
  const directory = resolve(".data", schema);
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  async function cleanup() {
    await db.$disconnect(); await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end();
    if (!directory.startsWith(`${resolve(".data")}${sep}`) || !/^summary_e2e_[a-f0-9]{32}$/.test(schema!)) throw new Error("Invalid test directory.");
    await rm(directory, { recursive: true, force: true });
  }
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (const migration of (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort()) await pool.query(await readFile(join("prisma/migrations", migration, "migration.sql"), "utf8"));
    await mkdir(directory);
    const rows = Array.from({ length: 100 }, (_, index) => ({ SBT_ID: 1000 + index, NAZIV: `Synthetic ${index === 0 ? "desktop" : index === 1 ? "mobile" : index} party`, SKRACENI_NAZIV: null, STATUS: "AKTIVAN", REGISTARSKI_BROJ: String(index + 1), BROJ_KNJIGE: 1, DATUM_UPISA: "2020-01-01T00:00:00", DATUM_STATUSA: null, SJEDISTE: null }));
    await importPartyRegister(db, { load: async () => JSON.stringify(rows), snapshotDirectory: directory });
    const old = { LLM_API_KEY: process.env.LLM_API_KEY, LLM_MODEL: process.env.LLM_MODEL, LLM_BASE_URL: process.env.LLM_BASE_URL };
    try {
      process.env.LLM_API_KEY = "fixture-only"; process.env.LLM_MODEL = "fixture-only"; process.env.LLM_BASE_URL = "https://fixture.invalid/v1/";
      for (const [index, project] of ["desktop", "mobile"].entries()) {
        const version = await uploadPartyProgram(db, fixturePdf(), { partyId: String(1000 + index), context: "parliamentary-2024", title: `Synthetic ${project} document`, documentUrl: "https://example.org/synthetic.pdf", language: "hr", publicationDate: null }, directory);
        await publishPartyProgram(db, version.id, "Synthetic fixture source check");
        await generateProgramSummary(db, version.id, async () => Response.json({ model: "fixture-only", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(fixtureSummary()) } }] }));
      }
    } finally { for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
    return cleanup;
  } catch (error) { await cleanup(); throw error; }
}
