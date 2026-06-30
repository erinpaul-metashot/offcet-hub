/**
 * Scene 7 — Buyer Response
 * Buyer's dashboard with notification slide-in, clicking "Interested".
 * Uses exact BUYER_1, BUYER_METRICS, BUYER_RECENT_ASSIGNMENTS data.
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT, metricCardStyle, statusBadgeStyle } from "../utils/styles";
import { ApprovalPill, CinematicBackdrop, DepthShadow, LightSweep, ScanBand, SectionKicker } from "../components/Premium";
import {
  BUYER_1,
  BUYER_METRICS,
  BUYER_RECENT_ASSIGNMENTS,
  BUYER_NAV,
  DEMO_LOT,
} from "../../components/demo/core/mock-data";

export const Scene7_BuyerResponse: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance
  const entranceOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const entranceScale = interpolate(frame, [0, 20], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Notification slide-in
  const notifX = interpolate(frame, [50, 65], [400, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const notifOpacity = interpolate(frame, [50, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Click "Interested" button
  const interestedClick = interpolate(frame, [100, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const statusChange = interpolate(frame, [113, 123], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Buyer metrics
  const buyerMetrics = [
    { label: "ASSIGNED LOTS", value: BUYER_METRICS.assignedLots },
    { label: "ACTIVE", value: BUYER_METRICS.active },
    { label: "INTERESTED", value: BUYER_METRICS.interested },
    { label: "EXPIRING SOON", value: BUYER_METRICS.expiringSoon },
  ];

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.sans,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.78} />
      <DepthShadow frame={frame} delay={0} width={1140} y={326} />
      <LightSweep frame={frame} start={22} end={88} opacity={0.2} />
      <ScanBand frame={frame} start={48} end={112} top="42%" height={130} opacity={0.4} />
      <SectionKicker frame={frame} delay={5}>Buyer Response</SectionKicker>

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 1200,
          height: 800,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(26,86,50,0.05) 0%, transparent 60%)",
          filter: "blur(18px)",
        }}
      />

      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 50,
          opacity: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ width: 32, height: 1, backgroundColor: COLORS.brandGreen }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", color: COLORS.brandGreen, textTransform: "uppercase" }}>
          BUYER PORTAL — {BUYER_1.name.toUpperCase()}
        </span>
      </div>

      {/* Dashboard */}
      <div
        style={{
          position: "absolute",
          top: 65,
          left: 40,
          right: 40,
          bottom: 30,
          opacity: entranceOpacity,
          transform: `perspective(1700px) rotateX(6deg) rotateY(-9deg) rotateZ(-1deg) scale(${entranceScale})`,
          transformStyle: "preserve-3d",
          filter: "drop-shadow(0 40px 110px rgba(0,0,0,0.56))",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            backgroundColor: COLORS.paper,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.72)",
            border: `1px solid ${COLORS.line}`,
          }}
        >
          {/* Sidebar */}
          <div style={{ borderRight: `1px solid ${COLORS.line}`, padding: "20px 0", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "0 16px", marginBottom: 24 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", color: COLORS.brandGreenLight, textTransform: "uppercase" }}>
                SurplusLink
              </span>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
              {BUYER_NAV.map((item, i) => (
                <div
                  key={item.label}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: i === 0 ? COLORS.brandGreenMuted : "transparent",
                    color: i === 0 ? COLORS.brandGreen : COLORS.inkMuted,
                  }}
                >
                  {item.label}
                </div>
              ))}
            </nav>
            <div style={{ marginTop: "auto", padding: 16, borderTop: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{BUYER_1.name}</div>
              <div style={{ fontSize: 10, color: COLORS.inkMuted }}>{BUYER_1.email}</div>
            </div>
          </div>

          {/* Main */}
          <div style={{ backgroundColor: COLORS.surface, padding: 24, overflow: "hidden", position: "relative" }}>
            {/* Hero */}
            <div
              style={{
                padding: 20,
                borderRadius: 8,
                border: `1px solid ${COLORS.line}`,
                background: "linear-gradient(135deg, rgba(26,86,50,0.08), rgba(26,86,50,0.02) 40%, white 100%)",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", color: COLORS.brandGreenLight, textTransform: "uppercase", marginBottom: 6 }}>
                BUYER DASHBOARD
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.04em", color: COLORS.ink }}>
                Welcome, {BUYER_1.name.split(" ")[0]}
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 4 }}>
                {BUYER_1.business} • Manage your assigned surplus lots
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {buyerMetrics.map((m, i) => {
                const mOpacity = interpolate(frame, [15 + i * 6, 25 + i * 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const countProgress = interpolate(frame, [20 + i * 6, 45 + i * 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                // Bump interested count after clicking
                const adjustedValue = m.label === "INTERESTED" && statusChange > 0
                  ? m.value + 1
                  : m.value;

                return (
                  <div
                    key={m.label}
                    style={{
                      ...metricCardStyle,
                      borderRadius: 8,
                      opacity: mOpacity,
                    }}
                  >
                    <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: COLORS.inkMuted }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.04em", color: COLORS.ink }}>
                      {Math.round(adjustedValue * countProgress)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Recent Assignments */}
            <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, backgroundColor: COLORS.paper, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.line}`, backgroundColor: "rgba(248,248,247,0.8)" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Recent Assignments</span>
              </div>
              {BUYER_RECENT_ASSIGNMENTS.map((item, i) => {
                const lotOpacity = interpolate(frame, [30 + i * 8, 40 + i * 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const isFirst = i === 0;
                const currentStatus = (isFirst && statusChange > 0 ? "interested" : item.status) as string;

                return (
                  <div
                    key={item.key}
                    style={{
                      padding: "14px 16px",
                      borderBottom: i < BUYER_RECENT_ASSIGNMENTS.length - 1 ? `1px solid ${COLORS.line}` : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      opacity: lotOpacity,
                      backgroundColor: isFirst && interestedClick > 0 ? "rgba(26,86,50,0.02)" : "transparent",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{item.title}</div>
                      <div style={{ fontSize: 10, color: COLORS.inkMuted, marginTop: 2 }}>{item.subtitle}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>${item.amount?.toLocaleString()}</span>
                      <span
                        style={{
                          ...statusBadgeStyle(currentStatus as "assigned" | "interested"),
                          transform: isFirst && statusChange > 0 ? `scale(${interpolate(statusChange, [0, 1], [0.8, 1])})` : undefined,
                        }}
                      >
                        {currentStatus === "interested" ? "INTERESTED" : currentStatus === "assigned" ? "ASSIGNED" : currentStatus.toUpperCase().replace("_", " ")}
                      </span>
                      {/* Interested button for first item */}
                      {isFirst && statusChange === 0 && (
                        <div
                          style={{
                            padding: "6px 14px",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            backgroundColor: interestedClick > 0 ? COLORS.brandGreenLight : COLORS.brandGreen,
                            color: COLORS.paper,
                            cursor: "pointer",
                            transform: interestedClick > 0 ? `scale(${interpolate(interestedClick, [0, 0.5, 1], [1, 0.95, 1])})` : undefined,
                          }}
                        >
                          INTERESTED
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification toast */}
            {notifOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 360,
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: COLORS.paper,
                  border: `1px solid ${COLORS.brandGreen}`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(26,86,50,0.1)",
                  opacity: notifOpacity,
                  transform: `translateX(${notifX}px)`,
                  zIndex: 20,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: COLORS.brandGreenMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={COLORS.brandGreen} strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke={COLORS.brandGreen} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>
                      New Lot Assigned
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkMuted, marginTop: 3, lineHeight: 1.4 }}>
                      &quot;{DEMO_LOT.title}&quot; has been assigned to you. Review and respond.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cursor for "Interested" click */}
      {frame >= 85 && frame <= 115 && (
        <div
          style={{
            position: "absolute",
            left: interpolate(frame, [85, 100], [800, 1350], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            top: interpolate(frame, [85, 100], [400, 445], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            zIndex: 999,
          }}
        >
          <svg width="18" height="24" viewBox="0 0 24 32" fill="none">
            <path d="M2 2L2 26L8 20L14 30L18 28L12 18L20 18L2 2Z" fill="#050505" stroke={COLORS.brandGreen} strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {statusChange > 0 && (
        <ApprovalPill
          frame={frame}
          start={112}
          text="Interest recorded"
          subtext="Admin and supplier notified"
        />
      )}
    </AbsoluteFill>
  );
};
