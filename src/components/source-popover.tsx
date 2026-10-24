import { ExternalLink } from "lucide-react";

export type SourceReference = {
  name: string;
  url: string;
  publicationDate: string | null;
  retrievedAt: string;
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
            <p>Objavljeno: {source.publicationDate ?? "nije navedeno"}</p>
            <p>Preuzeto: {source.retrievedAt}</p>
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
