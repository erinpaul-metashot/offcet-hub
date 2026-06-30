"use client";

import type { SceneOutput } from "@/components/demo/core/types";
import { cursorScreenKeyframes, rangeProgress, lerp, easeOutCubic } from "@/components/demo/core/utils";
import { Button, Panel, StatusBadge } from "@/components/demo/ui";
import { DashboardHero, DashboardMetricCard, DashboardSection, DashboardList } from "@/components/demo/dashboard-widgets";
import { RippleEffect } from "@/components/demo/primitives";
import { BUYER_1, BUYER_NAV, BUYER_METRICS, DEMO_LOT, ASSIGNMENT_NOTE, BUYER_RECENT_ASSIGNMENTS } from "@/components/demo/core/mock-data";
import { LayoutDashboard, Package, Check, X } from "lucide-react";

/**
 * Act 6 — Buyer Responds
 * Scene 6.1: Buyer dashboard with metrics
 * Scene 6.2: Lot detail and "Interested" response
 */
export function Act6BuyerResponse({ progress }: { progress: number }): SceneOutput {
  const dashP = rangeProgress(progress, 0, 0.45);
  const respondP = rangeProgress(progress, 0.45, 1.0);

  /* ── Dashboard sub-animations ── */
  const shellSlide = lerp(100, 0, easeOutCubic(rangeProgress(dashP, 0, 0.1)));
  const heroFade = easeOutCubic(rangeProgress(dashP, 0.1, 0.22));
  const metricsP = rangeProgress(dashP, 0.22, 0.44);
  const recentP = easeOutCubic(rangeProgress(dashP, 0.44, 0.67));
  const navClick = rangeProgress(dashP, 0.8, 0.95);

  /* ── Response sub-animations ── */
  const lotListP = easeOutCubic(rangeProgress(respondP, 0, 0.18));
  const reviewClick = rangeProgress(respondP, 0.18, 0.27);
  const detailSlide = easeOutCubic(rangeProgress(respondP, 0.27, 0.49));
  const specsFade = rangeProgress(respondP, 0.49, 0.64);
  const respondZoom = rangeProgress(respondP, 0.64, 0.73);
  const interestedHover = rangeProgress(respondP, 0.73, 0.82);
  const interestedClick = rangeProgress(respondP, 0.82, 0.91);
  const isInterested = interestedClick > 0.5;
  const fadeOutP = easeOutCubic(rangeProgress(respondP, 0.91, 1.0));

  /* ── Active nav ── */
  const activeNav = navClick > 0.5 || respondP > 0 ? 1 : 0;

  /* ── Camera ── */
  const cameraAt = (sceneProgress: number) => {
    const dashboardProgress = rangeProgress(sceneProgress, 0, 0.45);
    const responseProgress = rangeProgress(sceneProgress, 0.45, 1.0);
    const recentProgress = easeOutCubic(rangeProgress(dashboardProgress, 0.44, 0.67));
    const respondZoomProgress = rangeProgress(responseProgress, 0.64, 0.73);
    const fadeOutProgress = easeOutCubic(rangeProgress(responseProgress, 0.91, 1.0));

    if (respondZoomProgress > 0 && fadeOutProgress < 0.5) {
      return { scale: lerp(0.85, 1.2, easeOutCubic(respondZoomProgress)), x: -5, y: -10 };
    }
    if (fadeOutProgress > 0) {
      return { scale: lerp(1.2, 0.7, fadeOutProgress), x: 0, y: 0 };
    }
    return { scale: 0.85, x: 0, y: lerp(0, -5, recentProgress) };
  };

  const camera = cameraAt(progress);

  /* ── Cursor ── */
  const cursor = cursorScreenKeyframes(progress, cameraAt, [
    { at: 0.00, x: 50, y: 45, visible: false, state: "idle" },
    { at: 0.20, x: 45, y: 35, visible: true, state: "idle" },
    { at: 0.35, x: 15, y: 17, state: "hover" },
    { at: 0.38, x: 15, y: 17, state: "click" },
    { at: 0.50, x: 84, y: 17, state: "hover" },
    { at: 0.56, x: 84, y: 17, state: "click" },
    { at: 0.80, x: 19, y: 50, state: "idle" },
    { at: 0.85, x: 19, y: 50, state: "hover" },
    { at: 0.90, x: 19, y: 50, state: "click" },
    { at: 0.95, x: 19, y: 50, visible: false, state: "idle" },
  ]);

  const showDashboard = respondP < 0.18;
  const showLotList = respondP >= 0.18 && respondP < 0.27;
  const showDetail = respondP >= 0.27;

  const element = (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: "var(--font-sans)", overflow: "hidden", opacity: fadeOutP > 0.5 ? lerp(1, 0, rangeProgress(fadeOutP, 0.5, 1)) : 1 }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", transform: `translateX(${shellSlide}%)` }}>
        {/* ── Buyer Sidebar ── */}
        <aside style={{ width: "18%", minWidth: 180, borderRight: "1px solid var(--line)", backgroundColor: "var(--paper)", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green-light)", textTransform: "uppercase" }}>SurplusLink</span>
          </div>
          <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {BUYER_NAV.map((item, i) => {
              const icons = [<LayoutDashboard key="ld" size={18} />, <Package key="p" size={18} />];
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 6, fontSize: 14, fontWeight: 500, backgroundColor: i === activeNav ? "var(--brand-green-muted)" : "transparent", color: i === activeNav ? "var(--brand-green)" : "var(--ink-muted)" }}>
                  {icons[i]}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{BUYER_1.name}</p>
            <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{BUYER_1.email}</p>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, backgroundColor: "var(--surface)", overflow: "hidden", position: "relative" }}>
          {/* Dashboard */}
          {showDashboard && (
            <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ opacity: heroFade }}>
                <DashboardHero eyebrow="Your Pipeline" title="Active Opportunities" description="Review assigned lots and signal your interest to suppliers." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
                {[
                  { label: "Assigned Lots", val: BUYER_METRICS.assignedLots, hint: "Total assigned" },
                  { label: "Active", val: BUYER_METRICS.active, hint: "Open opportunities", accent: true },
                  { label: "Interested", val: BUYER_METRICS.interested, hint: "Your signals" },
                  { label: "Expiring Soon", val: BUYER_METRICS.expiringSoon, hint: "Act quickly" },
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
              <div style={{ marginTop: 24, opacity: recentP }}>
                <DashboardSection title="Recent Assignments">
                  <DashboardList items={BUYER_RECENT_ASSIGNMENTS} emptyTitle="No assignments" emptyBody="Check back later." />
                </DashboardSection>
              </div>
            </div>
          )}

          {/* Lot List */}
          {showLotList && (
            <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", opacity: lotListP }}>
              <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.05em", marginBottom: 32 }}>Assigned Inventory</h1>
              <Panel style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{DEMO_LOT.title}</h3>
                      <StatusBadge status="assigned" />
                    </div>
                    <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>{DEMO_LOT.category} · {DEMO_LOT.location} · ${DEMO_LOT.expectedPrice.toLocaleString()}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>Supplier: {BUYER_1.business ? "GreenWeave Textiles" : ""}</p>
                  </div>
                  <Button variant="secondary" size="sm">Review &amp; Respond</Button>
                </div>
              </Panel>
            </div>
          )}

          {/* Lot Detail */}
          {showDetail && (
            <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", transform: `translateX(${lerp(40, 0, detailSlide)}%)`, opacity: detailSlide }}>
              {/* Hero header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)" }}>{DEMO_LOT.category}</span>
                  <span style={{ color: "var(--line-strong)" }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)" }}>{DEMO_LOT.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.05em" }}>{DEMO_LOT.title}</h1>
                  <StatusBadge status={isInterested ? "interested" : "assigned"} />
                </div>
              </div>

              {/* Spec cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Category", value: DEMO_LOT.category },
                  { label: "Quantity", value: DEMO_LOT.quantity + " " + DEMO_LOT.unit },
                  { label: "Price", value: "$" + DEMO_LOT.expectedPrice.toLocaleString() },
                  { label: "Expires", value: DEMO_LOT.expiresIn },
                ].map((spec, i) => {
                  const cardP = easeOutCubic(rangeProgress(specsFade, i * 0.15, i * 0.15 + 0.5));
                  return (
                    <div key={spec.label} style={{ opacity: cardP }}>
                    <Panel style={{ padding: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 4 }}>{spec.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{spec.value}</p>
                    </Panel>
                    </div>
                  );
                })}
              </div>

              {/* Admin note */}
              <Panel style={{ padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6 }}>Assignment Note</p>
                <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{ASSIGNMENT_NOTE}</p>
              </Panel>

              {/* Description */}
              <Panel style={{ padding: 16, marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6 }}>Description</p>
                <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{DEMO_LOT.description}</p>
              </Panel>

              {/* Respond panel */}
              <div style={{ position: "relative" }}>
              <Panel style={{ padding: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 12 }}>Your Response</p>
                {!isInterested ? (
                  <div style={{ display: "flex", gap: 12 }}>
                    <Button variant="primary" style={interestedHover > 0 ? { backgroundColor: "var(--brand-green-light)", transform: "scale(1.02)" } : undefined}>
                      <Check size={16} style={{ marginRight: 8 }} />
                      Interested
                    </Button>
                    <Button variant="ghost">
                      <X size={16} style={{ marginRight: 8 }} />
                      Not Interested
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusBadge status="interested" />
                    <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>You responded with interest</span>
                  </div>
                )}
                {interestedClick > 0.3 && interestedClick < 0.8 && (
                  <RippleEffect
                    progress={rangeProgress(interestedClick, 0.3, 0.8)}
                    color="var(--brand-green)"
                    maxSize={100}
                    style={{ left: 100, top: 40 }}
                  />
                )}
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
