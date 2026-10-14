"use client";

import { useEffect, useRef } from "react";

/**
 * A slowly spinning 3D DNA double helix, drawn on a canvas and centered on the header's
 * concentric rings. Two golden phosphate backbones twist around a vertical axis; each rung
 * is a base pair, colored like the classic textbook diagram: adenine (green) with thymine
 * (purple), cytosine (pink) with guanine (blue). Everything is depth-sorted and shaded so
 * the far side recedes. It holds still for reduced motion and pauses when off screen.
 */
const BACKBONE = [240, 200, 118];
const BASE = { A: [110, 231, 160], T: [205, 125, 240], C: [240, 118, 150], G: [120, 132, 245] };
// A fixed, repeatable sequence so the pattern doesn't flicker between frames.
const SEQ = "ATGCGTACCTAGGCTAATCGGATCCATG";
const PARTNER: Record<string, "A" | "T" | "C" | "G"> = { A: "T", T: "A", C: "G", G: "C" };
const PAIRS = 26;
const TURNS = 2.2;

export default function DnaHelix() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tilt = 0.32; // lean the axis toward the viewer a little, for depth
    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const R = W * 0.3; // helix radius
      const len = H * 0.8; // helix length
      const f = W * 2.4; // perspective focal length
      const spin = reduce ? 0.6 : t * 0.00035;
      type P = { x: number; y: number; z: number; s: number };
      const proj = (x: number, y: number, z: number): P => {
        // tilt about the x axis, then perspective
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        const s = f / (f + z2);
        return { x: W / 2 + x * s, y: H / 2 + y2 * s, z: z2, s };
      };
      type Item = { z: number; draw: () => void };
      const items: Item[] = [];
      const shade = (c: number[], z: number, a = 1) => {
        const k = 0.45 + 0.55 * (1 - (z + R) / (2 * R)); // nearer = brighter
        return `rgba(${c.map((v) => Math.round(v * k)).join(",")},${a * (0.35 + 0.65 * k)})`;
      };
      const STEPS = PAIRS * 4;
      const strand = (offset: number) => {
        const pts: P[] = [];
        for (let i = 0; i <= STEPS; i++) {
          const u = i / STEPS;
          const a = u * TURNS * 2 * Math.PI + spin + offset;
          pts.push(proj(R * Math.cos(a), (u - 0.5) * len, R * Math.sin(a)));
        }
        return pts;
      };
      const A = strand(0);
      const B = strand(Math.PI * 0.82); // the minor/major groove offset
      // Backbones: short segments, each depth-sorted with everything else.
      for (const [pts, col] of [[A, BACKBONE], [B, BACKBONE]] as const) {
        for (let i = 0; i < pts.length - 1; i++) {
          const p = pts[i], q = pts[i + 1];
          const z = (p.z + q.z) / 2;
          items.push({
            z,
            draw: () => {
              ctx.strokeStyle = shade(col as unknown as number[], z);
              ctx.lineWidth = 5 * p.s;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.stroke();
            },
          });
        }
      }
      // Base pairs: a rung between the strands, half in each strand's color, with nodes.
      for (let k = 0; k < PAIRS; k++) {
        const i = Math.round(((k + 0.5) / PAIRS) * STEPS);
        const p = A[i], q = B[i];
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        const z = (p.z + q.z) / 2;
        const b1 = SEQ[k % SEQ.length] as keyof typeof BASE;
        const b2 = PARTNER[b1];
        items.push({
          z: z + 0.01,
          draw: () => {
            ctx.lineWidth = 4.2 * ((p.s + q.s) / 2);
            ctx.lineCap = "butt";
            ctx.strokeStyle = shade(BASE[b1], p.z, 0.95);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mx, my);
            ctx.stroke();
            ctx.strokeStyle = shade(BASE[b2], q.z, 0.95);
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          },
        });
        for (const [n, col] of [[p, BACKBONE], [q, BACKBONE]] as const) {
          items.push({
            z: n.z - 0.01,
            draw: () => {
              ctx.fillStyle = shade(col as unknown as number[], n.z);
              ctx.beginPath();
              ctx.arc(n.x, n.y, 5.2 * n.s, 0, Math.PI * 2);
              ctx.fill();
            },
          });
        }
      }
      // Far first, near last.
      items.sort((a, b) => b.z - a.z).forEach((it) => it.draw());
    };

    const loop = (t: number) => {
      if (visible) draw(t);
      raf = requestAnimationFrame(loop);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="dna-helix" aria-hidden />;
}
