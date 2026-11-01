import { z } from "zod";
import { electionContextSchema, type DirectoryParty } from "./catalogue";

export function partyComparisonSelection(query: Record<string, string | string[] | undefined>, parties: DirectoryParty[]) {
  const id = z.string().refine((slug) => parties.some((party) => party.slug === slug));
  return z.object({
    party: z.preprocess((value) => value === undefined ? [] : (Array.isArray(value) ? value : [value]).filter((value) => value !== ""), z.array(id).max(4)),
    context: electionContextSchema.default("next-parliamentary"),
  }).superRefine((selection, context) => {
    if (new Set(selection.party).size !== selection.party.length) context.addIssue({ code: "custom", message: "Select each party only once." });
  }).safeParse(query);
}
