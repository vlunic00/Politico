import "server-only";
import { cache } from "react";
import { getDb } from "../db";
import { seriesDefinitions } from "./definitions";
import { buildSeries, type Series } from "./series";

export const getStatistics = cache(async () => {
  const series: Record<string, Series> = {};
  if (!process.env.DATABASE_URL) return { series, runs: [], status: "unconfigured" as const };
  try {
    const db = getDb();
    const [definitions, runs] = await Promise.all([
      db.indicatorDefinition.findMany({ where: { coverageStatus: "ACTIVE" }, include: {
        observations: { where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: 1, select: { revisionId: true } },
      } }),
      db.sourceDataset.findMany({ include: {
        source: true,
        ingestionRuns: { orderBy: { startedAt: "desc" }, take: 1 },
      } }),
    ]);
    const revisions = await db.sourceRevision.findMany({
      where: { id: { in: definitions.flatMap((d) => d.observations.map((p) => p.revisionId)) } },
      include: { observations: { where: { publishedAt: { not: null } } }, sourceDataset: { include: {
        source: true, ingestionRuns: { where: { status: "SUCCEEDED" }, orderBy: { finishedAt: "desc" }, take: 1 },
      } } },
    });
    for (const revision of revisions) {
      const def = seriesDefinitions.find((d) => revision.sourceDatasetId === `${d.source}:${d.slug}`);
      if (!def) continue;
      const stored = definitions.find((d) => d.id === def.slug)!;
      const dataset = revision.sourceDataset;
      const result = buildSeries({ ...def, unit: stored.unit, frequency: stored.frequency, definition: stored.definition, limitations: stored.limitations ?? "" }, revision.observations.map((point) => ({
        ...point, value: Number(point.value), periodStart: point.periodStart.toISOString().slice(0, 10), periodEnd: point.periodEnd.toISOString().slice(0, 10),
      })), {
        name: dataset.source.name, url: dataset.url, dataset: def.dataset,
        publicationDate: revision.publicationDate?.toISOString().slice(0, 10) ?? null,
        retrievedAt: revision.retrievedAt.toISOString(), updatedAt: revision.sourceUpdatedAt?.toISOString() ?? null,
        checkedAt: dataset.ingestionRuns[0]?.finishedAt?.toISOString() ?? null,
        methodologyUrl: dataset.methodologyUrl, revision: revision.contentHash,
      });
      if (result) series[def.slug] = result;
    }
    return { series, runs: runs.map((dataset) => ({
      id: dataset.id, sourceId: dataset.sourceId, url: dataset.url,
      status: dataset.ingestionRuns[0]?.status ?? null,
      finishedAt: dataset.ingestionRuns[0]?.finishedAt?.toISOString() ?? null,
    })), status: "ready" as const };
  } catch (error) {
    console.error("Statistical database unavailable:", error instanceof Error ? error.message : "Unknown database error");
    return { series, runs: [], status: "error" as const };
  }
});
