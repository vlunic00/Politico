import type { Frequency, SeriesDefinition } from "./definitions";

export type PublishedPoint = {
  geographyId: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  unit: string;
  frequency: Frequency;
  methodologyVersion: string;
  sourceFlags: string;
  observationStatus: string;
};
export type Series = {
  slug: string;
  unit: string;
  frequency: Frequency;
  definition: string;
  limitations: string;
  latest: PublishedPoint;
  change: { value: number; unit: string; baseline: string } | null;
  eu: PublishedPoint | null;
  points: { period: string; croatia: number | null; eu: number | null; flags: string }[];
  source: {
    name: string; url: string; publicationDate: string | null; retrievedAt: string;
    updatedAt: string | null; checkedAt: string | null; methodologyUrl: string;
    dataset: string; revision: string;
  };
};

export const formatNumber = (value: number) => new Intl.NumberFormat("hr-HR", { maximumFractionDigits: 2 }).format(value);
export const formatDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium", timeZone: "Europe/Zagreb" }).format(new Date(value)) : "nije navedeno";
export function formatPeriod(start: string, frequency: Frequency, slug?: string) {
  if (slug === "population") return `1. 1. ${start.slice(0, 4)}.`;
  if (frequency === "ANNUAL") return start.slice(0, 4);
  if (frequency === "QUARTERLY") return `${start.slice(0, 4)}-Q${Math.floor((Number(start.slice(5, 7)) - 1) / 3) + 1}`;
  return start.slice(0, 7);
}

export function sparklinePath(values: (number | null)[]) {
  const numbers = values.filter((v): v is number => v !== null);
  const min = Math.min(...numbers), max = Math.max(...numbers);
  return values.map((value, i) => value === null ? "" : `${i === 0 || values[i - 1] === null ? "M" : "L"}${(i / Math.max(1, values.length - 1) * 200).toFixed(1)},${(28 - (value - min) / (max - min || 1) * 24).toFixed(1)}`).join(" ");
}

export function buildSeries(def: SeriesDefinition, observations: PublishedPoint[], source: Series["source"]): Series | null {
  const hr = observations.filter((p) => p.geographyId === "HR" && p.unit === def.unit && p.frequency === def.frequency).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const latest = hr.at(-1);
  if (!latest) return null;
  const previousYear = `${Number(latest.periodStart.slice(0, 4)) - 1}${latest.periodStart.slice(4)}`;
  const baseline = hr.find((p) => p.periodStart === previousYear && p.methodologyVersion === latest.methodologyVersion);
  const broken = hr.some((p) => baseline && p.periodStart > baseline.periodStart && /[bd]/i.test(p.sourceFlags));
  const delta = baseline && !broken ? latest.value - baseline.value : null;
  const change = delta !== null && baseline && (def.change === "points" || baseline.value !== 0) ? {
    value: def.change === "points" ? delta : delta / Math.abs(baseline.value) * 100,
    unit: def.change === "points" ? (def.unit.includes("%") ? "p. b." : "bodova") : "%",
    baseline: formatPeriod(baseline.periodStart, def.frequency, def.slug),
  } : null;
  const byPeriod = new Map(hr.map((point) => [point.periodStart, point]));
  const euByPeriod = new Map(observations.filter((p) => p.geographyId === "EU27_2020").map((p) => [p.periodStart, p]));
  const compatibleEu = (point: PublishedPoint | undefined, croatia: PublishedPoint | undefined) => point && croatia && point.unit === croatia.unit && point.frequency === croatia.frequency && point.periodEnd === croatia.periodEnd && point.methodologyVersion === croatia.methodologyVersion && !/[d]/i.test(point.sourceFlags + croatia.sourceFlags) ? point : null;
  const points: Series["points"] = [];
  const cursor = new Date(hr[0].periodStart);
  const months = { ANNUAL: 12, QUARTERLY: 3, MONTHLY: 1 }[def.frequency];
  while (cursor.toISOString().slice(0, 10) <= latest.periodStart) {
    const period = cursor.toISOString().slice(0, 10);
    const croatia = byPeriod.get(period);
    const eu = compatibleEu(euByPeriod.get(period), croatia);
    points.push({ period: formatPeriod(period, def.frequency, def.slug), croatia: croatia?.value ?? null, eu: eu?.value ?? null,
      flags: [croatia?.sourceFlags && `HR: ${croatia.sourceFlags}`, eu?.sourceFlags && `EU: ${eu.sourceFlags}`].filter(Boolean).join("; ") });
    cursor.setUTCMonth(cursor.getUTCMonth() + months);
  }
  return { slug: def.slug, unit: def.unit, frequency: def.frequency, definition: def.definition,
    limitations: def.limitations, latest, change, eu: compatibleEu(euByPeriod.get(latest.periodStart), latest), points, source };
}
