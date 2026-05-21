"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  FileSpreadsheet, 
  Map, 
  Award, 
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  Clock,
  Percent
} from "lucide-react";

interface FlowStep {
  id: string;
  num: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  details: string;
  documents: string[];
}

const FLOW_STEPS: FlowStep[] = [
  { 
    id: "submit", 
    num: "STEP 1", 
    icon: <ClipboardList size={16} />, 
    title: "Supplier Intake", 
    subtitle: "Stock loading & specs",
    details: "Suppliers list excess material assets directly onto the ledger. Every listing requires detailed physical parameters: weight tickets, packaging category, material chemistry, and original manufacturer sheets.",
    documents: ["Certificates of Analysis", "Packing Lists", "Material Photos"]
  },
  { 
    id: "audit", 
    num: "STEP 2", 
    icon: <Shield size={16} />, 
    title: "Document Review", 
    subtitle: "Admin validation audit",
    details: "SurplusLink operations audit the submitted documents. We verify the supplier profile, match weights with physical storage tickets, and double check catalog taxonomy.",
    documents: ["Corporate Vetting Logs", "Audit Sign-offs", "Tax ID verification"]
  },
  { 
    id: "catalog", 
    num: "STEP 3", 
    icon: <FileSpreadsheet size={16} />, 
    title: "Ledger Release", 
    subtitle: "Authenticated mapping",
    details: "Once certified, the lot is written to the ledger feed. The matching engine automatically cross-references the lot with qualified regional buyer purchase requests.",
    documents: ["Active Ledger Reference", "Target Match Profiles", "Route Sheets"]
  },
  { 
    id: "exchange", 
    num: "STEP 4", 
    icon: <Map size={16} />, 
    title: "Direct Exchange", 
    subtitle: "Brokerless transaction",
    details: "Matched buyers and certified agents receive targeted lot match notifications. They inspect the authenticated documents and close the transaction directly on-ledger. No hidden markups.",
    documents: ["Purchase Ledger Records", "Logistics Routing Records", "Final Settlement Sheets"]
  }
];

