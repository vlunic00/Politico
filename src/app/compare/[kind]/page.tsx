import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";

const comparisons = {
  parties: {
    title: "Usporedba političkih programa",
    description:
      "Jednaka struktura za svaku stranku, izvorne izjave i dokumentirani prijedlozi. Bez ocjena ili pobjednika.",
    empty: "Verificirani programi još nisu dostupni",
    note: "Usporedba do četiri stranke postaje dostupna nakon povezivanja službenog registra i programa u četvrtoj fazi.",
  },
  governments: {
    title: "Usporedba administracija",
    description:
      "Promjene kroz usporediva razdoblja, s europskim kontekstom i dokumentiranim granicama mandata.",
    empty: "Podaci za usporedbu još nisu povezani",
    note: "Povezivanje mandata i vremenskih serija planirano je u trećoj fazi. Promjena tijekom mandata ne dokazuje učinak politike.",
  },
};
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(comparisons).map((kind) => ({ kind }));
}

function getComparison(kind: string) {
  if (kind !== "parties" && kind !== "governments") notFound();
  return comparisons[kind];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  return { title: getComparison((await params).kind).title };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const comparison = getComparison((await params).kind);
  return (
    <>
      <PageHeading
        eyebrow="Usporedbe s kontekstom"
        title={comparison.title}
        description={comparison.description}
      />
      <section className="surface">
        <EmptyState title={comparison.empty} description={comparison.note} />
      </section>
    </>
  );
}
