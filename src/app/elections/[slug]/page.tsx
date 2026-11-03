import Link from "next/link";
import { notFound } from "next/navigation";
import { getElections } from "@/lib/elections/data";
import { elections } from "@/lib/elections/catalogue";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { ElectionResults } from "@/components/election-results";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: elections.find((election) => election.id === slug)?.title ?? "Izbori nisu pronađeni" }; }
export default async function ElectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const definition = elections.find((election) => election.id === slug);
  if (!definition) notFound();
  const data = await getElections();
  const election = data.records.find((election) => election.id === slug);
  return <><PageHeading eyebrow="Izborni pregled · službeni izvori" title={definition.title} description="Kandidacijske liste, izborni obuhvat, glasovi i službeno potvrđeni mandati." /><Link href="/elections" className="text-link mb-5 text-sm">← Povijest izbora</Link>{election ? <ElectionResults election={election} query={await searchParams} /> : <section className="surface"><EmptyState title="Izborni podaci nisu dostupni" description="Izbori su u katalogu izvora, ali nema dostupnog verificiranog uvoza. Ne prikazujemo zamjenske rezultate." /></section>}</>;
}
