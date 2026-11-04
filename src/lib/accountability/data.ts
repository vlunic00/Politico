import dossier from "./records/2026-11-04.json";
import { accountabilitySchema } from "./contracts";

// shortcut: a small, dated editorial dossier is versioned in Git like government history; add database review when coverage outgrows code review.
export const accountability = accountabilitySchema.parse(dossier);

export function formatEuroCents(value: number) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(value / 100);
}
