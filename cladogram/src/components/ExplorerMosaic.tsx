"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import mosaicData from "@/data/mosaic.json";
import { factsHtml } from "@/lib/breedFacts";
import { BREEDS, EX, FAMILY_ORDER, JOB_GROUPS, REGIONS, photoUrl, type ExBreed } from "@/lib/explorer";
import { clusterCells, HUB } from "@/lib/explorerCluster";
import { LIGHT, onThemeChange, tone } from "@/lib/theme";

export type Arrange = "mosaic" | "cluster" | "family" | "job" | "region" | "color";

type Props = {
  arrange: Arrange;
  tileSize: number;
  /** breed index to spotlight (search); others dim */
  spotlight: number | null;
  /** breed index + photo of the open drawer, outlined on the mosaic */
  selected: { breed: number; photo: number } | null;
  onOpen: (breed: number, photo: number) => void;
  onProgress: (loadedTiles: number) => void;
  /** Clustered view: draw the family tree over the clusters. */
  showTree: boolean;
};

const N = EX.total;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const GAP = 1;
const MARGIN = 16;
const LABEL_H = 54;
const GROUP_GAP = 26;
let GOLD = "#e8b74a";

// ---------- static per-tile data ----------
const tileBreed = new Uint16Array(N);
const tilePhoto = new Uint16Array(N);
for (const b of BREEDS) {
  for (let k = 0; k < b.files.length; k++) {
    tileBreed[b.start + k] = b.index;
    tilePhoto[b.start + k] = k;
  }
}
const lum = new Float32Array(N);
const hue = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const c = d3.hsl(`#${EX.colors.slice(i * 6, i * 6 + 6)}`);
  lum[i] = c.l;
  hue[i] = Number.isNaN(c.h) ? -1 : c.h * (c.s > 0.12 ? 1 : 0) - (c.s > 0.12 ? 0 : 1);
}
const shuffled = d3.shuffler(d3.randomLcg(0.42))(d3.range(N));

/**
 * The photo-mosaic arrangement: a rainbow of every photo, red at the top to violet at the
 * bottom, with DOGS across it in black, also made of photos. scripts/build-mosaic.py measures
 * each photo (5 bytes): its darkest crop and that crop's lightness, and its most colorful crop
 * with that crop's hue, chroma and lightness. A crop is the part of the photo a tile shows:
 * the whole photo or a half-size patch of it. Tiles are drawn as they are, with no tint.
 */
const MOSAIC = (() => {
  const m = mosaicData as { crops: [number, number, number][]; photos: string };
  const bin = typeof atob === "function" ? atob(m.photos) : Buffer.from(m.photos, "base64").toString("binary");
  const darkCrop = new Uint8Array(N), colorCrop = new Uint8Array(N), darkL = new Uint8Array(N), hue = new Float32Array(N), chroma = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const o = i * 5, b = (k: number) => bin.charCodeAt(o + k);
    darkCrop[i] = b(0) & 15;
    colorCrop[i] = b(0) >> 4;
    darkL[i] = b(1);
    hue[i] = (b(2) / 256) * 360;
    chroma[i] = b(3);
  }
  return { crops: m.crops, darkCrop, colorCrop, darkL, hue, chroma };
})();

/** The rainbow's bands, top to bottom, by hue (degrees, red wrapping round through 0). */
const BANDS = [
  { name: "red", to: 15 },
  { name: "orange", to: 40 },
  { name: "yellow", to: 70 },
  { name: "green", to: 170 },
  { name: "blue", to: 255 },
  { name: "violet", to: 345 },
];
/** Hue as a sort key that starts at red: 345-360 degrees count as the start, not the end. */
const hueKey = (h: number) => (h >= 345 ? h - 360 : h);
const bandOf = (h: number) => {
  const k = hueKey(h);
  const i = BANDS.findIndex((b) => k < b.to);
  return i < 0 ? BANDS.length - 1 : i;
};
const WORD = "DOGS";
const WORD_FONT = '900 100px "Arial Black", "Helvetica Neue", Arial, sans-serif';

type Label = { x: number; y: number; title: string; sub: string; center?: boolean; n?: number };
type Layout = {
  x: Float32Array;
  y: Float32Array;
  s: number;
  height: number;
  labels: Label[];
  /** tile indices in reading order (grid layouts), for keyboard navigation */
  order: number[] | null;
  cols: number;
  /** Per-tile widths and heights, when tiles differ (the mosaic); otherwise every tile is `s` square. */
  sizes?: Float32Array;
  heights?: Float32Array;
  /** The mosaic: which crop of its photo each tile shows, and the order to paint tiles in (letters last). */
  crop?: Uint8Array;
  paint?: Uint32Array;
  mosaic?: boolean;
  /** The mosaic's grid: which photo is in each cell (-1 for none), for instant hit testing. */
  grid?: { cols: number; rows: number; tw: number; th: number; cell: Int32Array };
  /** Clustered view extras: the wolf hub, the tree drawn over the clusters, grid cells. */
  cluster?: {
    hub: { x: number; y: number; r: number };
    tree: [number, number, number, number][];
    cell: Map<number, number>;
    gx: Int16Array;
    gy: Int16Array;
  };
};

