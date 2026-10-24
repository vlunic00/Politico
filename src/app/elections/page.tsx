import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Izbori" };

export default function ElectionsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Službene izborne informacije"
        title="Izbori i sudjelovanje"
        description="Datumi, kandidature, izlaznost i rezultati uz izvor i status službene objave."
      />
      <section className="surface">
        <EmptyState
          title="Izborne evidencije još nisu povezane"
          description="Povezivanje je planirano u šestoj fazi. Ne navodimo očekivani datum izbora kao službeni datum, niti registraciju stranke kao potvrdu kandidature."
        />
      </section>
      <a
        href="https://www.izbori.hr/"
        target="_blank"
        rel="noreferrer"
        className="text-link mt-6"
      >
        Službene informacije Državnog izbornog povjerenstva ↗
      </a>
    </>
  );
}
