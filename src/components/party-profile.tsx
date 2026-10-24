import { Building2 } from "lucide-react";
import { EmptyState } from "./empty-state";

export function PartyProfile() {
  return (
    <div className="space-y-6">
      <section className="surface grid overflow-hidden md:grid-cols-[1.4fr_1fr]">
        <div className="p-7 sm:p-10">
          <p className="eyebrow mb-3">
            Razvojni predložak · nije zapis iz registra
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Profil političke stranke
          </h2>
          <p className="subtle mt-3">
            Naziv, kratica i službeni sažetak prikazat će se nakon uvoza i
            provjere registra.
          </p>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              "Registracijski status",
              "Vodstvo",
              "Parlamentarni status",
              "Sudjelovanje u Vladi",
              "Politička orijentacija",
              "Potvrđena kandidatura",
            ].map((label) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">Nije verificirano</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex min-h-52 items-center justify-center bg-linear-to-br from-accent via-background to-white">
          <Building2
            size={96}
            strokeWidth={0.65}
            aria-hidden="true"
            className="text-primary/35"
          />
          <span className="sr-only">
            Neutralni grafički prikaz bez stranačkih fotografija ili logotipa
          </span>
        </div>
      </section>
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
