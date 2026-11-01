import { latestGovernment } from "./governments";

// shortcut: manually verified snapshots, replace with reviewed adapters when political data ingestion is implemented.
export const politicalVerificationDate = "2026-10-24";
export const parliamentarySnapshot = {
  date: "2026-08-24",
  dateLabel: "24. kolovoza 2026.",
  total: 150,
  independentSeats: 11,
  sourceUrl: "https://www.sabor.hr/hr/zastupnici/statisticki-pokazatelji",
};

export const portraits = {
  plenkovic: {
    src: "/portraits/andrej-plenkovic.jpg",
    name: "Andrej Plenković",
    credit: "Damir Sencar / Europska komisija",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Andrej_Plenkovi%C4%87_2024.jpg",
  },
  hajdas: {
    src: "/portraits/sinisa-hajdas-doncic.jpg",
    name: "Siniša Hajdaš Dončić",
    credit: "Socijaldemokratska partija Hrvatske",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Sini%C5%A1a_Hajda%C5%A1_Don%C4%8Di%C4%87.jpg",
  },
  bencic: {
    src: "/portraits/sandra-bencic.jpg",
    name: "Sandra Benčić",
    credit: "Timy Šarec",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Portret_Sandra_Ben%C4%8Di%C4%87_2024.jpg",
  },
  tomasevic: {
    src: "/portraits/tomislav-tomasevic.jpg",
    name: "Tomislav Tomašević",
    credit: "Možemo!",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:The_Official_Photo_of_Tomislav_Toma%C5%A1evi%C4%87.jpg",
  },
  penava: {
    src: "/portraits/ivan-penava.png",
    name: "Ivan Penava",
    credit: "PIXSELL",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Ivan_Penava_2023_(cropped).png",
  },
  grmoja: {
    src: "/portraits/nikola-grmoja.jpg",
    name: "Nikola Grmoja",
    credit: "Patrik Macek / PIXSELL",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Nikola_Grmoja_2024.jpg",
  },
} as const;

export const currentGovernment = {
  primeMinister: latestGovernment.primeMinister,
  party: "Hrvatska demokratska zajednica",
  termStart: latestGovernment.start,
  termStartLabel: "17. svibnja 2024.",
  sourceUrl: "https://www.vlada.gov.hr/predsjednik-vlade-65/65",
  termSourceUrl: latestGovernment.sourceUrl,
};

export type ParliamentaryParty = {
  slug: string;
  name: string;
  abbreviation: string;
  seats: number;
  leaders?: { name: string; role: string; portrait: keyof typeof portraits }[];
  leadershipSource?: string;
  orientation?: { label: string; sourceUrl: string; method: "Samoodređenje" };
};

