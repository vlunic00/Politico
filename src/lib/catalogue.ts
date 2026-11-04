import { seriesDefinitions } from "./statistics/definitions";

export const topics = [
  {
    slug: "economy",
    name: "Gospodarstvo",
    nameEn: "Economy",
    description: "Proizvodnja, rast i gospodarska aktivnost.",
    icon: "ChartNoAxesCombined",
  },
  {
    slug: "employment",
    name: "Rad i plaće",
    nameEn: "Employment and wages",
    description: "Zaposlenost, tržište rada i primanja.",
    icon: "BriefcaseBusiness",
  },
  {
    slug: "prices",
    name: "Cijene i standard",
    nameEn: "Prices and living standards",
    description: "Troškovi života, siromaštvo i nejednakost.",
    icon: "ShoppingBasket",
  },
  {
    slug: "public-finances",
    name: "Javne financije",
    nameEn: "Public finances",
    description: "Proračun, javni dug i javna potrošnja.",
    icon: "Landmark",
  },
  {
    slug: "demography",
    name: "Demografija",
    nameEn: "Demography",
    description: "Stanovništvo, rođeni, umrli i migracije.",
    icon: "Users",
  },
  {
    slug: "housing",
    name: "Stanovanje",
    nameEn: "Housing",
    description: "Cijene nekretnina i uvjeti stanovanja.",
    icon: "House",
  },
  {
    slug: "healthcare",
    name: "Zdravstvo",
    nameEn: "Healthcare",
    description: "Zdravlje stanovništva i zdravstveni sustav.",
    icon: "HeartPulse",
  },
  {
    slug: "education",
    name: "Obrazovanje",
    nameEn: "Education",
    description: "Obrazovna postignuća i dostupnost učenja.",
    icon: "GraduationCap",
  },
  {
    slug: "research",
    name: "Znanost i tehnologija",
    nameEn: "Research and technology",
    description: "Istraživanje, inovacije i digitalne vještine.",
    icon: "FlaskConical",
  },
  {
    slug: "infrastructure",
    name: "Infrastruktura",
    nameEn: "Infrastructure",
    description: "Promet, povezanost i javna infrastruktura.",
    icon: "TrainFront",
  },
  {
    slug: "environment",
    name: "Energija i okoliš",
    nameEn: "Energy and environment",
    description: "Energija, emisije i prirodni resursi.",
    icon: "Leaf",
  },
  {
    slug: "justice",
    name: "Pravosuđe i upravljanje",
    nameEn: "Justice and governance",
    description: "Institucije, pravosuđe i sudjelovanje građana.",
    icon: "Scale",
  },
  {
    slug: "security",
    name: "Sigurnost i obrana",
    nameEn: "Security and defence",
    description: "Javna sigurnost i obrambeni izdaci.",
    icon: "Shield",
  },
  {
    slug: "international",
    name: "Međunarodni odnosi",
    nameEn: "International affairs",
    description: "Trgovina, ulaganja i međunarodna povezanost.",
    icon: "Globe",
  },
  {
    slug: "tourism",
    name: "Turizam i industrija",
    nameEn: "Tourism and industry",
    description: "Turistička aktivnost i industrijska proizvodnja.",
    icon: "Factory",
  },
  {
    slug: "regions",
    name: "Regionalni razvoj",
    nameEn: "Regional development",
    description: "Razlike među županijama i Gradom Zagrebom.",
    icon: "Map",
  },
] as const;

export const sources = [
  {
    id: "dzs",
    name: "Državni zavod za statistiku",
    shortName: "DZS",
    url: "https://podaci.dzs.hr/en/",
    description: "Nacionalne statistike gospodarstva i društva.",
  },
  {
    id: "eurostat",
    name: "Eurostat",
    shortName: "Eurostat",
    url: "https://ec.europa.eu/eurostat/",
    description: "Usporedive europske statistike i metodologija.",
  },
  {
    id: "hnb",
    name: "Hrvatska narodna banka",
    shortName: "HNB",
    url: "https://www.hnb.hr/",
    description: "Monetarni, financijski i vanjski sektor.",
  },
  {
    id: "mfin",
    name: "Ministarstvo financija",
    shortName: "MFIN",
    url: "https://mfin.gov.hr/",
    description: "Proračun i javne financije.",
  },
  {
    id: "government",
    name: "Vlada Republike Hrvatske",
    shortName: "Vlada RH",
    url: "https://vlada.gov.hr/",
    description: "Sastav Vlade i službeni programi.",
  },
  {
    id: "parliament",
    name: "Hrvatski sabor",
    shortName: "Sabor",
    url: "https://www.sabor.hr/",
    description: "Zastupnici i parlamentarni dokumenti.",
  },
  {
    id: "dip",
    name: "Državno izborno povjerenstvo",
    shortName: "DIP",
    url: "https://www.izbori.hr/",
    description: "Službene izborne informacije i rezultati.",
  },
  {
    id: "data-gov",
    name: "Portal otvorenih podataka",
    shortName: "data.gov.hr",
    url: "https://data.gov.hr/",
    description: "Otvoreni podaci i službeni registri.",
  },
] as const;

