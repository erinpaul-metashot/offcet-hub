"use client";

import { useMemo } from "react";
import type { SceneOutput } from "@/components/demo/core/types";
import { rangeProgress, lerp, easeOutCubic, easeInCubic } from "@/components/demo/core/utils";
import { CountUpNumber } from "@/components/demo/primitives";

/**
 * Act 7 — Closing (The "Data Explosion" Redesign)
 * The scene erupts into a massive particle data visualization,
 * forming an upward trend graph, stamping massive impact numbers,
 * and collapsing into a glowing portal CTA.
 */
export function Act7Closing({ progress }: { progress: number }): SceneOutput {
  const particlesP = rangeProgress(progress, 0.05, 0.40);
  const graphP = rangeProgress(progress, 0.20, 0.60);
  const metricsP = rangeProgress(progress, 0.45, 0.75);
  const collapseP = rangeProgress(progress, 0.75, 0.85);
  const ctaP = rangeProgress(progress, 0.80, 1.0);

  /* ── Camera ── */
  const camera = { scale: 1, x: 0, y: 0 };

  /* ── Cursor ── */
  const cursor = { x: 0, y: 0, visible: false, state: "idle" as const };

  /* ── Particles Data ── */
  // Pre-compute 100 particles for the explosion
  const particles = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      xStart: Math.random() * 100,
      yStart: Math.random() * 100,
      xEnd: i, // Spread evenly across the width for the graph
      yEnd: 90 - (i * 0.6 + Math.random() * 10), // Upward trending
      delay: Math.random() * 0.5,
      size: Math.random() * 4 + 2,
    }));
  }, []);

  /* ── Graph SVG Path ── */
  // A simple upward curve
  const graphPathLength = 1400; // approximate pixel length
  const strokeDashoffset = lerp(graphPathLength, 0, easeOutCubic(graphP));

  /* ── Metrics ── */
  const metric1Scale = lerp(2, 1, easeOutCubic(rangeProgress(metricsP, 0, 0.3)));
  const metric1Opacity = easeOutCubic(rangeProgress(metricsP, 0, 0.2));
  
  const metric2Scale = lerp(2, 1, easeOutCubic(rangeProgress(metricsP, 0.3, 0.6)));
  const metric2Opacity = easeOutCubic(rangeProgress(metricsP, 0.3, 0.5));

  /* ── Collapse & CTA ── */
  const collapseScale = lerp(1, 0, easeInCubic(collapseP));
  const portalScale = lerp(0.5, 1, easeOutCubic(ctaP));
  const portalOpacity = easeOutCubic(rangeProgress(ctaP, 0, 0.3));

  const element = (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Data Explosion & Graph (Scales down during collapse) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${collapseScale})`,
          opacity: collapseScale,
          transformOrigin: "center center",
        }}
      >
        {/* Particles */}
        {particlesP > 0 && particles.map((p) => {
          const pProgress = easeOutCubic(rangeProgress(particlesP, p.delay, 1));
          const currentX = lerp(p.xStart, p.xEnd, pProgress);
          const currentY = lerp(p.yStart, p.yEnd, pProgress);
          const pOpacity = particlesP > p.delay ? 1 : 0;
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${currentX}%`,
                top: `${currentY}%`,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                backgroundColor: "var(--brand-green)",
                opacity: pOpacity * 0.6,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 10px rgba(26,86,50,0.8)",
              }}
            />
          );
        })}

        {/* Upward Line Graph */}
        {graphP > 0 && (
          <svg
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "60%",
              overflow: "visible",
            }}
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
          >
            {/* Gradient Fill under the graph */}
            <defs>
              <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(26,86,50, 0.4)" />
                <stop offset="100%" stopColor="rgba(26,86,50, 0)" />
              </linearGradient>
            </defs>
            <path
              d="M 0 400 Q 200 350 400 250 T 800 100 T 1000 50 L 1000 400 Z"
              fill="url(#graphGradient)"
              opacity={easeOutCubic(graphP) * 0.8}
            />
            {/* The Line */}
            <path
              d="M 0 400 Q 200 350 400 250 T 800 100 T 1000 50"
              fill="none"
              stroke="var(--brand-green)"
              strokeWidth="4"
              strokeDasharray={graphPathLength}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: "drop-shadow(0px 0px 12px rgba(26,86,50, 1))",
              }}
            />
          </svg>
        )}

        {/* Impact Metrics (Stamping onto screen) */}
        <div style={{ position: "absolute", top: "15%", left: "10%" }}>
          <div
            style={{
              transform: `scale(${metric1Scale})`,
              opacity: metric1Opacity,
              transformOrigin: "left center",
            }}
          >
            <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              <CountUpNumber target={12} progress={metricsP * 1.5} />k TONS
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--brand-green)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Landfill Diverted
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", top: "45%", right: "10%", textAlign: "right" }}>
          <div
            style={{
              transform: `scale(${metric2Scale})`,
              opacity: metric2Opacity,
              transformOrigin: "right center",
            }}
          >
            <div style={{ fontSize: 110, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              $<CountUpNumber target={2.4} progress={(metricsP - 0.3) * 2} formatFn={(n) => n.toFixed(1)} />M
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--brand-green)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Value Recovered
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA Portal (Explodes from center) ── */}
      {ctaP > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: portalOpacity,
          }}
        >
          {/* Concentric rings */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              style={{
                position: "absolute",
                width: 300 * ring,
                height: 300 * ring,
                borderRadius: "50%",
                border: "1px solid rgba(26,86,50,0.3)",
                transform: `scale(${portalScale})`,
                opacity: 1 - (ring * 0.2),
                animation: ctaP > 0.8 ? `demo-pulse-border ${2 + ring}s ease-in-out infinite` : "none",
              }}
            />
          ))}

          {/* Central Portal Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
              transform: `scale(${portalScale})`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "0.4em",
                color: "#ffffff",
                fontFamily: "var(--font-display)",
                textShadow: "0 0 30px rgba(26,86,50,0.8)",
              }}
            >
              SURPLUS<span style={{ color: "var(--brand-green)" }}>LINK</span>
            </div>

            <button
              style={{
                padding: "20px 64px",
                backgroundColor: "var(--brand-green)",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: "0 0 40px rgba(26,86,50,0.6)",
                outline: "2px solid rgba(26,86,50,0.5)",
                outlineOffset: 8,
              }}
            >
              Enter Marketplace
            </button>
            
            <div style={{ color: "#666", letterSpacing: "0.2em", fontSize: 14 }}>
              surpluslink.com
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return { element, camera, cursor };
}
