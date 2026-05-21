"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  ArrowUpRight, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  Percent, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  FileText, 
  Zap, 
  ChevronDown, 
  Building2, 
  Lock, 
  Globe 
} from "lucide-react";

interface FeedItem {
  id: string;
  company: string;
  category: string;
  weight: string;
  location: string;
  date: string;
  status: "verified" | "matching" | "finalized";
  specs: string[];
}

const FEED_ITEMS: FeedItem[] = [
  { id: "LOT-204", company: "Vantage Plastics Corp", category: "PE Pellets", weight: "24.5 Tons", location: "Detroit, MI", date: "Today", status: "verified", specs: ["98% clean separation", "Baled weight certificates", "Post-industrial source"] },
  { id: "LOT-205", company: "Standard Steel Supply", category: "Structural Beams", weight: "15.0 Tons", location: "Gary, IN", date: "Yesterday", status: "matching", specs: ["ASTM A36 carbon steel", "Mill test report logged", "60ft length segments"] },
  { id: "LOT-206", company: "Global Board & Pulp", category: "Kraft Roll Kraftliner", weight: "8.2 Tons", location: "Savannah, GA", date: "2 days ago", status: "finalized", specs: ["200# Mullen test weight", "100% recycled fiber", "Dry warehouse stored"] },
  { id: "LOT-207", company: "Evergreen Bio-Resources", category: "Organic Woodchips", weight: "40.0 Tons", location: "Portland, OR", date: "3 days ago", status: "verified", specs: ["Clean softwood blend", "Moisture rate < 12%", "Direct loading access"] }
];

