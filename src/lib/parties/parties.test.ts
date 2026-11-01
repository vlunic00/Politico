import { describe, expect, it } from "vitest";
import { parsePartyRegister } from "./registry";
import { directorySelectionSchema, fallbackParties, parliamentaryRegistryIds, partyElectionRecords, partySlug } from "./catalogue";
import { filterPartyDirectory } from "./directory";
import { partyComparisonSelection } from "./comparison";
import { programMetadataSchema, validateProgramDocument } from "./programs";
import { searchCatalogue } from "../search";

const row = { SBT_ID: 1234, NAZIV: "Testna stranka", SKRACENI_NAZIV: null, STATUS: "AKTIVAN", REGISTARSKI_BROJ: "1", BROJ_KNJIGE: 2, DATUM_UPISA: "2020-02-29T00:00:00", DATUM_STATUSA: null, SJEDISTE: null, OIB: "not imported" };
const metadata = { partyId: "1234", context: "parliamentary-2024", title: "Test source", documentUrl: "https://example.org/program.pdf", language: "hr", publicationDate: null, evidence: [{ topic: "housing", quote: "Test excerpt", page: 3 }] };

describe("canonical party register", () => {
  it("retains authority identity, exact status, leap dates and unknown fields without importing OIBs", () => {
    expect(parsePartyRegister([row])[0]).toEqual({ id: "1234", slug: "registar-1234", name: "Testna stranka", abbreviation: null, status: "AKTIVAN", registerNumber: "1", book: 2, registeredAt: "2020-02-29", statusDate: null, seat: null });
    expect(parsePartyRegister([{ ...row, STATUS: "PRESTANAK" }])[0].statusDate).toBeNull();
    expect(partySlug("610087")).toBe("sdp");
    expect(new Set(Object.values(parliamentaryRegistryIds)).size).toBe(21);
  });
  it.each([[], [{ ...row, STATUS: "UNKNOWN" }], [row, row], [{ ...row, DATUM_UPISA: "2020-02-30T00:00:00" }], [{ ...row, DATUM_STATUSA: "2010-01-01T00:00:00" }], [{ ...row, SBT_ID: "1234" }]].map((payload) => ({ payload })))("rejects malformed, ambiguous or empty source data", ({ payload }) => {
    expect(() => parsePartyRegister(payload)).toThrow();
  });
  it("never guesses identity from an abbreviation and permits number reuse in another book", () => {
    expect(parsePartyRegister([row, { ...row, SBT_ID: 1235, BROJ_KNJIGE: 1 }])).toHaveLength(2);
    expect(() => parsePartyRegister([row, { ...row, SBT_ID: 1235 }])).toThrow(/Duplicate registry/);
    expect(partySlug("999999")).toBe("registar-999999");
  });
});

describe("independent directory statuses", () => {
  it("does not turn missing registration or future candidacy into a confirmed fact", () => {
    expect(filterPartyDirectory(fallbackParties, directorySelectionSchema.parse({}))).toEqual([]);
    const confirmed = filterPartyDirectory(fallbackParties, directorySelectionSchema.parse({ registration: "all", participation: "confirmed" }));
    expect(confirmed).toEqual([]);
    expect(partyElectionRecords.every((record) => record.context === "parliamentary-2024")).toBe(true);
    expect(filterPartyDirectory(fallbackParties, directorySelectionSchema.parse({ registration: "all", government: "confirmed" })).map((party) => party.slug).sort()).toEqual(["domovinski-pokret", "hdz"]);
  });
  it("searches names and leaders without diacritics and keeps nonparliamentary parties discoverable", () => {
    const extra = { id: "1234", slug: "registar-1234", name: "Građanska testna stranka", abbreviation: "GTS", programs: [] };
    const parties = [...fallbackParties, extra];
    expect(filterPartyDirectory(parties, directorySelectionSchema.parse({ q: "gradanska", registration: "all", parliament: "not-in-snapshot" }))).toEqual([extra]);
    expect(searchCatalogue("GTS", parties)[0].href).toBe("/parties/registar-1234");
    expect(searchCatalogue("Novi naziv", [{ ...extra, registration: { name: "Novi naziv iz registra" } }])[0].href).toBe("/parties/registar-1234");
    expect(filterPartyDirectory(parties, directorySelectionSchema.parse({ q: "hajdas", registration: "all" }))[0].slug).toBe("sdp");
  });
  it("rejects invalid filters and more than four, duplicate or unknown comparison selections", () => {
    expect(directorySelectionSchema.safeParse({ registration: "deleted", page: "NaN" }).success).toBe(false);
    expect(partyComparisonSelection({ party: ["hdz", "sdp", "mozemo", "most"] }, fallbackParties).success).toBe(true);
    expect(partyComparisonSelection({ party: ["", "sdp", ""] }, fallbackParties).data?.party).toEqual(["sdp"]);
    for (const party of [["sdp", "sdp"], ["unknown"], ["hdz", "sdp", "mozemo", "most", "hsu"]]) expect(partyComparisonSelection({ party }, fallbackParties).success).toBe(false);
    expect(partyComparisonSelection({ context: ["next-parliamentary", "parliamentary-2024"] }, fallbackParties).success).toBe(false);
  });
});

describe("program upload validation", () => {
  it("requires a PDF, a safe original URL and bounded cited evidence with no duplicate topics", () => {
    expect(programMetadataSchema.parse(metadata)).toEqual(metadata);
    expect(() => validateProgramDocument(Buffer.from("%PDF-1.7\nsynthetic test only\n%%EOF"))).not.toThrow();
    expect(() => validateProgramDocument(Buffer.from("<html>not a PDF</html>"))).toThrow();
    for (const documentUrl of ["javascript:alert(1)", "http://example.org/source", "https://user:secret@example.org/source"]) expect(programMetadataSchema.safeParse({ ...metadata, documentUrl }).success).toBe(false);
    expect(programMetadataSchema.safeParse({ ...metadata, evidence: [metadata.evidence[0], metadata.evidence[0]] }).success).toBe(false);
    expect(programMetadataSchema.safeParse({ ...metadata, evidence: [{ ...metadata.evidence[0], page: 0 }] }).success).toBe(false);
    expect(programMetadataSchema.safeParse({ ...metadata, storedDocumentPath: "../../secret" }).success).toBe(false);
  });
});
