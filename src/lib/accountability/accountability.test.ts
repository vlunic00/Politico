import { describe, expect, it } from "vitest";
import dossier from "./records/2026-11-04.json";
import manifest from "./records/2026-11-04.sources.json";
import { accountabilitySchema } from "./contracts";
import { accountability, formatEuroCents } from "./data";
import { governments } from "../governments";
import { indicators, topics } from "../catalogue";
import { searchCatalogue } from "../search";
import { correctionReviewSchema, correctionSchema } from "../corrections";
import { datasetUrl, seriesDefinitions } from "../statistics/definitions";

describe("accountability dossier", () => {
  it("pins every official source to one content-addressed snapshot without treating retrieval as publication", () => {
    expect(manifest).toHaveLength(accountability.sources.length);
    expect(new Set(manifest.map((entry) => entry.sourceId)).size).toBe(manifest.length);
    for (const source of accountability.sources) {
      const snapshot = manifest.find((entry) => entry.sourceId === source.id)!;
      expect(snapshot.url).toBe(source.url);
      expect(snapshot.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(snapshot.file).toMatch(new RegExp(`^${snapshot.sha256}\\.(pdf|html)$`));
      expect(Number.isFinite(Date.parse(snapshot.retrievedAt))).toBe(true);
    }
  });
  it("reconciles all 34 financial rows in integer cents and preserves the original six-cent discrepancy", () => {
    expect(accountability.financing.rows).toHaveLength(34);
    expect(accountability.financing.rows.reduce((sum, row) => sum + row.paidCents, 0)).toBe(974091906);
    expect(accountability.financing.rows.reduce((sum, row) => sum + row.allocatedCents, 0)).toBe(974091901);
    expect(accountability.financing.reconciliation.allocatedCents).toBe(-1);
    expect(accountability.financing.paidCents - accountability.financing.allocatedCents).toBe(6);
    expect(formatEuroCents(0)).toMatch(/0,00/);
    expect(accountability.sources.find((source) => source.id === accountability.financing.sourceId)?.publicationDate).toBeNull();
    const changed = structuredClone(dossier); changed.financing.rows[0].paidCents++;
    expect(() => accountabilitySchema.parse(changed)).toThrow(/reconcile/);
  });
  it("rejects ungrounded states, future evidence, unsafe URLs, missing sources and fictional deadlines", () => {
    for (const change of [
      (data: typeof dossier) => { data.commitments[0].evidence = []; },
      (data: typeof dossier) => { data.commitments[0].state = "overdue"; },
      (data: typeof dossier) => { data.commitments[0].evidence[0].date = "2099-01-01"; },
      (data: typeof dossier) => { data.sources[0].url = "javascript:alert(1)"; },
      (data: typeof dossier) => { data.financing.sourceId = "unknown"; },
    ]) {
      const data = structuredClone(dossier); change(data);
      expect(() => accountabilitySchema.parse(data)).toThrow();
    }
  });
  it("connects real internal identities and search without attributing a government commitment to a single party", () => {
    for (const item of accountability.commitments) {
      expect(governments.some((government) => government.id === item.governmentId)).toBe(true);
      expect(topics.some((topic) => topic.slug === item.topic)).toBe(true);
      expect(item.indicators.every((slug) => indicators.some((indicator) => indicator.slug === slug))).toBe(true);
      expect(item.owner).toContain("Vlada");
    }
    expect(searchCatalogue("financiranje").some((item) => item.href === "/accountability#financing")).toBe(true);
    expect(searchCatalogue("ispravci").some((item) => item.href === "/corrections")).toBe(true);
  });
  it("selects separate COFOG functions using annual, GDP-normalized expenditure without borrowing a NATO definition", () => {
    for (const [slug, functionCode] of [["education-spending", "GF09"], ["defence-spending", "GF02"]]) {
      const definition = seriesDefinitions.find((item) => item.slug === slug)!;
      expect(definition.frequency).toBe("ANNUAL");
      expect(definition.change).toBe("points");
      expect(definition.dimensions).toEqual({ unit: "PC_GDP", sector: "S13", na_item: "TE", cofog99: functionCode });
      const url = new URL(datasetUrl(definition));
      expect(url.searchParams.getAll("geo")).toEqual(["HR", "EU27_2020"]);
      expect(definition.limitations).toContain("nije NATO");
    }
  });
});

describe("public correction boundaries", () => {
  const correction = { pagePath: "/accountability#financing", claim: "An incorrect amount appears.", proposed: "Use the official amount instead.", evidenceUrl: "https://www.sabor.hr/record" };
  it("accepts internal paths and rejects external redirects, query tracking, scripts, credentials and unexpected personal fields", () => {
    expect(correctionSchema.parse(correction)).toEqual(correction);
    expect(correctionSchema.parse({ ...correction, pagePath: "/" }).pagePath).toBe("/");
    for (const pagePath of ["//evil.example", "https://evil.example", "/search?party=abc", "/foo\\bar", "/foo\nbar", "/foo%0d%0aLocation:evil"]) {
      expect(correctionSchema.safeParse({ ...correction, pagePath }).success).toBe(false);
    }
    for (const evidenceUrl of ["javascript:alert(1)", "http://example.org", "https://user:password@example.org"]) expect(correctionSchema.safeParse({ ...correction, evidenceUrl }).success).toBe(false);
    expect(correctionSchema.safeParse({ ...correction, email: "user@example.org" }).success).toBe(false);
  });
  it("requires an applied change, substantive public explanation and source before acceptance", () => {
    const review = { action: "ACCEPTED", note: "Verified against original source.", publicSummary: "Corrected the amount to match the original.", sourceUrl: "https://www.sabor.hr/record", applied: true };
    expect(correctionReviewSchema.parse(review)).toEqual(review);
    for (const changed of [{ applied: false }, { publicSummary: "" }, { sourceUrl: "" }]) expect(correctionReviewSchema.safeParse({ ...review, ...changed }).success).toBe(false);
    expect(correctionReviewSchema.safeParse({ ...review, action: "REJECTED", publicSummary: "", sourceUrl: "", applied: false }).success).toBe(true);
  });
});
