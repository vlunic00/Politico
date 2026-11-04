import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireEditor } from "@/lib/editorial";
import { PageHeading } from "@/components/page-heading";
import { formatDate } from "@/lib/statistics/series";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uredništvo · AI sažeci", robots: { index: false, follow: false } };
export default async function SummaryQueue() {
  const actor = await requireEditor();
  const summaries = await getDb().programSummary.findMany({ orderBy: { generatedAt: "desc" }, take: 100, include: { version: { include: { program: { include: { party: true } } } } } });
  return <div className="space-y-6">
    <PageHeading eyebrow="Uredništvo" title="Pregled AI sažetaka" description="Privatni nacrti, recenzije i povijest objava. Samo odobreni sažeci dostupni su javnosti." />
    <p className="subtle">Prijava: {actor.id} · uloga: {actor.role === "reviewer" ? "recenzent" : "urednik"}. Prikazano je najnovijih 100 zapisa.</p>
    <Link className="text-link text-sm" href="/admin/corrections">Prijave javnih ispravaka ↗</Link>
    <section className="surface p-5"><ul className="divide-y">{summaries.map((summary) => <li key={summary.id} className="py-4">
      <Link className="text-link text-sm" href={`/admin/summaries/${summary.id}`}>{summary.version.title} · dokument v{summary.version.version} · sažetak {summary.sequence}</Link>
      <p className="subtle mt-2">{summary.status === "DRAFT" ? "Nacrt" : summary.status === "APPROVED" ? "Odobren" : "Odbijen"} · generirano {formatDate(summary.generatedAt.toISOString())} · {summary.version.program.party.slug}</p>
    </li>)}</ul>{!summaries.length && <p>Nema nacrta za pregled. Pokrenite pripremu sažetka za verificirani program.</p>}</section>
  </div>;
}
