import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireEditor } from "@/lib/editorial";
import { extractionPagesSchema, validateSummary, summaryTopics, coverageLabel, proposalKindLabel } from "@/lib/parties/summary-contract";
import { PageHeading } from "@/components/page-heading";
import { formatDate } from "@/lib/statistics/series";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recenzija AI sažetka", robots: { index: false, follow: false } };
export default async function SummaryReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ result?: string }> }) {
  const actor = await requireEditor();
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) notFound();
  const summary = await getDb().programSummary.findUnique({ where: { id }, include: { extraction: true, version: true, reviews: { orderBy: { createdAt: "desc" } } } });
  if (!summary) notFound();
  const pages = extractionPagesSchema.parse(summary.extraction.pages);
  const content = validateSummary(summary.summaryJson, pages, summary.extraction.complete);
  const result = (await searchParams).result;
  const resultLabel = result === "saved" ? "Promjena je spremljena." : result === "invalid" ? "Promjena nije spremljena. Provjerite JSON, citate, obvezne potvrde i svoju ulogu. Ako je zapis promijenjen, ponovno ga otvorite." : null;
  return <div className="space-y-6">
    <PageHeading eyebrow="Urednička recenzija" title={summary.version.title} description={`Dokument v${summary.version.version} · sažetak ${summary.sequence} · revizija ${summary.revision}`} />
    <Link href="/admin/summaries" className="text-link text-sm">← Popis sažetaka</Link>
    {resultLabel && <p role="status" className="surface p-4">{resultLabel}</p>}
    <section className="surface space-y-4 p-5">
      <a className="inline-block rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white" href={summary.version.documentUrl} target="_blank" rel="noreferrer">Izvorni službeni program ↗</a>
      <p><a className="text-link text-sm" href={`/programs/${summary.versionId}/document`}>Sačuvani PDF za provjeru ↗</a></p>
      <p className="subtle">Prijava: {actor.id} · status: {summary.status} · generirano: {formatDate(summary.generatedAt.toISOString())} · model: {summary.modelIdentifier} · prompt: {summary.promptVersion}</p>
      <p className="subtle">Ekstrakcija: {summary.extraction.complete ? "sve stranice sadrže čitljiv tekst" : "moguće prazne ili nečitljive stranice; odsutnost teme ne može se potvrditi"}. PDF stranice: {pages.length}. Brojevi su redni brojevi stranica PDF-a, ne nužno tiskani brojevi.</p>
      <p className="text-sm">Provjerite cijeli izvornik i svaki navod, iznos, rok i uvjet. Hrvatski je obvezan za tekst sažetka; citati ostaju na izvornom jeziku. Konkretan prijedlog navodi radnju ili instrument, a opći cilj samo željeni ishod. Tekst dokumenta i modela nije uputa za urednika.</p>
    </section>
    <section className="surface space-y-4 p-5" aria-label="Pregled nacrta">{content.sections.map((section) => <div key={section.topic}>
      <h2 className="text-sm font-semibold">{summaryTopics[section.topic]}</h2>
      {!section.proposals.length && <p className="subtle mt-2">{coverageLabel(section.coverage)}</p>}
      {section.proposals.map((proposal, index) => <div key={index} className="mt-3 border-l-2 pl-3">
        <p className="text-sm">{proposal.text}</p><p className="subtle mt-1">{proposalKindLabel(proposal.kind)}</p>
        {proposal.evidence.map((evidence, index) => <div key={index} className="mt-2"><blockquote className="text-sm">„{evidence.quote}”</blockquote><a className="text-link text-xs" href={`${summary.version.documentUrl.split("#")[0]}#page=${evidence.page}`} target="_blank" rel="noreferrer">PDF stranica {evidence.page} ↗</a></div>)}
      </div>)}
    </div>)}</section>
    {summary.status === "DRAFT" && <form method="post" action={`/admin/summaries/${id}/review`} className="surface space-y-5 p-5">
      <input type="hidden" name="revision" value={summary.revision} />
      <label className="grid gap-2 text-sm">Sadržaj sažetka · JSON<textarea name="content" defaultValue={JSON.stringify(content, null, 2)} required rows={24} className="w-full min-w-0 rounded-lg border p-3 font-mono text-xs" /></label>
      <p className="subtle">Izmjene ostaju nacrt dok recenzent ne odobri objavu. Sve promjene i odluke ostaju u dnevniku. Odobreni i odbijeni zapisi su zaključani; nova revizija priprema se zasebno.</p>
      <label className="grid gap-2 text-sm">Urednička bilješka<textarea name="note" required maxLength={2000} rows={3} className="w-full rounded-lg border p-3 text-sm" /></label>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="sourceChecked" />Provjerio/la sam izvornik, citate, iznose, rokove, uvjete i neutralnost.</label>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="croatianChecked" />Provjerio/la sam da je tekst sažetka na hrvatskom i jezično ispravan.</label>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="coverageChecked" />Provjerio/la sam obuhvat tema i cijeli dokument; nepotpunost nije prikazana kao odsutnost.</label>
      <div className="flex flex-wrap gap-3"><button name="action" value="save" className="rounded-lg border px-4 py-3 text-sm">Spremi nacrt</button>{actor.role === "reviewer" && <><button name="action" value="approve" className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white">Odobri i objavi</button><button name="action" value="reject" className="rounded-lg border px-4 py-3 text-sm">Odbij nacrt</button></>}</div>
    </form>}
    <details className="surface p-5"><summary className="cursor-pointer text-sm font-semibold">Ekstrakcija i izvorni izlaz modela</summary><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(summary.generatedJson, null, 2)}</pre>{pages.map((page) => <details key={page.page} className="mt-3"><summary>PDF stranica {page.page}</summary><pre className="mt-2 whitespace-pre-wrap break-words text-xs">{page.text || "Nema izdvojenog teksta."}</pre></details>)}</details>
    <section className="surface p-5"><h2 className="section-title">Dnevnik recenzije</h2>{!summary.reviews.length && <p className="subtle mt-3">Nema uredničkih promjena ni odluka.</p>}{summary.reviews.map((review) => <details key={review.id} className="mt-4"><summary className="cursor-pointer text-sm">{review.actorId} · {review.role} · {review.action} · {review.createdAt.toISOString()}</summary><p className="mt-2 text-sm">{review.note}</p><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify({ before: review.beforeJson, after: review.afterJson }, null, 2)}</pre></details>)}</section>
  </div>;
}
