"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ASSETS, NarrativeLabel } from "./shared";
import { scrollState, setCam, CAM } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PANELS = [
  { key: "supplier", label: "Supplier", img: ASSETS.supplierRelieved, tint: "var(--cream)", caption: "Idle stock, gone.", fit: "cover" as const },
  { key: "admin", label: "Admin", img: ASSETS.admin, tint: "#0b0b0a", caption: "Marketplace trusted.", fit: "cover" as const, dark: true },
  { key: "buyer", label: "Buyer", img: ASSETS.buyer, tint: "var(--white)", caption: "Inventory received.", fit: "cover" as const },
];

/**
 * Scene 10 — three-panel resolution. Supplier (relieved, clean warehouse), Admin
 * (platform core), and Buyer (receiving the box) settle side-by-side under a
 * single spanning headline.
 */
export function Scene10Resolution() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=160%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: () => {
            // keep the 3D warehouse cleared + framed behind the resolution panels
            scrollState.visible = 1;
            scrollState.cleared = 1;
            scrollState.boxFlight = 1;
            setCam(CAM.cleared);
          },
        },
      });

      tl.from(".oh-r-panel", { yPercent: 100, opacity: 0, duration: 1, stagger: 0.18, ease: "power3.out" }, 0)
        .from(".oh-r-caption", { opacity: 0, y: 16, duration: 0.5, stagger: 0.18 }, 0.6)
        .from(".oh-r-tape", { scaleX: 0, opacity: 0, duration: 0.8, ease: "power3.out" }, 1.6)
        .from(".oh-r-text-content > *", { opacity: 0, y: 30, duration: 0.7, stagger: 0.12 }, 2.0);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-screen w-full overflow-hidden" style={{ background: "var(--black)" }}>
      {/* three panels */}
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3">
        {PANELS.map((p) => (
          <div key={p.key} className="oh-r-panel relative flex flex-col justify-end overflow-hidden border-black md:border-r-2 last:border-r-0" style={{ background: p.tint }}>
            <div className={`absolute inset-0 ${p.dark ? "oh-grid-bg-dark" : ""}`}>
              <Image src={p.img} alt={p.label} fill className={p.fit === "cover" ? "object-cover" : "object-contain"} sizes="33vw" />
            </div>
            <div className="absolute left-4 top-4 z-10">
              <span className="oh-label" style={p.dark ? { background: "var(--lime)", color: "var(--black)" } : { background: "var(--black)", color: "var(--white)", borderColor: "var(--black)" }}>{p.label}</span>
            </div>
            <div className="oh-r-caption relative z-10 p-5">
              <span className="oh-border inline-block bg-white px-3 py-1.5 text-[0.72rem] font-bold">{p.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {/* spanning headline with tape strip background */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center">
        {/* The Tape Strip */}
        <div className="oh-r-tape absolute inset-x-0 -bottom-12 -top-10 -z-10 origin-center border-y-[3px] border-black bg-[#0b0b0a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md" />

        {/* Text Content */}
        <div className="oh-r-text-content relative z-20 px-6 text-center">
          <div className="flex justify-center"><NarrativeLabel accent>Result</NarrativeLabel></div>
          <h2 className="oh-display mx-auto mt-5 max-w-[18ch] text-[clamp(2.2rem,5.5vw,5.6rem)] text-white">
            Warehouse cleared. Everyone wins.
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(0.9rem,1.1vw,1.1rem)] leading-relaxed text-white/80">
            Suppliers move idle stock. Buyers find quality inventory. Admins keep the
            marketplace trusted.
          </p>
        </div>
      </div>
    </section>
  );
}
