"""
Dog Breed Game data: quiz photos from the Dog CEO API, each with a pretrained classifier's
top guesses, plus the breed pools for each difficulty.

Pools
  easy    the 30 highest-ranked AKC 2025 breeds that have photos on Dog CEO
  medium  the 60 highest-ranked AKC 2025 breeds that have photos on Dog CEO
  hard    the 120 dog breeds the classifier was trained on (the Stanford Dogs / ImageNet
          dog classes), under modern breed names

Classifier: torchvision ResNet-50 with IMAGENET1K_V2 weights (top-1 80.9% on ImageNet).
For each photo we keep its top 3 ImageNet classes. The model only knows the 120 ImageNet
dog breeds, so for AKC breeds outside that set it can never be right; the game says so.
Note: most Dog CEO photos come from the Stanford Dogs dataset, which was built from
ImageNet, so the model may have seen some of these photos in training.

Inputs (cached in .cache/game/): imagenet_class_index.json, Dog CEO folder listings.
Output: src/data/game.json
Run from cladogram/ with torch + torchvision on PYTHONPATH:  python scripts/build-dog-game.py
"""
import json
import os
import random
import re
import time
import urllib.request

import torch
from PIL import Image
from torchvision.models import ResNet50_Weights, resnet50

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "game")
OUT = os.path.join(ROOT, "src", "data", "game.json")
PER_BREED = 8
MIN_PHOTOS = 4
UA = {"User-Agent": "DogGenes/1.0 (https://github.com/mforando/DogGenes; educational site)"}

# AKC breed name -> Dog CEO folders (several folders pool together, e.g. the poodle sizes).
AKC_FOLDERS = {
    "French Bulldog": ["bulldog/french"], "Labrador Retriever": ["labrador"], "Golden Retriever": ["retriever/golden"],
    "German Shepherd Dog": ["german/shepherd"], "Dachshund": ["dachshund"],
    "Poodle": ["poodle/standard", "poodle/miniature", "poodle/toy"], "Beagle": ["beagle"], "Rottweiler": ["rottweiler"],
    "German Shorthaired Pointer": ["pointer/german"], "Bulldog": ["bulldog/english"],
    "Cavalier King Charles Spaniel": ["spaniel/blenheim"], "Yorkshire Terrier": ["terrier/yorkshire"],
    "Australian Shepherd": ["australian/shepherd"], "Doberman Pinscher": ["doberman"], "Pembroke Welsh Corgi": ["pembroke"],
    "Miniature Schnauzer": ["schnauzer/miniature"], "Boxer": ["boxer"], "Pomeranian": ["pomeranian"],
    "Bernese Mountain Dog": ["mountain/bernese"], "Shih Tzu": ["shihtzu"], "Great Dane": ["dane/great"],
    "Boston Terrier": ["bulldog/boston"], "Chihuahua": ["chihuahua"], "Havanese": ["havanese"],
    "Border Collie": ["collie/border"], "English Springer Spaniel": ["springer/english"],
    "Shetland Sheepdog": ["sheepdog/shetland"], "Siberian Husky": ["husky"], "Brittany": ["spaniel/brittany"],
    "Belgian Malinois": ["malinois"], "Cocker Spaniel": ["spaniel/cocker"], "Basset Hound": ["hound/basset"],
    "Vizsla": ["vizsla"], "Maltese": ["maltese"], "Pug": ["pug"], "Collie": ["collie"], "Mastiff": ["mastiff/english"],
    "Rhodesian Ridgeback": ["ridgeback/rhodesian"], "Papillon": ["papillon"], "Shiba Inu": ["shiba"],
    "West Highland White Terrier": ["terrier/westhighland"], "Newfoundland": ["newfoundland"],
    "Australian Cattle Dog": ["cattledog/australian"], "Whippet": ["whippet"], "Bichon Frise": ["frise/bichon"],
    "Dalmatian": ["dalmatian"], "Giant Schnauzer": ["schnauzer/giant"], "Italian Greyhound": ["greyhound/italian"],
    "Weimaraner": ["weimaraner"], "Samoyed": ["samoyed"], "Chesapeake Bay Retriever": ["retriever/chesapeake"],
    "Scottish Terrier": ["terrier/scottish"], "Bloodhound": ["hound/blood"], "Russell Terrier": ["terrier/russell"],
    "Staffordshire Bull Terrier": ["bullterrier/staffordshire"], "Akita": ["akita"], "Saint Bernard": ["stbernard"],
    "Cardigan Welsh Corgi": ["corgi/cardigan"], "Great Pyrenees": ["pyrenees"], "Miniature Pinscher": ["pinscher/miniature"],
    "Cairn Terrier": ["terrier/cairn"], "Airedale Terrier": ["airedale"], "Greater Swiss Mountain Dog": ["mountain/swiss"],
    "Irish Setter": ["setter/irish"], "Irish Wolfhound": ["wolfhound/irish"], "Soft Coated Wheaten Terrier": ["terrier/wheaten"],
    "Bullmastiff": ["mastiff/bull"], "Coton de Tulear": ["cotondetulear"], "Alaskan Malamute": ["malamute"],
    "Brussels Griffon": ["brabancon"], "Lhasa Apso": ["lhasa"], "Keeshond": ["keeshond"],
}

