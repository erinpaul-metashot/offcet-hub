"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ASSETS, Kicker, PillButton } from "./shared";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Scene1Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Intro: headline lines + supporting content rise in.
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .from(".oh-hero-line", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.09 })
        .from(".oh-hero-fade", { y: 24, opacity: 0, duration: 0.8, stagger: 0.12 }, "-=0.6")
        .from(".oh-hero-box", { scale: 0.82, opacity: 0, duration: 1.1, ease: "power3.out" }, "-=0.9");

      // Scroll-out: content drifts up & fades before the warehouse takes over.
      gsap.to(".oh-hero-content", {
        yPercent: -18,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".oh-hero-box", {
        yPercent: 22,
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden oh-grid-bg px-6 pt-28 pb-16 sm:px-10 lg:px-16"
      style={{ background: "var(--cream)" }}
    >
      <div className="oh-hero-content relative z-10 mx-auto w-full max-w-[1500px]">
        <div className="oh-hero-fade mb-8">
          <Kicker>B2B Surplus Exchange · Est. 2026</Kicker>
        </div>

        <h1 className="oh-display max-w-[16ch] text-[clamp(2.9rem,8.6vw,9rem)]">
          <span className="block overflow-hidden">
            <span className="oh-hero-line block">Where surplus</span>
          </span>
          <span className="block overflow-hidden">
            <span className="oh-hero-line block">
              finds its{" "}
              <span className="relative inline-block">
                <span
                  aria-hidden
                  className="absolute inset-x-[-4px] bottom-[0.12em] top-[0.42em] -z-0"
                  style={{ background: "var(--lime)" }}
                />
                <span className="relative z-10">next</span>
              </span>
            </span>
          </span>
          <span className="block overflow-hidden">
            <span className="oh-hero-line block">owner.</span>
          </span>
        </h1>

        <p className="oh-hero-fade mt-8 max-w-[46ch] text-[clamp(1rem,1.4vw,1.25rem)] leading-relaxed text-black/70">
          The B2B platform that connects suppliers, admins, and buyers around excess
          inventory — turning idle stock into moving momentum.
        </p>

        <div className="oh-hero-fade mt-10 flex flex-wrap items-center gap-4">
          <PillButton href="#warehouse" variant="solid">
            See how it works
            <span aria-hidden className="transition-transform group-hover:translate-y-0.5">↓</span>
          </PillButton>
          <PillButton href="/register" variant="outline">
            Get started
          </PillButton>
        </div>
      </div>

      {/* Warm hero accent — the sealed box, bottom-right */}
      <div className="oh-hero-box pointer-events-none absolute bottom-[-4%] right-[-6%] z-0 w-[min(46vw,560px)] select-none sm:right-[2%]">
        <div className="oh-float">
          <div
            aria-hidden
            className="absolute inset-[14%] -z-10 rounded-full blur-2xl"
            style={{ background: "var(--lime)", opacity: 0.45 }}
          />
          <Image
            src={ASSETS.heroBox}
            alt="A single sealed cardboard box"
            width={800}
            height={800}
            priority
            className="h-auto w-full drop-shadow-[0_40px_60px_rgba(92,58,33,0.28)]"
          />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="oh-hero-fade absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
        <span className="oh-mono text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-black/45">
          Scroll
        </span>
        <div className="oh-scroll-cue" />
      </div>
    </section>
  );
}
