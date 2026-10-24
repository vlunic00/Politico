import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { PartyCard } from "@/components/party-card";
import { parliamentaryParties, parliamentarySnapshot } from "@/lib/politics";

export const metadata: Metadata = { title: "Političke stranke" };

export default function PartiesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Politički krajolik"
        title="Imenik političkih stranaka"
        description="Registracija, parlamentarni status i izborna kandidatura različite su činjenice. Svaka zahtijeva vlastiti izvor."
      />
      <section aria-labelledby="parliamentary-directory">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="parliamentary-directory" className="section-title">
            Parlamentarne stranke · {parliamentaryParties.length}
          </h2>
          <span className="text-xs text-muted-foreground">
            Abecedni redoslijed
          </span>
        </div>
        <p className="subtle mb-6">
          Presjek Hrvatskoga sabora: {parliamentarySnapshot.dateLabel}. Udjeli
          se odnose na {parliamentarySnapshot.total} mandata u toj objavi i nisu
          stanje uživo.{" "}
          <a
            href={parliamentarySnapshot.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            Izvor i metodologija nazivnika
          </a>
          .
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parliamentaryParties
            .toSorted((a, b) => a.name.localeCompare(b.name, "hr"))
            .map((party) => (
              <PartyCard key={party.slug} party={party} />
            ))}
        </div>
      </section>
      <section className="surface mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
          <h2 className="section-title">Ostale registrirane stranke</h2>
          <span className="text-xs text-muted-foreground">
            Registar još nije povezan
          </span>
        </div>
        <EmptyState
          title="Službeni registar još nije povezan"
          description="Parlamentarni presjek nije cjelovit registar političkih stranaka. Izostanak stranke ovdje ne znači da nije registrirana."
        />
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          "Registracija",
          "Zastupljenost u Saboru",
          "Potvrđena izborna kandidatura",
        ].map((title) => (
          <section key={title} className="surface p-5">
            <p className="text-sm font-semibold">{title}</p>
            <p className="subtle mt-2 text-xs">
              Status se objavljuje samo uz odgovarajuću službenu evidenciju i
              datum provjere.
            </p>
          </section>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-6">
        <Link href="/parties/preview" className="text-link">
          Pregled predloška profila
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Link href="/compare/parties" className="text-link">
          Usporedba programa
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
