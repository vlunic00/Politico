import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { indicators, frequencyLabels } from "@/lib/catalogue";
import { SourcePopover } from "./source-popover";
import { Card } from "./ui/card";
import { formatNumber, formatPeriod, sparklinePath, type Series } from "@/lib/statistics/series";

export function MetricCard({
  indicator,
  series,
}: {
  indicator: (typeof indicators)[number];
  series?: Series;
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
          aria-label={series ? undefined : "Vrijednost nije dostupna"}
          className="text-3xl font-medium tracking-tight"
        >
          {series ? formatNumber(series.latest.value) : "—"}
        </span>
        <span className="text-xs text-muted-foreground">{series?.unit ?? indicator.unit}</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {series ? `Razdoblje: ${formatPeriod(series.latest.periodStart, series.frequency, series.slug)}` : "Referentno razdoblje nije potvrđeno"}
      </p>
      {series ? <>
        <svg viewBox="0 0 200 32" preserveAspectRatio="none" className="my-4 h-8 w-full text-primary" aria-hidden="true">
          <path d={sparklinePath(series.points.slice(-12).map((p) => p.croatia))} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <p className="mb-2 text-[11px] text-muted-foreground">{series.change ? `${series.change.value > 0 ? "+" : ""}${formatNumber(series.change.value)} ${series.change.unit} prema ${series.change.baseline}` : "Promjena nije usporediva"}</p>
        <p className="mb-3 text-[11px] text-muted-foreground">{series.eu ? `EU-27: ${formatNumber(series.eu.value)} ${series.unit} · isto razdoblje` : "Nema usporedivih podataka za EU"}</p>
        {series.latest.sourceFlags && <p className="mb-2 text-[11px]">Oznake izvora: {series.latest.sourceFlags}</p>}
      </> : <div className="my-5 flex h-8 items-center gap-2" aria-hidden="true"><span className="h-px flex-1 border-t border-dashed" /><span className="size-1.5 rounded-full bg-border" /><span className="h-px flex-1 border-t border-dashed" /></div>}
      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-[10px] font-medium text-muted-foreground">
          {frequencyLabels[indicator.frequency]}
        </span>
        <span className="text-[10px] text-muted-foreground">{series ? (series.latest.observationStatus === "PROVISIONAL" ? "Privremeno / procjena" : series.latest.observationStatus === "REVISED" ? "Revidirano" : "Objavljeno") : "Čeka provjeru"}</span>
      </div>
      <div className="mt-3">
        <SourcePopover source={series?.source} />
      </div>
    </Card>
  );
}
