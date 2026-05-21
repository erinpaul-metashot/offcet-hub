"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  ArrowRight, 
  Check, 
  Search, 
  ChevronRight, 
  Plus, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  FileText 
} from "lucide-react";

interface MockLot {
  id: string;
  title: string;
  category: string;
  weight: string;
  location: string;
  specs: string[];
}

const SNAPSHOT_LOTS: MockLot[] = [
  { id: "LOT-09", title: "Recycled Alloy Ingot Offcuts", category: "Metals", weight: "12.4 Tons", location: "Seattle, WA", specs: ["6063 Alloy specification", "Clean bundles", "Mill certificate logged"] },
  { id: "LOT-10", title: "Unused Corrugated Cartons", category: "Packaging", weight: "4,500 Units", location: "Grand Rapids, MI", specs: ["200# Mullen test", "Awaiting packaging match", "Dry environment stored"] },
  { id: "LOT-11", title: "Bulk Polyethylene Granules", category: "Plastics", weight: "18.0 Tons", location: "Newark, NJ", specs: ["Clean cold-wash", "Pre-consumer regrind", "Intrinsically clean PET"] }
];

export default function DesignThreeFull() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedLotId, setSelectedLotId] = useState<string>("LOT-09");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const selectedLot = SNAPSHOT_LOTS.find(l => l.id === selectedLotId) || SNAPSHOT_LOTS[0];

  const steps = [
    { num: "01", title: "Supplier Intake & Verification", detail: "Suppliers register and upload physical weight slips, chemical composition records, and specifications. Every listing is audited before release." },
    { num: "02", title: "Compliance Certification", detail: "SurplusLink operations audit the submitted documents, verify profile credentials, and register certified indicators on-ledger." },
    { num: "03", title: "Targeted B2B Coordination", detail: "The matching engine routes listings to verified local buyer directories directly, eliminating broad public noise and broker friction." }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#1c1c1c] font-sans selection:bg-[#1a5632] selection:text-white pb-20">
      
      {/* 1. MINIMALIST HEADER */}
      <header className="w-full border-b border-[#e2e2e0] bg-[#fcfcf9]/90 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-12">
            <span className="text-xs font-black tracking-[0.3em] uppercase text-brand-green">SURPLUSLINK</span>
            <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-[#666664]">
              <a href="#about" className="hover:text-[#1c1c1c] transition-colors">Philosophy</a>
              <a href="#pipeline" className="hover:text-[#1c1c1c] transition-colors">Process</a>
              <a href="#lookup" className="hover:text-[#1c1c1c] transition-colors">Directory</a>
              <a href="#metrics" className="hover:text-[#1c1c1c] transition-colors">Outcomes</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#666664] hover:text-[#1c1c1c] cursor-pointer transition-colors">Console</span>
            </Link>
            <Link href="/register">
              <span className="border border-[#1c1c1c] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1c1c1c] hover:text-white transition-colors cursor-pointer">
                Join Ledger
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 mt-16 space-y-28">

        {/* 2. ELEGANT ASYMMETRIC HERO */}
        <section id="about" className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-end border-b border-[#e2e2e0] pb-16">
          <div className="space-y-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-green">SYSTEM 3.0 // SWISS ARCHITECTURE</span>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.0] text-[#1c1c1c]">
              A borderless B2B grid for <span className="font-normal italic text-brand-green-light">vetted surplus</span>.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-[#666664] max-w-xl">
              SurplusLink completely replaces opaque broker channels. We provide a direct coordination grid designed for manufacturers who value structural precision and direct transactional compliance.
            </p>
          </div>
          <div className="flex flex-col justify-end items-start border-t lg:border-t-0 lg:border-l border-[#d1d1d0] pt-6 lg:pt-0 lg:pl-8 space-y-6 text-left">
            <p className="text-xs text-[#666664] leading-relaxed">
              We operate an audited, direct physical catalog where materials are logged with precise chemical tickets. Verified buyers matching specific requirements are connected instantly.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 group text-[10px] font-bold uppercase tracking-widest text-brand-green hover:text-brand-green-light transition-colors">
              Request Ledger Credentials <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        {/* 3. MONOCHROME PARTNERS LIST */}
        <section className="text-left space-y-4">
          <span className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1a0] uppercase block">SYNCHRONIZED NETWORK NODES</span>
          <div className="flex flex-wrap gap-x-16 gap-y-3 text-xs font-bold tracking-widest text-[#666664] uppercase border-b border-[#e2e2e0] pb-8">
            <span>Apex Polymers LLC</span>
            <span>Midwest Metals Inc</span>
            <span>Vantage Industrial</span>
            <span>Standard Alloy Co</span>
          </div>
        </section>

        {/* 4. SWISS PROCESS PIPELINE TIMELINE */}
        <section id="pipeline" className="space-y-12 text-left">
          <span className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1a0] uppercase">THE PIPELINE ASSURANCE</span>
          
          <div className="grid lg:grid-cols-3 gap-12">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div 
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer transition-all border-t pt-8 space-y-4
                    ${isActive 
                      ? "border-brand-green" 
                      : "border-[#d1d1d0] opacity-60 hover:opacity-100"
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-semibold text-[#a1a1a0]">{step.num}</span>
                    {isActive && <Check size={14} className="text-brand-green" />}
                  </div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-[#1c1c1c]">{step.title}</h3>
                  <p className="text-xs text-[#666664] leading-relaxed">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. INTERACTIVE DIRECTORY SEARCH LOOKUP */}
        <section id="lookup" className="grid lg:grid-cols-[1fr_1.8fr] gap-12 border-t border-[#e2e2e0] pt-16">
          <div className="space-y-4 text-left">
            <span className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1a0] uppercase">DIRECTORY snapshot</span>
            <h2 className="text-xl font-bold tracking-tight uppercase">Vetted Industrial Catalog</h2>
            <p className="text-xs text-[#666664] leading-relaxed">
              Select an active ledger lot to inspect exact weight logs, physical parameters, and verified regional certificates.
            </p>
            <div className="pt-2">
              <Link href="/register">
                <span className="inline-block border border-[#1c1c1c] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1c1c1c] hover:text-white transition-colors cursor-pointer">
                  Request Directory Keys
                </span>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-3">
              {SNAPSHOT_LOTS.map(lot => {
                const isSelected = selectedLotId === lot.id;
                return (
                  <div 
                    key={lot.id}
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`cursor-pointer p-5 transition-all text-left border flex flex-col gap-4
                      ${isSelected 
                        ? "border-[#1c1c1c] bg-white shadow-sm" 
                        : "border-[#e2e2e0] hover:border-[#a1a1a0] bg-transparent"
                      }
                    `}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-[#a1a1a0]">{lot.id}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green bg-[#e9f2ec] px-2 py-0.5">{lot.category}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1c1c1c] mt-2 uppercase tracking-wider">{lot.title}</h4>
                        <p className="text-[10px] text-[#666664] mt-0.5">{lot.weight} • {lot.location}</p>
                      </div>
                      <ChevronRight size={14} className={`opacity-40 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-t border-[#e2e2e0]/60 pt-3 space-y-3"
                        >
                          <div className="text-[10px] text-[#666664] space-y-1">
                            <span className="font-bold uppercase tracking-wider text-[#1c1c1c] text-[9px]"> Vetted Parameters:</span>
                            {lot.specs.map((spec, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="h-1 w-1 bg-brand-green rounded-full shrink-0" />
                                <span>{spec}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. HEAVY TYPOGRAPHIC METRICS */}
        <section id="metrics" className="border-t border-[#e2e2e0] pt-16 grid sm:grid-cols-3 gap-8 text-left">
          {[
            { label: "Assets Coordinated", val: "$12.8M", desc: "Total certified transaction exchange volume logged directly on-ledger." },
            { label: "Material Redirected", val: "14.8k Tons", desc: "Total surplus polymers and alloys routed away from landfill." },
            { label: "Direct Savings Rate", val: "12.4%", desc: "Average buyer cost improvement achieved by bypassing middleman brokers." }
          ].map((metric, idx) => (
            <div key={idx} className="space-y-3">
              <span className="text-[9px] font-bold tracking-[0.25em] text-[#a1a1a0] uppercase block">{metric.label}</span>
              <p className="text-4xl font-light text-brand-green tracking-tight font-serif italic">{metric.val}</p>
              <p className="text-xs text-[#666664] leading-relaxed">{metric.desc}</p>
            </div>
          ))}
        </section>

        {/* 7. CUSTOMER ADVISORY PANEL */}
        <section className="border-t border-[#e2e2e0] pt-16 grid lg:grid-cols-2 gap-12 text-left">
          <div className="space-y-6">
            <span className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1a0] uppercase">LOGISTICS ADVISORY</span>
            <blockquote className="font-serif text-lg italic text-[#1c1c1c] leading-relaxed">
              "SurplusLink bypassed multiple broker chains, allowing us to list and match 3,200 carton pallets in Detroit in under 24 hours. The direct coordination eliminated hidden markups entirely."
            </blockquote>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1c1c1c]">Materials Logistics Lead</p>
              <p className="text-[10px] text-[#666664] mt-0.5">Midwest Box Co. • Packaging Division</p>
            </div>
          </div>

          <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-[#e2e2e0] pt-8 lg:pt-0 lg:pl-12">
            <span className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1a0] uppercase">SYSTEM ASSURANCE</span>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1c1c]">How are suppliers vetted?</h4>
                <p className="text-[11px] text-[#666664] leading-relaxed">We audit corporate registrations, regional warehouse permissions, and facilities credentials. Lots without verified scale tickets are rejected.</p>
              </div>
              <div className="space-y-1 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1c1c]">Are there hidden transaction fees?</h4>
                <p className="text-[11px] text-[#666664] leading-relaxed">No. We maintain a flat monthly directory subscription. There are zero broker commissions or transaction-level markups introduced.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. CLOSING CONVERSION BANNER */}
        <section className="border border-[#1c1c1c] p-8 sm:p-16 text-center space-y-8 relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 border-l border-b border-[#e2e2e0] bg-[#fcfcf9] px-3 py-1 text-[8px] font-mono text-[#a1a1a0]">
            SYNC: D3_SWISS
          </div>
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="font-serif text-3xl font-light tracking-tight text-[#1c1c1c] leading-none">
              Register your materials profile.
            </h3>
            <p className="text-xs text-[#666664] leading-relaxed">
              Create your audited credentials. Vetted operators receive targeted direct matches in under 24 hours.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/register">
              <span className="border border-[#1c1c1c] bg-[#1c1c1c] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-transparent hover:text-[#1c1c1c] transition-colors cursor-pointer">
                Get Started
              </span>
            </Link>
          </div>
        </section>

      </div>

      {/* 9. PREMIUM SYSTEM FOOTER */}
      <footer className="border-t border-[#e2e2e0] bg-[#fcfcf9] py-16 px-6 sm:px-8 lg:px-12 mt-28 text-left">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
            <p className="text-[10px] text-[#666664] leading-relaxed">
              The direct catalog coordinate for corporate industrial surplus. Bypassing broker chains.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-[#a1a1a0] uppercase">LEGER</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-[#666664]">
              <Link href="/register?role=supplier" className="hover:text-ink">Supplier Registration</Link>
              <Link href="/register?role=buyer" className="hover:text-ink">Buyer Registration</Link>
              <Link href="/login" className="hover:text-ink">Ledger Terminal Access</Link>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-[#a1a1a0] uppercase">METRICS</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-[#666664]">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" /> Operational</span>
              <span>Ledger Latency: 12ms</span>
              <span>Sync Nodes: 1,402 Active</span>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-[#a1a1a0] uppercase">CORPORATE</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-[#666664]">
              <span>Privacy Directory</span>
              <span>System Terms</span>
              <span className="font-semibold mt-2">© 2026 SurplusLink Technologies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
