// shortcut: sourced, dated editorial records; move to reviewed database records when political ingestion is added.
export const governmentVerificationDate = "2026-11-01";

export type Government = {
  id: string;
  name: string;
  primeMinister: string;
  start: string;
  end: string | null;
  sourceUrl: string;
  programUrl: string;
  coalition: { start: string; end: string | null; parties: string; note: string; sourceUrl: string }[];
  events: { date: string; description: string; sourceUrl: string }[];
};

const archive = "https://vlada.gov.hr/o-vladi/clanovi-vlade/sazivi-vlada-93/";
const previous = "https://www.vlada.gov.hr/prethodne-vlade-11348/11348";
const mostDismissal = "https://vlada.gov.hr/vijesti/predsjednik-vlade-plenkovic-potrebna-vecina-postoji-hdz-nastavlja-voditi-vladu-i-politiku-stabilnosti/20567";
const hnsEntry = "https://vlada.gov.hr/seven-new-ministers-appointed-by-parliament/21815";
const currentCoalition = "https://vlada.gov.hr/bacic-medju-strankama-u-parlamentarnoj-vecini-uvijek-je-nuzan-kompromis-kako-bi-se-nastavilo-suradjivati/42606";
const oreskovicConfidence = "https://www.sabor.hr/hr/sjednice-sabora/prijedlog-za-pokretanje-pitanja-povjerenja-predsjedniku-vlade-republike-hrvatske-1";

