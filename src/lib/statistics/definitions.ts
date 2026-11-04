import { regionalGeographies } from "../regions/catalogue";

export type Frequency = "ANNUAL" | "QUARTERLY" | "MONTHLY";
export type SeriesDefinition = {
  slug: string;
  source: "eurostat" | "dzs";
  dataset: string;
  frequency: Frequency;
  unit: string;
  dimensions: Record<string, string>;
  definition: string;
  methodologyUrl: string;
  limitations: string;
  minimumHistory: number;
  change: "percent" | "points";
  geographies?: string[];
};

function eurostat(
  slug: string, dataset: string, frequency: Frequency, unit: string,
  dimensions: Record<string, string>, metadata: string, definition: string,
  change: SeriesDefinition["change"] = "points",
): SeriesDefinition {
  return {
    slug, source: "eurostat", dataset, frequency, unit, dimensions, definition, change,
    methodologyUrl: metadata === "nrg_ind_ren" ? "https://ec.europa.eu/eurostat/web/energy/methodology" : `https://ec.europa.eu/eurostat/cache/metadata/en/${({ une_esms: "une_rt_m_esms", employ_esms: "lfsi_esms", ilc_peps01: "ilc_sieusilc", ilc_lvho: "ilc_sieusilc", ilc_di: "ilc_sieusilc", prc_hpi: "prc_hpi_inx_esms", sts_ind_prod: "sts_esms", gov_10dd_edpt1: "gov_10dd_esms", nama10: "nama_10_gdp_esms" } as Record<string, string>)[metadata] ?? `${metadata}_esms`}.htm`,
    limitations: "Objavljeni EU-27 agregat; bez interpolacije nedostajućih vrijednosti. Oznake izvora, uključujući prekide serija i procjene, ostaju vidljive.",
    minimumHistory: frequency === "ANNUAL" ? 5 : frequency === "QUARTERLY" ? 12 : 24,
  };
}

