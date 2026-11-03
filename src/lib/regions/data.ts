import "server-only";
import { cache } from "react";
import { getDb } from "../db";
import { regionalMetrics } from "./catalogue";

export const getRegionalStatistics = cache(async () => {
  const series: Record<string, { observations: { geographyId: string; year: number; value: number; flags: string }[]; unit: string; definition: string; limitations: string; source: { url: string; methodologyUrl: string; retrievedAt: string; updatedAt: string | null; checkedAt: string | null; revision: string } }> = {};
  if (!process.env.DATABASE_URL) return { status: "unconfigured" as const, series };
  try {
    const db = getDb();
    for (const slug of Object.keys(regionalMetrics)) {
      const latest = await db.indicatorObservation.findFirst({ where: { indicatorId: slug, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, select: { revisionId: true } });
      if (!latest) continue;
      const revision = await db.sourceRevision.findUniqueOrThrow({ where: { id: latest.revisionId }, include: { observations: { where: { indicatorId: slug, publishedAt: { not: null } } }, sourceDataset: { include: { ingestionRuns: { where: { status: "SUCCEEDED" }, orderBy: { finishedAt: "desc" }, take: 1 } } } } });
      const def = await db.indicatorDefinition.findUniqueOrThrow({ where: { id: slug } });
      series[slug] = { unit: def.unit, definition: def.definition, limitations: def.limitations ?? "",
        observations: revision.observations.map((point) => ({ geographyId: point.geographyId, year: point.periodStart.getUTCFullYear(), value: Number(point.value), flags: point.sourceFlags })),
        source: { url: revision.sourceDataset.url, methodologyUrl: revision.sourceDataset.methodologyUrl, retrievedAt: revision.retrievedAt.toISOString(), updatedAt: revision.sourceUpdatedAt?.toISOString() ?? null,
          checkedAt: revision.sourceDataset.ingestionRuns[0]?.finishedAt?.toISOString() ?? null, revision: revision.contentHash } };
    }
    return { status: Object.keys(series).length ? "ready" as const : "unimported" as const, series };
  } catch (error) {
    console.error("Regional statistics unavailable:", error instanceof Error ? error.message : "Unknown database error");
    return { status: "error" as const, series };
  }
});
