import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { getDb } from "@/lib/db";
import { correctionSchema, publicCorrections } from "@/lib/corrections";
import { formatDate } from "@/lib/statistics/series";

export const dynamic = "force-dynamic";
export const metadata = { title: "Javni ispravci" };
export default async function CorrectionsPage({ searchParams }: { searchParams: Promise<{ result?: string; page?: string }> }) {
  const params = await searchParams;
  let entries: Awaited<ReturnType<typeof publicCorrections>> = [], available = false;
  if (process.env.DATABASE_URL) {
    try { entries = await publicCorrections(getDb()); available = true; }
    catch { /* Render an explicit unavailable state if the database or migration is absent. */ }
  }
  const pagePath = correctionSchema.shape.pagePath.safeParse(params.page);
  const fieldClass = "mt-2 w-full rounded-lg border bg-background p-3 text-sm";
  return <div className="space-y-6">
    <PageHeading eyebrow="Povratne informacije" title="Prijavite pogrešku, pratite ispravke" description="Navedite spornu tvrdnju, predloženi ispravak i provjerljiv izvor. Prijave pregledava uredništvo; ne mijenjaju automatski javne podatke." />
    {params.result === "saved" && <p role="status" className="surface p-5">Prijava je spremljena za pregled. Jednake prijave unutar 24 sata spajaju se.</p>}
    {params.result === "invalid" && <p role="alert" className="surface p-5">Prijava nije spremljena. Provjerite putanju stranice, tekst od najmanje 10 znakova u oba polja i HTTPS poveznicu.</p>}
    {!available && <p role="alert" className="surface p-5">Spremanje prijava i dnevnik trenutačno nisu dostupni. Pokušajte kasnije.</p>}
    <section className="surface p-5 sm:p-7"><h2 className="section-title">Nova prijava</h2><p className="subtle mt-3">Ne tražimo ime, e-poštu ni političke sklonosti. Ne unosite osobne ili osjetljive podatke. Izvorni tekst prijave ostaje privatan; objavljuje se samo provjereni urednički sažetak prihvaćenog ispravka i poveznica na zahvaćenu stranicu. Ne dohvaćamo automatski dostavljene poveznice.</p>
      <form action="/corrections/submit" method="post" className="mt-5 space-y-4">
        <fieldset disabled={!available} className="space-y-4">
          <label className="block text-sm font-medium">Putanja stranice<input name="pagePath" required maxLength={400} defaultValue={pagePath.success ? pagePath.data : ""} placeholder="/accountability#financing" className={fieldClass} aria-describedby="page-hint" /></label>
          <p id="page-hint" className="subtle">Dio adrese od znaka /; izostavite domenu i parametre nakon znaka ?. Dopušten je odjeljak nakon #.</p>
          <label className="block text-sm font-medium">Sporna tvrdnja<textarea name="claim" required minLength={10} maxLength={4000} rows={3} className={fieldClass} /></label>
          <label className="block text-sm font-medium">Predloženi ispravak<textarea name="proposed" required minLength={10} maxLength={4000} rows={3} className={fieldClass} /></label>
          <label className="block text-sm font-medium">Poveznica na dokaz<input name="evidenceUrl" type="url" required maxLength={2000} placeholder="https://…" className={fieldClass} /></label>
          <div hidden aria-hidden="true"><label>Ostavite prazno<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <button className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50" type="submit">Pošalji prijavu</button>
        </fieldset>
      </form>
    </section>
    <section className="surface p-5 sm:p-7"><h2 className="section-title">Javni dnevnik ispravaka</h2><p className="subtle mt-3">Najnovijih 100 prihvaćenih ispravaka. Recenzent najprije provjeri dokaz i primijeni promjenu, zatim objavi objašnjenje. Odbijene i neriješene prijave ostaju privatne; prihvaćanje nije automatsko ažuriranje izvora.</p>
      <ul className="mt-4 divide-y">{entries.map((entry) => <li key={entry.id} className="py-4"><p className="subtle">{formatDate(entry.createdAt.toISOString())}</p><p className="mt-2 whitespace-pre-wrap text-sm">{entry.publicSummary}</p><div className="mt-3 flex flex-wrap gap-4"><Link className="text-link text-xs" href={entry.correction.pagePath}>Ispravljena stranica ↗</Link><a className="text-link text-xs" href={entry.sourceUrl!} target="_blank" rel="noreferrer">Provjereni izvor ↗</a></div></li>)}</ul>
      {available && !entries.length && <p className="subtle mt-4">Još nema objavljenih ispravaka.</p>}
    </section>
  </div>;
}
