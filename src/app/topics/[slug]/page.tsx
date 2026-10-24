import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, PageHeading } from "@/components/page-heading";
import { MetricLineChart } from "@/components/metric-line-chart";
import { SourcePopover } from "@/components/source-popover";
import { frequencyLabels, indicators, topics } from "@/lib/catalogue";
import { getStatistics } from "@/lib/statistics/data";
import { formatDate, formatNumber, formatPeriod } from "@/lib/statistics/series";

export function generateStaticParams() {
  return topics.map(({ slug }) => ({ slug }));
}
export const dynamicParams = false;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title:
      topics.find((topic) => topic.slug === slug)?.name ??
      "Tema nije pronađena",
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) notFound();
  const statistics = await getStatistics();
  const entries = indicators.filter(
    (indicator) => indicator.topic === topic.slug,
  );
  return (
    <>
      <Breadcrumb label={topic.name} />
      <PageHeading
        eyebrow="Statistička tema"
        title={topic.name}
        description={topic.description}
      />
      <div className="mb-7 flex flex-wrap gap-2">
        {entries.map((indicator) => (
          <a
            key={indicator.slug}
            href={`#${indicator.slug}`}
            className="rounded-full border bg-white px-4 py-2 text-xs text-primary hover:bg-accent"
          >
            {indicator.name}
          </a>
        ))}
      </div>
      <div className="space-y-6">
        {entries.map((indicator) => {
          const series = statistics.series[indicator.slug];
          return (
          <article
            id={indicator.slug}
            key={indicator.slug}
            className="surface p-5 sm:p-7"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="section-title">{indicator.name}</h2>
                <p className="subtle mt-2 max-w-2xl">{series?.definition ?? indicator.description}</p>
              </div>
              <Badge variant="secondary">{series ? "Objavljena serija" : "Čeka provjeru"}</Badge>
            </div>
            <dl className="mb-6 grid gap-4 rounded-xl bg-background p-4 text-xs sm:grid-cols-4">
              {[
                ["Jedinica", series?.unit ?? indicator.unit],
                ["Učestalost", frequencyLabels[indicator.frequency]],
                ["Obuhvat", series ? (series.eu ? "Hrvatska · EU-27" : "Hrvatska; EU nije usporediv") : "Hrvatska · EU nakon provjere"],
                ["Referentno razdoblje", series ? formatPeriod(series.latest.periodStart, series.frequency, series.slug) : "Nije dostupno"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {series && <div className="mb-5 space-y-2 text-sm">
              <p className="text-2xl font-semibold">{formatNumber(series.latest.value)} <span className="text-sm font-normal">{series.unit}</span></p>
              <p>{series.change ? `${series.change.value > 0 ? "+" : ""}${formatNumber(series.change.value)} ${series.change.unit} prema ${series.change.baseline}` : "Promjena nije usporediva"}</p>
              <p className="subtle">Posljednja uspješna provjera: {formatDate(series.source.checkedAt)}. Preuzeto: {formatDate(series.source.retrievedAt)}.</p>
              <p className="subtle">{series.limitations}</p>
              {!series.eu && <p className="subtle">Nema usporedivih podataka za EU u posljednjem razdoblju.</p>}
            </div>}
            <MetricLineChart title={indicator.name} unit={series?.unit ?? indicator.unit} points={series?.points} />
            {series && <p className="subtle mt-4">Oznake izvora: p = privremeno, e = procjena, r = revidirano, b = prekid serije, d = različita definicija. Ostale oznake pogledajte u izvornom skupu. Promjena se uspoređuje s istim razdobljem prethodne godine; p. b. znači postotni bod. Preko označenog prekida ne računamo promjenu.</p>}
            <div className="mt-5 border-t pt-4">
              <SourcePopover source={series?.source} />
            </div>
          </article>
        ); })}
      </div>
    </>
  );
}
