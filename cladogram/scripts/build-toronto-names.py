"""
New York vs. Toronto dog names: each city's top names, the names one city uses far more
than the other (dogs licensed in the same year), and each name's share of dogs year by
year in both cities.

Input   .cache/toronto/dogs-2012.xls … dogs-2019.xls   City of Toronto Open Data,
            "Licensed Dog and Cat Names": every licensed dog's name, with counts
        .cache/nyc/dogs.csv            NYC Dog Licensing Dataset
Output  src/data/torontonames.json

Toronto publishes names and counts only (no breed, sex or location), so only names are
compared. 2012-2019 are Toronto's complete name lists. For 2020-2025 Toronto publishes
only its top 200 names, so a name's share is shown only in years it made the top 200,
divided by the city's official count of licensed dogs that year:
        .cache/toronto/since2020.csv     top 200 names per year ("Licensed Dog and Cat Names")
        .cache/toronto/fsa-YYYY.xls      licence totals 2020-2022 ("Licensed Dogs and Cats Reports")
        .cache/toronto/licences.csv      one row per licence, 2023 on ("Licensed Dogs and Cats")

Run from cladogram/:  python scripts/build-toronto-names.py   (needs pandas, xlrd)
"""
import json
import math
import os
import urllib.request
from collections import Counter

import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "toronto")
NYC = os.path.join(ROOT, ".cache", "nyc", "dogs.csv")
OUT = os.path.join(ROOT, "src", "data", "torontonames.json")
PACKAGE = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=licensed-dog-and-cat-names"
YEAR = 2019  # the head-to-head year: Toronto's last complete list
TORONTO_YEARS = list(range(2012, 2020))  # complete name lists
TOP200_YEARS = list(range(2020, 2026))  # top 200 only; 2026 is still in progress
CKAN = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id="
NYC_YEARS = list(range(2015, 2026))  # by license issue year; 2014 has only ~1,500 records
TREND_MIN = 30  # a name needs this many dogs in some year, in either city, for the lookup

# Same cleaning as the NYC page: placeholders, breed words typed as names, designer-cross names.
PLACEHOLDER = {"UNKNOWN", "NAME NOT PROVIDED", "NAME", "NONE", "N/A", "NA", "NOT PROVIDED", "NO NAME", "UNKNOW",
               "UNKOWN", "DOG", "NULL", "", ".", "-", "X", "XX", "TBD", "NAMENOTPROVIDED", "UNNAMED", "NONAME",
               "PUPPY", "PUP", "N.A.", "NA.", "NOT", "NO", "UNK", "UNKNOWED", "UNKNWON", "UKNOWN", "MR.", "MR", "MRS.",
               "MS."}
BREED_WORDS = {"YORKIE", "FRENCHIE", "DOXIE", "AUSSIE", "POM", "CORGI", "HUSKY", "COCKER", "CAVALIER", "SCHNAUZER",
               "BICHON", "SHIHTZU", "LAB", "PIT", "PITBULL", "BULLDOG", "TERRIER", "SHEPHERD", "RETRIEVER", "SPANIEL",
               "HOUND", "COLLIE", "BEAGLE", "POODLE", "CHIHUAHUA", "MALTESE", "PUG", "BOXER", "DOODLE"}


def fetch(year):
    """Download Toronto's name list for one year into the cache if it isn't there yet."""
    path = os.path.join(CACHE, f"dogs-{year}.xls")
    if os.path.exists(path):
        return path
    os.makedirs(CACHE, exist_ok=True)
    for r in json.load(urllib.request.urlopen(PACKAGE))["result"]["resources"]:
        if "dogs" in r["name"] and r["name"].endswith(str(year)):
            urllib.request.urlretrieve(r["url"], path)
            return path
    raise SystemExit(f"no Toronto dog-name list for {year}")


def fetch_top200():
    """Top-200 name counts since 2020 and the official licensed-dog totals for those years."""
    files = {
        "since2020.csv": ("licensed-dog-and-cat-names", lambda r: r.get("datastore_active")),
        "licences.csv": ("licensed-dogs-and-cats", lambda r: r.get("datastore_active")),
    }
    for y in (2020, 2021, 2022):
        files[f"fsa-{y}.xls"] = ("licensed-dogs-and-cats-reports", lambda r, y=y: "forward-sortation" in r["name"] and str(y) in r["name"])
    for fname, (package, match) in files.items():
        path = os.path.join(CACHE, fname)
        if os.path.exists(path):
            continue
        r = next(r for r in json.load(urllib.request.urlopen(CKAN + package))["result"]["resources"] if match(r))
        url = f"https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/{r['id']}" if r.get("datastore_active") else r["url"]
        urllib.request.urlretrieve(url, path)

    c = pd.read_csv(os.path.join(CACHE, "since2020.csv"))
    c = c[c["ANIMAL_TYPE"] == "DOG"].copy()
    c["ANIMAL_NAME"] = norm(c["ANIMAL_NAME"])
    counts = {y: Counter({k: int(v) for k, v in zip(g["ANIMAL_NAME"], g["AnimalCnt"])}) for y, g in c.groupby("Year") if y in TOP200_YEARS}

    totals = {}
    for y in (2020, 2021, 2022):
        # Report layouts vary: find the DOG column in the header row, then the "Total" row.
        d = pd.read_excel(os.path.join(CACHE, f"fsa-{y}.xls"), header=None)
        cells = lambda row: [(j, v) for j, v in enumerate(row) if isinstance(v, str)]
        col = next(j for _, row in d.iterrows() for j, v in cells(row) if v.strip().upper() == "DOG")
        total = next(row[col] for _, row in d.iterrows() for _, v in cells(row)
                     if v.strip().lower() == "total" and isinstance(row[col], (int, float)) and not pd.isna(row[col]))
        totals[y] = int(total)
    lic = pd.read_csv(os.path.join(CACHE, "licences.csv"), usecols=["Year", "ANIMAL_TYPE"])
    for y, n in lic[lic["ANIMAL_TYPE"] == "DOG"].groupby("Year").size().items():
        if y in TOP200_YEARS:
            totals[int(y)] = int(n)
    return counts, totals


