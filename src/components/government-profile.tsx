import Link from "next/link";
import { ArrowRight, ArrowUpRight, Landmark } from "lucide-react";
import {
  currentGovernment,
  formatSeatShare,
  parliamentaryParties,
  parliamentarySnapshot,
} from "@/lib/politics";
import { LeaderPortrait } from "./leader-portrait";
import { governmentVerificationDate, latestGovernment } from "@/lib/governments";
import { formatDate } from "@/lib/statistics/series";

export function GovernmentProfile({
  overview = false,
}: {
  overview?: boolean;
}) {
  const party = parliamentaryParties.find((party) => party.slug === "hdz")!;
  return (
    <section
      className="surface overflow-hidden bg-[#f0f3f1]"
      aria-labelledby="current-government"
    >
      <div className="relative isolate grid md:min-h-[420px] md:grid-cols-[1.15fr_1fr]">
        <div className="relative order-2 p-6 sm:p-8 md:order-1 lg:p-10">
          <p className="eyebrow mb-5 flex items-center gap-2 text-primary">
            <Landmark size={14} strokeWidth={1.6} aria-hidden="true" />
            Institucije · aktualni mandat
          </p>
          <h2
            id="current-government"
            className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
          >
            Aktualna Vlada
          </h2>
          <p className="mt-4 text-xl font-medium tracking-tight">
            {currentGovernment.primeMinister}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Predsjednik Vlade Republike Hrvatske
          </p>
          <dl className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="eyebrow tracking-normal normal-case">
                Vodeća stranka
              </dt>
              <dd className="mt-1.5 text-sm font-medium">
                {currentGovernment.party}{" "}
                <span className="text-muted-foreground">(HDZ)</span>
              </dd>
            </div>
            <div>
              <dt className="eyebrow tracking-normal normal-case">
                Početak ovog mandata
              </dt>
              <dd className="mt-1.5 text-sm font-medium">
                <time dateTime={currentGovernment.termStart}>
                  {currentGovernment.termStartLabel}
                </time>
              </dd>
            </div>
            <div>
              <dt className="eyebrow tracking-normal normal-case">
                HDZ u saborskom presjeku
              </dt>
              <dd className="mt-1.5 text-sm font-medium">
                {party.seats} od {parliamentarySnapshot.total} ·{" "}
                {formatSeatShare(party.seats)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow tracking-normal normal-case">
                Koalicijski sastav
              </dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">
                {latestGovernment.coalition.at(-1)?.parties}
                <Link href={`/government/history#${latestGovernment.id}`} className="mt-1 block underline underline-offset-4">Koalicijski izvori i obuhvat ↗</Link>
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href={overview ? "/government" : "/government/history"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white hover:bg-primary/90"
            >
              {overview
                ? "Upoznajte aktualnu Vladu"
                : "Povijest administracija"}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <a
              href={currentGovernment.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-link text-xs"
            >
              Službena stranica
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="relative order-1 h-72 overflow-hidden sm:h-80 md:order-2 md:h-auto">
          <LeaderPortrait portrait="plenkovic" preload={overview} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f0f3f1] via-transparent to-transparent md:bg-linear-to-r md:from-[#f0f3f1] md:via-[#f0f3f1]/10 md:to-transparent"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/10 px-6 py-3 text-[10px] leading-5 text-muted-foreground sm:px-8 lg:px-10">
        <p>
          Provjera mandata i koalicije: {formatDate(governmentVerificationDate)} · Saborski presjek:{" "}
          {parliamentarySnapshot.dateLabel}
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href={currentGovernment.termSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Izvor mandata
          </a>
          <Link
            href="/sources#portraits"
            className="underline underline-offset-4"
          >
            Fotografija i licenca
          </Link>
        </div>
      </div>
    </section>
  );
}