export default function DesignTwoFull() {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedLot, setSelectedLot] = useState<FeedItem | null>(null);

  const categories = ["All", "PE Pellets", "Structural Beams", "Kraft Roll Kraftliner", "Organic Woodchips"];

  const filteredItems = FEED_ITEMS.filter(item => {
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    const matchesSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40 transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <a href="#features" className="hover:text-brand-green transition-colors">Features</a>
              <a href="#feed" className="hover:text-brand-green transition-colors">Exchange Feed</a>
              <a href="#pipeline" className="hover:text-brand-green transition-colors">Pipeline</a>
              <a href="#stats" className="hover:text-brand-green transition-colors">Metrics</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Login</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Join Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAJESTIC STRIPE-INSPIRED HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-surface via-paper to-paper border-b border-line">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-2 border border-brand-green/20 bg-brand-green-muted/50 px-3 py-1 text-brand-green">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">DIRECT INDUSTRIAL EXCHANGES</span>
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-ink">
              The direct infrastructure for <span className="text-brand-green">manufacturing surplus</span>.
            </h1>
            
            <p className="text-sm sm:text-base leading-relaxed text-ink-muted max-w-xl">
              We bypass broker markups and static spreadsheets. Our direct coordination ledger links vetted manufacturers with certified regional buyers in total compliance.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register">
                <Button className="shadow-md">
                  Request Ledger Access <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
              <a href="#feed">
                <Button variant="secondary">
                  Explore Live Logs
                </Button>
              </a>
            </div>
          </div>

          {/* High-Fidelity SVG & Interactive Visual Panel */}
          <div className="border border-line bg-surface p-3 shadow-md relative">
            <div className="border border-line bg-paper p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                  <span className="text-[9px] font-mono font-bold tracking-widest text-ink-muted">NODE: ACTIVE_SYNC</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-green bg-brand-green-muted px-2 py-0.5">Vetted Chain</span>
              </div>

              {/* Graphic metrics indicator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-line bg-surface p-4 text-left">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-ink-muted">Transaction Velocity</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold tracking-tight text-ink">4.2 Hrs</span>
                    <span className="text-[9px] text-brand-green font-bold flex items-center"><TrendingUp size={10} className="mr-0.5" /> Direct</span>
                  </div>
                </div>
                <div className="border border-line bg-surface p-4 text-left">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-ink-muted">Ledger Sync Rate</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold tracking-tight text-ink">99.98%</span>
                    <span className="text-[9px] text-brand-green font-bold flex items-center">Secure</span>
                  </div>
                </div>
              </div>

              {/* Graphic Flow Representation */}
              <div className="space-y-2 border border-line bg-surface p-4 rounded-none text-left">
                <span className="text-[9px] font-bold tracking-wide uppercase text-ink-muted block">Direct Coordination Path</span>
                <div className="flex justify-between items-center text-[10px] pt-2">
                  <span className="font-bold text-brand-green flex items-center gap-1"><Building2 size={12} /> Supplier</span>
                  <span className="text-ink-muted text-xs">━━━━━━━━❯</span>
                  <span className="font-bold text-brand-green flex items-center gap-1"><Globe size={12} /> Buyer</span>
                </div>
                <p className="text-[9px] text-ink-muted mt-2 pt-2 border-t border-line/50">Zero hidden markups. Vetted entities correspond directly on chemical analytics sheets.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MONOCHROME LOGO WALL */}
      <section className="border-b border-line py-8 bg-surface text-center space-y-4">
        <p className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">LEDGER SYNCED WITH VETTED REGIONAL PARTNERS</p>
        <div className="mx-auto max-w-7xl px-6 flex flex-wrap justify-center items-center gap-x-16 gap-y-4 text-sm font-black tracking-[0.3em] text-ink-muted uppercase">
          <span className="hover:text-ink transition-colors cursor-pointer">Apex Polymers</span>
          <span className="hover:text-ink transition-colors cursor-pointer">Midwest Steel</span>
          <span className="hover:text-ink transition-colors cursor-pointer">Vantage Corp</span>
          <span className="hover:text-ink transition-colors cursor-pointer">Standard Alloys</span>
        </div>
      </section>

      {/* 4. CORE VALUE PILLARS (BENTO GRID CELLS) */}
      <section id="features" className="py-20 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">CORE ASSURANCE</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Structured to eliminate transaction friction.</h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">By combining strict digital vetting and a private exchange, SurplusLink enables high-volume surplus coordination with absolute trust.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between hover:border-brand-green transition-all shadow-sm">
            <div className="space-y-3 text-left">
              <div className="h-10 w-10 bg-brand-green-muted flex items-center justify-center text-brand-green"><ShieldCheck size={18} /></div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">100% Vetted Directories</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                We verify tax credentials, operational permits, and warehouse records of every supplier and buyer before releasing dashboard keys.
              </p>
            </div>
            <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Verified Compliance</span>
          </div>

          <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between hover:border-brand-green transition-all shadow-sm">
            <div className="space-y-3 text-left">
              <div className="h-10 w-10 bg-brand-green-muted flex items-center justify-center text-brand-green"><FileText size={18} /></div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Authenticated Spec Logs</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Suppliers upload chemical analysis sheets, weight tickets, and composition records. static parameters are strictly audited and rejected.
              </p>
            </div>
            <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Certified Metrics</span>
          </div>

          <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between hover:border-brand-green transition-all shadow-sm">
            <div className="space-y-3 text-left">
              <div className="h-10 w-10 bg-brand-green-muted flex items-center justify-center text-brand-green"><Zap size={18} /></div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">0% Broker Markup</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Opaque broker circles are completely bypassed. Buyers and suppliers coordinate directly at true market value with no added middleman fees.
              </p>
            </div>
            <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Direct Exchange</span>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE EXCHANGE FEED SIMULATOR */}
      <section id="feed" className="py-20 bg-surface border-t border-b border-line">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-left">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-brand-green">LIVE EXCHANGE DIRECTORY</p>
              <h2 className="text-2xl font-extrabold tracking-tight uppercase">Curated Surplus Listings</h2>
              <p className="text-xs text-ink-muted mt-1">Real-time matching registry of authenticated industrial materials.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-line text-xs focus:border-brand-green outline-none bg-paper"
              />
            </div>
          </div>

          {/* Filter Categories Chips */}
          <div className="flex flex-wrap gap-2 text-left">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider border transition-all rounded-none
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

          {/* Table Directory */}
          <div className="border border-line bg-paper overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface text-ink-muted text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Lot Registry ID</th>
                    <th className="py-4 px-6">Corporate Source</th>
                    <th className="py-4 px-6">Material Type</th>
                    <th className="py-4 px-6">Certified Weight</th>
                    <th className="py-4 px-6">Warehouse Location</th>
                    <th className="py-4 px-6 text-right">Ledger State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs">
                  {filteredItems.map((item, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedLot(item)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-ink-muted">{item.id}</td>
                      <td className="py-4 px-6 font-bold">{item.company}</td>
                      <td className="py-4 px-6 font-semibold text-brand-green-light">{item.category}</td>
                      <td className="py-4 px-6 font-mono font-bold">{item.weight}</td>
                      <td className="py-4 px-6 text-ink-muted">{item.location}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border
                          ${item.status === "verified" ? "border-brand-green bg-brand-green-muted text-brand-green" : ""}
                          ${item.status === "matching" ? "border-ink bg-surface text-ink" : ""}
                          ${item.status === "finalized" ? "border-line bg-muted text-ink-muted line-through" : ""}
                        `}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-ink-muted italic">
                        No active lots found matching your filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Lot Detail Modal Overlay (Simulated B2B Console) */}
      <AnimatePresence>
        {selectedLot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLot(null)}
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
                  <span className="text-[9px] font-mono font-bold text-ink-muted">{selectedLot.id}</span>
                  <h3 className="text-sm font-extrabold uppercase tracking-tight text-ink mt-1">{selectedLot.category}</h3>
                  <p className="text-[10px] text-brand-green font-bold uppercase tracking-wider mt-0.5">{selectedLot.company}</p>
                </div>
                <button 
                  onClick={() => setSelectedLot(null)}
                  className="text-ink-muted hover:text-ink text-xs font-bold uppercase tracking-widest"
                >
                  Close ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-ink-muted uppercase font-bold text-[9px] block">Verified Weight</span>
                  <span className="font-bold text-ink mt-0.5 block">{selectedLot.weight}</span>
                </div>
                <div>
                  <span className="text-ink-muted uppercase font-bold text-[9px] block">Warehouse Base</span>
                  <span className="font-bold text-ink mt-0.5 block">{selectedLot.location}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-ink-muted uppercase font-bold block">Vetted Specifications Sheet</span>
                <div className="border border-line bg-surface p-4 space-y-1.5">
                  {selectedLot.specs.map((spec, i) => (
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
                <Button variant="secondary" onClick={() => setSelectedLot(null)} className="px-4 text-xs">Back</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. TRUST PIPELINE TIMELINE */}
      <section id="pipeline" className="py-20 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
        <div className="text-center space-y-2">
          <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase bg-brand-green-muted px-3 py-1">THE DIRECT PATHWAY</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Vetted supply coordination in 3 steps</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12 text-left">
          {[
            { num: "01", title: "Corporate Onboarding", desc: "Suppliers submit operational certifications, logistics capacities, and corporate profiles for deep compliance screening." },
            { num: "02", title: "Technical Material Audit", desc: "For each listed lot, weight records, physical analysis parameters, and chemical safety documents are verified by our audit desk." },
            { num: "03", title: "Direct Matching Settlement", desc: "The ledger automatically aligns the listing with verified regional buyer profiles. Both parties settle logistics directly with zero broker margins." }
          ].map((step, idx) => (
            <div key={idx} className="space-y-4 border-l border-line pl-6 relative">
              <div className="absolute -left-1.5 top-0.5 h-3 w-3 bg-brand-green border-2 border-paper" />
              <span className="font-mono text-xl font-black text-brand-green">{step.num}</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">{step.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. TRUST OUTCOMES STATS GRID */}
      <section id="stats" className="py-16 bg-surface border-t border-b border-line text-left">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 grid border border-line divide-y md:divide-y-0 md:divide-x divide-line md:grid-cols-3 bg-paper">
          {[
            { label: "Material Coordinated", val: "14,800 Tons", desc: "Verified recycled polymers & alloy scrap traded on ledger" },
            { label: "Median Settlement Time", val: "4.2 Hours", desc: "Average duration from lot verification to buyer matching" },
            { label: "Broker Fees Incurred", val: "0.0%", desc: "Direct, transparent peer pricing with no transaction markups" }
          ].map((stat, idx) => (
            <div key={idx} className="p-8 space-y-2 hover:bg-surface/50 transition-colors">
              <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">{stat.label}</span>
              <p className="text-3xl font-extrabold text-brand-green tracking-tight">{stat.val}</p>
              <p className="text-xs text-ink-muted leading-relaxed mt-2">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TESTIMONIAL PANEL */}
      <section className="py-20 mx-auto max-w-5xl px-6 text-center space-y-6">
        <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase">ENTERPRISE ADVISORY</span>
        <blockquote className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-relaxed">
          "SurplusLink completely changed our material recycling strategy. We eliminated 12% in opaque broker markups and managed to coordinate the direct transit of 3,200 carton pallets in Detroit in under 24 hours."
        </blockquote>
        <div className="space-y-1">
          <p className="text-xs font-bold text-ink uppercase">Director of Materials Logistics</p>
          <p className="text-[10px] text-ink-muted">Midwest Box Co. • Packaging Division</p>
        </div>
      </section>

      {/* 9. SYSTEM FAQ ACCORDION */}
      <section className="py-20 bg-surface border-t border-line text-left">
        <div className="mx-auto max-w-3xl px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM ASSURANCE</span>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase">Frequently Answered Questions</h2>
          </div>

          <div className="border border-line bg-paper divide-y divide-line">
            {[
              { q: "How does compliance verification work?", a: "Every operator submits their tax registration, facilities permits, and operational safety certificates. In addition, each material lot listed requires laboratory weight certificates before release." },
              { q: "Are there transaction or subscription fees?", a: "We operate a flat monthly subscription model for vetted industrial manufacturers. There are zero transaction fees or broker commissions injected into your exchanges." },
              { q: "How are logistics and transit handled?", a: "Once a match is settled, our dashboard releases direct contact credentials. Buyers and suppliers coordinate transport directly, utilizing standard freight channels." }
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

      {/* 10. CLOSING CONVERSION CTA BANNER */}
      <section className="py-20 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="border border-line bg-paper p-8 sm:p-16 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 border-l border-b border-line bg-surface px-3 py-1 text-[8px] font-mono text-ink-muted">
            SYNC: D2_CONVERT
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-ink">Join the direct exchange.</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Create your corporate profile in our directory. Receive matched industrial surplus listings verified in under 24 hours.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/register">
              <Button className="px-8 shadow-sm">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. PREMIUM SYSTEM FOOTER */}
      <footer className="border-t border-line bg-surface py-16 px-6 sm:px-8 lg:px-12 text-left">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              The direct coordination ledger for corporate raw materials. Eliminating intermediaries globally.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">DIRECTORIES</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <Link href="/register?role=supplier" className="hover:text-ink">Supplier Signup</Link>
              <Link href="/register?role=buyer" className="hover:text-ink">Buyer Signup</Link>
              <Link href="/login" className="hover:text-ink">Active Ledger Terminal</Link>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM ASSURANCE</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Status: Operational</span>
              <span>Ledger Latency: 12ms</span>
              <span>Active sync nodes: 1,402</span>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">LEGAL</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span>Privacy Policy</span>
              <span>Ledger Terms of Service</span>
              <span className="font-semibold mt-2">© 2026 SurplusLink Technologies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
