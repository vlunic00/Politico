import { describe, expect, it } from "vitest";
import { governments, latestGovernment } from "../governments";
import { referencePeriod } from "./adapters";
import { seriesDefinitions, type Frequency } from "./definitions";
import { buildSeries, type PublishedPoint, type Series } from "./series";
import { compareGovernmentPeriod, comparisonSelection, governmentRange } from "./government-comparison";

const source: Series["source"] = { name: "Test fixture", url: "https://example.org", publicationDate: null, retrievedAt: "2026-11-01T12:00:00Z", updatedAt: null, checkedAt: null, methodologyUrl: "https://example.org", dataset: "fixture", revision: "fixture" };
function point(period: string, value: number, frequency: Frequency = "QUARTERLY", overrides: Partial<PublishedPoint> = {}): PublishedPoint {
  return { ...referencePeriod(period, frequency), frequency, geographyId: "HR", unit: "%", value, methodologyVersion: "v1", sourceFlags: "", observationStatus: "FINAL", ...overrides };
}
function series(points: PublishedPoint[], overrides: Partial<(typeof seriesDefinitions)[number]> = {}) {
  return buildSeries({ ...seriesDefinitions[0], unit: "%", frequency: points[0].frequency, ...overrides }, points, source)!;
}
const range = { start: "2020-07-23", end: "2024-05-17" };

describe("administration comparisons", () => {
  it("uses completed baseline and endpoint quarters, and shows the overlapping starting quarter separately", () => {
    const points = [point("2020-Q2", 10), point("2020-Q3", 11), point("2024-Q1", 14), point("2024-Q2", 100)];
    const data = series([...points, ...points.map((p) => ({ ...p, geographyId: "EU27_2020", value: p.value + 2 }))]);
    const result = compareGovernmentPeriod(data, range, "points");
    expect(result.baseline?.periodEnd).toBe("2020-06-30");
    expect(result.atStart?.periodStart).toBe("2020-07-01");
    expect(result.end?.periodEnd).toBe("2024-03-31");
    expect(result.croatiaChange.relative).toBe(4);
    expect(result.euChange.relative).toBe(4);
    expect(result.changeUnit).toBe("p. b.");
    expect(result.eu.end?.periodStart).toBe(result.end?.periodStart);
  });

  it("assigns the handover day to the successor and includes a custom end day", () => {
    const data = series([point("2024-04", 10, "MONTHLY"), point("2024-05", 12, "MONTHLY"), point("2024-06", 13, "MONTHLY")]);
    expect(compareGovernmentPeriod(data, { start: "2024-05-01", end: "2024-06-01" }, "points").end?.value).toBe(12);
    expect(compareGovernmentPeriod(data, { start: "2024-06-01", end: "2024-07-01" }, "points").baseline?.value).toBe(12);
    expect(governmentRange(latestGovernment, "2026-11-01").end).toBe("2026-11-02");
    expect(governmentRange(governments[3], "2026-11-01").end).toBe("2024-05-17");
  });

  it("does not assign a boundary year wholly to a government or invent missing historical baselines", () => {
    const data = series([point("2015", 10, "ANNUAL"), point("2016", 11, "ANNUAL"), point("2020", 14, "ANNUAL"), point("2023", 18, "ANNUAL"), point("2024", 20, "ANNUAL")]);
    const result = compareGovernmentPeriod(data, range, "points");
    expect(result.baseline?.periodStart).toBe("2016-01-01");
    expect(result.atStart?.periodStart).toBe("2020-01-01");
    expect(result.end?.periodStart).toBe("2023-01-01");
    expect(compareGovernmentPeriod(data, governmentRange(governments[0], "2026-11-01"), "points").croatiaChange.relative).toBeNull();
    const shortTerm = compareGovernmentPeriod(data, governmentRange(governments[1], "2026-11-01"), "points");
    expect(shortTerm.baseline?.value).toBe(10);
    expect(shortTerm.atStart?.value).toBe(11);
    expect(shortTerm.end).toBeNull();
    expect(shortTerm.croatiaChange.relative).toBeNull();
  });

  it("treats population as a 1 January stock and computes percent and absolute changes", () => {
    const data = series([point("2024", 100, "ANNUAL"), point("2025", 105, "ANNUAL"), point("2026", 110, "ANNUAL")], { slug: "population" });
    const result = compareGovernmentPeriod(data, { start: "2024-05-17", end: "2026-05-17" }, "percent");
    expect(result.baseline?.value).toBe(100);
    expect(result.atStart).toBeNull();
    expect(result.end?.value).toBe(110);
    expect(result.croatiaChange.absolute).toBe(10);
    expect(result.croatiaChange.relative).toBe(10);
  });

  it("retains absolute changes but suppresses division by zero, and keeps missing endpoints missing", () => {
    const data = series([point("2020-Q2", 0), point("2024-Q1", 4)]);
    const result = compareGovernmentPeriod(data, range, "percent");
    expect(result.croatiaChange.absolute).toBe(4);
    expect(result.croatiaChange.relative).toBeNull();
    expect(result.croatiaChange.reason).toMatch(/nula/);
    expect(compareGovernmentPeriod(data, { start: "2026-01-01", end: "2026-02-01" }, "points").end).toBeNull();
  });

  it.each([{ sourceFlags: "b" }, { sourceFlags: "d" }, { methodologyVersion: "v2" }, { unit: "EUR" }, { frequency: "MONTHLY" as const }])("refuses changes across a break or incompatible intermediate observation %o", (overrides) => {
    const data = series([point("2020-Q2", 10), point("2021-Q1", 12, "QUARTERLY", overrides), point("2024-Q1", 14)]);
    expect(compareGovernmentPeriod(data, range, "points").croatiaChange.relative).toBeNull();
  });

  it.each([{ periodEnd: "2024-02-29" }, { unit: "EUR" }, { frequency: "MONTHLY" as const }, { methodologyVersion: "v2" }, { sourceFlags: "d" }])("requires exactly compatible EU endpoints %o", (overrides) => {
    const data = series([point("2020-Q2", 10), point("2024-Q1", 14), point("2020-Q2", 12, "QUARTERLY", { geographyId: "EU27_2020" }), point("2024-Q1", 16, "QUARTERLY", { geographyId: "EU27_2020", ...overrides })]);
    const result = compareGovernmentPeriod(data, range, "points");
    expect(result.croatiaChange.relative).toBe(4);
    expect(result.eu.end).toBeNull();
    expect(result.euChange.relative).toBeNull();
  });

  it("does not substitute an older EU period and checks EU breaks independently", () => {
    const points = [point("2020-Q2", 10), point("2024-Q1", 14), point("2020-Q2", 12, "QUARTERLY", { geographyId: "EU27_2020" }), point("2023-Q4", 15, "QUARTERLY", { geographyId: "EU27_2020", sourceFlags: "b" })];
    expect(compareGovernmentPeriod(series(points), range, "points").eu.end).toBeNull();
    const result = compareGovernmentPeriod(series([...points, point("2024-Q1", 16, "QUARTERLY", { geographyId: "EU27_2020" })]), range, "points");
    expect(result.eu.end?.value).toBe(16);
    expect(result.euChange.relative).toBeNull();
    expect(result.croatiaChange.relative).toBe(4);
  });
});

