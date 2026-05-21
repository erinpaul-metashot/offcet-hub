"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  ShieldCheck, 
  MapPin, 
  Scale, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  Zap,
  ChevronDown
} from "lucide-react";

interface MaterialLot {
  id: string;
  title: string;
  category: string;
  weight: string;
  location: string;
  specs: string[];
  supplier: string;
}

const LOTS: MaterialLot[] = [
  { id: "LOT-01", title: "Bulk PET Resin Regrind", category: "Plastics", weight: "18.0 Tons", location: "Newark, NJ", specs: ["Clean cold-wash", "Pre-consumer regrind", "Intrinsically clean PET"], supplier: "Apex Polymers LLC" },
  { id: "LOT-02", title: "HDPE Shredded Bottles (Flakes)", category: "Plastics", weight: "24.5 Tons", location: "Detroit, MI", specs: ["98% clean separation", "Baled weight certificates", "Post-industrial source"], supplier: "Vantage Plastics Corp" },
  { id: "LOT-03", title: "Aluminum Extrusion Offcuts", category: "Metals", weight: "6.0 Pallets", location: "Phoenix, AZ", specs: ["6063 Alloy specification", "Clean bundles", "Mill certificate logged"], supplier: "Phoenix Metalworks" },
  { id: "LOT-04", title: "Unused Corrugated Cartons", category: "Packaging", weight: "3,200 Units", location: "Chicago, IL", specs: ["200# Mullen test", "Awaiting packaging match", "Stored in dry environment"], supplier: "Midwest Box Co." }
];

