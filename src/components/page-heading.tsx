import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="subtle mt-3">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Breadcrumb({ label }: { label: string }) {
  return (
    <nav
      aria-label="Putanja"
      className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
    >
      <Link href="/" className="hover:underline">
        Pregled
      </Link>
      <ChevronRight size={12} aria-hidden="true" />
      <span>{label}</span>
    </nav>
  );
}