export default function DesignSixFull() {
  const [activeStepId, setActiveStepId] = useState<string>("submit");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const activeStep = FLOW_STEPS.find(s => s.id === activeStepId) || FLOW_STEPS[0];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper bg-blueprint-grid">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <a href="#about" className="hover:text-brand-green transition-colors">Philosophy</a>
              <a href="#schematic" className="hover:text-brand-green transition-colors">Interactive Flow</a>
              <a href="#features" className="hover:text-brand-green transition-colors">Safety Metrics</a>
              <a href="#stats" className="hover:text-brand-green transition-colors">System stats</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Console Log</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Join Now</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 space-y-28">

        {/* 2. MAJESTIC SCHEMATIC HERO */}
        <section id="about" className="text-center max-w-3xl mx-auto space-y-8 pt-8">
          <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1 text-brand-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">PIPELINE TRANSPARENCY PROTOCOL</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-ink">
            An audited B2B pipeline with <span className="text-brand-green">total structure</span>.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-ink-muted max-w-2xl mx-auto">
            We bypass opaque broker circles and spreadsheets. Below is the exact schematic SurplusLink utilizes to verify, release, and route high-volume industrial surplus lots.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button className="shadow-md">
                Register Vetted Profile <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
            <a href="#schematic">
              <Button variant="secondary">
                View Interactive Map
              </Button>
            </a>
          </div>
        </section>

        {/* 3. MONOCHROME LOGO CLOUD */}
        <section className="border-t border-b border-line py-8 text-center space-y-4">
          <p className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">LEDGER SYNCED WITH COMPLIANT MANUFACTURERS</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-4 text-sm font-black tracking-[0.3em] text-ink-muted uppercase">
            <span>Apex Polymers</span>
            <span>Midwest Metals</span>
            <span>Vantage Industrial</span>
            <span>Standard Alloy</span>
          </div>
        </section>

        {/* 4. INTERACTIVE FLOWCHART SCHEMATIC BOARD */}
        <section id="schematic" className="space-y-8">
          <div className="text-left max-w-2xl">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase">PIPELINE INTERACTIVE</span>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase mt-1">Lifecycle of an On-Ledger Lot</h2>
            <p className="text-xs text-ink-muted mt-1">Select any flowchart node below to audit required chemical verification checklists and logistics milestones.</p>
          </div>

          {/* Flowchart Diagram */}
          <div className="border border-line bg-surface p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 border-l border-b border-line bg-paper px-3 py-1 text-[8px] font-mono text-ink-muted">
              FLOW-ID: SCHEMATIC_MOCK
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {FLOW_STEPS.map((step, idx) => {
                const isActive = activeStepId === step.id;
                return (
                  <div 
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={`cursor-pointer border p-5 transition-all text-left flex flex-col justify-between h-40 relative group
                      ${isActive 
                        ? "border-brand-green bg-paper shadow-sm" 
                        : "border-line bg-paper hover:border-ink"
                      }
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold tracking-widest text-ink-muted">{step.num}</span>
                      <span className={`p-1 border rounded-none ${isActive ? "border-brand-green text-brand-green" : "border-line text-ink-muted group-hover:text-ink"}`}>
                        {step.icon}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-extrabold text-ink mt-4 uppercase tracking-wider">{step.title}</h3>
                      <p className="text-[10px] text-ink-muted mt-1 leading-tight">{step.subtitle}</p>
                    </div>

                    {/* Horizontal Arrow Connection (only in larger screens) */}
                    {idx < 3 && (
                      <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-line-strong">
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Flow Node Detail Display Card */}
          <div className="border border-line bg-paper p-8 grid lg:grid-cols-[1.5fr_1fr] gap-8">
            <div className="space-y-4 text-left">
              <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase">PIPELINE STAGE DETAILS</span>
              <h3 className="text-lg font-bold text-ink uppercase tracking-tight">{activeStep.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{activeStep.details}</p>
              
              <div className="pt-2">
                <Link href="/register">
                  <Button className="px-6 py-2 text-xs">Register Vetted Account</Button>
                </Link>
              </div>
            </div>

            <div className="border-l border-line pl-0 lg:pl-8 pt-6 lg:pt-0 space-y-4 text-left">
              <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">REQUIRED AUDIT DOCUMENTS</span>
              <div className="space-y-2">
                {activeStep.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs border border-line bg-surface p-2.5">
                    <CheckCircle2 size={14} className="text-brand-green shrink-0" />
                    <span className="font-semibold text-ink leading-tight">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. VETTING & SAFETY PILLARS */}
        <section id="features" className="space-y-8 text-left">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">SAFETY ASSURANCE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">Every transaction mapped and secured.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between hover:border-brand-green transition-colors">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Shield size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">100% Vetted Directory</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  We audit tax IDs, operational permissions, and warehouse records of every supplier and buyer before releasing keys.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Verified Pipeline</span>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between hover:border-brand-green transition-colors">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><FileSpreadsheet size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Chemical Analysis Logs</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Suppliers must upload weight tickets, certificates of analysis, and high-resolution photo sheets. Opaque parameters are rejected.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Certified Specs</span>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between hover:border-brand-green transition-colors">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Map size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">0% Broker Commissions</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Opaque broker margins are entirely bypassed. Buyers and suppliers coordinate directly, establishing pricing parity.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Direct Matching</span>
            </div>
          </div>
        </section>

        {/* 6. OUTCOMES TRUST STATS ROW */}
        <section id="stats" className="py-16 bg-surface border-t border-b border-line text-left">
          <div className="grid border border-line divide-y md:divide-y-0 md:divide-x divide-line md:grid-cols-3 bg-paper">
            {[
              { label: "Assets Synchronized", val: "$12.8M", desc: "Total certified transaction volume synchronized on ledger." },
              { label: "Material Redirected", val: "14,800 Tons", desc: "Industrial polymers and alloys routed directly to buyers." },
              { label: "Median Match Speed", val: "4.2 Hours", desc: "Average duration from lot verification to partner matching." }
            ].map((stat, idx) => (
              <div key={idx} className="p-8 space-y-2 hover:bg-surface/50 transition-colors">
                <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">{stat.label}</span>
                <p className="text-3xl font-extrabold text-brand-green tracking-tight">{stat.val}</p>
                <p className="text-xs text-ink-muted leading-relaxed mt-2">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. CUSTOMER ADVISORY PANEL */}
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
          <div className="mx-auto max-w-3xl space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM ASSURANCE</span>
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
            SYNC: D6_FLOW
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-ink">Register directory credentials.</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Create your audited credentials. Vetted operators receive targeted direct matches in under 24 hours.
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
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted font-semibold">
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
