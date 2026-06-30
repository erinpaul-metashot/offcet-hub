/**
 * Scene 5 — Admin Dashboard
 * Camera sweeps to reveal the admin panel with metrics, charts, and pending lots.
 * Uses exact ADMIN data, DashboardMetricCard styling, bar charts.
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT, metricCardStyle, statusBadgeStyle } from "../utils/styles";
import { CinematicBackdrop, DepthShadow, LightSweep, ScanBand, SectionKicker } from "../components/Premium";
import {
  ADMIN,
  ADMIN_METRICS,
  ADMIN_TREND_DATA,
  ADMIN_STATUS_CHART,
  ADMIN_PENDING_LOTS,
  ADMIN_NAV,
} from "../../components/demo/core/mock-data";

export const Scene5_AdminDashboard: React.FC = () => {
  const frame = useCurrentFrame();

  // Overall entrance
  const entranceScale = interpolate(frame, [0, 25], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const entranceOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Metric cards stagger
  const metrics = [
    { label: "TOTAL USERS", value: ADMIN_METRICS.totalUsers, suffix: "", accent: false },
    { label: "LIVE LOTS", value: ADMIN_METRICS.liveLots, suffix: "", accent: true },
    { label: "ASSIGNMENTS", value: ADMIN_METRICS.assignments, suffix: "", accent: false },
    { label: "INTERESTED", value: ADMIN_METRICS.interested, suffix: "", accent: false },
  ];

  // Approval action
  const approveClick = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const approveSuccess = interpolate(frame, [148, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.sans,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.8} />
      <DepthShadow frame={frame} delay={0} width={1180} y={330} />
      <LightSweep frame={frame} start={18} end={92} opacity={0.22} />
      <ScanBand frame={frame} start={118} end={170} top="47%" height={145} opacity={0.42} />
      <SectionKicker frame={frame} delay={5}>Admin Control Room</SectionKicker>

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 1400,
          height: 800,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(26,86,50,0.06) 0%, transparent 60%)",
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
          ADMIN DASHBOARD — {ADMIN.name.toUpperCase()}
        </span>
      </div>

      {/* Dashboard container */}
      <div
        style={{
          position: "absolute",
          top: 65,
          left: 40,
          right: 40,
          bottom: 30,
          opacity: entranceOpacity,
          transform: `perspective(1700px) rotateX(6deg) rotateY(9deg) rotateZ(1.1deg) scale(${entranceScale})`,
          transformStyle: "preserve-3d",
          filter: "drop-shadow(0 40px 110px rgba(0,0,0,0.56))",
        }}
      >
        {/* Dashboard shell */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: 0,
            backgroundColor: COLORS.paper,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.72)",
            border: `1px solid ${COLORS.line}`,
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              borderRight: `1px solid ${COLORS.line}`,
              backgroundColor: COLORS.paper,
              display: "flex",
              flexDirection: "column",
              padding: "20px 0",
            }}
          >
            <div style={{ padding: "0 16px", marginBottom: 24 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", color: COLORS.brandGreenLight, textTransform: "uppercase" }}>
                SurplusLink
              </span>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
              {ADMIN_NAV.map((item, i) => {
                const isActive = i === 0;
                const navOpacity = interpolate(frame, [10 + i * 5, 20 + i * 5], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: isActive ? COLORS.brandGreenMuted : "transparent",
                      color: isActive ? COLORS.brandGreen : COLORS.inkMuted,
                      opacity: navOpacity,
                    }}
                  >
                    {item.label}
                  </div>
                );
              })}
            </nav>
            <div style={{ marginTop: "auto", padding: "16px", borderTop: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{ADMIN.name}</div>
              <div style={{ fontSize: 10, color: COLORS.inkMuted }}>{ADMIN.email}</div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ backgroundColor: COLORS.surface, padding: 24, overflow: "hidden" }}>
            {/* Hero banner */}
            <div
              style={{
                padding: 20,
                borderRadius: 8,
                border: `1px solid ${COLORS.line}`,
                background: `linear-gradient(135deg, rgba(26,86,50,0.08), rgba(26,86,50,0.02) 40%, white 100%)`,
                marginBottom: 20,
                opacity: interpolate(frame, [12, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", color: COLORS.brandGreenLight, textTransform: "uppercase", marginBottom: 6 }}>
                ADMIN CONTROL PANEL
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.04em", color: COLORS.ink }}>
                Platform Overview
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 4 }}>
                Manage users, review lots, and track marketplace activity.
              </div>
            </div>

            {/* Metrics row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {metrics.map((m, i) => {
                const mOpacity = interpolate(frame, [20 + i * 8, 32 + i * 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const mScale = interpolate(frame, [20 + i * 8, 32 + i * 8], [0.9, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                });
                const countProgress = interpolate(frame, [25 + i * 8, 55 + i * 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const displayVal = Math.round(m.value * countProgress);

                return (
                  <div
                    key={m.label}
                    style={{
                      ...metricCardStyle,
                      borderRadius: 8,
                      opacity: mOpacity,
                      transform: `scale(${mScale})`,
                      borderColor: m.accent ? `rgba(26,86,50,0.25)` : COLORS.line,
                      backgroundColor: m.accent ? `rgba(232,244,237,0.4)` : COLORS.paper,
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: COLORS.inkMuted }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", color: COLORS.ink }}>
                      {displayVal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {/* Trend columns */}
              <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 16, backgroundColor: COLORS.paper }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Lots Created</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${ADMIN_TREND_DATA.length}, 1fr)`, gap: 6 }}>
                  {ADMIN_TREND_DATA.map((d, i) => {
                    const maxVal = Math.max(...ADMIN_TREND_DATA.map(x => x.value));
                    const barHeight = (d.value / maxVal) * 100;
                    const barProgress = interpolate(frame, [40 + i * 8, 60 + i * 8], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    });
                    return (
                      <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ height: 80, width: "100%", display: "flex", alignItems: "flex-end", borderRadius: 6, border: `1px solid ${COLORS.line}`, backgroundColor: "rgba(26,86,50,0.04)", padding: 3 }}>
                          <div style={{ width: "100%", height: `${barHeight * barProgress}%`, borderRadius: 4, background: `linear-gradient(180deg, ${COLORS.brandGreenLight}, ${COLORS.brandGreen})` }} />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 600, color: COLORS.ink }}>{d.value}</span>
                        <span style={{ fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.inkMuted }}>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status bars */}
              <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 16, backgroundColor: COLORS.paper }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Lot Status</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ADMIN_STATUS_CHART.map((s, i) => {
                    const maxVal = Math.max(...ADMIN_STATUS_CHART.map(x => x.value));
                    const w = Math.max((s.value / maxVal) * 100, 12);
                    const barProgress = interpolate(frame, [50 + i * 8, 70 + i * 8], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    });
                    return (
                      <div key={s.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ fontWeight: 500, color: COLORS.ink }}>{s.label}</span>
                          <span style={{ color: COLORS.inkMuted }}>{s.value}</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 4, backgroundColor: COLORS.muted, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${w * barProgress}%`, borderRadius: 4, backgroundColor: s.tone === "accent" ? COLORS.brandGreen : COLORS.lineStrong }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pending lots */}
            <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, backgroundColor: COLORS.paper, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.line}`, backgroundColor: "rgba(248,248,247,0.8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Pending Review</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", color: COLORS.brandGreen, textTransform: "uppercase" }}>
                  {ADMIN_PENDING_LOTS.length} LOTS
                </span>
              </div>
              {ADMIN_PENDING_LOTS.map((lot, i) => {
                const lotOpacity = interpolate(frame, [70 + i * 10, 82 + i * 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const isFirst = i === 0;
                const showApproved = isFirst && approveSuccess > 0;
                return (
                  <div
                    key={lot.key}
                    style={{
                      padding: "12px 16px",
                      borderBottom: i < ADMIN_PENDING_LOTS.length - 1 ? `1px solid ${COLORS.line}` : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      opacity: lotOpacity,
                      backgroundColor: isFirst && approveClick > 0 && !showApproved ? "rgba(26,86,50,0.03)" : "transparent",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{lot.title}</div>
                      <div style={{ fontSize: 10, color: COLORS.inkMuted, marginTop: 2 }}>{lot.subtitle}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.ink }}>
                        ${lot.amount?.toLocaleString()}
                      </span>
                      <span style={statusBadgeStyle(showApproved ? "approved" : "pending_review")}>
                        {showApproved ? "APPROVED" : "PENDING REVIEW"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Approval cursor */}
      {frame >= 120 && frame <= 150 && (
        <div
          style={{
            position: "absolute",
            left: interpolate(frame, [120, 135], [900, 1100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            top: interpolate(frame, [120, 135], [500, 555], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            zIndex: 999,
          }}
        >
          <svg width="18" height="24" viewBox="0 0 24 32" fill="none">
            <path d="M2 2L2 26L8 20L14 30L18 28L12 18L20 18L2 2Z" fill="#050505" stroke={COLORS.brandGreen} strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
