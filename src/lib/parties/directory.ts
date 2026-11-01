import { normalizeSearch } from "../search";
import { directorySelectionSchema, partyElectionRecords, type DirectoryParty } from "./catalogue";

export const isGovernmentParty = (id: string) => id === "610008" || id === "1004680";
export function filterPartyDirectory(parties: DirectoryParty[], selection: ReturnType<typeof directorySelectionSchema.parse>) {
  const query = normalizeSearch(selection.q);
  return parties.filter((party) => {
    const participation = partyElectionRecords.some((record) => record.partyId === party.id && record.context === selection.election);
    return (!query || normalizeSearch(`${party.name} ${party.abbreviation} ${party.registration?.name ?? ""} ${party.leaders?.map((leader) => leader.name).join(" ") ?? ""}`).includes(query))
      && (selection.registration === "all" || party.registration?.status === (selection.registration === "active" ? "AKTIVAN" : "PRESTANAK"))
      && (selection.parliament === "all" || (selection.parliament === "represented" ? typeof party.seats === "number" : typeof party.seats !== "number"))
      && (selection.government === "all" || isGovernmentParty(party.id) === (selection.government === "confirmed"))
      && (selection.participation === "all" || participation === (selection.participation === "confirmed"));
  }).sort((a, b) => a.name.localeCompare(b.name, "hr") || a.id.localeCompare(b.id));
}
