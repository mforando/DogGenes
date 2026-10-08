// Pulls photo URLs from the Dog CEO API (https://dog.ceo/dog-api/) for every study
// breed that the API also covers, and writes src/data/photos.json.
// Run with: npm run photos   (results are committed so the site needs no API at runtime)
//
// The API's breeds come from the Stanford Dogs / ImageNet sets, so a few similar
// names are different breeds (e.g. API "terrier/toy" is the English toy terrier,
// not the toy fox terrier; "waterdog/spanish" is not the Portuguese water dog).
// Those are deliberately left unmapped.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PER_BREED = 4;

/** study breed code → Dog CEO "breed" or "breed/sub-breed" */
const MAP = {
  AIRT: "airedale", AKIT: "akita", AUSS: "australian/shepherd", KELP: "australian/kelpie",
  BSJI: "basenji", BEAG: "beagle", BORZ: "borzoi", BOUV: "bouvier", BOX: "boxer",
  BRIA: "briard", BULD: "bulldog/english", BOST: "bulldog/boston", FBUL: "bulldog/french",
  STAF: "bullterrier/staffordshire", AUCD: "cattledog/australian", CHIH: "chihuahua",
  CHOW: "chow", BORD: "collie/border", COLL: "rough/collie", REDB: "redbone",
  CARD: "corgi/cardigan", PEMB: "pembroke", COTO: "cotondetulear", DACH: "dachshund",
  DALM: "dalmatian", DANE: "dane/great", DEER: "deerhound/scottish", DOBP: "doberman",
  NELK: "elkhound/norwegian", AESK: "eskimo", BICH: "frise/bichon", GSD: "german/shepherd",
  GREY: "greyhound", ITGY: "greyhound/italian", HAVA: "havanese", AFGH: "hound/afghan",
  BASS: "hound/basset", BLDH: "hound/blood", IBIZ: "hound/ibizan", FOXH: "hound/english",
  HUSK: "husky", KEES: "keeshond", KOMO: "komondor", KUVZ: "kuvasz", LAB: "labrador",
  LEON: "leonberg", LHSA: "lhasa", AMAL: "malamute", BMAL: "malinois", MALT: "maltese",
  BULM: "mastiff/bull", MAST: "mastiff/english", TIBM: "mastiff/tibetan",
  XOLO: "mexicanhairless", NEWF: "newfoundland", OTTR: "otterhound", PAPI: "papillon",
  PEKE: "pekinese", MPIN: "pinscher/miniature", GSHP: "pointer/german", POM: "pomeranian",
  MPOO: "poodle/miniature", SPOO: "poodle/standard", TPOO: "poodle/toy", PUG: "pug",
  GPYR: "pyrenees", RHOD: "ridgeback/rhodesian", ROTT: "rottweiler",
  CCRT: "retriever/curly", FCR: "retriever/flatcoated", GOLD: "retriever/golden",
  SALU: "saluki", SAMO: "samoyed", SKIP: "schipperke", GSNZ: "schnauzer/giant",
  MSNZ: "schnauzer/miniature", SSNZ: "schnauzer", ESET: "setter/english",
  GORD: "setter/gordon", ISET: "setter/irish", SHAR: "sharpei", OES: "sheepdog/english",
  SSHP: "sheepdog/shetland", SHIB: "shiba", SHIH: "shihtzu", CKCS: "spaniel/blenheim",
  BRIT: "spaniel/brittany", ECKR: "spaniel/cocker", IWSP: "spaniel/irish",
  CHIN: "spaniel/japanese", ESSP: "springer/english", STBD: "stbernard",
  AMST: "terrier/american", AUST: "terrier/australian", BEDT: "terrier/bedlington",
  BORT: "terrier/border", CAIR: "terrier/cairn", WFOX: "terrier/fox", IRIT: "terrier/irish",
  KERY: "terrier/kerryblue", NORF: "terrier/norfolk", NOWT: "terrier/norwich",
  JACK: "terrier/russell", SCOT: "terrier/scottish", SILK: "terrier/silky",
  TIBT: "terrier/tibetan", WHWT: "terrier/westhighland", SCWT: "terrier/wheaten",
  YORK: "terrier/yorkshire", TURV: "tervuren", BELS: "groenendael", VIZS: "vizsla",
  WEIM: "weimaraner", WHIP: "whippet", IWOF: "wolfhound/irish", BMD: "mountain/bernese",
  GSMD: "mountain/swiss",
};

const out = {};
const missing = [];
for (const [code, path] of Object.entries(MAP)) {
  const res = await fetch(`https://dog.ceo/api/breed/${path}/images`);
  const json = await res.json();
  if (json.status !== "success") {
    missing.push(`${code} (${path}): ${json.message}`);
    continue;
  }
  // A base breed's list includes its sub-breeds' folders; keep only the exact one.
  const folder = `/breeds/${path.replace("/", "-")}/`;
  const urls = json.message.filter((u) => u.includes(folder)).sort();
  if (!urls.length) {
    missing.push(`${code} (${path}): no images in ${folder}`);
    continue;
  }
  // Evenly spaced picks keep the selection stable between runs.
  const step = urls.length / PER_BREED;
  const picks = [...new Set(Array.from({ length: Math.min(PER_BREED, urls.length) }, (_, i) => urls[Math.floor(i * step)]))];
  out[code] = { api: path, urls: picks };
}

writeFileSync(join(root, "src/data/photos.json"), JSON.stringify(out, null, 1));
console.log(`photos for ${Object.keys(out).length} breeds`);
if (missing.length) console.log("skipped:\n  " + missing.join("\n  "));
