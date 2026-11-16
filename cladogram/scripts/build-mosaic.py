"""
Photo features for the Breed Explorer's "Mosaic" arrangement: a rainbow made of every Dog
CEO photo, top (red) to bottom (violet), with the word DOGS across it in black, also made of
photos. The page lays the mosaic out itself (components/ExplorerMosaic.tsx), so it can fill
whatever screen it is on; this script only measures the photos.

  src/data/mosaic.json   per photo, 5 bytes (base64):
                           0  darkest crop (low 4 bits) | most colorful crop (high 4 bits)
                           1  lightness of the darkest crop (0-255)
                           2  hue of the most colorful crop (0-255 = 0-360 degrees)
                           3  chroma (colorfulness) of that crop (0-255)
                           4  lightness of that crop (0-255)
                         plus the crop list: the whole photo, or one of nine half-size
                         patches on a 3 x 3 grid.

Why crops: a photo's average color is a muddy middle tone, but most photos have a darker
corner (shadow, a black coat) and a more colorful patch (grass, sky, a toy). Showing that
part of the photo lets the letters reach near-black and the rainbow reach real color without
tinting or fading anything.

Run from cladogram/:  python scripts/build-mosaic.py
"""
import base64, colorsys, json, os

import numpy as np
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
EXPLORER = os.path.join(ROOT, "src", "data", "explorer.json")
OUT = os.path.join(ROOT, "src", "data", "mosaic.json")
SHEETS = os.path.join(ROOT, "public", "explorer")


def main():
    ex = json.load(open(EXPLORER, encoding="utf8"))
    N, T = ex["total"], ex["tile"]
    h = T // 2
    crops = [(ox, oy, h) for oy in (0, h // 2, h) for ox in (0, h // 2, h)] + [(0, 0, T)]
    buf = bytearray(N * 5)
    for k in range(ex["sheets"]):
        im = np.asarray(Image.open(os.path.join(SHEETS, f"sheet-{k}.jpg")).convert("RGB"), float) / 255
        S = np.pad(im, ((1, 0), (1, 0), (0, 0))).cumsum(0).cumsum(1)
        for slot in range(ex["perSheet"]):
            p = k * ex["perSheet"] + slot
            if p >= N:
                break
            sx, sy = (slot % ex["cols"]) * T, (slot // ex["cols"]) * T
            dark, color = (9, 2.0), (9, -1.0, 0.0, 0.0)  # (crop, lightness), (crop, chroma, hue, lightness)
            for ci, (ox, oy, w) in enumerate(crops):
                X0, Y0, X1, Y1 = sx + ox, sy + oy, sx + ox + w, sy + oy + w
                r, g, b = (S[Y1, X1] - S[Y0, X1] - S[Y1, X0] + S[Y0, X0]) / (w * w)
                lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
                hue, _, _ = colorsys.rgb_to_hls(r, g, b)
                chroma = max(r, g, b) - min(r, g, b)
                if lum < dark[1]:
                    dark = (ci, lum)
                if chroma > color[1]:
                    color = (ci, chroma, hue, lum)
            buf[p * 5: p * 5 + 5] = bytes([
                dark[0] | (color[0] << 4),
                round(dark[1] * 255),
                round(color[2] * 255) % 256,
                round(color[1] * 255),
                round(color[3] * 255),
            ])
    json.dump({"crops": crops, "photos": base64.b64encode(bytes(buf)).decode()}, open(OUT, "w"), separators=(",", ":"))
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
