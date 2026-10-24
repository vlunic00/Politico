import { describe, expect, it } from "vitest";
import { observationInputSchema } from "../contracts";
import { datasetUrl, seriesDefinitions } from "./definitions";
import { dzsQuery, parseDzs, parseEurostat, referencePeriod, type Snapshot } from "./adapters";
import { reviewReasons } from "./ingestion";
import { buildSeries, sparklinePath, type PublishedPoint, type Series } from "./series";
import { cubeSnapshot } from "../../fixtures/statistics";

const def = seriesDefinitions.find((d) => d.slug === "population")!;

describe("Eurostat adapter", () => {
  it("decodes row-major dimensions, retains zero, sparse missing data, flags and source update time", () => {
    const result = parseEurostat(def, cubeSnapshot({ "0": 0, "1": 101, "3": 202 }));
    expect(result.observations.map((p) => [p.geographyId, p.periodStart, p.value, p.observationStatus, p.sourceFlags])).toEqual([
      ["HR", "2024-01-01", 0, "PROVISIONAL", "p"], ["HR", "2025-01-01", 101, "REVISED", "r"], ["EU27_2020", "2025-01-01", 202, "FINAL", "b"],
    ]);
    expect(result.sourceUpdatedAt?.toISOString()).toBe("2026-10-20T21:00:00.000Z");
    expect(result.observations.every((p) => p.publicationDate === null)).toBe(true);
  });
  it("supports dense arrays and rejects strings, invalid indexes, dimensions, units and geographies", () => {
    const snapshot = cubeSnapshot();
    const payload = snapshot.payload as Record<string, unknown>;
    expect(parseEurostat(def, { ...snapshot, payload: { ...payload, value: [0, null, 200, 202] } }).observations).toHaveLength(3);
    for (const value of [{ "4": 1 }, { "-1": 1 }, { "0": "1" }, { "0": Infinity }])
      expect(() => parseEurostat(def, { ...snapshot, payload: { ...payload, value } })).toThrow();
    const wrong = structuredClone(snapshot);
    const p = wrong.payload as { dimension: Record<string, { category: { index: Record<string, number> } }> };
    p.dimension.unit.category.index = { PC: 0 };
    expect(() => parseEurostat(def, wrong)).toThrow(/Incompatible unit/);
    p.dimension.unit.category.index = { NR: 0 };
    p.dimension.geo.category.index = { HR: 0, EU28: 1 };
    expect(() => parseEurostat(def, wrong)).toThrow(/geography/);
  });
  it("rejects an asynchronous warning instead of importing it as data", () => {
    expect(() => parseEurostat(def, { ...cubeSnapshot(), payload: { warning: { status: 413 } } })).toThrow();
  });
});

describe("DZS adapter", () => {
  const wage = seriesDefinitions.find((d) => d.slug === "nominal-net-wages")!;
  const metadata = { title: "Wages, NKD 2025", variables: [
    { code: "DJELATNOST", values: ["000"], valueTexts: ["TOTAL"] },
    { code: "GODINA", values: ["2025", "2026"], valueTexts: ["2025", "2026"] },
    { code: "PERIOD", values: ["0", "1", "2", "13"], valueTexts: ["I-XII", "I", "II", "Q1"] },
    { code: "PLAĆA", values: ["1", "2"], valueTexts: ["GROSS", "NET"] },
  ] };
  const snapshot: Snapshot = { indicator: wage.slug, request: { url: datasetUrl(wage) }, retrievedAt: "2026-10-24T12:00:00Z", metadata,
    payload: { columns: metadata.variables.map((v) => ({ code: v.code, type: "d" })), metadata: [{ source: "Croatian Bureau of Statistics" }], data: [
      { key: ["000", "2025", "1", "2"], values: ["1234.5"] },
      { key: ["000", "2025", "2", "2"], values: ["-"] },
    ] } };
  it("selects only individual months and the documented net wage dimension", () => {
    const query = dzsQuery(wage, metadata);
    expect(query.query.find((q) => q.code === "PERIOD")?.selection.values).toEqual(["1", "2"]);
    const result = parseDzs(wage, snapshot);
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]).toMatchObject({ value: 1234.5, unit: "EUR", periodEnd: "2025-01-31", publicationDate: null });
  });
  it("rejects mismatched gross wages, malformed numbers and changed columns", () => {
    const payload = snapshot.payload as Record<string, unknown>;
    for (const row of [{ key: ["000", "2025", "1", "1"], values: ["100"] }, { key: ["000", "2025", "1", "2"], values: ["100 EUR"] }])
      expect(() => parseDzs(wage, { ...snapshot, payload: { ...payload, data: [row] } })).toThrow();
    expect(() => parseDzs(wage, { ...snapshot, payload: { ...payload, columns: [] } })).toThrow();
    const changed = structuredClone(metadata);
    changed.variables[2].valueTexts[1] = "I-III";
    expect(() => dzsQuery(wage, changed)).toThrow(/meaning changed/);
  });
});

