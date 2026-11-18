"""Trace an outline around each dog on the About page.

Reads the cut-out photos in public/about/ (their alpha channel is the dog), grows each dog's
shape by PAD screen pixels (none: the line sits on the dog's edge), smooths it, and writes the outline as an SVG path to
src/data/aboutOutlines.json, with the scale that draws every dog at the same height.

Usage (from cladogram/): python -I scripts/build-about-outlines.py
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABOUT = os.path.join(ROOT, "public", "about")
OUT = os.path.join(ROOT, "src", "data", "aboutOutlines.json")

HEIGHT = 420  # every photo is drawn this tall (CSS px)
PAD = 0  # outline distance from the dog (CSS px): 0 = on its edge
ROOM = 16  # space kept around the outline for its glow (CSS px)

# The image each outline is traced from: the dog itself (for William, his own layer, not the pack).
DOGS = {
    "bentley-nobg.webp": "bentley-nobg.webp",
    "briar-nobg.webp": "briar-nobg.webp",
    "maggie-nobg.webp": "maggie-nobg.webp",
    "nellie-nobg.webp": "nellie-nobg.webp",
    "ratpack-bg.webp": "william-top.webp",
}


def smooth_path(pts: np.ndarray) -> str:
    """A closed Catmull-Rom curve through the points, as cubic Béziers."""
    n = len(pts)
    p = lambda i: pts[i % n]  # noqa: E731
    d = [f"M{p(0)[0]:.1f},{p(0)[1]:.1f}"]
    for i in range(n):
        p0, p1, p2, p3 = p(i - 1), p(i), p(i + 1), p(i + 2)
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        d.append(f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}")
    return "".join(d) + "Z"


out = {}
for shown, traced in DOGS.items():
    im = Image.open(os.path.join(ABOUT, traced))
    W, H = im.size
    s = HEIGHT / H  # image px -> CSS px
    pad, room = PAD / s, ROOM / s
    alpha = np.array(im)[..., 3].astype(np.float32) / 255
    # Grow the dog by the padding (on a canvas big enough for it), then round the shape off.
    m = int(np.ceil(pad + room))
    canvas = np.zeros((H + 2 * m, W + 2 * m), np.float32)
    canvas[m : m + H, m : m + W] = alpha
    dist = cv2.distanceTransform((canvas < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    grown = (dist <= pad).astype(np.float32)
    grown = (cv2.GaussianBlur(grown, (0, 0), max(pad * 0.6, 1.5 / s)) > 0.5).astype(np.uint8)  # round off the edge
    contours, _ = cv2.findContours(grown, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(contours, key=cv2.contourArea)[:, 0, :].astype(np.float32)
    # Fewer, evenly spaced points (about one every 4 CSS px), then a smooth curve through them.
    step = max(1, int(round(4 / s)))
    c = c[::step]
    c -= m  # back to the image's own coordinates
    out[shown] = {
        "w": W,
        "h": H,
        "scale": round(s, 5),
        "margin": round(m, 1),
        "d": smooth_path(c),
    }
    print(f"{shown}: {W}x{H}, drawn {W * s:.0f}x{HEIGHT}px, {len(c)} points")

with open(OUT, "w", encoding="utf8") as fh:
    json.dump(out, fh, indent=1)
print("wrote", os.path.relpath(OUT, ROOT))
