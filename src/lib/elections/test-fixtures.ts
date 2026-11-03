import { electionSources, type ElectionDefinition } from "./catalogue";
import { counties } from "../regions/catalogue";
import type { ElectionSnapshot } from "./adapters";

export function fixtureElectionSnapshot(def: ElectionDefinition, offset = 0): ElectionSnapshot {
  if (def.kind !== "presidential") throw new Error("This synthetic fixture models presidential ballots only.");
  return { electionId: def.id, retrievedAt: `2026-11-03T${10 + offset}:00:00.000Z`, files: electionSources(def).map((source) => {
    const multiplier = source.code === "00" ? 22 : 1;
    const voters = 80 * multiplier, valid = 76 * multiplier;
    const denominator = def.round === 1 ? voters : valid;
    return { url: source.resultUrl, text: JSON.stringify({ izbori: "Synthetic presidential test fixture 2024", datum: "16.01.2025.", izboriOznaka: "01", zupSifra: source.code, bmSifra: "000", bmNaziv: "",
      zupNaziv: source.countyId ? counties.find((county) => county.id === source.countyId)!.name : "", gropNaziv: source.countyId ? counties.find((county) => county.id === source.countyId)!.name : source.code === "00" ? "UKUPNO RH" : "inozemstvo",
      bmZatvoreno: multiplier, bmUkupno: multiplier, biraciUkupno: 100 * multiplier, biraciGlasovalo: voters, listiciUkupno: 79 * multiplier, listiciVazeci: valid, listiciNevazeci: 3 * multiplier,
      lista: [50 + offset, 26 - offset].map((votes, index) => ({ rbr: index + 1, naziv: `SINTETIČKI KANDIDAT ${index === 0 ? "A" : "B"}`, jedinstvenaSifra: String(index + 1), glasova: votes * multiplier, posto: (votes * multiplier / denominator * 100).toFixed(2).replace(".", ","), predlagatelji: [] })) }) };
  }) };
}
