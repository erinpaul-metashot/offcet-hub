"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { UserPlus, Users, CheckCircle2, Sparkles } from "lucide-react";
import { Button, Panel, StatusBadge } from "@/components/ui";
import { NarrativeLabel } from "./shared";
import { scrollState, setCam, CAM } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LIME_BTN = "!border-2 !border-black !bg-[var(--lime)] !text-black !rounded-none uppercase";
const DARK_BTN = "!border-2 !border-black !bg-black !text-white !rounded-none uppercase";

/**
 * Scenes 5 + 6 — the data packet morphs into the Admin Assignments dashboard in
 * the "platform core". Built from the real Button/Panel/StatusBadge components.
 * Admin reviews the lot, recruits two candidates, confirms, toast fires, and a
 * new packet launches toward the buyer.
 */
export function Scene56AdminUI() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(".oh-a-check", { scale: 0, opacity: 0 });
      gsap.set(".oh-a-toast", { opacity: 0, y: 24 });
      gsap.set(".oh-a-packet", { opacity: 0, scale: 0.2 });
      gsap.set(".oh-a-candidate", { opacity: 0, x: 30 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=260%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: () => {
            scrollState.visible = 1;
            scrollState.glow = 0;
            setCam(CAM.uiHoldAlt);
          },
        },
      });

      tl.fromTo(".oh-a-packet-in", { x: -window.innerWidth * 0.45, y: 60, opacity: 1, scale: 1 }, { x: 0, y: 0, scale: 0.3, opacity: 0, duration: 0.9, ease: "power2.out" }, 0)
        .from(".oh-a-window", { opacity: 0, scale: 0.9, y: 40, duration: 0.9, ease: "power3.out" }, 0.6)
        .from(".oh-a-text", { opacity: 0, y: 30, duration: 0.7 }, 0.8)
        .fromTo(".oh-a-lot", { boxShadow: "0 0 0 0 rgba(209,245,59,0)" }, { boxShadow: "0 0 0 3px #d1f53b", duration: 0.5 }, 1.7)
        .to(".oh-a-recruit", { scale: 0.94, duration: 0.2 }, 2.2)
        .to(".oh-a-recruit", { scale: 1, duration: 0.2 }, 2.4)
        .to(".oh-a-candidate", { opacity: 1, x: 0, duration: 0.4, stagger: 0.2 }, 2.5)
        .to(".oh-a-check", { scale: 1, opacity: 1, duration: 0.3, stagger: 0.3, ease: "back.out(2.5)" }, 3.1)
        .to(".oh-a-candidate", { borderColor: "#d1f53b", duration: 0.3, stagger: 0.3 }, 3.1)
        .to(".oh-a-confirm", { scale: 0.94, duration: 0.2 }, 3.9)
        .to(".oh-a-confirm", { scale: 1, duration: 0.2 }, 4.1)
        .to(".oh-a-toast", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" }, 4.2)
        .to(".oh-a-packet", { opacity: 1, scale: 1, duration: 0.3 }, 4.7)
        .to(".oh-a-packet", { y: () => window.innerHeight * 0.4, x: () => window.innerWidth * 0.3, scale: 1.6, opacity: 0, duration: 1, ease: "power2.in" }, 4.85)
        .to(".oh-a-window, .oh-a-text", { opacity: 0.2, scale: 0.94, duration: 0.9 }, 5.0);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex h-screen w-full items-center justify-center overflow-hidden oh-grid-bg-dark backdrop-blur-md" style={{ background: "rgba(11,11,10,0.9)" }}>
      <div className="oh-a-packet-in absolute left-1/2 top-1/2 z-30 h-14 w-14 -translate-x-1/2 -translate-y-1/2" style={{ background: "var(--lime)", border: "2px solid #000", boxShadow: "0 0 30px rgba(209,245,59,0.9)" }} aria-hidden />

      <div className="relative z-20 mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-12 lg:px-10">
        <div className="oh-a-text lg:col-span-4">
          <NarrativeLabel>Step 2 · Admin Review</NarrativeLabel>
          <h2 className="oh-display mt-5 text-[clamp(2rem,3.6vw,3.6rem)]" style={{ color: "var(--white)" }}>Quality control &amp; smart matching.</h2>
          <p className="mt-5 max-w-[38ch] text-[clamp(0.95rem,1.1vw,1.1rem)] leading-relaxed text-white/60">
            Platform admins review every submission and strategically assign lots to
            the buyers most likely to move them.
          </p>
        </div>

        <div className="oh-a-window lg:col-span-8">
          <Panel className="!rounded-none !border-2 !border-black bg-[var(--paper)] shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
            {/* window title bar */}
            <div className="flex items-center gap-2 border-b-2 border-black px-4 py-2.5" style={{ background: "var(--lime)" }}>
              <Users size={14} />
              <span className="oh-mono text-[0.7rem] font-bold uppercase tracking-[0.16em]">Admin · Assignments</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="border-black p-5 md:border-r-2">
                <span className="oh-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-black/50">Incoming Lot</span>
                <div className="oh-a-lot oh-border mt-3 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="pending_review" />
                    <span className="oh-mono text-[0.6rem] font-bold text-black/40">#LOT-2481</span>
                  </div>
                  <h4 className="oh-display mt-2 text-lg leading-tight">Premium Grade Aluminum Offcuts</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[0.72rem]">
                    <Meta k="Qty" v="12,500 kg" />
                    <Meta k="Category" v="Metals" />
                    <Meta k="Price" v="$18,400" />
                    <Meta k="Origin" v="Rotterdam" />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="oh-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-black/50">Buyer Candidates</span>
                  <Button size="sm" className={`oh-a-recruit ${LIME_BTN} !min-h-8 !px-3`}>
                    <UserPlus size={13} /> Recruit
                  </Button>
                </div>
                <div className="mt-3 grid gap-2.5">
                  {[
                    { n: "Nordic Metals Co.", m: "94% match" },
                    { n: "Rotterdam Recyclers", m: "88% match" },
                  ].map((c) => (
                    <div key={c.n} className="oh-a-candidate oh-border flex items-center justify-between bg-white px-3 py-2.5">
                      <div>
                        <p className="text-[0.82rem] font-bold">{c.n}</p>
                        <p className="oh-mono flex items-center gap-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--espresso)" }}>
                          <Sparkles size={11} /> {c.m}
                        </p>
                      </div>
                      <span className="oh-a-check grid h-6 w-6 place-items-center rounded-full" style={{ background: "var(--lime)", border: "2px solid #000" }}>
                        <CheckCircle2 size={14} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button className={`oh-a-confirm ${DARK_BTN}`}>Confirm Assignment</Button>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="oh-a-toast absolute bottom-10 left-1/2 z-40 -translate-x-1/2">
        <div className="oh-border flex items-center gap-2.5 bg-white px-4 py-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
          <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={15} /></span>
          <span className="text-[0.8rem] font-bold">Assignment confirmed · 2 buyers notified</span>
        </div>
      </div>

      <div className="oh-a-packet absolute left-1/2 top-1/2 z-40 h-14 w-14 -translate-x-1/2 -translate-y-1/2" style={{ background: "var(--lime)", border: "2px solid #000", boxShadow: "0 0 30px rgba(209,245,59,0.9)" }} aria-hidden />
    </section>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <span className="oh-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-black/40">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}
