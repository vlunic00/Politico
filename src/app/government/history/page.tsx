import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb, PageHeading } from "@/components/page-heading";
import { governments, governmentVerificationDate } from "@/lib/governments";
import { formatDate } from "@/lib/statistics/series";

export const metadata: Metadata = { title: "Povijest administracija" };

export default function GovernmentHistoryPage() {
  return (
    <>
      <Breadcrumb label="Povijest administracija" />
      <PageHeading eyebrow="Vremenska crta" title="Povijest administracija" description="Zasebni mandati od 2011., dokumentirane koalicijske promjene i izvorni programi. Promjena pokazatelja tijekom mandata ne dokazuje učinak vladine politike.">
        <Link href="/compare/governments" className="text-link">Usporedite administracije ↗</Link>
      </PageHeading>
      <p className="subtle mb-6">Provjera izvora: {formatDate(governmentVerificationDate)}. Datumi završetka označavaju primopredaju novoj Vladi; uključeno je tehničko obnašanje dužnosti. Ovo je datirana evidencija, bez automatskog praćenja promjena.</p>
      <nav aria-label="Mandati" className="mb-6 flex flex-wrap gap-3">{[...governments].reverse().map((government) => <a key={government.id} href={`#${government.id}`} className="rounded-full border bg-white px-4 py-2 text-xs text-primary">{government.name}</a>)}</nav>
      <ol className="space-y-6" aria-label="Vremenska crta administracija">
        {[...governments].reverse().map((government) => <li key={government.id}>
          <article id={government.id} className="surface scroll-mt-6 p-5 sm:p-7">
            <p className="eyebrow mb-3">{government.end ? "Završen mandat" : "Aktualni mandat · prema datiranoj provjeri"}</p>
            <h2 className="section-title">{government.name}</h2>
            <p className="mt-2 text-sm"><time dateTime={government.start}>{formatDate(government.start)}</time> – {government.end ? <time dateTime={government.end}>{formatDate(government.end)}</time> : "u tijeku"}</p>
            <div className="mt-4 flex flex-wrap gap-5 text-xs">
              <a href={government.sourceUrl} target="_blank" rel="noreferrer" className="text-link">Službeni izvor mandata i sastava ↗</a>
              {!government.end && <a href="https://vlada.gov.hr/clanovi-vlade/128" target="_blank" rel="noreferrer" className="text-link">Aktualni ministarski sastav ↗</a>}
              <a href={government.programUrl} target="_blank" rel="noreferrer" className="text-link">Izvorni program Vlade ↗</a>
              <Link href={`/compare/governments?first=${government.id}`} className="text-link">Usporedi ovaj mandat ↗</Link>
            </div>
            <h3 className="mt-7 text-sm font-semibold">Koalicijska razdoblja prema izvorima</h3>
            <ul className="mt-3 divide-y">{government.coalition.map((period) => <li key={period.start} className="py-4">
              <p className="text-sm font-medium">{period.parties}</p>
              <p className="subtle mt-1">{formatDate(period.start)} – {period.end ? formatDate(period.end) : "u tijeku prema provjeri"}</p>
              <p className="subtle mt-2">{period.note}</p>
              <a href={period.sourceUrl} target="_blank" rel="noreferrer" className="text-link mt-2 text-xs">Izvor koalicijske evidencije ↗</a>
            </li>)}</ul>
            <h3 className="mt-5 text-sm font-semibold">Dokumentirane promjene</h3>
            <ul className="mt-3 space-y-3">{government.events.map((event) => <li key={event.date} className="text-xs leading-6">
              <time dateTime={event.date} className="font-medium">{formatDate(event.date)}</time> · {event.description}{" "}
              <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Službeni izvor ↗</a>
            </li>)}</ul>
            <p className="subtle mt-4">Izdvojeni događaji nisu potpuna evidencija svih ministarskih promjena. Cijeli potvrđeni sastav provjerite u službenom izvoru. Koalicijski partneri, ministri i zastupnici koji podržavaju Vladu vode se odvojeno.</p>
          </article>
        </li>)}
      </ol>
    </>
  );
}
