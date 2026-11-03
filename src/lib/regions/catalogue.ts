import geometry from "./counties.json";
import { z } from "zod";

export const counties = geometry.map(({ id, name }) => ({ id, name, slug: name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-") }));
export const regionalGeographies = ["HR", ...counties.map((county) => county.id)];
export const regionalMetrics = { "regional-gdp": "BDP po stanovniku", "regional-migration-adjusted": "Migracijski saldo sa statističkom prilagodbom" } as const;
export const regionalSelection = z.object({ metric: z.enum(["regional-gdp", "regional-migration-adjusted"]).default("regional-gdp"), year: z.coerce.number().int().min(2015).max(2100).optional(),
  county: z.array(z.string()).max(4).default([]), order: z.enum(["name", "asc", "desc"]).default("name") });
export function parseRegionalSelection(query: Record<string, string | string[] | undefined>) {
  const input = { ...query, county: (Array.isArray(query.county) ? query.county : query.county ? [query.county] : []).filter(Boolean) };
  return regionalSelection.refine((selection) => new Set(selection.county).size === selection.county.length && selection.county.every((id) => counties.some((county) => county.id === id)), "Odaberite do četiri različite županije.").safeParse(input);
}
export const mapSource = "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2024_4326_LEVL_3.geojson";
export const mapLicense = "https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units";

export function countyPaths() {
  const project = (coordinate: number[]) => `${((coordinate[0] - 13.3) * 80).toFixed(2)},${((46.7 - coordinate[1]) * 110).toFixed(2)}`;
  return geometry.map((feature) => {
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    return { id: feature.id, d: (polygons as number[][][][]).map((polygon) => polygon.map((ring) => `M${ring.map(project).join("L")}Z`).join(" ")).join(" ") };
  });
}
