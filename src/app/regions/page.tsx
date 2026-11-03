import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { RegionalExplorer } from "@/components/regional-explorer";

export const metadata: Metadata = { title: "Regionalni pregled" };

export const dynamic = "force-dynamic";
export default async function RegionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <PageHeading
        eyebrow="Županije i Grad Zagreb"
        title="Hrvatska izbliza"
        description="Regionalni pokazatelji s jasnim geografskim obuhvatom i usporedivim razdobljima."
      />
      <RegionalExplorer query={await searchParams} />
      <Link href="/topics/regions" className="text-link mt-6">
        Planirani regionalni pokazatelji ↗
      </Link>
    </>
  );
}
