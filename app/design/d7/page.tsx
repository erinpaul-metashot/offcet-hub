"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  Search, 
  ArrowRight, 
  ArrowDownToLine, 
  CheckCircle, 
  Database, 
  ShieldCheck,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  ChevronDown
} from "lucide-react";

interface TradeLot {
  id: string;
  category: "Plastics" | "Metals" | "Packaging";
  material: string;
  weight: string;
  location: string;
  supplier: string;
  purity: string;
  status: "Certified" | "Awaiting" | "Exchanged";
}

const LEDGER_LOTS: TradeLot[] = [
  { id: "LOT-092", category: "Plastics", material: "Bulk HDPE Flakes (Cold-Wash)", weight: "24.5 Tons", location: "Detroit, MI", supplier: "Vantage Plastics Corp", purity: "99.2%", status: "Certified" },
  { id: "LOT-093", category: "Plastics", material: "PET Resin Granules (Clear)", weight: "18.0 Tons", location: "Newark, NJ", supplier: "Apex Polymers LLC", purity: "99.8%", status: "Certified" },
  { id: "LOT-094", category: "Metals", material: "6063 Aluminum Extrusion Offcuts", weight: "12.4 Tons", location: "Phoenix, AZ", supplier: "Phoenix Metalworks", purity: "98.5%", status: "Certified" },
  { id: "LOT-095", category: "Packaging", material: "Standard Kraftliner Roll Pallets", weight: "8.2 Tons", location: "Savannah, GA", supplier: "Global Board & Pulp", purity: "100% Recycled", status: "Certified" },
  { id: "LOT-096", category: "Packaging", material: "Double-Wall Corrugated Cartons", weight: "3,200 Units", location: "Chicago, IL", supplier: "Midwest Box Co.", purity: "200# Mullen Test", status: "Awaiting" },
  { id: "LOT-097", category: "Metals", material: "Copper Busbar Offcuts (Electrical)", weight: "4.5 Tons", location: "Grand Rapids, MI", supplier: "Midwest Alloy Corp", purity: "99.9%", status: "Exchanged" }
];

