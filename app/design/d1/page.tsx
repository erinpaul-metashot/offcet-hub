"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { Check, ArrowRight, ShieldCheck, Zap, Users, BarChart3, Plus, Search, Calendar, FileText, CheckCircle2, ChevronRight, Scale, MapPin, Layers } from "lucide-react";

interface Lot {
  id: string;
  title: string;
  quantity: string;
  location: string;
  status: "draft" | "pending_review" | "approved" | "assigned" | "sold";
  supplier: string;
  category: string;
}

const INITIAL_LOTS: Lot[] = [
  { id: "LOT-001", title: "Bulk PET Resin Regrind", quantity: "18 tons", location: "Newark, NJ", status: "assigned", supplier: "Apex Polymers LLC", category: "Plastics" },
  { id: "LOT-002", title: "Corrugated Cartons (Standard)", quantity: "3,200 units", location: "Chicago, IL", status: "pending_review", supplier: "Midwest Box Co.", category: "Packaging" },
  { id: "LOT-003", title: "Aluminum Extrusion Offcuts", quantity: "6 pallets", location: "Phoenix, AZ", status: "draft", supplier: "Phoenix Metalworks", category: "Metals" },
];

export default function DesignOneFull() {
  const [lots, setLots] = useState<Lot[]>(INITIAL_LOTS);
  const [simulatorRole, setSimulatorRole] = useState<"supplier" | "admin" | "buyer">("supplier");
  const [newLotTitle, setNewLotTitle] = useState("");
  const [newLotQty, setNewLotQty] = useState("");
  const [newLotLoc, setNewLotLoc] = useState("");
  const [newLotCategory, setNewLotCategory] = useState("Plastics");

  const handleAddLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLotTitle || !newLotQty || !newLotLoc) return;
    
    const newLot: Lot = {
      id: `LOT-00${lots.length + 1}`,
      title: newLotTitle,
      quantity: newLotQty,
      location: newLotLoc,
      status: "pending_review",
      supplier: "Apex Polymers LLC",
      category: newLotCategory,
    };
    
    setLots([newLot, ...lots]);
    setNewLotTitle("");
    setNewLotQty("");
    setNewLotLoc("");
    
    setTimeout(() => {
      setSimulatorRole("admin");
    }, 800);
  };

  const handleVerifyLot = (id: string) => {
    setLots(lots.map(l => l.id === id ? { ...l, status: "assigned" } : l));
    setTimeout(() => {
      setSimulatorRole("buyer");
    }, 800);
  };

  const handleAcquireLot = (id: string) => {
    setLots(lots.map(l => l.id === id ? { ...l, status: "sold" } : l));
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper bg-blueprint-grid">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <span className="text-xs font-black tracking-[0.3em] uppercase text-brand-green">SURPLUSLINK</span>
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <a href="#features" className="hover:text-ink transition-colors">Features</a>
              <a href="#demo" className="hover:text-ink transition-colors">Interactive Demo</a>
              <a href="#process" className="hover:text-ink transition-colors">Trust Process</a>
              <a href="#stats" className="hover:text-ink transition-colors">Ledger Stats</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-xs tracking-wider border-0 h-10 px-4">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="border border-brand-green text-xs tracking-wider h-10 px-4">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 space-y-32">

        {/* 2. MAJESTIC HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-8">
          <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1">
            <span className="h-1.5 w-1.5 bg-brand-green-light animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase">TRUST INFRASTRUCTURE FOR CIRCULAR SUPPLY</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-ink">
            THE PEER LEDGER FOR VERIFIED <span className="text-brand-green">SURPLUS INVENTORY</span>.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-ink-muted max-w-2xl mx-auto">
            Eliminate opaque broker markups and static spreadsheets. SurplusLink provides a direct, audited B2B catalog linking vetted manufacturers with regional industrial processors.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button className="border border-brand-green text-xs tracking-widest px-6 py-3.5 h-12">
                REQUEST ACCESS <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="secondary" className="border border-line text-xs tracking-widest px-6 py-3.5 h-12">
                TRY THE SIMULATOR
              </Button>
            </a>
          </div>

          {/* High-Fidelity App Mockup Below Hero Fold */}
          <div className="border border-line bg-surface p-2 mt-12 shadow-sm">
            <div className="border border-line bg-paper">
              {/* Fake Window bar */}
              <div className="border-b border-line px-4 py-2 flex items-center justify-between bg-surface">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-line" />
                  <span className="h-2 w-2 rounded-full bg-line" />
                  <span className="h-2 w-2 rounded-full bg-line" />
                </div>
                <span className="text-[9px] font-mono text-ink-muted">node_status: active_sync (1,402 nodes)</span>
              </div>
              
              {/* Fake Dashboard Layout */}
              <div className="grid md:grid-cols-[180px_1fr] divide-x divide-line text-left">
                <div className="p-4 space-y-3 bg-surface hidden md:block">
                  <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase">NAVIGATION</span>
                  <div className="space-y-1 text-[10px] text-ink-muted">
                    <div className="font-bold text-brand-green bg-brand-green-muted px-2 py-1 flex items-center gap-1.5"><Layers size={10} /> Active Feed</div>
                    <div className="px-2 py-1 hover:bg-muted hover:text-ink transition-colors flex items-center gap-1.5"><Search size={10} /> Search Ledger</div>
                    <div className="px-2 py-1 hover:bg-muted hover:text-ink transition-colors flex items-center gap-1.5"><FileText size={10} /> Specifications</div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-line pb-2">
                    <span className="text-[10px] font-bold text-ink uppercase">Live Trade Ledger</span>
                    <span className="text-[8px] font-bold bg-brand-green text-paper px-2 py-0.5 uppercase tracking-wider">Secure Sync</span>
                  </div>
                  <div className="space-y-2">
                    <div className="border border-line p-3 flex justify-between items-center bg-surface">
                      <div>
                        <h4 className="text-xs font-bold text-ink">Bulk PET Resin Regrind</h4>
                        <p className="text-[9px] text-ink-muted mt-0.5">18 tons • Newark, NJ • Apex Polymers LLC</p>
                      </div>
                      <span className="text-[9px] bg-brand-green text-paper px-2 py-0.5 font-bold uppercase">Certified Match</span>
                    </div>
                    <div className="border border-line p-3 flex justify-between items-center bg-surface">
                      <div>
                        <h4 className="text-xs font-bold text-ink">Aluminum Extrusion Scrap</h4>
                        <p className="text-[9px] text-ink-muted mt-0.5">6 pallets • Phoenix, AZ • Phoenix Metalworks</p>
                      </div>
                      <span className="text-[9px] border border-line text-ink-muted px-2 py-0.5 font-bold uppercase">Pending Audit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MONOCHROME LOGO WALL */}
        <section className="border-t border-b border-line py-6 text-center space-y-3">
          <p className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">LEDGER SYNCED WITH CERTIFIED REGIONAL MANUFACTURERS</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-xs font-black tracking-[0.35em] text-ink-muted uppercase">
            <span>Apex Polymers</span>
            <span>Midwest Metals</span>
            <span>Vantage Corp</span>
            <span>Standard Alloy</span>
          </div>
        </section>

        {/* 4. CORE VALUE PILLARS (BENTO GRID CELLS) */}
        <section id="features" className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">CORE ASSURANCE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Structured to eliminate transaction risk.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><ShieldCheck size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">100% Vetted Operators</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  We audit tax IDs, operational history, and warehouse records for every supplier and buyer before releasing keys.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Verified Pipeline</span>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><FileText size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Authenticated Spec Logs</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Suppliers must upload weight tickets, certificates of analysis, and high-resolution photo sheets. Opaque parameters are rejected.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">Certified Specs</span>
            </div>

            <div className="border border-line bg-surface p-8 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 bg-brand-green-muted flex items-center justify-center text-brand-green"><Zap size={16} /></div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Peer-to-Peer Pricing</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Opaque broker margins are entirely bypassed. Buyers and suppliers coordinate directly, establishing pricing parity.
                </p>
              </div>
              <span className="text-[9px] text-brand-green font-bold uppercase tracking-widest border-t border-line pt-4 mt-4">0% Broker Markups</span>
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE PRODUCT DEMO (SIMULATOR) */}
        <section id="demo" className="border border-line bg-surface overflow-hidden">
          <div className="border-b border-line px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper">
            <div>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-brand-green">PRODUCT SIMULATOR</p>
              <h2 className="text-base font-extrabold tracking-tight uppercase">Experience the SurplusLink Pipeline</h2>
            </div>
            
            {/* Role selector tabs */}
            <div className="flex border border-line bg-surface p-0.5">
              {(["supplier", "admin", "buyer"] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setSimulatorRole(role)}
                  className={`px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all
                    ${simulatorRole === role 
                      ? "bg-brand-green text-paper" 
                      : "text-ink-muted hover:bg-muted hover:text-ink"
                    }
                  `}
                >
                  {role} view
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.3fr] divide-y lg:divide-y-0 lg:divide-x divide-line">
            
            {/* Interactive Control side */}
            <div className="p-6 bg-paper/50">
              <AnimatePresence mode="wait">
                {simulatorRole === "supplier" && (
                  <motion.div
                    key="supplier"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left"
                  >
                    <div className="border border-line bg-surface p-4 space-y-1">
                      <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase">SUPPLIER STAGE</span>
                      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Draft & Submit Surplus Lot</h3>
                      <p className="text-[11px] text-ink-muted leading-relaxed">List excess raw material assets directly onto the ledger feed with weight details.</p>
                    </div>

                    <form onSubmit={handleAddLot} className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1">Material Description</label>
                        <input
                          type="text"
                          required
                          value={newLotTitle}
                          onChange={e => setNewLotTitle(e.target.value)}
                          placeholder="e.g., HDPE Shredded Bottle Flakes"
                          className="w-full border border-line bg-surface px-3 py-2 text-xs focus:border-brand-green outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1">Quantity</label>
                          <input
                            type="text"
                            required
                            value={newLotQty}
                            onChange={e => setNewLotQty(e.target.value)}
                            placeholder="e.g., 24.5 tons"
                            className="w-full border border-line bg-surface px-3 py-2 text-xs focus:border-brand-green outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1">Warehouse City</label>
                          <input
                            type="text"
                            required
                            value={newLotLoc}
                            onChange={e => setNewLotLoc(e.target.value)}
                            placeholder="e.g., Detroit, MI"
                            className="w-full border border-line bg-surface px-3 py-2 text-xs focus:border-brand-green outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 bg-brand-green hover:bg-brand-green-light text-paper text-[10px] font-bold uppercase tracking-widest py-2.5 transition-colors"
                      >
                        <Plus size={14} /> Submit Lot for Review
                      </button>
                    </form>
                  </motion.div>
                )}

                {simulatorRole === "admin" && (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left"
                  >
                    <div className="border border-line bg-surface p-4 space-y-1">
                      <span className="text-[8px] font-bold tracking-widest text-brand-green uppercase">ADMIN STAGE</span>
                      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Certification Audit</h3>
                      <p className="text-[11px] text-ink-muted leading-relaxed">Admins review weight slips and specifications sheets before releasing the lot.</p>
                    </div>

                    <div className="space-y-2">
                      {lots.filter(l => l.status === "pending_review").map(l => (
                        <div key={l.id} className="border border-line p-3 bg-surface space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-ink">{l.title}</p>
                              <p className="text-[10px] text-ink-muted">{l.quantity} • {l.location}</p>
                            </div>
                            <span className="text-[8px] border border-dashed border-line-strong px-2 py-0.5 text-ink-muted font-bold uppercase">Review</span>
                          </div>
                          <button
                            onClick={() => handleVerifyLot(l.id)}
                            className="w-full flex items-center justify-center gap-1.5 border border-ink text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-paper hover:bg-brand-green-muted hover:text-brand-green hover:border-brand-green transition-colors"
                          >
                            <CheckCircle2 size={12} /> Verify & Release to Buyers
                          </button>
                        </div>
                      ))}

                      {lots.filter(l => l.status === "pending_review").length === 0 && (
                        <div className="border border-dashed border-line p-6 text-center text-xs text-ink-muted italic">
                          No pending listings. Select "Supplier View" to submit a lot.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {simulatorRole === "buyer" && (
                  <motion.div
                    key="buyer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left"
                  >
                    <div className="border border-line bg-surface p-4 space-y-1">
                      <span className="text-[8px] font-bold tracking-widest text-brand-green uppercase">BUYER STAGE</span>
                      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Direct Matching Feed</h3>
                      <p className="text-[11px] text-ink-muted leading-relaxed">Buyers receive immediate, matched alerts based on their profile categories.</p>
                    </div>

                    <div className="space-y-2">
                      {lots.filter(l => l.status === "assigned").map(l => (
                        <div key={l.id} className="border border-line p-3 bg-surface space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-ink">{l.title}</p>
                              <p className="text-[10px] text-ink-muted">{l.quantity} • {l.location}</p>
                            </div>
                            <span className="text-[8px] bg-brand-green text-paper px-2 py-0.5 font-bold uppercase">Matched</span>
                          </div>
                          <button
                            onClick={() => handleAcquireLot(l.id)}
                            className="w-full flex items-center justify-center gap-1.5 bg-brand-green hover:bg-brand-green-light text-paper text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 transition-colors"
                          >
                            <Check size={12} /> Acquire Lot Directly
                          </button>
                        </div>
                      ))}

                      {lots.filter(l => l.status === "assigned").length === 0 && (
                        <div className="border border-dashed border-line p-6 text-center text-xs text-ink-muted italic">
                          No active matched listings assigned.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* List Showcase side */}
            <div className="p-6 bg-surface">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <p className="text-[10px] font-bold tracking-wider uppercase text-ink-muted">Active Surplus Registry</p>
                <span className="text-[9px] font-bold tracking-wide bg-ink text-paper px-2 py-0.5 uppercase">
                  {lots.length} active logs
                </span>
              </div>

              <div className="space-y-3 text-left">
                {lots.map(l => (
                  <motion.div
                    key={l.id}
                    layoutId={`full-lot-${l.id}`}
                    className="border border-line p-4 bg-paper flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-mono font-bold text-ink-muted">{l.id}</span>
                        <span className="text-[9px] font-bold text-brand-green bg-brand-green-muted px-1.5 uppercase">{l.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-ink">{l.title}</h4>
                      <p className="text-[10px] text-ink-muted mt-0.5">{l.quantity} • {l.location}</p>
                    </div>

                    <div>
                      {l.status === "pending_review" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-dashed border-line-strong text-ink-muted">Awaiting Audit</span>
                      )}
                      {l.status === "assigned" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-green text-paper flex items-center gap-1">
                          <span className="h-1 w-1 bg-paper rounded-full animate-ping" /> Certified
                        </span>
                      )}
                      {l.status === "sold" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted border border-line text-ink-muted line-through">Exchanged</span>
                      )}
                      {l.status === "draft" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-line text-ink-muted">Draft</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. TRUST PIPELINE TIMELINE */}
        <section id="process" className="border-t border-line pt-16 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[9px] font-bold tracking-wide text-brand-green uppercase bg-brand-green-muted px-3 py-1">THE TRUST PIPELINE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Opaque broker channels replaced.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Intake & Specification", desc: "Suppliers load packaging parameters, warehouse location, scale tickets, and laboratory analysis reports directly onto our directory board." },
              { num: "02", title: "Compliance Certification", desc: "Our administrators run thorough validation checklists. We match weight receipts and verify corporate entities, certifying each lot." },
              { num: "03", title: "Targeted B2B Matching", desc: "Certified listings are routed dynamically to vetted local buyer feeds, bypassing broad public listings and broker noise." }
            ].map((step, idx) => (
              <div key={idx} className="space-y-4 text-left border-l border-line pl-6 relative">
                <div className="absolute -left-1.5 top-0.5 h-3 w-3 bg-brand-green border-2 border-paper" />
                <span className="text-xl font-mono font-black text-brand-green">{step.num}</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">{step.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. TRUST STATS GRID */}
        <section id="stats" className="grid border border-line divide-y md:divide-y-0 md:divide-x divide-line md:grid-cols-4 bg-surface text-left">
          {[
            { label: "Assets Exchanged", val: "$12.8M", desc: "Total asset trade volume coordinated" },
            { label: "Material Redirected", val: "14,800 tons", desc: "Total surplus polymer and alloy redirected" },
            { label: "Median Match Velocity", val: "4.2 Hours", desc: "Average supplier-to-buyer matched state" },
            { label: "Broker Fees Owed", val: "0.0%", desc: "Direct peer ledger transaction cost parity" }
          ].map((stat, idx) => (
            <div key={idx} className="p-6 space-y-2">
              <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase">{stat.label}</span>
              <p className="text-3xl font-extrabold text-ink tracking-tight">{stat.val}</p>
              <p className="text-[10px] text-ink-muted">{stat.desc}</p>
            </div>
          ))}
        </section>

        {/* 8. TESTIMONIAL & FAQ PANEL */}
        <section className="grid lg:grid-cols-2 gap-12 text-left pt-12 border-t border-line">
          <div className="space-y-6">
            <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase">CUSTOMER ADVISORY</span>
            <h3 className="text-xl font-extrabold uppercase tracking-tight">"SurplusLink eliminated 12% in hidden broker margins."</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              "Before using SurplusLink, our packaging surplus was routed through three different broker chains, adding massive latency and opaque markups. SurplusLink's direct matching ledger allowed us to clear 3,200 carton pallets directly in Detroit in under 24 hours."
            </p>
            <div>
              <p className="text-xs font-bold text-ink">Director of Materials Logistics</p>
              <p className="text-[10px] text-ink-muted">Midwest Box Co. • Packaging Division</p>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM ASSURANCE FAQS</span>
            <div className="space-y-4 divide-y divide-line">
              <div className="space-y-1.5 pt-4 first:pt-0">
                <h4 className="text-xs font-bold text-ink">How do you verify supplier listings?</h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">We audit every supplier's tax certificate, warehouse location record, and weigh tickets. Listings lacking specimen specifications are immediately flagged.</p>
              </div>
              <div className="space-y-1.5 pt-4">
                <h4 className="text-xs font-bold text-ink">Are there any membership or broker transaction fees?</h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">No. We maintain a direct subscription structure for industrial manufacturers. There are zero broker markups or transaction fees injected into transactions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. CONVERSION BLOCK & CORPORATE FOOTER */}
        <section className="border border-line bg-surface p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 border-l border-b border-line bg-paper px-3 py-1 text-[8px] font-mono text-ink-muted uppercase">
            Sync Code: D1-CONVERSION
          </div>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-extrabold tracking-tight uppercase">Open your B2B Exchange account.</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Request credentials to the SurplusLink B2B catalog. Vetted manufacturers receive active matching alerts in under 24 hours.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link href="/register">
                <Button className="border border-brand-green text-xs tracking-widest px-8">
                  Register Directory Profile
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* 10. PREMIUM CORPORATE FOOTER */}
      <footer className="border-t border-line bg-surface py-12 px-6 sm:px-8 lg:px-12 mt-32 text-left">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-[0.3em] uppercase text-brand-green">SURPLUSLINK</span>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              The audited direct B2B ledger for industrial material assets. Bypassing broker chains globally.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">DIRECTORIES</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <Link href="/register?role=supplier" className="hover:text-ink">Supplier Registration</Link>
              <Link href="/register?role=buyer" className="hover:text-ink">Buyer Registration</Link>
              <Link href="/login" className="hover:text-ink">Active Console Sign-in</Link>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM INTEGRITY</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Status: Operational</span>
              <span>Ledger Latency: 12ms</span>
              <span>Node Network: 1,402 Active</span>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">LEGAL LEDGER</span>
            <div className="flex flex-col gap-1.5 text-[10px] text-ink-muted font-semibold">
              <span>Privacy Directory</span>
              <span>System Terms</span>
              <span>© 2026 SurplusLink Technologies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
