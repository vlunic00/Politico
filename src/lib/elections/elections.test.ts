import { describe, expect, it } from "vitest";
import { electedNames, parseElectionSnapshot } from "./adapters";
import { electionSelection, elections } from "./catalogue";
import { fixtureElectionSnapshot } from "./test-fixtures";
import { turnoutPercent } from "./contracts";
import { counties, countyPaths, parseRegionalSelection } from "../regions/catalogue";
import { parseEurostat } from "../statistics/adapters";
import { datasetUrl, seriesDefinitions } from "../statistics/definitions";
import { reviewReasons } from "../statistics/ingestion";

describe("official election boundaries and denominators", () => {
  const def = elections.find((election) => election.id === "predsjednicki-2024-1")!;
  it("keeps county and national counts and first/second-round denominators separate", () => {
    const parsed = parseElectionSnapshot(def, fixtureElectionSnapshot(def));
    expect(parsed.contests).toHaveLength(23);
    expect(parsed.contests[0].choices[0].share).toBe(62.5);
    expect(parsed.contests[0].shareBase).toBe("voters");
    expect(parsed.contests[1].countyId).toBe("HR065");
    const second = { ...def, round: 2, date: "2025-01-12", winner: "SINTETIČKI KANDIDAT A" };
    const round = parseElectionSnapshot(second, fixtureElectionSnapshot(second));
    expect(round.contests[0].choices[0].share).toBeCloseTo(50 / 76 * 100);
    expect(round.contests[0].choices[0].candidates[0].elected).toBe(true);
    expect(turnoutPercent(100, 80)).toBe(80); expect(turnoutPercent(0, 0)).toBeNull(); expect(turnoutPercent(10, 11)).toBeNull();
  });
  it("rejects incomplete snapshots, unfinished counts, wrong geography, false percentages, and inconsistent totals", () => {
    const missing = fixtureElectionSnapshot(def); missing.files.pop(); expect(() => parseElectionSnapshot(def, missing)).toThrow(/Incomplete/);
    for (const change of [
      { bmZatvoreno: 0 }, { zupSifra: "99" }, { listiciNevazeci: 0 }, { biraciGlasovalo: 99999 }, { gropNaziv: "Wrong municipality" },
      { lista: [{ rbr: 1, naziv: "Fake", glasova: 99999, jedinstvenaSifra: "1", posto: "NaN" }] },
    ]) {
      const snapshot = fixtureElectionSnapshot(def); snapshot.files[0].text = JSON.stringify({ ...JSON.parse(snapshot.files[0].text), ...change });
      expect(() => parseElectionSnapshot(def, snapshot)).toThrow();
    }
    const mismatch = fixtureElectionSnapshot(def); const row = JSON.parse(mismatch.files[1].text); row.biraciUkupno++; mismatch.files[1].text = JSON.stringify(row);
    expect(() => parseElectionSnapshot(def, mismatch)).toThrow(/reconcile/);
    const shares = fixtureElectionSnapshot(def); const wrong = JSON.parse(shares.files[0].text); wrong.lista[0].posto = "65,79"; shares.files[0].text = JSON.stringify(wrong);
    expect(() => parseElectionSnapshot(def, shares)).toThrow(/denominator/);
  });
  it("extracts only officially elected people and excludes deputies and ballot-table mentions", () => {
    const head = "<title>Konačni rezultati izbora</title><table><tr><td>NEIZABRANI KANDIDAT</td></tr></table>";
    const html = `${head}<p>IV. Na osnovi zakona</p><table><tr><td>1.</td><td>IZABRANI KANDIDAT (kandidat na listi pod rednim brojem 2.)</td></tr></table>`;
    expect(electedNames(html, false)).toEqual(["IZABRANI KANDIDAT"]);
    const minority = `${head}<table><tr><td>III.</td><td>Na osnovi zakona</td></tr><tr><td>za zastupnika R&#211;BERT JANKOVICS za zamjenika zastupnika OLIVER MATIJEVIĆ</td></tr></table>`;
    expect(electedNames(minority, true, ["RÓBERT JANKOVICS", "OLIVER MATIJEVIĆ"])).toEqual(["RÓBERT JANKOVICS"]);
    const unnumbered = `${head}<p>Na osnovi članka 46. izabrana je kandidatkinja:</p><table><tr><td>IZABRANA KANDIDATKINJA</td></tr></table>`;
    expect(electedNames(unnumbered, true, ["IZABRANA KANDIDATKINJA"])).toEqual(["IZABRANA KANDIDATKINJA"]);
    expect(() => electedNames(head, false)).toThrow();
  });
  it("accepts empty year filters and rejects duplicated or unknown inputs", () => {
    expect(electionSelection.parse({ year: "" }).year).toBeUndefined();
    expect(electionSelection.safeParse({ kind: ["european", "presidential"] }).success).toBe(false);
    expect(parseRegionalSelection({ county: ["HR050", "HR050"] }).success).toBe(false);
    expect(parseRegionalSelection({ county: "HR999" }).success).toBe(false);
    expect(parseRegionalSelection({ county: ["HR050", "HR065"], year: "2024" }).success).toBe(true);
  });
});

describe("county scope and statistical imports", () => {
  it("has 20 counties and Zagreb with unique routes and valid local SVG geometry", () => {
    expect(counties).toHaveLength(21); expect(new Set(counties.map((county) => county.slug)).size).toBe(21);
    expect(counties.find((county) => county.id === "HR050")?.slug).toBe("grad-zagreb");
    for (const path of countyPaths()) { expect(path.d).toMatch(/^M/); expect(path.d).not.toContain("NaN"); expect(path.d).not.toContain("undefined"); }
  });
  it("allows only configured county geographies and requires history for every county", () => {
    const def = { ...seriesDefinitions.find((def) => def.slug === "regional-gdp")!, geographies: ["HR", "HR050"] };
    const payload = { version: "2.0", class: "dataset", source: "ESTAT", id: ["freq", "unit", "geo", "time"], size: [1, 1, 2, 1], dimension: {
      freq: { category: { index: { A: 0 } } }, unit: { category: { index: { EUR_HAB: 0 } } }, geo: { category: { index: { HR: 0, HR050: 1 } } }, time: { category: { index: { "2024": 0 } } },
    }, value: { "0": 20000, "1": 30000 } };
    const snapshot = { indicator: def.slug, request: { url: datasetUrl(def) }, retrievedAt: "2026-11-03T12:00:00Z", payload };
    const result = parseEurostat(def, snapshot);
    expect(result.observations.map((point) => point.geographyId)).toEqual(["HR", "HR050"]);
    expect(reviewReasons(def, result.observations, [])).toContain("HR050 history requires 5 observations; received 1.");
    payload.dimension.geo.category.index = { HR: 0, HR999: 1 } as unknown as { HR: number; HR050: number };
    expect(() => parseEurostat(def, snapshot)).toThrow(/geography/);
  });
});