describe("comparison selections and dated records", () => {
  const today = "2026-11-01";
  it("accepts defaults, empty optional form fields, and leap-day custom ranges", () => {
    expect(comparisonSelection({}, today).data).toMatchObject({ first: "plenkovic-3", second: "plenkovic-2" });
    expect(comparisonSelection({ start: "", end: "" }, today).success).toBe(true);
    expect(comparisonSelection({ mode: "custom", start: "2024-02-29", end: "2024-02-29" }, today).success).toBe(true);
  });
  it.each([
    { first: "unknown" }, { second: ["plenkovic-1", "plenkovic-2"] }, { indicator: "unknown" }, { mode: "unknown" },
    { mode: "custom" }, { mode: "custom", start: "2024-02-30", end: "2024-03-01" },
    { mode: "custom", start: "2025-01-01", end: "2024-01-01" },
    { mode: "custom", start: "2026-01-01", end: "2026-11-02" },
  ])("rejects malformed or ambiguous URL input %o", (query) => {
    expect(comparisonSelection(query, today).success).toBe(false);
  });
  it("keeps successive terms and coalition periods ordered, bounded and sourced", () => {
    expect(new Set(governments.map((government) => government.id)).size).toBe(5);
    for (const [index, government] of governments.entries()) {
      expect(government.sourceUrl).toMatch(/^https:\/\//);
      expect(government.programUrl).toMatch(/^https:\/\//);
      if (government.end) expect(government.end).toBe(governments[index + 1].start);
      expect(government.coalition[0].start).toBe(government.start);
      expect(government.coalition.at(-1)?.end).toBe(government.end);
      for (const [i, period] of government.coalition.entries()) {
        expect(period.sourceUrl).toMatch(/^https:\/\//);
        if (i) expect(period.start).toBe(government.coalition[i - 1].end);
        if (period.end) expect(period.start < period.end).toBe(true);
      }
      for (const event of government.events) {
        expect(event.date >= government.start && (!government.end || event.date < government.end)).toBe(true);
        expect(event.sourceUrl).toMatch(/^https:\/\//);
      }
    }
    expect(governments[2].coalition.map((period) => period.parties)).toEqual(["HDZ · Most", "HDZ · prijelazno razdoblje", "HDZ · HNS"]);
  });
});
