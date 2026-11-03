import { z } from "zod";

export const candidateSchema = z.object({ number: z.number().int().positive(), name: z.string().min(1).max(300), votes: z.number().int().nonnegative(), elected: z.boolean() }).strict();
export const electionChoiceSchema = z.object({ number: z.number().int().positive(), sourceKey: z.string().max(200), name: z.string().min(1).max(1000), votes: z.number().int().nonnegative(), share: z.number().min(0).max(100).nullable(), seats: z.number().int().min(0).max(151).nullable(),
  members: z.array(z.object({ name: z.string().min(1).max(500), partyId: z.string().regex(/^\d+$/).nullable(), role: z.enum(["list", "proposer"]) }).strict()).max(100), candidates: z.array(candidateSchema).max(200) }).strict();
export const contestSchema = z.object({ code: z.string().regex(/^(?:\d{2,3}|012-\d{2})$/), name: z.string().min(1).max(700), countyId: z.string().regex(/^HR\d{3}$/).nullable(),
  eligible: z.number().int().nonnegative(), voters: z.number().int().nonnegative(), ballots: z.number().int().nonnegative(), valid: z.number().int().nonnegative(), invalid: z.number().int().nonnegative(),
  shareBase: z.enum(["valid", "voters", "multiple"]), sourceUrl: z.url(), legalUrl: z.url().nullable(), sourceDate: z.iso.date(), notes: z.string().max(3000), choices: z.array(electionChoiceSchema).min(1).max(200) }).strict();
export type ElectionContestData = z.infer<typeof contestSchema>;
export const electionMetadataSchema = z.object({ archiveUrl: z.url(), referenceUrl: z.url(), publicationDate: z.iso.date().nullable(), scope: z.string().min(1), turnout: z.object({ eligible: z.number().int().positive(), voters: z.number().int().nonnegative(), sourceUrl: z.url() }).nullable() }).strict();
export type ElectionRecord = { id: string; title: string; kind: string; date: string; round: number; context: string; status: "FINAL" | "PRELIMINARY"; publishedAt: string; retrievedAt: string; revision: string; metadata: z.infer<typeof electionMetadataSchema>; contests: ElectionContestData[] };
export const turnoutPercent = (eligible: number, voters: number) => eligible > 0 && voters <= eligible ? voters / eligible * 100 : null;
