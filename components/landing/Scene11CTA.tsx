"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NarrativeLabel, PillButton, Wordmark } from "./shared";
import { scrollState } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ROLES = [
  {
    tag: "For Suppliers",
    title: "List surplus in minutes.",
    body: "Turn idle inventory into a live listing with photos, quantities, and pricing — then let the platform find the buyer.",
    accent: true,
  },
  {
    tag: "For Admins",
    title: "Curate & match.",
    body: "Review every submission, run quality control, and assign lots to the buyers most likely to close.",
    accent: false,
  },
  {
    tag: "For Buyers",
    title: "Get matched inventory.",
    body: "Skip the search. Quality stock lands directly in your assigned inventory, ready to review and claim.",
    accent: false,
  },
];

/** Scene 11 — feature bento, trust bar, final CTA, and footer. Normal scroll. */
export function Scene11CTA() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".oh-cta-reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      // fade the 3D canvas out as the flat footer takes over
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 60%",
        onEnter: () => {
          scrollState.visible = 0;
        },
        onLeaveBack: () => {
          scrollState.visible = 1;
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative w-full oh-grid-bg px-6 py-24 sm:px-10 lg:px-16" style={{ background: "var(--cream)" }}>
      <div className="mx-auto max-w-[1400px]">
        {/* heading */}
        <div className="oh-cta-reveal mb-12 max-w-[24ch]">
          <NarrativeLabel>The Platform</NarrativeLabel>
          <h2 className="oh-display mt-5 text-[clamp(2.2rem,5vw,4.8rem)]">One marketplace, three roles.</h2>
        </div>

        {/* bento grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <div
              key={r.tag}
              className="oh-cta-reveal oh-border flex flex-col justify-between p-7 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              style={{ background: r.accent ? "var(--lime)" : "var(--white)", minHeight: 260 }}
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <span className="oh-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-black/55">{r.tag}</span>
                  <span className="oh-display text-2xl text-black/30">0{i + 1}</span>
                </div>
                <h3 className="oh-display text-[clamp(1.5rem,2.4vw,2rem)] leading-tight">{r.title}</h3>
              </div>
              <p className="mt-5 text-[0.92rem] leading-relaxed text-black/70">{r.body}</p>
            </div>
          ))}
        </div>

        {/* trust bar */}
        <div className="oh-cta-reveal mt-16 overflow-hidden border-y-2 border-black py-4">
          <div className="flex whitespace-nowrap" style={{ animation: "oh-marquee 24s linear infinite" }}>
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-8 pr-8" aria-hidden={dup === 1}>
                {["Trusted by 240+ suppliers", "Across 18 categories", "12,000+ lots cleared", "Zero listing fees", "Admin-verified quality"].map((t) => (
                  <span key={t} className="flex items-center gap-8">
                    <span className="oh-mono text-sm font-bold uppercase tracking-[0.16em]">{t}</span>
                    <span className="inline-block h-2 w-2" style={{ background: "var(--lime)", border: "1.5px solid #000" }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* final CTA */}
        <div className="oh-cta-reveal mt-16 flex flex-col items-center gap-8 oh-border px-6 py-20 text-center shadow-[10px_10px_0_0_rgba(0,0,0,1)]" style={{ background: "var(--black)" }}>
          <NarrativeLabel accent>Get Started</NarrativeLabel>
          <h2 className="oh-display max-w-[16ch] text-[clamp(2.4rem,6vw,6rem)]" style={{ color: "var(--white)" }}>
            Ready to clear your warehouse?
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <PillButton href="/register" variant="lime">Get started →</PillButton>
            <PillButton href="#warehouse" variant="outline" className="!border-white !text-white">Learn more</PillButton>
          </div>
        </div>

        {/* footer */}
        <footer className="mt-16 flex flex-col items-center justify-between gap-6 border-t-2 border-black pt-8 sm:flex-row">
          <Wordmark />
          <div className="flex flex-wrap items-center gap-6 oh-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-black/60">
            <a href="/login" className="hover:text-black">Login</a>
            <a href="/register" className="hover:text-black">Register</a>
            <a href="#warehouse" className="hover:text-black">How it works</a>
          </div>
          <span className="oh-mono text-[0.65rem] uppercase tracking-[0.16em] text-black/45">© 2026 Offcet Hub</span>
        </footer>
      </div>
    </section>
  );
}
