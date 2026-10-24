export const defaultLocale = "hr";
export const messages = {
  hr: {
    overview: "Pregled",
    topics: "Teme",
    government: "Vlada",
    parties: "Stranke",
    elections: "Izbori",
    regions: "Regije",
    sources: "Izvori",
    methodology: "Metodologija",
    unavailable: "Podaci nisu dostupni",
    search: "Pretražite teme i pokazatelje",
  },
  en: {
    overview: "Overview",
    topics: "Topics",
    government: "Government",
    parties: "Parties",
    elections: "Elections",
    regions: "Regions",
    sources: "Sources",
    methodology: "Methodology",
    unavailable: "Data unavailable",
    search: "Search topics and indicators",
  },
} as const;
export const t = messages[defaultLocale];
export const appName =
  process.env.NEXT_PUBLIC_APP_NAME || "Croatia Political Observatory";
