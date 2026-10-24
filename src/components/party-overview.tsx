import Link from "next/link";
import { ArrowRight, MoveHorizontal } from "lucide-react";
import { parliamentaryParties, parliamentarySnapshot } from "@/lib/politics";
import { PartyCard } from "./party-card";

export function PartyOverview() {
  const parties = parliamentaryParties.filter((party) => party.slug !== "hdz");
  return (
    <section aria-labelledby="political-parties">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Ljudi i političke opcije</p>
          <h2 id="political-parties" className="section-title">
            Ostale parlamentarne stranke
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
            {parties.length} stranaka iz službenog presjeka Sabora. Uključuje i
            druge sudionike Vlade; popis ne označava oporbu.
          </p>
        </div>
        <Link href="/parties" className="text-link text-xs">
          Sve stranke u presjeku
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <p>
          Presjek:{" "}
          <time dateTime={parliamentarySnapshot.date}>
            {parliamentarySnapshot.dateLabel}
          </time>{" "}
          · nije stanje uživo
        </p>
        <span className="flex items-center gap-2">
          <MoveHorizontal size={14} aria-hidden="true" />
          Pomičite za više stranaka
        </span>
      </div>
      <ul
        aria-label="Kartice parlamentarnih stranaka"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl pb-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        {parties.map((party) => (
          <li
            key={party.slug}
            className="w-[min(290px,85vw)] shrink-0 snap-start"
          >
            <PartyCard party={party} />
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
        <a
          href={parliamentarySnapshot.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          Izvor: Hrvatski sabor
        </a>{" "}
        · Nazivnik je {parliamentarySnapshot.total} mandata iz objave,
        uključujući {parliamentarySnapshot.independentSeats} nezavisnih
        zastupnika. Cjelovit registar neparlamentarnih stranaka još nije
        povezan.{" "}
        <Link
          href="/sources#portraits"
          className="underline underline-offset-4"
        >
          Fotografije i licence
        </Link>
      </p>
    </section>
  );
}
