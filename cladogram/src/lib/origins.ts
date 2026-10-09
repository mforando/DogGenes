import { forceCollide, forceSimulation, forceX, forceY } from "d3";
import { data } from "./tree";

/**
 * Where each breed was developed, from standard breed-club histories (the study itself
 * has no geographic coordinates). Points are approximate regional centres, not exact
 * sites; `note` flags origins that are debated or more complicated.
 */
type Origin = { lat: number; lon: number; place: string; country: string; note?: string };

const O = (lat: number, lon: number, place: string, country: string, note?: string): Origin => ({ lat, lon, place, country, note });

const ENGLAND = (place: string, lat = 52.6, lon = -1.4) => O(lat, lon, place, "England");
const SCOTLAND = (place: string, lat = 56.8, lon = -4.2) => O(lat, lon, place, "Scotland");
const IRELAND = (place: string, lat = 53.2, lon = -7.9) => O(lat, lon, place, "Ireland");
const GERMANY = (place: string, lat = 50.9, lon = 10.2) => O(lat, lon, place, "Germany");
const FRANCE = (place: string, lat = 46.8, lon = 2.4) => O(lat, lon, place, "France");
const USA = (place: string, lat = 39.5, lon = -96, note?: string) => O(lat, lon, place, "United States", note);
const HUNGARY = (place = "Hungary") => O(47.2, 19.4, place, "Hungary");

