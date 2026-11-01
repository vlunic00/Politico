import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  formatSeatShare,
  parliamentarySnapshot,
} from "@/lib/politics";
import { registrationLabel, type DirectoryParty } from "@/lib/parties/catalogue";
import { LeaderPortrait } from "./leader-portrait";

export function PartyCard({ party }: { party: Omit<DirectoryParty, "id" | "programs"> }) {
  return (
    <article className="surface flex h-full flex-col overflow-hidden">
      <div
        className={`relative grid h-44 bg-secondary ${party.leaders?.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {party.leaders?.length ? (
          party.leaders.map((leader) => (
            <div key={leader.name} className="relative min-w-0 overflow-hidden">
              <LeaderPortrait portrait={leader.portrait} />
            </div>
          ))
        ) : (
          <LeaderPortrait />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white to-transparent"
          aria-hidden="true"
        />
        <span className="absolute top-3 left-3 rounded-md border bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide">
          {party.abbreviation}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-2">
        {party.registration && <p className="mb-3 text-[10px] text-muted-foreground">{registrationLabel(party.registration.status)}</p>}
        <h3 className="min-h-15 text-sm leading-5 font-semibold tracking-tight">
          <Link href={`/parties/${party.slug}`} className="hover:text-primary">
            {party.name}
          </Link>
        </h3>
        <div className="mt-3 min-h-20 text-xs leading-5 text-muted-foreground">
          {party.leaders ? (
            party.leaders.map((leader) => (
              <p key={leader.name}>
                <span className="text-foreground">{leader.name}</span>
                <span className="block text-[10px]">{leader.role}</span>
              </p>
            ))
          ) : (
            <p>Vodstvo nije verificirano</p>
          )}
        </div>
        <div className="mt-4 min-h-12 border-t pt-3">
          <p className="mb-1 text-[10px] text-muted-foreground">
            Politička orijentacija
          </p>
          {party.orientation ? (
            <a
              href={party.orientation.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline decoration-dotted underline-offset-4"
            >
              {party.orientation.label} · samoodređenje
            </a>
          ) : (
            <p className="text-xs">Nije verificirana</p>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">
              Udio u saborskom presjeku
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {typeof party.seats === "number" ? formatSeatShare(party.seats) : "Nije u presjeku"}
            </p>
          </div>
          <span className="pb-1 text-xs text-muted-foreground">
            {typeof party.seats === "number" ? `${party.seats} / ${parliamentarySnapshot.total}` : ""}
          </span>
        </div>
        <Link
          href={`/parties/${party.slug}`}
          className="text-link mt-auto justify-between border-t pt-4 text-xs"
        >
          Profil stranke
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
