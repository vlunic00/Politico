import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { TopicCard } from "@/components/topic-card";
import { indicators, topics } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Statističke teme" };

export default function TopicsPage() {
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
          [indicators.length, "planirana pokazatelja"],
          [0, "verificiranih serija"],
        ].map(([value, label]) => (
          <div key={label} className="surface flex items-baseline gap-3 p-5">
            <span className="text-2xl font-semibold">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic) => (
          <TopicCard key={topic.slug} topic={topic} />
        ))}
      </div>
      <p className="subtle mt-6">
        Katalog je plan pokrivenosti. Sve definicije čekaju provjeru skupova
        podataka; nijedna brojčana serija još nije objavljena.
      </p>
    </>
  );
}
