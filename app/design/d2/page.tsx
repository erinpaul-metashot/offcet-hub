"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGoogleFont } from "../_components/useGoogleFont";

const heavy = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace" };

const LOTS = [
  { id: "SL-4471", t: "Cold-rolled steel offcuts", q: "1.2 t", loc: "Coimbatore, IN", px: "₹38/kg", status: "assigned", idle: "idle 9 mo" },
  { id: "SL-4488", t: "Nitrile glove overstock", q: "84 cartons", loc: "Rotterdam, NL", px: "€0.022/unit", status: "approved", idle: "idle 4 mo" },
  { id: "SL-4502", t: "HDPE regrind, natural", q: "6.8 t", loc: "Houston, US", px: "$0.41/lb", status: "assigned", idle: "idle 11 mo" },
  { id: "SL-4519", t: "Corrugated B-flute, surplus run", q: "22,000 sheets", loc: "Łódź, PL", px: "€0.09/sheet", status: "pending_review", idle: "idle 2 mo" },
  { id: "SL-4530", t: "Lithium cell packs, B-grade", q: "310 units", loc: "Shenzhen, CN", px: "$3.10/unit", status: "approved", idle: "idle 7 mo" },
  { id: "SL-4544", t: "Powder-coat pigment, mixed", q: "440 kg", loc: "Vitória, BR", px: "$2.80/kg", status: "assigned", idle: "idle 5 mo" },
];

const ROLES = [
  { t: "Supplier", d: "Walks in with a corner full of dead stock. Lists it. Walks out lighter." },
  { t: "Buyer", d: "Only ever sees the shelves an admin pointed them at. No noise, no haggling pit." },
  { t: "Agent", d: "Knows where the buyers are. Takes a bulk lot and routes it through the network." },
  { t: "Admin", d: "Holds the only master key. Vets every face and every crate before it's lit." },
];

