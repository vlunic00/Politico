import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Metodologija i ispravci" };

const rules = [
  [
    "Provjerljivo ili nedostupno",
    "Ne procjenjujemo nedostajuće podatke. Prazna vrijednost nije nula. Svaka objavljena vrijednost ima izravan izvor, jedinicu, referentno razdoblje i datum provjere. Nepoznat datum izvorne objave ostaje nepoznat i ne zamjenjuje se datumom preuzimanja.",
  ],
  [
    "Usporediva razdoblja i definicije",
    "Mjesečni, tromjesečni i godišnji pokazatelji ne opisuju isti trenutak. Usporedba zahtijeva jednake jedinice, geografije i definicije. Godišnja vrijednost može obuhvatiti mandate više vlada.",
  ],
  [
    "Promjena nije dokaz uzroka",
    "Opisujemo promjene tijekom mandata bez pripisivanja uzroka Vladi. Ne izrađujemo političke ocjene, ljestvice uspješnosti ili preporuke za glasovanje.",
  ],
  [
    "Jednaka pravila za sve stranke",
    "Registracija, parlamentarna zastupljenost i kandidatura vode se odvojeno. Ideološki opisi zahtijevaju dokumentiran izvor; neslaganja i neizvjesnost ostaju vidljivi.",
  ],
  [
    "Izvornik prije AI sažetka",
    "Službeni program ima prednost pred sažetkom. Budući AI sažeci moraju biti označeni, vezani uz verziju izvornika i odobreni ljudskom provjerom. Nenavedeni stavovi ostaju nenavedeni.",
  ],
  [
    "Revizije i kontinuitet",
    "Čuvamo izvorne snimke i revizije gdje licenca dopušta. Neuspješan ili prazan uvoz ne smije izbrisati prethodno validirane podatke. Sumnjive promjene čekaju pregled.",
  ],
];

export default function MethodologyPage() {
  return (
    <>
      <PageHeading
        eyebrow="Pravila observatorija"
        title="Kontekst prije zaključka"
        description="Kako prikazujemo javne podatke i čuvamo političku nepristranost."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {rules.map(([title, description], index) => (
          <section key={title} className="surface p-6">
            <span className="eyebrow text-primary">
              Načelo {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="section-title mt-4">{title}</h2>
            <p className="subtle mt-3">{description}</p>
          </section>
        ))}
      </div>
      <section className="surface mt-6 p-7">
        <h2 className="section-title">Dostupnost i ispravci</h2>
        <p className="subtle mt-3">
          Ovo je razvojna verzija. Politički pregled koristi ručno provjerene,
          datirane službene izvore, a nacionalne statističke serije i AI sažeci
          još nisu povezani. Parlamentarna evidencija nije cjelovit registar
          stranaka niti potvrda izborne kandidature. Javni kanal za prijavu
          ispravaka bit će objavljen prije javnog izdanja.
        </p>
        <p className="subtle mt-3">
          Tijekom razvoja prijavite uočeni problem održavatelju repozitorija i
          navedite poveznicu na stranicu te službeni izvor.
        </p>
        <div className="mt-5 flex flex-wrap gap-6">
          <Link href="/sources" className="text-link">
            Katalog izvora ↗
          </Link>
          <Link href="/preview" className="text-link">
            Razvojni pregled grafa ↗
          </Link>
        </div>
      </section>
    </>
  );
}
