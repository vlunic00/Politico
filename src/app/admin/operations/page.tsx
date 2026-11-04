import { getDb } from "@/lib/db";
import { requireEditor } from "@/lib/editorial";
import { PageHeading } from "@/components/page-heading";
import { formatDate } from "@/lib/statistics/series";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uredništvo · Uvozi", robots: { index: false, follow: false } };
export default async function OperationsPage() {
  await requireEditor();
  const datasets = await getDb().sourceDataset.findMany({ orderBy: { id: "asc" }, include: {
    ingestionRuns: { orderBy: { startedAt: "desc" }, take: 1 },
  } });
  return <div className="space-y-6">
    <PageHeading eyebrow="Uredništvo" title="Nadzor uvoza" description="Posljednji pokušaj za svaki skup. Uspješan uvoz ne jamči aktualno referentno razdoblje; provjerite raspored izvora. Provjera arhiva i sigurnosnih kopija provodi se zasebno." />
    <ul className="surface divide-y p-5">{datasets.map((dataset) => {
      const run = dataset.ingestionRuns[0];
      return <li className="space-y-2 py-3" key={dataset.id}>
        <h2 className="break-all text-sm font-semibold">{dataset.id}</h2>
        <p className="subtle">{run?.status ?? "Nije uvezeno"} · {run ? formatDate(run.startedAt.toISOString()) : "—"} · objavljeno zapisa: {run?.recordsPublished ?? 0}</p>
        {run?.error && <p className="break-words text-xs">{run.error}</p>}
      </li>;
    })}</ul>
  </div>;
}
