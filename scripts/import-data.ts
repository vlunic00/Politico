import "dotenv/config";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seriesDefinitions } from "../src/lib/statistics/definitions";
import { ingest, publishReviewedRevision } from "../src/lib/statistics/ingestion";

const { values } = parseArgs({ options: {
  source: { type: "string" }, indicator: { type: "string" }, review: { type: "string" }, publish: { type: "boolean", default: false },
} });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
try {
  if (values.review) {
    const revision = await db.sourceRevision.findUniqueOrThrow({ where: { id: values.review }, include: { observations: { orderBy: [{ geographyId: "asc" }, { periodStart: "asc" }] } } });
    const def = seriesDefinitions.find((d) => revision.sourceDatasetId === `${d.source}:${d.slug}`);
    if (!def) throw new Error("Definition not found.");
    const runs = await db.ingestionRun.findMany({ where: { sourceDatasetId: revision.sourceDatasetId, status: "NEEDS_REVIEW", error: { contains: revision.id } }, select: { error: true } });
    console.info(JSON.stringify({ revision: revision.id, snapshot: revision.snapshotPath, issues: runs, observations: revision.observations }, null, 2));
    if (values.publish) console.info(`Published ${await publishReviewedRevision(db, def, revision.id)} observations after explicit review.`);
  } else {
    if (values.publish) throw new Error("--publish requires --review <revision-id>.");
    const definitions = seriesDefinitions.filter((d) => (!values.source || d.source === values.source) && (!values.indicator || d.slug === values.indicator));
    if (!definitions.length) throw new Error("No matching source or indicator.");
    for (const def of definitions) {
      try {
        const result = await ingest(db, def);
        console.info(`${def.slug}: ${JSON.stringify(result)}`);
        if (result.status === "NEEDS_REVIEW") process.exitCode = 1;
      } catch (error) {
        console.error(`${def.slug}: ${error instanceof Error ? error.message : error}`);
        process.exitCode = 1;
      }
    }
  }
} finally {
  await db.$disconnect();
}
