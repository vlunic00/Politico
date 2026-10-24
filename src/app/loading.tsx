import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Učitavanje sadržaja" className="space-y-7">
      <span className="sr-only">Učitavanje sadržaja…</span>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-10 max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
