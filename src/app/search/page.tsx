import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { searchCatalogue } from "@/lib/search";

export const metadata: Metadata = { title: "Pretraživanje" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").slice(0, 200).trim();
  const results = searchCatalogue(query);
  return (
    <>
      <PageHeading
        eyebrow="Pretraživanje kataloga"
        title={query ? `Rezultati za „${query}”` : "Što želite istražiti?"}
        description="Pretražite planirane pokazatelje, teme i institucionalne izvore. Pretraga podržava hrvatske dijakritičke znakove."
      />
      {results.length ? (
        <div className="surface divide-y">
          {results.map((result) => (
            <Link
              key={result.href}
              href={result.href}
              className="flex items-start justify-between gap-4 p-6 hover:bg-accent/30"
            >
              <div>
                <p className="eyebrow mb-2">{result.type}</p>
                <h2 className="text-sm font-semibold">{result.title}</h2>
                <p className="subtle mt-1 text-xs">{result.description}</p>
              </div>
              <ArrowUpRight
                size={17}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      ) : (
        <section className="surface">
          <EmptyState
            title={query ? "Nema rezultata" : "Upišite pojam u pretragu"}
            description="Pokušajte naziv teme, pokazatelja ili institucije, primjerice plaće, demografija ili DZS."
          />
        </section>
      )}
    </>
  );
}