type Indicator = {
  slug: string;
  name: string;
  nameEn: string;
  topic: (typeof topics)[number]["slug"];
  unit: string;
  frequency: "ANNUAL" | "QUARTERLY" | "MONTHLY";
  description: string;
};

const plannedIndicators: Indicator[] = [
  {
    slug: "real-gdp-growth",
    name: "Realni rast BDP-a",
    nameEn: "Real GDP growth",
    topic: "economy",
    unit: "%",
    frequency: "QUARTERLY",
    description:
      "Promjena obujma bruto domaćeg proizvoda u odnosu na usporedivo razdoblje.",
  },
  {
    slug: "gdp-per-capita-pps",
    name: "BDP po stanovniku (PPS)",
    nameEn: "GDP per capita in PPS",
    topic: "economy",
    unit: "PPS",
    frequency: "ANNUAL",
    description:
      "Bruto domaći proizvod po stanovniku u standardima kupovne moći.",
  },
  {
    slug: "unemployment",
    name: "Stopa nezaposlenosti",
    nameEn: "Unemployment rate",
    topic: "employment",
    unit: "%",
    frequency: "MONTHLY",
    description:
      "Udio nezaposlenih u radnoj snazi prema usklađenoj definiciji.",
  },
  {
    slug: "real-wages",
    name: "Realne plaće",
    nameEn: "Real wages",
    topic: "employment",
    unit: "indeks",
    frequency: "MONTHLY",
    description:
      "Kretanje plaća prilagođeno promjeni potrošačkih cijena; bazno razdoblje treba potvrditi.",
  },
  {
    slug: "hicp",
    name: "Harmonizirana inflacija",
    nameEn: "HICP inflation",
    topic: "prices",
    unit: "%",
    frequency: "MONTHLY",
    description: "Godišnja promjena harmoniziranog indeksa potrošačkih cijena.",
  },
  {
    slug: "poverty-risk",
    name: "Rizik od siromaštva ili socijalne isključenosti",
    nameEn: "Risk of poverty or social exclusion",
    topic: "prices",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio stanovništva izloženog riziku od siromaštva ili socijalne isključenosti.",
  },
  {
    slug: "government-debt",
    name: "Javni dug",
    nameEn: "Government debt",
    topic: "public-finances",
    unit: "% BDP-a",
    frequency: "QUARTERLY",
    description: "Konsolidirani bruto dug opće države u odnosu na BDP.",
  },
  {
    slug: "government-balance",
    name: "Saldo opće države",
    nameEn: "Government balance",
    topic: "public-finances",
    unit: "% BDP-a",
    frequency: "ANNUAL",
    description:
      "Neto pozajmljivanje ili zaduživanje opće države u odnosu na BDP.",
  },
  {
    slug: "population",
    name: "Broj stanovnika",
    nameEn: "Population",
    topic: "demography",
    unit: "stanovnika",
    frequency: "ANNUAL",
    description:
      "Broj stanovnika prema referentnom datumu i definiciji izvora.",
  },
  {
    slug: "fertility",
    name: "Ukupna stopa fertiliteta",
    nameEn: "Total fertility rate",
    topic: "demography",
    unit: "djece po ženi",
    frequency: "ANNUAL",
    description:
      "Sintetički pokazatelj broja djece po ženi prema dobnim stopama fertiliteta.",
  },
  {
    slug: "house-prices",
    name: "Cijene stambenih nekretnina",
    nameEn: "House prices",
    topic: "housing",
    unit: "indeks",
    frequency: "QUARTERLY",
    description:
      "Indeks cijena stambenih nekretnina; bazno razdoblje treba potvrditi.",
  },
  {
    slug: "housing-costs",
    name: "Preopterećenost troškovima stanovanja",
    nameEn: "Housing cost overburden",
    topic: "housing",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio stanovništva čiji troškovi stanovanja prelaze prag definiran izvorom.",
  },
  {
    slug: "life-expectancy",
    name: "Očekivano trajanje života",
    nameEn: "Life expectancy",
    topic: "healthcare",
    unit: "godina",
    frequency: "ANNUAL",
    description:
      "Očekivano trajanje života pri rođenju prema tablicama mortaliteta.",
  },
  {
    slug: "health-expenditure",
    name: "Izdaci za zdravstvo",
    nameEn: "Health expenditure",
    topic: "healthcare",
    unit: "% BDP-a",
    frequency: "ANNUAL",
    description: "Tekući izdaci za zdravstvo prema usklađenoj metodologiji.",
  },
  {
    slug: "early-school-leaving",
    name: "Rano napuštanje obrazovanja",
    nameEn: "Early school leaving",
    topic: "education",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio mladih koji rano napuštaju obrazovanje prema dobnom obuhvatu izvora.",
  },
  {
    slug: "tertiary-attainment",
    name: "Visoko obrazovanje",
    nameEn: "Tertiary attainment",
    topic: "education",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio stanovništva sa završenim visokim obrazovanjem u odabranoj dobnoj skupini.",
  },
  {
    slug: "research-spending",
    name: "Ulaganja u istraživanje i razvoj",
    nameEn: "Research and development expenditure",
    topic: "research",
    unit: "% BDP-a",
    frequency: "ANNUAL",
    description:
      "Bruto domaći izdaci za istraživanje i razvoj u odnosu na BDP.",
  },
  {
    slug: "digital-skills",
    name: "Digitalne vještine",
    nameEn: "Digital skills",
    topic: "research",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio stanovništva s najmanje osnovnim digitalnim vještinama prema obuhvatu izvora.",
  },
  {
    slug: "rail-passengers",
    name: "Željeznički putnički promet",
    nameEn: "Rail passenger transport",
    topic: "infrastructure",
    unit: "putnički km",
    frequency: "ANNUAL",
    description:
      "Opseg prijevoza putnika željeznicom izražen u putničkim kilometrima.",
  },
  {
    slug: "water-access",
    name: "Priključenost na javnu vodoopskrbu",
    nameEn: "Public water supply access",
    topic: "infrastructure",
    unit: "%",
    frequency: "ANNUAL",
    description: "Udio stanovništva priključenog na javnu vodoopskrbu.",
  },
  {
    slug: "renewable-energy",
    name: "Obnovljivi izvori energije",
    nameEn: "Renewable energy share",
    topic: "environment",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio energije iz obnovljivih izvora u bruto konačnoj potrošnji.",
  },
  {
    slug: "greenhouse-emissions",
    name: "Emisije stakleničkih plinova",
    nameEn: "Greenhouse gas emissions",
    topic: "environment",
    unit: "t CO₂e",
    frequency: "ANNUAL",
    description:
      "Emisije stakleničkih plinova izražene u ekvivalentu ugljikova dioksida; obuhvat treba potvrditi.",
  },
  {
    slug: "court-disposition-time",
    name: "Trajanje sudskih postupaka",
    nameEn: "Court disposition time",
    topic: "justice",
    unit: "dana",
    frequency: "ANNUAL",
    description:
      "Procijenjeno vrijeme rješavanja predmeta; vrsta predmeta i metodologija moraju biti navedene.",
  },
  {
    slug: "electoral-turnout",
    name: "Izlaznost na izbore",
    nameEn: "Electoral turnout",
    topic: "justice",
    unit: "%",
    frequency: "ANNUAL",
    description:
      "Udio birača koji su glasovali na određenim izborima; pojedini izbori moraju biti jasno navedeni.",
  },
  {
    slug: "road-fatalities",
    name: "Poginuli u cestovnom prometu",
    nameEn: "Road fatalities",
    topic: "security",
    unit: "osoba",
    frequency: "ANNUAL",
    description: "Broj poginulih u cestovnom prometu prema definiciji izvora.",
  },
  {
    slug: "defence-spending",
    name: "Izdaci za obranu",
    nameEn: "Defence expenditure",
    topic: "security",
    unit: "% BDP-a",
    frequency: "ANNUAL",
    description:
      "Izdaci za obranu u odnosu na BDP; klasifikacija mora biti dokumentirana.",
  },
  {
    slug: "foreign-investment",
    name: "Izravna strana ulaganja",
    nameEn: "Foreign direct investment",
    topic: "international",
    unit: "EUR",
    frequency: "ANNUAL",
    description:
      "Tokovi izravnih stranih ulaganja prema metodologiji platne bilance.",
  },
  {
    slug: "external-debt",
    name: "Bruto inozemni dug",
    nameEn: "Gross external debt",
    topic: "international",
    unit: "EUR",
    frequency: "QUARTERLY",
    description: "Stanje bruto inozemnog duga svih sektora na kraju razdoblja.",
  },
  {
    slug: "tourist-nights",
    name: "Turistička noćenja",
    nameEn: "Tourist nights",
    topic: "tourism",
    unit: "noćenja",
    frequency: "MONTHLY",
    description: "Broj turističkih noćenja prema obuhvatu smještaja u izvoru.",
  },
  {
    slug: "industrial-production",
    name: "Industrijska proizvodnja",
    nameEn: "Industrial production",
    topic: "tourism",
    unit: "indeks",
    frequency: "MONTHLY",
    description:
      "Indeks obujma industrijske proizvodnje; bazu i prilagodbu treba potvrditi.",
  },
  {
    slug: "regional-gdp",
    name: "BDP po stanovniku po županijama",
    nameEn: "County GDP per capita",
    topic: "regions",
    unit: "EUR",
    frequency: "ANNUAL",
    description:
      "BDP po stanovniku po administrativnim županijama uz potvrđene granice.",
  },
  {
    slug: "regional-migration",
    name: "Migracijski saldo županija",
    nameEn: "County net migration",
    topic: "regions",
    unit: "osoba",
    frequency: "ANNUAL",
    description:
      "Razlika doseljenih i odseljenih po županijama u usporedivom razdoblju.",
  },
];

