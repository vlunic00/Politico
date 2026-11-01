import { z } from "zod";
import { governments, latestGovernment, type Government } from "../governments";
import { seriesDefinitions, type SeriesDefinition } from "./definitions";
import type { PublishedPoint, Series } from "./series";

export type ComparisonRange = { start: string; end: string };
export const nextDay = (date: string) => new Date(Date.parse(date) + 86_400_000).toISOString().slice(0, 10);
export const todayInCroatia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function comparisonSelection(query: Record<string, string | string[] | undefined>, today: string) {
  const governmentId = z.string().refine((id) => governments.some((government) => government.id === id));
  const optionalDate = z.preprocess((value) => value === "" ? undefined : value, z.iso.date().optional());
  return z.object({
    first: governmentId.default(latestGovernment.id),
    second: governmentId.default(governments[governments.length - 2].id),
    indicator: z.string().refine((slug) => seriesDefinitions.some((definition) => definition.slug === slug)).default("real-gdp-growth"),
    mode: z.enum(["governments", "custom"]).default("governments"),
    start: optionalDate,
    end: optionalDate,
  }).superRefine((selection, context) => {
    if (selection.mode === "custom" && (!selection.start || !selection.end || selection.start > selection.end || selection.end > today))
      context.addIssue({ code: "custom", message: "Odaberite valjane datume: početak ne smije biti nakon kraja, a kraj ne smije biti u budućnosti." });
  }).safeParse(query);
}

export function governmentRange(government: Government, today: string): ComparisonRange {
  const limit = nextDay(today);
  return { start: government.start, end: government.end && government.end < limit ? government.end : limit };
}

export function compareGovernmentPeriod(series: Series, range: ComparisonRange, changeKind: SeriesDefinition["change"]) {
  // Population is a 1 January stock, even though the storage contract uses an annual reference period.
  const effectiveEnd = (point: PublishedPoint) => series.slug === "population" ? point.periodStart : point.periodEnd;
  const hr = series.observations.filter((point) => point.geographyId === "HR" && point.unit === series.unit && point.frequency === series.frequency)
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const baseline = hr.filter((point) => effectiveEnd(point) < range.start).at(-1) ?? null;
  const atStart = hr.find((point) => point.periodStart <= range.start && effectiveEnd(point) >= range.start) ?? null;
  const end = hr.filter((point) => effectiveEnd(point) >= range.start && effectiveEnd(point) < range.end).at(-1) ?? null;
  const matchingEu = (point: PublishedPoint | null) => point ? series.observations.find((eu) => eu.geographyId === "EU27_2020"
    && eu.periodStart === point.periodStart && eu.periodEnd === point.periodEnd && eu.unit === point.unit
    && eu.frequency === point.frequency && eu.methodologyVersion === point.methodologyVersion
    && !/d/i.test(eu.sourceFlags + point.sourceFlags)) ?? null : null;

  function change(first: PublishedPoint | null, last: PublishedPoint | null) {
    if (!first || !last) return { absolute: null, relative: null, reason: "Nedostaje početno opažanje prije razdoblja ili završno opažanje unutar razdoblja." };
    const intervening = series.observations.filter((point) => point.geographyId === first.geographyId && point.periodStart > first.periodStart && point.periodStart <= last.periodStart);
    if (/d/i.test(first.sourceFlags) || intervening.some((point) => /[bd]/i.test(point.sourceFlags) || point.methodologyVersion !== first.methodologyVersion || point.unit !== first.unit || point.frequency !== first.frequency))
      return { absolute: null, relative: null, reason: "Prekid serije ili neusklađene definicije, jedinice ili učestalost; promjena nije usporediva." };
    const absolute = last.value - first.value;
    const relative = changeKind === "points" ? absolute : first.value === 0 ? null : absolute / Math.abs(first.value) * 100;
    return { absolute, relative, reason: relative === null ? "Postotna promjena nije definirana za početnu vrijednost nula." : null };
  }

  const eu = { baseline: matchingEu(baseline), atStart: matchingEu(atStart), end: matchingEu(end) };
  return {
    baseline, atStart, end, eu,
    croatiaChange: change(baseline, end),
    euChange: change(eu.baseline, eu.end),
    changeUnit: changeKind === "points" ? (series.unit.includes("%") ? "p. b." : "bodova") : "%",
  };
}
