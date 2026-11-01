import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { GovernmentProfile } from "@/components/government-profile";

export const metadata: Metadata = { title: "Vlada Republike Hrvatske" };

export default function GovernmentPage() {
  return (
    <>
      <PageHeading
        eyebrow="Institucije i mandati"
        title="Vlada Republike Hrvatske"
        description="Sastav, program i povijest administracija uz službenu dokumentaciju."
      />
      <div className="space-y-6">
        <GovernmentProfile />
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="surface p-7">
            <p className="eyebrow mb-3">Kako tumačimo mandate</p>
            <h2 className="section-title">
              Administracija ima svoj vremenski okvir
            </h2>
            <p className="subtle mt-4">
              Svaki mandat vodimo zasebno, s datumima, koalicijskim promjenama i
              dokumentima koji ih potvrđuju. Politička stranka i Vlada nisu ista
              jedinica usporedbe.
            </p>
            <p className="subtle mt-4">
              Promjena pokazatelja tijekom mandata sama po sebi ne dokazuje da
              ju je Vlada uzrokovala.
            </p>
            <Link href="/compare/governments" className="text-link mt-6">
              Usporedba mandata
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
          <section className="surface p-7">
            <h2 className="section-title">Primarni izvori</h2>
            <div className="mt-4 flex flex-col items-start gap-3">
              <a
                className="text-link"
                href="https://vlada.gov.hr/"
                target="_blank"
                rel="noreferrer"
              >
                Vlada Republike Hrvatske ↗
              </a>
              <a
                className="text-link"
                href="https://www.sabor.hr/"
                target="_blank"
                rel="noreferrer"
              >
                Hrvatski sabor ↗
              </a>
            </div>
            <p className="subtle mt-4">
              Poveznice vode na institucije. Datirani mandati i koalicijske promjene
              s izvorima dostupni su na vremenskoj crti administracija.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
