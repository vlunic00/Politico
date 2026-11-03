import { indicators, sources, topics } from "./catalogue";
import { parliamentaryParties, type ParliamentaryParty } from "./politics";
import { counties } from "./regions/catalogue";
import { elections } from "./elections/catalogue";

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("hr")
    .trim();
}

export function searchCatalogue(query: string, parties: (Pick<ParliamentaryParty, "name" | "abbreviation" | "slug" | "leaders"> & { registration?: { name: string } })[] = parliamentaryParties) {
  const normalized = normalizeSearch(query);
  if (!normalized) return [];
  return [
    ...counties.map((county) => ({ title: county.name, description: "Županijski profil · regionalni pokazatelji i nacionalna referenca", href: `/regions/${county.slug}`, type: "Županija" })),
    ...elections.map((election) => ({ title: election.title, description: `${election.date} · ${election.round}. krug · službeni izborni izvori`, href: `/elections/${election.id}`, type: "Izbori" })),
    ...parties.map((party) => ({
      title: `${party.name} (${party.abbreviation})`,
      description: [party.registration?.name, party.leaders?.map((leader) => leader.name).join(", ")].filter(Boolean).join(" · ") || "Politička stranka · datirani izvori",
      href: `/parties/${party.slug}`,
      type: "Stranka",
    })),
    ...topics.map((topic) => ({
      title: topic.name,
      description: topic.description,
      href: `/topics/${topic.slug}`,
      type: "Tema",
    })),
    ...indicators.map((indicator) => ({
      title: indicator.name,
      description: indicator.description,
      href: indicator.topic === "regions" && indicator.slug !== "regional-migration" ? `/regions?metric=${indicator.slug}` : `/topics/${indicator.topic}#${indicator.slug}`,
      type: "Pokazatelj",
    })),
    ...sources.map((source) => ({
      title: `${source.name} (${source.shortName})`,
      description: source.description,
      href: `/sources#${source.id}`,
      type: "Izvor",
    })),
  ].filter((item) =>
    normalizeSearch(`${item.title} ${item.description}`).includes(normalized),
  );
}
