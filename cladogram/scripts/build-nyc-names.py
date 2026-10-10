"""
NYC dog names: distinctive names by group, and how well a name predicts a breed.

Input   .cache/nyc/dogs.csv   NYC Dog Licensing Dataset (NYC Open Data, nu7n-tubp)
        .cache/nyc/meta.json  this site's family / job / region per breed
Output  src/data/nycnames.json

Run from cladogram/:  python scripts/build-nyc-names.py   (needs pandas, scikit-learn)
"""
import json
import math
import os
import re
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "nyc")
OUT = os.path.join(ROOT, "src", "data", "nycnames.json")
META = json.load(open(os.path.join(CACHE, "meta.json"), encoding="utf8"))
CODES = META["codes"]

PLACEHOLDER = {"UNKNOWN", "NAME NOT PROVIDED", "NAME", "NONE", "N/A", "NA", "NOT PROVIDED", "NO NAME", "UNKNOW",
               "UNKOWN", "DOG", "NULL", "", ".", "-", "X", "XX", "TBD", "NAMENOTPROVIDED"}

# ---------------------------------------------------------------------------
# Breed normalization: (canonical name, regex, study code, size, proxy/overrides)
#   size: toy (<12 lb), small (12-28), medium (28-55), large (55-90), giant (90+)
#   family: a study code whose family group to use (proxy) or a literal group name
# ---------------------------------------------------------------------------
B = [
    # name, pattern, code, size, family_from (code or "=Group"), job, region
    ("Shih Tzu", r"^shih ?tzu", "SHIH", "small"),
    ("Yorkshire Terrier", r"^yorkshire", "YORK", "toy"),
    ("Chihuahua", r"^chihuahua", "CHIH", "toy"),
    ("Labrador Retriever", r"^labrador", "LAB", "large"),
    ("Maltese", r"^maltese", "MALT", "toy"),
    ("Toy Poodle", r"^poodle,? ?toy|^toy poodle", "TPOO", "toy"),
    ("Miniature Poodle", r"^poodle,? ?miniature|^miniature poodle", "MPOO", "small"),
    ("Standard Poodle", r"^poodle,? ?standard|^standard poodle", "SPOO", "large"),
    ("Poodle (size not given)", r"^poodle$", None, None, "=Poodle", "companion", "Western & Central Europe"),
    ("Pit Bull", r"pit ?bull", None, "medium", "AMST", "guard", "The Americas"),
    ("American Bully", r"^american bully", None, "medium", "AMST", "companion", "The Americas"),
    ("Pomeranian", r"^pomeranian", "POM", "toy"),
    ("Beagle", r"^beagle", "BEAG", "small"),
    ("French Bulldog", r"^french bull ?dog|^bull dog,? french", "FBUL", "small"),
    ("Goldendoodle", r"^golden ?doodle", None, "large", "=Designer crosses", "companion", "The Americas"),
    ("Golden Retriever", r"^golden retriever", "GOLD", "large"),
    ("Havanese", r"^havanese", "HAVA", "toy"),
    ("Cavalier King Charles Spaniel", r"^cavalier", "CKCS", "small"),
    ("Bichon Frise", r"^bichon", "BICH", "small"),
    ("Siberian Husky", r"^siberian husky|^husky", "HUSK", "medium"),
    ("Shiba Inu", r"^shiba", "SHIB", "small"),
    ("German Shepherd", r"^german shep|^shepard$|^shepherd$", "GSD", "large"),
    ("Jack Russell Terrier", r"^jack russ", "JACK", "small"),
    ("Dachshund", r"dachshund", "DACH", "small"),
    ("Australian Shepherd", r"^australian shepherd", "AUSS", "medium"),
    ("Miniature Australian Shepherd", r"^miniature australian|^miniature american shepherd", None, "small", "AUSS", "herd", "The Americas"),
    ("Cocker Spaniel", r"^cocker spaniel|^american cocker", "ACKR", "small"),
    ("Pug", r"^pug$|^pug ", "PUG", "small"),
    ("Morkie", r"^morkie", None, "toy", "=Designer crosses", "companion", "The Americas"),
    ("Maltipoo", r"^maltipoo|^malti-?poo", None, "small", "=Designer crosses", "companion", "The Americas"),
    ("Boston Terrier", r"^boston terrier", "BOST", "small"),
    ("Boxer", r"^boxer", "BOX", "large"),
    ("Labradoodle", r"^labradoodle", None, "large", "=Designer crosses", "companion", "Australia"),
    ("American Staffordshire Terrier", r"^american staffordshire", "AMST", "medium"),
    ("Miniature Schnauzer", r"^miniature schnauzer|^schnauzer,? miniature", "MSNZ", "small"),
    ("Border Collie", r"^border collie|^collie,? border", "BORD", "medium"),
    ("Cockapoo", r"^cockapoo|^cock-a-poo", None, "small", "=Designer crosses", "companion", "The Americas"),
    ("English Bulldog", r"^bull ?dog,? english|^english bull ?dog|^bulldog$", "BULD", "medium"),
    ("Miniature Pinscher", r"^miniature pinscher|^pinscher,? miniature", "MPIN", "toy"),
    ("Rottweiler", r"^rottweiler", "ROTT", "large"),
    ("Pembroke Welsh Corgi", r"pembroke|^corgi", "PEMB", "small"),
    ("Bernese Mountain Dog", r"^bernese", "BMD", "giant"),
    ("Puggle", r"^puggle", None, "small", "=Designer crosses", "companion", "The Americas"),
    ("Lhasa Apso", r"^lhasa", "LHSA", "small"),
    ("Australian Cattle Dog", r"^australian cattle", "AUCD", "medium"),
    ("Rat Terrier", r"^rat terrier", "RATT", "small"),
    ("Pekingese", r"^pekingese", "PEKE", "toy"),
    ("Jindo", r"^jindo", None, "medium", "=Not in the study", "spitz", "Asia"),
    ("Staffordshire Bull Terrier", r"^staffordshire bull", "STAF", "medium"),
    ("Cairn Terrier", r"^cairn", "CAIR", "small"),
    ("Papillon", r"^papillon", "PAPI", "toy"),
    ("Soft Coated Wheaten Terrier", r"wheat[oe]n", "SCWT", "medium"),
    ("Italian Greyhound", r"^italian greyhound", "ITGY", "toy"),
    ("Doberman Pinscher", r"^doberman", "DOBP", "large"),
    ("American Eskimo Dog", r"^american eskimo", "AESK", "small"),
    ("Cane Corso", r"^cane corso", "CANE", "giant"),
    ("Great Pyrenees", r"^great pyrenees", "GPYR", "giant"),
    ("Pomsky", r"^pomsky", None, "small", "=Designer crosses", "companion", "The Americas"),
    ("Brussels Griffon", r"^brussels", "BRUS", "toy"),
    ("Collie", r"^collie$|^collie,? rough|^rough collie", "COLL", "large"),
    ("West Highland White Terrier", r"^west high", "WHWT", "small"),
    ("Shetland Sheepdog", r"^shetland", "SSHP", "small"),
    ("Vizsla", r"^vizsla", "VIZS", "medium"),
    ("Rhodesian Ridgeback", r"^rhodesian", "RHOD", "large"),
    ("Greyhound", r"^greyhound", "GREY", "large"),
    ("Pointer", r"^pointer$|^english pointer", None, "large", "GSHP", "gun", "British Isles"),
    ("Chow Chow", r"^chow", "CHOW", "medium"),
    ("Basset Hound", r"^bass?ett? hound", "BASS", "medium"),
    ("Catahoula Leopard Dog", r"^catahoula", None, "large", "=Not in the study", "herd", "The Americas"),
    ("Bull Terrier", r"^bull terrier", "BULT", "medium"),
    ("Samoyed", r"^samoyed", "SAMO", "medium"),
    ("Great Dane", r"^great dane", "DANE", "giant"),
    ("Chinese Shar-Pei", r"shar-?pei", "SHAR", "medium"),
    ("Border Terrier", r"^border terrier", "BORT", "small"),
    ("Coton de Tulear", r"^cott?on de tulear", "COTO", "small"),
    ("Silky Terrier", r"^silky", "SILK", "toy"),
    ("Whippet", r"^whippet", "WHIP", "medium"),
    ("Akita", r"^akita", "AKIT", "large"),
    ("Basenji", r"^basenji", "BSJI", "small"),
    ("Standard Schnauzer", r"^schnauzer,? standard|^standard schnauzer", "SSNZ", "medium"),
    ("Plott Hound", r"^plott", None, "large", "REDB", "scent", "The Americas"),
    ("Belgian Malinois", r"^belgian malinois", "BMAL", "large"),
    ("Weimaraner", r"^weimaraner", "WEIM", "large"),
    ("Tibetan Terrier", r"^tibetan terrier", "TIBT", "small"),
    ("Dalmatian", r"^dalmatian", "DALM", "medium"),
    ("Portuguese Water Dog", r"^portuguese water", "PTWD", "medium"),
    ("Scottish Terrier", r"^scottish terrier", "SCOT", "small"),
    ("English Cocker Spaniel", r"^english cocker", "ECKR", "medium"),
    ("German Shorthaired Pointer", r"^german shorthaired", "GSHP", "large"),
    ("Wire Fox Terrier", r"^wire fox", "WFOX", "small"),
    ("Coonhound", r"coonhound", None, "large", "REDB", "scent", "The Americas"),
    ("Alaskan Klee Kai", r"klee ?kai", None, "small", "HUSK", "companion", "The Americas"),
    ("Old English Sheepdog", r"^old english sheep", "OES", "large"),
    ("English Springer Spaniel", r"^english springer", "ESSP", "medium"),
    ("Anatolian Shepherd", r"^anatolian", "ANAT", "giant"),
    ("Canaan Dog", r"^canaan", None, "medium", "=Not in the study", "herd", "Mediterranean & Middle East"),
    ("Alaskan Malamute", r"^alaskan malamute", "AMAL", "large"),
    ("Norwich Terrier", r"^norwich", "NOWT", "small"),
    ("Cardigan Welsh Corgi", r"cardigan", "CARD", "small"),
    ("Mastiff", r"^mastiff$|^english mastiff", "MAST", "giant"),
    ("Lagotto Romagnolo", r"^lagotto", None, "medium", "=Not in the study", "gun", "Mediterranean & Middle East"),
    ("Norfolk Terrier", r"^norfolk", "NORF", "small"),
    ("Brittany", r"^brittany", "BRIT", "medium"),
    ("Newfoundland", r"^newfoundland", "NEWF", "giant"),
    ("Bernedoodle", r"^bernedoodle", None, "large", "=Designer crosses", "companion", "The Americas"),
    ("Airedale Terrier", r"^airedale", "AIRT", "large"),
    ("Tibetan Spaniel", r"^tibetan spaniel", "TIBS", "small"),
    ("Redbone Coonhound", r"^redbone", "REDB", "large"),
    ("Parson Russell Terrier", r"^parson", "PARS", "small"),
    ("Chinese Crested", r"^chinese crested", "CRES", "toy"),
    ("Bloodhound", r"^bloodhound", "BLDH", "large"),
    ("Japanese Chin", r"^japanese chin", "CHIN", "toy"),
    ("Japanese Spitz", r"^japanese spitz", None, "small", "=Not in the study", "companion", "Asia"),
    ("Nova Scotia Duck Tolling Retriever", r"^nova scotia", "NSDT", "medium"),
    ("Dutch Shepherd", r"^dutch shepherd", None, "large", "BMAL", "herd", "Western & Central Europe"),
    ("Flat-coated Retriever", r"^flat-?coated", "FCR", "large"),
    ("Australian Kelpie", r"kelpie", "KELP", "medium"),
    ("Irish Terrier", r"^irish terrier", "IRIT", "small"),
    ("Affenpinscher", r"^affenpinscher", None, "toy", "MPIN", "vermin", "Western & Central Europe"),
    ("Manchester Terrier", r"^manchester", "MNTY", "small"),
    ("Toy Fox Terrier", r"^toy fox", "TYFX", "toy"),
    ("American Foxhound", r"foxhound", "FOXH", "large"),
    ("Bullmastiff", r"^bull ?mastiff", "BULM", "giant"),
    ("Irish Wolfhound", r"^irish wolfhound", "IWOF", "giant"),
    ("Saint Bernard", r"^saint bernard|^st\.? bernard", "STBD", "giant"),
    ("Keeshond", r"^keeshond", "KEES", "medium"),
    ("Schipperke", r"^schipperke", "SKIP", "small"),
    ("Leonberger", r"^leonberger", "LEON", "giant"),
    ("Giant Schnauzer", r"^giant schnauzer|^schnauzer,? giant", "GSNZ", "large"),
    ("Bedlington Terrier", r"^bedlington", "BEDT", "small"),
    ("Kerry Blue Terrier", r"^kerry blue", "KERY", "medium"),
    ("Australian Terrier", r"^australian terrier", "AUST", "small"),
    ("Xoloitzcuintli", r"xolo", "XOLO", "medium"),
    ("Saluki", r"^saluki", "SALU", "large"),
    ("Borzoi", r"^borzoi", "BORZ", "large"),
    ("Afghan Hound", r"^afghan", "AFGH", "large"),
    ("Dogue de Bordeaux", r"^dogue de bordeaux", "DDBX", "giant"),
]
SIZES = ["toy", "small", "medium", "large", "giant"]
SIZE_NAMES = {"toy": "Toy (under 12 lb)", "small": "Small (12–28 lb)", "medium": "Medium (28–55 lb)",
              "large": "Large (55–90 lb)", "giant": "Giant (90+ lb)"}
