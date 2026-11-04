import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { BrandMark, Navigation } from "./navigation";
import { appName, t } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-primary p-3 text-white focus:not-sr-only"
      >
        Preskoči na sadržaj
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r bg-white py-5 md:flex">
        <Link
          href="/"
          aria-label="Početna stranica"
          className="mb-9 flex size-11 items-center justify-center rounded-xl bg-primary text-white"
        >
          <BrandMark />
        </Link>
        <Navigation />
        <span
          className="mt-auto pt-8 text-[10px] font-semibold tracking-widest text-muted-foreground"
          aria-label="Hrvatska"
        >
          HR
        </span>
      </aside>
      <div className="md:pl-20">
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 text-sm font-semibold tracking-tight"
            >
              <span className="text-primary md:hidden">
                <BrandMark />
              </span>
              <span className="max-w-[235px] truncate">{appName}</span>
            </Link>
            <span className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
              <span className="size-1.5 rounded-full bg-slate-400" />
              Razvojni pregled · datirani izvori
            </span>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground xl:ml-0">
              <span className="sr-only">Jezik sučelja</span>
              <select
                aria-label="Jezik sučelja"
                defaultValue="hr"
                className="w-14 rounded-md bg-transparent p-1 text-foreground"
              >
                <option value="hr">HR</option>
                <option value="en" disabled>
                  EN · uskoro
                </option>
              </select>
            </label>
            <form
              action="/search"
              role="search"
              className="relative w-full sm:order-none sm:w-60 lg:w-72"
            >
              <Search
                size={16}
                aria-hidden="true"
                className="absolute top-3 left-3 text-muted-foreground"
              />
              <input
                name="q"
                type="search"
                aria-label={t.search}
                placeholder="Pretražite observatorij…"
                maxLength={200}
                className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm placeholder:text-muted-foreground"
              />
            </form>
          </div>
          <Navigation mobile />
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto min-h-[calc(100dvh-180px)] max-w-[1500px] px-5 py-8 outline-none sm:px-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
        <footer className="mx-auto flex max-w-[1500px] flex-col justify-between gap-4 border-t px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:px-8 lg:px-10">
          <p>Javni podaci. Jasni izvori. Bez političkog rangiranja.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/corrections" className="hover:underline">Prijavite ispravak</Link>
            <Link href="/methodology" className="hover:underline">
              Metodologija i ispravci
            </Link>
            <Link
              href="/sources"
              className="flex items-center gap-1 hover:underline"
            >
              Katalog izvora <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