export const ORIGINS: Record<string, Origin> = {
  // Asia
  BSJI: O(1.5, 24.5, "Congo Basin", "Central Africa"),
  XIGO: O(35.3, 108.9, "Shaanxi", "China"),
  TIBM: O(30.5, 88.5, "Tibetan Plateau", "Tibet (China)"),
  SHAR: O(23.1, 113.3, "Guangdong", "China"),
  CHOW: O(38.0, 112.5, "Northern China", "China"),
  PEKE: O(39.9, 116.4, "Beijing imperial court", "China"),
  SHIH: O(39.6, 116.1, "Beijing imperial court", "China", "Probably from Tibetan dogs crossed with Pekingese."),
  PUG: O(34.3, 113.0, "Ancient China", "China"),
  LHSA: O(29.7, 91.1, "Lhasa", "Tibet (China)"),
  TIBS: O(29.3, 90.4, "Tibetan monasteries", "Tibet (China)"),
  TIBT: O(30.0, 92.0, "Tibet", "Tibet (China)"),
  SHIB: O(36.4, 138.3, "Central Japan", "Japan"),
  AKIT: O(39.7, 140.1, "Akita Prefecture", "Japan"),
  CHIN: O(35.0, 135.8, "Kyoto imperial court", "Japan", "Ancestors likely came from China or Korea."),
  AFGH: O(34.5, 69.2, "Afghan mountains", "Afghanistan"),
  SALU: O(33.3, 44.4, "Fertile Crescent", "Middle East"),
  ANAT: O(39.0, 35.0, "Anatolia", "Turkey"),
  // Arctic & northern
  HUSK: O(66.0, 172.0, "Chukotka", "Siberia (Russia)"),
  SAMO: O(67.5, 70.0, "Yamal, NW Siberia", "Siberia (Russia)"),
  GREE: O(70.0, -45.0, "Greenland", "Greenland"),
  AMAL: O(64.5, -161.0, "Norton Sound, Alaska", "United States"),
  ICES: O(64.9, -18.6, "Iceland", "Iceland"),
  NELK: O(61.0, 9.5, "Norway", "Norway"),
  SVAL: O(58.2, 13.3, "Västergötland", "Sweden"),
  FINS: O(62.5, 25.7, "Finland", "Finland"),
  BORZ: O(55.8, 37.6, "Russian estates", "Russia"),
  BRTR: O(55.6, 37.3, "Red Star Kennel, Moscow", "Russia"),
  // British Isles
  AIRT: ENGLAND("Aire Valley, Yorkshire", 53.85, -1.9),
  YORK: ENGLAND("Yorkshire", 53.75, -1.55),
  BEDT: ENGLAND("Bedlington, Northumberland", 55.13, -1.58),
  PARS: ENGLAND("Devon", 50.7, -3.6),
  JACK: ENGLAND("Devon", 50.75, -3.45),
  WFOX: ENGLAND("England"),
  NOWT: ENGLAND("Norwich", 52.63, 1.3),
  NORF: ENGLAND("Norfolk", 52.68, 0.9),
  MNTY: ENGLAND("Manchester", 53.48, -2.24),
  STAF: ENGLAND("Staffordshire", 52.8, -2.1),
  BULT: ENGLAND("Birmingham", 52.48, -1.9),
  MBLT: ENGLAND("England", 52.3, -1.7),
  BULD: ENGLAND("England", 51.8, -0.9),
  BULM: ENGLAND("England", 52.2, -0.4),
  MAST: ENGLAND("England", 51.6, -1.8),
  BEAG: ENGLAND("Southern England", 51.1, -1.0),
  FOXH: ENGLAND("England", 52.9, -0.8, ),
  OTTR: ENGLAND("Welsh borders", 52.1, -2.8),
  ESSP: ENGLAND("Shropshire", 52.7, -2.75),
  FIEL: ENGLAND("England", 52.4, -2.2),
  CCRT: ENGLAND("England", 51.9, -1.4),
  FCR: ENGLAND("England", 52.2, -1.1),
  ESET: ENGLAND("Northern England", 54.4, -2.5),
  CKCS: ENGLAND("London", 51.5, -0.13),
  GREY: ENGLAND("England", 52.0, -1.5),
  WHIP: ENGLAND("Northern England", 54.0, -1.6),
  OES: ENGLAND("West Country", 50.9, -3.0),
  BORD: O(55.5, -2.8, "Anglo-Scottish border", "Scotland"),
  BORT: O(55.25, -2.3, "Anglo-Scottish border", "England"),
  ECKR: O(51.8, -3.6, "Wales & England", "Wales"),
  PEMB: O(51.8, -4.97, "Pembrokeshire", "Wales"),
  CARD: O(52.2, -4.25, "Cardiganshire", "Wales"),
  SCOT: SCOTLAND("Scottish Highlands", 57.3, -4.4),
  CAIR: SCOTLAND("Isle of Skye", 57.3, -6.2),
  WHWT: SCOTLAND("Poltalloch, Argyll", 56.1, -5.5),
  GOLD: SCOTLAND("Guisachan, Inverness-shire", 57.27, -4.85),
  GORD: SCOTLAND("Gordon Castle, Moray", 57.6, -3.1),
  DEER: SCOTLAND("Scottish Highlands", 57.0, -5.0),
  BERD: SCOTLAND("Scottish Borders", 55.6, -3.2),
  COLL: SCOTLAND("Scottish lowlands", 55.9, -4.3),
  SSHP: O(60.3, -1.3, "Shetland Islands", "Scotland"),
  KERY: IRELAND("County Kerry", 52.1, -9.6),
  GLEN: IRELAND("Glen of Imaal, Wicklow", 52.95, -6.55),
  SCWT: IRELAND("Ireland", 53.5, -8.0),
  IRIT: IRELAND("County Cork", 51.9, -8.5),
  IWSP: IRELAND("Ireland", 53.3, -7.0),
  ISET: IRELAND("Ireland", 53.0, -8.4),
  IWOF: IRELAND("Ireland", 53.6, -7.5),
  // Western & central Europe
  GSD: GERMANY("Germany"),
  DACH: GERMANY("Germany", 49.5, 10.5),
  SSNZ: GERMANY("Württemberg", 48.7, 9.2),
  MSNZ: GERMANY("Germany", 49.0, 10.0),
  GSNZ: GERMANY("Bavaria", 48.1, 11.6),
  MPIN: GERMANY("Germany", 50.3, 9.6),
  DOBP: GERMANY("Apolda, Thuringia", 51.02, 11.5),
  ROTT: GERMANY("Rottweil", 48.17, 8.63),
  LEON: GERMANY("Leonberg", 48.8, 9.0),
  DANE: GERMANY("Germany", 51.5, 9.0),
  BOX: GERMANY("Munich", 48.14, 11.58),
  WEIM: GERMANY("Weimar", 50.98, 11.33),
  LMUN: GERMANY("Münster", 51.96, 7.63),
  GWHP: GERMANY("Germany", 51.2, 8.3),
  GSHP: GERMANY("Germany", 50.4, 8.0),
  EURA: GERMANY("Weinheim", 49.55, 8.67),
  POM: O(54.0, 15.5, "Pomerania", "Germany / Poland"),
  KEES: O(52.1, 5.3, "Netherlands", "Netherlands"),
  SKIP: O(51.0, 4.0, "Flanders", "Belgium"),
  BRUS: O(50.85, 4.35, "Brussels", "Belgium"),
  BOUV: O(51.0, 3.7, "Flanders", "Belgium"),
  BMAL: O(51.03, 4.48, "Malines (Mechelen)", "Belgium"),
  TURV: O(50.82, 4.51, "Tervuren", "Belgium"),
  BELS: O(50.77, 4.45, "Groenendael", "Belgium"),
  BLDH: O(50.0, 5.4, "Saint-Hubert Abbey", "Belgium", "Developed further in England."),
  BPIC: FRANCE("Picardy", 49.9, 2.3),
  BRIA: FRANCE("Brie", 48.6, 3.0),
  BRIT: FRANCE("Brittany", 48.2, -2.9),
  PBGV: FRANCE("Vendée", 46.7, -1.4),
  BASS: FRANCE("France", 47.4, 0.7, ),
  DDBX: FRANCE("Bordeaux", 44.84, -0.58),
  FBUL: FRANCE("Paris", 48.86, 2.35),
  PAPI: FRANCE("France", 47.5, 1.9),
  SPOO: FRANCE("France", 48.0, 4.5),
  MPOO: FRANCE("France", 47.2, 4.0),
  TPOO: FRANCE("France", 46.5, 4.8),
  BICH: FRANCE("France", 45.8, 3.6),
  WHPG: FRANCE("France", 49.2, 4.0),
  GPYR: O(42.8, 0.5, "Pyrenees", "France / Spain"),
  GSMD: O(46.9, 7.4, "Swiss Alps", "Switzerland"),
  BMD: O(46.95, 7.45, "Bern", "Switzerland"),
  STBD: O(45.87, 7.17, "Great St Bernard Pass", "Switzerland"),
  // Southern Europe, Mediterranean & Africa
  VPIN: O(43.8, 11.25, "Tuscany", "Italy"),
  ITGY: O(41.9, 12.5, "Italy", "Italy"),
  SPIN: O(45.0, 7.7, "Piedmont", "Italy"),
  CPAT: O(42.4, 13.4, "Central Italy", "Italy"),
  MAAB: O(42.2, 13.9, "Abruzzo", "Italy"),
  CANE: O(41.0, 15.5, "Southern Italy", "Italy"),
  NEAP: O(40.85, 14.27, "Naples", "Italy"),
  LVMD: O(39.0, 16.5, "Calabria", "Italy"),
  CIRN: O(37.6, 14.2, "Sicily", "Italy"),
  PHAR: O(35.9, 14.4, "Malta", "Malta"),
  MALT: O(35.9, 14.5, "Malta", "Malta", "Ancient Mediterranean breed; Malta is its traditional home."),
  IBIZ: O(38.98, 1.43, "Ibiza", "Spain"),
  PTWD: O(37.1, -8.0, "Algarve", "Portugal"),
  DALM: O(43.5, 16.4, "Dalmatia", "Croatia"),
  KOMO: HUNGARY(),
  KUVZ: HUNGARY(),
  PULI: HUNGARY(),
  PUMI: HUNGARY(),
  VIZS: HUNGARY(),
  SLOU: O(33.0, 2.0, "Maghreb", "North Africa"),
  AZWK: O(17.0, 5.5, "Azawagh valley", "Mali / Niger"),
  RHOD: O(-19.0, 29.8, "Rhodesia", "Zimbabwe"),
  BOER: O(-26.2, 28.0, "Transvaal", "South Africa"),
  COTO: O(-23.35, 43.67, "Toliara", "Madagascar"),
  // Americas & Oceania
  CHIH: O(28.6, -106.1, "Chihuahua", "Mexico"),
  XOLO: O(18.0, -97.0, "Southern Mexico", "Mexico"),
  MXOL: O(18.6, -97.8, "Southern Mexico", "Mexico"),
  CRES: O(19.4, -99.1, "Central America", "Mexico", "Origin debated; the study groups it with the Chihuahua as a Central American breed."),
  INCA: O(-12.05, -77.04, "Coastal Peru", "Peru"),
  HAVA: O(23.1, -82.4, "Havana", "Cuba"),
  NEWF: O(48.5, -56.0, "Newfoundland", "Canada"),
  LAB: O(47.6, -52.7, "Newfoundland", "Canada", "Descends from Newfoundland water dogs; developed into the modern breed in Britain."),
  NSDT: O(43.8, -66.1, "Yarmouth, Nova Scotia", "Canada"),
  COOK: USA("New Hampshire", 43.9, -71.4),
  BOST: USA("Boston", 42.36, -71.06),
  AMST: USA("United States", 39.0, -84.5),
  ACKR: USA("United States", 40.5, -77.5),
  AESK: USA("Midwest", 41.6, -88.0),
  REDB: USA("Georgia & Tennessee", 34.5, -84.5),
  RATT: USA("United States", 37.5, -89.5),
  TYFX: USA("United States", 36.0, -95.0),
  AHRT: USA("Louisiana", 30.9, -92.0),
  AUSS: USA("Western United States", 39.5, -111.0, "Despite the name, developed in the American West."),
  AUST: O(-37.8, 145.0, "Victoria", "Australia"),
  SILK: O(-33.9, 151.2, "Sydney", "Australia"),
  AUCD: O(-32.0, 150.0, "New South Wales", "Australia"),
  KELP: O(-34.5, 147.5, "New South Wales", "Australia"),
};

