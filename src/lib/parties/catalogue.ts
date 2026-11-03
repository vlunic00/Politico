import { z } from "zod";
import { parliamentaryParties, parliamentarySnapshot, type ParliamentaryParty } from "../politics";
import type { PublicSummary } from "./summary-contract";

export const registerDatasetId = "mpudt:political-parties";
export const registerUrl = "https://data.gov.hr/ckan/dataset/197ea086-e03b-42d1-b3c1-0496c85faf1e/resource/1a766609-e55d-4c13-ad0c-7bd409496d34/download/data.json";
export const registerCatalogueUrl = "https://data.gov.hr/ckan/hr/dataset/registar-politickih-stranaka-republike-hrvatske";
export const registerMetadataUrl = "https://data.gov.hr/ckan/api/3/action/resource_show?id=1a766609-e55d-4c13-ad0c-7bd409496d34";

// Explicit identity crosswalk verified against the ministry's SBT_ID; names and abbreviations are not unique identifiers.
export const parliamentaryRegistryIds: Record<string, string> = {
  hdz: "610008", sdp: "610087", mozemo: "1002961", "domovinski-pokret": "1004680", most: "601926",
  domino: "1010188", sdss: "610099", centar: "602980", drito: "1010615", hsls: "610003", ids: "610014",
  nps: "1006182", doisip: "1002760", glas: "1000800", "dario-zurovec": "1010322", hds: "610006",
  hns: "610045", hss: "610009", hsu: "610100", "hrvatski-suverenisti": "1004260", nezavisni: "1000690",
};
export const partyWebsites: Record<string, string> = {
  "610008": "https://www.hdz.hr/", "610087": "https://www.sdp.hr/", "1002961": "https://mozemo.hr/",
  "1004680": "https://dp.hr/", "601926": "https://most-hrvatska.hr/",
};

export const policyTopics = {
  "income-tax": "Porez na dohodak", "corporate-tax": "Porez na dobit", housing: "Stanovanje", healthcare: "Zdravstvo",
  education: "Obrazovanje", pensions: "Mirovine", migration: "Migracije", energy: "Energija", eu: "Europska unija", defence: "Obrana", environment: "Okoliš",
} as const;
export const programEvidenceSchema = z.object({
  topic: z.enum(Object.keys(policyTopics) as [keyof typeof policyTopics, ...(keyof typeof policyTopics)[]]),
  quote: z.string().trim().min(1).max(800),
  page: z.number().int().min(1).max(2000),
}).strict();
export type ProgramEvidence = z.infer<typeof programEvidenceSchema>;
export type PublicProgram = {
  id: string; context: string; version: number; title: string; documentUrl: string; language: string;
  publicationDate: string | null; retrievedAt: string; contentHash: string; publishedAt: string;
  evidence: ProgramEvidence[];
  summaries?: PublicSummary[];
};
export type DirectoryParty = Omit<ParliamentaryParty, "seats"> & {
  id: string; seats?: number; website?: string;
  registration?: { name: string; abbreviation: string | null; status: "AKTIVAN" | "PRESTANAK"; registerNumber: string; book: number; registeredAt: string; statusDate: string | null; seat: string | null };
  programs: PublicProgram[];
};
export const registrationLabel = (status?: string) => status === "AKTIVAN" ? "Aktivna u registru" : status === "PRESTANAK" ? "Prestanak prema registru" : "Registracija nije verificirana";
export const fallbackParties: DirectoryParty[] = parliamentaryParties.map((party) => ({ ...party, id: parliamentaryRegistryIds[party.slug], website: partyWebsites[parliamentaryRegistryIds[party.slug]], programs: [] }));
export function partySlug(id: string) {
  return Object.keys(parliamentaryRegistryIds).find((slug) => parliamentaryRegistryIds[slug] === id) ?? `registar-${id}`;
}

export const electionContextSchema = z.enum(["next-parliamentary", "parliamentary-2024", "next-presidential", "next-european", "next-local"]);
export const electionContexts = {
  "next-parliamentary": "Sljedeći parlamentarni izbori", "parliamentary-2024": "Parlamentarni izbori 2024.",
  "next-presidential": "Sljedeći predsjednički izbori", "next-european": "Sljedeći europski izbori", "next-local": "Sljedeći lokalni izbori",
} as const;
const electionSource = "https://narodne-novine.nn.hr/clanci/sluzbeni/2024_04_50_857.html";
export const partyElectionRecords = [
  { ids: ["610008", "610003", "610006", "610045", "610100"], description: "Zajednička lista HDZ/HSLS/HDS/HNS/HSU u V. izbornoj jedinici 2024." },
  { ids: ["610087", "602980", "610009", "1002760", "602644", "1000800"], description: "Zajednička lista SDP/Centar/HSS/DO i SIP/Reformisti/GLAS u V. izbornoj jedinici 2024." },
  { ids: ["1004680", "1009722"], description: "Zajednička lista DP/Pravo i pravda u V. izbornoj jedinici 2024." },
  { ids: ["601926", "1004260", "602722", "603143"], description: "Zajednička lista Most/Suverenisti/HKS/NLM u V. izbornoj jedinici 2024." },
  { ids: ["1002961", "1008122"], description: "Zajednička lista Možemo!/Hoćemo pravedno u V. izbornoj jedinici 2024." },
].flatMap((record) => record.ids.map((partyId) => ({ partyId, context: "parliamentary-2024", description: record.description, sourceUrl: electionSource })));

export const directorySelectionSchema = z.object({
  q: z.string().max(200).default(""),
  registration: z.enum(["active", "ceased", "all"]).default("active"),
  parliament: z.enum(["all", "represented", "not-in-snapshot"]).default("all"),
  government: z.enum(["all", "confirmed", "unverified"]).default("all"),
  election: electionContextSchema.default("next-parliamentary"),
  participation: z.enum(["all", "confirmed", "unverified"]).default("all"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const parliamentaryNote = `Presjek Hrvatskoga sabora: ${parliamentarySnapshot.dateLabel}. Izostanak iz tog presjeka nije dokaz današnjeg statusa.`;
