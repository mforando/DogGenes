"""
Builds the Breed Explorer mosaic from the Dog CEO API (https://dog.ceo/dog-api/).

For every breed folder in the API, downloads every photo, crops it to a small square
thumbnail, and packs the thumbnails into JPEG sprite sheets the page draws on a canvas
(thousands of separate <img> requests would be far too slow). Full-size photos are still
loaded from the API when a visitor opens one.

Outputs
  public/explorer/sheet-N.jpg   sprite sheets (TILE px squares, COLS per row)
  src/data/explorer.json        breeds, their tile ranges, and photo file names

Thumbnails are cached in .cache/explorer/ so re-runs only fetch new photos.
Run:  python scripts/build-explorer.py      (from cladogram/; needs Pillow)
"""
import io
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "explorer")
OUT_DIR = os.path.join(ROOT, "public", "explorer")
DATA = os.path.join(ROOT, "src", "data", "explorer.json")

TILE = 48          # thumbnail size in px (drawn at ~24px, sharp on 2x screens)
COLS = 40          # tiles per sheet row  -> 1920px wide sheets
ROWS = 40          # tiles per sheet column
PER_SHEET = COLS * ROWS
QUALITY = 72
WORKERS = 16
UA = {"User-Agent": "DogGenes-breed-explorer/1.0 (https://github.com/mforando/DogGenes)"}


def get_json(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception:
            time.sleep(1 + attempt * 2)
    raise RuntimeError(f"failed: {url}")


def thumb_path(folder, file):
    return os.path.join(CACHE, folder, os.path.splitext(file)[0] + ".jpg")


def make_thumb(folder, file):
    """Download one photo and save a centred square thumbnail (cached)."""
    dest = thumb_path(folder, file)
    if os.path.exists(dest):
        return True
    url = f"https://images.dog.ceo/breeds/{folder}/{file}"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                img = Image.open(io.BytesIO(r.read())).convert("RGB")
            w, h = img.size
            s = min(w, h)
            # Dogs' heads sit in the upper half of most photos; bias the crop upward.
            left = (w - s) // 2
            top = int((h - s) * 0.35)
            img = img.crop((left, top, left + s, top + s)).resize((TILE, TILE), Image.LANCZOS)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            img.save(dest, "JPEG", quality=90)
            return True
        except Exception:
            time.sleep(1 + attempt * 2)
    return False


def main():
    listing = get_json("https://dog.ceo/api/breeds/list/all")["message"]
    paths = []
    for breed, subs in listing.items():
        paths += [f"{breed}/{s}" for s in subs] if subs else [breed]

    # Photo lists per folder (a base breed's list includes its sub-breeds; keep exact folder).
    breeds = []
    for p in paths:
        folder = p.replace("/", "-")
        urls = get_json(f"https://dog.ceo/api/breed/{p}/images")["message"]
        files = sorted(u.rsplit("/", 1)[1] for u in urls if f"/breeds/{folder}/" in u)
        breeds.append({"path": p, "folder": folder, "files": files})
    total = sum(len(b["files"]) for b in breeds)
    print(f"{len(breeds)} breed folders, {total} photos", flush=True)

    jobs = [(b["folder"], f) for b in breeds for f in b["files"]]
    ok = set()
    done = 0
    with ThreadPoolExecutor(WORKERS) as pool:
        futs = {pool.submit(make_thumb, folder, f): (folder, f) for folder, f in jobs}
        for fut in as_completed(futs):
            done += 1
            if fut.result():
                ok.add(futs[fut])
            if done % 500 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)} ({len(ok)} ok)", flush=True)

    # Pack sheets in breed order.
    os.makedirs(OUT_DIR, exist_ok=True)
    for f in os.listdir(OUT_DIR):
        if f.startswith("sheet-"):
            os.remove(os.path.join(OUT_DIR, f))
    index = 0
    sheet = None
    out_breeds = []
    colors = []  # average colour of each thumbnail's centre, where the dog usually is
    for b in breeds:
        kept = [f for f in b["files"] if (b["folder"], f) in ok]
        if not kept:
            continue
        out_breeds.append({"path": b["path"], "start": index, "files": kept})
        for f in kept:
            slot = index % PER_SHEET
            if slot == 0:
                if sheet is not None:
                    sheet.save(os.path.join(OUT_DIR, f"sheet-{index // PER_SHEET - 1}.jpg"), "JPEG", quality=QUALITY, optimize=True, progressive=True)
                sheet = Image.new("RGB", (COLS * TILE, ROWS * TILE), (13, 17, 16))
            th = Image.open(thumb_path(b["folder"], f))
            sheet.paste(th, ((slot % COLS) * TILE, (slot // COLS) * TILE))
            m = TILE // 5
            r, g, bl = th.crop((m, m, TILE - m, TILE - m)).resize((1, 1), Image.BOX).getpixel((0, 0))
            colors.append(f"{r:02x}{g:02x}{bl:02x}")
            index += 1
    n_sheets = (index + PER_SHEET - 1) // PER_SHEET
    # Trim the last sheet to the rows it uses.
    used_rows = ((index - 1) % PER_SHEET) // COLS + 1
    sheet.crop((0, 0, COLS * TILE, used_rows * TILE)).save(
        os.path.join(OUT_DIR, f"sheet-{n_sheets - 1}.jpg"), "JPEG", quality=QUALITY, optimize=True, progressive=True)

    with open(DATA, "w", encoding="utf8") as fh:
        json.dump({"tile": TILE, "cols": COLS, "perSheet": PER_SHEET, "sheets": n_sheets, "total": index,
                   "breeds": out_breeds, "colors": "".join(colors)}, fh, separators=(",", ":"))
    size = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR))
    print(f"wrote {index} tiles in {n_sheets} sheets ({size / 1e6:.1f} MB), {len(out_breeds)} breeds", flush=True)


if __name__ == "__main__":
    sys.exit(main())
