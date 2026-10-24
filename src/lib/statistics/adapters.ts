import { z } from "zod";
import { observationInputSchema, type ObservationInput } from "../contracts";
import { datasetUrl, type Frequency, type SeriesDefinition } from "./definitions";

export type Snapshot = {
  indicator: string;
  request: { url: string; body?: unknown };
  retrievedAt: string;
  payload: unknown;
  metadata?: unknown;
};
export type ParsedSeries = {
  observations: ObservationInput[];
  sourceUpdatedAt: Date | null;
};

const category = z.object({
  category: z.object({
    index: z.union([z.array(z.string()), z.record(z.string(), z.number().int().nonnegative())]),
    label: z.record(z.string(), z.string()).optional(),
  }),
});
const cubeSchema = z.object({
  version: z.literal("2.0"), class: z.literal("dataset"), source: z.literal("ESTAT"),
  id: z.array(z.string()).min(2), size: z.array(z.number().int().positive()),
  dimension: z.record(z.string(), category),
  value: z.union([z.array(z.number().nullable()), z.record(z.string(), z.number())]),
  status: z.union([z.array(z.string().nullable()), z.record(z.string(), z.string())]).optional(),
  updated: z.string().optional(),
});

function codes(index: string[] | Record<string, number>, size: number) {
  const result = Array.isArray(index) ? index : Object.entries(index).sort((a, b) => a[1] - b[1]).map(([code]) => code);
  if (result.length !== size || new Set(result).size !== size || (!Array.isArray(index) && result.some((code, i) => index[code] !== i)))
    throw new Error("Invalid dimension index.");
  return result;
}

export function referencePeriod(value: string, frequency: Frequency) {
  const pattern = { ANNUAL: /^(\d{4})$/, QUARTERLY: /^(\d{4})-Q([1-4])$/, MONTHLY: /^(\d{4})-(0[1-9]|1[0-2])$/ }[frequency];
  const match = pattern.exec(value);
  if (!match) throw new Error(`Invalid ${frequency} period: ${value}`);
  const year = Number(match[1]);
  const month = frequency === "ANNUAL" ? 0 : frequency === "QUARTERLY" ? (Number(match[2]) - 1) * 3 : Number(match[2]) - 1;
  const months = { ANNUAL: 12, QUARTERLY: 3, MONTHLY: 1 }[frequency];
  return {
    periodStart: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    periodEnd: new Date(Date.UTC(year, month + months, 0)).toISOString().slice(0, 10),
  };
}

function updatedDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid source update timestamp.");
  return date;
}

function observation(def: SeriesDefinition, snapshot: Snapshot, period: string, geographyId: string, value: number, flags = "") {
  return observationInputSchema.parse({
    indicatorId: def.slug, geographyId, ...referencePeriod(period, def.frequency),
    frequency: def.frequency, value, unit: def.unit, sourceId: def.source,
    sourceDatasetId: `${def.source}:${def.slug}`, publicationDate: null,
    retrievedAt: snapshot.retrievedAt, sourceFlags: flags,
    observationStatus: /[pe]/i.test(flags) ? "PROVISIONAL" : /r/i.test(flags) ? "REVISED" : "FINAL",
    revisionId: "pending", methodologyVersion: `${def.dataset}:${JSON.stringify(def.dimensions)}`,
  });
}

export function parseEurostat(def: SeriesDefinition, snapshot: Snapshot): ParsedSeries {
  const cube = cubeSchema.parse(snapshot.payload);
  if (cube.id.length !== cube.size.length || new Set(cube.id).size !== cube.id.length)
    throw new Error("Dimension order and sizes do not agree.");
  const expected = { freq: { ANNUAL: "A", QUARTERLY: "Q", MONTHLY: "M" }[def.frequency], ...def.dimensions };
  const allowed = new Set([...Object.keys(expected), "geo", "time"]);
  if (cube.id.some((id) => !allowed.has(id)) || [...allowed].some((id) => !cube.id.includes(id)))
    throw new Error("Unexpected or missing source dimensions.");
  const axes = cube.id.map((id, i) => codes(cube.dimension[id].category.index, cube.size[i]));
  for (const [id, code] of Object.entries(expected)) {
    const axis = axes[cube.id.indexOf(id)];
    if (axis.length !== 1 || axis[0] !== code) throw new Error(`Incompatible ${id}: expected ${code}.`);
  }
  if (axes[cube.id.indexOf("geo")].some((geo) => !["HR", "EU27_2020"].includes(geo)))
    throw new Error("Unexpected geography.");
  const total = cube.size.reduce((a, b) => a * b, 1);
  if (!Number.isSafeInteger(total) || total > 200_000) throw new Error("Unexpected cube size.");
  for (const key of Object.keys(cube.value))
    if (!/^\d+$/.test(key) || Number(key) >= total) throw new Error("Observation index outside cube.");
  const observations: ObservationInput[] = [];
  for (const [key, value] of Object.entries(cube.value)) {
    if (value === null) continue;
    let position = Number(key);
    const cell: Record<string, string> = {};
    for (let i = cube.id.length - 1; i >= 0; i--) {
      cell[cube.id[i]] = axes[i][position % cube.size[i]];
      position = Math.floor(position / cube.size[i]);
    }
    const flags = Array.isArray(cube.status) ? cube.status[Number(key)] : cube.status?.[key];
    observations.push(observation(def, snapshot, cell.time, cell.geo, value, flags ?? ""));
  }
  return { observations, sourceUpdatedAt: updatedDate(cube.updated) };
}