export default function DesignSevenFull() {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);

  const filteredLots = LEDGER_LOTS.filter(lot => {
    const matchesCategory = filterCategory === "All" || lot.category === filterCategory;
    const matchesSearch = lot.material.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lot.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lot.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleCsvDownload = () => {
    setCsvLoading(true);
    setCsvSuccess(false);
    setTimeout(() => {
      setCsvLoading(false);
      setCsvSuccess(true);
      setTimeout(() => setCsvSuccess(false), 2000);
    }, 1200);
  };

  return (
    <div className="bg-paper text-ink font-mono text-xs selection:bg-brand-green selection:text-paper pb-20">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK // DIRECT_LEDGER</span>
            <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              <a href="#about" className="hover:text-brand-green transition-colors">Vetting</a>
              <a href="#terminal" className="hover:text-brand-green transition-colors">Active Terminal</a>
              <a href="#features" className="hover:text-brand-green transition-colors">Specifications</a>
              <a href="#metrics" className="hover:text-brand-green transition-colors">Liquidity</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-[10px] font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Sync Console</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Join Ledger</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 space-y-28">

        {/* 2. MAJESTIC DATA-DENSE HERO */}
        <section id="about" className="grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center border-b border-line pb-16">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 border border-brand-green/20 bg-brand-green-muted/65 px-3 py-1 text-brand-green">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">SYSTEM LEVEL: HIGH_LIQUIDITY</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[0.95] text-ink">
              The data-dense catalog for <span className="text-brand-green">B2B surplus stock</span>.
            </h1>

            <p className="text-xs leading-relaxed text-ink-muted max-w-xl font-sans">
              We replace static files, paper logs, and opaque middlemen chains. SurplusLink provides a direct peer-to-peer ledger synchronizing vetted manufacturing raw materials with certified buyers at true market value.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 font-mono">
              <Link href="/register">
                <Button className="shadow-md text-xs">
                  Request Ledger Credentials <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
              <a href="#terminal">
                <Button variant="secondary" className="text-xs">
                  Explore Active Terminal
                </Button>
              </a>
            </div>
          </div>

          {/* Data-dense system metrics board */}
          <div className="border border-line bg-surface p-6 space-y-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Ledger Sync Summary</span>
            <div className="space-y-3 border-t border-line pt-3 font-mono text-[11px] text-ink-muted">
              <div className="flex justify-between">
                <span>Active Synchronization Nodes</span>
                <span className="font-bold text-ink">1,402 Active</span>
              </div>
              <div className="flex justify-between">
                <span>Vetted Polymers Capacity</span>
                <span className="font-bold text-brand-green">8,410 Tons</span>
              </div>
              <div className="flex justify-between">
                <span>Vetted Structural Alloys</span>
                <span className="font-bold text-brand-green">6,390 Tons</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Latency Rate</span>
                <span className="font-bold text-ink">12 ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. ACTIVE TERMINAL SPREADSHEET SIMULATOR */}
        <section id="terminal" className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-brand-green">ACTIVE LEDGER REGISTRY</p>
              <h2 className="text-xl font-bold uppercase tracking-tight text-ink mt-1">High-Volume Exchange Console</h2>
              <p className="text-xs text-ink-muted mt-1 font-sans">Real-time matching log of authenticated industrial lots with full chemical specs.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Filter by ID/Material..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-line text-xs font-mono focus:border-brand-green outline-none bg-paper"
                />
              </div>

              {/* CSV Trigger */}
              <button 
                onClick={handleCsvDownload}
                disabled={csvLoading}
                className="flex items-center justify-center gap-2 border border-line bg-paper hover:bg-muted text-ink px-4 py-2 font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <ArrowDownToLine size={13} />
                {csvLoading ? "Generating..." : csvSuccess ? "Downloaded!" : "Export CSV"}
              </button>
            </div>
          </div>

          {/* Filter Categories Chips */}
          <div className="flex flex-wrap gap-2 text-left">
            {["All", "Plastics", "Metals", "Packaging"].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors
                  ${filterCategory === cat 
                    ? "bg-brand-green text-paper border-brand-green" 
                    : "border-line text-ink-muted hover:border-ink hover:text-ink bg-paper"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dense Table Grid */}
          <div className="border border-line bg-paper overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-line bg-surface text-ink-muted text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Registry ID</th>
                    <th className="py-3 px-4">Material Specification</th>
                    <th className="py-3 px-4">Weight</th>
                    <th className="py-3 px-4">Warehouse Location</th>
                    <th className="py-3 px-4">Vetted Supplier</th>
                    <th className="py-3 px-4">Spec Purity</th>
                    <th className="py-3 px-4 text-right">Ledger State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredLots.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-ink-muted">{lot.id}</td>
                      <td className="py-3 px-4 font-bold text-ink">{lot.material}</td>
                      <td className="py-3 px-4 text-ink">{lot.weight}</td>
                      <td className="py-3 px-4 text-ink-muted">{lot.location}</td>
                      <td className="py-3 px-4 text-ink-muted">{lot.supplier}</td>
                      <td className="py-3 px-4 font-semibold text-brand-green-light">{lot.purity}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border
                          ${lot.status === "Certified" ? "border-brand-green bg-brand-green-muted text-brand-green" : ""}
                          ${lot.status === "Awaiting" ? "border-line bg-surface text-ink-muted" : ""}
                          ${lot.status === "Exchanged" ? "border-line bg-muted text-ink-muted line-through" : ""}
                        `}>
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredLots.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-ink-muted italic">
                        No active lots found matching your filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. SPECIFICATION MECHANICS PILLARS */}
        <section id="features" className="space-y-8 text-left">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">SPECIFICATION AUDITS</span>
            <h2 className="text-2xl font-extrabold tracking-tight text-center font-sans">Every transaction mapped and compliance verified.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 font-sans">
            <div className="border border-line bg-surface p-6 space-y-4 hover:border-brand-green transition-colors text-left">
              <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><ShieldCheck size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">100% Vetted Directory</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                We verify tax IDs, operational permissions, and warehouse records of every supplier and buyer before releasing keys.
              </p>
            </div>

            <div className="border border-line bg-surface p-6 space-y-4 hover:border-brand-green transition-colors text-left">
              <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Database size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">Chemical Purity Logs</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Suppliers must upload weight tickets, certificates of analysis, and high-resolution photo sheets. Opaque parameters are rejected.
              </p>
            </div>

            <div className="border border-line bg-surface p-6 space-y-4 hover:border-brand-green transition-colors text-left">
              <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Zap size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">0% Broker Markups</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Opaque broker margins are entirely bypassed. Buyers and suppliers coordinate directly, establishing pricing parity.
              </p>
            </div>
          </div>
        </section>

        {/* 5. LIQUIDITY STATS */}
        <section id="metrics" className="py-16 bg-surface border-t border-b border-line text-left">
          <div className="grid border border-line divide-y md:divide-y-0 md:divide-x divide-line md:grid-cols-3 bg-paper font-mono">
            {[
              { label: "Assets Coordinated", val: "$12.8M", desc: "Total certified transaction volume synchronized on ledger." },
              { label: "Material Redirected", val: "14,800 Tons", desc: "Industrial surplus polymers and alloys routed directly to buyers." },
              { label: "Median Match Velocity", val: "4.2 Hours", desc: "Average duration from lot verification to partner matching." }
            ].map((stat, idx) => (
              <div key={idx} className="p-8 space-y-2 hover:bg-surface/50 transition-colors">
                <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">{stat.label}</span>
                <p className="text-2xl font-extrabold text-brand-green tracking-tight">{stat.val}</p>
                <p className="text-xs text-ink-muted leading-relaxed mt-2 font-sans">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. TESTIMONIAL ADVISORY */}
        <section className="py-16 mx-auto max-w-5xl text-center space-y-6">
          <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase block">LOGISTICS ADVISORY</span>
          <blockquote className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-relaxed font-sans">
            "SurplusLink bypassed multiple broker chains, allowing us to list and match 3,200 carton pallets in Detroit in under 24 hours. The direct coordination eliminated hidden markups entirely."
          </blockquote>
          <div className="space-y-1 font-sans">
            <p className="text-xs font-bold text-ink uppercase">Logistics Lead</p>
            <p className="text-[10px] text-ink-muted">Midwest Box Co. • Packaging Division</p>
          </div>
        </section>

        {/* 7. SYSTEM FAQ ACCORDION */}
        <section className="py-16 bg-surface border-t border-line text-left font-sans">
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
            SYNC: D7_TERMINAL
          </div>
          <div className="max-w-2xl mx-auto space-y-4 font-sans">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-ink">Join the direct exchange.</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-sans">
              Create your corporate profile in our directory. Receive matched industrial surplus listings verified in under 24 hours.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/register">
              <Button className="px-8 shadow-sm text-xs">Get Credentials</Button>
            </Link>
          </div>
        </section>

      </div>

      {/* 9. SYSTEM FOOTER */}
      <footer className="border-t border-line bg-surface py-16 px-6 sm:px-8 lg:px-12 text-left font-sans">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green font-mono">SURPLUSLINK</span>
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
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase font-mono">SYSTEM ASSURANCE</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Status: Operational</span>
              <span>Ledger Latency: 12ms</span>
              <span>Nodes: 1,402 Active</span>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">LEGAL</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span>Privacy Policy</span>
              <span>Ledger Terms of Service</span>
              <span className="font-mono text-[9px] block mt-1">© 2026 SurplusLink Technologies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
