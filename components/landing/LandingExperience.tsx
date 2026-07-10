"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./landing.css";
import { Wordmark } from "./shared";
import { LandingCanvas } from "./three/LandingCanvas";
import { GlobalLoader } from "./GlobalLoader";
import { Scene1Hero } from "./Scene1Hero";
import { SceneWarehouse } from "./SceneWarehouse";
import { Scene4SupplierUI } from "./Scene4SupplierUI";
import { Scene56AdminUI } from "./Scene56AdminUI";
import { Scene78BuyerUI } from "./Scene78BuyerUI";
import { Scene9Fulfillment } from "./Scene9Fulfillment";
import { Scene10Resolution } from "./Scene10Resolution";
import { Scene11CTA } from "./Scene11CTA";

gsap.registerPlugin(ScrollTrigger);

export function LandingExperience() {
  // Pinned triggers depend on image dimensions; refresh once everything loads.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const t = window.setTimeout(refresh, 600);
    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div className="oh-root relative w-full overflow-x-clip">
      {/* Global Loading Screen */}
      <GlobalLoader />

      {/* Persistent 3D world behind the DOM — live for Scenes 2–10 */}
      <LandingCanvas />

      {/* Fixed floating nav — legible over both warm and dark scenes */}
      <header className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="oh-border flex items-center bg-white/90 px-3 py-2 backdrop-blur-sm">
          <Wordmark className="!text-[1.1rem]" />
        </a>
        <nav className="oh-border flex items-center gap-1 bg-white/90 p-1 backdrop-blur-sm">
          <a href="/login" className="oh-mono px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-black/70 hover:text-black">
            Login
          </a>
          <a
            href="/register"
            className="oh-mono px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
            style={{ background: "var(--lime)", color: "var(--black)" }}
          >
            Register
          </a>
        </nav>
      </header>

      <main id="top" className="relative z-10">
        <Scene1Hero />
        <SceneWarehouse />
        <Scene4SupplierUI />
        <Scene56AdminUI />
        <Scene78BuyerUI />
        <Scene9Fulfillment />
        <Scene10Resolution />
        <Scene11CTA />
      </main>
    </div>
  );
}
