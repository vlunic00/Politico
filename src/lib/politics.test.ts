import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  currentGovernment,
  formatSeatShare,
  parliamentaryParties,
  parliamentarySnapshot,
  portraits,
} from "./politics";

describe("dated political overview", () => {
  it("accounts for every mandate without treating independent MPs as a party", () => {
    expect(parliamentaryParties).toHaveLength(21);
    expect(new Set(parliamentaryParties.map((party) => party.slug)).size).toBe(
      21,
    );
    expect(
      parliamentaryParties.reduce(
        (total, party) => total + party.seats,
        parliamentarySnapshot.independentSeats,
      ),
    ).toBe(parliamentarySnapshot.total);
    expect(formatSeatShare(55)).toMatch(/36,67\s*%/);
    expect(formatSeatShare(0)).toMatch(/0,00\s*%/);
    expect(currentGovernment.termStart).toBe("2024-05-17");
  });
  it("requires provenance for published leadership, classifications and portraits", () => {
    for (const party of parliamentaryParties) {
      if (party.leaders) expect(party.leadershipSource).toMatch(/^https:\/\//);
      if (party.orientation)
        expect(party.orientation.sourceUrl).toMatch(/^https:\/\//);
      for (const leader of party.leaders ?? [])
        expect(portraits[leader.portrait].name).toBe(leader.name);
    }
    for (const portrait of Object.values(portraits)) {
      expect(existsSync(`public${portrait.src}`), portrait.src).toBe(true);
      expect(portrait.credit).toBeTruthy();
      expect(portrait.sourceUrl).toMatch(/^https:\/\//);
      expect(portrait.licenseUrl).toMatch(/^https:\/\//);
    }
  });
});
