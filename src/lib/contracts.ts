import { z } from "zod";

// Phase 2 adapter boundary; missing observations are omitted rather than coerced to zero.
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
    revisionId: z.string().min(1),
    methodologyVersion: z.string().min(1),
  })
  .strict()
  .refine((observation) => observation.periodEnd >= observation.periodStart, {
    message: "Period end must not precede period start.",
    path: ["periodEnd"],
  });

export type ObservationInput = z.infer<typeof observationInputSchema>;
