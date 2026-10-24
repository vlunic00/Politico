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
import { PartyOverview } from "@/components/party-overview";
import { EmptyState } from "@/components/empty-state";
import { SourcePopover } from "@/components/source-popover";
import { getStatistics } from "@/lib/statistics/data";
import { formatDate } from "@/lib/statistics/series";
import {
  featuredIndicators,
  indicators,
  sources,
  topics,
} from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ indicator?: string; range?: string }> }) {
  const [statistics, selection] = await Promise.all([getStatistics(), searchParams]);
  const entries = Object.values(statistics.series);
  const selected = statistics.series[selection.indicator ?? "real-gdp-growth"];
  const selectedIndicator = indicators.find((i) => i.slug === selected?.slug);
  const latestCheck = entries.map((s) => s.source.checkedAt).filter((v): v is string => !!v).sort().at(-1);
  const hasImportIssue = statistics.runs.some((r) => r.status === "FAILED" || r.status === "NEEDS_REVIEW");
  const chartPoints = selected?.points.filter((point) => selection.range !== "5" || Number(point.period.slice(0, 4)) >= Number(selected.latest.periodStart.slice(0, 4)) - 4);
  return (
    <div className="space-y-9">
      <PageHeading
        eyebrow="Neovisan politički observatorij"
        title="Politička slika Hrvatske"
        description="Upoznajte Vladu, istražite političke stranke i stavite javne podatke u kontekst."
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
      <GovernmentProfile overview />
      <PartyOverview />
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-primary/15 bg-accent/60 px-5 py-4 text-xs leading-5 text-accent-foreground"
      >
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">
            {entries.length ? `${entries.length} pokazatelja s objavljenim opažanjima.` : statistics.status === "error" ? "Statistička baza privremeno nije dostupna." : "Nacionalni podaci još nisu povezani."}
          </strong>{" "}
          Prazne vrijednosti ne znače nulu. Najnovija uspješna provjera: {latestCheck ? formatDate(latestCheck) : "nije provedena"}.
          {hasImportIssue && " Dio novih uvoza nije objavljen; prikazujemo prethodno validirane podatke."}
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
              series={statistics.series[slug]}
            />
          ))}
        </div>
      </section>
      <div className="grid gap-6">
        <section className="surface min-w-0 p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Međunarodna perspektiva</p>
              <h2 className="section-title">Hrvatska i Europska unija</h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-[10px] text-muted-foreground">
              {selected ? selectedIndicator?.name : "Čeka povezivanje izvora"}
            </span>
          </div>
          <form action="/" className="mb-5 flex flex-wrap items-end gap-3 text-xs">
            <label className="flex min-w-0 flex-col gap-2">Pokazatelj
              <select aria-label="Pokazatelj" name="indicator" defaultValue={selected?.slug ?? "real-gdp-growth"} className="max-w-full rounded-lg border bg-white p-2">
                {indicators.filter((i) => statistics.series[i.slug] || i.slug === "real-gdp-growth").map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2">Vremenski raspon
              <select aria-label="Vremenski raspon" name="range" defaultValue={selection.range === "5" ? "5" : "all"} className="rounded-lg border bg-white p-2"><option value="all">Cijela serija</option><option value="5">Zadnjih 5 godina</option></select>
            </label>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white">Prikaži</button>
          </form>
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
          <MetricLineChart title={selectedIndicator?.name ?? "Usporedba Hrvatske i EU-a"} unit={selected?.unit ?? "%"} points={chartPoints} />
          {selected && !selected.eu && <p className="subtle mt-3">Nema usporedivih podataka za EU u posljednjem razdoblju.</p>}
          {selected && <div className="mt-4"><SourcePopover source={selected.source} /></div>}
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
            <TopicCard key={topic.slug} topic={topic} activeCount={indicators.filter((i) => i.topic === topic.slug && statistics.series[i.slug]).length} />
          ))}
        </div>
      </section>
      <div className="grid gap-6">
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
              Institucionalni izvori:{" "}
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