export default function DesignFiveFull() {
  const [selectedLotId, setSelectedLotId] = useState<string>("LOT-01");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const selectedLot = LOTS.find(l => l.id === selectedLotId) || LOTS[0];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Sign in</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Join Exchange</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. DUAL SPLIT-SCREEN LAYOUT */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)] divide-y lg:divide-y-0 lg:divide-x divide-line">
        
        {/* LEFT COLUMN: STICKY BRAND CONTEXT */}
        <section className="lg:w-1/2 lg:h-[calc(100vh-7.5rem)] lg:sticky lg:top-30 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-surface text-left">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-2.5 py-0.5 text-brand-green">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase">THE DIRECT EXCHANGE</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[0.95] text-ink">
              Ditch broker loops. <br />Exchange <span className="text-brand-green">directly</span>.
            </h1>

            <p className="text-sm leading-relaxed text-ink-muted max-w-md">
              SurplusLink is a private coordination ledger that enables vetted manufacturers to list excess material lots and coordinate directly with regional processors. Complete chemical spec logging, 0% middleman markups.
            </p>

            <div className="flex gap-4 pt-2">
              <Link href="/register">
                <Button className="shadow-md">
                  Request Ledger Credentials <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-line pt-8 mt-12 space-y-4">
            <div className="flex gap-3">
              <ShieldCheck className="text-brand-green shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">100% Vetted Directory</h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  No duplicate brokers. No spam listings. Every operator in our private B2B ledger is verified by tax registration and facilities audits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: SCROLLABLE HOMEPAGE NARRATIVE */}
        <section className="lg:w-1/2 p-8 sm:p-12 lg:p-16 space-y-24 bg-paper scroll-smooth text-left">
          
          {/* A. MONOCHROME LOGO WALL */}
          <div className="space-y-4">
            <span className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1a0] uppercase block">SYNCHRONIZED NETWORK PARTNERS</span>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-bold tracking-widest text-[#666664] uppercase border-b border-line pb-8">
              <span>Apex Polymers</span>
              <span>Midwest Steel</span>
              <span>Vantage Corp</span>
              <span>Standard Alloys</span>
            </div>
          </div>

          {/* B. INTERACTIVE LOT INSPECTOR */}
          <div className="space-y-6">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">CATALOG PREVIEW</p>
              <h2 className="text-xl font-bold tracking-tight uppercase">Active Certified Lots</h2>
              <p className="text-xs text-ink-muted mt-1">Select an active lot below to inspect authenticated chemical analyses, weigh tickets, and supplier details.</p>
            </div>

            <div className="grid gap-3">
              {LOTS.map(lot => {
                const isSelected = selectedLotId === lot.id;
                return (
                  <div 
                    key={lot.id}
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`cursor-pointer border p-5 transition-all text-left flex flex-col justify-between gap-4
                      ${isSelected 
                        ? "border-brand-green bg-brand-green-muted/20" 
                        : "border-line hover:border-ink bg-surface"
                      }
                    `}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-bold tracking-widest uppercase text-brand-green bg-brand-green-muted px-2 py-0.5">
                          {lot.category}
                        </span>
                        <h3 className="text-xs font-bold text-ink mt-2 uppercase tracking-wider">{lot.title}</h3>
                        <p className="text-[10px] text-ink-muted mt-1">{lot.weight} • {lot.location}</p>
                      </div>
                      <ChevronRight size={14} className={`opacity-40 transition-transform ${isSelected ? "rotate-90 text-brand-green" : ""}`} />
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-t border-line/50 pt-3 mt-1 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-ink-muted uppercase font-bold text-[9px]">Vetted Supplier</span>
                              <p className="font-bold mt-0.5">{lot.supplier}</p>
                            </div>
                            <div>
                              <span className="text-ink-muted uppercase font-bold text-[9px]">Logistics State</span>
                              <p className="font-bold text-brand-green mt-0.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" /> Certified Lot
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] text-ink-muted uppercase font-bold">Vetted Spec Parameters:</span>
                            <ul className="mt-1 space-y-1">
                              {lot.specs.map((spec, i) => (
                                <li key={i} className="text-[10px] text-ink flex items-center gap-1.5">
                                  <span className="h-1 w-1 bg-brand-green rounded-full shrink-0" />
                                  {spec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. CORE FEATURES GRID */}
          <div className="space-y-8 border-t border-line pt-16">
            <span className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase block">THE PIPELINE ADVANTAGE</span>
            
            <div className="grid gap-6">
              {[
                { title: "Chemical Vetting Assurance", icon: <FileText size={16} className="text-brand-green" />, desc: "Every surplus polymer, steel bundle, or packaging lot requires verified laboratory weights and chemistry composition receipts before ledger release." },
                { title: "Direct Peer Coordination", icon: <Zap size={16} className="text-brand-green" />, desc: "Bypass static broker circles and opaque markups. Vetted entities correspond directly on freight routing and pricing parity." },
                { title: "Compliance Locking", icon: <CheckCircle2 size={16} className="text-brand-green" />, desc: "Private dashboard handles logistics mapping, recording clean certifications for transport tracking and B2B safety." }
              ].map((feat, i) => (
                <div key={i} className="border border-line p-5 bg-surface flex gap-4 text-left hover:border-brand-green transition-colors">
                  <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center shrink-0">{feat.icon}</div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">{feat.title}</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mt-1">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. TRUST OUTCOMES STATS */}
          <div className="grid border border-line divide-y divide-line bg-surface text-left">
            {[
              { label: "Assets Coordinated", val: "$12.8M", desc: "Total certified transaction volume synchronized on ledger." },
              { label: "Material Redirected", val: "14,800 Tons", desc: "Industrial surplus polymers and alloys routed directly to buyers." },
              { label: "Median Match Velocity", val: "4.2 Hours", desc: "Average duration from lot verification to partner matching." }
            ].map((stat, idx) => (
              <div key={idx} className="p-6 space-y-1">
                <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">{stat.label}</span>
                <p className="text-2xl font-extrabold text-brand-green tracking-tight">{stat.val}</p>
                <p className="text-[11px] text-ink-muted">{stat.desc}</p>
              </div>
            ))}
          </div>

          {/* E. TESTIMONIAL ADVISORY */}
          <div className="space-y-4 border-t border-line pt-16 text-left">
            <span className="text-[9px] font-bold tracking-[0.25em] text-brand-green uppercase font-bold block">LOGISTICS ADVISORY</span>
            <blockquote className="text-sm font-bold text-ink leading-relaxed">
              "SurplusLink bypassed multiple broker chains, allowing us to coordinate the direct transit of 3,200 carton pallets in under 24 hours. The direct coordination eliminated hidden markups entirely."
            </blockquote>
            <div>
              <p className="text-xs font-bold text-ink uppercase">Logistics Director</p>
              <p className="text-[10px] text-ink-muted">Midwest Box Co. • Packaging Division</p>
            </div>
          </div>

          {/* F. SYSTEM FAQ ACCORDION */}
          <div className="space-y-6 border-t border-line pt-16">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase block">SYSTEM ASSURANCE FAQS</span>
            
            <div className="border border-line divide-y divide-line bg-surface">
              {[
                { q: "How is operator compliance screened?", a: "Every operator submits corporate tax records, regional warehouse permissions, and facilities credentials. Lots without verified scale tickets are rejected." },
                { q: "Are there middleman commissions?", a: "No. We operate a flat monthly subscription model for vetted industrial manufacturers. There are zero transaction fees or broker commissions injected." }
              ].map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="p-4 space-y-2">
                    <button 
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-ink hover:text-brand-green transition-colors text-left"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={12} className={`text-ink-muted transition-transform ${isOpen ? "rotate-180 text-brand-green" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[11px] text-ink-muted leading-relaxed overflow-hidden pt-1"
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

          {/* G. CLOSING CONVERSION BANNER */}
          <div className="border border-line bg-surface p-8 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 border-l border-b border-line bg-paper px-3 py-1 text-[8px] font-mono text-ink-muted">
              SYNC: D5_SPLIT
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold tracking-tight uppercase text-ink">Request ledger access.</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Create your verified profile. Vetted manufacturers receive matched material alerts in under 24 hours.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Link href="/register">
                <Button className="px-8 shadow-sm">Get Credentials</Button>
              </Link>
            </div>
          </div>

          {/* H. PREMIUM CORPORATE FOOTER */}
          <footer className="border-t border-line pt-12 text-left text-[10px] text-ink-muted space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="font-bold text-ink uppercase tracking-wider">DIRECTORIES</span>
                <div className="flex flex-col gap-1">
                  <Link href="/register?role=supplier" className="hover:text-ink">Supplier Registration</Link>
                  <Link href="/register?role=buyer" className="hover:text-ink">Buyer Registration</Link>
                  <Link href="/login" className="hover:text-ink">Active Ledger Terminal</Link>
                </div>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-ink uppercase tracking-wider">SYSTEM ASSURANCE</span>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" /> Operational</span>
                  <span>Ledger Latency: 12ms</span>
                  <span>Nodes: 1,402 Active</span>
                </div>
              </div>
            </div>
            <div className="border-t border-line pt-4 flex flex-col sm:flex-row justify-between gap-2 text-[9px] font-semibold text-ink-muted">
              <span>Privacy Policy • Ledger Terms</span>
              <span>© 2026 SurplusLink Technologies</span>
            </div>
          </footer>

        </section>

      </div>

    </div>
  );
}
