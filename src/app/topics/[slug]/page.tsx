import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, PageHeading } from "@/components/page-heading";
import { MetricLineChart } from "@/components/metric-line-chart";
import { SourcePopover } from "@/components/source-popover";
import { frequencyLabels, indicators, topics } from "@/lib/catalogue";

export function generateStaticParams() {
  return topics.map(({ slug }) => ({ slug }));
}
export const dynamicParams = false;

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
        {entries.map((indicator) => (
          <article
            id={indicator.slug}
            key={indicator.slug}
            className="surface p-5 sm:p-7"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="section-title">{indicator.name}</h2>
                <p className="subtle mt-2 max-w-2xl">{indicator.description}</p>
              </div>
              <Badge variant="secondary">Čeka provjeru</Badge>
            </div>
            <dl className="mb-6 grid gap-4 rounded-xl bg-background p-4 text-xs sm:grid-cols-4">
              {[
                ["Jedinica", indicator.unit],
                ["Učestalost", frequencyLabels[indicator.frequency]],
                ["Obuhvat", "Hrvatska · EU nakon provjere"],
                ["Referentno razdoblje", "Nije dostupno"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <MetricLineChart title={indicator.name} unit={indicator.unit} />
            <div className="mt-5 border-t pt-4">
              <SourcePopover />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
