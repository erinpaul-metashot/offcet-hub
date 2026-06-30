/**
 * remotion/utils/styles.ts
 * Shared inline styles matching SurplusLink's design system,
 * extended with 3D/glass morphism effects for the demo video.
 */

import type { CSSProperties } from "react";

/* ── Brand Colors (matching globals.css) ── */
export const COLORS = {
  ink: "#050505",
  inkMuted: "#666666",
  paper: "#ffffff",
  surface: "#f8f8f7",
  muted: "#f2f2f2",
  line: "#e5e5e5",
  lineStrong: "#c8c8c8",
  brandGreen: "#1a5632",
  brandGreenLight: "#2d7a4a",
  brandGreenMuted: "#e8f4ed",
  black: "#050505",
  white: "#ffffff",
} as const;

/* ── Typography ── */
export const FONT = {
  sans: "'Plus Jakarta Sans', system-ui, sans-serif",
  display: "'Outfit', system-ui, sans-serif",
  mono: "'Consolas', 'SFMono-Regular', monospace",
} as const;

/* ── Glass Morphism Panel ── */
export const glassPanel: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 16,
};

export const glassPanelLight: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset",
};

/* ── Dark cinematic background ── */
export const cinematicBg: CSSProperties = {
  width: "100%",
  height: "100%",
  backgroundColor: "#050505",
  position: "relative",
  overflow: "hidden",
  fontFamily: FONT.sans,
};

/* ── Gradient overlays ── */
export const radialGreenGlow: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "radial-gradient(ellipse at center, rgba(26,86,50,0.15) 0%, transparent 70%)",
  pointerEvents: "none",
};

export const subtleGrid: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "60px 60px",
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
  pointerEvents: "none",
};

/* ── App Shell (sidebar + content area) ── */
export const appShellSidebar: CSSProperties = {
  width: 240,
  minWidth: 240,
  borderRight: `1px solid ${COLORS.line}`,
  backgroundColor: COLORS.paper,
  display: "flex",
  flexDirection: "column",
  fontFamily: FONT.sans,
};

export const appShellContent: CSSProperties = {
  flex: 1,
  backgroundColor: COLORS.surface,
  overflow: "hidden",
  fontFamily: FONT.sans,
};

/* ── Metric Card ── */
export const metricCardStyle: CSSProperties = {
  border: `1px solid ${COLORS.line}`,
  backgroundColor: COLORS.paper,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

/* ── Form field base ── */
export const fieldInputStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${COLORS.line}`,
  backgroundColor: COLORS.surface,
  color: COLORS.ink,
  padding: "10px 14px",
  fontSize: 13,
  lineHeight: 1.4,
  outline: "none",
  borderRadius: 0,
  fontFamily: FONT.sans,
};

/* ── Label ── */
export const fieldLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: COLORS.inkMuted,
};

/* ── Primary Button ── */
export const primaryButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "0 20px",
  minHeight: 40,
  backgroundColor: COLORS.brandGreen,
  color: COLORS.paper,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  border: `1px solid ${COLORS.brandGreen}`,
  cursor: "pointer",
  fontFamily: FONT.sans,
};

/* ── Ghost Button ── */
export const ghostButton: CSSProperties = {
  ...primaryButton,
  backgroundColor: "transparent",
  color: COLORS.ink,
  border: `1px solid ${COLORS.line}`,
};

/* ── Status Badge ── */
export function statusBadgeStyle(
  variant: "pending_review" | "approved" | "assigned" | "interested" | "draft",
): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
  switch (variant) {
    case "pending_review":
      return { ...base, border: "1px dashed #c8c8c8", color: COLORS.inkMuted };
    case "approved":
      return { ...base, border: `1px solid ${COLORS.brandGreen}`, color: COLORS.brandGreen };
    case "assigned":
      return { ...base, backgroundColor: COLORS.brandGreen, color: COLORS.paper, border: `1px solid ${COLORS.brandGreen}` };
    case "interested":
      return { ...base, border: `1px solid ${COLORS.ink}`, backgroundColor: COLORS.muted, color: COLORS.ink };
    case "draft":
      return { ...base, border: `1px solid ${COLORS.line}`, color: COLORS.inkMuted };
    default:
      return { ...base, border: `1px solid ${COLORS.line}`, color: COLORS.inkMuted };
  }
}

/* ── Horizontal Bar ── */
export function barFillStyle(
  widthPercent: number,
  accent: boolean = false,
): CSSProperties {
  return {
    height: 8,
    borderRadius: 4,
    backgroundColor: accent ? COLORS.brandGreen : COLORS.lineStrong,
    width: `${widthPercent}%`,
    transition: "none", // no CSS transitions in Remotion
  };
}

/* ── Network node ── */
export function networkNodeStyle(
  isMatch: boolean,
): CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 12,
    border: `1.5px solid ${isMatch ? COLORS.brandGreen : "rgba(255,255,255,0.1)"}`,
    backgroundColor: isMatch ? "rgba(26,86,50,0.15)" : "rgba(255,255,255,0.04)",
    color: isMatch ? COLORS.white : "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: FONT.sans,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    minWidth: 160,
  };
}
