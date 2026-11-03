import { z } from "zod";
import { normalizeSearch } from "../search";
import { counties } from "../regions/catalogue";
import { archiveBase, electionPartyIds, electionSources, minorityLabels, type ElectionDefinition } from "./catalogue";
import { contestSchema, electionMetadataSchema, type ElectionContestData } from "./contracts";
import { boundedResponse } from "../parties/llm";

const int = z.number().int().nonnegative();
const person = z.object({ naziv: z.string().min(1), rbr: z.number().int().positive(), glasova: int });
const resultSchema = z.object({ izbori: z.string(), datum: z.string(), izboriOznaka: z.string(), ijSifra: z.string().optional(), zupSifra: z.string().optional(), bmSifra: z.literal("000"), gropNaziv: z.string(),
  bmZatvoreno: int, bmUkupno: int, biraciUkupno: int, biraciGlasovalo: int, listiciUkupno: int, listiciVazeci: int, listiciNevazeci: int,
  ijNaziv: z.string().optional(), zupNaziv: z.string().optional(), napomena: z.string().optional(), napomena2: z.string().optional(),
  lista: z.array(person.extend({ jedinstvenaSifra: z.union([z.string(), z.number()]), posto: z.string().regex(/^(?:\d{1,3}(?:,\d{1,2})?)?$/), stranke: z.array(z.object({ naziv: z.string() })).optional(), predlagatelji: z.array(z.object({ naziv: z.string() })).optional(), lista: z.array(person).optional() })).min(1).max(200) });
export type ElectionSourceFile = { url: string; text: string };
export type ElectionSnapshot = { electionId: string; retrievedAt: string; files: ElectionSourceFile[] };
const normalizedName = (text: string) => normalizeSearch(text).replace(/[^a-z0-9]+/g, " ").trim();
export function htmlText(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, number: string) => String.fromCodePoint(number[0].toLowerCase() === "x" ? parseInt(number.slice(1), 16) : Number(number)))
    .replace(/&(nbsp|amp|quot|laquo|raquo|ndash|mdash|lt|gt);/g, (_, entity: string) => ({ nbsp: " ", amp: "&", quot: '"', laquo: "«", raquo: "»", ndash: "–", mdash: "—", lt: "<", gt: ">" })[entity]!)
    .replace(/\s+/g, " ").trim();
}
export function electedNames(html: string, minority: boolean, candidates: string[] = []) {
  // shortcut: these are verified 2020/2024 decision layouts; add source fixtures before accepting another layout.
  const marker = minority ? /III\.(?:\s|<[^>]+>)*Na osnovi/i : /IV\.(?:\s|<[^>]+>)*Na osnovi/i;
  const numbered = html.search(marker);
  const index = numbered >= 0 ? numbered : minority ? html.search(/<p[^>]*>Na osnovi članka 46\./i) : -1;
  if (index < 0 || !normalizedName(htmlText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "")).startsWith("konacni rezultati izbora")) throw new Error("Final legal allocation section is missing.");
  const section = html.slice(index);
  const names = minority
    ? [...new Map([...section.matchAll(/<(?:td|p)\b[^>]*>([\s\S]*?)<\/(?:td|p)>/gi)].map((match) => htmlText(match[1]).replace(/^za zastupni(?:ka|cu)\s+/i, "").replace(/(?:,\s*a\s+|\s+)za zamjeni[\s\S]*$/i, "")).filter((name) => candidates.some((candidate) => normalizedName(candidate) === normalizedName(name))).map((name) => [normalizedName(name), name])).values()]
    : [...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => htmlText(match[1]).match(/^\d+\.\s+(.+?)\s*\(kandidat(?:kinja)? na (?:kandidacijskoj )?listi pod rednim brojem \d+\./i)?.[1]).filter((name): name is string => !!name);
  if (!names.length || new Set(names.map(normalizedName)).size !== names.length) throw new Error("No unique elected candidates in the official allocation.");
  return names;
}
function sourceDate(text: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})\.$/.exec(text);
  if (!match) throw new Error("Invalid DIP source date.");
  return z.iso.date().parse(`${match[3]}-${match[2]}-${match[1]}`);
}

