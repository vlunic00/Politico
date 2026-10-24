"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page render failed", error);
  }, [error]);
  return (
    <section role="alert" className="surface mx-auto max-w-xl p-10 text-center">
      <h1 className="text-2xl font-semibold">Sadržaj nije moguće učitati</h1>
      <p className="subtle mt-3">
        Pokušajte ponovno. Nedostupan odgovor ne znači da podaci ne postoje.
      </p>
      <Button onClick={reset} className="mt-6">
        Pokušaj ponovno
      </Button>
    </section>
  );
}
