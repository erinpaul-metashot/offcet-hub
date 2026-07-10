"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useGoogleFont } from "../_components/useGoogleFont";

const serif = { fontFamily: "'Fraunces', Georgia, serif" };
const hand = { fontFamily: "'Caveat', cursive" };
const sans = { fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" };

const LINEN = "#ddd2c0";
const FELT = "#26443a";
const INK = "#231f18";
const GREEN = "#1a5632";

type BinId = "buyer" | "agent" | "hold";
type Lot = { id: string; t: string; q: string; loc: string; px: string };

const INITIAL: Lot[] = [
  { id: "SL-4471", t: "Cold-rolled steel offcuts", q: "1.2 t", loc: "Coimbatore", px: "₹38/kg" },
  { id: "SL-4502", t: "HDPE regrind, natural", q: "6.8 t", loc: "Houston", px: "$0.41/lb" },
  { id: "SL-4488", t: "Nitrile glove overstock", q: "84 cartons", loc: "Rotterdam", px: "€0.022" },
  { id: "SL-4530", t: "Lithium cell packs, B-grade", q: "310 units", loc: "Shenzhen", px: "$3.10" },
  { id: "SL-4544", t: "Powder-coat pigment, mixed", q: "440 kg", loc: "Vitória", px: "$2.80/kg" },
];

const BINS: { id: BinId; label: string; note: string; tone: string }[] = [
  { id: "buyer", label: "Assign → Buyer", note: "matched to a shop", tone: GREEN },
  { id: "agent", label: "Route → Agent", note: "into the network", tone: "#9a6b1e" },
  { id: "hold", label: "Hold / Reject", note: "needs another look", tone: "#8a3a2e" },
];

const FLOW = [
  { n: "01", t: "A supplier drops a lot on the table", d: "Photos, quantity, location, expected price. It lands in the queue as pending_review." },
  { n: "02", t: "An admin picks it up and reads it", d: "Specs checked, category fixed, quality judged by a human — not an algorithm guessing." },
  { n: "03", t: "It gets placed, not broadcast", d: "Assigned to the one buyer or agent who actually needs it. Deliberate, every time." },
];

export default function SortingTableConcept() {
  useGoogleFont("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Caveat:wght@500;600;700&display=swap");

  const tableRef = useRef<HTMLDivElement | null>(null);
  const binRefs = {
    buyer: useRef<HTMLDivElement | null>(null),
    agent: useRef<HTMLDivElement | null>(null),
    hold: useRef<HTMLDivElement | null>(null),
  };

  const [pile, setPile] = useState<Lot[]>(INITIAL);
  const [placed, setPlaced] = useState<Record<BinId, Lot[]>>({ buyer: [], agent: [], hold: [] });
  const [dragging, setDragging] = useState<string | null>(null);

  const cleared = placed.buyer.length + placed.agent.length + placed.hold.length;

  const handleEnd = (lot: Lot, _e: unknown, info: PanInfo) => {
    setDragging(null);
    const { x, y } = info.point;
    for (const id of ["buyer", "agent", "hold"] as BinId[]) {
      const r = binRefs[id].current?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        setPile((prev) => prev.filter((l) => l.id !== lot.id));
        setPlaced((prev) => ({ ...prev, [id]: [...prev[id], lot] }));
        return;
      }
    }
  };

  const reset = () => {
    setPile(INITIAL);
    setPlaced({ buyer: [], agent: [], hold: [] });
  };

  return (
    <main className="relative min-h-[100dvh] w-full" style={{ backgroundColor: LINEN, color: INK, ...sans }}>
      {/* canvas-weave texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.5] mix-blend-multiply"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 3px)" }}
        aria-hidden
      />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 sm:px-10">
          <span className="text-lg font-semibold" style={serif}>SurplusLink</span>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/login" className="opacity-65 transition-opacity hover:opacity-100">Log in</Link>
            <Link href="/register" className="rounded-full px-5 py-2 text-sm font-medium text-[#f3eee2] transition-transform active:scale-[0.98]" style={{ backgroundColor: FELT }}>
              Get on the table
            </Link>
          </div>
        </header>

        {/* HERO + SORTING TABLE */}
        <section className="mx-auto max-w-6xl px-6 pt-14 sm:px-10">
          <p className="mb-4 text-sm uppercase tracking-[0.3em]" style={{ color: GREEN }}>curation, by hand</p>
          <h1 className="max-w-3xl text-[clamp(2.4rem,6vw,4.6rem)] font-medium leading-[0.98] tracking-tight" style={serif}>
            Surplus doesn&rsquo;t get matched by an algorithm. It gets sorted on a table.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-70">
            Every lot passes through a human. Try it — drag a ticket into a tray and clear the queue yourself.
          </p>

          {/* the felt mat */}
          <div
            ref={tableRef}
            className="relative mt-10 overflow-hidden rounded-[28px] p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] sm:p-8"
            style={{ backgroundColor: FELT, minHeight: 560 }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_2px_1px_rgba(255,255,255,0.08),inset_0_-40px_80px_rgba(0,0,0,0.25)]" />

            <div className="relative flex items-center justify-between text-[#e9e2d2]">
              <span className="text-sm uppercase tracking-[0.25em] opacity-70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>review queue</span>
              <span className="text-2xl" style={hand}>{cleared} of {INITIAL.length} cleared</span>
            </div>

            {/* the pile of lot tickets */}
            <div className="relative mt-6 min-h-[230px]">
              {pile.length === 0 ? (
                <div className="flex min-h-[230px] flex-col items-center justify-center text-center text-[#e9e2d2]">
                  <p className="text-3xl" style={hand}>Table cleared. Nice.</p>
                  <button onClick={reset} className="mt-4 rounded-full border border-[#e9e2d2]/40 px-5 py-2 text-sm text-[#e9e2d2] transition-colors hover:bg-[#e9e2d2]/10">
                    Reset the queue
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {pile.map((lot, i) => (
                    <motion.div
                      key={lot.id}
                      drag
                      dragConstraints={tableRef}
                      dragElastic={0.18}
                      dragSnapToOrigin
                      onDragStart={() => setDragging(lot.id)}
                      onDragEnd={(e, info) => handleEnd(lot, e, info)}
                      initial={{ opacity: 0, y: 16, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: (i - 2) * 3 }}
                      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                      whileDrag={{ scale: 1.06, rotate: 0, zIndex: 60, boxShadow: "0 24px 50px rgba(0,0,0,0.45)" }}
                      whileHover={{ y: -6 }}
                      className="absolute left-1/2 top-2 w-[230px] cursor-grab touch-none select-none rounded-lg bg-[#f1e9d8] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.3)] active:cursor-grabbing sm:left-[8%] sm:w-[250px]"
                      style={{ marginLeft: i * 6, zIndex: dragging === lot.id ? 60 : pile.length - i }}
                    >
                      {/* tag hole + string */}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: INK, opacity: 0.4 }} />
                        <span className="text-[10px] uppercase tracking-widest opacity-50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lot.id}</span>
                      </div>
                      <h3 className="text-lg font-semibold leading-snug" style={serif}>{lot.t}</h3>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <div><dt className="opacity-45">qty</dt><dd className="font-medium tabular-nums">{lot.q}</dd></div>
                        <div><dt className="opacity-45">loc</dt><dd className="font-medium">{lot.loc}</dd></div>
                        <div><dt className="opacity-45">ask</dt><dd className="font-medium tabular-nums">{lot.px}</dd></div>
                      </dl>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {pile.length > 0 && (
                <p className="pointer-events-none absolute bottom-0 right-2 text-2xl text-[#e9e2d2]/70" style={hand}>
                  drag me ↓
                </p>
              )}
            </div>

            {/* the trays */}
            <div className="relative mt-6 grid grid-cols-3 gap-3 sm:gap-5">
              {BINS.map((bin) => (
                <div
                  key={bin.id}
                  ref={binRefs[bin.id]}
                  className="relative rounded-2xl border-2 border-dashed border-[#e9e2d2]/30 p-3 text-center transition-colors sm:p-4"
                  style={{ minHeight: 96 }}
                >
                  <div className="text-base font-semibold text-[#f1e9d8] sm:text-lg" style={serif}>{bin.label}</div>
                  <div className="text-[11px] uppercase tracking-wider text-[#e9e2d2]/55" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{bin.note}</div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {placed[bin.id].map((l) => (
                      <motion.span
                        key={l.id}
                        initial={{ scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 20 }}
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: bin.tone, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {l.id}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW THE TABLE WORKS */}
        <section className="mx-auto max-w-6xl px-6 py-28 sm:px-10">
          <h2 className="mb-14 max-w-2xl text-[clamp(1.8rem,4vw,2.8rem)] font-medium leading-tight" style={serif}>
            Three pairs of hands, one clean handoff.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FLOW.map((f, i) => (
              <motion.div
                key={f.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <div className="mb-4 text-5xl" style={{ ...hand, color: GREEN }}>{f.n}</div>
                <h3 className="mb-2 text-xl font-semibold" style={serif}>{f.t}</h3>
                <p className="leading-relaxed opacity-70">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* stats */}
        <section className="mx-auto max-w-6xl px-6 pb-8 sm:px-10">
          <div className="grid grid-cols-2 gap-y-10 rounded-3xl border border-black/10 bg-white/30 py-12 sm:grid-cols-4">
            {[
              ["3,140 t", "sorted off warehouse floors"],
              ["1,884", "lots placed by hand"],
              ["6.2 days", "median time to a match"],
              ["41%", "recovered vs. write-off"],
            ].map(([n, l]) => (
              <div key={l} className="px-4 text-center">
                <div className="text-[clamp(1.8rem,4vw,2.8rem)] font-medium tabular-nums" style={{ ...serif, color: GREEN }}>{n}</div>
                <div className="mx-auto mt-1 max-w-[170px] text-xs uppercase leading-tight tracking-wider opacity-55">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-28 text-center sm:px-10">
          <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.0]" style={serif}>
            Put your surplus in front of the right pair of hands.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="rounded-full px-8 py-3.5 text-sm font-medium text-[#f3eee2] transition-transform active:scale-[0.98]" style={{ backgroundColor: FELT }}>
              List a lot
            </Link>
            <Link href="/login" className="rounded-full border-2 px-8 py-3.5 text-sm font-medium transition-colors hover:bg-black/5" style={{ borderColor: INK }}>
              I&rsquo;m a buyer or agent
            </Link>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-6 pb-28 pt-8 sm:px-10">
          <div className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 text-sm opacity-60 sm:flex-row sm:items-center">
            <span>SurplusLink — curated surplus, sorted by people.</span>
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
