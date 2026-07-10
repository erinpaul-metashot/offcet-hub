"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NarrativeLabel } from "./shared";
import { scrollState, mixCam, CAM } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Scene 9 — split-screen negotiation over the live 3D warehouse. Once the deal
 * confirms, the panels slide away and the real 3D hero box uproots from the pile
 * and flies out to the buyer (driven by scrollState.boxFlight).
 */
export function Scene9Fulfillment() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(".oh-f-bubble", { opacity: 0, y: 14 });
      gsap.set(".oh-f-confirm", { opacity: 0, scale: 0.6 });
      gsap.set(".oh-f-text", { opacity: 0, y: 30 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=280%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            scrollState.visible = 1;
            scrollState.glow = 0;
            mixCam(CAM.uiHold, CAM.fulfill, smoothstep(0.0, 0.4, p));
            scrollState.boxFlight = smoothstep(0.45, 0.9, p);
            // the pile empties as payoff once the hero box has left
            scrollState.cleared = smoothstep(0.78, 1.0, p);
          },
        },
      });

      tl.from(".oh-f-phone-wrapper", { y: "100vh", rotation: 5, duration: 0.9, ease: "power3.out" }, 0)
        .to(".oh-f-bubble", { opacity: 1, y: 0, duration: 0.4, stagger: 0.3 }, 0.8)
        .to(".oh-f-confirm", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, 2.3)
        .to(".oh-f-phone-wrapper", { y: "-100vh", rotation: -5, duration: 1, ease: "power2.inOut" }, 3.1)
        .to(".oh-f-text", { opacity: 1, y: 0, duration: 0.6 }, 3.5);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-screen w-full overflow-hidden">
      {/* text overlay for the reveal */}
      <div className="oh-f-text absolute left-6 top-[14%] z-20 max-w-[40ch] opacity-0 sm:left-12 lg:left-20">
        <NarrativeLabel accent>Step 4 · Deal Closed</NarrativeLabel>
        <h2 className="oh-display mt-5 text-[clamp(2rem,4.8vw,4.6rem)] drop-shadow-[0_2px_18px_rgba(244,240,230,0.7)]">
          Details confirmed.<br />Inventory moves.
        </h2>
      </div>

      {/* Mobile Phone Mockup Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="oh-f-phone-wrapper h-[620px] w-[350px] will-change-transform">
          <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border-[4px] border-black bg-white shadow-[16px_16px_0_0_rgba(0,0,0,1)] pointer-events-auto">
            
            {/* Phone Notch */}
            <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl border-b-[4px] border-l-[4px] border-r-[4px] border-black bg-black"></div>

            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center gap-4 border-b-[4px] border-black bg-cream px-6 pb-4 pt-10">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-lime font-black text-xl text-black">
                  B
                </div>
                <div>
                  <h3 className="oh-mono text-sm font-black uppercase tracking-widest text-black">Buyer Group</h3>
                  <p className="oh-mono text-[0.65rem] font-bold text-black/60">Lot #2481 Negotiation</p>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex flex-1 flex-col justify-end gap-3 bg-sand/20 p-5 pb-6">
                <div className="flex flex-col items-start gap-1.5">
                  <span className="oh-mono ml-1 text-[0.65rem] font-bold uppercase tracking-wider text-black/40">Supplier</span>
                  <Bubble side="l">Ready to release Lot #2481.</Bubble>
                  <Bubble side="l" accent>Logistics booked · pickup Thu.</Bubble>
                </div>

                <div className="mt-4 flex flex-col items-end gap-1.5">
                  <span className="oh-mono mr-1 text-[0.65rem] font-bold uppercase tracking-wider text-black/40">Buyer (You)</span>
                  <Bubble side="r">Payment sent — confirmed off-app.</Bubble>
                  <Bubble side="r" accent>Send it over. 🚚</Bubble>
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t-[4px] border-black bg-cream p-4">
                <div className="flex h-12 w-full items-center justify-between rounded-full border-[3px] border-black bg-white px-4">
                  <span className="oh-mono text-xs font-semibold text-black/30">Message...</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black">
                    <div className="h-2 w-2 rounded-full bg-lime"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Deal Confirmed Overlay */}
            <div className="oh-f-confirm absolute inset-0 z-30 flex flex-col items-center justify-center bg-sand/70 backdrop-blur-sm">
              <div className="oh-border bg-white px-5 py-5 text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full text-2xl font-black text-black" style={{ background: "var(--lime)", border: "3px solid #000" }}>✓</div>
                <p className="oh-display text-lg text-black">Deal Confirmed</p>
                <p className="oh-mono mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-black/60">Ready for fulfillment</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ children, side, accent }: { children: React.ReactNode; side: "l" | "r"; accent?: boolean }) {
  return (
    <div
      className="oh-f-bubble oh-border max-w-[85%] px-4 py-2.5 text-[0.8rem] font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
      style={{
        background: accent ? "var(--lime)" : "var(--white)",
        color: "var(--black)",
        borderTopLeftRadius: side === "l" ? 0 : 16,
        borderTopRightRadius: side === "r" ? 0 : 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
      }}
    >
      {children}
    </div>
  );
}
