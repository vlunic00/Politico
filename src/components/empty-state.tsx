import { Database } from "lucide-react";

export function EmptyState({
  title = "Podaci nisu dostupni",
  description,
  compact = false,
}: {
  title?: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "px-5 py-8" : "px-6 py-14"}`}
    >
      <span className="mb-4 flex size-11 items-center justify-center rounded-full border bg-background text-primary">
        <Database size={19} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
