import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/statistics/series";

export type SourceReference = {
  name: string;
  url: string;
  publicationDate: string | null;
  retrievedAt: string;
  updatedAt?: string | null;
  checkedAt?: string | null;
  methodologyUrl?: string;
  dataset?: string;
  revision?: string;
};

export function SourcePopover({ source }: { source?: SourceReference }) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="min-h-6 w-fit py-1 underline decoration-dotted underline-offset-4">
        {source ? `Izvor: ${source.name}` : "Izvor još nije verificiran"}
      </summary>
      <div className="mt-3 rounded-lg border bg-background p-3 leading-5">
        {source ? (
          <>
            <a
              href={source.url}
              className="text-link text-xs"
              target="_blank"
              rel="noreferrer"
            >
              Izvorna objava <ExternalLink size={12} aria-hidden="true" />
            </a>
            <p>Objavljeno: {formatDate(source.publicationDate)}</p>
            <p>Preuzeto: {formatDate(source.retrievedAt)}</p>
            {source.updatedAt && <p>Izvor ažuriran: {formatDate(source.updatedAt)}</p>}
            {source.checkedAt && <p>Posljednja uspješna provjera: {formatDate(source.checkedAt)}</p>}
            {source.dataset && <p className="break-words">Skup podataka: {source.dataset}</p>}
            {source.methodologyUrl && <a href={source.methodologyUrl} className="text-link mt-2 text-xs" target="_blank" rel="noreferrer">Metodologija izvora ↗</a>}
            {source.revision && <p className="mt-2 break-all">SHA-256: {source.revision}</p>}
          </>
        ) : (
          <p>
            Skup podataka, referentno razdoblje i posljednja provjera bit će
            navedeni nakon povezivanja službenog izvora.
          </p>
        )}
      </div>
    </details>
  );
}
