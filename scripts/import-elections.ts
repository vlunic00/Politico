import "dotenv/config";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { elections } from "../src/lib/elections/catalogue";
import { importElection, publishElectionRevision } from "../src/lib/elections/ingestion";

const { values } = parseArgs({ options: { election: { type: "string" }, review: { type: "string" }, reviewer: { type: "string" } } });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (values.review ? (!values.reviewer || values.election) : !!values.reviewer) throw new Error("Use --election <slug>, or --review <publication-id> --reviewer <actual source reviewer> after inspecting the archived source.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
try {
  if (values.review) console.info(JSON.stringify(await publishElectionRevision(db, values.review, values.reviewer!)));
  else {
    const definitions = elections.filter((def) => !values.election || def.id === values.election);
    if (!definitions.length) throw new Error("Unknown election.");
    for (const def of definitions) try { const result = await importElection(db, def); console.info(`${def.id}: ${JSON.stringify(result)}`); if (result.status === "NEEDS_REVIEW") process.exitCode = 1; }
    catch (error) { console.error(`${def.id}: ${error instanceof Error ? error.message : "Import failed"}`); process.exitCode = 1; }
  }
} finally { await db.$disconnect(); }
