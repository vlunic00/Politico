import { Building2 } from "lucide-react";
import { EmptyState } from "./empty-state";
import { LeaderPortrait } from "./leader-portrait";
import {
  formatSeatShare,
  parliamentarySnapshot,
  type ParliamentaryParty,
} from "@/lib/politics";

export function PartyProfile({ party }: { party?: ParliamentaryParty }) {
  const fields = [
    ["Registracijski status", "Nije verificirano"],
    [
      "Vodstvo",
      party?.leaders
        ?.map((leader) => `${leader.name} (${leader.role})`)
        .join(", ") ?? "Nije verificirano",
    ],
    [
      "Parlamentarni status",
      party ? "Zastupljena u datiranom presjeku" : "Nije verificirano",
    ],
    ["Sudjelovanje u Vladi", "Nije verificirano"],
    [
      "Politička orijentacija",
      party?.orientation
        ? `${party.orientation.label} · samoodređenje`
        : "Nije verificirano",
    ],
    ["Potvrđena kandidatura", "Nije verificirano"],
  ];
  return (
    <div className="space-y-6">
      <section className="surface grid overflow-hidden md:grid-cols-[1.4fr_1fr]">
        <div className="p-7 sm:p-10">
          <p className="eyebrow mb-3">
            {party
              ? `${party.abbreviation} · parlamentarna evidencija`
              : "Razvojni predložak · nije zapis iz registra"}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {party?.name ?? "Profil političke stranke"}
          </h2>
          <p className="subtle mt-3">
            {party
              ? `U saborskom presjeku od ${parliamentarySnapshot.dateLabel} evidentirano je ${party.seats} mandata (${formatSeatShare(party.seats)} od ${parliamentarySnapshot.total}). To nije stanje uživo niti potvrda registracije ili kandidature.`
              : "Naziv, kratica i službeni sažetak prikazat će se nakon uvoza i provjere registra."}
          </p>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
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
      {party && (
        <section className="surface p-6">
          <h3 className="section-title">Izvori profila</h3>
          <div className="mt-4 flex flex-wrap gap-5 text-xs">
            <a
              href={parliamentarySnapshot.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-link text-xs"
            >
              Hrvatski sabor · mandati ↗
            </a>
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
            Provjera izvora: 24. listopada 2026. Nedokumentirani statusi i
            stavovi ostaju nedostupni.
          </p>
        </section>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          [
            "Službeni program",
            "Verificirani program nije dostupan. Poveznica na izvornik bit će istaknuta prije sažetka.",
          ],
          [
            "Političke pozicije",
            "Nema verificiranog dokumenta za analizu. Stavovi se ne zaključuju iz naziva ili općih pretpostavki.",
          ],
          [
            "Izborna povijest",
            "Rezultati, koalicije i zastupnička mjesta još nisu povezani sa službenim evidencijama.",
          ],
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
