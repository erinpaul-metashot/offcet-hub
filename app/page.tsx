"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers, Layout, Kanban, FolderLock, Sparkles, Database, CheckSquare, Award } from "lucide-react";

interface VariationOverview {
  num: string;
  title: string;
  desc: string;
  badge: string;
}

const REDESIGNS: VariationOverview[] = [
  { num: "01", title: "The Technical Grid Ledger", desc: "Linear & Attio inspired border grid, featuring an interactive React B2B Exchange simulator flow.", badge: "Engineering-First" },
  { num: "02", title: "The Typographic High-Contrast Corporate", desc: "Stripe-inspired, featuring high-contrast geometric text sizes, spacious tracking, and clean tables.", badge: "Conversion-Focused" },
  { num: "03", title: "The Swiss Architectural Minimalist", desc: "Apple & Basel inspired structural alignment. Airy margins, light rules, warm parchment background, zero shadows.", badge: "Pure Restraint" },
  { num: "04", title: "The Modern Collaborative Workspace", desc: "Notion & Slack inspired. Features a mock navigation sidebar where clicking folders updates specific logs.", badge: "Interactive Doc" },
  { num: "05", title: "The Split-Screen Focus Layout", desc: "Ramp inspired 50/50 balance. Sticky value proposition column on the left and scroll-detailed catalog logs on the right.", badge: "Optimal Content" },
  { num: "06", title: "The Step-by-Step Flowchart Guide", desc: "Figma inspired schematic mapping. An interactive flow detailing surplus intake, document check, and assignment.", badge: "Process Schematic" },
  { num: "07", title: "The High-Volume Data Spreadsheet", desc: "Retool inspired dense brokerage spreadsheet. Fully sortable column headers and real-time category filter buttons.", badge: "Data Density" },
  { num: "08", title: "The Minimalist Structural Bento Grid", desc: "Apple inspired alignment. Perfectly aligned bento-box grid displaying distinct modular B2B proof points.", badge: "Visual Harmony" },
  { num: "09", title: "The Corporate Catalog Directory", desc: "Amazon B2B inspired list directory. Active catalog listings, weight specs, and instant peer-inquiry triggers.", badge: "Product-First" },
  { num: "10", title: "The Onboarding Interactive Wizard", desc: "A single-screen step guide replacing scroll layouts. Renders a customized high-fidelity dashboard based on user selections.", badge: "Guided Flow" }
];

export default function RootIndex() {
  return (
    <div className="min-h-screen bg-paper bg-blueprint-grid py-16 px-6 sm:px-8 lg:px-12 selection:bg-brand-green selection:text-white text-ink">
      <div className="mx-auto max-w-5xl space-y-12">
        
        {/* BRAND HEADER */}
        <header className="border-b border-line pb-6 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-green bg-brand-green-muted px-2 py-0.5">
              SURPLUSLINK
            </span>
            <span className="hidden text-[10px] font-semibold tracking-[0.2em] text-ink-muted sm:inline uppercase ml-2">
              / DESIGN LAB
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-ink transition-colors">
              Login
            </Link>
            <Link href="/register" className="text-xs font-bold uppercase tracking-wider text-brand-green hover:text-brand-green-light transition-colors">
              Register
            </Link>
          </div>
        </header>

        {/* INTRODUCTION BLOCK */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 border border-brand-green/30 bg-brand-green-muted px-3 py-1">
            <span className="h-1.5 w-1.5 bg-brand-green-light animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-brand-green uppercase">
              10 Audited Redesigns Live
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[0.95] text-ink">
            A visual catalog of modern B2B SaaS aesthetics.
          </h1>

          <p className="text-base text-ink-muted leading-relaxed max-w-3xl">
            We have redesigned the SurplusLink landing page into **10 completely distinct, audited visual directions**. 
            Each variation has its own unique layout, custom React interactivity, and highly polished SaaS branding. 
            All standard "AI templates" (neon glows, galaxies, glassmorphic blobs, node graphs, editorial slop) have been strictly replaced with professional, light-mode design guidelines.
          </p>

          <div className="pt-2">
            <Link href="/design/d1">
              <button className="bg-brand-green hover:bg-brand-green-light text-paper text-xs font-bold uppercase tracking-widest px-8 py-3.5 flex items-center gap-2 transition-all shadow-sm">
                Enter Design Sandbox <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </section>

        {/* DESIGN MATRIX GRID */}
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-6 py-4 bg-surface flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-widest text-ink-muted uppercase">SANDBOX REGISTRY</span>
            <span className="text-[10px] text-brand-green font-bold uppercase">10 distinct identities</span>
          </div>

          <div className="divide-y divide-line">
            {REDESIGNS.map(redesign => (
              <Link 
                key={redesign.num}
                href={`/design/d${parseInt(redesign.num)}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 hover:bg-surface transition-all text-left"
              >
                <div className="flex gap-6 items-start">
                  <span className="font-mono text-lg font-black text-brand-green group-hover:scale-110 transition-transform">
                    {redesign.num}
                  </span>
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wider group-hover:text-brand-green transition-colors">
                        {redesign.title}
                      </h3>
                      <span className="text-[9px] font-bold tracking-wider text-ink-muted bg-surface border border-line px-1.5 uppercase">
                        {redesign.badge}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted max-w-xl leading-relaxed">
                      {redesign.desc}
                    </p>
                  </div>
                </div>

                <div className="flex sm:justify-end items-center shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-muted group-hover:text-brand-green transition-all flex items-center gap-1.5">
                    Launch <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
