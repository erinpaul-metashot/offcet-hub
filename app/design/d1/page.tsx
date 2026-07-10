"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGoogleFont } from "../_components/useGoogleFont";

const display = { fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace" };

const STATES = [
  {
    k: "01",
    name: "Dispersed",
    status: "pending_review",
    head: "Surplus enters as noise.",
    body: "A supplier lists a lot — 1.2t of cold-rolled offcuts, idle nine months. No buyer, no price discovery, no signal. Just stranded mass taking up a corner of a warehouse.",
  },
  {
    k: "02",
    name: "Sorted",
    status: "approved",
    head: "An admin lowers the temperature.",
    body: "Every lot is read by a human before it moves. Specs verified, photos checked, category corrected. Curation is the cooling step — it turns a messy listing into a trustworthy unit of inventory.",
  },
  {
    k: "03",
    name: "Matched",
    status: "assigned",
    head: "Order finds its lattice.",
    body: "The lot is assigned to the buyer or agent who actually needs it. Not broadcast to a crowd — placed, deliberately, with the one party most likely to close. Matter snaps into position.",
  },
  {
    k: "04",
    name: "Cleared",
    status: "sold",
    head: "Entropy recovered as value.",
    body: "The deal closes off-platform, the supplier marks the lot sold, the corner of the warehouse empties. Capital that was frozen as clutter is liquid again. The system resets, cooler than before.",
  },
];

const ROLES = [
  { t: "Supplier", d: "Lists excess in minutes — photos, quantity, location, expected price. Clears stock without running a sales motion." },
  { t: "Buyer", d: "Sees only the lots an admin placed in front of them. Quality-controlled inventory, well under list, no broker theatre." },
  { t: "Agent", d: "Receives bulk lots and routes them through an existing network. The informal middleman, finally with infrastructure." },
  { t: "Admin", d: "Reads every registration and every lot. The curation layer that makes the whole exchange worth trusting." },
];

const ease = (x: number) => x * x * (3 - 2 * x);

export default function EntropyConcept() {
  useGoogleFont("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500;700&display=swap");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orderRef = useRef(0);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const [entropy, setEntropy] = useState(1);

  // Scroll → global order parameter t in [0,1]
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const t = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        orderRef.current = t;
        setEntropy((prev) => (Math.abs(prev - (1 - t)) > 0.008 ? 1 - t : prev));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Particle system: chaos drift ⇄ crystalline lattice
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    type P = { hx: number; hy: number; cx: number; cy: number; vx: number; vy: number; x: number; y: number; col: number; row: number };
    let parts: P[] = [];
    let cols = 0;
    let rows = 0;

    const build = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gap = w < 640 ? 40 : 52;
      cols = Math.ceil(w / gap) + 1;
      rows = Math.ceil(h / gap) + 1;
      const offX = (w - (cols - 1) * gap) / 2;
      const offY = (h - (rows - 1) * gap) / 2;
      parts = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hx = offX + c * gap;
          const hy = offY + r * gap;
          parts.push({
            hx,
            hy,
            cx: Math.random() * w,
            cy: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            x: Math.random() * w,
            y: Math.random() * h,
            col: c,
            row: r,
          });
        }
      }
    };

    build();
    const onResize = () => build();
    window.addEventListener("resize", onResize);

    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointerRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const tick = () => {
      const t = ease(orderRef.current);
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;

      // faint trail clear → cosmic smear when chaotic, crisp when ordered
      ctx.fillStyle = `rgba(8,7,11,${0.22 + 0.5 * t})`;
      ctx.fillRect(0, 0, w, h);

      const idx = (r: number, c: number) => r * cols + c;

      // crystalline bonds emerge as order rises
      if (t > 0.12) {
        ctx.strokeStyle = `rgba(255,150,70,${(t - 0.12) * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p = parts[idx(r, c)];
            if (c < cols - 1) {
              const q = parts[idx(r, c + 1)];
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
            }
            if (r < rows - 1) {
              const q = parts[idx(r + 1, c)];
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
            }
          }
        }
        ctx.stroke();
      }

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        // wander while dispersed
        p.cx += p.vx * (1 - t);
        p.cy += p.vy * (1 - t);
        if (p.cx < 0 || p.cx > w) p.vx *= -1;
        if (p.cy < 0 || p.cy > h) p.vy *= -1;

        let tx = p.cx + (p.hx - p.cx) * t;
        let ty = p.cy + (p.hy - p.cy) * t;

        // pointer disturbance — heat injected by the cursor
        const dx = p.x - px;
        const dy = p.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (14000 - d2) / 14000;
          tx += (dx / (Math.sqrt(d2) + 0.01)) * f * 34;
          ty += (dy / (Math.sqrt(d2) + 0.01)) * f * 34;
        }

        p.x += (tx - p.x) * 0.12;
        p.y += (ty - p.y) * 0.12;

        const a = 0.18 + 0.62 * t;
        const rad = 0.8 + 0.7 * t;
        ctx.fillStyle = `rgba(255,${168 + Math.round(46 * t)},${96 + Math.round(40 * t)},${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <main className="relative min-h-[100dvh] w-full bg-[#08070b] text-[#f3ede4]" style={display}>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />
      {/* vignette to seat content over the field */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_38%,transparent_30%,rgba(8,7,11,0.85)_85%)]" aria-hidden />

      {/* HUD */}
      <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6" style={mono}>
        <div className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur-sm">
          <div className="text-[9px] uppercase tracking-[0.3em] text-[#ff9a46]/70">system entropy</div>
          <div className="mt-1 text-xl tabular-nums text-[#f3ede4]">
            S {entropy.toFixed(3)}
            <span className="ml-1 text-[#ff9a46]">↓</span>
          </div>
          <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#ff9a46]" style={{ width: `${(1 - entropy) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 sm:px-10">
        <div className="flex items-baseline gap-2" style={mono}>
          <span className="text-sm font-bold tracking-tight">SurplusLink</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#ff9a46]/60">/ thermodynamic exchange</span>
        </div>
        <div className="flex items-center gap-5 text-xs" style={mono}>
          <Link href="/login" className="text-[#f3ede4]/55 transition-colors hover:text-[#f3ede4]">log in</Link>
          <Link href="/register" className="rounded-full border border-[#ff9a46]/40 px-4 py-1.5 text-[#ff9a46] transition-colors hover:bg-[#ff9a46] hover:text-[#08070b]">request access</Link>
        </div>
      </header>

      {/* hero — dispersed */}
      <section className="relative z-20 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 sm:px-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-6 text-[11px] uppercase tracking-[0.4em] text-[#ff9a46]/70"
          style={mono}
        >
          State 01 — Dispersed
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl text-[clamp(2.6rem,7vw,5.6rem)] font-medium leading-[0.95] tracking-tight"
        >
          Every warehouse is a pile of stranded matter.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-7 max-w-xl text-base leading-relaxed text-[#f3ede4]/65 sm:text-lg"
        >
          Idle steel, overstock polymer, dead packaging — capital frozen as clutter.
          SurplusLink is the cooling function. It pulls order out of other people&rsquo;s excess.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.55 }}
          className="mt-9 flex flex-wrap items-center gap-3"
          style={mono}
        >
          <Link href="/register" className="group flex items-center gap-3 rounded-full bg-[#ff9a46] px-6 py-3 text-sm font-semibold text-[#08070b] transition-transform active:scale-[0.98]">
            List surplus
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#08070b]/15 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/login" className="rounded-full border border-white/15 px-6 py-3 text-sm text-[#f3ede4]/80 transition-colors hover:border-white/40">
            See assigned lots
          </Link>
        </motion.div>
        <p className="mt-16 text-[11px] uppercase tracking-[0.35em] text-[#f3ede4]/30" style={mono}>
          scroll to cool the system ↓
        </p>
      </section>

      {/* states of matter */}
      <section className="relative z-20 mx-auto max-w-6xl px-6 py-28 sm:px-10">
        <h2 className="mb-16 max-w-2xl text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-tight">
          A lot changes state four times on its way from clutter to cash.
        </h2>
        <div className="space-y-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {STATES.map((s, i) => (
            <motion.article
              key={s.k}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.05 }}
              className="grid grid-cols-1 gap-6 border-b border-white/5 px-6 py-9 transition-colors last:border-0 hover:bg-white/[0.03] sm:grid-cols-[auto_1fr_1.4fr] sm:items-center sm:gap-10 sm:px-10"
            >
              <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
                <span className="text-3xl font-light tabular-nums text-[#ff9a46]/80" style={mono}>{s.k}</span>
                <span className="text-lg">{s.name}</span>
              </div>
              <h3 className="text-xl font-medium leading-snug sm:text-2xl">{s.head}</h3>
              <div>
                <p className="text-sm leading-relaxed text-[#f3ede4]/60">{s.body}</p>
                <span className="mt-3 inline-block rounded border border-[#ff9a46]/25 px-2 py-0.5 text-[10px] text-[#ff9a46]/80" style={mono}>
                  status: {s.status}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* roles */}
      <section className="relative z-20 mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-[#ff9a46]/70" style={mono}>four agents, one gradient</p>
        <h2 className="mb-12 max-w-2xl text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-tight">
          Everyone in the loop lowers entropy somewhere.
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6"
            >
              <div className="mb-4 text-xs tabular-nums text-[#ff9a46]/60" style={mono}>{`0${i + 1}`}</div>
              <h3 className="mb-2 text-lg font-medium">{r.t}</h3>
              <p className="text-sm leading-relaxed text-[#f3ede4]/55">{r.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="relative z-20 mx-auto max-w-6xl px-6 py-20 sm:px-10" style={mono}>
        <div className="grid grid-cols-2 gap-y-12 border-y border-white/10 py-14 text-center sm:grid-cols-4">
          {[
            ["3,140 t", "matter diverted from idle"],
            ["1,884", "lots cleared off-platform"],
            ["6.2 days", "median time to first match"],
            ["41%", "average recovery vs. write-off"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="text-[clamp(1.8rem,4vw,2.8rem)] font-light tabular-nums text-[#ff9a46]">{n}</div>
              <div className="mx-auto mt-2 max-w-[180px] text-[11px] uppercase leading-tight tracking-wider text-[#f3ede4]/45">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — cleared */}
      <section className="relative z-20 mx-auto max-w-6xl px-6 py-32 text-center sm:px-10">
        <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-[#ff9a46]/70" style={mono}>State 04 — Cleared</p>
        <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.02]">
          Put your dead stock where the order is.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" style={mono}>
          <Link href="/register" className="rounded-full bg-[#ff9a46] px-8 py-3.5 text-sm font-semibold text-[#08070b] transition-transform active:scale-[0.98]">
            Create a supplier account
          </Link>
          <Link href="/login" className="rounded-full border border-white/15 px-8 py-3.5 text-sm text-[#f3ede4]/80 transition-colors hover:border-white/40">
            I&rsquo;m a buyer or agent
          </Link>
        </div>
      </section>

      <footer className="relative z-20 mx-auto max-w-6xl px-6 pb-28 pt-10 sm:px-10" style={mono}>
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#f3ede4]/40 sm:flex-row sm:items-center">
          <span>SurplusLink — a trust-first surplus exchange. Deals close off-platform.</span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-[#f3ede4]">Privacy</Link>
            <Link href="/login" className="hover:text-[#f3ede4]">Terms</Link>
            <span className="text-[#ff9a46]/50">S → 0</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
