"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGoogleFont } from "../_components/useGoogleFont";

const type = { fontFamily: "'Special Elite', 'Courier New', monospace" };
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace" };

const PAPER = "#e7e0cd";
const INK = "#211d16";
const STAMP = "#9e3b2c";
const CLEARED = "#2f5d3a";

/** A redaction bar that retracts on scroll, revealing the truth underneath. */
function Redact({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="relative inline-block align-baseline">
      <span className="relative z-0 px-0.5" style={{ color: CLEARED }}>{children}</span>
      <motion.span
        aria-hidden
        className="absolute inset-0 z-10 origin-right"
        style={{ backgroundColor: INK }}
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, delay, ease: [0.7, 0, 0.2, 1] }}
      />
    </span>
  );
}

const CASE = [
  { c: "Counterparty", r: "a trader nobody could actually vet" },
  { c: "Quoted price", r: "a number you had no way to check" },
  { c: "Their margin", r: "a cut taken quietly, off the books" },
  { c: "Accountability", r: "none — they were gone by Friday" },
];

const PARTIES = [
  { code: "S/", t: "Supplier", d: "Files the lot: quantity, location, expected price, expiry. On the record." },
  { code: "A/", t: "Admin", d: "Reviews and stamps every lot and every account before anything moves." },
  { code: "B/", t: "Buyer", d: "Receives only vetted lots placed by the admin. Sees real specs, real asks." },
  { code: "G/", t: "Agent", d: "Routes assigned bulk lots through a known network — logged, not whispered." },
];

