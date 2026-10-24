import Link from "next/link";

export default function NotFound() {
  return (
    <section className="surface mx-auto max-w-xl p-10 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="text-2xl font-semibold">Stranica nije pronađena</h1>
      <p className="subtle mt-3">
        Ovaj zapis nije dostupan. Istražite katalog tema ili se vratite na
        pregled.
      </p>
      <Link href="/" className="text-link mt-6">
        Natrag na pregled →
      </Link>
    </section>
  );
}
