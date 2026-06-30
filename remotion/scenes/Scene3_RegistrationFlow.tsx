/**
 * Scene 3 — Registration Flow
 * 3D-perspective registration form with typewriter effect.
 * Uses exact SUPPLIER mock data and project's UI styling.
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT, glassPanelLight, fieldInputStyle, fieldLabelStyle, primaryButton } from "../utils/styles";
import { SUPPLIER } from "../../components/demo/core/mock-data";
import { CinematicBackdrop, DepthShadow, LightSweep, ScanBand, SectionKicker } from "../components/Premium";

const FIELDS = [
  { label: "FULL NAME", value: SUPPLIER.name, start: 15, end: 40 },
  { label: "COMPANY", value: SUPPLIER.company, start: 35, end: 55 },
  { label: "EMAIL", value: SUPPLIER.email, start: 50, end: 75 },
  { label: "PHONE", value: SUPPLIER.phone, start: 65, end: 85 },
  { label: "TAX ID", value: SUPPLIER.taxId, start: 78, end: 100 },
  { label: "PASSWORD", value: SUPPLIER.password, start: 92, end: 115 },
];

export const Scene3_RegistrationFlow: React.FC = () => {
  const frame = useCurrentFrame();

  // Panel entrance — flies in from right with 3D perspective
  const panelRotateY = interpolate(frame, [0, 30], [-12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const panelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelX = interpolate(frame, [0, 30], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Title
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [5, 20], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Role badge
  const roleOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Submit animation
  const submitProgress = interpolate(frame, [125, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const submitPulse = interpolate(frame, [140, 155], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Success indicator
  const successOpacity = interpolate(frame, [148, 158], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const successScale = interpolate(frame, [148, 158], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Cursor position
  const cursorField = Math.floor(interpolate(frame, [15, 120], [0, 5.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.sans,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.82} />
      <DepthShadow frame={frame} delay={0} width={760} y={270} />
      <LightSweep frame={frame} start={10} end={72} opacity={0.22} />
      <ScanBand frame={frame} start={40} end={110} top="44%" height={120} opacity={0.38} />
      <SectionKicker frame={frame} delay={4}>Supplier Onboarding</SectionKicker>

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "55%",
          width: 1000,
          height: 800,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(26,86,50,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
          filter: "blur(14px)",
        }}
      />

      {/* Left side — branding text */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: "50%",
          transform: `translateY(-50%)`,
          width: 420,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.35em",
            color: COLORS.brandGreen,
            textTransform: "uppercase",
            marginBottom: 16,
            transform: `translateY(${titleY}px)`,
          }}
        >
          JOIN THE MARKETPLACE
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.white,
            fontFamily: FONT.display,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            marginBottom: 20,
          }}
        >
          Register as a<br />
          <span style={{ color: COLORS.brandGreen }}>Supplier</span>
        </div>
        <div
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
          }}
        >
          Start listing your surplus inventory to thousands of verified buyers worldwide.
        </div>

        {/* Role selector */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 8,
            opacity: roleOpacity,
          }}
        >
          {["Supplier", "Buyer / Shop", "Agent"].map((role, i) => (
            <div
              key={role}
              style={{
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                border: i === 0 ? `1.5px solid ${COLORS.brandGreen}` : "1px solid rgba(255,255,255,0.1)",
                color: i === 0 ? COLORS.brandGreen : "rgba(255,255,255,0.3)",
                backgroundColor: i === 0 ? "rgba(26,86,50,0.15)" : "transparent",
                borderRadius: 4,
              }}
            >
              {role}
            </div>
          ))}
        </div>
      </div>

      {/* Right side — Registration Form */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: "50%",
          transform: `translateY(-50%) perspective(1500px) rotateX(4deg) rotateY(${panelRotateY - 8}deg) rotateZ(-1.5deg) translateX(${panelX}px)`,
          opacity: panelOpacity,
          width: 480,
          filter: `drop-shadow(0 34px 90px rgba(0,0,0,0.5))`,
        }}
      >
        <div
          style={{
            ...glassPanelLight,
            padding: 36,
            backgroundColor: COLORS.paper,
            borderRadius: 20,
            boxShadow: "0 28px 90px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          {/* Form header */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.3em",
                color: COLORS.brandGreen,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              SURPLUSLINK
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: COLORS.ink,
                letterSpacing: "-0.03em",
              }}
            >
              Create your account
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FIELDS.map((field, i) => {
              const charCount = interpolate(
                frame,
                [field.start, field.end],
                [0, field.value.length],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              const visibleText = field.value.substring(0, Math.floor(charCount));
              const isActive = cursorField === i && frame >= field.start && frame <= field.end;

              return (
                <div key={field.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={fieldLabelStyle}>{field.label}</span>
                  <div
                    style={{
                      ...fieldInputStyle,
                      borderColor: isActive ? COLORS.ink : COLORS.line,
                      boxShadow: isActive ? `0 0 0 2px rgba(26,86,50,0.1)` : "none",
                      minHeight: 38,
                      fontSize: field.label === "PASSWORD" ? 16 : 13,
                      letterSpacing: field.label === "PASSWORD" ? "0.15em" : "normal",
                    }}
                  >
                    {visibleText}
                    {isActive && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 1.5,
                          height: 16,
                          backgroundColor: COLORS.ink,
                          marginLeft: 1,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Submit button */}
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  ...primaryButton,
                  width: "100%",
                  minHeight: 44,
                  position: "relative",
                  overflow: "hidden",
                  transform: submitProgress > 0 ? `scale(${interpolate(submitProgress, [0, 0.3, 1], [1, 0.97, 1])})` : undefined,
                }}
              >
                {submitPulse > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 60%)`,
                      opacity: 1 - submitPulse,
                      transform: `scale(${1 + submitPulse})`,
                    }}
                  />
                )}
                {frame < 148 ? "CREATE ACCOUNT" : "✓ ACCOUNT CREATED"}
              </div>
            </div>
          </div>

          {/* Success checkmark */}
          {successOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: COLORS.brandGreen,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: successOpacity,
                transform: `scale(${successScale})`,
                boxShadow: `0 4px 20px rgba(26,86,50,0.4)`,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Animated cursor */}
      {frame >= 15 && frame <= 130 && (
        <div
          style={{
            position: "absolute",
            left: interpolate(frame, [15, 120], [720, 750], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            top: interpolate(
              frame,
              [15, 35, 55, 75, 85, 100, 120],
              [360, 400, 440, 480, 520, 560, 600],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            ),
            zIndex: 999,
            pointerEvents: "none",
          }}
        >
          <svg width="20" height="26" viewBox="0 0 24 32" fill="none">
            <path
              d="M2 2L2 26L8 20L14 30L18 28L12 18L20 18L2 2Z"
              fill="#050505"
              stroke={COLORS.brandGreen}
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
