import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { sources } from "@/lib/catalogue";
import {
  parliamentarySnapshot,
  politicalVerificationDate,
  portraits,
} from "@/lib/politics";

export const metadata: Metadata = { title: "Katalog izvora" };

export default function SourcesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Transparentnost"
        title="Svaka činjenica ima izvor"
        description="Službeni izvori, datirani politički presjeci i licence fotografija. Uvrštavanje institucije u katalog ne znači da je automatska integracija završena."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <article
            id={source.id}
            key={source.id}
            className="surface flex flex-col p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-primary">
                {source.shortName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Nije povezano
              </span>
            </div>
            <h2 className="section-title">{source.name}</h2>
            <p className="subtle mt-2 flex-1">{source.description}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-link text-xs"
              >
                Službena stranica
                <ExternalLink size={13} aria-hidden="true" />
              </a>
              <span className="text-[11px] text-muted-foreground">
                Posljednji uvoz: nije proveden
              </span>
            </div>
          </article>
        ))}
      </div>
      <section className="surface mt-6 p-6">
        <h2 className="section-title">Politički presjek</h2>
        <p className="subtle mt-3">
          Mandati i udjeli potječu iz{" "}
          <a
            href={parliamentarySnapshot.sourceUrl}
            className="text-primary underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            statističke objave Hrvatskoga sabora
          </a>{" "}
          od {parliamentarySnapshot.dateLabel}. Nazivnik je{" "}
          {parliamentarySnapshot.total} mandata, od kojih je{" "}
          {parliamentarySnapshot.independentSeats} nezavisnih. Podaci su ručno
          provjereni{" "}
          <time dateTime={politicalVerificationDate}>24. listopada 2026.</time>;
          ne ažuriraju se automatski. Izvori za pojedina vodstva i samoodređenja
          dostupni su na profilima stranaka.
        </p>
      </section>
      <section id="portraits" className="surface mt-6 p-6">
        <h2 className="section-title">Fotografije i licence</h2>
        <p className="subtle mt-3">
          Portreti su pohranjeni lokalno. Prikaz je prilagođen veličinom,
          izrezom i gradijentom; prikazane osobe i autori ne podržavaju ovaj
          projekt samim korištenjem fotografije.
        </p>
        <ul className="mt-5 divide-y">
          {Object.values(portraits).map((portrait) => (
            <li
              key={portrait.src}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <h3 className="text-sm font-medium">{portrait.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  © {portrait.credit}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <a
                  href={portrait.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link text-xs"
                >
                  Izvor fotografije ↗
                </a>
                <a
                  href={portrait.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link text-xs"
                >
                  {portrait.license} ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <p className="subtle mt-6">
        Uz svaki budući skup podataka navodimo identifikator, metodologiju,
        licencu, datum preuzimanja i reviziju. Poveznica na početnu stranicu
        institucije nije zamjena za izvor pojedine vrijednosti.
      </p>
    </>
  );
}
