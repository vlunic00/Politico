import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb, PageHeading } from "@/components/page-heading";
import { PartyProfile } from "@/components/party-profile";

export const metadata: Metadata = { title: "Predložak profila stranke" };
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ slug: "preview" }];
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "preview") notFound();
  return (
    <>
      <Breadcrumb label="Predložak profila" />
      <PageHeading
        eyebrow="Razvojni pregled"
        title="Jednak prostor za svaku stranku"
        description="Pregled strukture profila. Ova stranica ne predstavlja postojeću političku stranku."
      />
      <PartyProfile />
    </>
  );
}
