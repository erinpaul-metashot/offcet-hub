"use client";

import type { SceneOutput } from "@/components/demo/core/types";
import { rangeProgress, lerp, easeOutCubic, easeInCubic } from "@/components/demo/core/utils";

/**
 * Act 1 — Opening (The "Hype Video" Redesign)
 * High-speed typographic sequence grabbing attention,
 * splitting to reveal the brand, and zooming into the dashboard.
 */
export function Act1Opening({ progress }: { progress: number }): SceneOutput {
  // We divide the opening progress into 4 distinct phases:
  const flashP = rangeProgress(progress, 0, 0.25);
  const oppP = rangeProgress(progress, 0.25, 0.50);
  const revealP = rangeProgress(progress, 0.50, 0.80);
  const zoomP = rangeProgress(progress, 0.80, 1.0);

  /* ── Camera ── */
  // The camera slowly pushes in during the flash/opp phases,
  // then aggressively zooms in to transition to the UI.
  const cameraScale = 
    lerp(1, 1.1, easeOutCubic(progress)) + 
    lerp(0, 4, easeInCubic(zoomP)); // Massive zoom at the end

  const camera = {
    scale: cameraScale,
    x: 0,
    y: 0,
  };

  /* ── Cursor ── */
  const cursor = {
    x: 50,
    y: 50,
    visible: false,
    state: "idle" as const,
  };

  /* ── Phase 1: Flashing Words ── */
  const flashWords = ["EXCESS.", "LIABILITY.", "WASTE."];
  const activeFlashIndex = Math.floor(flashP * flashWords.length);
  const currentFlashWord = activeFlashIndex < flashWords.length ? flashWords[activeFlashIndex] : null;
  // A slight scale bump for each flashed word
  const wordBump = activeFlashIndex < flashWords.length 
    ? lerp(1.2, 1, rangeProgress(flashP, activeFlashIndex / flashWords.length, (activeFlashIndex + 1) / flashWords.length))
    : 1;

  /* ── Phase 2 & 3: OPPORTUNITY and Reveal ── */
  // The word OPPORTUNITY slams onto the screen.
  // Then it splits horizontally.
  const oppSlamScale = oppP > 0 ? lerp(2, 1, easeOutCubic(rangeProgress(oppP, 0, 0.2))) : 0;
  
  // Splitting animation
  const splitY = lerp(0, 150, easeOutCubic(revealP));
  const splitOpacity = lerp(1, 0, easeInCubic(rangeProgress(revealP, 0.5, 1)));

  // Brand Reveal
  const brandScale = lerp(0.8, 1, easeOutCubic(revealP));
  const brandOpacity = easeOutCubic(rangeProgress(revealP, 0.1, 0.5));
  
  // Fade everything out at the very end as we zoom through
  const globalOpacity = lerp(1, 0, easeInCubic(zoomP));

  const element = (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#050505", // Pitch black
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        overflow: "hidden",
        opacity: globalOpacity,
      }}
    >
      {/* Background Noise/Texture */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
          pointerEvents: "none",
        }}
      />

      {/* PHASE 1: Flashing Words */}
      {flashP > 0 && flashP < 1 && currentFlashWord && (
        <div
          style={{
            position: "absolute",
            fontSize: 140,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            transform: `scale(${wordBump})`,
            zIndex: 10,
          }}
        >
          {currentFlashWord}
        </div>
      )}

      {/* PHASE 2 & 3: OPPORTUNITY Split & SURPLUSLINK Reveal */}
      {oppP > 0 && (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          
          {/* Top half of OPPORTUNITY */}
          <div
            style={{
              position: "absolute",
              height: "50%",
              top: 0,
              width: "100%",
              overflow: "hidden",
              transform: `translateY(-${splitY}px)`,
              opacity: splitOpacity,
              zIndex: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${oppSlamScale})`,
                fontSize: 160,
                fontWeight: 900,
                color: "var(--brand-green)",
                letterSpacing: "-0.04em",
                textShadow: "0 0 40px rgba(26,86,50,0.5)",
              }}
            >
              OPPORTUNITY.
            </div>
          </div>

          {/* Bottom half of OPPORTUNITY */}
          <div
            style={{
              position: "absolute",
              height: "50%",
              bottom: 0,
              width: "100%",
              overflow: "hidden",
              transform: `translateY(${splitY}px)`,
              opacity: splitOpacity,
              zIndex: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: `translate(-50%, 50%) scale(${oppSlamScale})`,
                fontSize: 160,
                fontWeight: 900,
                color: "var(--brand-green)",
                letterSpacing: "-0.04em",
                textShadow: "0 0 40px rgba(26,86,50,0.5)",
              }}
            >
              OPPORTUNITY.
            </div>
          </div>

          {/* Center Brand Reveal: SURPLUSLINK */}
          <div
            style={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              transform: `scale(${brandScale})`,
              opacity: brandOpacity,
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: "0.4em",
                color: "#ffffff",
              }}
            >
              SURPLUS<span style={{ color: "var(--brand-green)" }}>LINK</span>
            </div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: "0.2em",
                color: "var(--ink-muted)",
                fontFamily: "var(--font-sans)",
                textTransform: "uppercase",
              }}
            >
              The Intelligent B2B Marketplace
            </div>
          </div>

        </div>
      )}
    </div>
  );

  return { element, camera, cursor };
}