// End dates are exclusive: the successor takes office on that date; caretaker service remains in the outgoing term.
export const governments: Government[] = [
  {
    id: "milanovic", name: "12. Vlada · Zoran Milanović", primeMinister: "Zoran Milanović",
    start: "2011-12-23", end: "2016-01-22", sourceUrl: `${archive}12-vlada-rh/19501`,
    programUrl: "https://vlada.gov.hr/UserDocsImages/2016/Glavno%20tajni%C5%A1tvo/ENG/novosti/Arhiva/Program%20Vlade%202011-2015.pdf",
    coalition: [{ start: "2011-12-23", end: "2016-01-22", parties: "SDP · HNS · IDS · HSU", note: "Koalicija navedena u službenom pregledu prethodnih vlada; članstvo u koaliciji ne znači nužno ministarsko mjesto.", sourceUrl: previous }],
    events: [
      { date: "2012-11-16", description: "Vesna Pusić preuzima dužnost prve potpredsjednice nakon odlaska Radimira Čačića.", sourceUrl: `${archive}12-vlada-rh/19501` },
      { date: "2014-05-14", description: "Boris Lalovac preuzima Ministarstvo financija; Slavko Linić razriješen je 6. svibnja.", sourceUrl: `${archive}12-vlada-rh/19501` },
    ],
  },
  {
    id: "oreskovic", name: "13. Vlada · Tihomir Orešković", primeMinister: "Tihomir Orešković",
    start: "2016-01-22", end: "2016-10-19", sourceUrl: `${archive}13-vlada-rh/19500`,
    programUrl: "https://www.sabor.hr/sites/default/files/uploads/sabor/2019-01-18/080918/PRIJEDLOG-CLANOVA-VLADE-RH-I-PROGRAMA-VLADE-2016-2019.pdf",
    coalition: [
      { start: "2016-01-22", end: "2016-06-16", parties: "Domoljubna koalicija · Most", note: "Nazivi saveza iz službenog pregleda; Domoljubna koalicija nije pojedinačna stranka. Početni koalicijski okvir prikazan je do odluke o nepovjerenju, bez pretpostavke da je politička podrška ostala nepromijenjena.", sourceUrl: previous },
      { start: "2016-06-16", end: "2016-10-19", parties: "Tehnička Vlada nakon nepovjerenja", note: "Nastavak obnašanja dužnosti do nove Vlade, bez tvrdnje da je izvorna koalicija i dalje politički djelovala.", sourceUrl: oreskovicConfidence },
    ],
    events: [
      { date: "2016-06-15", description: "Prestaje dužnost prvog potpredsjednika Tomislava Karamarka.", sourceUrl: `${archive}13-vlada-rh/19500` },
      { date: "2016-06-16", description: "Sabor iskazuje nepovjerenje predsjedniku Vlade. Evidencija mandata traje do primopredaje 19. listopada.", sourceUrl: oreskovicConfidence },
    ],
  },
  {
    id: "plenkovic-1", name: "14. Vlada · Andrej Plenković I.", primeMinister: "Andrej Plenković",
    start: "2016-10-19", end: "2020-07-23", sourceUrl: `${archive}14-vlada-rh/44283`,
    programUrl: "https://vlada.gov.hr/UserDocsImages/ZPPI/Dokumenti%20Vlada/Program_Vlada_RH_2016_2020.pdf",
    coalition: [
      { start: "2016-10-19", end: "2017-04-27", parties: "HDZ · Most", note: "Izvor navodi i predstavnike nacionalnih manjina; ovo nije popis svih zastupnika parlamentarne većine.", sourceUrl: mostDismissal },
      { start: "2017-04-27", end: "2017-06-09", parties: "HDZ · prijelazno razdoblje", note: "Razriješeni su Orepić, Šprlje i Dobrović; Ivan Kovačić ostaje do 28. travnja. Nova suradnja s HNS-om prikazana je od potvrde novih ministara.", sourceUrl: mostDismissal },
      { start: "2017-06-09", end: "2020-07-23", parties: "HDZ · HNS", note: "Predrag Štromar i Blaženka Divjak potvrđeni su 9. lipnja. Prikaz obuhvaća koalicijsku suradnju, ne tvrdi da su ministri ostali do zadnjeg dana mandata.", sourceUrl: hnsEntry },
    ],
    events: [
      { date: "2017-04-27", description: "Razrješenje trojice Mostovih ministara i prekid dotadašnje suradnje.", sourceUrl: mostDismissal },
      { date: "2017-06-09", description: "Potvrđeno sedam novih ministara nakon dogovora HDZ-a i HNS-a.", sourceUrl: hnsEntry },
      { date: "2019-07-19", description: "Rekonstrukcija: Božinović i Marić postaju potpredsjednici; Grlić Radman, Banožić, Malenica, Aladrović, Vučković i Bedeković preuzimaju resore.", sourceUrl: `${archive}14-vlada-rh/44283` },
    ],
  },
  {
    id: "plenkovic-2", name: "15. Vlada · Andrej Plenković II.", primeMinister: "Andrej Plenković",
    start: "2020-07-23", end: "2024-05-17", sourceUrl: `${archive}15-vlada-rh/44284`,
    programUrl: "https://vlada.gov.hr/UserDocsImages/ZPPI/Dokumenti%20Vlada/Program%20Vlade%20Republike%20Hrvatske%20za%20mandat%202020.%20-%202024..pdf",
    coalition: [{ start: "2020-07-23", end: "2024-05-17", parties: "HDZ · SDSS", note: "Potvrđene stranke s članovima Vlade na početku mandata. Šira parlamentarna većina nije svedena na ovaj popis.", sourceUrl: "https://vlada.gov.hr/new-croatian-government-voted-in/30029" }],
    events: [
      { date: "2022-04-29", description: "Anja Šimpraga zamjenjuje Borisa Miloševića; Davor Filipović i Marin Piletić preuzimaju resore.", sourceUrl: `${archive}15-vlada-rh/44284` },
      { date: "2022-07-15", description: "Marko Primorac preuzima Ministarstvo financija nakon Zdravka Marića.", sourceUrl: `${archive}15-vlada-rh/44284` },
      { date: "2023-01-17", description: "Branko Bačić i Šime Erlić preuzimaju resore graditeljstva i regionalnog razvoja.", sourceUrl: `${archive}15-vlada-rh/44284` },
      { date: "2023-11-16", description: "Ivan Anušić preuzima Ministarstvo obrane.", sourceUrl: `${archive}15-vlada-rh/44284` },
    ],
  },
  {
    id: "plenkovic-3", name: "16. Vlada · Andrej Plenković III.", primeMinister: "Andrej Plenković",
    start: "2024-05-17", end: null,
    sourceUrl: "https://www.sabor.hr/hr/sjednice-sabora/predstavljanje-vlade-republike-hrvatske-i-glasovanje-o-povjerenju-vladi-republike-8",
    programUrl: "https://vlada.gov.hr/UserDocsImages/ZPPI/Dokumenti%20Vlada/2024/Program_16_Vlade_RH.pdf?vel=989567",
    coalition: [{ start: "2024-05-17", end: null, parties: "HDZ · Domovinski pokret", note: "Potvrđena koalicijska suradnja. Stranke koje podržavaju Vladu u Saboru nisu automatski stranke s ministrima.", sourceUrl: currentCoalition }],
    events: [
      { date: "2024-12-06", description: "Irena Hrstić dobiva povjerenje Sabora za ministricu zdravstva.", sourceUrl: "https://vlada.gov.hr/vijesti/u-hrvatskom-saboru-prisegnula-nova-ministrica-zdravstva-irena-hrstic/43475" },
      { date: "2025-02-11", description: "David Vlajčić dobiva povjerenje Sabora za potpredsjednika Vlade i ministra poljoprivrede, šumarstva i ribarstva.", sourceUrl: "https://vlada.gov.hr/vijesti/u-hrvatskom-saboru-prisegnuo-novi-ministar-poljoprivrede-sumarstva-i-ribarstva-david-vlajcic/43805" },
      { date: "2025-07-15", description: "Nataša Mikuš Žigman dobiva povjerenje Sabora za ministricu regionalnoga razvoja i fondova EU-a.", sourceUrl: "https://vlada.gov.hr/vijesti/plenkovic-na-sastanku-sa-zupanima-napravili-smo-ogromne-iskorake-u-razvijenosti-svih-krajeva-hrvatske/44805" },
      { date: "2026-01-29", description: "Tomislav Ćorić preuzima Ministarstvo financija nakon Marka Primorca.", sourceUrl: "https://vlada.gov.hr/marko-primorac-odlazi-u-europsku-investicijsku-banku-sabor-potvrdio-novog-ministra-financija-tomislava-corica/46061" },
      { date: "2026-02-20", description: "Alen Ružić dobiva povjerenje Sabora za ministra rada, mirovinskoga sustava, obitelji i socijalne politike.", sourceUrl: "https://vlada.gov.hr/izglasavanje-povjerenja-bilo-je-ocekivano-zelimo-da-se-ministar-ruzic-brzo-ukljuci-u-tim-i-ispunjavanje-programa-vlade/46187" },
      { date: "2026-02-25", description: "Boška Ban pristupa parlamentarnoj većini. To nije imenovanje u Vladu; izvor zasebno potvrđuje suradnju s DP-om i HSLS-om.", sourceUrl: "https://vlada.gov.hr/zastupnica-boska-ban-od-danas-je-dio-parlamentarne-vecine-dabro-ni-formalno-nije-presudan-za-stabilnost-vlade/46237" },
    ],
  },
];

export const latestGovernment = governments[governments.length - 1];
export const governmentTransitions = governments.map((government) => ({ date: government.start, label: government.name }));

export const governmentComparisonContext = [
  { date: "2013-07-01", description: "Hrvatska postaje članica Europske unije.", sourceUrl: "https://european-union.europa.eu/principles-countries-history/eu-countries/croatia_hr" },
  { date: "2020-03-11", description: "WHO opisuje COVID-19 kao pandemiju; riječ je o međunarodnom kontekstu, bez procjene učinka pojedine Vlade.", sourceUrl: "https://www.who.int/europe/emergencies/situations/covid-19/" },
  { date: "2022-02-24", description: "Početak opće ruske invazije na Ukrajinu; međunarodni događaj važan za čitanje tog razdoblja.", sourceUrl: "https://www.consilium.europa.eu/hr/policies/sanctions-against-russia-explained/" },
  { date: "2023-01-01", description: "Hrvatska pristupa europodručju i šengenskom području. Jedinice i metodološke prekide i dalje provjeravamo po pokazatelju.", sourceUrl: "https://european-union.europa.eu/principles-countries-history/eu-countries/croatia_hr" },
];
