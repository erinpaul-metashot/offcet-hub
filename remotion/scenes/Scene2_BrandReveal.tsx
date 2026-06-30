/**
 * Scene 2 — Brand Reveal
 * Cards collapse inward, massive SURPLUSLINK slams in with overshoot,
 * subtitle fades up, horizontal green line sweeps across.
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT } from "../utils/styles";
import { CinematicBackdrop, LightSweep, ScanBand } from "../components/Premium";

export const Scene2_BrandReveal: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase timing (120 frames total)
  // Phase 1: 0-20 — cards collapsing inward (continuation)
  // Phase 2: 20-50 — brand text slams in
  // Phase 3: 40-70 — subtitle appears
  // Phase 4: 50-80 — horizontal line sweeps
  // Phase 5: 80-120 — hold with subtle glow pulse

  // Brand text entrance (overshoot)
  const brandScale = interpolate(frame, [15, 45], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const brandOpacity = interpolate(frame, [15, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle entrance
  const subOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [40, 55], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // Letter spacing animation
  const subTracking = interpolate(frame, [40, 65], [1.5, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Horizontal line sweep
  const lineWidth = interpolate(frame, [45, 75], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const lineOpacity = interpolate(frame, [45, 50, 85, 95], [0, 0.8, 0.8, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ambient glow behind brand
  const glowScale = interpolate(frame, [20, 50], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Subtle floating effect
  const floatY = interpolate(
    frame,
    [50, 70, 90, 110, 120],
    [0, -3, 0, -2, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  // Impact flash on brand entrance
  const flashOpacity = interpolate(frame, [18, 22, 30], [0, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.display,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.88} />
      <LightSweep frame={frame} start={10} end={58} opacity={0.34} />
      <LightSweep frame={frame} start={38} end={106} opacity={0.26} color="rgba(26,86,50,0.88)" angle={12} />
      <ScanBand frame={frame} start={18} end={78} top="47%" height={140} opacity={0.5} />

      {/* Radial glow behind brand */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 900,
          height: 600,
          transform: `translate(-50%, -50%) scale(${glowScale})`,
          background: "radial-gradient(ellipse, rgba(26,86,50,0.28) 0%, transparent 62%)",
          pointerEvents: "none",
          filter: "blur(8px)",
        }}
      />

      {/* Impact flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.brandGreen,
          opacity: flashOpacity,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* Brand text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* Main brand */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 850,
            letterSpacing: "0.22em",
            color: COLORS.white,
            opacity: brandOpacity,
            transform: `scale(${brandScale})`,
            textShadow: `0 0 70px rgba(26,86,50,0.6), 0 0 140px rgba(255,255,255,0.1)`,
          }}
        >
          SURPLUS
          <span style={{ color: COLORS.brandGreen }}>LINK</span>
        </div>

        {/* Horizontal line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: 620,
            height: 1.5,
            background: `linear-gradient(90deg, transparent, ${COLORS.brandGreen}, transparent)`,
            opacity: lineOpacity,
            boxShadow: `0 0 22px rgba(26,86,50,${lineOpacity})`,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: "rgba(255,255,255,0.58)",
            letterSpacing: `${Math.min(subTracking, 0.24)}em`,
            textTransform: "uppercase",
            fontFamily: FONT.sans,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          The Intelligent B2B Marketplace
        </div>
      </div>

      {/* Corner accents */}
      {[
        { top: 40, left: 40 },
        { top: 40, right: 40 },
        { bottom: 40, left: 40 },
        { bottom: 40, right: 40 },
      ].map((pos, i) => {
        const cornerOpacity = interpolate(
          frame,
          [55 + i * 5, 65 + i * 5],
          [0, 0.3],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: 72,
              height: 72,
              borderTop: i < 2 ? `2px solid rgba(26,86,50,${cornerOpacity})` : "none",
              borderBottom: i >= 2 ? `2px solid rgba(26,86,50,${cornerOpacity})` : "none",
              borderLeft: i % 2 === 0 ? `2px solid rgba(26,86,50,${cornerOpacity})` : "none",
              borderRight: i % 2 === 1 ? `2px solid rgba(26,86,50,${cornerOpacity})` : "none",
              boxShadow: `0 0 24px rgba(26,86,50,${cornerOpacity * 0.8})`,
              opacity: cornerOpacity,
            } as React.CSSProperties}
          />
        );
      })}
    </AbsoluteFill>
  );
};