const pxMetadataSchema = z.object({
  title: z.string(),
  variables: z.array(z.object({ code: z.string(), values: z.array(z.string()), valueTexts: z.array(z.string()) })),
});
const pxDataSchema = z.object({
  columns: z.array(z.object({ code: z.string(), type: z.string() })),
  data: z.array(z.object({ key: z.array(z.string()), values: z.array(z.string()).length(1) })),
  metadata: z.array(z.object({ updated: z.string().optional(), source: z.literal("Croatian Bureau of Statistics") })).min(1),
});

export function dzsQuery(def: SeriesDefinition, metadata: unknown) {
  const meta = pxMetadataSchema.parse(metadata);
  if (!meta.title.includes("NKD 2025")) throw new Error("DZS wage classification changed.");
  const expected = new Set([...Object.keys(def.dimensions), "GODINA", "PERIOD"]);
  if (meta.variables.length !== expected.size || meta.variables.some((v) => !expected.has(v.code)))
    throw new Error("DZS dimensions changed.");
  return {
    query: meta.variables.map((variable) => {
      const values = variable.code === "GODINA" ? variable.values.filter((v) => /^\d{4}$/.test(v) && Number(v) >= 2025)
        : variable.code === "PERIOD" ? variable.values.filter((v) => /^(?:[1-9]|1[0-2])$/.test(v))
        : [def.dimensions[variable.code]];
      if (!values.length || values.some((value) => !variable.values.includes(value))) throw new Error(`Invalid DZS selection: ${variable.code}`);
      if (variable.values.length !== variable.valueTexts.length) throw new Error("DZS category labels changed.");
      for (const value of values) {
        const label = variable.valueTexts[variable.values.indexOf(value)].trim();
        const expectedLabel = variable.code === "PERIOD" ? ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][Number(value) - 1]
          : variable.code === "GODINA" ? value : variable.code === "DJELATNOST" ? "TOTAL" : value === "2" ? "NET" : "GROSS";
        if (label !== expectedLabel) throw new Error(`DZS category meaning changed: ${variable.code}=${value}.`);
      }
      return { code: variable.code, selection: { filter: "item", values } };
    }),
    response: { format: "json" },
  };
}

export function parseDzs(def: SeriesDefinition, snapshot: Snapshot): ParsedSeries {
  const query = dzsQuery(def, snapshot.metadata);
  const data = pxDataSchema.parse(snapshot.payload);
  const keys = data.columns.filter((c) => c.type === "d").map((c) => c.code);
  if (keys.length !== query.query.length || keys.some((code) => !query.query.some((q) => q.code === code)))
    throw new Error("DZS response columns changed.");
  const observations: ObservationInput[] = [];
  for (const row of data.data) {
    if (row.key.length !== keys.length) throw new Error("Invalid DZS row key.");
    const cell = Object.fromEntries(keys.map((key, i) => [key, row.key[i]]));
    for (const q of query.query)
      if (!q.selection.values.includes(cell[q.code])) throw new Error("DZS returned an unrequested selection.");
    const raw = row.values[0];
    if (["-", "..", "...", ":", ""].includes(raw)) continue;
    if (!/^-?\d+(?:\.\d+)?$/.test(raw)) throw new Error(`Invalid DZS numeric value: ${raw}`);
    observations.push(observation(def, snapshot, `${cell.GODINA}-${cell.PERIOD.padStart(2, "0")}`, "HR", Number(raw)));
  }
  return { observations, sourceUpdatedAt: updatedDate(data.metadata[0].updated) };
}

async function json(url: string, body?: unknown) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`Source HTTP ${response.status}: ${url}`);
  return response.json() as Promise<unknown>;
}

export async function fetchSnapshot(def: SeriesDefinition): Promise<Snapshot> {
  const url = datasetUrl(def);
  const metadata = def.source === "dzs" ? await json(url) : undefined;
  const body = def.source === "dzs" ? dzsQuery(def, metadata) : undefined;
  const payload = await json(url, body);
  return { indicator: def.slug, request: { url, ...(body ? { body } : {}) }, retrievedAt: new Date().toISOString(), payload, ...(metadata ? { metadata } : {}) };
}

export function parseSnapshot(def: SeriesDefinition, snapshot: Snapshot) {
  if (snapshot.indicator !== def.slug || snapshot.request.url !== datasetUrl(def)) throw new Error("Snapshot does not match definition.");
  return def.source === "eurostat" ? parseEurostat(def, snapshot) : parseDzs(def, snapshot);
}
