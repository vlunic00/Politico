import { datasetUrl, seriesDefinitions } from "../lib/statistics/definitions";
import type { Snapshot } from "../lib/statistics/adapters";

// Synthetic adapter data for automated tests only; never imported into the public database.
export function cubeSnapshot(values: Record<string, number> = { "0": 100, "1": 101, "2": 200, "3": 202 }): Snapshot {
  const def = seriesDefinitions.find((d) => d.slug === "population")!;
  return { indicator: def.slug, request: { url: datasetUrl(def) }, retrievedAt: "2026-10-24T12:00:00Z", payload: {
    version: "2.0", class: "dataset", source: "ESTAT", updated: "2026-10-20T23:00:00+0200",
    id: ["unit", "sex", "age", "freq", "geo", "time"], size: [1, 1, 1, 1, 2, 2],
    dimension: Object.fromEntries(Object.entries({ unit: ["NR"], sex: ["T"], age: ["TOTAL"], freq: ["A"], geo: ["HR", "EU27_2020"], time: ["2024", "2025"] }).map(([key, codes]) => [key, { category: { index: Object.fromEntries(codes.map((code, i) => [code, i])) } }])),
    value: values, status: { "0": "p", "1": "r", "2": "e", "3": "b" },
  } };
}