// Preserve the source table's order; the snapshot is not a ranking or a live register.
export const parliamentaryParties: ParliamentaryParty[] = [
  {
    slug: "hdz",
    name: "Hrvatska demokratska zajednica",
    abbreviation: "HDZ",
    seats: 55,
    leaders: [
      { name: "Andrej Plenković", role: "Predsjednik", portrait: "plenkovic" },
    ],
    leadershipSource: "https://vlada.gov.hr/the-prime-minister/14973",
    orientation: {
      label: "Desni centar",
      sourceUrl:
        "https://www.hdz.hr/article/5412/vodstva-hdz-a-hss-a-o-politickoj-suradnji-na-osnovama-programske-i-svjetonazorske-bliskosti",
      method: "Samoodređenje",
    },
  },
  {
    slug: "sdp",
    name: "Socijaldemokratska partija Hrvatske",
    abbreviation: "SDP",
    seats: 35,
    leaders: [
      { name: "Siniša Hajdaš Dončić", role: "Predsjednik", portrait: "hajdas" },
    ],
    leadershipSource: "https://www.sdp.hr/clan/sinisa-hajdas-doncic/",
    orientation: {
      label: "Lijevi centar",
      sourceUrl:
        "https://www.sdp.hr/vijesti/bjezancevic-sdp-je-bio-najjaci-kad-je-bilo-najpotrebnije",
      method: "Samoodređenje",
    },
  },
  {
    slug: "mozemo",
    name: "Možemo! – Politička platforma",
    abbreviation: "Možemo!",
    seats: 10,
    leaders: [
      { name: "Sandra Benčić", role: "Koordinatorica", portrait: "bencic" },
      {
        name: "Tomislav Tomašević",
        role: "Koordinator",
        portrait: "tomasevic",
      },
    ],
    leadershipSource: "https://mozemo.hr/upravna-tijela-stranke/",
    orientation: {
      label: "Zelena ljevica",
      sourceUrl:
        "https://mozemo.hr/ovo-su-nasi-programski-prioriteti-za-nacionalne-izbore-2024/",
      method: "Samoodređenje",
    },
  },
  {
    slug: "domovinski-pokret",
    name: "Domovinski pokret",
    abbreviation: "DP",
    seats: 7,
    leaders: [{ name: "Ivan Penava", role: "Predsjednik", portrait: "penava" }],
    leadershipSource: "https://dp.hr/predsjednistvo/",
  },
  {
    slug: "most",
    name: "Most",
    abbreviation: "Most",
    seats: 7,
    leaders: [
      { name: "Nikola Grmoja", role: "Predsjednik", portrait: "grmoja" },
    ],
    leadershipSource: "https://most-hrvatska.hr/nas-tim/predsjednistvo/",
  },
  {
    slug: "domino",
    name: "Dom i nacionalno okupljanje",
    abbreviation: "DOMiNO",
    seats: 3,
  },
  {
    slug: "sdss",
    name: "Samostalna demokratska srpska stranka",
    abbreviation: "SDSS",
    seats: 3,
  },
  { slug: "centar", name: "Centar", abbreviation: "Centar", seats: 2 },
  { slug: "drito", name: "Drito", abbreviation: "Drito", seats: 2 },
  {
    slug: "hsls",
    name: "Hrvatska socijalno-liberalna stranka",
    abbreviation: "HSLS",
    seats: 2,
  },
  {
    slug: "ids",
    name: "Istarski demokratski sabor",
    abbreviation: "IDS",
    seats: 2,
  },
  {
    slug: "nps",
    name: "Nezavisna platforma Sjevera",
    abbreviation: "NPS",
    seats: 2,
  },
  {
    slug: "doisip",
    name: "Dalija Orešković i ljudi s imenom i prezimenom",
    abbreviation: "DO i SIP",
    seats: 1,
  },
  {
    slug: "glas",
    name: "Građansko-liberalni savez",
    abbreviation: "GLAS",
    seats: 1,
  },
  {
    slug: "dario-zurovec",
    name: "Dario Zurovec - Nezavisna lista",
    abbreviation: "DZ – NL",
    seats: 1,
  },
  {
    slug: "hds",
    name: "Hrvatska demokršćanska stranka",
    abbreviation: "HDS",
    seats: 1,
  },
  {
    slug: "hns",
    name: "Hrvatska narodna stranka – liberalni demokrati",
    abbreviation: "HNS",
    seats: 1,
  },
  {
    slug: "hss",
    name: "Hrvatska seljačka stranka",
    abbreviation: "HSS",
    seats: 1,
  },
  {
    slug: "hsu",
    name: "Hrvatska stranka umirovljenika",
    abbreviation: "HSU",
    seats: 1,
  },
  {
    slug: "hrvatski-suverenisti",
    name: "Hrvatski suverenisti",
    abbreviation: "Suverenisti",
    seats: 1,
  },
  {
    slug: "nezavisni",
    name: "stranka Nezavisni",
    abbreviation: "Nezavisni",
    seats: 1,
  },
];

export function formatSeatShare(seats: number) {
  return new Intl.NumberFormat("hr-HR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(seats / parliamentarySnapshot.total);
}
