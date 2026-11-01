import { z } from "zod";
import { registerUrl, partySlug } from "./catalogue";

const registryDate = z.string().regex(/^\d{4}-\d{2}-\d{2}T00:00:00$/).transform((value) => value.slice(0, 10)).pipe(z.iso.date());
const rowSchema = z.object({
  SBT_ID: z.number().int().positive(), NAZIV: z.string().trim().min(1).max(500),
  SKRACENI_NAZIV: z.string().trim().max(500).nullable(), STATUS: z.enum(["AKTIVAN", "PRESTANAK"]),
  REGISTARSKI_BROJ: z.string().regex(/^\d+$/), BROJ_KNJIGE: z.number().int().positive(),
  DATUM_UPISA: registryDate, DATUM_STATUSA: registryDate.nullable(), SJEDISTE: z.string().trim().min(1).max(1000).nullable(),
});

export function parsePartyRegister(payload: unknown) {
  const rows = z.array(rowSchema).min(1).max(10000).parse(payload);
  if (new Set(rows.map((row) => row.SBT_ID)).size !== rows.length) throw new Error("Duplicate party identifiers in registry.");
  if (new Set(rows.map((row) => `${row.BROJ_KNJIGE}:${row.REGISTARSKI_BROJ}`)).size !== rows.length) throw new Error("Duplicate registry book/number.");
  return rows.map((row) => {
    if (row.DATUM_STATUSA && row.DATUM_STATUSA < row.DATUM_UPISA) throw new Error(`Status precedes registration for ${row.SBT_ID}.`);
    return { id: String(row.SBT_ID), slug: partySlug(String(row.SBT_ID)), name: row.NAZIV, abbreviation: row.SKRACENI_NAZIV,
      status: row.STATUS, registerNumber: row.REGISTARSKI_BROJ, book: row.BROJ_KNJIGE,
      registeredAt: row.DATUM_UPISA, statusDate: row.DATUM_STATUSA, seat: row.SJEDISTE };
  });
}

export async function fetchRegisterText(url = registerUrl) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: "error" });
  if (!response.ok) throw new Error(`Register source returned HTTP ${response.status}.`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 10_000_000) throw new Error("Register response exceeds 10 MB.");
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
