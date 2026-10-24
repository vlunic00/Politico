import { describe, expect, it } from "vitest";
import { featuredIndicators, indicators, sources, topics } from "./catalogue";
import { normalizeSearch, searchCatalogue } from "./search";
import { observationInputSchema } from "./contracts";

describe("Phase 1 catalogue", () => {
  it("keeps stable unique links and complete topic coverage", () => {
    expect(new Set(topics.map((topic) => topic.slug)).size).toBe(16);
    expect(new Set(indicators.map((indicator) => indicator.slug)).size).toBe(
      indicators.length,
    );
    for (const topic of topics)
      expect(
        indicators.some((indicator) => indicator.topic === topic.slug),
      ).toBe(true);
    for (const slug of featuredIndicators)
      expect(indicators.some((indicator) => indicator.slug === slug)).toBe(
        true,
      );
    for (const source of sources)
      expect(new URL(source.url).protocol).toBe("https:");
  });
  it("finds Croatian text with or without diacritics", () => {
    expect(normalizeSearch(" ČĆŽŠĐ čćžšđ ")).toBe("cczsd cczsd");
    expect(
      searchCatalogue("place").some(
        (result) => result.title === "Realne plaće",
      ),
    ).toBe(true);
    expect(
      searchCatalogue("DZS").some((result) => result.href === "/sources#dzs"),
    ).toBe(true);
    expect(searchCatalogue(" ")).toEqual([]);
    expect(searchCatalogue("no-such-indicator")).toEqual([]);
  });
});

const observation = {
  indicatorId: "test",
  geographyId: "HR",
  periodStart: "2025-01-01",
  periodEnd: "2025-12-31",
  frequency: "ANNUAL",
  value: 0,
  unit: "%",
  sourceId: "test-source",
  sourceDatasetId: "test-dataset",
  publicationDate: null,
  retrievedAt: "2026-01-01T12:00:00Z",
  observationStatus: "PROVISIONAL",
  revisionId: "test-revision",
  methodologyVersion: "v1",
};

describe("observation input contract", () => {
  it("preserves a genuine zero and provisional metadata", () => {
    expect(observationInputSchema.parse(observation)).toEqual(observation);
  });
  it.each([null, "0", NaN, Infinity])(
    "rejects a non-numeric or missing value %s",
    (value) => {
      expect(
        observationInputSchema.safeParse({ ...observation, value }).success,
      ).toBe(false);
    },
  );
  it("rejects reversed periods, invalid dates and missing provenance", () => {
    expect(
      observationInputSchema.safeParse({
        ...observation,
        periodEnd: "2024-12-31",
      }).success,
    ).toBe(false);
    expect(
      observationInputSchema.safeParse({
        ...observation,
        periodStart: "2025-02-30",
      }).success,
    ).toBe(false);
    expect(
      observationInputSchema.safeParse({ ...observation, revisionId: "" })
        .success,
    ).toBe(false);
  });
});
