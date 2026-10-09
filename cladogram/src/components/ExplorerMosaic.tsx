"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { BREEDS, EX, FAMILY_ORDER, JOB_GROUPS, REGIONS, type ExBreed } from "@/lib/explorer";
import { clusterCells, HUB } from "@/lib/explorerCluster";

export type Arrange = "cluster" | "family" | "job" | "region" | "color" | "map";

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
const GOLD = "#e8b74a";

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
const land = (() => {
  const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
  return feature(topo, topo.objects.countries);
})();

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
  map: boolean;
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
  return { x, y, s, height: cy + 40, labels, order, cols, map: false };
}

function computeLayout(arrange: Arrange, width: number, height: number, s: number): Layout {
  if (arrange === "map") return mapLayout(width, height);
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
    x, y, s, height: cy0 + maxY * step + 50, order: null, cols: 0, map: false,
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

let mapCache: { w: number; h: number; layout: Layout; proj: d3.GeoProjection } | null = null;
function mapLayout(width: number, height: number): Layout {
  if (mapCache && mapCache.w === width && mapCache.h === height) return mapCache.layout;
  const x = new Float32Array(N), y = new Float32Array(N);
  const homeless = BREEDS.filter((b) => b.lat == null);
  const stripH = 70;
  const proj = d3.geoNaturalEarth1().fitExtent([[MARGIN, 10], [width - MARGIN, height - stripH - 10]], { type: "Sphere" });
  // Tile size so that all photos fit in a sensible fraction of the land area.
  const s = Math.max(3, Math.min(6, Math.sqrt((width * height * 0.05) / N)));
  type Node = { b: ExBreed; side: number; x: number; y: number; ax: number; ay: number };
  const nodes: Node[] = BREEDS.filter((b) => b.lat != null).map((b) => {
    const [px, py] = proj([b.lon!, b.lat!])!;
    const side = Math.ceil(Math.sqrt(b.files.length)) * s;
    return { b, side, x: px, y: py, ax: px, ay: py };
  });
  const sim = d3.forceSimulation(nodes)
    .force("x", d3.forceX<Node>((d) => d.ax).strength(0.12))
    .force("y", d3.forceY<Node>((d) => d.ay).strength(0.12))
    // Circles inscribed between a square's half-side and half-diagonal: clusters may
    // touch at the corners but stay near their true homes.
    .force("c", d3.forceCollide<Node>((d) => d.side * 0.6 + 0.5).iterations(4))
    .stop();
  for (let i = 0; i < 260; i++) sim.tick();
  for (const n of nodes) {
    const per = Math.ceil(Math.sqrt(n.b.files.length));
    tilesOf(n.b).forEach((t, k) => {
      x[t] = n.x - n.side / 2 + (k % per) * s;
      y[t] = n.y - n.side / 2 + Math.floor(k / per) * s;
    });
  }
  // Designer crosses and mixed breeds have no single homeland: a strip along the bottom.
  let cx = MARGIN + 150;
  for (const b of homeless) {
    const rows = 6;
    tilesOf(b).forEach((t, k) => {
      x[t] = cx + Math.floor(k / rows) * s;
      y[t] = height - stripH + 18 + (k % rows) * s;
    });
    cx += Math.ceil(b.files.length / rows) * s + 10;
  }
  const layout: Layout = {
    x, y, s, height,
    labels: [{ x: MARGIN, y: height - stripH + 14, title: "", sub: "No single homeland" }],
    order: null, cols: 0, map: true,
  };
  mapCache = { w: width, h: height, layout, proj };
  return layout;
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
    const loadSheet = (k: number) =>
      new Promise<void>((res) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          sheets[k] = img;
          loaded += Math.min(EX.perSheet, N - k * EX.perSheet);
          cb.current.onProgress(loaded);
          draw();
          res();
        };
        img.onerror = () => res();
        img.src = `${BASE}/explorer/sheet-${k}.jpg`;
      });
    // Two at a time, in order, so the top of the mosaic fills in first.
    (async () => {
      for (let k = 0; k < EX.sheets; k += 2) await Promise.all([loadSheet(k), k + 1 < EX.sheets ? loadSheet(k + 1) : null]);
    })();

    // ---------- state ----------
    let W = 0, H = 0;
    let arrangeNow: Arrange = "cluster";
    let sizeNow = 22;
    let layout: Layout | null = null;
    const cx = new Float32Array(N), cy = new Float32Array(N), cs = new Float32Array(N).fill(0);
    let animating = false;
    let labelAlpha = 1;
    let hover = -1;
    let spot: number | null = null;
    let sel: Props["selected"] = null;
    let cursor = -1;
    let showTree = true;
    let quad: d3.Quadtree<number> | null = null;

    const offset = () => (layout?.map ? 0 : Math.max(0, barH() - host.getBoundingClientRect().top));

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

    function draw() {
      if (!layout) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const off = offset();
      if (layout.map && mapCache) {
        const path = d3.geoPath(mapCache.proj, ctx);
        ctx.beginPath();
        path({ type: "Sphere" });
        ctx.fillStyle = "#0f1614";
        ctx.fill();
        ctx.beginPath();
        path(land);
        ctx.fillStyle = "#222b27";
        ctx.fill();
      }
      const T = EX.tile, cols = EX.cols;
      const dimOthers = spot != null;
      for (let i = 0; i < N; i++) {
        const s = cs[i];
        const yy = cy[i] - off;
        if (yy + s < 0 || yy > H) continue;
        const img = sheets[(i / EX.perSheet) | 0];
        ctx.globalAlpha = dimOthers && tileBreed[i] !== spot ? 0.12 : 1;
        if (img) {
          const slot = i % EX.perSheet;
          ctx.drawImage(img, (slot % cols) * T, ((slot / cols) | 0) * T, T, T, cx[i], yy, s, s);
        } else {
          ctx.fillStyle = "#1b2320";
          ctx.fillRect(cx[i], yy, s, s);
        }
      }
      ctx.globalAlpha = 1;
      // Outline every photo of the hovered / selected breed.
      const ring = (breed: number, color: string, w: number) => {
        const b = BREEDS[breed];
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        for (let i = b.start; i < b.start + b.files.length; i++) ctx.strokeRect(cx[i] + 0.5, cy[i] - off + 0.5, cs[i] - 1, cs[i] - 1);
      };
      if (hover >= 0 && !animating) ring(tileBreed[hover], "rgba(232,183,74,0.85)", 1);
      if (sel) {
        const b = BREEDS[sel.breed];
        ring(sel.breed, "rgba(232,183,74,0.6)", 1);
        const t = b.start + sel.photo;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx[t] - 1, cy[t] - off - 1, cs[t] + 2, cs[t] + 2);
      }
      for (const t of [hover, cursor]) {
        if (t < 0 || animating) continue;
        ctx.strokeStyle = t === cursor ? GOLD : "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx[t] - 1, cy[t] - off - 1, cs[t] + 2, cs[t] + 2);
      }
      // Clustered view: the family tree linking the clusters back to the grey wolf.
      const cl = layout.cluster;
      if (cl && labelAlpha > 0) {
        ctx.globalAlpha = labelAlpha;
        if (showTree) {
          ctx.strokeStyle = "rgba(233,226,208,0.32)";
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
        ctx.fillStyle = "#0d1110";
        ctx.fill();
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = GOLD;
        ctx.font = `500 ${Math.max(12, Math.min(18, cl.hub.r / 2.6))}px 'Bodoni Moda', Georgia, serif`;
        ctx.fillText("Grey wolf", cl.hub.x, hy + 2);
        ctx.font = "500 9.5px 'IBM Plex Sans Condensed', sans-serif";
        ctx.fillStyle = "#b9b3a3";
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
            ctx.strokeStyle = "rgba(10,13,12,0.92)";
            ctx.lineWidth = 5;
            ctx.strokeText(l.title, l.x, ly);
            ctx.fillStyle = "#fffaf0";
            ctx.fillText(l.title, l.x, ly);
            ctx.font = "600 10px 'IBM Plex Sans Condensed', sans-serif";
            ctx.lineWidth = 4;
            ctx.strokeText(l.sub.toUpperCase(), l.x, ly + 14);
            ctx.fillStyle = "#d8d2c2";
            ctx.fillText(l.sub.toUpperCase(), l.x, ly + 14);
            ctx.textAlign = "start";
            continue;
          }
          if (l.title) {
            ctx.font = "500 22px 'Bodoni Moda', Georgia, serif";
            ctx.fillStyle = "#ece5d3";
            ctx.fillText(l.title, l.x, ly + 24);
          }
          ctx.font = "500 11px 'IBM Plex Sans Condensed', sans-serif";
          ctx.fillStyle = "#8a8a7f";
          ctx.fillText(l.sub.toUpperCase(), l.x, ly + (l.title ? 42 : 0));
        }
        ctx.globalAlpha = 1;
      }
    }

    function relayout(animate: boolean) {
      resize();
      layout = computeLayout(arrangeNow, W, H, sizeNow);
      host.style.height = `${layout.map ? H : Math.max(H, layout.height)}px`;
      quad = null;
      const tx = layout.x, ty = layout.y, s1 = layout.s;
      if (!animate || reduce || cs[0] === 0) {
        cx.set(tx); cy.set(ty); cs.fill(s1);
        animating = false;
        labelAlpha = 1;
        draw();
        return;
      }
      const x0 = cx.slice(), y0 = cy.slice(), s0 = cs.slice();
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
          cs[i] = s0[i] + (s1 - s0[i]) * k;
        }
        if (el >= total) {
          timer.stop();
          animating = false;
          labelAlpha = 1;
        }
        draw();
      });
    }

    // ---------- hit testing ----------
    function tileAt(px: number, py: number) {
      if (!layout || animating) return -1;
      if (!quad) quad = d3.quadtree<number>().x((i) => cx[i] + cs[i] / 2).y((i) => cy[i] + cs[i] / 2).addAll(d3.range(N));
      const t = quad.find(px, py + offset(), Math.max(4, layout.s));
      if (t == null) return -1;
      const s = cs[t];
      const yy = cy[t] - offset();
      return px >= cx[t] - 1 && px <= cx[t] + s + 1 && py >= yy - 1 && py <= yy + s + 1 ? t : -1;
    }
    function showTip(t: number, px: number, py: number) {
      if (t < 0) {
        tip.classList.remove("on");
        return;
      }
      const b = BREEDS[tileBreed[t]];
      tip.innerHTML = `<strong>${b.name}</strong><span>${b.files.length} photo${b.files.length === 1 ? "" : "s"} · ${b.familyName}</span>`;
      tip.classList.add("on");
      const r = tip.getBoundingClientRect();
      tip.style.left = `${Math.min(px + 14, W - r.width - 8)}px`;
      tip.style.top = `${py + 16 + r.height > H ? py - r.height - 10 : py + 16}px`;
    }
    canvas.addEventListener("pointermove", (ev) => {
      const r = canvas.getBoundingClientRect();
      const px = ev.clientX - r.left, py = ev.clientY - r.top;
      const t = tileAt(px, py);
      if (t !== hover) {
        hover = t;
        canvas.style.cursor = t >= 0 ? "pointer" : "default";
        draw();
      }
      showTip(t, px, py);
    });
    canvas.addEventListener("pointerleave", () => {
      hover = -1;
      tip.classList.remove("on");
      draw();
    });
    canvas.addEventListener("click", (ev) => {
      const r = canvas.getBoundingClientRect();
      const t = tileAt(ev.clientX - r.left, ev.clientY - r.top);
      if (t >= 0) {
        cursor = t;
        cb.current.onOpen(tileBreed[t], tilePhoto[t]);
      }
    });
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
    });

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
        // A new arrangement starts from the top of the mosaic (the map needs the full view).
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
        if (sp != null && sp !== spot && layout && !layout.map) {
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
    return () => {
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
