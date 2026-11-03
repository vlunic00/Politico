import { EmptyState } from "./empty-state";
import { electionContexts, policyTopics, type DirectoryParty } from "@/lib/parties/catalogue";
import { formatDate } from "@/lib/statistics/series";
import { ProgramSummary } from "./program-summary";

export function PartyPrograms({ party }: { party?: DirectoryParty }) {
  return <section className="surface p-6">
    <h3 className="section-title">Službeni programi i verzije</h3>
    <p className="subtle mt-3">Izvorni dokument je temelj za provjeru. Povijesni program ne predstavlja nužno današnje stavove ili program sljedećih izbora.</p>
    {!party?.programs.length ? <EmptyState title="Nema verificiranog programa" description="Ne zaključujemo političke pozicije bez izvornog dokumenta." compact />
      : <div className="mt-5 space-y-6">{party.programs.map((program) => <article key={program.id} id={`program-${program.id}`} className="rounded-xl border p-4">
        <h4 className="text-sm font-semibold">{program.title} · verzija {program.version}</h4>
        <p className="subtle mt-2">{electionContexts[program.context as keyof typeof electionContexts] ?? program.context} · jezik: {program.language}</p>
        <a href={program.documentUrl} className="mt-4 inline-block rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white" target="_blank" rel="noreferrer">Izvorni službeni program ↗</a>
        <p className="subtle mt-4">Izvorna objava: {formatDate(program.publicationDate)} · preuzeto: {formatDate(program.retrievedAt)} · verificirano za prikaz: {formatDate(program.publishedAt)}.</p>
        <p className="mt-2 break-all text-[10px] text-muted-foreground">SHA-256: {program.contentHash}</p>
        <a href={`/programs/${program.id}/document`} className="text-link mt-3 text-xs">Preuzmi sačuvanu verziju PDF-a ↗</a>
        {program.evidence.length > 0 && <div className="mt-5 space-y-4"><h5 className="text-sm font-semibold">Verificirani navodi iz programa</h5>{program.evidence.map((evidence) => <div key={evidence.topic}>
          <p className="text-xs font-medium">{policyTopics[evidence.topic]}</p><blockquote className="mt-1 border-l-2 pl-3 text-sm leading-6">„{evidence.quote}”</blockquote>
          <a href={`${program.documentUrl.split("#")[0]}#page=${evidence.page}`} className="text-link mt-2 text-xs" target="_blank" rel="noreferrer">Izvornik · PDF stranica {evidence.page} ↗</a>
        </div>)}</div>}
        {program.summaries?.length ? <><ProgramSummary summary={program.summaries[0]} documentUrl={program.documentUrl} />{program.summaries.length > 1 && <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold">Prethodna odobrena izdanja sažetka</summary>{program.summaries.slice(1).map((summary) => <ProgramSummary key={summary.id} summary={summary} documentUrl={program.documentUrl} />)}</details>}</> : <p className="subtle mt-5">Nema odobrenog AI sažetka za ovu verziju programa.</p>}
      </article>)}</div>}
  </section>;
}
