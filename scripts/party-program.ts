import "dotenv/config";
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { uploadPartyProgram, publishPartyProgram, programMetadataSchema, validateProgramDocument } from "../src/lib/parties/programs";
import { boundedResponse } from "../src/lib/parties/llm";

const { values } = parseArgs({ options: { file: { type: "string" }, download: { type: "boolean" }, metadata: { type: "string" }, publish: { type: "string" }, reviewer: { type: "string" } } });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (values.publish ? (!values.reviewer || values.file || values.download || values.metadata) : (!values.metadata || (!!values.file === !!values.download) || values.reviewer)) throw new Error("Use --file <PDF> --metadata <JSON>, --download --metadata <JSON> for a verified official URL, or --publish <version-id> --reviewer <name> after source review.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
try {
  let version;
  if (values.publish) version = await publishPartyProgram(db, values.publish, values.reviewer!);
  else {
    const metadata = programMetadataSchema.parse(JSON.parse(await readFile(values.metadata!, "utf8")));
    let bytes;
    if (values.download) {
      // Retrieval is a maintainer-only CLI action, never a URL accepted by a public endpoint.
      const response = await fetch(metadata.documentUrl, { redirect: "error", signal: AbortSignal.timeout(30000) });
      if (!response.ok) { await response.body?.cancel(); throw new Error(`Official program returned HTTP ${response.status}.`); }
      bytes = await boundedResponse(response, 20_000_000);
    } else bytes = await readFile(values.file!);
    validateProgramDocument(bytes);
    version = await uploadPartyProgram(db, bytes, metadata);
  }
  console.info(JSON.stringify({ id: version.id, version: version.version, contentHash: version.contentHash, published: !!version.publishedAt }));
} finally { await db.$disconnect(); }
