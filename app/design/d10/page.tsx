"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck, 
  Database, 
  Award, 
  Info, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  FileText, 
  MapPin, 
  Scale, 
  ArrowUpRight, 
  Check, 
  CheckCircle2, 
  HelpCircle, 
  Lock, 
  Zap, 
  Activity 
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does the SurplusLink onboarding wizard calibrate matching parameters?",
    answer: "Our automated setup wizard evaluates your organization's material category, regional logistics constraints, and volume capacity. It feeds this data directly into our localized ledger indexing engine to generate high-precision buyer and supplier nodes."
  },
  {
    question: "Is there an auditing phase for chemical and industrial compliance?",
    answer: "Absolutely. Every lot listed on the SurplusLink ledger must pass our standard physical/chemical inspection process. We match each batch with certificates of analysis (CoA) and verified safety data sheets (SDS) before it becomes discoverable by certified buyers."
  },
  {
    question: "Can we integrate this setup process with existing ERP databases?",
    answer: "Yes. SurplusLink is built to interface directly with major ERP and inventory systems (SAP, Oracle, NetSuite) via our secure API. Once onboarding is complete, you can sync lists of excess materials automatically without manual data entry."
  },
  {
    question: "What are the fees associated with direct exchange matches?",
    answer: "Unlike traditional brokers who take opaque 10% to 20% markups, SurplusLink operates on a transparent SaaS subscription model with 0.0% transaction commission fees. You pay a predictable platform rate based on your verified volume tiers."
  }
];

