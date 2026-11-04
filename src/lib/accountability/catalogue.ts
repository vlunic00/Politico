export const accountabilitySections = [
  { id: "financing", title: "Političko financiranje", description: "Državne isplate, izvorni financijski izvještaji i granice obuhvata." },
  { id: "parliament", title: "Parlamentarna aktivnost", description: "Službeni saborski akti i datirani pokazatelji rada bez rangiranja zastupnika." },
  { id: "commitments", title: "Praćenje obveza", description: "Izvorno obećanje, verzija programa, službene radnje i ograničenja dokaza." },
] as const;

export const commitmentStates = {
  documented: "Dokumentirana obveza",
  action: "Utvrđena službena radnja",
  implementation: "Dostupni dokazi provedbe",
  overdue: "Rok je prošao",
  insufficient: "Nedovoljno dokaza",
} as const;
