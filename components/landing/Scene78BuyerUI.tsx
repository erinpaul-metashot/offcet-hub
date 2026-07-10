"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Package, MapPin, DollarSign } from "lucide-react";
import { Button, Panel, StatusBadge } from "@/components/ui";
import { NarrativeLabel } from "./shared";
import { scrollState, setCam, CAM } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LIME_BTN = "!border-2 !border-black !bg-[var(--lime)] !text-black !rounded-none uppercase";
const DARK_BTN = "!border-2 !border-black !bg-black !text-white !rounded-none uppercase";

/**
 * Scenes 7 + 8 — the buyer's "Assigned Inventory" view over the live 3D world.
 * Built from the real Button/Panel/StatusBadge. The lot card fades in, the buyer
 * clicks Review & Respond, then Interested, and the badge flips with a lime pulse.
 */
export function Scene78BuyerUI() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(".oh-b-respond", { opacity: 0, height: 0, y: 10 });
      gsap.set(".oh-b-badge-interested", { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=240%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: () => {
            scrollState.visible = 1;
            scrollState.glow = 0;
            setCam(CAM.uiHold);
          },
        },
      });

      tl.from(".oh-b-text", { opacity: 0, y: 40, duration: 0.8 }, 0)
        .from(".oh-b-window", { opacity: 0, y: 60, scale: 0.94, duration: 0.9, ease: "power3.out" }, 0.3)
        .from(".oh-b-card", { opacity: 0, y: 24, duration: 0.6 }, 1.1)
        .to(".oh-b-review", { scale: 0.94, duration: 0.2 }, 1.9)
        .to(".oh-b-review", { scale: 1, duration: 0.2 }, 2.1)
        .to(".oh-b-respond", { opacity: 1, height: "auto", y: 0, duration: 0.5, ease: "power2.out" }, 2.2)
        .to(".oh-b-interested", { scale: 0.94, duration: 0.2 }, 3.0)
        .to(".oh-b-interested", { scale: 1, duration: 0.2 }, 3.2)
        .to(".oh-b-badge-pending", { opacity: 0, scale: 0.6, duration: 0.25 }, 3.25)
        .to(".oh-b-badge-interested", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, 3.3)
        .to(".oh-b-window, .oh-b-text", { opacity: 0.2, scale: 0.94, y: -20, duration: 0.9 }, 4.0);

      gsap.to(".oh-b-pulse", { boxShadow: "0 0 0 10px rgba(209,245,59,0)", repeat: -1, duration: 1.6, ease: "power1.out" });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.62)" }}
    >
      <div className="relative z-20 mx-auto grid w-full max-w-[1120px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-12 lg:px-10">
        <div className="oh-b-text lg:col-span-5">
          <NarrativeLabel>Step 3 · Buyer Assignment</NarrativeLabel>
          <h2 className="oh-display mt-5 text-[clamp(2rem,4vw,4rem)]">Matched with the right buyer.</h2>
          <p className="mt-5 max-w-[36ch] text-[clamp(0.95rem,1.1vw,1.1rem)] leading-relaxed text-black/70">
            The lot lands directly in the buyer&apos;s assigned inventory — no
            searching, no noise. Just the right stock, in front of the right person.
          </p>
        </div>

        <div className="oh-b-window lg:col-span-7">
          <Panel className="!rounded-none !border-2 !border-black bg-[var(--paper)] shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 border-b-2 border-black px-4 py-2.5" style={{ background: "var(--cream)" }}>
              <Package size={14} />
              <span className="oh-mono text-[0.7rem] font-bold uppercase tracking-[0.16em]">Buyer · Assigned Inventory</span>
            </div>
            <div className="p-6">
              <span className="oh-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-black/50">Assigned to you</span>

              <div className="oh-b-card oh-border mt-3 bg-white p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="oh-display text-xl leading-tight">Premium Grade Aluminum Offcuts</h4>
                    <p className="oh-mono mt-1 flex flex-wrap items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-black/45">
                      <span className="flex items-center gap-1"><Package size={11} /> 12,500 kg</span>
                      <span className="flex items-center gap-1"><MapPin size={11} /> Rotterdam</span>
                    </p>
                  </div>
                  <div className="relative">
                    <span className="oh-b-badge-pending block"><StatusBadge status="assigned" /></span>
                    <span className="oh-b-badge-interested oh-b-pulse absolute right-0 top-0 block rounded-full"><StatusBadge status="interested" /></span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="oh-display flex items-center gap-1 text-2xl" style={{ color: "var(--espresso)" }}>
                    <DollarSign size={18} />18,400
                  </span>
                  <span className="oh-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-black/45">Expected price</span>
                </div>

                <div className="mt-5 border-t-2 border-black pt-4">
                  <Button className={`oh-b-review ${DARK_BTN}`}>
                    Review &amp; Respond <ArrowRight size={14} />
                  </Button>
                  <div className="oh-b-respond overflow-hidden">
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button className={`oh-b-interested ${LIME_BTN}`}>✓ Interested</Button>
                      <Button variant="secondary" className="!rounded-none !border-2 !border-black uppercase">Not now</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