# Modern names for the ImageNet / Stanford Dogs labels.
RENAME = {
    "Japanese_spaniel": "Japanese Chin", "Maltese_dog": "Maltese", "Pekinese": "Pekingese", "Shih-Tzu": "Shih Tzu",
    "Blenheim_spaniel": "Cavalier King Charles Spaniel", "toy_terrier": "English Toy Terrier", "Walker_hound": "Treeing Walker Coonhound",
    "English_foxhound": "English Foxhound", "black-and-tan_coonhound": "Black and Tan Coonhound", "Saluki": "Saluki",
    "Staffordshire_bullterrier": "Staffordshire Bull Terrier", "American_Staffordshire_terrier": "American Staffordshire Terrier",
    "Kerry_blue_terrier": "Kerry Blue Terrier", "wire-haired_fox_terrier": "Wire Fox Terrier", "Lakeland_terrier": "Lakeland Terrier",
    "Sealyham_terrier": "Sealyham Terrier", "Airedale": "Airedale Terrier", "cairn": "Cairn Terrier", "Dandie_Dinmont": "Dandie Dinmont Terrier",
    "Boston_bull": "Boston Terrier", "miniature_schnauzer": "Miniature Schnauzer", "giant_schnauzer": "Giant Schnauzer",
    "standard_schnauzer": "Standard Schnauzer", "Scotch_terrier": "Scottish Terrier", "silky_terrier": "Silky Terrier",
    "soft-coated_wheaten_terrier": "Soft Coated Wheaten Terrier", "West_Highland_white_terrier": "West Highland White Terrier",
    "Lhasa": "Lhasa Apso", "flat-coated_retriever": "Flat-coated Retriever", "curly-coated_retriever": "Curly-coated Retriever",
    "German_short-haired_pointer": "German Shorthaired Pointer", "vizsla": "Vizsla", "English_setter": "English Setter",
    "Brittany_spaniel": "Brittany", "clumber": "Clumber Spaniel", "English_springer": "English Springer Spaniel",
    "Welsh_springer_spaniel": "Welsh Springer Spaniel", "cocker_spaniel": "Cocker Spaniel", "Sussex_spaniel": "Sussex Spaniel",
    "Irish_water_spaniel": "Irish Water Spaniel", "kuvasz": "Kuvasz", "schipperke": "Schipperke", "groenendael": "Belgian Sheepdog",
    "malinois": "Belgian Malinois", "briard": "Briard", "kelpie": "Australian Kelpie", "komondor": "Komondor",
    "Old_English_sheepdog": "Old English Sheepdog", "Shetland_sheepdog": "Shetland Sheepdog", "collie": "Collie",
    "Border_collie": "Border Collie", "Bouvier_des_Flandres": "Bouvier des Flandres", "German_shepherd": "German Shepherd Dog",
    "Doberman": "Doberman Pinscher", "miniature_pinscher": "Miniature Pinscher", "Greater_Swiss_Mountain_dog": "Greater Swiss Mountain Dog",
    "Bernese_mountain_dog": "Bernese Mountain Dog", "Appenzeller": "Appenzeller Sennenhund", "EntleBucher": "Entlebucher Mountain Dog",
    "boxer": "Boxer", "bull_mastiff": "Bullmastiff", "Tibetan_mastiff": "Tibetan Mastiff", "French_bulldog": "French Bulldog",
    "Great_Dane": "Great Dane", "Saint_Bernard": "Saint Bernard", "Eskimo_dog": "American Eskimo Dog", "malamute": "Alaskan Malamute",
    "Siberian_husky": "Siberian Husky", "affenpinscher": "Affenpinscher", "basenji": "Basenji", "pug": "Pug", "Leonberg": "Leonberger",
    "Newfoundland": "Newfoundland", "Great_Pyrenees": "Great Pyrenees", "Samoyed": "Samoyed", "Pomeranian": "Pomeranian",
    "chow": "Chow Chow", "keeshond": "Keeshond", "Brabancon_griffon": "Brussels Griffon", "Pembroke": "Pembroke Welsh Corgi",
    "Cardigan": "Cardigan Welsh Corgi", "toy_poodle": "Toy Poodle", "miniature_poodle": "Miniature Poodle",
    "standard_poodle": "Standard Poodle", "Mexican_hairless": "Xoloitzcuintli", "dingo": "Dingo", "dhole": "Dhole",
    "African_hunting_dog": "African Wild Dog", "Rhodesian_ridgeback": "Rhodesian Ridgeback", "Afghan_hound": "Afghan Hound",
    "basset": "Basset Hound", "beagle": "Beagle", "bloodhound": "Bloodhound", "bluetick": "Bluetick Coonhound",
    "redbone": "Redbone Coonhound", "borzoi": "Borzoi", "Irish_wolfhound": "Irish Wolfhound", "Italian_greyhound": "Italian Greyhound",
    "whippet": "Whippet", "Ibizan_hound": "Ibizan Hound", "Norwegian_elkhound": "Norwegian Elkhound", "otterhound": "Otterhound",
    "Scottish_deerhound": "Scottish Deerhound", "Weimaraner": "Weimaraner", "Bedlington_terrier": "Bedlington Terrier",
    "Border_terrier": "Border Terrier", "Irish_terrier": "Irish Terrier", "Norfolk_terrier": "Norfolk Terrier",
    "Norwich_terrier": "Norwich Terrier", "Yorkshire_terrier": "Yorkshire Terrier", "Australian_terrier": "Australian Terrier",
    "Tibetan_terrier": "Tibetan Terrier", "golden_retriever": "Golden Retriever", "Labrador_retriever": "Labrador Retriever",
    "Chesapeake_Bay_retriever": "Chesapeake Bay Retriever", "Irish_setter": "Irish Setter", "Gordon_setter": "Gordon Setter",
    "Chihuahua": "Chihuahua", "papillon": "Papillon", "toy_terrier": "English Toy Terrier", "Shih-Tzu": "Shih Tzu",
    "Rottweiler": "Rottweiler", "Italian_greyhound": "Italian Greyhound",
}


