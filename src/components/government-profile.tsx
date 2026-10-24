import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { SourcePopover } from "./source-popover";

export function GovernmentProfile({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className="surface flex h-full flex-col overflow-hidden"
      aria-label="Podaci o aktualnoj Vladi"
    >
      <div className="flex items-center gap-3 border-b p-6">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
          <Landmark size={21} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow mb-1">Institucije</p>
          <h2 className="section-title">Aktualna Vlada</h2>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          Sastav i mandat bit će prikazani nakon provjere službenih dokumenata.
        </p>
        <dl className="grid gap-4 text-sm">
          {[
            "Predsjednik Vlade",
            "Vodeća stranka",
            "Koalicijski partneri",
            "Početak mandata",
            ...(!compact ? ["Službeni program", "Sastav Sabora"] : []),
          ].map((label) => (
            <div
              key={label}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed pb-3"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xs">Nije verificirano</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <SourcePopover />
        </div>
        <Link
          href={compact ? "/government" : "/government/history"}
          className="text-link mt-auto pt-6"
        >
          {compact ? "Pregled Vlade" : "Povijest administracija"}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
