import { expect, it } from "vitest";
import eurostat from "../../fixtures/source-snapshots/population.json";
import dzs from "../../fixtures/source-snapshots/nominal-net-wages.json";
import { parseSnapshot, type Snapshot } from "./adapters";
import { seriesDefinitions } from "./definitions";
import { reviewReasons } from "./ingestion";

// Actual archived source responses; mutations below simulate drift, never public observations.
it("replays official snapshots and rejects changed dimensions, units and DZS meanings", () => {
  for (const snapshot of [eurostat, dzs]) {
    const def = seriesDefinitions.find((def) => def.slug === snapshot.indicator)!;
    const parsed = parseSnapshot(def, snapshot);
    expect(parsed.observations.length).toBeGreaterThan(10);
    expect(parsed.observations.every((point) => point.unit === def.unit && point.indicatorId === def.slug)).toBe(true);
  }
  const def = seriesDefinitions.find((def) => def.slug === eurostat.indicator)!;
  const renamed = structuredClone(eurostat);
  renamed.payload.id[0] = "changed-dimension";
  expect(() => parseSnapshot(def, renamed)).toThrow();
  const wrongUnit = structuredClone(eurostat);
  Reflect.deleteProperty(wrongUnit.payload.dimension.unit.category.index, "NR");
  Object.assign(wrongUnit.payload.dimension.unit.category.index, { OTHER: 0 });
  expect(() => parseSnapshot(def, wrongUnit)).toThrow(/unit/);
  const wages = seriesDefinitions.find((def) => def.slug === dzs.indicator)!;
  const meaning = structuredClone(dzs);
  meaning.metadata.variables.find((variable) => variable.code === "DJELATNOST")!.valueTexts[0] = "CHANGED";
  expect(() => parseSnapshot(wages, meaning)).toThrow(/meaning/);
  const columns = structuredClone(dzs);
  columns.payload.columns[1] = columns.payload.columns[0];
  expect(() => parseSnapshot(wages, columns)).toThrow(/columns/);
});

it("flags disappeared observations and historical revisions in real source histories", () => {
  const def = seriesDefinitions.find((def) => def.slug === eurostat.indicator)!;
  const previous = parseSnapshot(def, eurostat as Snapshot).observations;
  expect(reviewReasons(def, previous, previous)).toEqual([]);
  expect(reviewReasons(def, previous.slice(1), previous).some((reason) => reason.includes("missing"))).toBe(true);
  const changed = previous.map((point, index) => index === 0 ? { ...point, value: point.value * 2 } : point);
  expect(reviewReasons(def, changed, previous).some((reason) => reason.includes("Large historical revision"))).toBe(true);
});