const additionalIndicators: Pick<Indicator, "slug" | "name" | "nameEn" | "topic">[] = [
  { slug: "education-spending", name: "Javni rashodi za obrazovanje", nameEn: "Government education expenditure", topic: "education" },
  { slug: "regional-migration-adjusted", name: "Migracijski saldo sa statističkom prilagodbom", nameEn: "County net migration plus statistical adjustment", topic: "regions" },
  { slug: "youth-unemployment", name: "Nezaposlenost mladih", nameEn: "Youth unemployment", topic: "employment" },
  { slug: "employment-rate", name: "Stopa zaposlenosti (20–64)", nameEn: "Employment rate (20–64)", topic: "employment" },
  { slug: "investment", name: "Investicije u fiksni kapital", nameEn: "Gross fixed capital formation", topic: "economy" },
  { slug: "exports", name: "Izvoz robe i usluga", nameEn: "Exports of goods and services", topic: "international" },
  { slug: "imports", name: "Uvoz robe i usluga", nameEn: "Imports of goods and services", topic: "international" },
  { slug: "government-revenue", name: "Prihodi opće države", nameEn: "Government revenue", topic: "public-finances" },
  { slug: "government-expenditure", name: "Rashodi opće države", nameEn: "Government expenditure", topic: "public-finances" },
  { slug: "income-inequality", name: "Dohodovna nejednakost (Gini)", nameEn: "Income inequality (Gini)", topic: "prices" },
  { slug: "overcrowding", name: "Prenapučenost stanova", nameEn: "Overcrowding rate", topic: "housing" },
  { slug: "food-inflation", name: "Inflacija hrane i bezalkoholnih pića", nameEn: "Food and non-alcoholic beverage inflation", topic: "prices" },
  { slug: "household-energy-inflation", name: "Inflacija energije za stanovanje", nameEn: "Household energy inflation", topic: "prices" },
  { slug: "nominal-net-wages", name: "Prosječna neto plaća (nominalno)", nameEn: "Average net earnings (nominal)", topic: "employment" },
  { slug: "nominal-gross-wages", name: "Prosječna bruto plaća (nominalno)", nameEn: "Average gross earnings (nominal)", topic: "employment" },
];

export const indicators: Indicator[] = [
  ...plannedIndicators.map((indicator) => {
    const def = seriesDefinitions.find((item) => item.slug === indicator.slug);
    return def ? { ...indicator, unit: def.unit, frequency: def.frequency, description: def.definition } : indicator;
  }),
  ...additionalIndicators.map((indicator) => {
    const def = seriesDefinitions.find((item) => item.slug === indicator.slug)!;
    return { ...indicator, unit: def.unit, frequency: def.frequency, description: def.definition };
  }),
];

export const featuredIndicators = [
  "real-gdp-growth",
  "gdp-per-capita-pps",
  "hicp",
  "unemployment",
  "nominal-net-wages",
  "government-debt",
  "population",
  "fertility",
];
export const frequencyLabels = {
  ANNUAL: "Godišnje",
  QUARTERLY: "Tromjesečno",
  MONTHLY: "Mjesečno",
};