export default function TorchlightConcept() {
  useGoogleFont("https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap");

  const rootRef = useRef<HTMLElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const hasPointer = useRef(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    hasPointer.current = !coarse;
    target.current = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
    pos.current = { ...target.current };
    setReady(true);

    const onMove = (e: PointerEvent) => {
      hasPointer.current = true;
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let tms = 0;
    const tick = (ts: number) => {
      // auto-roam on touch / before first move
      if (!hasPointer.current || coarse) {
        tms = ts / 1000;
        target.current = {
          x: window.innerWidth * (0.5 + 0.3 * Math.sin(tms * 0.6)),
          y: window.innerHeight * (0.42 + 0.22 * Math.cos(tms * 0.43)),
        };
      }
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--mx", `${pos.current.x}px`);
        el.style.setProperty("--my", `${pos.current.y}px`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const beam = ready ? 1 : 0;

  return (
    <main
      ref={rootRef}
      className="relative min-h-[100dvh] w-full bg-[#050504] text-[#f6efe2]"
      style={{ ...heavy, ["--mx" as string]: "50vw", ["--my" as string]: "40vh" }}
    >
      {/* warm floor glow under the beam (below content) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          opacity: beam,
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgba(255,176,84,0.10), rgba(255,150,60,0.04) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* CONTENT */}
      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 sm:px-10" style={mono}>
          <span className="text-sm font-bold tracking-tight" style={heavy}>SurplusLink</span>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/login" className="text-[#f6efe2]/70 transition-colors hover:text-white">log in</Link>
            <Link
              href="/register"
              className="rounded-sm border border-[#ffb054]/50 px-4 py-1.5 text-[#ffb054] shadow-[0_0_24px_rgba(255,176,84,0.25)] transition-colors hover:bg-[#ffb054] hover:text-[#050504]"
            >
              get a key
            </Link>
          </div>
        </header>

        <section className="mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-center px-6 sm:px-10">
          <p className="mb-6 text-[11px] uppercase tracking-[0.42em] text-[#ffb054]/80" style={mono}>
            lights out · 240,000 sq ft of someone else&rsquo;s overstock
          </p>
          <h1
            className="max-w-4xl text-[clamp(2.6rem,8vw,6.4rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
            style={{ textShadow: "0 0 60px rgba(255,176,84,0.18)" }}
          >
            Most surplus<br />never sees<br />a buyer.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-[#f6efe2]/60 sm:text-lg" style={{ fontFamily: heavy.fontFamily }}>
            It just goes dark in a corner of a warehouse. SurplusLink is the beam —
            it finds the one lot a buyer needs and lights it up for them. Nothing else.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3" style={mono}>
            <Link
              href="/register"
              className="rounded-sm bg-[#ffb054] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#050504] shadow-[0_0_40px_rgba(255,176,84,0.4)] transition-transform active:scale-[0.98]"
            >
              List a lot
            </Link>
            <Link href="/login" className="rounded-sm border border-white/15 px-7 py-3.5 text-sm uppercase tracking-wide text-[#f6efe2]/80 transition-colors hover:border-[#ffb054]/60">
              Browse my aisle
            </Link>
          </div>
          <p className="mt-16 animate-pulse text-[11px] uppercase tracking-[0.4em] text-[#f6efe2]/40" style={mono}>
            move your light to look around
          </p>
        </section>

        {/* the aisle of lots */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-5" style={mono}>
            <h2 className="text-xl font-semibold uppercase tracking-wide" style={heavy}>Aisle 07 — live this week</h2>
            <span className="text-xs text-[#ffb054]/70">{LOTS.length} lots in the dark</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOTS.map((l) => (
              <article
                key={l.id}
                className="group relative overflow-hidden rounded-md border border-white/10 bg-white/[0.015] p-5 transition-all duration-300 hover:border-[#ffb054]/50 hover:bg-[#ffb054]/[0.04] hover:shadow-[0_0_50px_rgba(255,176,84,0.12)]"
                style={mono}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#f6efe2]/40">
                  <span>{l.id}</span>
                  <span className="text-[#ffb054]/70">{l.idle}</span>
                </div>
                <h3 className="mt-3 text-lg leading-snug text-[#f6efe2]" style={heavy}>{l.t}</h3>
                <dl className="mt-4 space-y-1.5 text-xs text-[#f6efe2]/55">
                  <div className="flex justify-between"><dt>qty</dt><dd className="tabular-nums text-[#f6efe2]/80">{l.q}</dd></div>
                  <div className="flex justify-between"><dt>where</dt><dd className="text-[#f6efe2]/80">{l.loc}</dd></div>
                  <div className="flex justify-between"><dt>ask</dt><dd className="tabular-nums text-[#f6efe2]/80">{l.px}</dd></div>
                </dl>
                <div className="mt-4 inline-flex items-center gap-2 border-t border-white/5 pt-3 text-[10px] uppercase tracking-wider">
                  <span className={`h-1.5 w-1.5 rounded-full ${l.status === "assigned" ? "bg-[#ffb054]" : l.status === "approved" ? "bg-emerald-400/80" : "bg-white/30"}`} />
                  <span className="text-[#f6efe2]/60">{l.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* who is in the warehouse */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
          <h2 className="mb-12 max-w-2xl text-[clamp(1.6rem,3.6vw,2.6rem)] font-bold uppercase leading-tight">
            Four people are in this building.
          </h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <div key={r.t} className="bg-white/[0.015] p-6 transition-colors hover:bg-[#ffb054]/[0.05]">
                <div className="mb-4 text-xs tabular-nums text-[#ffb054]/60" style={mono}>{`0${i + 1}`}</div>
                <h3 className="mb-2 text-lg font-semibold uppercase tracking-wide">{r.t}</h3>
                <p className="text-sm leading-relaxed text-[#f6efe2]/55" style={mono}>{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* stats */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10" style={mono}>
          <div className="grid grid-cols-2 gap-y-10 border-y border-white/10 py-12 sm:grid-cols-4">
            {[
              ["3,140 t", "pulled out of the dark"],
              ["1,884", "lots matched to a buyer"],
              ["6.2 d", "median time to first light"],
              ["0", "deals lost to a broker we can't see"],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tabular-nums text-[#ffb054]" style={heavy}>{n}</div>
                <div className="mx-auto mt-2 max-w-[170px] text-[10px] uppercase leading-tight tracking-wider text-[#f6efe2]/45">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-32 text-center sm:px-10">
          <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5.5vw,4rem)] font-extrabold uppercase leading-[0.95]" style={{ textShadow: "0 0 60px rgba(255,176,84,0.2)" }}>
            Stop storing what someone else is searching for.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3" style={mono}>
            <Link href="/register" className="rounded-sm bg-[#ffb054] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#050504] shadow-[0_0_40px_rgba(255,176,84,0.4)] transition-transform active:scale-[0.98]">
              Open a supplier account
            </Link>
            <Link href="/login" className="rounded-sm border border-white/15 px-8 py-4 text-sm uppercase tracking-wide text-[#f6efe2]/80 transition-colors hover:border-[#ffb054]/60">
              I&rsquo;m a buyer or agent
            </Link>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-6 pb-28 pt-8 sm:px-10" style={mono}>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#f6efe2]/40 sm:flex-row sm:items-center">
            <span>SurplusLink — curated surplus, lit one lot at a time.</span>
            <div className="flex gap-5">
              <Link href="/login" className="hover:text-white">Privacy</Link>
              <Link href="/login" className="hover:text-white">Terms</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* THE DARKNESS — torch mask sits above content, punching a hole at the cursor */}
      <div
        className="pointer-events-none fixed inset-0 z-20 transition-opacity duration-700"
        style={{
          opacity: beam,
          background:
            "radial-gradient(260px circle at var(--mx) var(--my), rgba(5,5,4,0) 0%, rgba(5,5,4,0.35) 38%, rgba(5,5,4,0.9) 66%, rgba(5,5,4,0.985) 82%)",
        }}
        aria-hidden
      />
      {/* faint cold ambient so the page isn't a total void before first paint */}
      <div className="pointer-events-none fixed inset-0 z-[19] bg-[radial-gradient(circle_at_50%_120%,rgba(40,44,60,0.18),transparent_55%)]" aria-hidden />
    </main>
  );
}
