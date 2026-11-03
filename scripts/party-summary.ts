import "dotenv/config";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { extractProgram } from "../src/lib/parties/extraction";
import { generateProgramSummary, reviseProgramSummary } from "../src/lib/parties/summaries";

const { values } = parseArgs({ options: { version: { type: "string" }, extract: { type: "boolean" }, revise: { type: "string" } } });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (values.revise ? !!(values.version || values.extract) : !values.version) throw new Error("Use --version <document-version-id> [--extract], or --revise <summary-id>. No CLI approval; a human reviewer must use the editorial interface.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
try {
  const result = values.revise ? await reviseProgramSummary(db, values.revise) : values.extract ? await extractProgram(db, values.version!) : await generateProgramSummary(db, values.version!);
  console.info(JSON.stringify({ id: result.id, ...("status" in result ? { status: result.status, reviewUrl: `/admin/summaries/${result.id}` } : { complete: result.complete, extractionHash: result.contentHash }) }));
} finally { await db.$disconnect(); }
