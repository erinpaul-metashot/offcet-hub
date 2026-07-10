"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useGoogleFont } from "../_components/useGoogleFont";

const cond = { fontFamily: "'Oswald', ui-sans-serif, system-ui, sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace" };

const STEEL = "#1c1b18";
const CONCRETE = "#cbc7bd";
const CAUTION = "#e0a92b";

const ROLES = [
  { t: "Supplier", w: "heavy in", d: "Tips a corner of dead stock onto the platform. Lighter inventory, freed-up capital." },
  { t: "Admin", w: "the fulcrum", d: "Sits at the pivot. Vets every lot and account so the whole beam can be trusted." },
  { t: "Buyer", w: "pulls down", d: "Takes assigned lots at a real price. Cheaper input than buying new, every time." },
  { t: "Agent", w: "redistributes", d: "Moves bulk weight out across a network the platform could never reach alone." },
];

export default function BallastConcept() {
  useGoogleFont("https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap");

  const weighRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: weighRef, offset: ["start start", "end end"] });
  const rot = useTransform(scrollYProgress, [0, 1], [-13, 3]);
  const negRot = useTransform(rot, (v) => -v);
  const leftDrop = useTransform(scrollYProgress, [0, 1], [0, -10]);
  const rightDrop = useTransform(scrollYProgress, [0, 1], [0, 14]);

  const [p, setP] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setP(v));
  const recovered = Math.round(p * 3140);
  const weights = Math.min(7, Math.floor(p * 7.6));

  return (
    <main className="relative min-h-[100dvh] w-full" style={{ backgroundColor: CONCRETE, color: STEEL }}>
      {/* hazard hairlines */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.4]"
        style={{ backgroundImage: "linear-gradient(rgba(28,27,24,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,27,24,0.04) 1px, transparent 1px)", backgroundSize: "44px 44px" }}
        aria-hidden
      />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 sm:px-10" style={mono}>
          <span className="text-sm font-bold uppercase tracking-tight" style={cond}>SurplusLink</span>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/login" className="opacity-60 transition-opacity hover:opacity-100">log in</Link>
            <Link href="/register" className="px-4 py-1.5 font-bold uppercase tracking-wide text-[#cbc7bd]" style={{ backgroundColor: STEEL }}>weigh in</Link>
          </div>
        </header>

        {/* hero */}
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 sm:px-10">
          <p className="mb-5 text-[11px] uppercase tracking-[0.42em]" style={{ ...mono, color: "#8a6a16" }}>
            net weight · the cost of doing nothing
          </p>
          <h1 className="max-w-4xl text-[clamp(2.8rem,8vw,6.2rem)] uppercase leading-[0.86] tracking-tight" style={{ ...cond, fontWeight: 700 }}>
            Surplus is dead weight<br />until something lifts it.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed opacity-70 sm:text-lg">
            Left alone, excess inventory gets written off — booked as a loss, hauled to a skip.
            SurplusLink is the counterweight. Watch the balance shift.
          </p>
        </section>

        {/* PINNED WEIGHING APPARATUS */}
        <div ref={weighRef} className="relative" style={{ height: "320vh" }}>
          <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center overflow-hidden">
            {/* readouts */}
            <div className="absolute inset-x-0 top-6 mx-auto flex max-w-5xl items-start justify-between px-6 sm:px-10" style={mono}>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest opacity-55">headed for write-off</div>
                <div className="text-[clamp(1.6rem,4vw,2.6rem)] font-bold tabular-nums" style={cond}>7,600 t</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "#3f6b46" }}>recovered via surpluslink</div>
                <div className="text-[clamp(1.6rem,4vw,2.6rem)] font-bold tabular-nums" style={{ ...cond, color: "#2f5d3a" }}>{recovered.toLocaleString()} t</div>
              </div>
            </div>

            {/* THE SCALE */}
            <div className="relative" style={{ width: "min(560px, 86vw)", height: 360 }}>
              {/* post */}
              <div className="absolute left-1/2 top-[120px] h-[200px] w-[10px] -translate-x-1/2 rounded-sm" style={{ backgroundColor: STEEL }} />
              <div className="absolute bottom-0 left-1/2 h-[14px] w-[160px] -translate-x-1/2 rounded-sm" style={{ backgroundColor: STEEL }} />
              {/* pivot */}
              <div className="absolute left-1/2 top-[112px] z-20 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[3px]" style={{ backgroundColor: CAUTION, border: `2px solid ${STEEL}` }} />

              {/* beam (rotates) */}
              <motion.div
                className="absolute left-1/2 top-[120px] h-[7px] -translate-x-1/2 rounded-full"
                style={{ width: "min(520px,82vw)", backgroundColor: STEEL, rotate: rot, transformOrigin: "50% 50%" }}
              >
                {/* LEFT PAN — waste */}
                <motion.div className="absolute left-0 top-1/2 -translate-x-1/2" style={{ rotate: negRot, y: leftDrop }}>
                  <Pan
                    label="WASTE"
                    sub="skip-bound"
                    tone="#7a2e25"
                    blocks={6}
                    fill="#7a2e25"
                  />
                </motion.div>
                {/* RIGHT PAN — recovered */}
                <motion.div className="absolute right-0 top-1/2 translate-x-1/2" style={{ rotate: negRot, y: rightDrop }}>
                  <Pan
                    label="RECOVERED"
                    sub="re-sold"
                    tone="#2f5d3a"
                    blocks={weights}
                    fill={CAUTION}
                  />
                </motion.div>
              </motion.div>
            </div>

            <p className="absolute inset-x-0 bottom-8 text-center text-[11px] uppercase tracking-[0.4em] opacity-45" style={mono}>
              keep scrolling — load the pan
            </p>
          </div>
        </div>

        {/* roles as forces on the beam */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <h2 className="mb-12 max-w-2xl text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-tight" style={{ ...cond, fontWeight: 600 }}>
            Four forces act on the beam.
          </h2>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: "rgba(28,27,24,0.18)" }}>
            {ROLES.map((r, i) => (
              <motion.div
                key={r.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
                className="p-6"
                style={{ backgroundColor: CONCRETE }}
              >
                <div className="mb-3 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ ...mono, backgroundColor: STEEL, color: CONCRETE }}>{r.w}</div>
                <h3 className="mb-2 text-xl uppercase" style={{ ...cond, fontWeight: 600 }}>{r.t}</h3>
                <p className="text-sm leading-relaxed opacity-70">{r.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* stats */}
        <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10" style={mono}>
          <div className="grid grid-cols-2 gap-y-10 border-y-2 py-12 sm:grid-cols-4" style={{ borderColor: STEEL }}>
            {[
              ["41%", "average recovery vs. write-off"],
              ["1,884", "lots taken off the books"],
              ["6.2 d", "median time to first match"],
              ["3,140 t", "diverted from disposal"],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tabular-nums" style={cond}>{n}</div>
                <div className="mx-auto mt-1 max-w-[160px] text-[10px] uppercase leading-tight tracking-wider opacity-60">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-28 text-center sm:px-10">
          <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,3.6rem)] uppercase leading-[0.92]" style={{ ...cond, fontWeight: 700 }}>
            Take the loss off your books.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3" style={mono}>
            <Link href="/register" className="px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#cbc7bd] transition-transform active:scale-[0.98]" style={{ backgroundColor: STEEL }}>
              List surplus to recover
            </Link>
            <Link href="/login" className="border-2 px-8 py-4 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-[#1c1b18] hover:text-[#cbc7bd]" style={{ borderColor: STEEL }}>
              I&rsquo;m buying
            </Link>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-6 pb-28 pt-8 sm:px-10" style={mono}>
          <div className="flex flex-col items-start justify-between gap-4 border-t-2 pt-8 text-xs opacity-60 sm:flex-row sm:items-center" style={{ borderColor: STEEL }}>
            <span>SurplusLink — the counterweight to write-off.</span>
            <div className="flex gap-5">
              <Link href="/login" className="hover:opacity-100">Privacy</Link>
              <Link href="/login" className="hover:opacity-100">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Pan({ label, sub, tone, blocks, fill }: { label: string; sub: string; tone: string; blocks: number; fill: string }) {
  return (
    <div className="flex w-[150px] flex-col items-center">
      {/* chains */}
      <div className="flex w-[110px] justify-between">
        <span className="h-12 w-px" style={{ backgroundColor: STEEL }} />
        <span className="h-12 w-px" style={{ backgroundColor: STEEL }} />
      </div>
      {/* stacked load */}
      <div className="relative flex h-[70px] w-[130px] flex-col-reverse items-center justify-start gap-[3px] pb-1">
        {Array.from({ length: blocks }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: -14, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="block rounded-[2px]"
            style={{ width: 70 - i * 6, height: 8, backgroundColor: fill, border: `1.5px solid ${STEEL}` }}
          />
        ))}
      </div>
      {/* pan plate */}
      <div className="h-[8px] w-[130px] rounded-b-[14px] rounded-t-sm" style={{ backgroundColor: STEEL }} />
      <div className="mt-2 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tone }}>{label}</div>
        <div className="text-[9px] uppercase tracking-wider opacity-50">{sub}</div>
      </div>
    </div>
  );
}
