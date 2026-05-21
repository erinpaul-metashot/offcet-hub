"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  FileText, 
  Folder, 
  BookOpen, 
  UserCheck, 
  ShieldCheck, 
  ChevronRight, 
  Plus, 
  Layers, 
  ArrowRight, 
  CheckCircle,
  Inbox,
  Lock,
  ChevronDown
} from "lucide-react";

interface DocumentPage {
  id: string;
  icon: React.ReactNode;
  label: string;
  category: string;
  count: number;
}

const PAGES: DocumentPage[] = [
  { id: "overview", icon: <Layers size={13} />, label: "SurplusLink Overview", category: "General", count: 412 },
  { id: "plastics", icon: <Folder size={13} />, label: "Polymers & Resin", category: "Plastics", count: 245 },
  { id: "metals", icon: <Folder size={13} />, label: "Structural Alloy Offcuts", category: "Metals", count: 112 },
  { id: "packaging", icon: <Folder size={13} />, label: "Cartons & Kraftliner", category: "Packaging", count: 55 }
];

export default function DesignFourFull() {
  const [activePageId, setActivePageId] = useState("overview");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const activePage = PAGES.find(p => p.id === activePageId) || PAGES[0];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-brand-green selection:text-paper">
      
      {/* 1. PUBLIC HEADER NAVIGATION */}
      <header className="w-full border-b border-line bg-paper/85 backdrop-blur-md sticky top-14 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-brand-green">SURPLUSLINK</span>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <a href="#about" className="hover:text-brand-green transition-colors">Philosophy</a>
              <a href="#product" className="hover:text-brand-green transition-colors">Interactive Workspace</a>
              <a href="#features" className="hover:text-brand-green transition-colors">Vetting Mechanics</a>
              <a href="#stats" className="hover:text-brand-green transition-colors">System Metrics</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-bold tracking-wider uppercase text-ink-muted hover:text-ink cursor-pointer transition-colors">Sign in</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Request Access</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAJESTIC HERO SECTION */}
      <section id="about" className="py-20 lg:py-28 bg-surface border-b border-line text-center space-y-8">
        <div className="mx-auto max-w-4xl px-6 space-y-6">
          <div className="inline-flex items-center gap-2 border border-brand-green/20 bg-brand-green-muted/65 px-3 py-1 text-brand-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green-light animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">PRODUCT-LED B2B WORKSPACE</span>
          </div>
          
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-ink">
            A collaborative workspace for <span className="text-brand-green">industrial surplus</span>.
          </h1>
          
          <p className="text-sm sm:text-base leading-relaxed text-ink-muted max-w-2xl mx-auto">
            Organize, verify, and exchange excess raw materials directly. Bypassing broker markups, static spreadsheet sheets, and long communication loops.
          </p>
          
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/register">
              <Button className="shadow-md">Create Free Workspace</Button>
            </Link>
            <a href="#product">
              <Button variant="secondary">Try Live Preview</Button>
            </a>
          </div>
        </div>
      </section>

      {/* 3. MONOCHROME LOGO WALL */}
      <section className="border-b border-line py-8 bg-paper text-center space-y-4">
        <p className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">LEDGER SYNCED WITH VETTED REGIONAL PARTNERS</p>
        <div className="mx-auto max-w-7xl px-6 flex flex-wrap justify-center items-center gap-x-16 gap-y-4 text-sm font-black tracking-[0.3em] text-ink-muted uppercase">
          <span>Apex Polymers</span>
          <span>Midwest Steel</span>
          <span>Vantage Corp</span>
          <span>Standard Alloys</span>
        </div>
      </section>

      {/* 4. INTERACTIVE PRODUCT-LED WORKSPACE PREVIEW */}
      <section id="product" className="py-20 bg-surface border-b border-line">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-8">
          <div className="text-left max-w-2xl">
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase">INTERACTIVE DEMO</span>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase mt-1">Experience the Directory Workspace</h2>
            <p className="text-xs text-ink-muted mt-1">Click through our different folders in the sidebar to inspect active material databases in real-time.</p>
          </div>

          {/* Interactive Notion-style Layout Panel */}
          <div className="border border-line bg-paper shadow-md flex min-h-[420px] rounded-none overflow-hidden divide-x divide-line text-left">
            
            {/* Mock Workspace Sidebar */}
            <aside className="w-64 border-r border-line bg-surface flex flex-col shrink-0 select-none hidden md:flex">
              <div className="p-4 border-b border-line flex items-center gap-2">
                <span className="h-5 w-5 bg-brand-green flex items-center justify-center text-paper font-black text-[9px] rounded-none">S</span>
                <div>
                  <p className="text-xs font-bold text-ink truncate leading-tight">SurplusLink HQ</p>
                  <p className="text-[9px] text-ink-muted leading-tight">B2B Exchange Node</p>
                </div>
              </div>

              <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold tracking-widest text-ink-muted uppercase px-2 mb-2">WORKSPACE DIRECTORY</p>
                  {PAGES.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setActivePageId(page.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium transition-colors rounded-none
                        ${activePageId === page.id 
                          ? "bg-brand-green-muted text-brand-green font-semibold" 
                          : "text-ink-muted hover:bg-muted hover:text-ink"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {page.icon}
                        <span>{page.label}</span>
                      </div>
                      <ChevronRight size={10} className="opacity-40" />
                    </button>
                  ))}
                </div>

                <div className="border border-line bg-paper p-3 space-y-2">
                  <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">NODE SECURITY</span>
                  <div className="space-y-1 text-[10px] text-ink-muted">
                    <div className="flex justify-between">
                      <span>Sync Status</span>
                      <span className="font-bold text-brand-green flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-brand-green rounded-full animate-ping" /> Vetted
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vetted Lots</span>
                      <span className="font-bold text-ink">412 active</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mock Workspace Content Area */}
            <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-paper">
              <AnimatePresence mode="wait">
                {activePageId === "overview" && (
                  <motion.div
                    key="overview-doc"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-brand-green">
                        <BookOpen size={16} />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">SURPLUSLINK HANDBOOK</span>
                      </div>
                      <h3 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                        Vetted surplus coordination
                      </h3>
                      <p className="text-xs text-ink-muted">Last verified update: May 20, 2026</p>
                    </div>

                    <div className="border border-line p-5 bg-surface space-y-4">
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider">A Private B2B Exchange</h4>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        SurplusLink provides a clean, folder-structured workspace designed to synchronize verified raw material excess. We verify tax records, physical composition certificates, and logistics capacities.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <Link href="/register">
                          <Button size="sm" className="text-[10px] font-bold tracking-wider">Join Workspace</Button>
                        </Link>
                        <button 
                          onClick={() => setActivePageId("plastics")} 
                          className="border border-line text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-muted text-xs transition-colors"
                        >
                          Browse Material Folders
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM MECHANICS</span>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="border border-line p-4 space-y-2 bg-surface text-left">
                          <UserCheck size={16} className="text-brand-green" />
                          <h5 className="text-xs font-bold uppercase">100% Vetted Entities</h5>
                          <p className="text-[11px] text-ink-muted leading-relaxed">We audit every supplier's tax certificate and warehouse records before releasing console keys.</p>
                        </div>
                        <div className="border border-line p-4 space-y-2 bg-surface text-left">
                          <ShieldCheck size={16} className="text-brand-green" />
                          <h5 className="text-xs font-bold uppercase">Quality Assurance Logs</h5>
                          <p className="text-[11px] text-ink-muted leading-relaxed">Suppliers submit certificates of analysis, weight tickets, and composition records.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activePageId !== "overview" && (
                  <motion.div
                    key={activePageId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-ink-muted text-[10px] uppercase font-bold mb-1">
                        <span>Workspace</span>
                        <ChevronRight size={10} />
                        <span className="text-brand-green">{activePage.category}</span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-ink uppercase tracking-tight">{activePage.label}</h3>
                      <p className="text-xs text-ink-muted mt-1">Mock database pull of current certified materials listed under this folder.</p>
                    </div>

                    <div className="space-y-3">
                      {activePageId === "plastics" && (
                        <>
                          <div className="border border-line p-4 hover:border-brand-green transition-colors bg-surface text-left">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Bulk PET Resin Regrind</h4>
                              <span className="text-[9px] bg-brand-green text-paper px-2 py-0.5 font-bold uppercase">Certified</span>
                            </div>
                            <p className="text-[11px] text-ink-muted mt-2">18 tons • Newark, NJ • Apex Polymers LLC</p>
                          </div>
                          <div className="border border-line p-4 hover:border-brand-green transition-colors bg-surface text-left">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">HDPE Shredded Bottles (Flakes)</h4>
                              <span className="text-[9px] border border-line text-ink-muted px-2 py-0.5 font-bold uppercase">Matching</span>
                            </div>
                            <p className="text-[11px] text-ink-muted mt-2">24 tons • Detroit, MI • Vantage Plastics Corp</p>
                          </div>
                        </>
                      )}

                      {activePageId === "metals" && (
                        <div className="border border-line p-4 hover:border-brand-green transition-colors bg-surface text-left">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Aluminum Extrusion Offcuts</h4>
                            <span className="text-[9px] bg-brand-green text-paper px-2 py-0.5 font-bold uppercase">Certified</span>
                          </div>
                          <p className="text-[11px] text-ink-muted mt-2">6 pallets • Phoenix, AZ • Phoenix Metalworks</p>
                        </div>
                      )}

                      {activePageId === "packaging" && (
                        <div className="border border-line p-4 hover:border-brand-green transition-colors bg-surface text-left">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Unused Corrugated Cartons</h4>
                            <span className="text-[9px] border border-line text-ink-muted px-2 py-0.5 font-bold uppercase">Matching</span>
                          </div>
                          <p className="text-[11px] text-ink-muted mt-2">3,200 units • Chicago, IL • Midwest Box Co.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </section>

      {/* 5. VETTING MECHANICS FEATURES GRID */}
      <section id="features" className="py-20 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase bg-brand-green-muted px-3 py-1">SYSTEM MECHANICS</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Vetting checks logged on the direct exchange</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Entity Verification", icon: <UserCheck className="text-brand-green" />, desc: "Suppliers submit corporate credentials, weight tickets, and regional warehouses logs. Opaque profiles are restricted." },
            { title: "Material Specification", icon: <FileText className="text-brand-green" />, desc: "Certified laboratory weight tickets, analysis sheets, and composition records are logged before release on directory feed." },
            { title: "Compliance Locks", icon: <Lock className="text-brand-green" />, desc: "Private matching console maintains direct logs, locking logistics routing between vetted operators. Zero broker markups." }
          ].map((feat, idx) => (
            <div key={idx} className="border border-line bg-surface p-8 space-y-4 hover:border-brand-green transition-all text-left">
              <div className="h-10 w-10 bg-brand-green-muted flex items-center justify-center">{feat.icon}</div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">{feat.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. OUTCOMES & SYSTEM METRICS */}
      <section id="stats" className="py-16 bg-surface border-t border-b border-line text-left">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 grid border border-line divide-y md:divide-y-0 md:divide-x divide-line md:grid-cols-3 bg-paper">
          {[
            { label: "Vetted capacity", val: "14.8k Tons", desc: "Industrial polymers and alloys matched directly this quarter" },
            { label: "Match speed", val: "4.2 Hours", desc: "Average duration from lot verification to buyer alignment" },
            { label: "Commission rates", val: "0.0%", desc: "Direct, transparent peer pricing with no transaction markups" }
          ].map((stat, idx) => (
            <div key={idx} className="p-8 space-y-2 hover:bg-surface/50 transition-colors">
              <span className="text-[8px] font-bold tracking-widest text-ink-muted uppercase block">{stat.label}</span>
              <p className="text-3xl font-extrabold text-brand-green tracking-tight">{stat.val}</p>
              <p className="text-xs text-ink-muted leading-relaxed mt-2">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CUSTOMER TRUST PANEL */}
      <section className="py-20 mx-auto max-w-5xl px-6 text-center space-y-6">
        <span className="text-[9px] font-bold tracking-widest text-brand-green uppercase font-bold">CUSTOMER ADVISORY</span>
        <blockquote className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-relaxed">
          "The collaborative directory dashboard is beautifully clean. SurplusLink bypassed opaque broker chains entirely, matching 3,200 carton pallets in under 24 hours in Detroit."
        </blockquote>
        <div className="space-y-1">
          <p className="text-xs font-bold text-ink uppercase">Director of Materials Logistics</p>
          <p className="text-[10px] text-ink-muted">Midwest Box Co. • Packaging Division</p>
        </div>
      </section>

      {/* 8. SYSTEM FAQ ACCORDION */}
      <section className="py-20 bg-surface border-t border-line text-left">
        <div className="mx-auto max-w-3xl px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">SYSTEM FAQ</span>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase">Frequently Answered Questions</h2>
          </div>

          <div className="border border-line bg-paper divide-y divide-line">
            {[
              { q: "How does directory vetting work?", a: "Every operator submits their tax registration, facilities permits, and operational safety certificates. In addition, each material lot listed requires laboratory weight certificates before release." },
              { q: "Are there any hidden transaction markups?", a: "No. We operate a flat monthly subscription model for vetted industrial manufacturers. There are zero transaction fees or broker commissions injected into your exchanges." }
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

      {/* 9. CLOSING CONVERSION CTA BANNER */}
      <section className="py-20 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="border border-line bg-paper p-8 sm:p-16 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 border-l border-b border-line bg-surface px-3 py-1 text-[8px] font-mono text-ink-muted">
            SYNC: D4_NOTION
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-ink">Request dashboard access.</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Create your corporate profile in our directory. Receive active matched industrial surplus listings verified in under 24 hours.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/register">
              <Button className="px-8 shadow-sm">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>

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
