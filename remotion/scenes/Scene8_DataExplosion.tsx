/**
 * Scene 8 — Data Explosion & CTA
 * Particle explosion forms upward trend graph.
 * Massive impact metrics stamp in.
 * Collapses into portal CTA with concentric rings.
 */

import React, { useMemo } from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT } from "../utils/styles";
import { generateParticles } from "../utils/animations";
import { BrandLockup, CinematicBackdrop, LightSweep, ScanBand } from "../components/Premium";

export const Scene8_DataExplosion: React.FC = () => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => generateParticles(100, 77), []);

  // Phase timing (180 frames)
  // 0-60: Particles scatter & gather into graph shape
  // 40-80: Graph line draws
  // 60-100: Metric 1 stamps in
  // 80-110: Metric 2 stamps in
  // 110-130: Everything collapses
  // 130-180: CTA portal expands

  // Particle phase
  const particleGather = interpolate(frame, [5, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Graph draw
  const graphLength = 1400;
  const graphProgress = interpolate(frame, [35, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const strokeDashoffset = graphLength * (1 - graphProgress);
  const graphFillOpacity = interpolate(frame, [50, 80], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Metric 1: 12k TONS
  const m1Scale = interpolate(frame, [60, 72], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const m1Opacity = interpolate(frame, [60, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const m1Counter = interpolate(frame, [65, 90], [0, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Metric 2: $2.4M
  const m2Scale = interpolate(frame, [80, 92], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const m2Opacity = interpolate(frame, [80, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const m2Counter = interpolate(frame, [85, 105], [0, 2.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Impact flash on metric 1
  const flash1 = interpolate(frame, [62, 66, 72], [0, 0.15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Impact flash on metric 2
  const flash2 = interpolate(frame, [82, 86, 92], [0, 0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Collapse
  const collapseScale = interpolate(frame, [110, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const collapseOpacity = interpolate(frame, [110, 125], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA portal
  const ctaOpacity = interpolate(frame, [128, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = interpolate(frame, [128, 145], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Brand text in CTA
  const brandOpacity = interpolate(frame, [138, 148], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brandScale = interpolate(frame, [138, 150], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Button entrance
  const btnOpacity = interpolate(frame, [148, 158], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btnY = interpolate(frame, [148, 158], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Ring pulse (frame-driven oscillation)
  const ringPulse1 = Math.sin((frame - 140) * 0.08) * 0.05 + 1;
  const ringPulse2 = Math.sin((frame - 140) * 0.06 + 1) * 0.04 + 1;
  const ringPulse3 = Math.sin((frame - 140) * 0.04 + 2) * 0.03 + 1;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.sans,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.92} />
      <LightSweep frame={frame} start={36} end={96} opacity={0.24} />
      <LightSweep frame={frame} start={116} end={166} opacity={0.34} color="rgba(26,86,50,0.86)" angle={11} />
      <ScanBand frame={frame} start={126} end={166} top="47%" height={150} opacity={0.5} />

      {/* Impact flashes */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: COLORS.brandGreen, opacity: flash1 + flash2, mixBlendMode: "screen", pointerEvents: "none" }} />

      {/* Data explosion + Graph (collapses) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${collapseScale})`,
          opacity: collapseOpacity,
          transformOrigin: "center center",
        }}
      >
        {/* Particles */}
        {particles.map((p) => {
          // Start position = random scatter
          // End position = along graph curve
          const graphX = p.id; // 0-99 maps to 0-100% width
          const graphY = 85 - (p.id * 0.55 + (p.y * 0.08)); // upward trend

          const currentX = interpolate(particleGather, [0, 1], [p.x, graphX]);
          const currentY = interpolate(particleGather, [0, 1], [p.y, graphY]);
          const pOpacity = interpolate(frame, [p.delay * 10, p.delay * 10 + 10], [0, 0.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

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
                backgroundColor: COLORS.brandGreen,
                opacity: pOpacity,
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(26,86,50,0.5)`,
              }}
            />
          );
        })}

        {/* Graph SVG */}
        {graphProgress > 0 && (
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
            <defs>
              <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(26,86,50,0.4)" />
                <stop offset="100%" stopColor="rgba(26,86,50,0)" />
              </linearGradient>
            </defs>
            <path
              d="M 0 400 Q 200 350 400 250 T 800 100 T 1000 50 L 1000 400 Z"
              fill="url(#gfill)"
              opacity={graphFillOpacity}
            />
            <path
              d="M 0 400 Q 200 350 400 250 T 800 100 T 1000 50"
              fill="none"
              stroke={COLORS.brandGreen}
              strokeWidth="3"
              strokeDasharray={graphLength}
              strokeDashoffset={strokeDashoffset}
              style={{ filter: "drop-shadow(0 0 12px rgba(26,86,50,1))" }}
            />
          </svg>
        )}

        {/* Metric 1: 12k TONS */}
        <div
          style={{
            position: "absolute",
            top: "14%",
            left: "8%",
            transform: `scale(${m1Scale})`,
            opacity: m1Opacity,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: COLORS.white,
              fontFamily: FONT.display,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textShadow: "0 0 60px rgba(26,86,50,0.4)",
            }}
          >
            {Math.round(m1Counter)}k TONS
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.brandGreen,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            Landfill Diverted
          </div>
        </div>

        {/* Metric 2: $2.4M */}
        <div
          style={{
            position: "absolute",
            top: "42%",
            right: "8%",
            textAlign: "right",
            transform: `scale(${m2Scale})`,
            opacity: m2Opacity,
            transformOrigin: "right center",
          }}
        >
          <div
            style={{
              fontSize: 100,
              fontWeight: 900,
              color: COLORS.white,
              fontFamily: FONT.display,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textShadow: "0 0 60px rgba(26,86,50,0.4)",
            }}
          >
            ${m2Counter.toFixed(1)}M
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.brandGreen,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            Value Recovered
          </div>
        </div>
      </div>

      {/* CTA Portal */}
      {ctaOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: ctaOpacity,
          }}
        >
          {/* Concentric rings */}
          {[
            { size: 300, pulse: ringPulse1, opacity: 0.4 },
            { size: 550, pulse: ringPulse2, opacity: 0.2 },
            { size: 800, pulse: ringPulse3, opacity: 0.1 },
          ].map((ring, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: ring.size,
                height: ring.size,
                borderRadius: "50%",
                border: `1px solid rgba(26,86,50,${ring.opacity})`,
                transform: `scale(${ctaScale * ring.pulse})`,
              }}
            />
          ))}

          {/* Central content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
              zIndex: 10,
            }}
          >
            <div style={{ opacity: brandOpacity, transform: `scale(${brandScale})` }}>
              <BrandLockup frame={frame} start={138} size={46} subtitle="Trusted surplus introductions" />
            </div>

            {/* CTA Button */}
            <div
              style={{
                padding: "18px 62px",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.14), rgba(26,86,50,0.82) 48%, rgba(255,255,255,0.18))",
                color: COLORS.paper,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.34)",
                boxShadow: "0 0 48px rgba(26,86,50,0.5), 0 24px 90px rgba(0,0,0,0.45), inset 0 0 34px rgba(255,255,255,0.16)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                opacity: btnOpacity,
                transform: `translateY(${btnY}px)`,
              }}
            >
              Marketplace ready
            </div>

            {/* URL */}
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.2em",
                opacity: btnOpacity,
              }}
            >
              surpluslink.com
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
