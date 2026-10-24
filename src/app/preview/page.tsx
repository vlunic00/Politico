import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { ChartPreview } from "@/components/chart-preview";

export const metadata: Metadata = { title: "Razvojni pregled grafa" };

export default function PreviewPage() {
  return (
    <>
      <PageHeading
        eyebrow="Razvojni pregled · bez stvarnih statistika"
        title="Kako će izgledati podaci"
        description="Označeni sintetički primjer služi provjeri komponenti. Nije izvor informacija o Hrvatskoj ili Europskoj uniji."
      />
      <ChartPreview />
      <p className="subtle mt-5">
        Namjerna praznina u seriji pokazuje kako prikazujemo nedostajuće
        opažanje: linija se prekida, a tablica navodi da podatak nije dostupan.
      </p>
    </>
  );
}