COMPILED = [(n, re.compile(p, re.I), *rest) for n, p, *rest in B]


def canon(raw):
    s = str(raw).strip()
    mix = bool(re.search(r"crossbreed|\bmix\b|mixed", s, re.I))
    base = re.sub(r"\s*(crossbreed|mix(ed)?( breed)?)\s*$", "", s, flags=re.I).strip(" /-")
    for row in COMPILED:
        if row[1].search(base):
            return row, mix
    return None, mix


def describe(row):
    name, _, code, size, *rest = row
    fam_from, job, region = (rest + [None, None, None])[:3]
    if code:
        m = CODES[code]
        return {"breed": name, "size": size, "family": m["cladeName"] or "Loners (no clear family)",
                "job": m["jobName"], "region": m["region"]}
    if fam_from and fam_from.startswith("="):
        fam = fam_from[1:]
    else:
        fam = CODES[fam_from]["cladeName"] or "Loners (no clear family)"
    jobname = dict(META["purposes"]).get(job, job)
    return {"breed": name, "size": size, "family": fam, "job": jobname, "region": region}


def main():
    df = pd.read_csv(os.path.join(CACHE, "dogs.csv"), dtype=str)
    raw_records = len(df)
    df["AnimalName"] = df["AnimalName"].fillna("").str.strip().str.upper()
    dogs = df.drop_duplicates(["AnimalName", "AnimalGender", "AnimalBirthYear", "BreedName", "ZipCode"]).copy()
    unique_dogs = len(dogs)
    dogs["AnimalName"] = dogs["AnimalName"].str.replace(r"\s+", " ", regex=True)
    named = dogs[~dogs["AnimalName"].isin(PLACEHOLDER) & dogs["AnimalName"].str.match(r"^[A-Z][A-Z .'\-]*$")].copy()

    # Owners sometimes typed the breed (or a placeholder) into the name field. Those
    # "names" give the answer away, so drop them before looking for patterns.
    breed_words = set()
    for row in B:
        for w in re.split(r"[^A-Za-z]+", row[0]):
            if len(w) >= 3:
                breed_words.add(w.upper())
    breed_words |= {
        "YORKIE", "FRENCHIE", "DOXIE", "AUSSIE", "POM", "CORGI", "HUSKY", "COCKER", "CAVALIER", "SCHNAUZER", "SHNAUZER",
        "BICHON", "SHIHTZU", "SHIH-TZU", "SHIH-POO", "SHIHPOO", "POM-POO", "POMPOO", "HAVA-POO", "HAVAPOO", "CAVAPOO",
        "CAVA-POO", "YORKIPOO", "YORKI-POO", "YORKIE-POO", "CHIWEENIE", "CHORKIE", "MALSHI", "SHORKIE", "CORGIDOR", "DOODLE",
        "MINI", "TOY", "GERMAN", "FRENCH", "DUTCH", "BOSTON", "AMERICAN", "ENGLISH", "STANDARD", "MINIATURE", "PUPPY",
        "UNKNOWED", "NOT", "NO", "UNK", "UNKNWON", "UKNOWN", "UNKNOW", "UNNAMED", "NONAME", "PIT", "PITTY", "PITBULL",
        "LAB", "DOG", "PUP", "BULLDOG", "TERRIER", "SHEPHERD", "SHEPARD", "RETRIEVER", "SPANIEL", "HOUND", "COLLIE",
    }
    breed_words |= {"N.A.", "N/A", "NA.", "RODRIGUEZ"}  # placeholders, and a surname typed as a name
    named = named[
        ~named["AnimalName"].isin(breed_words)
        & (named["AnimalName"].str.len() > 1)
        & ~named["AnimalName"].str.contains(r"-?POO$|DOODLE$", regex=True)  # designer-cross names
    ].copy()

    rows, mixes = [], []
    for b in named["BreedName"]:
        r, m = canon(b)
        rows.append(describe(r) if r else None)
        mixes.append(m)
    named["info"] = rows
    named["mix"] = mixes
    known = named[named["info"].notna()].copy()
    for k in ["breed", "size", "family", "job", "region"]:
        known[k] = known["info"].map(lambda x: x[k])
    print(f"{raw_records} records, {unique_dogs} dogs, {len(named)} named, {len(known)} with a recognized breed")
    excluded_breed_words = len(breed_words)

    names = known["AnimalName"]
    total = len(known)
    name_counts = Counter(names)

    # ---------- distinctive names: log-odds with an informative Dirichlet prior ----------
    # Monroe, Colaresi & Quinn (2008), "Fightin' Words". Compares each group with all
    # other dogs, shrinking rare names toward the overall rate.
    prior = {n: c for n, c in name_counts.items()}
    a0 = sum(prior.values())
    alpha_scale = 0.05  # prior strength

    def distinctive(mask, k=12, min_n=12):
        g = Counter(names[mask])
        rest_n = total - mask.sum()
        ng = mask.sum()
        out = []
        for n, y_i in g.items():
            if y_i < min_n:
                continue
            a_w = prior[n] * alpha_scale
            a_tot = a0 * alpha_scale
            y_j = name_counts[n] - y_i
            d = math.log((y_i + a_w) / (ng + a_tot - y_i - a_w)) - math.log((y_j + a_w) / (rest_n + a_tot - y_j - a_w))
            var = 1 / (y_i + a_w) + 1 / (y_j + a_w)
            z = d / math.sqrt(var)
            lift = (y_i / ng) / (name_counts[n] / total)
            out.append((z, n, y_i, lift))
        out.sort(reverse=True)
        return [{"name": n.title(), "n": int(c), "lift": round(l, 1)} for z, n, c, l in out[:k]]

    def groups(col, order=None, min_dogs=1500):
        vc = known[col].value_counts()
        keys = [k for k in (order or vc.index) if k in vc and vc[k] >= min_dogs]
        res = []
        for key in keys:
            mask = (known[col] == key).values
            top = Counter(names[mask]).most_common(5)
            res.append({
                "group": SIZE_NAMES.get(key, key), "dogs": int(mask.sum()),
                "distinctive": distinctive(mask),
                "popular": [{"name": n.title(), "n": int(c)} for n, c in top],
            })
        return res

    by_size = groups("size", SIZES)
    by_family = groups("family")
    by_job = groups("job")
    by_region = groups("region")
    top_breeds = known["breed"].value_counts()
    by_breed = groups("breed", list(top_breeds.index[:24]), min_dogs=800)
    # A photo for each breed card: the site's photo for study breeds, else a Dog CEO folder.
    photos = json.load(open(os.path.join(ROOT, "src", "data", "photos.json"), encoding="utf8"))
    explorer = {b["path"]: b["files"] for b in json.load(open(os.path.join(ROOT, "src", "data", "explorer.json"), encoding="utf8"))["breeds"]}
    DOGCEO = {"Pit Bull": "pitbull", "Poodle (size not given)": "poodle/standard", "Labradoodle": "labradoodle",
              "Cockapoo": "cockapoo", "Puggle": "puggle", "Plott Hound": "hound/plott", "Coonhound": "coonhound",
              "Affenpinscher": "affenpinscher", "Japanese Spitz": "spitz/japanese"}
    code_of = {row[0]: row[2] for row in B}
    # Wikimedia Commons photos (scripts/fetch-commons-photos.mjs) for breeds Dog CEO lacks.
    commons = json.load(open(os.path.join(ROOT, "src", "data", "commons.json"), encoding="utf8"))

    def photo_for(breed):
        code = code_of.get(breed)
        url = photos.get(code, {}).get("urls", [None])[0] if code else None
        if not url:
            url = (commons.get(f"code:{code}") or commons.get(f"name:{breed}") or {}).get("url")
        if not url and breed in DOGCEO:
            files = explorer.get(DOGCEO[breed])
            if files:
                url = f"https://images.dog.ceo/breeds/{DOGCEO[breed].replace('/', '-')}/{files[0]}"
        return url

    for g in by_breed:
        g["photo"] = photo_for(g["group"])
    print("groups:", len(by_size), len(by_family), len(by_job), len(by_region), len(by_breed))

    # ---------- can a name predict the breed? ----------
    def evaluate(target, top_k_classes=None, min_class=1500):
        sub = known[known[target].notna()]
        vc = sub[target].value_counts()
        classes = list(vc[vc >= min_class].index)
        if top_k_classes:
            classes = classes[:top_k_classes]
        sub = sub[sub[target].isin(classes)]
        X_tr, X_te, y_tr, y_te = train_test_split(sub["AnimalName"].values, sub[target].values, test_size=0.2,
                                                  random_state=7, stratify=sub[target].values)
        # Character pieces of the name ("mo", "moc", "och"...) plus the whole name.
        vec = CountVectorizer(analyzer="char_wb", ngram_range=(2, 4), min_df=3, binary=True)
        Xtr = vec.fit_transform(X_tr)
        Xte = vec.transform(X_te)
        clf = LogisticRegression(C=0.5, max_iter=400).fit(Xtr, y_tr)
        bal = float(balanced_accuracy_score(y_te, clf.predict(Xte)))
        proba = clf.predict_proba(Xte)
        top1 = clf.classes_[proba.argmax(1)]
        top3 = np.argsort(-proba, 1)[:, :3]
        acc = float((top1 == y_te).mean())
        acc3 = float(np.mean([y in clf.classes_[t] for y, t in zip(y_te, top3)]))
        base = float(pd.Series(y_tr).value_counts(normalize=True).iloc[0])
        base3 = float(pd.Series(y_tr).value_counts(normalize=True).iloc[:3].sum())
        return {"target": target, "classes": len(classes), "test_dogs": int(len(y_te)),
                "accuracy": round(acc, 3), "top3": round(acc3, 3), "baseline": round(base, 3),
                "baseline_top3": round(base3, 3), "lift": round(acc / base, 2),
                "balanced": round(bal, 3), "chance": round(1 / len(classes), 3)}

    model = [
        {**evaluate("breed", top_k_classes=20), "label": "Breed (20 most common)"},
        {**evaluate("size"), "label": "Size class"},
        {**evaluate("family", top_k_classes=10), "label": "Family group (10 largest)"},
        {**evaluate("job"), "label": "Original job"},
    ]
    for m in model:
        print(m)

    # ---------- name lookup for the interactive box ----------
    # Names with enough dogs to say something: their breed, size, and family mix
    # compared with all dogs.
    base_breed = known["breed"].value_counts(normalize=True)
    base_size = known["size"].value_counts(normalize=True)
    lookup = {}
    breed_index = list(top_breeds.index)
    for n, cnt in name_counts.items():
        if cnt < 25:
            continue
        sub = known[names == n]
        bshare = sub["breed"].value_counts()
        tops = []
        for b, c in bshare.items():
            lift = (c / cnt) / base_breed[b]
            tops.append((c / cnt * min(lift, 6), b, c, lift))
        tops.sort(reverse=True)
        szs = sub["size"].value_counts()
        lookup[n.title()] = {
            "n": int(cnt),
            "b": [[breed_index.index(b), int(c), round(l, 1)] for _, b, c, l in tops[:4]],
            "s": [int(szs.get(s, 0)) for s in SIZES],
        }
    print("lookup names:", len(lookup))

    # Names most tied to one breed (among common names).
    tied = []
    for n, v in lookup.items():
        if v["n"] < 60:
            continue
        bi, c, l = max(v["b"], key=lambda x: x[2])
        if c >= 15:
            tied.append({"name": n, "breed": breed_index[bi], "share": round(c / v["n"], 3), "lift": l, "n": v["n"]})
    tied.sort(key=lambda x: -x["lift"])
    # Several give-away names point at the same breed (five huskies, three Shibas), so
    # each repeat gets a different photo from that breed's Dog CEO folder.
    dogceo_map = json.load(open(os.path.join(ROOT, "scripts", "dogceo-map.json"), encoding="utf8"))
    seen = Counter()
    for t in tied:
        code = code_of.get(t["breed"])
        path = dogceo_map.get(code) if code else DOGCEO.get(t["breed"])
        files = explorer.get(path) if path else None
        if files:
            k = seen[t["breed"]]
            seen[t["breed"]] += 1
            pick = files[(k * 7 + 3) % len(files)] if k else files[0]
            t["photo"] = f"https://images.dog.ceo/breeds/{path.replace('/', '-')}/{pick}"
        else:
            t["photo"] = photo_for(t["breed"])

    out = {
        "source": {"records": raw_records, "dogs": unique_dogs, "named": int(len(named)), "used": int(total),
                   "years": sorted(df["Extract Year"].dropna().unique().tolist())},
        "top_names": [{"name": n.title(), "n": int(c)} for n, c in name_counts.most_common(15)],
        "size_order": [SIZE_NAMES[s] for s in SIZES],
        "base_size": [round(float(base_size.get(s, 0)), 4) for s in SIZES],
        "breeds": breed_index,
        "groups": {"size": by_size, "family": by_family, "job": by_job, "region": by_region, "breed": by_breed},
        "model": model,
        "tied": tied[:24],
        "lookup": lookup,
    }
    with open(OUT, "w", encoding="utf8") as f:
        json.dump(out, f, separators=(",", ":"))
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
