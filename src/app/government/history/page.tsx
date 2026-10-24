import type { Metadata } from "next";
import { Breadcrumb, PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Povijest administracija" };

export default function GovernmentHistoryPage() {
  return (
    <>
      <Breadcrumb label="Povijest administracija" />
      <PageHeading
        eyebrow="Vremenska crta"
        title="Povijest administracija"
        description="Zasebni mandati, potvrđeni datumi i koalicijske promjene. Povijesne evidencije povezuju se u trećoj fazi."
      />
      <section className="surface">
        <EmptyState
          title="Mandati još nisu verificirani"
          description="Ne prikazujemo nepotvrđene datume, sastave ili stranačku pripadnost. Svaka administracija dobit će vlastitu evidenciju i izvore."
        />
      </section>
    </>
  );
}