# Game names that the 2017 study spells differently.
STUDY_ALIAS = {
    "English Toy Terrier": "Toy Manchester Terrier", "English Foxhound": "Foxhound", "Australian Kelpie": "Kelpie",
    "Cocker Spaniel": "American Cocker Spaniel", "Mastiff": "English Mastiff", "Russell Terrier": "Jack Russell Terrier",
    "Poodle": "Standard Poodle",
}


def related_answers(out_breeds):
    """Harder wrong answers from the study (Parker et al. 2017), across all its breeds: other
    breeds in the same clade, and breeds in other clades that share significant DNA."""
    study = json.load(open(os.path.join(ROOT, "src", "data", "cladogram.json"), encoding="utf8"))
    B = study["breeds"]
    norm = lambda x: re.sub(r"[^a-z]", "", x.lower())
    code_of = {norm(v["name"]): k for k, v in B.items()}
    game_code = {}
    for b in out_breeds:
        c = code_of.get(norm(STUDY_ALIAS.get(b["name"], b["name"])))
        if c:
            game_code[b["id"]] = c
    # Show study breeds under the game's name when the game has them (one name per breed).
    shown = {c: next(b["name"] for b in out_breeds if b["id"] == bid) for bid, c in game_code.items()}
    name = lambda c: shown.get(c, B[c]["name"])
    wild = {"WOLF", "GDJK"}
    for b in out_breeds:
        c = game_code.get(b["id"])
        b["clade"] = [] if not c else sorted(
            name(k) for k, v in B.items() if k != c and k not in wild and B[c]["clade"] and v["clade"] == B[c]["clade"]
        )
        kin = []
        if c:
            for a, z, v in sorted(study["links"], key=lambda l: -l[2]):
                if c in (a, z):
                    o = z if a == c else a
                    if o not in wild and (B[o]["clade"] != B[c]["clade"] or not B[c]["clade"]):
                        kin.append(name(o))
        b["dna"] = [k for k in dict.fromkeys(kin) if k != b["name"]][:8]
        b["clade"] = [k for k in b["clade"] if k != b["name"]]
    return sum(1 for b in out_breeds if b["clade"]), sum(1 for b in out_breeds if b["dna"])


def pretty(label: str) -> str:
    return RENAME.get(label) or label.replace("_", " ").title()


