import { Building2 } from "lucide-react";
import { EmptyState } from "./empty-state";
import { LeaderPortrait } from "./leader-portrait";
import {
  formatSeatShare,
  parliamentarySnapshot,
} from "@/lib/politics";
import { partyElectionRecords, registerCatalogueUrl, registrationLabel, type DirectoryParty } from "@/lib/parties/catalogue";
import { isGovernmentParty } from "@/lib/parties/directory";
import { formatDate } from "@/lib/statistics/series";
import { PartyPrograms } from "./party-programs";
import Link from "next/link";

export function PartyProfile({ party, registryCheckedAt }: { party?: DirectoryParty; registryCheckedAt?: string | null }) {
  const fields = [
    ["Registracijski status", registrationLabel(party?.registration?.status)],
    [
      "Vodstvo",
      party?.leaders
        ?.map((leader) => `${leader.name} (${leader.role})`)
        .join(", ") ?? "Nije verificirano",
    ],
    [
      "Parlamentarni status",
      typeof party?.seats === "number" ? "Zastupljena u datiranom presjeku" : "Nije u datiranom presjeku; današnji status nije potvrđen",
    ],
    ["Sudjelovanje u Vladi", party && isGovernmentParty(party.id) ? "Potvrđena koalicijska suradnja · datirani izvori" : "Nije zasebno verificirano"],
    [
      "Politička orijentacija",
      party?.orientation
        ? `${party.orientation.label} · samoodređenje`
        : "Nije verificirano",
    ],
    ["Kandidatura · sljedeći parlamentarni izbori", "Nije verificirano"],
  ];
  return (
    <div className="space-y-6">
      {party && <section className="surface p-5"><h3 className="section-title">Financiranje i javna odgovornost</h3><p className="subtle mt-2">Povijesne državne isplate i dostupni službeni izvori prikazani su u zasebnom dosjeu. Izostanak iz tablice ne znači da su prihodi nula ili da stranka nije djelovala.</p><Link className="text-link mt-3 text-xs" href="/accountability#financing">Pregled financiranja i obuhvata ↗</Link></section>}
      <section className="surface grid overflow-hidden md:grid-cols-[1.4fr_1fr]">
        <div className="p-7 sm:p-10">
          <p className="eyebrow mb-3">
            {party
              ? `${party.abbreviation} · ${party.registration ? "službeni registar" : "parlamentarna evidencija"}`
              : "Razvojni predložak · nije zapis iz registra"}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {party?.name ?? "Profil političke stranke"}
          </h2>
          <p className="subtle mt-3">
            {typeof party?.seats === "number"
              ? `U saborskom presjeku od ${parliamentarySnapshot.dateLabel} evidentirano je ${party.seats} mandata (${formatSeatShare(party.seats)} od ${parliamentarySnapshot.total}). To nije stanje uživo niti potvrda registracije ili kandidature.`
              : party?.registration ? "Identitet i registracijski status prema službenom registru. Registracija ne potvrđuje parlamentarni mandat, sudjelovanje u Vladi ili izbornu kandidaturu." : "Naziv, kratica i službeni sažetak prikazat će se nakon uvoza i provjere registra."}
          </p>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          {party?.website ? <a href={party.website} className="text-link mt-6 text-xs" target="_blank" rel="noreferrer">Službena stranica ↗</a> : <p className="subtle mt-6">Službena mrežna stranica nije zasebno verificirana.</p>}
        </div>
        <div className="relative flex min-h-72 items-center justify-center overflow-hidden bg-linear-to-br from-accent via-background to-white">
          {party?.leaders ? (
            <div
              className={`absolute inset-0 grid ${party.leaders.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {party.leaders.map((leader) => (
                <div key={leader.name} className="relative overflow-hidden">
                  <LeaderPortrait portrait={leader.portrait} />
                </div>
              ))}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/50 to-transparent"
              />
            </div>
          ) : (
            <>
              <Building2
                size={96}
                strokeWidth={0.65}
                aria-hidden="true"
                className="text-primary/35"
              />
              <span className="sr-only">
                Neutralni grafički prikaz bez stranačkih fotografija ili
                logotipa
              </span>
            </>
          )}
        </div>
      </section>
      {party?.registration && <section className="surface p-6">
        <h3 className="section-title">Podaci službenog registra</h3>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{[
          ["Naziv u registru", party.registration.name], ["Kratica u registru", party.registration.abbreviation ?? "Nije navedena"],
          ["Registarski broj / knjiga", `${party.registration.registerNumber} / ${party.registration.book}`],
          ["Datum upisa", formatDate(party.registration.registeredAt)], ["Datum promjene statusa", formatDate(party.registration.statusDate)],
          ["Sjedište", party.registration.seat ?? "Nije navedeno"],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl>
        <p className="subtle mt-4">Provjera registra: {formatDate(registryCheckedAt)}. Status i datumi prikazani su zasebno; nepoznat datum nije datum preuzimanja.</p>
        <a href={registerCatalogueUrl} className="text-link mt-3 text-xs" target="_blank" rel="noreferrer">Izvor registra · Otvorena dozvola RH ↗</a>
      </section>}
      {party && (typeof party.seats === "number" || party.leaders || party.orientation) && (
        <section className="surface p-6">
          <h3 className="section-title">Izvori profila</h3>
          <div className="mt-4 flex flex-wrap gap-5 text-xs">
            {typeof party.seats === "number" && <a
              href={parliamentarySnapshot.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-link text-xs"
            >
              Hrvatski sabor · mandati ↗
            </a>}
            {isGovernmentParty(party.id) && <a href="/government/history#plenkovic-3" className="text-link">Izvori koalicijske suradnje ↗</a>}
            {party.leadershipSource && (
              <a
                href={party.leadershipSource}
                target="_blank"
                rel="noreferrer"
                className="text-link text-xs"
              >
                Službeni izvor vodstva ↗
              </a>
            )}
            {party.orientation && (
              <a
                href={party.orientation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-link text-xs"
              >
                Izvor samoodređenja ↗
              </a>
            )}
            <a href="/sources#portraits" className="text-link text-xs">
              Fotografije i licence ↗
            </a>
          </div>
          <p className="subtle mt-4 text-xs">
            Parlamentarni presjek i dostupni podaci o vodstvu i orijentaciji:
            provjera 24. listopada 2026. Registar i koalicija imaju zasebne datirane izvore.
          </p>
        </section>
      )}
      <PartyPrograms party={party} />
      <section className="surface p-6">
        <h3 className="section-title">Izborna evidencija</h3>
        <p className="subtle mt-3">Sljedeći parlamentarni izbori: sudjelovanje nije verificirano. Povijesna lista nije potvrda buduće kandidature.</p>
        {party && <details className="mt-4"><summary className="cursor-pointer text-sm text-primary underline underline-offset-4">Verificirane povijesne kandidacijske liste i predlagatelji</summary>{(party.electionRecords ?? partyElectionRecords.filter((record) => record.partyId === party.id)).map((record, index) => <p key={index} className="subtle mt-3">{record.description}{" "}<a href={record.sourceUrl} className="text-link text-xs" target="_blank" rel="noreferrer">DIP · izvor ↗</a>{"electionId" in record && typeof record.electionId === "string" && <Link href={`/elections/${record.electionId}`} className="text-link ml-3 text-xs">Pregled izbora ↗</Link>}</p>)}</details>}
        <p className="subtle mt-3">Evidencija je djelomična. Glasovi i mandati koalicijske liste ne pripisuju se pojedinačnoj stranci; potpuna izborna povijest još nije povezana.</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          [
            "Parlamentarni rad i financije",
            "Podaci će biti dostupni uz službene dokumente i referentno razdoblje.",
          ],
        ].map(([title, description]) => (
          <section key={title} className="surface">
            <h3 className="section-title border-b px-6 py-5">{title}</h3>
            <EmptyState
              title="Nema verificiranih podataka"
              description={description}
              compact
            />
          </section>
        ))}
      </div>
      <p className="subtle">
        Sve stranke koriste isti predložak i jednaka pravila prikaza. AI sažeci
        objavljuju se samo uz izvore i ljudsku provjeru.
      </p>
    </div>
  );
}
