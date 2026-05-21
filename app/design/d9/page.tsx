"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  Search, 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ChevronDown, 
  FileText, 
  Scale, 
  CheckCircle2 
} from "lucide-react";

interface CatalogItem {
  id: string;
  title: string;
  category: "Plastics" | "Metals" | "Packaging";
  weight: string;
  location: string;
  supplier: string;
  purity: string;
  specifications: string[];
}

const ITEMS: CatalogItem[] = [
  { id: "LOT-101", title: "HDPE Flakes (Cold-Wash)", category: "Plastics", weight: "24.5 Tons", location: "Detroit, MI", supplier: "Vantage Plastics Corp", purity: "99.2% Purity", specifications: ["Clean separation", "Baled weight certificates", "Post-industrial source"] },
  { id: "LOT-102", title: "PET Resin Granules (Clear)", category: "Plastics", weight: "18.0 Tons", location: "Newark, NJ", supplier: "Apex Polymers LLC", purity: "99.8% Purity", specifications: ["Clean cold-wash", "Pre-consumer regrind", "Intrinsically clean PET"] },
  { id: "LOT-103", title: "6063 Aluminum Extrusions", category: "Metals", weight: "12.4 Tons", location: "Phoenix, AZ", supplier: "Phoenix Metalworks", purity: "98.5% Alloy", specifications: ["6063 Alloy specification", "Clean bundles", "Mill certificate logged"] },
  { id: "LOT-104", title: "Standard Kraftliner Rolls", category: "Packaging", weight: "8.2 Tons", location: "Savannah, GA", supplier: "Global Board & Pulp", purity: "100% Recycled", specifications: ["200# Mullen test", "Awaiting packaging match", "Dry warehouse stored"] },
  { id: "LOT-105", title: "Unused Corrugated Cartons", category: "Packaging", weight: "3,200 Units", location: "Chicago, IL", supplier: "Midwest Box Co.", purity: "Brand New", specifications: ["Baled weight certificates", "Clean bundle", "Stored in dry environment"] }
];

