import "dotenv/config";
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { uploadPartyProgram, publishPartyProgram } from "../src/lib/parties/programs";

const { values } = parseArgs({ options: { file: { type: "string" }, metadata: { type: "string" }, publish: { type: "string" }, reviewer: { type: "string" } } });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (values.publish ? (!values.reviewer || values.file || values.metadata) : (!values.file || !values.metadata || values.reviewer)) throw new Error("Use --file <PDF> --metadata <JSON>, or --publish <version-id> --reviewer <name> after reviewing the source and citations.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
try {
  const version = values.publish
    ? await publishPartyProgram(db, values.publish, values.reviewer!)
    : await uploadPartyProgram(db, await readFile(values.file!), JSON.parse(await readFile(values.metadata!, "utf8")));
  console.info(JSON.stringify({ id: version.id, version: version.version, contentHash: version.contentHash, published: !!version.publishedAt }));
} finally { await db.$disconnect(); }
