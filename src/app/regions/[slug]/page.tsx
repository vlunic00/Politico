import Link from "next/link";
import { notFound } from "next/navigation";
import { counties } from "@/lib/regions/catalogue";
import { PageHeading } from "@/components/page-heading";
import { RegionalExplorer } from "@/components/regional-explorer";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: counties.find((county) => county.slug === slug)?.name ?? "Županija nije pronađena" }; }
export default async function CountyPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const county = counties.find((county) => county.slug === slug);
  if (!county) notFound();
  return <><PageHeading eyebrow="Županijski profil" title={county.name} description="Objavljeni županijski podaci, povijest i nacionalna referenca za istu definiciju." /><Link className="text-link mb-5 text-sm" href="/regions">← Sve županije i usporedba</Link><RegionalExplorer query={await searchParams} profile={county} /></>;
}