export const missingOrigins = Object.keys(data.breeds).filter((c) => c !== "WOLF" && c !== "GDJK" && !ORIGINS[c]);

export type Pin = Origin & { code: string; plat: number; plon: number };

/**
 * Spread out breeds that share a region so every dot stays visible: a small collision
 * simulation in (cos-latitude-scaled) degree space, anchored to each true location.
 * plat/plon is where the dot is drawn; lat/lon is the true point (a leader line joins them).
 */
export const PINS: Pin[] = (() => {
  type N = { code: string; x: number; y: number; ax: number; ay: number; k: number };
  const nodes: N[] = Object.entries(ORIGINS).map(([code, o]) => {
    const k = Math.cos((o.lat * Math.PI) / 180);
    return { code, x: o.lon * k, y: -o.lat, ax: o.lon * k, ay: -o.lat, k };
  });
  // Seed overlapping points slightly apart so the simulation is deterministic.
  nodes.forEach((n, i) => {
    n.x += Math.cos(i * 2.399) * 0.05;
    n.y += Math.sin(i * 2.399) * 0.05;
  });
  const sim = forceSimulation(nodes)
    .force("x", forceX<N>((d) => d.ax).strength(0.25))
    .force("y", forceY<N>((d) => d.ay).strength(0.25))
    .force("collide", forceCollide<N>(0.42).iterations(3))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();
  return nodes.map((n) => {
    const o = ORIGINS[n.code];
    const plat = -n.y;
    return { ...o, code: n.code, plat, plon: n.x / Math.cos((plat * Math.PI) / 180) };
  });
})();
