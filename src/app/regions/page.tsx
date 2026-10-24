import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Regionalni pregled" };

export default function RegionsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Županije i Grad Zagreb"
        title="Hrvatska izbliza"
        description="Regionalni pokazatelji s jasnim geografskim obuhvatom i usporedivim razdobljima."
      />
      <section className="surface">
        <EmptyState
          title="Regionalni podaci još nisu dostupni"
          description="Profili i karta županija planirani su u šestoj fazi. Nedostajuće županijske podatke ne zamjenjujemo nacionalnim prosjekom."
        />
      </section>
      <Link href="/topics/regions" className="text-link mt-6">
        Planirani regionalni pokazatelji ↗
      </Link>
    </>
  );
}
