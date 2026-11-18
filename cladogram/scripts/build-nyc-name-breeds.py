"""
NYC dog names by breed: for each name the names page shows next to a breed, how the dogs with
that name split across breeds (the circle-packing tooltip on the names page).

Input   .cache/nyc/dogs.csv, .cache/nyc/meta.json (as build-nyc-names.py), src/data/nycnames.json
Output  src/data/nycnamebreeds.json

Run from cladogram/, after build-nyc-names.py:  python scripts/build-nyc-name-breeds.py
"""
import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("nycnames", os.path.join(ROOT, "scripts", "build-nyc-names.py"))
nyc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nyc)

NAMES_JSON = os.path.join(ROOT, "src", "data", "nycnames.json")
TREE = os.path.join(ROOT, "src", "data", "cladogram.json")
OUT = os.path.join(ROOT, "src", "data", "nycnamebreeds.json")
TOP = 24  # breeds drawn per name; the rest are summed as "other breeds"


def main():
    _, _, _, known, _ = nyc.load()
    shown = json.load(open(NAMES_JSON, encoding="utf8"))
    tree = json.load(open(TREE, encoding="utf8"))

    # Every (name, breed) pair the page shows: breed cards, other breeds, most tied names.
    pairs = {}
    for g in shown["groups"]["breed"] + shown["more_breeds"]:
        for item in (g.get("distinctive") or [])[:8]:
            pairs.setdefault(item["name"], set()).add(g["group"])
    for t in shown["tied"]:
        pairs.setdefault(t["name"], set()).add(t["breed"])

    # Each breed's family on the site's tree (for colour): its study code, or the code or group
    # it borrows its family from (build-nyc-names.py's breed table).
    clade_by_name = {v: k for k, v in tree["clades"].items()}
    family = {}
    for row in nyc.B:
        name, _, code, *rest = row
        fam_from = (rest[1:2] or [None])[0]
        src = code or (fam_from if fam_from and not fam_from.startswith("=") else None)
        if src and src in tree["breeds"]:
            family[name] = tree["breeds"][src]["clade"]
        elif fam_from and fam_from.startswith("="):
            family[name] = clade_by_name.get(fam_from[1:])
        else:
            family[name] = None

    breeds, index = [], {}
    out = {}
    upper = known["AnimalName"]
    for name, ctx in sorted(pairs.items()):
        counts = known.loc[upper == name.upper(), "breed"].value_counts()
        if counts.empty:
            continue
        keep = list(counts.index[:TOP])
        for b in ctx:  # the breed the page pairs it with is always drawn
            if b in counts.index and b not in keep:
                keep.append(b)
        rows = []
        for b in keep:
            if b not in index:
                index[b] = len(breeds)
                breeds.append(b)
            rows.append([index[b], int(counts[b])])
        rest = counts.drop(keep)
        out[name] = {"n": int(counts.sum()), "b": rows, "other": [int(rest.sum()), int(len(rest))]}

    data = {"breeds": breeds, "clade": [family.get(b) for b in breeds], "names": out}
    with open(OUT, "w", encoding="utf8") as fh:
        json.dump(data, fh, separators=(",", ":"))
    print(f"{len(out)} names, {len(breeds)} breeds -> {OUT} ({os.path.getsize(OUT) // 1024} KB)")


if __name__ == "__main__":
    main()
