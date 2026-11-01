import Link from "next/link";
import { getPartyDirectory } from "@/lib/parties/data";
import { electionContexts, policyTopics, registrationLabel } from "@/lib/parties/catalogue";
import { partyComparisonSelection } from "@/lib/parties/comparison";
import { isGovernmentParty } from "@/lib/parties/directory";
import { formatDate } from "@/lib/statistics/series";
import { parliamentarySnapshot } from "@/lib/politics";
import { EmptyState } from "./empty-state";

export async function PartyComparison({ query }: { query: Record<string, string | string[] | undefined> }) {
  const directory = await getPartyDirectory();
  const parsed = partyComparisonSelection(query, directory.parties);
  const selection = parsed.success ? parsed.data : { party: [], context: "next-parliamentary" as const };
  const selected = selection.party.map((slug) => directory.parties.find((party) => party.slug === slug)!);
  const programs = selected.map((party) => party.programs.find((program) => program.context === selection.context));
  const control = "min-w-0 w-full rounded-lg border bg-white p-2.5 text-sm";
  return <div className="space-y-6">
    <form action="/compare/parties" className="surface grid gap-4 p-5 sm:grid-cols-2">
      {[0, 1, 2, 3].map((index) => <label key={index} className="grid min-w-0 gap-2 text-xs">Stranka {index + 1}
        <select name="party" defaultValue={selection.party[index] ?? ""} className={control}><option value="">Odaberite stranku</option>{[...directory.parties].sort((a, b) => a.name.localeCompare(b.name, "hr")).map((party) => <option key={party.id} value={party.slug}>{party.name}{party.registration?.status === "PRESTANAK" && " · prestanak"}</option>)}</select>
      </label>)}
      <label className="grid min-w-0 gap-2 text-xs">Programski kontekst<select name="context" defaultValue={selection.context} className={control}>{Object.entries(electionContexts).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <div className="flex flex-wrap items-end gap-5"><button type="submit" className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Usporedi stranke</button><Link href="/parties" className="text-link text-xs">Imenik stranaka ↗</Link></div>
    </form>
    <p className="subtle">Svaka stranka ima jednak prostor. Usporedba koristi samo verificirane navode i objavljenu verziju programa za odabrani kontekst. Povijesni program nije potvrda buduće kandidature ili današnjih stavova. Bez ocjena i pobjednika.</p>
    {!parsed.success ? <p role="alert" className="surface p-5">Nevaljan odabir. Odaberite do četiri različite postojeće stranke i dostupan programski kontekst.</p>
      : !selected.length ? <section className="surface"><EmptyState title="Odaberite stranke za usporedbu" description="Možete usporediti do četiri stranke. Nepostojeći ili neverificirani navodi ostaju označeni kao nedostupni." /></section>
      : <section className="surface min-w-0 overflow-hidden p-4 sm:p-6" aria-label="Usporedna tablica stranaka">
        <div className="overflow-x-auto" role="region" tabIndex={0} aria-label="Vodoravno pomična usporedba">
          <table className="w-full table-fixed text-left text-sm" style={{ minWidth: `${180 + selected.length * 200}px` }}>
            <caption className="sr-only">Usporedba stranaka · {electionContexts[selection.context]}</caption>
            <colgroup><col style={{ width: 180 }} />{selected.map((party) => <col key={party.id} />)}</colgroup>
            <thead><tr><th scope="col" className="p-3">Tema / podatak</th>{selected.map((party) => <th key={party.id} scope="col" className="p-3"><Link href={`/parties/${party.slug}`} className="text-primary underline underline-offset-4">{party.name}</Link></th>)}</tr></thead>
            <tbody>
              <tr className="border-t"><th scope="row" className="p-3 font-medium">Registracija</th>{selected.map((party) => <td key={party.id} className="p-3">{registrationLabel(party.registration?.status)}</td>)}</tr>
              <tr className="border-t"><th scope="row" className="p-3 font-medium">Parlamentarni presjek · {parliamentarySnapshot.dateLabel}</th>{selected.map((party) => <td key={party.id} className="p-3">{typeof party.seats === "number" ? `${party.seats} mandata` : "Nije u tom presjeku"}</td>)}</tr>
              <tr className="border-t"><th scope="row" className="p-3 font-medium">Sudjelovanje u Vladi</th>{selected.map((party) => <td key={party.id} className="p-3">{isGovernmentParty(party.id) ? <Link href="/government/history#plenkovic-3" className="text-link text-xs">Potvrđena koalicijska suradnja ↗</Link> : "Nije zasebno verificirano"}</td>)}</tr>
              <tr className="border-t"><th scope="row" className="p-3 font-medium">Orijentacija · dokumentirana metoda</th>{selected.map((party) => <td key={party.id} className="p-3">{party.orientation ? <a href={party.orientation.sourceUrl} className="text-link text-xs" target="_blank" rel="noreferrer">{party.orientation.label} · {party.orientation.method} ↗</a> : "Nije verificirana"}</td>)}</tr>
              <tr className="border-t"><th scope="row" className="p-3 font-medium">Izvorni program i verzija</th>{selected.map((party, index) => {
                const program = programs[index];
                return <td key={party.id} className="p-3 align-top">{program ? <><a href={program.documentUrl} className="text-link text-xs" target="_blank" rel="noreferrer">{program.title} ↗</a><p className="subtle mt-2">Verzija {program.version} · objava: {formatDate(program.publicationDate)}</p><Link href={`/parties/${party.slug}#program-${program.id}`} className="text-link mt-2 text-xs">Arhiva i izvorni dokument ↗</Link></> : "Nema verificiranog programa za odabrani kontekst"}</td>;
              })}</tr>
              {Object.entries(policyTopics).map(([topic, label]) => <tr key={topic} className="border-t"><th scope="row" className="p-3 align-top font-medium">{label}</th>{selected.map((party, index) => {
                const program = programs[index];
                const evidence = program?.evidence.find((evidence) => evidence.topic === topic);
                return <td key={party.id} className="p-3 align-top">{evidence && program ? <><blockquote className="leading-6">„{evidence.quote}”</blockquote><a href={`${program.documentUrl.split("#")[0]}#page=${evidence.page}`} className="text-link mt-3 text-xs" target="_blank" rel="noreferrer">Izvorni program · PDF str. {evidence.page} ↗</a></> : <p className="subtle">Nema verificiranog navoda.</p>}</td>;
              })}</tr>)}
            </tbody>
          </table>
        </div>
        <p className="subtle mt-4">Izostanak verificiranog navoda ne znači da tema nije obrađena u izvorniku. Registracijski izvor i datum provjere dostupni su na profilu svake stranke. Saborski presjek nije izborni rezultat. AI sažeci još nisu povezani.</p>
      </section>}
  </div>;
}