export default function DesignNineFull() {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [inspectItem, setInspectItem] = useState<CatalogItem | null>(null);

  const filteredItems = ITEMS.filter(item => {
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper pb-20">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK // CATALOG</span>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <a href="#about" className="hover:text-brand-green transition-colors">Philosophy</a>
              <a href="#catalog" className="hover:text-brand-green transition-colors">Catalog Grid</a>
              <a href="#features" className="hover:text-brand-green transition-colors">Vetting</a>
              <a href="#stats" className="hover:text-brand-green transition-colors">Outcomes</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Log in</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Join Directory</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 space-y-28">

        {/* 2. MAJESTIC CATALOG HERO */}
        <section id="about" className="text-center max-w-3xl mx-auto space-y-8 pt-8">
          <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1 text-brand-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">DIRECT INDUSTRIAL B2B CATALOG</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-ink">
            Find vetted industrial surplus <span className="text-brand-green">instantly</span>.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-ink-muted max-w-2xl mx-auto">
            Eliminate static spreadsheets and opaque broker chains. SurplusLink provides a direct, chemical-vetted B2B catalog linking compliant manufacturers with regional buyers.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button className="shadow-md">
                Register Directory Profile <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
            <a href="#catalog">
              <Button variant="secondary">
                Search Catalog Grid
              </Button>
            </a>
          </div>
        </section>

        {/* 3. PARTNERS LOGO WALL */}
        <section className="border-t border-b border-line py-8 text-center space-y-4">
          <p className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">LEDGER SYNCED WITH VETTED COMPLIANT MANUFACTURERS</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-4 text-sm font-black tracking-[0.3em] text-ink-muted uppercase">
            <span>Apex Polymers</span>
            <span>Midwest Metals</span>
            <span>Vantage Industrial</span>
            <span>Standard Alloy</span>
          </div>
        </section>

        {/* 4. THE INTERACTIVE B2B CATALOG GRID */}
        <section id="catalog" className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-brand-green">ACTIVE CATALOG PREVIEW</p>
              <h2 className="text-xl font-bold uppercase tracking-tight text-ink mt-1">Direct Exchange Registry</h2>
              <p className="text-xs text-ink-muted mt-1">Real-time matching registry of authenticated industrial materials with chemical specifications.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Search catalog items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-line text-xs focus:border-brand-green outline-none bg-paper"
              />
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

          {/* Grid of Catalog Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => setInspectItem(item)}
                className="border border-line bg-surface p-6 flex flex-col justify-between h-72 hover:border-brand-green transition-colors cursor-pointer text-left shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-ink-muted">{item.id}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green bg-brand-green-muted px-2 py-0.5">{item.category}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider line-clamp-1">{item.title}</h3>
                    <p className="text-[10px] text-brand-green font-semibold mt-1">{item.supplier}</p>
                    <p className="text-[10px] text-ink-muted mt-0.5">{item.purity}</p>
                  </div>
                </div>

                <div className="border-t border-line/60 pt-4 space-y-2 text-[10px] text-ink-muted">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><Scale size={11} /> Weight</span>
                    <span className="font-bold text-ink">{item.weight}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><MapPin size={11} /> Location</span>
                    <span className="font-bold text-ink">{item.location}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 border border-dashed border-line p-12 text-center text-xs text-ink-muted italic">
                No active lots found matching your filter parameters.
              </div>
            )}
          </div>
        </section>

        {/* Catalog Item Inspector Overlay Modal */}
        <AnimatePresence>
          {inspectItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setInspectItem(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-paper border border-line w-full max-w-lg p-6 space-y-6 text-left"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start border-b border-line pb-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-ink-muted">{inspectItem.id}</span>
                    <h3 className="text-sm font-extrabold uppercase tracking-tight text-ink mt-1">{inspectItem.title}</h3>
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-wider mt-0.5">{inspectItem.supplier}</p>
                  </div>
                  <button 
                    onClick={() => setInspectItem(null)}
                    className="text-ink-muted hover:text-ink text-xs font-bold uppercase tracking-widest"
                  >
                    Close ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-ink-muted uppercase font-bold text-[9px] block">Verified Weight</span>
                    <span className="font-bold text-ink mt-0.5 block">{inspectItem.weight}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted uppercase font-bold text-[9px] block">Warehouse Base</span>
                    <span className="font-bold text-ink mt-0.5 block">{inspectItem.location}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-ink-muted uppercase font-bold block">Vetted Specifications Sheet</span>
                  <div className="border border-line bg-surface p-4 space-y-1.5">
                    {inspectItem.specifications.map((spec, i) => (
                      <div key={i} className="text-xs text-ink flex items-center gap-2">
                        <span className="h-1.5 w-1.5 bg-brand-green rounded-full shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 border-t border-line pt-4">
                  <Link href="/register" className="flex-1">
                    <Button className="w-full py-2.5 text-xs">Acquire Lot</Button>
                  </Link>
                  <Button variant="secondary" onClick={() => setInspectItem(null)} className="px-4 text-xs">Back</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. VETTING PILLARS */}
        <section id="features" className="space-y-8 text-left">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">CORE ASSURANCE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">Every transaction mapped and verified.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><ShieldCheck size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink">100% Vetted Directory</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  We verify tax IDs, operational permissions, and warehouse records of every supplier and buyer before releasing keys.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4 block">Compliance locks</span>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><FileText size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink">Chemical Purity Logs</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Suppliers must upload weight tickets, certificates of analysis, and high-resolution photo sheets. Opaque parameters are rejected.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4 block">Spec authentication</span>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Zap size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink">0% Broker Commissions</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Opaque broker margins are entirely bypassed. Buyers and suppliers coordinate directly, establishing pricing parity.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4 block">Direct Exchanges</span>
            </div>
          </div>
        </section>

        {/* 6. OUTCOMES STATS */}
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

        {/* 7. CUSTOMER TESTIMONIAL QUOTE */}
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

        {/* 8. SYSTEM FAQ ACCORDION */}
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

        {/* 9. CLOSING CONVERSION BANNER */}
        <section className="border border-line bg-surface p-8 sm:p-16 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 border-l border-b border-line bg-paper px-3 py-1 text-[8px] font-mono text-ink-muted">
            SYNC: D9_CATALOG
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-ink">Join the direct directory.</h2>
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

      {/* 10. SYSTEM FOOTER */}
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
