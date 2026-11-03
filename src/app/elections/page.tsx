import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { getElections } from "@/lib/elections/data";
import { electionKinds, electionSelection } from "@/lib/elections/catalogue";
import { turnoutPercent } from "@/lib/elections/contracts";
import { formatDate, formatNumber } from "@/lib/statistics/series";

export const metadata: Metadata = { title: "Izbori" };

export const dynamic = "force-dynamic";
export default async function ElectionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getElections();
  const parsed = electionSelection.safeParse(await searchParams);
  const selection = parsed.success ? parsed.data : { kind: "all" as const, year: undefined };
  const records = data.records.filter((record) => (selection.kind === "all" || record.kind === selection.kind) && (!selection.year || record.date.startsWith(String(selection.year))));
  const years = [...new Set(data.records.map((record) => record.date.slice(0, 4)))].sort().reverse();
  return (
    <>
      <PageHeading
        eyebrow="Službene izborne informacije"
        title="Izbori i sudjelovanje"
        description="Datumi, kandidature, izlaznost i rezultati uz izvor i status službene objave."
      />
      <form action="/elections" className="surface mb-6 flex flex-wrap items-end gap-4 p-5"><label className="grid gap-2 text-xs">Vrsta izbora<select name="kind" defaultValue={selection.kind} className="rounded-lg border bg-white p-3 text-sm">{Object.entries(electionKinds).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="grid gap-2 text-xs">Godina glasovanja<select name="year" defaultValue={selection.year ?? ""} className="rounded-lg border bg-white p-3 text-sm"><option value="">Sve godine</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label><button className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Filtriraj izbore</button></form>
      {!parsed.success ? <p role="alert" className="surface p-5">Nevaljan izbor vrste ili godine.</p> : !records.length ? <section className="surface"><EmptyState title="Nema uvezenih izbora za ovaj odabir" description={data.status === "error" ? "Izborna baza privremeno nije dostupna. Prethodno objavljeni podaci nisu izbrisani." : "Prikazuju se samo verificirani uvozi. Nedostupne rezultate ne rekonstruiramo iz medija ili sadašnjeg stranačkog statusa."} /></section> : <section aria-label="Povijest izbora" className="grid gap-5 md:grid-cols-2">{records.map((record) => {
        const turnout = record.metadata.turnout;
        const percent = turnout ? turnoutPercent(turnout.eligible, turnout.voters) : null;
        return <article className="surface p-5" key={record.id}><p className="eyebrow">{record.status === "FINAL" ? "Konačni rezultati" : "Privremeni rezultati"}</p><h2 className="section-title mt-3"><Link href={`/elections/${record.id}`} className="text-link">{record.title}</Link></h2><p className="subtle mt-3">{formatDate(record.date)} · {record.round}. krug · {record.contests.length} objavljenih područja</p><p className="mt-4 text-xl font-semibold">Izlaznost: {percent === null ? "Nije dostupna" : `${formatNumber(percent)} %`}</p>{percent !== null && <div className="mt-3 h-3 overflow-hidden rounded-full bg-accent" aria-hidden="true"><div className="h-full bg-primary" style={{ width: `${percent}%` }} /></div>}<p className="subtle mt-3">{record.metadata.scope}</p><Link className="text-link mt-4 text-xs" href={`/elections/${record.id}`}>Izborne jedinice, kandidati, glasovi i mandati ↗</Link></article>;
      })}</section>}
      <section className="surface mt-6 p-5"><h2 className="section-title">Predstojeći izbori i potvrđene kandidature</h2><p className="subtle mt-3">Aktualni službeni raspored i buduće kandidacijske liste još nisu uvezeni. Povijesno sudjelovanje i registracija stranke nisu potvrda buduće kandidature. Ne prikazujemo pretpostavljene datume ni prognoze.</p><p className="subtle mt-3">Početni obuhvat: parlamentarni izbori 2020. i 2024., europski izbori 2024. i oba kruga predsjedničkih izbora 2024./2025. Stariji ciklusi i lokalni rezultati još nisu uvezeni.</p><Link href="/parties" className="text-link mt-4 text-xs">Zaseban registar političkih stranaka ↗</Link></section>
      <a
        href="https://www.izbori.hr/"
        target="_blank"
        rel="noreferrer"
        className="text-link mt-6"
      >
        Službene informacije Državnog izbornog povjerenstva ↗
      </a>
    </>
  );
}
