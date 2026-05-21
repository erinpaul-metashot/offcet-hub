"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  FileText, 
  Zap, 
  ChevronDown, 
  Database, 
  Lock 
} from "lucide-react";

interface LotMatch {
  id: string;
  material: string;
  weight: string;
  location: string;
  status: "certified" | "matching";
}

const LIVE_MATCHES: LotMatch[] = [
  { id: "LOT-092", material: "HDPE Flakes (Cold-Wash)", weight: "24.5 Tons", location: "Detroit, MI", status: "certified" },
  { id: "LOT-093", material: "PET Resin Granules (Clear)", weight: "18.0 Tons", location: "Newark, NJ", status: "certified" },
  { id: "LOT-094", material: "6063 Aluminum Extrusions", weight: "12.4 Tons", location: "Phoenix, AZ", status: "matching" }
];

export default function DesignEightFull() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper pb-20">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK // BENTO_GRID</span>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <a href="#about" className="hover:text-brand-green transition-colors">Vetting</a>
              <a href="#matrix" className="hover:text-brand-green transition-colors">Bento Board</a>
              <a href="#stats" className="hover:text-brand-green transition-colors">Metrics</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Console</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Join Matrix</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 space-y-28">

        {/* 2. MAJESTIC BENTO HERO */}
        <section id="about" className="text-center max-w-3xl mx-auto space-y-8 pt-8">
          <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1 text-brand-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Apple-Inspired Bento Matrix Layout</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-ink">
            A modular B2B exchange in <span className="text-brand-green">perfect geometry</span>.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-ink-muted max-w-2xl mx-auto">
            Bypass broker chains and static spreadsheets. SurplusLink provides a mathematically aligned, direct coordination grid mapping verified industrial surplus to nearby processors.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button className="shadow-md">
                Get Credentials <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
            <a href="#matrix">
              <Button variant="secondary">
                View Bento Matrix
              </Button>
            </a>
          </div>
        </section>

        {/* 3. THE MODULAR BENTO GRID MATRIX */}
        <section id="matrix" className="grid gap-6 md:grid-cols-3">
          
          {/* Box 1: Large Hero Product Preview */}
          <div className="border border-line bg-surface p-8 md:col-span-2 flex flex-col justify-between hover:border-brand-green transition-colors text-left space-y-6">
            <div className="space-y-3">
              <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase bg-brand-green-muted px-2 py-0.5">DIRECT MATCHING FEED</span>
              <h3 className="text-xl font-extrabold text-ink uppercase tracking-tight">Vetted Industrial Logs</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Our database updates automatically as manufacturing plants log verified excess lots. All listings feature full laboratory composition records.
              </p>
            </div>
            
            {/* Embedded Live Match Preview Widget */}
            <div className="border border-line bg-paper p-4 space-y-2">
              {LIVE_MATCHES.map(match => (
                <div key={match.id} className="flex justify-between items-center text-xs py-2 border-b border-line/60 last:border-0">
                  <div>
                    <span className="font-mono text-ink-muted text-[10px] mr-2">{match.id}</span>
                    <span className="font-bold text-ink">{match.material}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted text-[10px]">{match.location}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border
                      ${match.status === "certified" ? "border-brand-green bg-brand-green-muted text-brand-green" : "border-ink text-ink bg-surface"}
                    `}>
                      {match.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Vetting Checkbox Safety */}
          <div className="border border-line bg-surface p-8 flex flex-col justify-between hover:border-brand-green transition-colors text-left">
            <div className="space-y-4">
              <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase bg-brand-green-muted px-2 py-0.5">VETTING PROTOCOL</span>
              <h3 className="text-md font-extrabold text-ink uppercase tracking-tight">100% Vetted Directories</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                We verify tax credentials, facilities permits, and warehouse weight receipts of every supplier and buyer. Lots missing analytics sheets are strictly rejected.
              </p>
            </div>
            <div className="border-t border-line pt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-ink-muted">
                <CheckCircle2 size={13} className="text-brand-green shrink-0" />
                <span>Entity Credentials Audited</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <CheckCircle2 size={13} className="text-brand-green shrink-0" />
                <span>Weight slips Authenticated</span>
              </div>
            </div>
          </div>

          {/* Box 3: Trust metrics velocity */}
          <div className="border border-line bg-surface p-8 flex flex-col justify-between hover:border-brand-green transition-colors text-left">
            <div className="space-y-2">
              <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SETTLEMENT VELOCITY</span>
              <h4 className="text-2xl font-extrabold text-brand-green tracking-tight font-display">4.2 Hours</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Average duration elapsed from supplier lot verification to targeted buyer matching. Opaque broker channels completely eliminated.
              </p>
            </div>
            <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4">Direct Sync</span>
          </div>

          {/* Box 4: Trust metrics savings */}
          <div className="border border-line bg-surface p-8 flex flex-col justify-between hover:border-brand-green transition-colors text-left">
            <div className="space-y-2">
              <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">BROKER FEES INCURRED</span>
              <h4 className="text-2xl font-extrabold text-brand-green tracking-tight font-display">0.0% Markup</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                True peer-to-peer ledger pricing. We do not insert hidden broker markups or commissions. flat monthly subscriptions.
              </p>
            </div>
            <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4">Zero commissions</span>
          </div>

          {/* Box 5: Monochromatic partner cloud */}
          <div className="border border-line bg-surface p-8 flex flex-col justify-between hover:border-brand-green transition-colors text-left">
            <div className="space-y-4">
              <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">LEDGER COMPLIANCE</span>
              <h3 className="text-xs font-bold uppercase text-ink tracking-wider">Sync with Vetted Partners</h3>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Our private B2B directory maps coordinates between compliant operators globally, locking in logistics routes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[9px] font-extrabold text-[#666664] uppercase pt-4 border-t border-line">
              <span>Apex</span>
              <span>Midwest</span>
              <span>Vantage</span>
              <span>Standard</span>
            </div>
          </div>

        </section>

        {/* 4. CORE FEATURES MATRIX */}
        <section id="features" className="space-y-8 text-left">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">CORE MATRIX MECHANICS</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">Every transaction mapped and verified.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-colors">
              <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><ShieldCheck size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">Vetted Directory</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                We verify tax IDs, operational permissions, and warehouse records of every supplier and buyer before releasing keys.
              </p>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-colors">
              <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Database size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">Chemical Analysis Sheets</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Suppliers must upload weight tickets, certificates of analysis, and high-resolution photo sheets. Opaque parameters are rejected.
              </p>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-colors">
              <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Lock size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">Logistics Locks</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Opaque broker margins are entirely bypassed. Buyers and suppliers coordinate directly, establishing pricing parity.
              </p>
            </div>
          </div>
        </section>

        {/* 5. OUTCOMES STATS */}
        <section id="stats" className="py-16 bg-surface border-t border-b border-line text-left">
          <div className="grid border border-line divide-y md:divide-y-0 md:divide-x divide-line md:grid-cols-3 bg-paper">
            {[
              { label: "Assets Coordinated", val: "$12.8M", desc: "Total certified transaction volume synchronized on ledger." },
              { label: "Material Redirected", val: "14,800 Tons", desc: "Industrial surplus polymers and alloys routed directly to buyers." },
              { label: "Median Match Velocity", val: "4.2 Hours", desc: "Average duration from lot verification to partner matching." }
            ].map((stat, idx) => (
              <div key={idx} className="p-8 space-y-2 hover:bg-surface/50 transition-colors">
                <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">{stat.label}</span>
                <p className="text-3xl font-extrabold text-brand-green tracking-tight">{stat.val}</p>
                <p className="text-xs text-ink-muted leading-relaxed mt-2">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. TESTIMONIAL ADVISORY */}
        <section className="py-16 mx-auto max-w-5xl text-center space-y-6">
          <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase">LOGISTICS ADVISORY</span>
          <blockquote className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-relaxed">
            "SurplusLink bypassed multiple broker chains, allowing us to list and match 3,200 carton pallets in Detroit in under 24 hours. The direct coordination eliminated hidden markups entirely."
          </blockquote>
          <div className="space-y-1">
            <p className="text-xs font-bold text-ink uppercase">Logistics Lead</p>
            <p className="text-[10px] text-ink-muted">Midwest Box Co. • Packaging Division</p>
          </div>
        </section>

        {/* 7. FAQ ACCORDION */}
        <section className="py-16 bg-surface border-t border-line text-left">
          <div className="mx-auto max-w-3xl px-6 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase block">SYSTEM ASSURANCE</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-center uppercase">Frequently Answered Questions</h2>
            </div>

            <div className="border border-line bg-paper divide-y divide-line">
              {[
                { q: "How is operator compliance screened?", a: "Every operator submits corporate tax records, regional warehouse permissions, and facilities credentials. Lots without verified scale tickets are rejected." },
                { q: "Are there middleman commissions?", a: "No. We operate a flat monthly subscription model for vetted industrial manufacturers. There are zero transaction fees or broker commissions injected." }
              ].map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="p-5 space-y-3">
                    <button 
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-ink hover:text-brand-green transition-colors text-left"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={14} className={`text-ink-muted transition-transform ${isOpen ? "rotate-180 text-brand-green" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-ink-muted leading-relaxed overflow-hidden"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. CLOSING CONVERSION BANNER */}
        <section className="border border-line bg-surface p-8 sm:p-16 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 border-l border-b border-line bg-paper px-3 py-1 text-[8px] font-mono text-ink-muted">
            SYNC: D8_BENTO
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-ink">Join the direct exchange.</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Create your corporate profile in our directory. Receive matched industrial surplus listings verified in under 24 hours.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/register">
              <Button className="px-8 shadow-sm">Get Credentials</Button>
            </Link>
          </div>
        </section>

      </div>

      {/* 9. SYSTEM FOOTER */}
      <footer className="border-t border-line bg-surface py-16 px-6 sm:px-8 lg:px-12 text-left">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              The direct catalog coordinate for corporate industrial surplus. Bypassing broker chains.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">DIRECTORIES</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <Link href="/register?role=supplier" className="hover:text-ink">Supplier Signup</Link>
              <Link href="/register?role=buyer" className="hover:text-ink">Buyer Signup</Link>
              <Link href="/login" className="hover:text-ink">Ledger Terminal Access</Link>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM ASSURANCE</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Status: Operational</span>
              <span>Ledger Latency: 12ms</span>
              <span>Sync Nodes: 1,402 Active</span>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">LEGAL</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span>Privacy Policy</span>
              <span>Ledger Terms of Service</span>
              <span>© 2026 SurplusLink Technologies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
