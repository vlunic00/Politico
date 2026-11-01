import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { GovernmentComparison } from "@/components/government-comparison";
import { PartyComparison } from "@/components/party-comparison";

const comparisons = {
  parties: {
    title: "Usporedba političkih programa",
    description:
      "Jednaka struktura za svaku stranku, izvorne izjave i dokumentirani prijedlozi. Bez ocjena ili pobjednika.",
  },
  governments: {
    title: "Usporedba administracija",
    description:
      "Promjene kroz usporediva razdoblja, s europskim kontekstom i dokumentiranim granicama mandata.",
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
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { kind } = await params;
  const comparison = getComparison(kind);
  return (
    <>
      <PageHeading
        eyebrow="Usporedbe s kontekstom"
        title={comparison.title}
        description={comparison.description}
      />
      {kind === "governments" ? <GovernmentComparison query={await searchParams} /> : <PartyComparison query={await searchParams} />}
    </>
  );
}
