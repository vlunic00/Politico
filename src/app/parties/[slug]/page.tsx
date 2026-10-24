import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb, PageHeading } from "@/components/page-heading";
import { PartyProfile } from "@/components/party-profile";
import { parliamentaryParties } from "@/lib/politics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title:
      parliamentaryParties.find((party) => party.slug === slug)?.name ??
      "Predložak profila stranke",
  };
}
export const dynamicParams = false;
export function generateStaticParams() {
  return [
    { slug: "preview" },
    ...parliamentaryParties.map(({ slug }) => ({ slug })),
  ];
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = parliamentaryParties.find((party) => party.slug === slug);
  if (slug !== "preview" && !party) notFound();
  return (
    <>
      <Breadcrumb label={party?.abbreviation ?? "Predložak profila"} />
      <PageHeading
        eyebrow={
          party ? "Parlamentarna stranka · datirani izvori" : "Razvojni pregled"
        }
        title={party?.name ?? "Jednak prostor za svaku stranku"}
        description={
          party
            ? "Izvorni dokumenti, dostupne činjenice i jasno označene praznine u podacima."
            : "Pregled strukture profila. Ova stranica ne predstavlja postojeću političku stranku."
        }
      />
      <PartyProfile party={party} />
    </>
  );
}