def main():
    torch.set_num_threads(max(1, os.cpu_count() - 1))
    idx = json.load(open(os.path.join(CACHE, "imagenet_class_index.json")))
    syn_of_class = {int(k): v[0] for k, v in idx.items()}
    label_of_syn = {v[0]: v[1] for v in idx.values()}
    images = json.load(open(os.path.join(CACHE, "images.json")))
    folder_syn = json.load(open(os.path.join(CACHE, "folder_synset.json")))
    stanford = sorted(d.split("-", 1)[0] for d in os.listdir(os.environ["STANFORD_ANN"]))

    # ---------- breed entities ----------
    breeds = {}  # id -> {name, folders, synsets, akc, pools}

    def add(bid, name, folders, synsets, akc=None):
        b = breeds.setdefault(bid, {"name": name, "folders": folders, "synsets": synsets, "akc": akc, "pools": []})
        if akc and not b["akc"]:
            b["akc"] = akc

    syn_folder = {}
    for f, s in folder_syn.items():
        if s in stanford and len(images.get(f, [])) > len(images.get(syn_folder.get(s, ""), [])):
            syn_folder[s] = f
    for s in stanford:
        add(s, pretty(label_of_syn[s]), [syn_folder[s]], [s])

    akc = json.load(open(os.path.join(ROOT, "src", "data", "akc.json"), encoding="utf8"))
    ranked = sorted((b for b in akc["breeds"] if b["r"][-1]), key=lambda b: b["r"][-1])
    akc_ids = []
    for b in ranked:
        folders = [f for f in AKC_FOLDERS.get(b["name"], []) if len(images.get(f, [])) > 0]
        if sum(len(images[f]) for f in folders) < MIN_PHOTOS:
            continue
        syns = sorted({folder_syn[f] for f in folders if folder_syn.get(f) in stanford})
        # One Stanford folder = same breed as the hard-mode entry; otherwise its own entry.
        bid = syns[0] if len(folders) == 1 and len(syns) == 1 else "akc:" + re.sub(r"[^a-z]+", "-", b["name"].lower())
        add(bid, b["name"], folders, syns, b["r"][-1])
        breeds[bid]["name"] = b["name"]  # AKC naming wins for shared entries
        akc_ids.append(bid)
        if len(akc_ids) == 60:
            break
    for i, bid in enumerate(akc_ids):
        breeds[bid]["pools"].append("medium")
        if i < 30:
            breeds[bid]["pools"].append("easy")
    for s in stanford:
        breeds[s]["pools"].append("hard")

    # ---------- photos ----------
    rng = random.Random(7)
    os.makedirs(os.path.join(CACHE, "img"), exist_ok=True)
    weights = ResNet50_Weights.IMAGENET1K_V2
    model = resnet50(weights=weights).eval()
    prep = weights.transforms()
    names_by_syn = {s: b["name"] for s, b in breeds.items() if not s.startswith("akc:")}

    def classify(path):
        with torch.no_grad():
            x = prep(Image.open(path).convert("RGB")).unsqueeze(0)
            p = torch.softmax(model(x)[0], 0)
            top = torch.topk(p, 3)
        return [(syn_of_class[int(i)], float(v)) for v, i in zip(top.values, top.indices)]

    done = 0
    for bid, b in breeds.items():
        pool = [u for f in b["folders"] for u in images.get(f, [])]
        pick = rng.sample(pool, min(PER_BREED, len(pool)))
        photos = []
        for u in pick:
            fn = os.path.join(CACHE, "img", u.split("/breeds/", 1)[1].replace("/", "__"))
            if not os.path.exists(fn):
                try:
                    open(fn, "wb").write(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read())
                    time.sleep(0.05)
                except Exception as e:
                    print("skip", u, e)
                    continue
            try:
                top = classify(fn)
            except Exception as e:
                print("bad image", u, e)
                continue
            photos.append({
                "u": u,
                # Top-3 guesses: [name, probability]
                "ai": [[names_by_syn.get(s) or pretty(label_of_syn[s]), round(p, 3)] for s, p in top],
                "ok": top[0][0] in b["synsets"],
            })
        b["photos"] = photos
        done += 1
        if done % 20 == 0:
            print(done, "breeds")

    out = {
        "model": "ResNet-50 (torchvision, IMAGENET1K_V2 weights)",
        "breeds": [
            {"id": bid, "name": b["name"], "akc": b["akc"], "pools": b["pools"], "aiKnows": bool(b["synsets"]), "photos": b["photos"]}
            for bid, b in breeds.items() if b["pools"] and len(b["photos"]) >= MIN_PHOTOS
        ],
    }
    nc, nd = related_answers(out["breeds"])
    print(f"wrong answers: {nc} breeds have clade-mates, {nd} have cross-clade DNA relatives")
    for pool in ("easy", "medium", "hard"):
        bs = [b for b in out["breeds"] if pool in b["pools"]]
        acc = sum(p["ok"] for b in bs for p in b["photos"]) / max(1, sum(len(b["photos"]) for b in bs))
        print(f"{pool}: {len(bs)} breeds, AI top-1 accuracy on these photos {acc:.0%}")
    json.dump(out, open(OUT, "w", encoding="utf8"), separators=(",", ":"), ensure_ascii=False)
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
