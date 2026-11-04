import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { getDb } from "@/lib/db";
import { requireEditor } from "@/lib/editorial";
import { formatDate } from "@/lib/statistics/series";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uredništvo · ispravci", robots: { index: false, follow: false } };
export default async function CorrectionQueue({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const actor = await requireEditor();
  const { result } = await searchParams;
  const entries = await getDb().correction.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, include: { reviews: { orderBy: { createdAt: "asc" } } } });
  const fieldClass = "mt-2 w-full rounded-lg border bg-background p-3 text-sm";
  return <div className="space-y-6"><PageHeading eyebrow="Uredništvo" title="Pregled prijava ispravaka" description="Privatne prijave i revizijski trag. Javna objava zahtijeva recenzenta i već primijenjen ispravak." />
    <p className="subtle">Prijava: {actor.id} · {actor.role}. Najnovijih 100 zapisa. <Link className="text-link" href="/admin/summaries">Pregled sažetaka ↗</Link></p>
    {result && <p role={result === "saved" ? "status" : "alert"}>{result === "saved" ? "Odluka je spremljena." : "Odluka nije spremljena. Provjerite polja i je li prijava već zaključena."}</p>}
    {!entries.length && <p className="surface p-5">Nema prijava za pregled.</p>}
    {entries.map((entry) => <article className="surface p-5 sm:p-7" key={entry.id}><h2 className="section-title">{entry.pagePath}</h2><p className="subtle mt-2">{entry.id} · {formatDate(entry.createdAt.toISOString())} · {entry.status}</p>
      <h3 className="mt-4 text-sm font-semibold">Sporna tvrdnja</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.claim}</p><h3 className="mt-4 text-sm font-semibold">Prijedlog</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.proposed}</p>
      <a href={entry.evidenceUrl} target="_blank" rel="noreferrer" className="text-link mt-4 text-xs">Nepouzdana korisnička poveznica · provjerite prije uporabe ↗</a>
      {entry.status === "PENDING" && actor.role === "reviewer" && <form action={`/admin/corrections/${entry.id}/review`} method="post" className="mt-5 space-y-4">
        <label className="block text-sm font-medium">Privatna bilješka<textarea required name="note" minLength={10} maxLength={4000} rows={2} className={fieldClass} /></label>
        <label className="block text-sm font-medium">Javno objašnjenje promjene<textarea name="publicSummary" maxLength={4000} rows={3} className={fieldClass} /></label>
        <p className="subtle">Navedite što je pisalo i što je ispravljeno te po potrebi reviziju podataka ili Git commit. Ne prenosite osobne podatke iz prijave.</p>
        <label className="block text-sm font-medium">Provjereni izvor<input name="sourceUrl" type="url" maxLength={2000} className={fieldClass} /></label>
        <label className="flex gap-3 text-sm"><input type="checkbox" name="applied" />Provjerio/la sam izvor i već primijenio/la ispravak na javnoj stranici.</label>
        <div className="flex flex-wrap gap-4"><button name="action" value="ACCEPTED" className="rounded-lg bg-primary px-4 py-3 text-sm text-white">Prihvati i objavi objašnjenje</button><button name="action" value="REJECTED" className="rounded-lg border px-4 py-3 text-sm">Odbij prijavu</button></div>
      </form>}
      <ul className="mt-4 divide-y">{entry.reviews.map((review) => <li key={review.id} className="py-3 text-sm"><p>{review.actorId} · {review.action} · {formatDate(review.createdAt.toISOString())}</p><p className="mt-2 whitespace-pre-wrap">{review.note}</p>{review.publicSummary && <p className="mt-2 whitespace-pre-wrap">Javno: {review.publicSummary}</p>}</li>)}</ul>
    </article>)}
  </div>;
}