const byName = (a: ExBreed, b: ExBreed) => a.name.localeCompare(b.name);
const tilesOf = (b: ExBreed) => d3.range(b.start, b.start + b.files.length);
const fmt = d3.format(",");

function groupLayout(groups: { title: string; tiles: number[]; breeds: number }[], width: number, s: number): Layout {
  const x = new Float32Array(N), y = new Float32Array(N);
  const step = s + GAP;
  const cols = Math.max(4, Math.floor((width - 2 * MARGIN + GAP) / step));
  const usedW = cols * step - GAP;
  const left = Math.max(MARGIN, (width - usedW) / 2);
  const labels: Label[] = [];
  const order: number[] = [];
  let cy = 18;
  for (const g of groups) {
    if (!g.tiles.length) continue;
    labels.push({
      x: left, y: cy, title: g.title,
      sub: `${fmt(g.tiles.length)} photo${g.tiles.length === 1 ? "" : "s"}${g.breeds ? ` · ${g.breeds} breed${g.breeds === 1 ? "" : "s"}` : ""}`,
    });
    cy += LABEL_H;
    g.tiles.forEach((t, k) => {
      x[t] = left + (k % cols) * step;
      y[t] = cy + Math.floor(k / cols) * step;
      order.push(t);
    });
    cy += Math.ceil(g.tiles.length / cols) * step + GROUP_GAP;
  }
  return { x, y, s, height: cy + 40, labels, order, cols };
}

function computeLayout(arrange: Arrange, width: number, height: number, s: number): Layout {
  if (arrange === "mosaic") return mosaicLayout(width, height);
  if (arrange === "cluster") return clusterLayout(width);
  if (arrange === "color") {
    const bands = [
      { title: "Bright & pale photos", lo: 0.62, hi: 2 },
      { title: "Light", lo: 0.5, hi: 0.62 },
      { title: "Mid-tone", lo: 0.38, hi: 0.5 },
      { title: "Dark", lo: 0.26, hi: 0.38 },
      { title: "Darkest", lo: -1, hi: 0.26 },
    ];
    return groupLayout(
      bands.map((b) => ({
        title: b.title,
        tiles: d3.range(N).filter((i) => lum[i] >= b.lo && lum[i] < b.hi).sort((a, c) => hue[a] - hue[c] || lum[c] - lum[a]),
        breeds: 0,
      })),
      width, s,
    );
  }
  const key = (b: ExBreed) => (arrange === "family" ? b.family : arrange === "job" ? b.job : b.region);
  const defs =
    arrange === "family" ? FAMILY_ORDER.map((f) => ({ id: f.id, name: f.name }))
    : arrange === "job" ? JOB_GROUPS.map((j) => ({ id: j.id as string, name: j.name }))
    : REGIONS.map((r) => ({ id: r, name: r }));
  return groupLayout(
    defs.map((d) => {
      const bs = BREEDS.filter((b) => key(b) === d.id).sort(byName);
      return { title: d.name, tiles: bs.flatMap(tilesOf), breeds: bs.length };
    }),
    width, s,
  );
}

/** One round mosaic, clustered by family tree, with the grey wolf at the hub. */
function clusterLayout(width: number): Layout {
  const c = clusterCells();
  const { minX, maxX, minY, maxY } = c.bounds;
  const step = Math.min(16, (width - 2 * MARGIN) / (maxX - minX + 1));
  const s = step * 0.88;
  const cx0 = width / 2 - ((minX + maxX) / 2) * step;
  const cy0 = 28 - minY * step;
  const x = new Float32Array(N), y = new Float32Array(N);
  const cell = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    x[i] = cx0 + c.gx[i] * step - s / 2;
    y[i] = cy0 + c.gy[i] * step - s / 2;
    cell.set((c.gx[i] + 2000) * 4000 + (c.gy[i] + 2000), i);
  }
  const fmtN = d3.format(",");
  return {
    x, y, s, height: cy0 + maxY * step + 50, order: null, cols: 0,
    labels: c.labels.map((l) => ({
      x: cx0 + l.x * step, y: cy0 + l.y * step, title: l.title, center: true, n: l.n,
      sub: `${fmtN(l.n)} photos${l.breeds > 1 ? ` · ${l.breeds} breeds` : ""}`,
    })),
    cluster: {
      hub: { x: cx0, y: cy0, r: (HUB - 1) * step },
      tree: c.tree.map(([a, b, p, q]) => [cx0 + a * step, cy0 + b * step, cx0 + p * step, cy0 + q * step]),
      cell, gx: c.gx, gy: c.gy,
    },
  };
}

