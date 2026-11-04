"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartNoAxesCombined,
  Database,
  Globe,
  Landmark,
  LayoutDashboard,
  Map,
  Scale,
  Users,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const links = [
  { href: "/", label: t.overview, icon: LayoutDashboard },
  { href: "/topics", label: t.topics, icon: ChartNoAxesCombined },
  { href: "/government", label: t.government, icon: Landmark },
  { href: "/parties", label: t.parties, icon: Users },
  { href: "/elections", label: t.elections, icon: Vote },
  { href: "/regions", label: t.regions, icon: Map },
  { href: "/accountability", label: t.accountability, icon: Scale },
  { href: "/sources", label: t.sources, icon: Database },
  { href: "/methodology", label: t.methodology, icon: BookOpen },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={mobile ? "Mobilna navigacija" : "Glavna navigacija"}
      className={
        mobile
          ? "flex gap-1 overflow-x-auto px-3 pb-3 md:hidden"
          : "flex flex-col items-center gap-2"
      }
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            title={label}
            className={cn(
              "group flex shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              mobile
                ? "gap-2 px-3 py-2 text-xs font-medium"
                : "relative h-12 w-12",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <Icon
              size={mobile ? 16 : 20}
              aria-hidden="true"
              strokeWidth={1.7}
            />
            <span className={mobile ? "" : "sr-only"}>{label}</span>
            {!mobile && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-14 z-50 hidden whitespace-nowrap rounded-md bg-foreground px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-visible:block"
              >
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BrandMark() {
  return <Globe size={23} strokeWidth={1.5} aria-hidden="true" />;
}