export default function RedactedConcept() {
  useGoogleFont("https://fonts.googleapis.com/css2?family=Special+Elite&family=JetBrains+Mono:wght@400;500;700&display=swap");

  return (
    <main
      className="relative min-h-[100dvh] w-full"
      style={{ backgroundColor: PAPER, color: INK, ...type }}
    >
      {/* paper grain + fold lines */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 4px), radial-gradient(circle at 20% 10%, rgba(120,100,60,0.10), transparent 40%), radial-gradient(circle at 85% 80%, rgba(120,100,60,0.10), transparent 45%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8">
        {/* DOSSIER HEADER */}
        <header className="flex items-start justify-between border-b-2 border-double pt-8" style={{ borderColor: INK }}>
          <div className="pb-3" style={mono}>
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">surpluslink / internal</div>
            <div className="text-sm font-bold">FILE No. SL-001 — THE SURPLUS PROBLEM</div>
          </div>
          <div className="-rotate-6 border-2 px-2 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: STAMP, borderColor: STAMP }}>
            Exhibit
          </div>
        </header>

        <div className="flex items-center justify-between py-2 text-[10px] uppercase tracking-[0.25em] opacity-55" style={mono}>
          <span>classification: was sealed</span>
          <span>pages 1 — 4</span>
          <Link href="/login" className="underline-offset-2 hover:underline">log in</Link>
        </div>

        {/* HERO — the indictment */}
        <section className="py-16">
          <p className="mb-7 text-[11px] uppercase tracking-[0.35em]" style={{ ...mono, color: STAMP }}>
            Statement of facts
          </p>
          <h1 className="text-[clamp(1.9rem,5.2vw,3.2rem)] leading-[1.15]">
            For decades, surplus inventory moved through{" "}
            <Redact>brokers nobody could vet</Redact>. They quoted{" "}
            <Redact delay={0.15}>prices nobody could check</Redact> and left with{" "}
            <Redact delay={0.3}>a margin nobody saw</Redact>.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed opacity-70">
            SurplusLink opens the file. A curated exchange where every lot is on the record,
            every party is vetted, and the introduction is made in the open.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3" style={mono}>
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#e7e0cd] transition-transform active:scale-[0.98]"
              style={{ backgroundColor: INK }}
            >
              Request clearance
            </Link>
            <Link href="/login" className="border px-6 py-3 text-sm uppercase tracking-wide transition-colors hover:bg-[#211d16] hover:text-[#e7e0cd]" style={{ borderColor: INK }}>
              View assigned lots
            </Link>
          </div>
        </section>

        {/* THE CASE FILE — redacted ledger */}
        <section className="py-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-lg font-bold uppercase tracking-wide">The back channel, on the record</span>
            <span className="h-px flex-1" style={{ backgroundColor: INK, opacity: 0.4 }} />
          </div>
          <div className="border-2" style={{ borderColor: INK }}>
            {CASE.map((row, i) => (
              <div
                key={row.c}
                className="grid grid-cols-[120px_1fr] items-center gap-4 border-b px-4 py-4 last:border-0 sm:grid-cols-[180px_1fr]"
                style={{ borderColor: "rgba(33,29,22,0.25)" }}
              >
                <div className="text-[11px] uppercase tracking-widest opacity-60" style={mono}>{row.c}</div>
                <div className="text-base sm:text-lg">
                  <Redact delay={i * 0.08}>{row.r}</Redact>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] opacity-50" style={mono}>
            scroll to declassify each line
          </p>
        </section>

        {/* WHAT THE OPEN FILE SHOWS — parties */}
        <section className="py-16">
          <h2 className="mb-2 text-[clamp(1.4rem,3.6vw,2.1rem)] leading-tight">
            Once it&rsquo;s open, here&rsquo;s who signs the page.
          </h2>
          <p className="mb-9 max-w-lg opacity-65">
            Four parties, each named, each accountable. No anonymous middle.
          </p>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2" style={{ backgroundColor: "rgba(33,29,22,0.25)" }}>
            {PARTIES.map((p) => (
              <div key={p.t} className="p-6" style={{ backgroundColor: PAPER }}>
                <div className="mb-3 inline-block border px-2 py-0.5 text-xs font-bold tracking-widest" style={{ ...mono, borderColor: INK }}>{p.code}</div>
                <h3 className="mb-2 text-lg font-bold uppercase tracking-wide">{p.t}</h3>
                <p className="text-sm leading-relaxed opacity-70">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EVIDENCE — stats */}
        <section className="py-12" style={mono}>
          <div className="grid grid-cols-2 border-2" style={{ borderColor: INK }}>
            {[
              ["3,140 t", "stock cleared, fully logged"],
              ["1,884", "introductions made in the open"],
              ["100%", "lots reviewed before assignment"],
              ["0", "anonymous counterparties"],
            ].map(([n, l], i) => (
              <div key={l} className={`p-6 ${i < 2 ? "border-b-2" : ""} ${i % 2 === 0 ? "border-r-2" : ""}`} style={{ borderColor: INK }}>
                <div className="text-[clamp(1.6rem,4vw,2.4rem)] font-bold tabular-nums">{n}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider opacity-60">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* DECLASSIFIED STAMP + CTA */}
        <section className="relative py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 1.4, rotate: -18 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -9 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.2, 1.4, 0.4, 1] }}
            className="mx-auto mb-10 inline-block border-4 px-6 py-2 text-2xl font-bold uppercase tracking-[0.2em]"
            style={{ color: CLEARED, borderColor: CLEARED }}
          >
            Declassified
          </motion.div>
          <h2 className="mx-auto max-w-2xl text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            Move your surplus through a channel you can actually read.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3" style={mono}>
            <Link href="/register" className="px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#e7e0cd] transition-transform active:scale-[0.98]" style={{ backgroundColor: INK }}>
              Open a supplier file
            </Link>
            <Link href="/login" className="border px-8 py-3.5 text-sm uppercase tracking-wide transition-colors hover:bg-[#211d16] hover:text-[#e7e0cd]" style={{ borderColor: INK }}>
              I&rsquo;m a buyer or agent
            </Link>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t-2 border-double py-8 text-[10px] uppercase tracking-[0.25em] opacity-60" style={{ ...mono, borderColor: INK }}>
          <span>SurplusLink — file SL-001</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:underline">Privacy</Link>
            <Link href="/login" className="hover:underline">Terms</Link>
          </div>
          <span>end of document</span>
        </footer>
      </div>
    </main>
  );
}
