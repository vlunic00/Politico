import "server-only";
import { cache } from "react";
import { z } from "zod";
import { getDb } from "../db";
import { contestSchema, electionMetadataSchema, type ElectionRecord } from "./contracts";

export const getElections = cache(async () => {
  const records: ElectionRecord[] = [];
  if (!process.env.DATABASE_URL) return { records, status: "unconfigured" as const };
  try {
    const elections = await getDb().election.findMany({ orderBy: { date: "desc" }, include: { publications: { where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: 1,
      include: { revision: true, contests: { orderBy: { code: "asc" } } } } } });
    for (const election of elections) {
      const publication = election.publications[0];
      if (!publication) continue;
      records.push({ id: election.id, title: election.title, kind: election.kind, date: election.date.toISOString().slice(0, 10), round: election.round, context: election.context,
        status: z.enum(["FINAL", "PRELIMINARY"]).parse(publication.status), publishedAt: publication.publishedAt!.toISOString(), retrievedAt: publication.revision.retrievedAt.toISOString(), revision: publication.revision.contentHash,
        metadata: electionMetadataSchema.parse(publication.metadata), contests: publication.contests.map((contest) => contestSchema.parse(contest.data)) });
    }
    return { records, status: records.length ? "ready" as const : "unimported" as const };
  } catch (error) {
    console.error("Election records unavailable:", error instanceof Error ? error.message : "Unknown database error");
    return { records: [], status: "error" as const };
  }
});
