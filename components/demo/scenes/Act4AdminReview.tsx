"use client";

import type { SceneOutput } from "@/components/demo/core/types";
import { cursorScreenKeyframes, rangeProgress, lerp, easeOutCubic } from "@/components/demo/core/utils";
import { Button, Panel, StatusBadge } from "@/components/demo/ui";
import { DashboardHero, DashboardMetricCard, DashboardSection, HorizontalBarChart, TrendColumns, DashboardList } from "@/components/demo/dashboard-widgets";
import { RippleEffect } from "@/components/demo/primitives";
import { ADMIN, ADMIN_NAV, ADMIN_METRICS, ADMIN_TREND_DATA, ADMIN_STATUS_CHART, ADMIN_PENDING_LOTS, DEMO_LOT } from "@/components/demo/core/mock-data";
import { LayoutDashboard, Users, Package, FileText } from "lucide-react";

/**
 * Act 4 — Admin Reviews
 * Scene 4.1: Admin dashboard with animated metrics
 * Scene 4.2: Review and approve the cotton lot
 */
export function Act4AdminReview({ progress }: { progress: number }): SceneOutput {
  const dashP = rangeProgress(progress, 0, 0.4);
  const reviewP = rangeProgress(progress, 0.4, 1.0);

  /* ── Dashboard sub-animations ── */
  const shellSlide = lerp(100, 0, easeOutCubic(rangeProgress(dashP, 0, 0.1)));
  const heroFade = easeOutCubic(rangeProgress(dashP, 0.1, 0.2));
  const metricsP = rangeProgress(dashP, 0.2, 0.35);
  const chartsP = rangeProgress(dashP, 0.35, 0.5);
  const pendingScrollP = easeOutCubic(rangeProgress(dashP, 0.5, 0.7));

  /* ── Review sub-animations ── */
  const clickLot = rangeProgress(reviewP, 0, 0.08);
  const slideToDetail = easeOutCubic(rangeProgress(reviewP, 0.08, 0.25));
  const specsFade = rangeProgress(reviewP, 0.25, 0.42);
  const approveBtnHover = rangeProgress(reviewP, 0.42, 0.53);
  const approveClick = rangeProgress(reviewP, 0.53, 0.67);
  const isApproved = approveClick > 0.5;
  const navToAssignments = rangeProgress(reviewP, 0.67, 0.8);
  const assignmentsSlide = easeOutCubic(rangeProgress(reviewP, 0.8, 1.0));

  /* ── Camera ── */
  const cameraAt = (sceneProgress: number) => {
    const dashboardProgress = rangeProgress(sceneProgress, 0, 0.4);
    const reviewProgress = rangeProgress(sceneProgress, 0.4, 1.0);
    const pendingScrollProgress = easeOutCubic(rangeProgress(dashboardProgress, 0.5, 0.7));
    const detailSlideProgress = easeOutCubic(rangeProgress(reviewProgress, 0.08, 0.25));

    if (dashboardProgress > 0 && dashboardProgress < 1) {
      return { scale: 0.85, x: 0, y: lerp(0, -8, pendingScrollProgress) };
    }
    if (reviewProgress > 0.08 && reviewProgress < 0.67) {
      return { scale: lerp(0.85, 1.05, detailSlideProgress), x: 0, y: 0 };
    }
    return { scale: 0.85, x: 0, y: 0 };
  };

  const camera = cameraAt(progress);

  /* ── Cursor ── */
  const cursor = cursorScreenKeyframes(progress, cameraAt, [
    { at: 0.00, x: 40, y: 35, visible: false, state: "idle" },
    { at: 0.18, x: 48, y: 40, visible: true, state: "idle" },
    { at: 0.30, x: 88, y: 75, state: "hover" },
    { at: 0.38, x: 88, y: 75, state: "click" },
    { at: 0.55, x: 80, y: 42, state: "idle" },
    { at: 0.62, x: 92, y: 42, state: "hover" },
    { at: 0.67, x: 92, y: 42, state: "click" },
    { at: 0.75, x: 15, y: 29, state: "hover" },
    { at: 0.80, x: 15, y: 29, state: "click" },
    { at: 0.90, x: 15, y: 29, visible: false, state: "idle" },
  ]);

  const showDashboard = reviewP < 0.08;
  const showDetail = reviewP >= 0.08 && reviewP < 0.8;
  const showAssignments = reviewP >= 0.8;

  // Active nav index
  const activeNav = showAssignments ? 3 : 0;

  const element = (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", transform: `translateX(${shellSlide}%)` }}>
        {/* ── Admin Sidebar ── */}
        <aside style={{ width: "18%", minWidth: 180, borderRight: "1px solid var(--line)", backgroundColor: "var(--paper)", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green-light)", textTransform: "uppercase" }}>SurplusLink</span>
          </div>
          <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {ADMIN_NAV.map((item, i) => {
              const icons = [<LayoutDashboard key="ld" size={18} />, <Users key="u" size={18} />, <Package key="p" size={18} />, <FileText key="ft" size={18} />];
              const isActive = i === activeNav;
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 6, fontSize: 14, fontWeight: 500, backgroundColor: isActive ? "var(--brand-green-muted)" : "transparent", color: isActive ? "var(--brand-green)" : "var(--ink-muted)" }}>
                  {icons[i]}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{ADMIN.name}</p>
            <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{ADMIN.email}</p>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, backgroundColor: "var(--surface)", overflow: "hidden", position: "relative" }}>
          {/* Dashboard View */}
          {showDashboard && (
            <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ opacity: heroFade }}>
                <DashboardHero eyebrow="Operations Overview" title="Platform Analytics" description="Monitor marketplace health, review pending items, and manage assignments." />
              </div>
              {/* Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
                {[
                  { label: "Total Users", val: ADMIN_METRICS.totalUsers, hint: "Across all roles" },
                  { label: "Live Lots", val: ADMIN_METRICS.liveLots, hint: "Active supply", accent: true },
                  { label: "Assignments", val: ADMIN_METRICS.assignments, hint: "Total assignments" },
                  { label: "Interested", val: ADMIN_METRICS.interested, hint: "Positive signals" },
                ].map((m, i) => {
                  const cardP = easeOutCubic(rangeProgress(metricsP, i * 0.15, i * 0.15 + 0.5));
                  return (
                    <div key={m.label} style={{ opacity: cardP, transform: `translateY(${lerp(12, 0, cardP)}px)` }}>
                      <DashboardMetricCard
                        label={m.label}
                        value={metricsP > 0 ? Math.round(m.val * easeOutCubic(rangeProgress(metricsP, i * 0.1, 0.8))) : 0}
                        hint={m.hint}
                        accent={m.accent}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24, opacity: easeOutCubic(chartsP) }}>
                <DashboardSection title="Supply Trend">
                  <TrendColumns items={ADMIN_TREND_DATA.map(d => ({ ...d, value: Math.round(d.value * easeOutCubic(chartsP)) }))} valueLabel="lots" />
                </DashboardSection>
                <DashboardSection title="Supply Status">
                  <HorizontalBarChart items={ADMIN_STATUS_CHART.map(d => ({ ...d, value: Math.round(d.value * easeOutCubic(chartsP)) }))} />
                </DashboardSection>
              </div>

              {/* Pending Lots */}
              <div style={{ marginTop: 24, transform: `translateY(${lerp(20, 0, pendingScrollP)}px)`, opacity: pendingScrollP }}>
                <DashboardSection title="Pending Lot Reviews" description="Lots awaiting your approval">
                  <DashboardList items={ADMIN_PENDING_LOTS} emptyTitle="No pending lots" emptyBody="All clear." />
                </DashboardSection>
              </div>
            </div>
          )}

          {/* Lot Detail View */}
          {showDetail && (
            <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", transform: `translateX(${lerp(60, 0, slideToDetail)}%)`, opacity: slideToDetail }}>
              {/* Hero header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)" }}>{DEMO_LOT.category}</span>
                  <span style={{ color: "var(--line-strong)" }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)" }}>{DEMO_LOT.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.05em" }}>{DEMO_LOT.title}</h1>
                  <div style={{ position: "relative" }}>
                    <StatusBadge status={isApproved ? "approved" : "pending_review"} />
                    {approveClick > 0.5 && approveClick < 0.9 && (
                      <RippleEffect progress={rangeProgress(approveClick, 0.5, 0.9)} color="var(--brand-green)" maxSize={80} />
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{DEMO_LOT.id}</p>
              </div>

              {/* Spec Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Supplier", value: "GreenWeave Textiles" },
                  { label: "Expected Price", value: "$18,500" },
                  { label: "Quantity", value: "2,400 kg" },
                  { label: "Expires", value: DEMO_LOT.expiresIn },
                ].map((spec, i) => {
                  const cardP = easeOutCubic(rangeProgress(specsFade, i * 0.15, i * 0.15 + 0.5));
                  return (
                    <div key={spec.label} style={{ opacity: cardP, transform: `translateY(${lerp(8, 0, cardP)}px)` }}>
                    <Panel style={{ padding: 16 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 4 }}>{spec.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{spec.value}</p>
                    </Panel>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              <Panel style={{ padding: 20, marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>Description</p>
                <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{DEMO_LOT.description}</p>
              </Panel>

              {/* Approve button */}
              {!isApproved && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="primary" style={approveBtnHover > 0 ? { backgroundColor: "var(--brand-green-light)" } : undefined}>
                    Approve Lot
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Assignments Page */}
          {showAssignments && (
            <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", transform: `translateX(${lerp(60, 0, assignmentsSlide)}%)`, opacity: assignmentsSlide }}>
              <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.05em", marginBottom: 32 }}>Assignments</h1>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
                {/* Left: Lot Explorer */}
                <Panel style={{ padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 12 }}>Supply Lots</p>
                  <div style={{ padding: 12, border: "2px solid var(--brand-green)", backgroundColor: "var(--brand-green-muted)", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{DEMO_LOT.title}</p>
                    <p style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{DEMO_LOT.category} · $18,500</p>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--line)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>Galvanised Steel Sheets</p>
                    <p style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>Metals · $32,000</p>
                  </div>
                </Panel>
                {/* Right: Empty state */}
                <Panel style={{ padding: 24 }}>
                  <div style={{ display: "grid", placeItems: "center", minHeight: 300, border: "1px dashed var(--line)", padding: 32, textAlign: "center" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>Select a lot</p>
                      <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>Choose a lot from the left panel to view and recruit candidates.</p>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  return { element, camera, cursor };
}
