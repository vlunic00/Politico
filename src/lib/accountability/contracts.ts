import { z } from "zod";
import { commitmentStates } from "./catalogue";

const text = z.string().trim().min(1).max(4000);
const date = z.iso.date();
const sourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), title: text,
  url: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && ["www.sabor.hr", "sabor.hr", "vlada.gov.hr", "www.vlada.gov.hr", "narodne-novine.nn.hr", "mrosp.gov.hr"].includes(url.hostname);
  }, "Use an official source."),
  publicationDate: date.nullable(), note: text,
}).strict();
const evidenceSchema = z.object({ sourceId: text, locator: text, date: date.nullable(), description: text }).strict();
const cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const accountabilitySchema = z.object({
  version: z.number().int().positive(), verifiedAt: date,
  sources: z.array(sourceSchema).min(1),
  financing: z.object({
    sourceId: text, periodStart: date, periodEnd: date, currency: z.literal("EUR"),
    scope: z.literal("national-budget-regular-funding"),
    allocatedCents: cents, paidCents: cents,
    reconciliation: z.object({ allocatedCents: z.number().int(), paidCents: z.number().int(), note: text }).strict(),
    rows: z.array(z.object({ name: text, kind: z.enum(["party", "independent"]), allocatedCents: cents, paidCents: cents, page: z.number().int().min(1).max(2) }).strict()).min(1),
  }).strict(),
  parliament: z.object({
    sourceId: text, term: z.number().int().positive(), periodStart: date, periodEnd: date,
    metrics: z.array(z.object({ label: text, value: z.number().int().nonnegative(), locator: text }).strict()).min(1),
    records: z.array(z.object({ title: text, date, evidence: evidenceSchema }).strict()),
    limitations: text,
  }).strict(),
  commitments: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/), title: text, owner: text, governmentId: text,
    program: z.object({ sourceId: text, version: text, publicationDate: date.nullable(), page: z.number().int().positive() }).strict(),
    quote: text, topic: text, deadline: date.nullable(), deadlineNote: text,
    targets: z.array(z.object({ label: text, value: z.number().finite(), unit: text }).strict()),
    state: z.enum(Object.keys(commitmentStates) as [keyof typeof commitmentStates, ...Array<keyof typeof commitmentStates>]),
    evidence: z.array(evidenceSchema), indicators: z.array(text), limitations: text,
  }).strict()).min(1),
}).strict().superRefine((data, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  const ids = new Set(data.sources.map((source) => source.id));
  if (ids.size !== data.sources.length) issue("Duplicate source identity.");
  const references = [data.financing.sourceId, data.parliament.sourceId, ...data.parliament.records.map((record) => record.evidence.sourceId), ...data.commitments.flatMap((item) => [item.program.sourceId, ...item.evidence.map((entry) => entry.sourceId)])];
  if (references.some((id) => !ids.has(id))) issue("Missing source reference.");
  for (const period of [data.financing, data.parliament]) if (period.periodStart > period.periodEnd || period.periodEnd > data.verifiedAt) issue("Invalid reference period.");
  for (const field of ["allocatedCents", "paidCents"] as const) if (data.financing.rows.reduce((sum, row) => sum + row[field], 0) + data.financing.reconciliation[field] !== data.financing[field]) issue(`Finance ${field} does not reconcile with its documented source discrepancy.`);
  if (new Set(data.financing.rows.map((row) => row.name)).size !== data.financing.rows.length) issue("Duplicate financial recipient.");
  if (new Set(data.commitments.map((item) => item.id)).size !== data.commitments.length) issue("Duplicate commitment.");
  if (data.sources.some((source) => source.publicationDate && source.publicationDate > data.verifiedAt)) issue("Source postdates verification.");
  for (const item of data.commitments) {
    if (["action", "implementation"].includes(item.state) && !item.evidence.length) issue("State requires evidence.");
    if (item.state === "overdue" && (!item.deadline || item.deadline >= data.verifiedAt)) issue("Deadline has not passed.");
    if (item.evidence.some((entry) => entry.date && entry.date > data.verifiedAt)) issue("Evidence postdates verification.");
  }
});

export type Accountability = z.infer<typeof accountabilitySchema>;
