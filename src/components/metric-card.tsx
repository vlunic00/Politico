import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { indicators, frequencyLabels } from "@/lib/catalogue";
import { SourcePopover } from "./source-popover";
import { Card } from "./ui/card";

export function MetricCard({
  indicator,
}: {
  indicator: (typeof indicators)[number];
}) {
  return (
    <Card role="article" className="surface flex h-full flex-col gap-0 p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium">{indicator.name}</h3>
        <Link
          href={`/topics/${indicator.topic}#${indicator.slug}`}
          aria-label={`Detalji: ${indicator.name}`}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          aria-label="Vrijednost nije dostupna"
          className="text-3xl font-medium tracking-tight"
        >
          —
        </span>
        <span className="text-xs text-muted-foreground">{indicator.unit}</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Referentno razdoblje nije potvrđeno
      </p>
      <div className="my-5 flex h-8 items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1 border-t border-dashed" />
        <span className="size-1.5 rounded-full bg-border" />
        <span className="h-px flex-1 border-t border-dashed" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-[10px] font-medium text-muted-foreground">
          {frequencyLabels[indicator.frequency]}
        </span>
        <span className="text-[10px] text-muted-foreground">Čeka provjeru</span>
      </div>
      <div className="mt-3">
        <SourcePopover />
      </div>
    </Card>
  );
}
