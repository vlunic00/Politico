import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { sources } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Katalog izvora" };

export default function SourcesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Transparentnost"
        title="Svaka činjenica ima izvor"
        description="Institucije iz razvojnog plana. Uvrštavanje u katalog ne znači da je njihova integracija završena."
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
      <p className="subtle mt-6">
        Uz svaki budući skup podataka navodimo identifikator, metodologiju,
        licencu, datum preuzimanja i reviziju. Poveznica na početnu stranicu
        institucije nije zamjena za izvor pojedine vrijednosti.
      </p>
    </>
  );
}