export function parseElectionSnapshot(def: ElectionDefinition, snapshot: ElectionSnapshot) {
  if (snapshot.electionId !== def.id || !Number.isFinite(Date.parse(snapshot.retrievedAt))) throw new Error("Snapshot identity or retrieval time is invalid.");
  const files = new Map(snapshot.files.map((file) => [file.url, file.text]));
  if (files.size !== snapshot.files.length) throw new Error("Duplicate source files.");
  const sources = electionSources(def);
  const expectedUrls = sources.flatMap((source) => [source.resultUrl, ...(source.legalUrl ? [source.legalUrl] : [])]);
  if (files.size !== expectedUrls.length || expectedUrls.some((url) => !files.has(url))) throw new Error("Incomplete election snapshot; all configured contests and legal allocations are required.");
  const contests: ElectionContestData[] = sources.map((source, index) => {
    try {
    const raw = resultSchema.parse(JSON.parse(files.get(source.resultUrl)!));
    const expectedAreaName = source.countyId ? counties.find((county) => county.id === source.countyId)!.name : source.code === "00" ? "UKUPNO RH" : source.code === "22" ? "inozemstvo" : "";
    if (normalizedName(raw.gropNaziv) !== normalizedName(expectedAreaName)) throw new Error("Unexpected municipality-level result.");
    if (!raw.izbori.includes(def.archive.split("/")[1])) throw new Error("Unexpected election year in source.");
    const minority = source.code.startsWith("012-");
    const expectedType = minority ? source.code.slice(4) : def.kind === "parliamentary" ? "02" : def.kind === "european" ? "14" : "01";
    if (raw.izboriOznaka !== expectedType || (def.kind === "parliamentary" ? raw.ijSifra !== source.code.slice(0, 3) : raw.zupSifra !== source.code)) throw new Error("Source contest identity does not match its URL.");
    if (raw.bmUkupno < 1 || raw.bmZatvoreno !== raw.bmUkupno) throw new Error("Incomplete polling-station coverage cannot be published as final.");
    if (raw.biraciGlasovalo > raw.biraciUkupno || raw.listiciUkupno > raw.biraciGlasovalo || raw.listiciVazeci + raw.listiciNevazeci !== raw.listiciUkupno) throw new Error("Inconsistent turnout or ballot totals.");
    if (!minority && raw.lista.reduce((sum, choice) => sum + choice.glasova, 0) !== raw.listiciVazeci) throw new Error("Choice votes do not reconcile with valid ballots.");
    if (raw.lista.some((choice) => choice.glasova > raw.listiciVazeci)) throw new Error("Candidate votes exceed valid ballots.");
    if (new Set(raw.lista.map((choice) => choice.rbr)).size !== raw.lista.length) throw new Error("Duplicate list/candidate numbers.");
    const date = sourceDate(raw.datum);
    if (date < def.date || date > snapshot.retrievedAt.slice(0, 10)) throw new Error("Source date precedes election or is in the future.");
    const shareBase = minority ? "multiple" : def.kind === "presidential" && def.round === 1 ? "voters" : "valid";
    let elected: string[] = [];
    if (source.legalUrl) {
      const legal = files.get(source.legalUrl)!;
      const title = normalizedName(htmlText(legal.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ""));
      const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][minority ? 11 : index];
      if (def.kind === "parliamentary" && !` ${title} `.includes(` ${roman.toLowerCase()} izbornoj jedinici `)) throw new Error("Legal allocation belongs to another constituency.");
      elected = electedNames(legal, minority, raw.lista.map((choice) => choice.naziv));
      if (elected.length !== source.seats) throw new Error(`Unexpected official seat count in ${source.code}: ${elected.length}.`);
    }
    if (def.winner && source.code === "00") elected = [def.winner];
    const normalizedElected = elected.map(normalizedName);
    const matches = new Map<string, number>();
    const choices = raw.lista.map((choice) => {
      const people = (choice.lista?.length ? choice.lista : [{ rbr: choice.rbr, naziv: choice.naziv, glasova: choice.glasova }]).map((candidate) => {
        const key = normalizedName(candidate.naziv);
        const elected = normalizedElected.includes(key);
        if (elected) matches.set(key, (matches.get(key) ?? 0) + 1);
        return { number: candidate.rbr, name: candidate.naziv, votes: candidate.glasova, elected };
      });
      if (new Set(people.map((person) => person.number)).size !== people.length) throw new Error("Duplicate candidate positions.");
      if (choice.lista?.length && people.reduce((sum, person) => sum + person.votes, 0) > choice.glasova) throw new Error("Preference votes exceed list votes.");
      const denominator = shareBase === "voters" ? raw.biraciGlasovalo : raw.listiciVazeci;
      const share = shareBase === "multiple" || !denominator ? null : choice.glasova / denominator * 100;
      if (choice.posto && share !== null && Math.abs(Number(choice.posto.replace(",", ".")) - share) > 0.011) throw new Error("Official vote share has an unexpected denominator.");
      const members = (choice.stranke ?? choice.predlagatelji ?? []).map(({ naziv }) => ({ name: naziv, partyId: electionPartyIds[naziv] ?? null, role: def.kind === "presidential" ? "proposer" as const : "list" as const }));
      return { number: choice.rbr, sourceKey: String(choice.jedinstvenaSifra), name: choice.naziv, votes: choice.glasova, share,
        seats: source.seats !== null ? people.filter((person) => person.elected).length : null, members,
        candidates: source.countyId || source.code === "22" ? [] : people };
    });
    if (normalizedElected.some((name) => matches.get(name) !== 1)) throw new Error(`An elected candidate cannot be matched uniquely to a source list in ${source.code}.`);
    if (source.countyId && normalizedName(raw.zupNaziv ?? "") !== normalizedName(counties.find((county) => county.id === source.countyId)!.name)) throw new Error("DIP county code/name mapping changed.");
    return contestSchema.parse({ code: source.code, name: minority ? `XII. izborna jedinica · ${minorityLabels[index - 11]}` : raw.ijNaziv || raw.zupNaziv || (source.code === "22" ? "Inozemstvo" : "Republika Hrvatska"), countyId: source.countyId,
      eligible: raw.biraciUkupno, voters: raw.biraciGlasovalo, ballots: raw.listiciUkupno, valid: raw.listiciVazeci, invalid: raw.listiciNevazeci,
      shareBase, sourceUrl: source.resultUrl, legalUrl: source.legalUrl, sourceDate: date, notes: [raw.napomena, raw.napomena2].filter(Boolean).join(" "), choices });
    } catch (error) { throw new Error(`Contest ${source.code}: ${error instanceof Error ? error.message : "Invalid source"}`); }
  });
  const national = contests.find((contest) => contest.code === "00");
  if (national) for (const field of ["eligible", "voters", "ballots", "valid", "invalid"] as const) {
    if (contests.filter((contest) => contest.code !== "00").reduce((sum, contest) => sum + contest[field], 0) !== national[field]) throw new Error(`County and overseas totals do not reconcile with national ${field}.`);
  }
  const domestic = contests.filter((contest) => /^00[1-9]$|^010$/.test(contest.code));
  const metadata = electionMetadataSchema.parse({ archiveUrl: `${archiveBase}#/app/${def.kind === "european" ? "eu-parlament-2024" : def.archive.replace("/", "-")}`, referenceUrl: def.referenceUrl, publicationDate: def.publicationDate,
    scope: national ? "Republika Hrvatska, uključujući inozemstvo; zasebni podaci za županije i inozemstvo." : "Sve izborne jedinice I.–XI. i svih šest manjinskih izbora XII. jedinice. Sažetak izlaznosti obuhvaća samo I.–X. jedinicu; jedinice nisu županije.",
    turnout: national ? { eligible: national.eligible, voters: national.voters, sourceUrl: national.sourceUrl } : { eligible: domestic.reduce((sum, contest) => sum + contest.eligible, 0), voters: domestic.reduce((sum, contest) => sum + contest.voters, 0), sourceUrl: `${archiveBase}#/app/${def.archive.replace("/", "-")}` } });
  return { contests, metadata };
}

export async function fetchElectionSnapshot(def: ElectionDefinition): Promise<ElectionSnapshot> {
  const urls = electionSources(def).flatMap((source) => [source.resultUrl, ...(source.legalUrl ? [source.legalUrl] : [])]);
  const files: ElectionSourceFile[] = [];
  for (let offset = 0; offset < urls.length; offset += 4) files.push(...await Promise.all(urls.slice(offset, offset + 4).map(async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: "error" });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Election source HTTP ${response.status}: ${url}`); }
    return { url, text: new TextDecoder("utf-8", { fatal: true }).decode(await boundedResponse(response, 4_000_000)) };
  })));
  return { electionId: def.id, retrievedAt: new Date().toISOString(), files };
}
