import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Database,
  Info,
  ShieldCheck,
} from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { MetricCard } from "@/components/metric-card";
import { MetricLineChart } from "@/components/metric-line-chart";
import { TopicCard } from "@/components/topic-card";
import { GovernmentProfile } from "@/components/government-profile";
import { EmptyState } from "@/components/empty-state";
import {
  featuredIndicators,
  indicators,
  sources,
  topics,
} from "@/lib/catalogue";

export default function HomePage() {
  return (
    <div className="space-y-9">
      <PageHeading
        eyebrow="Neovisan pregled javnih podataka"
        title="Hrvatska u brojkama"
        description="Gospodarstvo, društvo i politika — s jasnim izvorima i prostorom za širu sliku."
      >
        <Link
          href="/methodology"
          className="flex w-fit items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-xs font-medium"
        >
          <ShieldCheck size={15} aria-hidden="true" />
          Kako čitati podatke
          <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </PageHeading>
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-primary/15 bg-accent/60 px-5 py-4 text-xs leading-5 text-accent-foreground"
      >
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Razvojna verzija.</strong> Službeni
          podaci još nisu povezani. Prazne vrijednosti ne znače nulu. Posljednja
          provjera podataka: nije provedena.
        </p>
      </div>
      <section aria-labelledby="national-indicators">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 id="national-indicators" className="section-title">
              Nacionalni pokazatelji
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Svaki pokazatelj ima vlastito referentno razdoblje.
            </p>
          </div>
          <Link href="/topics" className="text-link text-xs">
            Svi pokazatelji
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredIndicators.map((slug) => (
            <MetricCard
              key={slug}
              indicator={
                indicators.find((indicator) => indicator.slug === slug)!
              }
            />
          ))}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <section className="surface min-w-0 p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Međunarodna perspektiva</p>
              <h2 className="section-title">Hrvatska i Europska unija</h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-[10px] text-muted-foreground">
              Čeka povezivanje izvora
            </span>
          </div>
          <div className="mb-4 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#263e49]" />
              Hrvatska
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#7d97aa]" />
              EU-27
            </span>
          </div>
          <MetricLineChart title="Usporedba Hrvatske i EU-a" unit="%" />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="max-w-sm text-[11px] leading-5 text-muted-foreground">
              Usporedbe koriste objavljene EU agregate i usklađene definicije.
            </p>
            <Link href="/preview" className="text-link text-xs">
              Primjer prikaza
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <GovernmentProfile compact />
      </div>
      <section aria-labelledby="explore-topics">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="explore-topics" className="section-title">
            Istražite po temama
          </h2>
          <Link href="/topics" className="text-link text-xs">
            Svih {topics.length} tema
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topics.slice(0, 8).map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface">
          <div className="flex items-center justify-between border-b p-6">
            <h2 className="section-title">Politički krajolik</h2>
            <Link href="/parties" className="text-link text-xs">
              Imenik stranaka
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <EmptyState
            title="Registar još nije povezan"
            description="Registrirane stranke, parlamentarne stranke i potvrđene izborne liste bit će prikazane kao odvojeni statusi."
            compact
          />
        </section>
        <section className="surface">
          <div className="flex items-center justify-between border-b p-6">
            <h2 className="section-title">Izborni pregled</h2>
            <Link href="/elections" className="text-link text-xs">
              Sve o izborima
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <EmptyState
            title="Datum izbora nije verificiran"
            description="Objavljujemo samo službeno potvrđene datume i kandidature. Bez prognoza i pretpostavljenih sudionika."
            compact
          />
        </section>
      </div>
      <section className="surface flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-secondary p-3 text-primary">
            <Database size={22} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Podaci s adresom izvora</h2>
            <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
              Planirani izvori:{" "}
              {sources
                .slice(0, 4)
                .map((source) => source.shortName)
                .join(", ")}{" "}
              i druge javne institucije. Svaka objavljena vrijednost mora biti
              provjerljiva.
            </p>
          </div>
        </div>
        <Link href="/sources" className="text-link shrink-0 text-xs">
          Katalog izvora
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
