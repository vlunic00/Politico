import { z } from "zod";

// Missing observations are omitted rather than coerced to zero.
export const observationInputSchema = z
  .object({
    indicatorId: z.string().min(1),
    geographyId: z.string().min(1),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
    value: z.number(),
    unit: z.string().min(1),
    sourceId: z.string().min(1),
    sourceDatasetId: z.string().min(1),
    publicationDate: z.iso.date().nullable(),
    retrievedAt: z.iso.datetime({ offset: true }),
    observationStatus: z.enum(["FINAL", "PROVISIONAL", "REVISED"]),
    sourceFlags: z.string().optional(),
    revisionId: z.string().min(1),
    methodologyVersion: z.string().min(1),
  })
  .strict()
  .refine((observation) => observation.periodEnd >= observation.periodStart, {
    message: "Period end must not precede period start.",
    path: ["periodEnd"],
  })
  .refine(({ periodStart, periodEnd, frequency }) => {
    const start = new Date(periodStart);
    const months = { MONTHLY: 1, QUARTERLY: 3, ANNUAL: 12 }[frequency];
    const month = start.getUTCMonth();
    const end = new Date(Date.UTC(start.getUTCFullYear(), month + months, 0));
    return start.getUTCDate() === 1 && month % months === 0 && end.toISOString().slice(0, 10) === periodEnd;
  }, { message: "Reference period must align with its frequency.", path: ["periodStart"] });

export type ObservationInput = z.infer<typeof observationInputSchema>;
