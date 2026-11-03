import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { TopicCard } from "@/components/topic-card";
import { indicators, topics } from "@/lib/catalogue";
import { getStatistics } from "@/lib/statistics/data";
import { getRegionalStatistics } from "@/lib/regions/data";

export const metadata: Metadata = { title: "Statističke teme" };

export const dynamic = "force-dynamic";
export default async function TopicsPage() {
  const { series } = await getStatistics();
  const regional = await getRegionalStatistics();
  const active = { ...series, ...regional.series };
  return (
    <>
      <PageHeading
        eyebrow="Katalog pokazatelja"
        title="Šira slika, temu po temu"
        description="Od gospodarstva do regionalnog razvoja. Definicije i dostupnost podataka na jednom mjestu."
      />
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        {[
          [topics.length, "statističkih tema"],
          [indicators.length, "pokazatelja u katalogu"],
          [Object.keys(active).length, "verificiranih serija"],
        ].map(([value, label]) => (
          <div key={label} className="surface flex items-baseline gap-3 p-5">
            <span className="text-2xl font-semibold">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic) => (
          <TopicCard key={topic.slug} topic={topic} activeCount={indicators.filter((i) => i.topic === topic.slug && active[i.slug]).length} />
        ))}
      </div>
      <p className="subtle mt-6">
        Aktivne serije imaju objavljena i validirana opažanja. Preostali pokazatelji čekaju provjeru izvora; nedostupna vrijednost nije nula.
      </p>
    </>
  );
}