export const seriesDefinitions: SeriesDefinition[] = [
  ...[
    { slug: "education-spending", functionCode: "GF09", name: "obrazovanje" },
    { slug: "defence-spending", functionCode: "GF02", name: "obranu" },
  ].map(({ slug, functionCode, name }) => ({
    ...eurostat(slug, "gov_10a_exp", "ANNUAL", "% BDP-a", { unit: "PC_GDP", sector: "S13", na_item: "TE", cofog99: functionCode }, "gov_10a_exp", `Ukupni rashodi opće države (S13) za ${name}, COFOG ${functionCode}, ESA 2010, postotak godišnjeg BDP-a.`),
    limitations: "Funkcionalna klasifikacija COFOG, ne proračun pojedinog ministarstva. Veći iznos nije automatski povoljan ili nepovoljan. Obrana prema COFOG-u nije NATO definicija obrambenih izdataka. EU agregat i izvorne oznake ostaju zasebni.",
  })),
  { ...eurostat("regional-gdp", "nama_10r_3gdp", "ANNUAL", "EUR / stanovniku", { unit: "EUR_HAB" }, "reg_eco10", "BDP po stanovniku u tekućim tržišnim cijenama, EUR po stanovniku; županije kao NUTS 3 i zasebna nacionalna referenca.", "percent"), geographies: regionalGeographies,
    limitations: "Nominalni BDP, nije realni rast ni dohodak kućanstva. Eurostat zaokružuje iznose u EUR po stanovniku. Granice NUTS 2024; ne spajamo stare i nove kodove. Nacionalna referenca nije prosjek županijskih vrijednosti." },
  { ...eurostat("regional-migration-adjusted", "demo_r_gind3", "ANNUAL", "osoba", { indic_de: "CNMIGRAT" }, "demo_r_gind3", "Neto migracija sa statističkom prilagodbom: razlika ukupne i prirodne promjene stanovništva, godišnje, NUTS 3.", "percent"), geographies: regionalGeographies,
    limitations: "Uključuje statističke prilagodbe; nije izravan broj doseljenih minus odseljenih. Može uključivati učinke revizije procjena stanovništva. Nije stopa po stanovniku; veće županije mogu imati veće apsolutne iznose." },
  eurostat("real-gdp-growth", "namq_10_gdp", "QUARTERLY", "%", { unit: "CLV_PCH_SM", s_adj: "SCA", na_item: "B1GQ" }, "namq_10_gdp", "Realni BDP: promjena prema istom tromjesečju prethodne godine; lančano povezani obujam, sezonski i kalendarski prilagođeno."),
  eurostat("gdp-per-capita-pps", "nama_10_pc", "ANNUAL", "PPS", { unit: "CP_PPS_EU27_2020_HAB", na_item: "B1GQ" }, "nama10", "BDP po stanovniku u standardima kupovne moći, tekuće cijene; PPS EU-27 od 2020.", "percent"),
  eurostat("unemployment", "une_rt_m", "MONTHLY", "%", { s_adj: "SA", age: "TOTAL", unit: "PC_ACT", sex: "T" }, "une_esms", "Udio nezaposlenih u radnoj snazi, oba spola, dob 15–74; sezonski prilagođena usklađena stopa."),
  eurostat("hicp", "prc_hicp_minr", "MONTHLY", "%", { unit: "RCH_A", coicop18: "TOTAL" }, "prc_hicp", "HICP: godišnja stopa promjene ukupnih potrošačkih cijena; ECOICOP verzija 2. Mogući metodološki prekid u siječnju 2026."),
  eurostat("poverty-risk", "ilc_peps01n", "ANNUAL", "%", { unit: "PC", age: "TOTAL", sex: "T" }, "ilc_peps01", "Rizik od siromaštva ili socijalne isključenosti, ukupno stanovništvo, EU cilj 2030.; EU-SILC godina istraživanja, dohodak obično iz prethodne godine."),
  eurostat("government-debt", "gov_10q_ggdebt", "QUARTERLY", "% BDP-a", { unit: "PC_GDP", sector: "S13", na_item: "GD" }, "gov_10q_ggdebt", "Konsolidirani bruto dug opće države na kraju tromjesečja, postotak BDP-a posljednjih četiriju tromjesečja."),
  eurostat("government-balance", "gov_10dd_edpt1", "ANNUAL", "% BDP-a", { unit: "PC_GDP", sector: "S13", na_item: "B9" }, "gov_10dd_edpt1", "Neto pozajmljivanje (+) ili zaduživanje (−) opće države, S13, kao postotak godišnjeg BDP-a."),
  eurostat("population", "demo_pjan", "ANNUAL", "stanovnika", { unit: "NR", age: "TOTAL", sex: "T" }, "demo_pop", "Stanovništvo na dan 1. siječnja referentne godine, sve dobi i oba spola; nije godišnji prosjek.", "percent"),
  eurostat("fertility", "demo_find", "ANNUAL", "djece po ženi", { indic_de: "TOTFERRT" }, "demo_fer", "Ukupna stopa fertiliteta: prosječan broj živorođene djece po ženi uz dobno specifične stope te godine; nije stopa nataliteta.", "percent"),
  eurostat("house-prices", "prc_hpi_q", "QUARTERLY", "indeks (2015=100)", { unit: "I15_Q", purchase: "TOTAL" }, "prc_hpi", "Indeks transakcijskih cijena novih i postojećih stambenih nekretnina koje kupuju kućanstva; 2015=100, bez sezonske prilagodbe.", "percent"),
  eurostat("housing-costs", "ilc_lvho07a", "ANNUAL", "%", { unit: "PC", rskpovth: "TOTAL", age: "TOTAL", sex: "T" }, "ilc_lvho", "Udio stanovništva u kućanstvima s troškovima stanovanja iznad 40% raspoloživog dohotka; oba iznosa nakon stambenih naknada."),
  eurostat("life-expectancy", "demo_mlexpec", "ANNUAL", "godina", { unit: "YR", age: "Y_LT1", sex: "T" }, "demo_mor", "Očekivano trajanje života pri rođenju, oba spola, prema stopama mortaliteta referentne godine.", "percent"),
  eurostat("health-expenditure", "hlth_sha11_hf", "ANNUAL", "% BDP-a", { unit: "PC_GDP", icha11_hf: "TOT_HF" }, "hlth_sha11", "Tekući izdaci za zdravstvo, svi sustavi financiranja, SHA 2011, postotak BDP-a; kapitalni izdaci nisu uključeni."),
  eurostat("early-school-leaving", "edat_lfse_14", "ANNUAL", "%", { unit: "PC", age: "Y18-24", sex: "T", wstatus: "POP" }, "edat1", "Udio osoba od 18 do 24 godine s najviše nižim srednjim obrazovanjem koje nisu sudjelovale u obrazovanju ni osposobljavanju prethodna četiri tjedna."),
  eurostat("tertiary-attainment", "edat_lfse_03", "ANNUAL", "%", { unit: "PC", age: "Y25-34", sex: "T", isced11: "ED5-8" }, "edat1", "Udio stanovništva od 25 do 34 godine sa završenim tercijarnim obrazovanjem (ISCED 2011 razine 5–8), oba spola."),
  eurostat("research-spending", "rd_e_gerdtot", "ANNUAL", "% BDP-a", { unit: "PC_GDP", sectperf: "TOTAL" }, "rd", "Bruto domaći izdaci za istraživanje i razvoj u svim sektorima izvršenja kao postotak BDP-a."),
  eurostat("renewable-energy", "nrg_ind_ren", "ANNUAL", "%", { unit: "PC", nrg_bal: "REN" }, "nrg_ind_ren", "Udio obnovljivih izvora u bruto konačnoj potrošnji energije prema metodologiji SHARES."),
  eurostat("tourist-nights", "tour_occ_nim", "MONTHLY", "noćenja", { unit: "NR", c_resid: "TOTAL", nace_r2: "I551-I553" }, "tour_occ", "Noćenja domaćih i stranih gostiju u hotelima, kratkotrajnom smještaju i kampovima (NACE I551–I553); nacionalni pragovi obuhvata mogu se razlikovati.", "percent"),
  eurostat("industrial-production", "sts_inpr_m", "MONTHLY", "indeks (2021=100)", { unit: "I21", s_adj: "SCA", nace_r2: "B-D", indic_bt: "PRD" }, "sts_ind_prod", "Indeks obujma industrijske proizvodnje, NACE B–D, 2021=100; sezonski i kalendarski prilagođeno.", "percent"),
  eurostat("youth-unemployment", "une_rt_m", "MONTHLY", "%", { s_adj: "SA", age: "Y_LT25", unit: "PC_ACT", sex: "T" }, "une_esms", "Udio nezaposlenih u radnoj snazi od 15 do 24 godine, oba spola; sezonski prilagođeno, nije udio u svim mladima."),
  eurostat("employment-rate", "lfsi_emp_a", "ANNUAL", "%", { unit: "PC_POP", age: "Y20-64", sex: "T", indic_em: "EMP_LFS" }, "employ_esms", "Stopa zaposlenosti stanovništva od 20 do 64 godine, oba spola, godišnji prosjek Ankete o radnoj snazi."),
  eurostat("investment", "nama_10_gdp", "ANNUAL", "% BDP-a", { unit: "PC_GDP", na_item: "P51G" }, "nama10", "Bruto investicije u fiksni kapital cijeloga gospodarstva (P51G), tekuće cijene, postotak BDP-a."),
  eurostat("exports", "nama_10_gdp", "ANNUAL", "% BDP-a", { unit: "PC_GDP", na_item: "P6" }, "nama10", "Izvoz robe i usluga (P6), tekuće cijene, postotak BDP-a; EU agregat uključuje trgovinu među članicama."),
  eurostat("imports", "nama_10_gdp", "ANNUAL", "% BDP-a", { unit: "PC_GDP", na_item: "P7" }, "nama10", "Uvoz robe i usluga (P7), tekuće cijene, postotak BDP-a; EU agregat uključuje trgovinu među članicama."),
  eurostat("government-revenue", "gov_10a_main", "ANNUAL", "% BDP-a", { unit: "PC_GDP", sector: "S13", na_item: "TR" }, "gov_10a_main", "Ukupni prihodi opće države (TR, S13), konsolidirano prema ESA 2010, postotak BDP-a."),
  eurostat("government-expenditure", "gov_10a_main", "ANNUAL", "% BDP-a", { unit: "PC_GDP", sector: "S13", na_item: "TE" }, "gov_10a_main", "Ukupni rashodi opće države (TE, S13), konsolidirano prema ESA 2010, postotak BDP-a; veći iznos nije automatski povoljan ili nepovoljan."),
  eurostat("income-inequality", "ilc_di12", "ANNUAL", "bodova (0–100)", { age: "TOTAL", statinfo: "GINI_HND" }, "ilc_di", "Ginijev koeficijent ekvivalentnog raspoloživog dohotka, ljestvica 0–100, ukupno stanovništvo, EU-SILC; dohodak obično iz prethodne godine."),
  eurostat("overcrowding", "ilc_lvho05a", "ANNUAL", "%", { unit: "PC", rskpovth: "TOTAL", age: "TOTAL", sex: "T" }, "ilc_lvho", "Udio ukupnog stanovništva u prenapučenim stanovima prema EU-SILC definiciji potrebnog broja soba."),
  eurostat("food-inflation", "prc_hicp_minr", "MONTHLY", "%", { unit: "RCH_A", coicop18: "CP01" }, "prc_hicp", "Godišnja stopa promjene HICP-a za hranu i bezalkoholna pića, ECOICOP verzija 2; mogući prekid u siječnju 2026."),
  eurostat("household-energy-inflation", "prc_hicp_minr", "MONTHLY", "%", { unit: "RCH_A", coicop18: "CP045" }, "prc_hicp", "Godišnja stopa promjene HICP-a za električnu energiju, plin i ostala goriva za stanovanje, ECOICOP verzija 2; ne uključuje goriva za prijevoz."),
  ...["net", "gross"].map((kind): SeriesDefinition => ({
    slug: `nominal-${kind}-wages`, source: "dzs", dataset: "Zaposlenost i plaće/Od 2025/T01.px",
    frequency: "MONTHLY", unit: "EUR", dimensions: { DJELATNOST: "000", "PLAĆA": kind === "net" ? "2" : "1" },
    definition: `Prosječna mjesečna ${kind === "net" ? "neto" : "bruto"} plaća zaposlenih u pravnim osobama, nominalno u eurima, ukupno NKD 2025; izvor JOPPD. Nije medijan ni realna plaća.`,
    methodologyUrl: "https://podaci.dzs.hr/2026/en/121344",
    limitations: "Serija prema NKD-u 2025 počinje 2025.; ne spaja se automatski sa starom klasifikacijom. Nema usklađene EU usporedbe. Obuhvaća pravne osobe, ne sve zaposlene.",
    minimumHistory: 12, change: "percent",
  })),
];

export function datasetUrl(def: SeriesDefinition) {
  if (def.source === "dzs")
    return `https://web.dzs.hr/PXWeb/api/v1/en/${def.dataset.split("/").map(encodeURIComponent).join("/")}`;
  const url = new URL(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${def.dataset}`);
  for (const [key, value] of Object.entries({ lang: "EN", freq: { ANNUAL: "A", QUARTERLY: "Q", MONTHLY: "M" }[def.frequency], ...def.dimensions, sinceTimePeriod: "2015" }))
    url.searchParams.set(key, value);
  for (const geo of def.geographies ?? ["HR", "EU27_2020"]) url.searchParams.append("geo", geo);
  return url.href;
}
