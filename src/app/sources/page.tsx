import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { sources } from "@/lib/catalogue";
import { indicators } from "@/lib/catalogue";
import { getStatistics } from "@/lib/statistics/data";
import { datasetUrl, seriesDefinitions } from "@/lib/statistics/definitions";
import { formatDate } from "@/lib/statistics/series";
import { governments, governmentVerificationDate } from "@/lib/governments";
import {
  parliamentarySnapshot,
  politicalVerificationDate,
  portraits,
} from "@/lib/politics";

export const metadata: Metadata = { title: "Katalog izvora" };

export const dynamic = "force-dynamic";
export default async function SourcesPage() {
  const { series, runs } = await getStatistics();
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
                {Object.values(series).some((s) => s.source.name === source.name) ? "Povezano" : "Nije povezano"}
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
                Posljednja uspješna provjera: {formatDate(Object.values(series).filter((s) => s.source.name === source.name).map((s) => s.source.checkedAt).filter((v): v is string => !!v).sort().at(-1))}
              </span>
            </div>
          </article>
        ))}
      </div>
      <section className="surface mt-6 p-6">
        <h2 className="section-title">Statistički skupovi i stanje uvoza</h2>
        <p className="subtle mt-3">Datum objave, ažuriranje izvora i uspješna provjera prikazuju se odvojeno. Neuspješan uvoz ili pregled ne mijenja prethodno objavljenu seriju.</p>
        <ul className="mt-4 divide-y">
          {seriesDefinitions.map((def) => {
            const run = runs.find((r) => r.id === `${def.source}:${def.slug}`);
            return <li key={def.slug} className="flex flex-wrap justify-between gap-3 py-4 text-xs">
              <div><a href={datasetUrl(def)} className="text-link" target="_blank" rel="noreferrer">{indicators.find((i) => i.slug === def.slug)?.name} ↗</a>
                <p className="mt-1 break-words text-muted-foreground">{def.source === "dzs" ? "DZS" : "Eurostat"} · {def.dataset}</p></div>
              <p className="text-muted-foreground">{run?.status === "NEEDS_REVIEW" ? "Novi uvoz čeka pregled" : run?.status === "FAILED" ? "Posljednji uvoz nije uspio" : series[def.slug] ? "Objavljeno" : "Nije uvezeno"} · {formatDate(run?.finishedAt)}</p>
            </li>;
          })}
        </ul>
      </section>
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
      <section id="governments" className="surface mt-6 p-6">
        <h2 className="section-title">Mandati, koalicije i programi vlada</h2>
        <p className="subtle mt-3">Provjereno {formatDate(governmentVerificationDate)}. Mandati su zasebni i uključuju tehničko obnašanje dužnosti do primopredaje. Koalicijske evidencije razlikuju stranke, saveze i parlamentarnu podršku. Pojedini događaji i njihovi izvori dostupni su na vremenskoj crti.</p>
        <ul className="mt-4 divide-y">{governments.map((government) => <li key={government.id} className="flex flex-wrap items-center justify-between gap-4 py-4 text-xs">
          <a href={`/government/history#${government.id}`} className="text-link">{government.name}</a>
          <div className="flex flex-wrap gap-4"><a href={government.sourceUrl} className="text-link" target="_blank" rel="noreferrer">Službeni mandat ↗</a><a href={government.programUrl} className="text-link" target="_blank" rel="noreferrer">Izvorni program ↗</a></div>
        </li>)}</ul>
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