export default function DesignTen() {
  // Setup Wizard States
  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<"supplier" | "buyer" | "broker" | null>(null);
  const [material, setMaterial] = useState<"polymers" | "metals" | "packaging" | "electronics" | null>(null);
  const [region, setRegion] = useState<"na" | "eu" | "apac" | null>(null);
  const [volume, setVolume] = useState<"under-20" | "20-100" | "over-100" | null>(null);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Newsletter Sign-up state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Dynamic Yield Calculator for Onboarding Strategy
  const calculateMetrics = () => {
    let matchingNodes = 12;
    let carbonSavings = 25; // tons of CO2 equivalent per month
    let routeOption = "Direct Exchange Broadcast";
    let speedMetric = "4.5 hours";

    if (material === "polymers") {
      matchingNodes = region === "na" ? 48 : region === "eu" ? 36 : 28;
      carbonSavings = volume === "under-20" ? 18 : volume === "20-100" ? 64 : 195;
      routeOption = "Polymer Direct Re-pelletization Feed";
      speedMetric = "3.2 hours";
    } else if (material === "metals") {
      matchingNodes = region === "na" ? 62 : region === "eu" ? 54 : 41;
      carbonSavings = volume === "under-20" ? 45 : volume === "20-100" ? 180 : 540;
      routeOption = "Metals Closed-Loop Smelter Sync";
      speedMetric = "2.8 hours";
    } else if (material === "packaging") {
      matchingNodes = region === "na" ? 29 : region === "eu" ? 22 : 18;
      carbonSavings = volume === "under-20" ? 8 : volume === "20-100" ? 32 : 96;
      routeOption = "Corrugated Reprocessing Batch";
      speedMetric = "5.1 hours";
    } else if (material === "electronics") {
      matchingNodes = region === "na" ? 38 : region === "eu" ? 31 : 25;
      carbonSavings = volume === "under-20" ? 85 : volume === "20-100" ? 310 : 920;
      routeOption = "E-Scrap Component Refurbishing Stream";
      speedMetric = "6.4 hours";
    }

    return { matchingNodes, carbonSavings, routeOption, speedMetric };
  };

  const metrics = calculateMetrics();

  const handleRestart = () => {
    setRole(null);
    setMaterial(null);
    setRegion(null);
    setVolume(null);
    setStep(1);
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper">
      
      {/* 1. PREMIUM LINEAR-STYLE NAVIGATION HEADER */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40 transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.3em] uppercase text-brand-green bg-brand-green-muted px-2.5 py-1">
                SURPLUSLINK
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              <a href="#hero-onboarding" className="hover:text-ink transition-colors flex items-center gap-1">
                <Sparkles size={11} className="text-brand-green" /> Strategy Wizard
              </a>
              <a href="#features" className="hover:text-ink transition-colors">Core Architecture</a>
              <a href="#timeline" className="hover:text-ink transition-colors">Logistical Pathway</a>
              <a href="#metrics" className="hover:text-ink transition-colors">Global Traction</a>
              <a href="#faq" className="hover:text-ink transition-colors">System Support</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-[10px] uppercase font-bold tracking-widest text-ink hover:text-brand-green transition-colors px-4 py-2">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-brand-green hover:bg-brand-green-light text-paper text-[10px] uppercase font-bold tracking-widest px-5 py-2.5 transition-colors border border-brand-green flex items-center gap-1.5 shadow-sm">
                Register Now <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAJESTIC HERO SECTION & INTERACTIVE CALCULATOR */}
      <section id="hero-onboarding" className="border-b border-line bg-surface relative overflow-hidden py-20 px-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-blueprint-grid opacity-30 pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Bold Value Proposition */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1">
              <span className="h-1.5 w-1.5 bg-brand-green-light animate-pulse" />
              <span className="text-[8px] font-bold tracking-[0.25em] text-brand-green uppercase">
                ONBOARDING REPORT GENERATOR
              </span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] text-ink uppercase">
              Calibrate your <br className="hidden sm:inline" />
              <span className="text-brand-green">Surplus Pipeline</span> <br />
              in seconds.
            </h1>
            
            <p className="text-xs sm:text-sm leading-relaxed text-ink-muted max-w-lg">
              Stop relying on manual brokers and chaotic spreadsheets. Use our guided setup simulator on the right to project matching B2B nodes, carbon diversion impact, and automated catalog pathways customized to your operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a href="#features">
                <button className="w-full sm:w-auto border border-line bg-paper hover:bg-muted text-[10px] uppercase font-bold tracking-widest px-6 py-3.5 flex items-center justify-center gap-1.5 transition-all">
                  Inspect Platform Specs <ArrowRight size={12} />
                </button>
              </a>
              <a href="#faq">
                <button className="w-full sm:w-auto text-[10px] uppercase font-bold tracking-widest text-ink-muted hover:text-ink px-4 py-3.5 transition-all text-center">
                  View FAQs
                </button>
              </a>
            </div>

            <div className="border-t border-line/60 pt-6 grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="block text-[8px] font-mono font-bold tracking-widest text-ink-muted uppercase">ACTIVE INDEX</span>
                <span className="block text-xs font-black text-ink">4,810 NODES</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-mono font-bold tracking-widest text-ink-muted uppercase">LEDGER SYNC</span>
                <span className="block text-xs font-black text-brand-green flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-ping inline-block" />
                  REAL-TIME
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-mono font-bold tracking-widest text-ink-muted uppercase">DATA INTEGRITY</span>
                <span className="block text-xs font-black text-ink uppercase">ISO-27001</span>
              </div>
            </div>
          </div>

          {/* Right Column: Beautiful Interactive Wizard Setup */}
          <div className="lg:col-span-7">
            <div className="border border-line bg-paper shadow-lg relative overflow-hidden">
              
              {/* Fake Browser Window Header */}
              <div className="border-b border-line px-4 py-3 flex items-center justify-between bg-surface/60">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-line" />
                    <span className="h-2 w-2 rounded-full bg-line" />
                    <span className="h-2 w-2 rounded-full bg-line" />
                  </div>
                  <span className="h-4 w-px bg-line/60 mx-1" />
                  <span className="text-[9px] font-mono text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={9} className="text-brand-green" /> setup_wizard_node.sh
                  </span>
                </div>
                <div className="text-[8px] font-mono font-bold text-ink-muted uppercase tracking-widest">
                  Step {step} of 4
                </div>
              </div>

              {/* Wizard Content Area */}
              <div className="p-8 sm:p-10 min-h-[380px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: CHOOSE OPERATIONAL ROLE */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase block">STAGE 01 — IDENTITY SPECIFICATION</span>
                        <h3 className="text-lg font-black text-ink uppercase tracking-tight">Select your operational business profile</h3>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          Define how your organization interacts with the verified industrial surplus catalog.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { id: "supplier", title: "Supplier / Generator", desc: "List excess scrap lots, raw alloys, and certified polymers directly." },
                          { id: "buyer", title: "Buyer / Processor", desc: "Source verified feedstocks directly from manufacturing partners." },
                          { id: "broker", title: "Logistics Broker", desc: "Coordinate bulk shipping and freight routing settlements." }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setRole(item.id as any);
                              setStep(2);
                            }}
                            className={`border text-left p-4 hover:border-brand-green bg-surface hover:bg-brand-green-muted/10 transition-colors flex flex-col justify-between h-36 relative group
                              ${role === item.id ? "border-brand-green bg-brand-green-muted/15" : "border-line"}
                            `}
                          >
                            <span className="text-xs font-black text-ink uppercase tracking-wide group-hover:text-brand-green transition-colors">
                              {item.title}
                            </span>
                            <p className="text-[10px] text-ink-muted leading-snug mt-2">
                              {item.desc}
                            </p>
                            <div className="text-[8px] font-mono font-bold text-ink-muted mt-auto pt-2 uppercase tracking-widest border-t border-line/60">
                              {item.id === "supplier" ? "List Stock" : item.id === "buyer" ? "Source Lots" : "Route Freight"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: CHOOSE MATERIAL CATEGORY */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase block">STAGE 02 — MATERIAL INDEXING</span>
                        <h3 className="text-lg font-black text-ink uppercase tracking-tight">Primary Industrial Surplus Stream</h3>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          Identify the predominant material category your organization will process or list.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        {[
                          { id: "polymers", title: "Polymers & Resin", desc: "HDPE Flakes, PVC regrind, PET resin lots." },
                          { id: "metals", title: "Metal Alloys", desc: "Aluminum slag, clean copper wiring, steel extrusion." },
                          { id: "packaging", title: "Packaging/Corrugated", desc: "Corrugated pallets, Kraftliner rolls, kraft paper." },
                          { id: "electronics", title: "Electronics Scrap", desc: "Printed circuit boards, solar panels, raw silicon." }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setMaterial(item.id as any);
                              setStep(3);
                            }}
                            className={`border text-left p-4 hover:border-brand-green bg-surface hover:bg-brand-green-muted/10 transition-colors flex flex-col justify-between h-40 relative group
                              ${material === item.id ? "border-brand-green bg-brand-green-muted/15" : "border-line"}
                            `}
                          >
                            <span className="text-xs font-black text-ink uppercase tracking-wide group-hover:text-brand-green transition-colors">
                              {item.title}
                            </span>
                            <p className="text-[9px] text-ink-muted leading-tight mt-2">
                              {item.desc}
                            </p>
                            <div className="text-[8px] font-mono font-bold text-ink-muted mt-auto pt-2 uppercase tracking-widest border-t border-line/60">
                              Select Stream
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between pt-2">
                        <button 
                          onClick={() => setStep(1)} 
                          className="text-[9px] font-bold uppercase tracking-wider text-ink-muted hover:text-ink"
                        >
                          ← Back to Stage 1
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: REGIONAL SCOPE & CAPACITY */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase block">STAGE 03 — CAPACITANCE & REGIONALIZATION</span>
                        <h3 className="text-lg font-black text-ink uppercase tracking-tight">Select Logistics Bounds & Tonnage</h3>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          Define your regional operational footprint and the typical monthly volume of surplus material generated or needed.
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Region Selector */}
                        <div className="space-y-3">
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-ink-muted">LOGISTICS REGION</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "na", label: "N. America" },
                              { id: "eu", label: "Europe" },
                              { id: "apac", label: "APAC Scope" }
                            ].map(reg => (
                              <button
                                key={reg.id}
                                onClick={() => setRegion(reg.id as any)}
                                className={`border p-2 text-center text-xs font-bold uppercase transition-colors
                                  ${region === reg.id ? "bg-brand-green text-paper border-brand-green" : "border-line bg-surface hover:bg-muted text-ink"}
                                `}
                              >
                                {reg.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Volume Selector */}
                        <div className="space-y-3">
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-ink-muted">MONTHLY CAPACITY TIER</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "under-20", label: "< 20 Tons" },
                              { id: "20-100", label: "20-100 T" },
                              { id: "over-100", label: "100+ Tons" }
                            ].map(volTier => (
                              <button
                                key={volTier.id}
                                onClick={() => setVolume(volTier.id as any)}
                                className={`border p-2 text-center text-[10px] font-bold uppercase transition-colors
                                  ${volume === volTier.id ? "bg-brand-green text-paper border-brand-green" : "border-line bg-surface hover:bg-muted text-ink"}
                                `}
                              >
                                {volTier.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-line/60">
                        <button 
                          onClick={() => setStep(2)} 
                          className="text-[9px] font-bold uppercase tracking-wider text-ink-muted hover:text-ink"
                        >
                          ← Back to Stage 2
                        </button>
                        
                        <button
                          disabled={!region || !volume}
                          onClick={() => setStep(4)}
                          className={`text-[9px] font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-1.5 transition-colors
                            ${region && volume 
                              ? "bg-brand-green text-paper hover:bg-brand-green-light" 
                              : "bg-muted text-ink-muted border border-line cursor-not-allowed"}
                          `}
                        >
                          Generate Strategy Report <ChevronRight size={10} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: STRATEGY REPORT REPORT OUTPUT */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 text-left"
                    >
                      <div className="flex justify-between items-start border-b border-line pb-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 text-[8px] font-mono font-bold text-brand-green uppercase bg-brand-green-muted px-2 py-0.5 rounded-sm">
                            <CheckCircle2 size={9} /> CALIBRATION COMPLETE
                          </div>
                          <h3 className="text-base font-black text-ink uppercase tracking-tight">Your surplus strategy profile is ready</h3>
                        </div>
                        <button
                          onClick={handleRestart}
                          className="text-[8px] font-bold uppercase tracking-wider text-ink-muted hover:text-ink border border-line px-2 py-1 bg-surface flex items-center gap-1 transition-all"
                        >
                          <RefreshCw size={8} /> Recalibrate
                        </button>
                      </div>

                      {/* Custom Calculated Strategy Dashboard */}
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="border border-line bg-surface p-3 space-y-1">
                          <span className="block text-[8px] font-mono font-bold text-ink-muted uppercase">Diverted Tonnage Potential</span>
                          <span className="block text-lg font-black text-brand-green font-mono">{metrics.carbonSavings * 12} T/Yr</span>
                          <span className="block text-[8px] text-ink-muted mt-1 leading-snug">Redirected raw material out of landfills.</span>
                        </div>
                        <div className="border border-line bg-surface p-3 space-y-1">
                          <span className="block text-[8px] font-mono font-bold text-ink-muted uppercase">Matching Local Nodes</span>
                          <span className="block text-lg font-black text-ink font-mono">{metrics.matchingNodes} active</span>
                          <span className="block text-[8px] text-ink-muted mt-1 leading-snug">Vetted partners located within regional logistics network.</span>
                        </div>
                        <div className="border border-line bg-surface p-3 space-y-1">
                          <span className="block text-[8px] font-mono font-bold text-ink-muted uppercase">Avg Exchange Match</span>
                          <span className="block text-lg font-black text-ink font-mono">{metrics.speedMetric}</span>
                          <span className="block text-[8px] text-ink-muted mt-1 leading-snug">Estimated average time to negotiate transaction.</span>
                        </div>
                      </div>

                      {/* Customized Action Path */}
                      <div className="border border-line bg-surface/50 p-4 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-bold text-ink-muted uppercase border-b border-line/60 pb-1.5">
                          <span>SYSTEM SUGGESTED LEDGER PATHWAY</span>
                          <span className="text-brand-green font-mono">CODE: PATH_SL_{material?.toUpperCase()}</span>
                        </div>
                        <div className="flex items-start gap-2 pt-1">
                          <div className="bg-brand-green-muted text-brand-green p-1">
                            <Activity size={12} />
                          </div>
                          <div>
                            <span className="block text-xs font-black text-ink uppercase tracking-wide">
                              {metrics.routeOption}
                            </span>
                            <p className="text-[10px] text-ink-muted leading-relaxed mt-1">
                              Based on your operational role as <span className="font-bold text-ink lowercase">{role}</span> processing <span className="font-bold text-ink lowercase">{material}</span> in the <span className="font-bold text-ink uppercase">{region}</span> region, the SurplusLink platform is ready to deploy your dedicated portal.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Closing Wizard Actions */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <Link href="/register" className="flex-1">
                          <button className="w-full bg-brand-green hover:bg-brand-green-light text-paper text-[10px] font-black uppercase tracking-widest py-3.5 flex items-center justify-center gap-1.5 transition-all shadow-sm">
                            Lock In Your Dedicated Hub <ArrowRight size={13} />
                          </button>
                        </Link>
                        <button
                          onClick={() => alert("Report successfully saved. Complete your signup to view details.")}
                          className="border border-line bg-paper hover:bg-muted text-[10px] font-bold uppercase tracking-widest text-ink px-4 py-3.5 transition-all"
                        >
                          Save Strategy PDF
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Fake Browser Window Footer Info */}
              <div className="border-t border-line px-4 py-3 bg-surface/40 flex flex-wrap items-center justify-between text-[8px] font-mono text-ink-muted uppercase tracking-widest gap-2">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green inline-block" />
                  DATABASE CONNECTED: SECURE_POSTGRES_NODE_902
                </span>
                <span>SHA-256 INTEGRITY VALIDATED</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. MONOCHROME ENTERPRISE CLIENTS WALL */}
      <section className="py-12 border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <p className="text-center text-[9px] font-bold uppercase tracking-[0.3em] text-ink-muted mb-8">
            VERIFIED INDUSTRIAL PARTNERS ON THE TRUST SYSTEM
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center justify-center opacity-65 grayscale">
            {[
              { name: "APEX POLYMERS", code: "AP" },
              { name: "MIDWEST BOX CO", code: "MW" },
              { name: "STANDARD ALLOY", code: "SA" },
              { name: "PHOENIX METALWORKS", code: "PX" },
              { name: "VANTAGE CORRUGATED", code: "VC" },
              { name: "GREAT LAKES SILICON", code: "GL" }
            ].map((client, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-2 border border-dashed border-line/80 hover:border-line hover:opacity-100 transition-all select-none">
                <span className="text-[10px] font-mono font-black text-ink-muted tracking-[0.2em]">{client.name}</span>
                <span className="text-[7px] font-mono text-ink-muted mt-1 uppercase">NODE_{client.code}_INIT</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE VALUE BENTO BLOCKS */}
      <section id="features" className="py-24 border-b border-line bg-surface relative">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
          
          <div className="max-w-xl text-left space-y-4">
            <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-brand-green uppercase block">
              PLATFORM SPECIFICATIONS
            </span>
            <h2 className="text-3xl font-black text-ink uppercase tracking-tight">
              DESIGNED FOR INDUSTRIAL TRANSACTIONS
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Traditional scrap brokers obscure pricing, delay shipping, and fail compliance safety. SurplusLink replaces them with clean ledger technology and immediate vetting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Value Block 1 */}
            <div className="border border-line bg-paper p-8 space-y-6 flex flex-col justify-between hover:border-brand-green/60 transition-all">
              <div className="space-y-4">
                <div className="h-10 w-10 border border-brand-green bg-brand-green-muted text-brand-green flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-sm font-black text-ink uppercase tracking-wider">
                  Real-Time Algorithmic Matching
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Our matching engine links suppliers with local processors within a 150-mile radius, minimizing freight overhead and eliminating storage backlogs immediately.
                </p>
              </div>
              <ul className="space-y-2 border-t border-line/60 pt-4 text-[10px] font-mono text-ink-muted uppercase">
                <li className="flex items-center gap-1.5">
                  <Check size={10} className="text-brand-green" /> Localized Radius Vetting
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={10} className="text-brand-green" /> Automated Sync Alerts
                </li>
              </ul>
            </div>

            {/* Value Block 2 */}
            <div className="border border-line bg-paper p-8 space-y-6 flex flex-col justify-between hover:border-brand-green/60 transition-all">
              <div className="space-y-4">
                <div className="h-10 w-10 border border-brand-green bg-brand-green-muted text-brand-green flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-sm font-black text-ink uppercase tracking-wider">
                  Chemical Vetting & CoAs
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  We enforce physical audit logs. Every lot on the ledger includes authenticated Certificate of Analysis and safety logs, ensuring high quality control standards.
                </p>
              </div>
              <ul className="space-y-2 border-t border-line/60 pt-4 text-[10px] font-mono text-ink-muted uppercase">
                <li className="flex items-center gap-1.5">
                  <Check size={10} className="text-brand-green" /> Certificate Verification
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={10} className="text-brand-green" /> 100% Inspected Lots Only
                </li>
              </ul>
            </div>

            {/* Value Block 3 */}
            <div className="border border-line bg-paper p-8 space-y-6 flex flex-col justify-between hover:border-brand-green/60 transition-all">
              <div className="space-y-4">
                <div className="h-10 w-10 border border-brand-green bg-brand-green-muted text-brand-green flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <h3 className="text-sm font-black text-ink uppercase tracking-wider">
                  0% Commision direct Exchange
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Keep your entire margin. We charge flat monthly platform subscriptions, completely bypassing double-broker markups and saving up to 25% on purchase volume.
                </p>
              </div>
              <ul className="space-y-2 border-t border-line/60 pt-4 text-[10px] font-mono text-ink-muted uppercase">
                <li className="flex items-center gap-1.5">
                  <Check size={10} className="text-brand-green" /> Subscription Pricing
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={10} className="text-brand-green" /> Commission-Free Trading
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE TIMELINE PATHWAY */}
      <section id="timeline" className="py-24 border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
          
          <div className="max-w-xl text-left space-y-4">
            <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-brand-green uppercase block">
              THE SURPLUS PIPELINE PROCESS
            </span>
            <h2 className="text-3xl font-black text-ink uppercase tracking-tight">
              FROM ONBOARDING TO SETTLEMENT
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              We streamline circular logistics into a clean, programmatic pipeline with end-to-end transparency.
            </p>
          </div>

          <div className="grid sm:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                title: "Calibrate Strategy",
                desc: "Complete the strategy wizard above to specify material parameters and logistics scope.",
                badge: "SETUP"
              },
              {
                step: "02",
                title: "Submit & Inspect",
                desc: "Upload certified chemistry logs or list material demands to trigger automated local node matches.",
                badge: "VERIFICATION"
              },
              {
                step: "03",
                title: "Examine matches",
                desc: "Filter automatically matched regional lots on our data-dense ledger feed with certified CoAs.",
                badge: "BROADCAST"
              },
              {
                step: "04",
                title: "Secure Settlement",
                desc: "Coordinate direct shipping, freight contracts, and transfer funds through flat SaaS portal.",
                badge: "DELEGATION"
              }
            ].map((item, index) => (
              <div key={index} className="border border-line bg-surface p-6 space-y-4 hover:border-brand-green transition-all relative">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-3xl font-black text-brand-green-muted">{item.step}</span>
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-brand-green-muted text-brand-green uppercase">
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-xs font-black text-ink uppercase tracking-wider">{item.title}</h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRUST OUTCOMES & HIGH PERFORMANCE METRICS ROW */}
      <section id="metrics" className="py-20 border-b border-line bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-blueprint-grid opacity-20 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-line">
            
            <div className="pt-6 md:pt-0 md:px-4 space-y-2">
              <span className="block text-4xl sm:text-5xl font-black text-ink font-mono tracking-tight">$18.4M+</span>
              <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest">
                VERIFIED VOLUME EXCHANGED
              </span>
              <p className="text-[10px] text-ink-muted leading-relaxed max-w-xs mx-auto">
                Total industrial raw polymers and alloys processed through the ledger.
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:px-4 space-y-2">
              <span className="block text-4xl sm:text-5xl font-black text-brand-green font-mono tracking-tight">99.2%</span>
              <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest">
                DIVERTED MATERIAL INDEX
              </span>
              <p className="text-[10px] text-ink-muted leading-relaxed max-w-xs mx-auto">
                Lots successfully integrated into processing feeds instead of landfills.
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:px-4 space-y-2">
              <span className="block text-4xl sm:text-5xl font-black text-ink font-mono tracking-tight">4.8 Hrs</span>
              <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest">
                MEDIAN MATCH VELOCITY
              </span>
              <p className="text-[10px] text-ink-muted leading-relaxed max-w-xs mx-auto">
                Average elapsed time between initial lot listing and buyer reservation.
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:px-4 space-y-2">
              <span className="block text-4xl sm:text-5xl font-black text-ink font-mono tracking-tight">100%</span>
              <span className="block text-[9px] font-bold text-ink-muted uppercase tracking-widest">
                AUDITED TRANSACTION LOGS
              </span>
              <p className="text-[10px] text-ink-muted leading-relaxed max-w-xs mx-auto">
                Every transaction includes authenticated chemical verification files.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS SLIDER */}
      <section className="py-24 border-b border-line bg-paper">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 text-center space-y-8">
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-brand-green uppercase block">
            CLIENT ATTESTATIONS
          </span>
          
          <div className="border border-line bg-surface p-8 sm:p-12 relative">
            <span className="text-6xl font-black text-brand-green-muted absolute top-2 left-6 opacity-30 select-none font-mono">“</span>
            <p className="text-sm sm:text-base text-ink italic leading-relaxed relative z-10">
              SurplusLink completely changed our polymer scrap recovery system. Their guided setup wizard allowed us to quickly configure our Chicago facility boundaries and immediately match with regional compounding facilities. We saved $48,000 on broker markups in the first month alone.
            </p>
            <div className="mt-8 border-t border-line/60 pt-6 flex items-center justify-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-green-muted flex items-center justify-center font-bold text-xs text-brand-green border border-brand-green/30">
                HS
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-ink uppercase tracking-wide">Harvey Sterling</span>
                <span className="block text-[10px] text-ink-muted uppercase font-mono mt-0.5">Director of Operations, Apex Polymers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SYSTEM FAQ ACCORDION */}
      <section id="faq" className="py-24 border-b border-line bg-surface">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-brand-green uppercase block">
              SYSTEM DOCUMENTATION
            </span>
            <h2 className="text-2xl font-black text-ink uppercase tracking-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              Clear technical summaries detailing circular integration, data verification, and billing tiers.
            </p>
          </div>

          <div className="border border-line divide-y divide-line bg-paper">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="transition-all">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
                  >
                    <span className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle size={12} className="text-brand-green" /> {faq.question}
                    </span>
                    <span className="text-xs font-mono font-bold text-ink-muted ml-4">
                      {isOpen ? "[ - ]" : "[ + ]"}
                    </span>
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-surface/40"
                      >
                        <div className="px-6 pb-6 pt-2 text-xs text-ink-muted leading-relaxed border-t border-line/30">
                          {faq.answer}
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

      {/* 9. HIGH-CONVERTING CLOSING CTA BANNER */}
      <section className="py-24 border-b border-line bg-paper relative overflow-hidden text-center px-6">
        <div className="absolute inset-0 bg-blueprint-grid opacity-30 pointer-events-none" />
        <div className="mx-auto max-w-4xl relative z-10 space-y-8">
          
          <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1">
            <span className="h-1.5 w-1.5 bg-brand-green-light animate-pulse" />
            <span className="text-[8px] font-bold tracking-[0.25em] text-brand-green uppercase">
              REGISTER SECURE NODE
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-black text-ink uppercase tracking-tight leading-none">
            RECLAIM VALUE FROM <br />
            YOUR CIRCULAR CO-PRODUCT LOGS.
          </h2>

          <p className="text-xs sm:text-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
            Activate your organization's secure ledger terminal in less than 5 minutes. Sync lists of materials, evaluate regional matching logistics, and start processing verified transactions.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link href="/register">
              <button className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-light text-paper text-[10px] font-black uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-2 shadow-sm">
                Request API Integration Keys <ArrowUpRight size={13} />
              </button>
            </Link>
            <a href="#hero-onboarding">
              <button className="w-full sm:w-auto border border-line bg-surface hover:bg-muted text-[10px] font-black uppercase tracking-widest text-ink px-8 py-4 transition-all">
                Try setup wizard
              </button>
            </a>
          </div>

          <div className="pt-4 text-[9px] font-mono text-ink-muted uppercase tracking-widest flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-brand-green" /> ISO-9001 Compliant</span>
            <span className="flex items-center gap-1"><Lock size={10} className="text-brand-green" /> 256-Bit Cryptographic Ledger</span>
          </div>
        </div>
      </section>

      {/* 10. COMPREHENSIVE CORPORATE FOOTER */}
      <footer className="bg-surface border-t border-line/80 py-16 px-6 sm:px-8 lg:px-12 text-left">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-line pb-12">
          
          {/* Logo Brand Info */}
          <div className="col-span-2 space-y-4">
            <span className="text-xs font-black tracking-[0.3em] uppercase text-brand-green bg-brand-green-muted px-2 py-0.5 inline-block">
              SURPLUSLINK
            </span>
            <p className="text-[11px] text-ink-muted leading-relaxed max-w-xs">
              Cryptographically verified peer logistics database designed to eliminate static broker markups and establish clean material circularity workflows.
            </p>
            <div className="text-[8px] font-mono text-ink-muted uppercase tracking-widest space-y-1">
              <div>PLATFORM STATUS: <span className="text-brand-green font-bold">● ONLINE</span></div>
              <div>SYNC SPEED: <span className="font-bold">4.8ms average</span></div>
            </div>
          </div>

          {/* Site Directory A */}
          <div className="space-y-4">
            <h5 className="text-[9px] font-black text-ink uppercase tracking-widest">SPECIFICATIONS</h5>
            <ul className="space-y-2 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
              <li><a href="#hero-onboarding" className="hover:text-brand-green transition-colors">Onboarding Wizard</a></li>
              <li><a href="#features" className="hover:text-brand-green transition-colors">Bento Features</a></li>
              <li><a href="#timeline" className="hover:text-brand-green transition-colors">Logistical Pathway</a></li>
              <li><a href="#metrics" className="hover:text-brand-green transition-colors">Global Traction</a></li>
            </ul>
          </div>

          {/* Site Directory B */}
          <div className="space-y-4">
            <h5 className="text-[9px] font-black text-ink uppercase tracking-widest">SECURITY</h5>
            <ul className="space-y-2 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
              <li><a href="#faq" className="hover:text-brand-green transition-colors">System Support FAQs</a></li>
              <li><span className="text-ink/40 cursor-not-allowed">Ledger Audits</span></li>
              <li><span className="text-ink/40 cursor-not-allowed">Regulatory Certs</span></li>
              <li><span className="text-ink/40 cursor-not-allowed">CoAs Database</span></li>
            </ul>
          </div>

          {/* Site Directory C: Newsletter Sign up */}
          <div className="space-y-4">
            <h5 className="text-[9px] font-black text-ink uppercase tracking-widest">NETWORK BULLETINS</h5>
            <p className="text-[10px] text-ink-muted leading-normal">
              Receive real-time notifications of new raw polymer and metal alloy lots.
            </p>
            {newsletterSubmitted ? (
              <span className="block text-[9px] font-mono font-bold text-brand-green uppercase bg-brand-green-muted px-2 py-1 text-center">
                SUBSCRIBED SECURELY
              </span>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setNewsletterSubmitted(true);
                }}
                className="flex"
              >
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="border border-line bg-paper px-3 py-1.5 text-xs focus:outline-none focus:border-brand-green flex-1 placeholder:text-ink-muted/50 text-ink"
                />
                <button
                  type="submit"
                  className="bg-brand-green hover:bg-brand-green-light text-paper px-3 text-xs font-bold transition-all border border-brand-green"
                >
                  →
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Legal block */}
        <div className="mx-auto max-w-7xl pt-8 flex flex-col md:flex-row justify-between items-center text-[9px] font-mono text-ink-muted uppercase tracking-widest gap-4">
          <span>© {new Date().getFullYear()} SURPLUSLINK INC. ALL SYSTEM INTELLECTUAL ASSETS RESERVED.</span>
          <div className="flex gap-6">
            <span className="hover:text-ink cursor-pointer">PRIVACY PROTOCOL</span>
            <span className="hover:text-ink cursor-pointer">TERMS OF TRANSMISSION</span>
            <span className="hover:text-ink cursor-pointer">SECURITY DISCLOSURES</span>
          </div>
        </div>

      </footer>

    </div>
  );
}
