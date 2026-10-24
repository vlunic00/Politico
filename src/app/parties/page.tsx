import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Političke stranke" };

export default function PartiesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Politički krajolik"
        title="Imenik političkih stranaka"
        description="Registracija, parlamentarni status i izborna kandidatura različite su činjenice. Svaka zahtijeva vlastiti izvor."
      />
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
          <h2 className="section-title">Sve registrirane stranke</h2>
          <span className="text-xs text-muted-foreground">
            0 verificiranih zapisa
          </span>
        </div>
        <EmptyState
          title="Službeni registar još nije povezan"
          description="Imenik se popunjava službenim podacima u četvrtoj fazi. Izostanak zapisa ovdje ne znači da stranka nije registrirana."
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
