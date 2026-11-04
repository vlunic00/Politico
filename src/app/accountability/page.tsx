import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { accountability, formatEuroCents } from "@/lib/accountability/data";
import { accountabilitySections, commitmentStates } from "@/lib/accountability/catalogue";
import { formatDate } from "@/lib/statistics/series";
import { indicators } from "@/lib/catalogue";

export const metadata = { title: "Javna odgovornost" };

function EvidenceLink({ sourceId, locator }: { sourceId: string; locator: string }) {
  const source = accountability.sources.find((source) => source.id === sourceId)!;
  return <a className="text-link text-xs" href={source.url} target="_blank" rel="noreferrer">{source.title} · {locator} ↗</a>;
}

export default function AccountabilityPage() {
  const { financing, parliament, commitments } = accountability;
  return <div className="space-y-6">
    <PageHeading eyebrow="Javna odgovornost" title="Dokumenti, radnje i dokazi" description="Financiranje, saborski rad i programske obveze. Datirani izvori i jasno označen obuhvat, bez političkih ocjena." />
    <p className="subtle">Provjereno {formatDate(accountability.verifiedAt)} · dosje v{accountability.version}. Ovo je početni obuhvat, ne evidencija uživo.</p>
    <nav aria-label="Područja javne odgovornosti" className="flex flex-wrap gap-5">{accountabilitySections.map((section) => <a className="text-link text-sm" key={section.id} href={`#${section.id}`}>{section.title}</a>)}<Link className="text-link text-sm" href="/corrections">Prijavite ispravak</Link></nav>

    <section id="financing" className="surface scroll-mt-40 p-5 sm:p-7">
      <h2 className="section-title">Političko financiranje</h2>
      <p className="subtle mt-3">Državni proračun · redovito godišnje financiranje · {formatDate(financing.periodStart)} – {formatDate(financing.periodEnd)}. Iznosi su u EUR. Obuhvaćena su sva 34 primatelja iz ovog izvještaja; imena su povijesna, a nezavisni zastupnici prikazani su zasebno.</p>
      <p className="subtle mt-3">Ove isplate nisu ukupni prihodi stranaka. Donacije, prihodi iz lokalnih proračuna i troškovi kampanja nisu uvezeni i nisu nula. Ne povezujemo primatelje s današnjim strankama samo na temelju sličnog naziva.</p>
      <div className="mt-5 overflow-x-auto rounded-lg border" role="region" aria-label="Tablica političkog financiranja" tabIndex={0}>
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Redovito državno financiranje za 2024. · raspoređeno i isplaćeno u EUR</caption>
          <thead className="bg-secondary"><tr><th scope="col" className="p-3">Primatelj</th><th scope="col" className="p-3">Vrsta</th><th scope="col" className="p-3 text-right">Raspoređeno</th><th scope="col" className="p-3 text-right">Isplaćeno</th><th scope="col" className="p-3">Dokaz</th></tr></thead>
          <tbody className="divide-y">{financing.rows.map((row) => <tr key={row.name}><th scope="row" className="min-w-44 p-3 font-medium">{row.name}</th><td className="p-3">{row.kind === "party" ? "Stranka" : "Nezavisni zastupnik"}</td><td className="whitespace-nowrap p-3 text-right tabular-nums">{formatEuroCents(row.allocatedCents)}</td><td className="whitespace-nowrap p-3 text-right tabular-nums">{formatEuroCents(row.paidCents)}</td><td className="p-3"><a className="text-link whitespace-nowrap" aria-label={`Str. ${row.page} · ${row.name} · izvorni PDF`} href={`${accountability.sources.find((source) => source.id === financing.sourceId)!.url}#page=${row.page}`}>Str. {row.page} ↗</a></td></tr>)}</tbody>
          <tfoot className="border-t bg-secondary font-semibold"><tr><th scope="row" className="p-3" colSpan={2}>Zbroj prikazanih redaka</th><td className="whitespace-nowrap p-3 text-right">{formatEuroCents(financing.rows.reduce((sum, row) => sum + row.allocatedCents, 0))}</td><td className="whitespace-nowrap p-3 text-right">{formatEuroCents(financing.rows.reduce((sum, row) => sum + row.paidCents, 0))}</td><td /></tr><tr><th scope="row" className="p-3" colSpan={2}>Ukupno prema izvještaju</th><td className="whitespace-nowrap p-3 text-right">{formatEuroCents(financing.allocatedCents)}</td><td className="whitespace-nowrap p-3 text-right">{formatEuroCents(financing.paidCents)}</td><td /></tr></tfoot>
        </table>
      </div>
      <p className="subtle mt-3">Razlika između ukupno raspoređenog i isplaćenog iznosa iznosi 0,06 EUR u izvorniku; stupce ne izjednačavamo.</p>
      <p className="subtle mt-3">{financing.reconciliation.note}</p>
      <div className="mt-4 flex flex-wrap gap-4"><EvidenceLink sourceId={financing.sourceId} locator="PDF stranice 1–2" /><a className="text-link text-xs" href="https://www.izbori.hr/site/nadzor-financiranja/redovito-financiranje/81">DIP · izvorni godišnji izvještaji i donacije ↗</a></div>
    </section>

    <section id="parliament" className="surface scroll-mt-40 p-5 sm:p-7">
      <h2 className="section-title">Parlamentarna aktivnost</h2>
      <p className="subtle mt-3">{parliament.term}. saziv · {formatDate(parliament.periodStart)} – {formatDate(parliament.periodEnd)}. {parliament.limitations}</p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{parliament.metrics.map((metric) => <div key={metric.label} className="rounded-xl bg-secondary p-4"><dt className="text-xs text-muted-foreground">{metric.label}</dt><dd className="mt-2 text-2xl font-semibold">{metric.value}</dd><dd className="mt-3"><EvidenceLink sourceId={parliament.sourceId} locator={metric.locator} /></dd></div>)}</dl>
      <h3 className="mt-6 font-semibold">Pojedinačni službeni zapisi</h3>
      <ul className="mt-3 divide-y">{parliament.records.map((record) => <li className="py-4" key={record.title}><p className="text-sm font-medium">{record.title} · {formatDate(record.date)}</p><p className="subtle mt-2">{record.evidence.description}</p><div className="mt-3"><EvidenceLink sourceId={record.evidence.sourceId} locator={record.evidence.locator} /></div></li>)}</ul>
    </section>

    <section id="commitments" className="scroll-mt-40 space-y-4">
      <h2 className="section-title">Praćenje obveza</h2>
      <p className="subtle">Pratimo izričite, provjerljive prijedloge službenih programa. Opće želje bez određene radnje ili mjerljivog cilja ne postaju ocijenjena obećanja. Prikazani status opisuje dostupne dokaze, a ne ispunjenost obveze. Početni dosje sadrži jednu obvezu; nije reprezentativan uzorak stranaka.</p>
      {commitments.map((item) => <article id={item.id} className="surface scroll-mt-40 p-5 sm:p-7" key={item.id}>
        <p className="eyebrow text-primary">{commitmentStates[item.state]}</p><h3 className="section-title mt-3">{item.title}</h3>
        <p className="subtle mt-3">Nositelj: {item.owner}. <Link className="text-link" href={`/government/history#${item.governmentId}`}>Izvori mandata ↗</Link></p>
        <blockquote className="mt-4 border-l-2 border-primary pl-4 text-sm">„{item.quote}”</blockquote>
        <p className="subtle mt-3">{item.program.version} · PDF stranica {item.program.page} · izvorna objava: {formatDate(item.program.publicationDate)}.</p>
        <div className="mt-3"><EvidenceLink sourceId={item.program.sourceId} locator={`PDF stranica ${item.program.page}`} /></div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">{item.targets.map((target) => <div key={target.label}><dt className="text-xs text-muted-foreground">Programski cilj · {target.label}</dt><dd className="mt-1 text-sm font-medium">{new Intl.NumberFormat("hr-HR").format(target.value)} {target.unit}</dd></div>)}</dl>
        <p className="subtle mt-4">Rok: {item.deadline ? formatDate(item.deadline) : "Točan datum nije naveden"}. {item.deadlineNote}</p>
        <h4 className="mt-5 text-sm font-semibold">Kronologija dokaza</h4><ol className="mt-2 divide-y">{item.evidence.map((evidence) => <li key={`${evidence.sourceId}:${evidence.locator}`} className="py-3"><p className="subtle">{formatDate(evidence.date)} · {evidence.description}</p><div className="mt-2"><EvidenceLink sourceId={evidence.sourceId} locator={evidence.locator} /></div></li>)}</ol>
        <p className="subtle mt-4">Ograničenja: {item.limitations}</p>
        <div className="mt-4 flex flex-wrap gap-4">{item.indicators.map((slug) => { const indicator = indicators.find((entry) => entry.slug === slug)!; return <Link className="text-link text-xs" key={slug} href={`/topics/${indicator.topic}#${slug}`}>Povezani pokazatelj · {indicator.name} ↗</Link>; })}</div>
        <Link className="text-link mt-4 text-xs" href={`/corrections?page=/accountability%23${item.id}`}>Predložite ispravak ovog zapisa ↗</Link>
      </article>)}
    </section>
    <section id="evidence" className="surface p-5 sm:p-7"><h2 className="section-title">Izvori i granice dosjea</h2><ul className="mt-4 divide-y">{accountability.sources.map((source) => <li key={source.id} className="py-4"><EvidenceLink sourceId={source.id} locator={`objava ${formatDate(source.publicationDate)}`} /><p className="subtle mt-2">{source.note}</p></li>)}</ul><Link className="text-link mt-4 text-xs" href="/sources#accountability">Podrijetlo i revizije izvora ↗</Link></section>
  </div>;
}
