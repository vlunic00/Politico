import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { indicators } from "../src/lib/catalogue";
import { seriesDefinitions } from "../src/lib/statistics/definitions";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
try {
  const definitions = await db.indicatorDefinition.findMany({ include: {
    sourceDataset: { include: { ingestionRuns: { orderBy: { startedAt: "desc" }, take: 1 } } },
    observations: { where: { publishedAt: { not: null }, geographyId: "HR" }, orderBy: [{ publishedAt: "desc" }, { periodStart: "desc" }], take: 1 },
  } });
  const rows = [];
  let active = 0;
  for (const indicator of indicators) {
    const stored = definitions.find((d) => d.id === indicator.slug);
    const point = stored?.observations[0];
    const def = seriesDefinitions.find((d) => d.slug === indicator.slug);
    if (point) active++;
    const run = stored?.sourceDataset?.ingestionRuns[0] ?? (def ? await db.ingestionRun.findFirst({ where: { sourceDatasetId: `${def.source}:${def.slug}` }, orderBy: { startedAt: "desc" } }) : null);
    rows.push(`| ${indicator.nameEn} | ${point ? "ACTIVE" : "AWAITING_VERIFICATION"} | ${def ? `${def.source}: ${def.dataset}` : "Not connected"} | ${point ? point.periodStart.toISOString().slice(0, 10) : "—"} | ${run?.status ?? "Not imported"} |`);
  }
  const published = await db.indicatorObservation.count({ where: { publishedAt: { not: null } } });
  await writeFile("docs/coverage.md", `# Statistical coverage\n\nGenerated ${new Date().toISOString()} by \`npm run data:coverage\`.\n\n${active} active indicators; ${indicators.length - active} awaiting verification; ${published} published observation records including retained revisions. UI reads only the newest published revision for each series. All 16 topic categories remain available.\n\n| Indicator | Coverage | Source dataset | Latest reference start | Latest import |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\nSources and exact dimension selections: [definitions](../src/lib/statistics/definitions.ts). Eurostat histories start in 2015 where available; DZS wages start in 2025 (NKD 2025). Pending definitions are planning metadata and are never substituted with estimates.\n\nRegional GDP and net migration plus statistical adjustment cover 20 counties and the City of Zagreb, with a separate HR reference. The reference date in this table is the HR series date; the regional explorer selects the latest county year, currently 2024. Individual county histories can start later than 2015. Direct county migration (arrivals minus departures) remains a separate unconnected definition; it is not replaced by the statistical-adjustment measure. See [election and regional contracts](./elections-regions.md).\n\nTourism history remains staged because pandemic-era changes trigger the anomaly guard. Inspect and review the stored snapshot before publication; do not disable validation. Real wages and other unconnected definitions remain pending. No indicators have been declared permanently unavailable.\n`, "utf8");
  console.info(`Updated docs/coverage.md: ${active} active indicators, ${published} published records (including revisions).`);
} finally {
  await db.$disconnect();
}
