"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NarrativeLabel } from "./shared";
import { scrollState, mixCam, setCam, CAM } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Scenes 2 + 3 — pure DOM text overlay. The pinned ScrollTrigger drives the real
 * R3F camera through the 3D warehouse: a wide establishing dolly-in, then a pan
 * to the supplier's workstation as the laptop screen glows lime.
 */
export function SceneWarehouse() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=240%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            scrollState.visible = 1;
            if (p < 0.45) {
              mixCam(CAM.establish, CAM.dolly, p / 0.45);
              scrollState.glow = 0;
            } else if (p < 0.75) {
              mixCam(CAM.dolly, CAM.workstation, (p - 0.45) / 0.3);
              scrollState.glow = smoothstep(0.55, 0.75, p);
            } else if (p < 0.9) {
              mixCam(CAM.workstation, CAM.laptopZoom, (p - 0.75) / 0.15);
              scrollState.glow = 1.0;
            } else {
              setCam(CAM.laptopZoom);
              scrollState.glow = 1.0;
            }
          },
        },
      });

      // DOM text choreography synced to the same scroll range
      tl.to(".oh-wh-textA", { opacity: 0, y: -50, duration: 0.5 }, 0.42)
        .fromTo(".oh-wh-textB", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5 }, 0.6)
        .to(".oh-wh-textB", { opacity: 0, y: -40, duration: 0.4 }, 0.94);
    },
    { scope: root },
  );

  return (
    <section id="warehouse" ref={root} className="relative h-screen w-full overflow-hidden">
      {/* Text overlay A — Scene 2 */}
      <div className="oh-wh-textA absolute left-6 top-[16%] z-10 max-w-[42ch] sm:left-12 lg:left-20">
        <NarrativeLabel>The Problem</NarrativeLabel>
        <h2 className="oh-display mt-5 text-[clamp(2.2rem,5.4vw,5.2rem)] drop-shadow-[0_2px_18px_rgba(244,240,230,0.7)]">
          Warehouses overflow.<br />Inventory sits idle.
        </h2>
        <p className="mt-5 max-w-[40ch] text-[clamp(0.95rem,1.2vw,1.15rem)] font-medium leading-relaxed text-black/75">
          Suppliers produce more than they can sell. Excess stock takes up space,
          ties up capital, and depreciates by the day.
        </p>
      </div>

      {/* Text overlay B — Scene 3 */}
      <div className="oh-wh-textB absolute right-6 top-[18%] z-10 max-w-[40ch] text-right opacity-0 sm:right-12 lg:right-20">
        <div className="flex justify-end">
          <NarrativeLabel accent>Step 1 · Supplier</NarrativeLabel>
        </div>
        <h2 className="oh-display mt-5 text-[clamp(2rem,4.8vw,4.6rem)] drop-shadow-[0_2px_18px_rgba(244,240,230,0.7)]">
          List your excess<br />inventory in minutes.
        </h2>
        <p className="mt-5 ml-auto max-w-[36ch] text-[clamp(0.95rem,1.2vw,1.1rem)] font-medium leading-relaxed text-black/75">
          One glowing screen turns a mountain of boxes into a live listing — ready
          for the marketplace.
        </p>
      </div>
    </section>
  );
}
