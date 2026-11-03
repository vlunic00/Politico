import { z } from "zod";
import { policyTopics } from "./catalogue";

export const summaryTopics = { ...policyTopics, economy: "Gospodarstvo", "public-spending": "Javna potrošnja", employment: "Rad i plaće", demography: "Demografija", international: "Međunarodni odnosi", justice: "Pravosuđe i institucije" } as const;
export const summaryTopicKeys = Object.keys(summaryTopics) as [keyof typeof summaryTopics, ...(keyof typeof summaryTopics)[]];
export const summarySchema = z.object({
  language: z.enum(["hr-HR"]),
  sections: z.array(z.object({
    topic: z.enum(summaryTopicKeys),
    coverage: z.enum(["addressed", "not-addressed", "uncertain"]),
    proposals: z.array(z.object({
      text: z.string().trim().min(10).max(1400),
      kind: z.enum(["commitment", "aspiration"]),
      evidence: z.array(z.object({ page: z.number().int().min(1).max(2000), quote: z.string().trim().min(10).max(1000) }).strict()).min(1).max(4),
    }).strict()).max(5),
  }).strict()).length(summaryTopicKeys.length),
}).strict();
export type SummaryContent = z.infer<typeof summarySchema>;
export type PublicSummary = { id: string; sequence: number; generatedAt: string; publishedAt: string; modelIdentifier: string; promptVersion: string; content: SummaryContent };
export const extractionPagesSchema = z.array(z.object({ page: z.number().int().positive(), text: z.string().max(100000) }).strict()).min(1).max(2000);
export type ExtractedPage = z.infer<typeof extractionPagesSchema>[number];
const normalize = (text: string) => text.normalize("NFC").replace(/\s+/g, " ").trim();

export function validateSummary(input: unknown, pages: ExtractedPage[], complete: boolean) {
  const summary = summarySchema.parse(input);
  if (new Set(summary.sections.map((section) => section.topic)).size !== summaryTopicKeys.length) throw new Error("Svaka tema mora biti navedena točno jednom.");
  for (const section of summary.sections) {
    if ((section.coverage === "addressed") !== (section.proposals.length > 0)) throw new Error("Obrađena tema mora sadržavati navode; ostale teme ne smiju sadržavati prijedloge.");
    if (section.coverage === "not-addressed" && !complete) throw new Error("Nepotpuna ekstrakcija ne može dokazati da tema nije navedena.");
    for (const proposal of section.proposals) {
      for (const evidence of proposal.evidence) {
        const page = pages.find((page) => page.page === evidence.page);
        if (!page || !normalize(page.text).includes(normalize(evidence.quote))) throw new Error(`Citat nije pronađen na PDF stranici ${evidence.page}.`);
      }
      const evidenceText = proposal.evidence.map((item) => normalize(item.quote)).join(" ");
      const citedNumbers = new Set(evidenceText.match(/\d+(?:[.,]\d+)*/g) ?? []);
      for (const number of proposal.text.match(/\d+(?:[.,]\d+)*/g) ?? []) if (!citedNumbers.has(number)) throw new Error("Broj u sažetku nema potporu u priloženim citatima.");
    }
  }
  return summary;
}

export const coverageLabel = (coverage: SummaryContent["sections"][number]["coverage"]) => coverage === "not-addressed" ? "Nije navedeno u analiziranom programu" : "Nije pouzdano utvrđeno iz dostupne ekstrakcije";
export const proposalKindLabel = (kind: "commitment" | "aspiration") => kind === "commitment" ? "Konkretan prijedlog" : "Opći cilj";