def keep(s):
    """Mask of real names (drops placeholders, breed words and designer-cross names)."""
    return (~s.isin(PLACEHOLDER) & ~s.isin(BREED_WORDS) & s.str.match(r"^[A-Z][A-Z .'\-]*$") & (s.str.len() > 1)
            & ~s.str.contains(r"-?POO$|DOODLE$", regex=True))


def norm(s):
    return s.fillna("").astype(str).str.strip().str.upper().str.replace(r"\s+", " ", regex=True)


def load_toronto(path):
    d = pd.read_excel(path, header=None, names=["name", "n"])
    d = d[pd.to_numeric(d["n"], errors="coerce").notna()].copy()
    d["name"] = norm(d["name"])
    d = d[keep(d["name"]).values]
    return Counter({k: int(v) for k, v in d.groupby("name")["n"].sum().items()})


def load_nyc():
    """NYC dogs by license issue year, each year de-duplicated like the NYC page."""
    df = pd.read_csv(NYC, dtype=str)
    df["year"] = pd.to_datetime(df["LicenseIssuedDate"], errors="coerce").dt.year
    df["AnimalName"] = norm(df["AnimalName"])
    out = {}
    for y in NYC_YEARS:
        dogs = df[df["year"] == y].drop_duplicates(["AnimalName", "AnimalGender", "AnimalBirthYear", "BreedName", "ZipCode"])
        out[y] = Counter(dogs["AnimalName"][keep(dogs["AnimalName"]).values])
    return out


def fightin_words(a, b, k=15, min_n=25, alpha_scale=0.05):
    """Names most over-represented in a vs b: log-odds with an informative Dirichlet prior
    (Monroe, Colaresi & Quinn 2008), the same method as the NYC page."""
    both = a + b
    na, nb, a0 = sum(a.values()), sum(b.values()), sum(both.values()) * alpha_scale
    out = []
    for n, ya in a.items():
        if ya < min_n:
            continue
        yb = b.get(n, 0)
        aw = both[n] * alpha_scale
        d = math.log((ya + aw) / (na + a0 - ya - aw)) - math.log((yb + aw) / (nb + a0 - yb - aw))
        z = d / math.sqrt(1 / (ya + aw) + 1 / (yb + aw))
        out.append((z, n, ya, (ya / na) / ((yb + 0.5) / nb)))
    out.sort(reverse=True)
    return [{"name": n.title(), "n": int(c), "lift": round(l, 1)} for z, n, c, l in out[:k]]


def top(counter, k=10):
    total = sum(counter.values())
    return [{"name": n.title(), "n": int(c), "share": round(c / total, 4)} for n, c in counter.most_common(k)]


def per_10k(years, totals=None, missing=0):
    """Each name's dogs per 10,000 licensed dogs, by year (`missing` where the name isn't listed)."""
    totals = totals or {y: sum(c.values()) for y, c in years.items()}
    return lambda name: [round(c[name] / totals[y] * 10000, 1) if c.get(name) else missing for y, c in years.items()]


def main():
    tor_years = {y: load_toronto(fetch(y)) for y in TORONTO_YEARS}
    nyc_years = load_nyc()
    tor, nyc = tor_years[YEAR], nyc_years[YEAR]

    # Lookup: names common enough in either city, with both cities' trends.
    names = sorted({n for years in (tor_years, nyc_years) for c in years.values() for n, k in c.items() if k >= TREND_MIN})
    top200, top200_totals = fetch_top200()
    t_share, n_share = per_10k(tor_years), per_10k(nyc_years)
    # Since 2020: only names in that year's top 200 have a count (None = not in the top 200).
    t200 = per_10k(top200, top200_totals, missing=None)
    trend = {n.title(): {"t": t_share(n) + t200(n), "n": n_share(n)} for n in names}

    out = {
        "source": {
            "year": YEAR,
            "toronto_dogs": int(sum(tor.values())),
            "nyc_dogs": int(sum(nyc.values())),
            "toronto_years": TORONTO_YEARS + TOP200_YEARS,
            "toronto_full_years": TORONTO_YEARS,
            "toronto_totals_since_2020": top200_totals,
            "nyc_years": NYC_YEARS,
            "trend_min": TREND_MIN,
        },
        "top": {"toronto": top(tor), "nyc": top(nyc)},
        "vs": {"toronto": fightin_words(tor, nyc), "nyc": fightin_words(nyc, tor)},
        "trend": trend,
    }
    with open(OUT, "w", encoding="utf8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"{YEAR}: Toronto {out['source']['toronto_dogs']} dogs, NYC {out['source']['nyc_dogs']} dogs")
    print("top toronto:", [t["name"] for t in out["top"]["toronto"]])
    print("top nyc:", [t["name"] for t in out["top"]["nyc"]])
    print("toronto>nyc:", [(x["name"], x["lift"]) for x in out["vs"]["toronto"]])
    print("nyc>toronto:", [(x["name"], x["lift"]) for x in out["vs"]["nyc"]])
    print("top-200 years totals:", top200_totals)
    print("trend names:", len(trend), "| Luna:", trend.get("Luna"), "| Maple:", trend.get("Maple"))
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
