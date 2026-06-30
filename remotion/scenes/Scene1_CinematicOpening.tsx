/**
 * Scene 1 — Cinematic Opening
 * Three floating glass-morphism stat cards materialize from the void
 * with 3D CSS perspective transforms and ambient green particles.
 */

import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT, glassPanel } from "../utils/styles";
import { generateParticles } from "../utils/animations";
import { CinematicBackdrop, LightSweep, ScanBand, SectionKicker, softFloat } from "../components/Premium";

const STATS = [
  { value: "12k", unit: "TONS", label: "Landfill Diverted", delay: 0 },
  { value: "$2.4M", unit: "", label: "Value Recovered", delay: 6 },
  { value: "147", unit: "", label: "Active Businesses", delay: 12 },
];

export const Scene1_CinematicOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = useMemo(() => generateParticles(60, 42), []);

  // Ambient glow pulse
  const glowIntensity = interpolate(
    frame,
    [0, 30, 60, 90, 120],
    [0, 0.4, 0.6, 0.8, 1],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.sans,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.7 + glowIntensity * 0.22} />
      <LightSweep frame={frame} start={18} end={74} opacity={0.26} color="rgba(255,255,255,0.72)" />
      <LightSweep frame={frame} start={46} end={112} opacity={0.3} color="rgba(26,86,50,0.78)" angle={9} />
      <ScanBand frame={frame} start={28} end={90} top="38%" height={150} opacity={0.4} />
      <SectionKicker frame={frame} delay={16}>Marketplace Intelligence</SectionKicker>

      {/* Floating particles */}
      {particles.map((p) => {
        const pStart = p.delay * fps;
        const pOpacity = interpolate(frame, [pStart, pStart + 15], [0, 0.5], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const pY = interpolate(
          frame,
          [0, 120],
          [p.y, p.y - 20 * p.speed],
          { extrapolateRight: "clamp" },
        );
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${pY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: COLORS.brandGreen,
              opacity: pOpacity * 0.4,
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px rgba(26,86,50,0.4)`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Three stat cards floating in 3D */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          perspective: 1600,
        }}
      >
        {STATS.map((stat, i) => {
          const cardStart = stat.delay;
          // Card entrance
          const cardScale = interpolate(
            frame,
            [cardStart, cardStart + 25],
            [0.7, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            },
          );
          const cardOpacity = interpolate(
            frame,
            [cardStart, cardStart + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const cardRotateY = interpolate(
            frame,
            [cardStart, cardStart + 30],
            [i === 0 ? -25 : i === 2 ? 25 : 0, i === 0 ? -5 : i === 2 ? 5 : 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          );
          const cardRotateX = interpolate(
            frame,
            [cardStart, cardStart + 30],
            [12, 2],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          );
          const cardTranslateY = interpolate(
            frame,
            [cardStart, cardStart + 30],
            [50, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          );

          // Floating hover effect
          const floatY = softFloat(frame, i === 1 ? 7 : 5, 0.045, i * 1.4);
          const depthOffset = i === 1 ? -34 : 34;
          const sideOffset = i === 0 ? 28 : i === 2 ? -28 : 0;

          // Counter animation
          const counterProgress = interpolate(
            frame,
            [cardStart + 15, cardStart + 50],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const numericValue = stat.value.replace(/[^0-9.]/g, "");
          const prefix = stat.value.startsWith("$") ? "$" : "";
          const suffix = stat.value.includes("k") ? "k" : stat.value.includes("M") ? "M" : "";
          const targetNum = parseFloat(numericValue);
          const currentNum = targetNum * counterProgress;
          const displayValue =
            suffix === "M"
              ? `${prefix}${currentNum.toFixed(1)}${suffix}`
              : suffix === "k"
                ? `${prefix}${Math.round(currentNum)}${suffix}`
                : `${prefix}${Math.round(currentNum)}`;

          // Edge glow
          const edgeGlow = interpolate(
            frame,
            [cardStart + 20, cardStart + 40],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <div
              key={i}
              style={{
                ...glassPanel,
                width: i === 1 ? 340 : 300,
                padding: i === 1 ? "44px 38px" : "36px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "center",
                textAlign: "center",
                opacity: cardOpacity,
                transform: `perspective(1600px) translateX(${sideOffset}px) translateZ(${depthOffset}px) rotateY(${cardRotateY}deg) rotateX(${cardRotateX}deg) scale(${cardScale}) translateY(${cardTranslateY + floatY}px)`,
                boxShadow: `0 30px 90px rgba(0,0,0,0.58), 0 0 ${44 * edgeGlow}px rgba(26,86,50,${0.28 * edgeGlow}), inset 0 1px 0 rgba(255,255,255,0.16)`,
                transformStyle: "preserve-3d",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.035))",
                borderRadius: 22,
              }}
            >
              {/* Green accent line at top */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "20%",
                  right: "20%",
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${COLORS.brandGreen}, transparent)`,
                  opacity: edgeGlow,
                }}
              />
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: COLORS.white,
                  fontFamily: FONT.display,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {displayValue}
              </div>
              {stat.unit && (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.brandGreen,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.unit}
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [60, 80], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(frame, [60, 80], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}px)`,
        }}
      >
        <div
          style={{
          fontSize: 14,
          fontWeight: 500,
          color: "rgba(255,255,255,0.46)",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          fontFamily: FONT.sans,
        }}
        >
          Transforming Industrial Surplus Into Opportunity
        </div>
      </div>
    </AbsoluteFill>
  );
};
