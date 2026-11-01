import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { PartyCard } from "@/components/party-card";
import { getPartyDirectory } from "@/lib/parties/data";
import { directorySelectionSchema, electionContexts, parliamentaryNote, registerCatalogueUrl } from "@/lib/parties/catalogue";
import { filterPartyDirectory } from "@/lib/parties/directory";
import { formatDate } from "@/lib/statistics/series";

export const metadata: Metadata = { title: "Političke stranke" };

export default async function PartiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [directory, query] = await Promise.all([getPartyDirectory(), searchParams]);
  const parsed = directorySelectionSchema.safeParse({ ...query, registration: query.registration ?? (directory.status === "ready" ? "active" : "all") });
  const selection = parsed.success ? parsed.data : directorySelectionSchema.parse({});
  const matches = parsed.success ? filterPartyDirectory(directory.parties, selection) : [];
  const pages = Math.max(1, Math.ceil(matches.length / 24));
  const entries = matches.slice((selection.page - 1) * 24, selection.page * 24);
  const pageUrl = (page: number) => `/parties?${new URLSearchParams({ ...selection, page: String(page) })}`;
  const control = "min-w-0 w-full rounded-lg border bg-white p-2.5 text-sm";
  return (
    <>
      <PageHeading
        eyebrow="Politički krajolik"
        title="Imenik političkih stranaka"
        description="Registracija, parlamentarni status i izborna kandidatura različite su činjenice. Svaka zahtijeva vlastiti izvor."
      />
      <section className="surface mb-6 space-y-2 p-5 text-sm" aria-label="Stanje registra">
        <p>{directory.status === "ready" ? `${directory.parties.length} zapisa službenog registra · ${directory.parties.filter((party) => party.registration?.status === "AKTIVAN").length} aktivnih.` : "Registar trenutačno nije dostupan. Prikazujemo samo odvojeni, datirani parlamentarni presjek bez potvrde registracije."}</p>
        <p className="subtle">Uspješna provjera: {formatDate(directory.checkedAt)}. {parliamentaryNote}</p>
        {directory.importStatus === "FAILED" && <p className="subtle">Posljednji uvoz nije uspio; prethodno objavljeni registar ostaje dostupan.</p>}
        <a href={registerCatalogueUrl} className="text-link text-xs" target="_blank" rel="noreferrer">Službeni registar i licenca ↗</a>
      </section>
      <form action="/parties" className="surface mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid min-w-0 gap-2 text-xs">Naziv, kratica ili vodstvo<input name="q" type="search" maxLength={200} defaultValue={selection.q} className={control} /></label>
        <label className="grid min-w-0 gap-2 text-xs">Registracijski status<select name="registration" defaultValue={selection.registration} className={control}><option value="active">Aktivne u registru</option><option value="ceased">Prestanak prema registru</option><option value="all">Svi zapisi</option></select></label>
        <label className="grid min-w-0 gap-2 text-xs">Parlamentarni presjek<select name="parliament" defaultValue={selection.parliament} className={control}><option value="all">Sve stranke</option><option value="represented">Zastupljene u presjeku</option><option value="not-in-snapshot">Nisu u presjeku</option></select></label>
        <label className="grid min-w-0 gap-2 text-xs">Sudjelovanje u Vladi<select name="government" defaultValue={selection.government} className={control}><option value="all">Sve stranke</option><option value="confirmed">Potvrđeni koalicijski partneri</option><option value="unverified">Nije zasebno potvrđeno</option></select></label>
        <label className="grid min-w-0 gap-2 text-xs">Izborni kontekst<select name="election" defaultValue={selection.election} className={control}>{Object.entries(electionContexts).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="grid min-w-0 gap-2 text-xs">Izborno sudjelovanje<select name="participation" defaultValue={selection.participation} className={control}><option value="all">Sve stranke</option><option value="confirmed">Potvrđeno u navedenoj evidenciji</option><option value="unverified">Nije verificirano</option></select></label>
        <div className="flex flex-wrap items-center gap-5 sm:col-span-2 lg:col-span-3"><button type="submit" className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Pretraži stranke</button><Link href="/parties" className="text-link text-xs">Poništi filtre</Link><Link href="/compare/parties" className="text-link text-xs">Usporedi do četiri stranke ↗</Link></div>
      </form>
      {!parsed.success ? <p role="alert" className="surface p-5">Nevaljani filtri. Odaberite dostupne statuse i broj stranice.</p> : <section aria-label="Rezultati imenika">
        <p className="subtle mb-5">{matches.length} rezultata · abecedni redoslijed · stranica {selection.page} od {pages}. Evidencija izbora 2024. je djelomična; izostanak ne znači da stranka nije sudjelovala.</p>
        {entries.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{entries.map((party) => <PartyCard key={party.id} party={party} />)}</div> : <div className="surface"><EmptyState title="Nema rezultata za odabrane filtre" description="Promijenite pojam, status ili stranicu. Nedokumentirani statusi ne znače negativan rezultat." /></div>}
        <nav aria-label="Stranice imenika" className="mt-6 flex justify-between gap-4">{selection.page > 1 ? <Link href={pageUrl(selection.page - 1)} className="text-link text-sm">← Prethodna</Link> : <span />}{selection.page < pages && <Link href={pageUrl(selection.page + 1)} className="text-link text-sm">Sljedeća →</Link>}</nav>
      </section>}
    </>
  );
}