/**
 * The rainbow mosaic, filling the whole visible area (width x height) with one grid of
 * equal tiles.
 *
 * 1. DOGS is drawn as big as fits; the darkest photos (their darkest crops) fill the
 *    letters' cells.
 * 2. Every other photo fills the remaining cells row by row from the top, in rainbow
 *    order of its most colorful crop's hue: red, orange, yellow, green, blue, violet. Each
 *    color's band is as tall as the collection has photos of that color.
 * The grid is chosen to hold as close to all 18,006 photos as the screen's shape allows;
 * the few that don't fit (fewer than one row) are the least colorful ones.
 */
function mosaicLayout(width: number, height: number): Layout {
  const W = width, H = height;
  const x = new Float32Array(N).fill(-1e5), y = new Float32Array(N).fill(-1e5);
  const w = new Float32Array(N), h = new Float32Array(N);
  const crop = new Uint8Array(N);

  // ---------- one grid of equal, near-square tiles, as many as there are photos ----------
  const s0 = Math.sqrt((W * H) / N);
  let cols = 1, rows = 1, bestScore = Infinity;
  for (let c = Math.max(1, Math.floor(W / s0) - 6); c <= Math.ceil(W / s0) + 6; c++) {
    const r = Math.floor(N / c);
    if (r < 1) continue;
    const aspect = (W / c) / (H / r);
    if (aspect < 0.8 || aspect > 1.25) continue;
    const score = N - c * r + Math.abs(Math.log(aspect)) * 400;
    if (score < bestScore) { bestScore = score; cols = c; rows = r; }
  }
  const tw = W / cols, th = H / rows;

  // ---------- the word, measured at grid resolution (4 samples per cell) ----------
  const ss = 4;
  const mw = cols * ss, mh = rows * ss;
  const cv = document.createElement("canvas");
  cv.width = mw;
  cv.height = mh;
  const c2 = cv.getContext("2d", { willReadFrequently: true })!;
  // Draw in screen proportions (cells may be a little off square), then sample per cell.
  c2.scale(mw / W, mh / H);
  c2.font = WORD_FONT;
  const m = c2.measureText(WORD);
  const capH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || 72;
  const k = Math.min((W * 0.92) / m.width, (H * 0.62) / capH);
  c2.font = WORD_FONT.replace("100px", `${100 * k}px`);
  c2.textAlign = "center";
  c2.textBaseline = "alphabetic";
  const m2 = c2.measureText(WORD);
  c2.fillText(WORD, W / 2, H / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2);
  const px = c2.getImageData(0, 0, mw, mh).data;
  const letter = new Uint8Array(cols * rows);
  let T = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      let on = 0;
      for (let dy = 0; dy < ss; dy++) for (let dx = 0; dx < ss; dx++) if (px[((r * ss + dy) * mw + c * ss + dx) * 4 + 3] > 127) on++;
      if (on * 2 >= ss * ss) { letter[r * cols + c] = 1; T++; }
    }

  // ---------- photos: dark, dull ones to the letters, the rest in rainbow order ----------
  // Letters want black, and colorful photos are worth more to the rainbow, so rank by
  // darkness with a penalty for color.
  const byDark = d3.range(N).sort((a, b) => MOSAIC.darkL[a] + 0.6 * MOSAIC.chroma[a] - (MOSAIC.darkL[b] + 0.6 * MOSAIC.chroma[b]));
  const inLetters = byDark.slice(0, T);
  let rest = byDark.slice(T);
  const spare = rest.length - (cols * rows - T);
  if (spare > 0) {
    // Leave out the least colorful photos, the ones that would blur the bands.
    rest.sort((a, b) => MOSAIC.chroma[b] - MOSAIC.chroma[a]);
    rest = rest.slice(0, rest.length - spare);
  }
  // Hue is stored in coarse steps, so many photos share a value; a small fixed jitter mixes
  // them, so the bands blend instead of forming streaks of one tone.
  const jitter = (p: number) => (((p * 2654435761) >>> 0) / 4294967296 - 0.5) * 6;
  const key = new Float32Array(N);
  for (const p of rest) key[p] = bandOf(MOSAIC.hue[p]) * 1000 + hueKey(MOSAIC.hue[p]) + jitter(p);
  rest.sort((a, b) => key[a] - key[b]);

  const paint: number[] = [];
  const cellOf = new Int32Array(cols * rows).fill(-1);
  let li = 0, ri = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const isLetter = letter[r * cols + c] === 1;
      const p = isLetter ? inLetters[li++] : rest[ri++];
      if (p == null) continue;
      // Snap edges to whole pixels so neighbors meet exactly.
      const x0 = Math.round(c * tw), y0 = Math.round(r * th);
      x[p] = x0; y[p] = y0;
      w[p] = Math.round((c + 1) * tw) - x0;
      h[p] = Math.round((r + 1) * th) - y0;
      crop[p] = isLetter ? MOSAIC.darkCrop[p] : MOSAIC.colorCrop[p];
      paint.push(p);
      cellOf[r * cols + c] = p;
    }
  return {
    x, y, s: Math.min(tw, th), sizes: w, heights: h, crop, paint: Uint32Array.from(paint),
    height: H, labels: [], order: null, cols: 0, mosaic: true,
    grid: { cols, rows, tw, th, cell: cellOf },
  };
}