describe("reference periods and publication guards", () => {
  it("aligns leap years and quarters and rejects malformed periods", () => {
    expect(referencePeriod("2024-02", "MONTHLY").periodEnd).toBe("2024-02-29");
    expect(referencePeriod("2024-Q4", "QUARTERLY").periodEnd).toBe("2024-12-31");
    expect(() => referencePeriod("2024-13", "MONTHLY")).toThrow();
    const observation = parseEurostat(def, cubeSnapshot()).observations[0];
    expect(observationInputSchema.safeParse({ ...observation, periodEnd: "2024-06-30" }).success).toBe(false);
  });
  it("stages short histories, disappeared observations and large revisions; rejects duplicate cells", () => {
    const incoming = parseEurostat(def, cubeSnapshot()).observations;
    expect(reviewReasons(def, incoming, [])).toContain("Croatian history requires 5 observations; received 2.");
    expect(reviewReasons({ ...def, minimumHistory: 2 }, incoming, [])).toEqual([]);
    expect(reviewReasons({ ...def, minimumHistory: 2 }, incoming.slice(1), incoming).some((s) => s.includes("missing"))).toBe(true);
    expect(reviewReasons(def, incoming.map((p) => ({ ...p, value: p.value * 2 })), incoming).some((s) => s.includes("Large historical revision"))).toBe(true);
    expect(() => reviewReasons(def, [...incoming, incoming[0]], [])).toThrow(/Duplicate/);
  });
});

const source: Series["source"] = { name: "Test", url: "https://example.org", publicationDate: null, retrievedAt: "2026-01-01T00:00:00Z", updatedAt: null, checkedAt: null, methodologyUrl: "https://example.org", dataset: "test", revision: "test" };
function point(year: number, value: number, overrides: Partial<PublishedPoint> = {}): PublishedPoint {
  return { geographyId: "HR", ...referencePeriod(String(year), "ANNUAL"), value, unit: "%", frequency: "ANNUAL", methodologyVersion: "v1", sourceFlags: "", observationStatus: "FINAL", ...overrides };
}
const rate = { ...def, unit: "%", change: "points" as const };

describe("published time series", () => {
  it("distinguishes percentage points from percentages and aligns EU periods", () => {
    const data = [point(2024, 10), point(2025, 12), point(2025, 13, { geographyId: "EU27_2020" })];
    expect(buildSeries(rate, data, source)?.change?.value).toBe(2);
    expect(buildSeries({ ...rate, change: "percent" }, data, source)?.change?.value).toBe(20);
    expect(buildSeries(rate, data, source)?.eu?.value).toBe(13);
    for (const override of [{ unit: "EUR" }, { frequency: "MONTHLY" as const }, { methodologyVersion: "v2" }, { periodEnd: "2025-06-30" }, { sourceFlags: "d" }])
      expect(buildSeries(rate, [...data.slice(0, 2), { ...data[2], ...override }], source)?.eu).toBeNull();
  });
  it("keeps gaps, refuses stale EU values, zero denominators and changes across breaks", () => {
    expect(buildSeries(rate, [point(2023, 10), point(2025, 12)], source)?.points[1].croatia).toBeNull();
    expect(buildSeries(rate, [point(2024, 10, { geographyId: "EU27_2020" }), point(2025, 12)], source)?.eu).toBeNull();
    expect(buildSeries({ ...rate, change: "percent" }, [point(2024, 0), point(2025, 12)], source)?.change).toBeNull();
    expect(buildSeries(rate, [point(2024, 10), point(2025, 12, { sourceFlags: "b" })], source)?.change).toBeNull();
    expect(sparklinePath([1, null, 2])).toMatch(/^M.* M/);
  });
});
