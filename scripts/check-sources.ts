import "dotenv/config";
import { isDeepStrictEqual } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { fetchSnapshot, parseSnapshot } from "../src/lib/statistics/adapters";
import { seriesDefinitions } from "../src/lib/statistics/definitions";
import { reviewReasons, snapshotContentHash } from "../src/lib/statistics/ingestion";
import { fetchRegisterText, parsePartyRegister } from "../src/lib/parties/registry";
import { registerDatasetId } from "../src/lib/parties/catalogue";
import { fetchElectionSnapshot, parseElectionSnapshot } from "../src/lib/elections/adapters";
import { elections } from "../src/lib/elections/catalogue";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for comparison with published data.");
const selection = process.argv[2];
if (selection && !["statistics", "parties", "elections"].includes(selection)) throw new Error("Optional scope: statistics | parties | elections");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
let issues = 0;
async function check(id: string, action: () => Promise<string[]>) {
  try {
    const reasons = await action();
    if (reasons.length) issues++;
    console.info(JSON.stringify({ id, status: reasons.length ? "REVIEW" : "PASS", reasons }));
  } catch {
    issues++;
    console.error(JSON.stringify({ id, status: "FAILED", reasons: ["Fetch, parsing or database comparison failed; published data unchanged."] }));
  }
}
try {
  if (!selection || selection === "statistics") for (const def of seriesDefinitions) await check(def.slug, async () => {
    const snapshot = await fetchSnapshot(def);
    const incoming = parseSnapshot(def, snapshot);
    const latest = await db.indicatorObservation.findFirst({ where: { indicatorId: def.slug, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, include: { revision: true } });
    if (latest?.revision.contentHash === snapshotContentHash(def, snapshot)) return [];
    const previous = latest ? await db.indicatorObservation.findMany({ where: { revisionId: latest.revisionId, publishedAt: { not: null } } }) : [];
    const reasons = reviewReasons(def, incoming.observations, previous.map((point) => ({ ...point, value: Number(point.value), periodStart: point.periodStart.toISOString().slice(0, 10), periodEnd: point.periodEnd.toISOString().slice(0, 10) })));
    if (latest?.revision.sourceUpdatedAt && incoming.sourceUpdatedAt && incoming.sourceUpdatedAt < latest.revision.sourceUpdatedAt) reasons.push("Source update timestamp regressed.");
    return reasons;
  });
  if (!selection || selection === "parties") await check("party-register", async () => {
    const incoming = parsePartyRegister(JSON.parse(await fetchRegisterText()));
    const latest = await db.sourceRevision.findFirst({ where: { sourceDatasetId: registerDatasetId, registrations: { some: {} } }, orderBy: { retrievedAt: "desc" }, include: { registrations: true } });
    return incoming.length < 100 || latest?.registrations.some((row) => !incoming.some((party) => party.id === row.partyId)) ? ["Registry records disappeared; inspect the original export."] : [];
  });
  if (!selection || selection === "elections") for (const def of elections) await check(def.id, async () => {
    const incoming = parseElectionSnapshot(def, await fetchElectionSnapshot(def));
    const latest = await db.electionPublication.findFirst({ where: { electionId: def.id, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, include: { contests: { orderBy: { code: "asc" } } } });
    return latest && (!isDeepStrictEqual(latest.metadata, incoming.metadata) || !isDeepStrictEqual(latest.contests.map((contest) => contest.data), [...incoming.contests].sort((a, b) => a.code.localeCompare(b.code)))) ? ["Final election results changed; human review required."] : [];
  });
  if (issues) process.exitCode = 1;
  console.info(JSON.stringify({ event: "source_check", issues, readOnly: true }));
} finally { await db.$disconnect(); }