export default function ExplorerMosaic({ arrange, tileSize, spotlight, selected, onOpen, onProgress, showTree }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const api = useRef<{
    set: (a: Arrange, s: number) => void;
    style: (sp: number | null, sel: Props["selected"]) => void;
    tree: (on: boolean) => void;
  } | null>(null);
  const cb = useRef({ onOpen, onProgress });
  cb.current = { onOpen, onProgress };

  useEffect(() => {
    const host = wrap.current!;
    const canvas = canvasRef.current!;
    const tip = tipRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const barH = () => (document.querySelector(".ex-bar") as HTMLElement | null)?.offsetHeight ?? 0;

    // ---------- sprite sheets ----------
    const sheets: (HTMLImageElement | null)[] = new Array(EX.sheets).fill(null);
    let loaded = 0;
    // The mosaic stays hidden until every sheet has arrived (or failed), then shows complete,
    // instead of filling in patch by patch; the loading bar above it shows the progress.
    let settled = 0;
    let ready = false;
    const settle = () => {
      if (++settled < EX.sheets) return;
      ready = true;
      canvas.classList.add("ready");
      draw();
    };
    const loadSheet = (k: number) =>
      new Promise<void>((res) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          sheets[k] = img;
          loaded += Math.min(EX.perSheet, N - k * EX.perSheet);
          cb.current.onProgress(loaded);
          settle();
          res();
        };
        img.onerror = () => {
          settle();
          res();
        };
        img.src = `${BASE}/explorer/sheet-${k}.jpg`;
      });
    // Two at a time, in order, so the top of the mosaic fills in first.
    (async () => {
      for (let k = 0; k < EX.sheets; k += 2) await Promise.all([loadSheet(k), k + 1 < EX.sheets ? loadSheet(k + 1) : null]);
    })();

    // ---------- state ----------
    let W = 0, H = 0;
    let arrangeNow: Arrange = "mosaic";
    let sizeNow = 22;
    let layout: Layout | null = null;
    const cx = new Float32Array(N), cy = new Float32Array(N), cs = new Float32Array(N).fill(0);
    // Tile heights: equal to the widths except in the mosaic, whose tiles are fitted to their rows.
    const ch = new Float32Array(N).fill(0);
    let animating = false;
    let labelAlpha = 1;
    let hover = -1;
    let spot: number | null = null;
    let sel: Props["selected"] = null;
    let cursor = -1;
    let showTree = true;
    let quad: d3.Quadtree<number> | null = null;

    const offset = () => Math.max(0, barH() - host.getBoundingClientRect().top);

    function resize() {
      // The control bar wraps on narrow screens; stick the canvas right below it.
      document.documentElement.style.setProperty("--ex-bar-h", `${barH()}px`);
      W = host.clientWidth;
      H = window.innerHeight - barH();
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    }

    /** Paint the tiles into a context whose origin is `off` pixels down the layout. */
    function paintTiles(g: CanvasRenderingContext2D, off: number, viewH: number) {
      if (!layout) return;
      // In the mosaic each tile shows its chosen crop, cut to the tile's shape (the whole
      // photo while tiles fly into place); the letters paint last, on top.
      const cropping = !!layout.mosaic && !animating && !!layout.crop;
      g.imageSmoothingQuality = "high";
      const T = EX.tile, cols = EX.cols;
      const dimOthers = spot != null;
      const order = layout.paint;
      const count = order ? order.length : N;
      for (let n = 0; n < count; n++) {
        const i = order ? order[n] : n;
        const s = cs[i], sh = ch[i];
        const yy = cy[i] - off;
        if (yy + sh < 0 || yy > viewH) continue;
        const img = sheets[(i / EX.perSheet) | 0];
        g.globalAlpha = dimOthers && tileBreed[i] !== spot ? 0.12 : 1;
        if (img) {
          const slot = i % EX.perSheet;
          const sx = (slot % cols) * T, sy = ((slot / cols) | 0) * T;
          if (cropping) {
            const [ox, oy, cw] = MOSAIC.crops[layout.crop![i]];
            // Keep the photo's proportions: take the middle of the crop at the tile's aspect.
            const a = s / sh;
            const sw = a >= 1 ? cw : cw * a, shh = a >= 1 ? cw / a : cw;
            g.drawImage(img, sx + ox + (cw - sw) / 2, sy + oy + (cw - shh) / 2, sw, shh, cx[i], yy, s, sh);
          } else g.drawImage(img, sx, sy, T, T, cx[i], yy, s, sh);
        } else {
          g.fillStyle = tone("#1b2320", LIGHT.card);
          g.fillRect(cx[i], yy, s, sh);
        }
      }
      g.globalAlpha = 1;
    }

    // The settled mosaic is painted once into an off-screen canvas; hovering only copies it
    // back and draws the outlines, instead of redrawing 18,006 photos per pointer move.
    const cache = document.createElement("canvas");
    const cacheCtx = cache.getContext("2d")!;
    let cacheKey = "";
    let layoutSerial = 0;

    function draw() {
      if (!layout || !ready) return;
      GOLD = tone("#e8b74a", LIGHT.gold);
      const off = offset();
      if (layout.mosaic && !animating) {
        const key = `${layoutSerial}|${sheets.filter(Boolean).length}|${spot}|${W}x${layout.height}|${dpr}`;
        if (key !== cacheKey) {
          cache.width = Math.ceil(W * dpr);
          cache.height = Math.ceil(layout.height * dpr);
          cacheCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          cacheCtx.clearRect(0, 0, W, layout.height);
          paintTiles(cacheCtx, 0, layout.height);
          cacheKey = key;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cache, 0, -Math.round(off * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        paintTiles(ctx, off, H);
      }
      // Outline every photo of the hovered / selected breed.
      const ring = (breed: number, color: string, w: number) => {
        const b = BREEDS[breed];
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        for (let i = b.start; i < b.start + b.files.length; i++) ctx.strokeRect(cx[i] + 0.5, cy[i] - off + 0.5, cs[i] - 1, ch[i] - 1);
      };
      if (hover >= 0 && !animating) ring(tileBreed[hover], tone("rgba(232,183,74,0.85)", "rgba(141,98,12,0.85)"), 1);
      if (sel) {
        const b = BREEDS[sel.breed];
        ring(sel.breed, tone("rgba(232,183,74,0.6)", "rgba(141,98,12,0.6)"), 1);
        const t = b.start + sel.photo;
        ctx.strokeStyle = tone("#fff", LIGHT.hi);
        ctx.lineWidth = 2;
        ctx.strokeRect(cx[t] - 1, cy[t] - off - 1, cs[t] + 2, ch[t] + 2);
      }
      for (const t of [hover, cursor]) {
        if (t < 0 || animating) continue;
        ctx.strokeStyle = t === cursor ? GOLD : tone("#fff", LIGHT.hi);
        ctx.lineWidth = 2;
        ctx.strokeRect(cx[t] - 1, cy[t] - off - 1, cs[t] + 2, ch[t] + 2);
      }
      // Clustered view: the family tree linking the clusters back to the grey wolf.
      const cl = layout.cluster;
      if (cl && labelAlpha > 0) {
        ctx.globalAlpha = labelAlpha;
        if (showTree) {
          ctx.strokeStyle = tone("rgba(233,226,208,0.32)", "rgba(32,37,31,0.32)");
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (const [a, b, p, q] of cl.tree) {
            ctx.moveTo(a, b - off);
            ctx.lineTo(p, q - off);
          }
          ctx.stroke();
        }
        const hy = cl.hub.y - off;
        ctx.beginPath();
        ctx.arc(cl.hub.x, hy, cl.hub.r, 0, Math.PI * 2);
        ctx.fillStyle = tone("#0d1110", LIGHT.bg);
        ctx.fill();
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = GOLD;
        ctx.font = `500 ${Math.max(12, Math.min(18, cl.hub.r / 2.6))}px 'Bodoni Moda', Georgia, serif`;
        ctx.fillText("Grey wolf", cl.hub.x, hy + 2);
        ctx.font = "500 9.5px 'IBM Plex Sans Condensed', sans-serif";
        ctx.fillStyle = tone("#b9b3a3", LIGHT.ink2);
        ctx.fillText("SHARED ANCESTOR", cl.hub.x, hy + 16);
        ctx.textAlign = "start";
        ctx.globalAlpha = 1;
      }
      // Group labels.
      if (labelAlpha > 0) {
        ctx.globalAlpha = labelAlpha;
        for (const l of layout.labels) {
          const ly = l.y - off;
          if (ly < -60 || ly > H + 20) continue;
          if (l.center) {
            // Small screens: only name the bigger blobs so labels don't pile up.
            if (layout.s < 5 && (l.n ?? 0) < 600) continue;
            // Floating cluster names, haloed so they read over the photos.
            ctx.textAlign = "center";
            ctx.lineJoin = "round";
            ctx.font = "500 16px 'Bodoni Moda', Georgia, serif";
            ctx.strokeStyle = tone("rgba(10,13,12,0.92)", "rgba(246,242,232,0.92)");
            ctx.lineWidth = 5;
            ctx.strokeText(l.title, l.x, ly);
            ctx.fillStyle = tone("#fffaf0", LIGHT.hi);
            ctx.fillText(l.title, l.x, ly);
            ctx.font = "600 10px 'IBM Plex Sans Condensed', sans-serif";
            ctx.lineWidth = 4;
            ctx.strokeText(l.sub.toUpperCase(), l.x, ly + 14);
            ctx.fillStyle = tone("#d8d2c2", LIGHT.ink2);
            ctx.fillText(l.sub.toUpperCase(), l.x, ly + 14);
            ctx.textAlign = "start";
            continue;
          }
          if (l.title) {
            ctx.font = "500 22px 'Bodoni Moda', Georgia, serif";
            ctx.fillStyle = tone("#ece5d3", LIGHT.ink);
            ctx.fillText(l.title, l.x, ly + 24);
          }
          ctx.font = "500 11px 'IBM Plex Sans Condensed', sans-serif";
          ctx.fillStyle = tone("#8a8a7f", LIGHT.muted);
          ctx.fillText(l.sub.toUpperCase(), l.x, ly + (l.title ? 42 : 0));
        }
        ctx.globalAlpha = 1;
      }
    }

    function relayout(animate: boolean) {
      resize();
      layout = computeLayout(arrangeNow, W, H, sizeNow);
      layoutSerial++;
      host.style.height = `${Math.max(H, layout.height)}px`;
      quad = null;
      paintRank = null;
      const tx = layout.x, ty = layout.y, s1 = layout.s, ts = layout.sizes, th = layout.heights ?? layout.sizes;
      if (!animate || reduce || cs[0] === 0) {
        cx.set(tx); cy.set(ty);
        if (ts) cs.set(ts);
        else cs.fill(s1);
        if (th) ch.set(th);
        else ch.fill(s1);
        animating = false;
        labelAlpha = 1;
        draw();
        return;
      }
      const x0 = cx.slice(), y0 = cy.slice(), s0 = cs.slice(), h0 = ch.slice();
      // Stagger by destination so tiles sweep into place, Pudding-style.
      const delay = new Float32Array(N);
      const maxY = d3.max(ty) || 1;
      for (let i = 0; i < N; i++) delay[i] = (ty[i] / maxY) * 350 + (shuffled[i] % 200);
      const dur = 900;
      const total = dur + 550;
      animating = true;
      labelAlpha = 0;
      const timer = d3.timer((el) => {
        for (let i = 0; i < N; i++) {
          const k = d3.easeCubicInOut(Math.max(0, Math.min(1, (el - delay[i]) / dur)));
          cx[i] = x0[i] + (tx[i] - x0[i]) * k;
          cy[i] = y0[i] + (ty[i] - y0[i]) * k;
          cs[i] = s0[i] + ((ts ? ts[i] : s1) - s0[i]) * k;
          ch[i] = h0[i] + ((th ? th[i] : s1) - h0[i]) * k;
        }
        if (el >= total) {
          timer.stop();
          animating = false;
          labelAlpha = 1;
        }
        draw();
      });
    }

    // Canvas listeners share one abort signal and are removed when the effect cleans up.
    const listeners = new AbortController();
    const opts = { signal: listeners.signal };

    // ---------- hit testing ----------
    let paintRank: Uint32Array | null = null;
    let reach = 0, reachOf: Layout | null = null;
    function tileAt(px: number, py: number) {
      if (!layout || animating || !ready) return -1;
      if (layout.paint && !paintRank) {
        paintRank = new Uint32Array(N);
        layout.paint.forEach((i, r) => (paintRank![i] = r));
      }
      const qy = py + offset();
      const gr = layout.grid;
      if (gr) {
        const c = Math.floor(px / gr.tw), r = Math.floor(qy / gr.th);
        return c >= 0 && c < gr.cols && r >= 0 && r < gr.rows ? gr.cell[r * gr.cols + c] : -1;
      }
      if (!quad) quad = d3.quadtree<number>().x((i) => cx[i] + cs[i] / 2).y((i) => cy[i] + ch[i] / 2).addAll(d3.range(N));
      if (!layout.sizes) {
        const t = quad.find(px, qy, Math.max(4, layout.s));
        if (t == null) return -1;
        return px >= cx[t] - 1 && px <= cx[t] + cs[t] + 1 && qy >= cy[t] - 1 && qy <= cy[t] + ch[t] + 1 ? t : -1;
      }
      // Tiles of different sizes (and the letters painted over the rainbow): the last-painted
      // tile that contains the point.
      if (reachOf !== layout) {
        reach = Math.max(d3.max(layout.sizes)!, d3.max(layout.heights ?? layout.sizes)!);
        reachOf = layout;
      }
      let best = -1, bestRank = -1;
      quad.visit((node, x0, y0, x1, y1) => {
        if (!("length" in node)) {
          let d: typeof node | undefined = node;
          while (d) {
            const i = d.data;
            if (px >= cx[i] && px < cx[i] + cs[i] && qy >= cy[i] && qy < cy[i] + ch[i]) {
              const rank = paintRank ? paintRank[i] : i;
              if (rank > bestRank) { best = i; bestRank = rank; }
            }
            d = d.next;
          }
        }
        return x0 > px + reach || x1 < px - reach || y0 > qy + reach || y1 < qy - reach;
      });
      return best;
    }
    let fullTimer = 0;
    function showTip(t: number, px: number, py: number) {
      if (t < 0) {
        tip.classList.remove("on");
        return;
      }
      const b = BREEDS[tileBreed[t]];
      // The mosaic's tiles are too small to make out, so its tooltip also shows the hovered
      // photo: the sprite thumbnail at once, then the full-size picture over it.
      const withPhoto = !!layout?.mosaic;
      const key = `${b.index}|${withPhoto ? t : ""}`;
      // Rebuild only when the breed (or, in the mosaic, the photo) changes, not on every move.
      if (tip.dataset.key !== key) {
        tip.dataset.key = key;
        let photo = "";
        if (withPhoto) {
          const sheet = (t / EX.perSheet) | 0, slot = t % EX.perSheet, k = 240 / EX.tile;
          const thumb = `background-image:url(${BASE}/explorer/sheet-${sheet}.jpg);background-size:${EX.cols * EX.tile * k}px auto;background-position:-${(slot % EX.cols) * EX.tile * k}px -${((slot / EX.cols) | 0) * EX.tile * k}px`;
          photo = `<span class="ex-tip-photo" style="${thumb}"><img alt="" referrerpolicy="no-referrer" onload="this.classList.add('on')" /></span>`;
        }
        tip.classList.toggle("has-photo", withPhoto);
        tip.innerHTML = `${photo}<strong>${b.name}</strong><span>${b.files.length} photo${b.files.length === 1 ? "" : "s"} · ${b.familyName}</span>${factsHtml(b.code, null, b.name)}`;
        // Sweeping across the mosaic shouldn't fire a download per tile: the thumbnail shows
        // at once, the full-size photo once the pointer rests on a tile.
        clearTimeout(fullTimer);
        if (withPhoto) {
          const url = photoUrl(b, tilePhoto[t]);
          fullTimer = window.setTimeout(() => {
            const img = tip.querySelector<HTMLImageElement>(".ex-tip-photo img");
            if (img && tip.dataset.key === key) img.src = url;
          }, 140);
        }
      }
      tip.classList.add("on");
      const r = tip.getBoundingClientRect();
      tip.style.left = `${Math.min(px + 14, W - r.width - 8)}px`;
      // Below the pointer if it fits, else above; never past the top or bottom edge.
      const below = py + 16, above = py - r.height - 10;
      tip.style.top = `${Math.max(8, Math.min(below + r.height > H ? above : below, H - r.height - 8))}px`;
    }
    // Pointer moves come faster than frames: handle only the latest one each frame.
    let moveRaf = 0, lastMove: PointerEvent | null = null;
    canvas.addEventListener("pointermove", (ev) => {
      lastMove = ev;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const e = lastMove!;
        const r = canvas.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const t = tileAt(px, py);
        if (t !== hover) {
          hover = t;
          canvas.style.cursor = t >= 0 ? "pointer" : "default";
          draw();
        }
        showTip(t, px, py);
      });
    }, opts);
    canvas.addEventListener("pointerleave", () => {
      cancelAnimationFrame(moveRaf);
      moveRaf = 0;
      clearTimeout(fullTimer);
      hover = -1;
      tip.classList.remove("on");
      draw();
    }, opts);
    canvas.addEventListener("click", (ev) => {
      const r = canvas.getBoundingClientRect();
      const t = tileAt(ev.clientX - r.left, ev.clientY - r.top);
      if (t >= 0) {
        cursor = t;
        cb.current.onOpen(tileBreed[t], tilePhoto[t]);
      }
    }, opts);
    // Keyboard: arrows move through the mosaic, Enter opens the photo.
    canvas.addEventListener("keydown", (ev) => {
      // While a photo is open, the arrow keys belong to the drawer.
      if (sel || !layout) return;
      const cl = layout.cluster;
      if (cl) {
        const d: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
        if (ev.key in d) {
          ev.preventDefault();
          if (cursor < 0) cursor = BREEDS[0].start;
          else {
            const [dx, dy] = d[ev.key];
            // Skip over the gaps between clusters.
            for (let k = 1; k <= 12; k++) {
              const t = cl.cell.get((cl.gx[cursor] + dx * k + 2000) * 4000 + (cl.gy[cursor] + dy * k + 2000));
              if (t != null) {
                cursor = t;
                break;
              }
            }
          }
          const yy = cy[cursor] - offset();
          if (yy < 40 || yy > H - 60) window.scrollBy({ top: yy - H / 2, behavior: "auto" });
          draw();
        } else if (ev.key === "Enter" && cursor >= 0) {
          ev.preventDefault();
          cb.current.onOpen(tileBreed[cursor], tilePhoto[cursor]);
        }
        return;
      }
      if (layout.mosaic) {
        const d: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
        if (ev.key in d) {
          ev.preventDefault();
          if (cursor < 0) {
            // Start at the tile in the middle of the picture.
            const mx = d3.mean(cx)!, my = d3.mean(cy)!;
            cursor = d3.minIndex(d3.range(N), (i) => (cx[i] - mx) ** 2 + (cy[i] - my) ** 2);
          } else {
            const [dx, dy] = d[ev.key];
            const ox = cx[cursor] + cs[cursor] / 2, oy = cy[cursor] + ch[cursor] / 2;
            let best = -1, bd = Infinity;
            for (let i = 0; i < N; i++) {
              const vx = cx[i] + cs[i] / 2 - ox, vy = cy[i] + ch[i] / 2 - oy;
              const along = vx * dx + vy * dy;
              if (along <= 0.5) continue;
              const score = along + 2.5 * Math.abs(vx * dy - vy * dx);
              if (score < bd) { bd = score; best = i; }
            }
            if (best >= 0) cursor = best;
          }
          const yy = cy[cursor] - offset();
          if (yy < 40 || yy > H - 60) window.scrollBy({ top: yy - H / 2, behavior: "auto" });
          draw();
        } else if (ev.key === "Enter" && cursor >= 0) {
          ev.preventDefault();
          cb.current.onOpen(tileBreed[cursor], tilePhoto[cursor]);
        }
        return;
      }
      if (!layout.order) return;
      const order = layout.order;
      let k = cursor >= 0 ? order.indexOf(cursor) : -1;
      const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: layout.cols, ArrowUp: -layout.cols };
      if (ev.key in moves) {
        ev.preventDefault();
        k = k < 0 ? 0 : Math.max(0, Math.min(order.length - 1, k + moves[ev.key]));
        cursor = order[k];
        // Keep the cursor on screen.
        const yy = cy[cursor] - offset();
        if (yy < 40 || yy > H - 60) window.scrollBy({ top: yy - H / 2, behavior: "auto" });
        draw();
      } else if (ev.key === "Enter" && cursor >= 0) {
        ev.preventDefault();
        cb.current.onOpen(tileBreed[cursor], tilePhoto[cursor]);
      }
    }, opts);

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
      tip.classList.remove("on");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => relayout(false));
    ro.observe(host.parentElement!);

    api.current = {
      set: (a, s) => {
        const changed = a !== arrangeNow || s !== sizeNow;
        const rearranged = a !== arrangeNow;
        arrangeNow = a;
        sizeNow = s;
        // A new arrangement starts from the top of the wall.
        if (rearranged && layout) {
          const top = host.getBoundingClientRect().top + window.scrollY - barH();
          if (window.scrollY > top) window.scrollTo({ top });
        }
        if (changed || !layout) relayout(!!layout);
      },
      tree: (on) => {
        showTree = on;
        draw();
      },
      style: (sp, se) => {
        // Bring a newly searched breed into view.
        if (sp != null && sp !== spot && layout) {
          const t = BREEDS[sp].start;
          const yy = cy[t] - offset();
          if (yy < 60 || yy > H - 120) window.scrollTo({ top: window.scrollY + yy - 140, behavior: reduce ? "auto" : "smooth" });
        }
        spot = sp;
        sel = se;
        draw();
      },
    };
    document.fonts?.ready.then(() => draw());
    const offTheme = onThemeChange(() => draw());
    return () => {
      listeners.abort();
      offTheme();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      api.current = null;
    };
  }, []);

  useEffect(() => api.current?.set(arrange, tileSize), [arrange, tileSize]);
  useEffect(() => api.current?.style(spotlight, selected), [spotlight, selected]);
  useEffect(() => api.current?.tree(showTree), [showTree]);

  return (
    <div ref={wrap} className="ex-mosaic">
      <canvas
        ref={canvasRef}
        className="ex-canvas"
        tabIndex={0}
        role="img"
        aria-label={`Mosaic of ${fmt(N)} dog photos from the Dog CEO API. Use the arrow keys to move between photos and Enter to open one.`}
      />
      <div ref={tipRef} className="ex-tip" role="status" />
    </div>
  );
}
