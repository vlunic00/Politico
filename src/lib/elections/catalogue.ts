import { z } from "zod";

export const archiveBase = "https://www.izbori.hr/arhiva-izbora/";
export const presidentialReport = "https://www.izbori.hr/site/UserDocsImages/2024/Izbori_za_predsjednika_Republike_Hrvatske/Izvje%C5%A1%C4%87e%20o%20provedenim%20izborima%20za%20predsjednika%20Republike%20Hrvatske%202024-2025.docx.pdf";
const minorityCodes = ["13", "23", "33", "43", "53", "63"];
export const minorityLabels = ["Srpska nacionalna manjina", "Mađarska nacionalna manjina", "Talijanska nacionalna manjina", "Češka i slovačka nacionalna manjina", "Austrijska, bugarska, njemačka, poljska, romska, rumunjska, rusinska, ruska, turska, ukrajinska, vlaška i židovska nacionalna manjina", "Albanska, bošnjačka, crnogorska, makedonska i slovenska nacionalna manjina"];
export const dipCountyIds = ["HR065", "HR064", "HR028", "HR027", "HR062", "HR063", "HR021", "HR031", "HR032", "HR022", "HR023", "HR024", "HR033", "HR025", "HR034", "HR026", "HR035", "HR036", "HR037", "HR061", "HR050"];
export type ElectionDefinition = { id: string; title: string; kind: "parliamentary" | "presidential" | "european"; date: string; round: number; context: string; archive: string; referenceUrl: string; publicationDate: string | null; winner?: string };
export const elections: ElectionDefinition[] = [
  { id: "parlamentarni-2020", title: "Parlamentarni izbori 2020.", kind: "parliamentary", date: "2020-07-05", round: 1, context: "parliamentary-2020", archive: "parlament/2020", referenceUrl: "https://narodne-novine.nn.hr/clanci/sluzbeni/2020_07_82_1530.html", publicationDate: "2020-07-16" },
  { id: "parlamentarni-2024", title: "Parlamentarni izbori 2024.", kind: "parliamentary", date: "2024-04-17", round: 1, context: "parliamentary-2024", archive: "parlament/2024", referenceUrl: "https://narodne-novine.nn.hr/clanci/sluzbeni/2024_04_50_853.html", publicationDate: "2024-04-29" },
  { id: "europski-2024", title: "Europski izbori 2024.", kind: "european", date: "2024-06-09", round: 1, context: "european-2024", archive: "euparlament/2024", referenceUrl: "https://narodne-novine.nn.hr/clanci/sluzbeni/2024_06_75_1275.html", publicationDate: "2024-06-21" },
  { id: "predsjednicki-2024-1", title: "Predsjednički izbori 2024./2025. · prvi krug", kind: "presidential", date: "2024-12-29", round: 1, context: "presidential-2024", archive: "predsjednik/2024", referenceUrl: presidentialReport, publicationDate: null },
  { id: "predsjednicki-2024-2", title: "Predsjednički izbori 2024./2025. · drugi krug", kind: "presidential", date: "2025-01-12", round: 2, context: "presidential-2024", archive: "predsjednik/2024", referenceUrl: presidentialReport, publicationDate: null, winner: "ZORAN MILANOVIĆ" },
];
export const electionKinds = { all: "Svi uvezeni izbori", parliamentary: "Parlamentarni", presidential: "Predsjednički", european: "Europski" } as const;
export const electionSelection = z.object({ kind: z.enum(["all", "parliamentary", "presidential", "european"]).default("all"), year: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(1990).max(2100).optional()) });
export function electionSources(def: ElectionDefinition) {
  if (def.kind === "parliamentary") return [
    ...Array.from({ length: 11 }, (_, index) => ({ code: String(index + 1).padStart(3, "0"), resultUrl: `${archiveBase}data/${def.archive}/rezultati/1/r_02_${String(index + 1).padStart(3, "0")}_0000_000.json`,
      legalUrl: `https://narodne-novine.nn.hr/clanci/sluzbeni/${def.id.endsWith("2024") ? `2024_04_50_${853 + index}` : `2020_07_82_${1530 + index}`}.html`, seats: index === 10 ? 3 : 14, countyId: null })),
    ...minorityCodes.map((minority, index) => ({ code: `012-${minority}`, resultUrl: `${archiveBase}data/${def.archive}/rezultati/1/r_${minority}_012_0000_000.json`, legalUrl: `https://narodne-novine.nn.hr/clanci/sluzbeni/${def.id.endsWith("2024") ? `2024_04_50_${864 + index}` : `2020_07_82_${1541 + index}`}.html`, seats: index === 0 ? 3 : 1, countyId: null })),
  ];
  return Array.from({ length: 23 }, (_, index) => ({ code: String(index).padStart(2, "0"), countyId: index > 0 && index < 22 ? dipCountyIds[index - 1] : null,
    resultUrl: `${archiveBase}data/${def.archive}/rezultati/${def.round}/r_${def.kind === "presidential" ? "01" : "14"}_${String(index).padStart(2, "0")}_0000_000.json`, legalUrl: index === 0 && def.kind === "european" ? def.referenceUrl : null, seats: index === 0 && def.kind === "european" ? 12 : null }));
}

// Explicit full source names, reviewed against ministry identities; abbreviations alone never establish a party match.
export const electionPartyIds: Record<string, string> = {
  "HRVATSKA DEMOKRATSKA ZAJEDNICA - HDZ": "610008", "SOCIJALDEMOKRATSKA PARTIJA HRVATSKE - SDP": "610087",
  "HRVATSKA SOCIJALNO - LIBERALNA STRANKA - HSLS": "610003", "HRVATSKA DEMOKRŠĆANSKA STRANKA - HDS": "610006",
  "HRVATSKA NARODNA STRANKA - LIBERALNI DEMOKRATI - HNS": "610045", "HRVATSKA STRANKA UMIROVLJENIKA - HSU": "610100",
  "MOŽEMO! - POLITIČKA PLATFORMA": "1002961", "MOŽEMO! – POLITIČKA PLATFORMA": "1002961", "MOŽEMO!": "1002961",
  "DOMOVINSKI POKRET - DP": "1004680", "DOMOVINSKI POKRET MIROSLAVA ŠKORE - DOMOVINSKI POKRET": "1004680", "MOST": "601926", "MOST NEZAVISNIH LISTA - MOST": "601926",
  "SAMOSTALNA DEMOKRATSKA SRPSKA STRANKA - SDSS": "610099", "CENTAR": "602980", "HRVATSKA SELJAČKA STRANKA - HSS": "610009",
  '"DALIJA OREŠKOVIĆ I LJUDI S IMENOM I PREZIMENOM" - "DO i SIP"': "1002760", "GRAĐANSKO-LIBERALNI SAVEZ - GLAS": "1000800",
  "ISTARSKI DEMOKRATSKI SABOR - IDS": "610014", "NEZAVISNA PLATFORMA SJEVERA - NPS": "1006182", "HRVATSKI SUVERENISTI": "1004260",
  "HRVATSKA KONZERVATIVNA STRANKA - HKS": "602722", "PRIMORSKO GORANSKI SAVEZ - PGS": "610018", "NARODNA STRANKA - REFORMISTI - REFORMISTI": "602644",
};
