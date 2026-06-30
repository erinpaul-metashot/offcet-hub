"use client";

import type { SceneOutput } from "@/components/demo/core/types";
import { cursorScreenKeyframes, rangeProgress, lerp, easeOutCubic } from "@/components/demo/core/utils";
import { Button, Input, Field, Panel, StatusBadge } from "@/components/demo/ui";
import { DashboardHero, DashboardMetricCard } from "@/components/demo/dashboard-widgets";
import { SuccessCheckmark, GreenConfetti } from "@/components/demo/primitives";
import { SUPPLIER, SUPPLIER_NAV } from "@/components/demo/core/mock-data";
import { LayoutDashboard, Package, FilePlus } from "lucide-react";

/**
 * Act 2 — Registration
 * Scene 2.1: Supplier registers on the platform
 * Scene 2.2: Approval transition → login → supplier dashboard
 */
export function Act2Registration({ progress }: { progress: number }): SceneOutput {
  const registerP = rangeProgress(progress, 0, 0.5);
  const transitionP = rangeProgress(progress, 0.5, 1.0);

  const cameraAt = (sceneProgress: number) => {
    const registerProgress = rangeProgress(sceneProgress, 0, 0.5);
    const transitionProgress = rangeProgress(sceneProgress, 0.5, 1.0);

    if (registerProgress > 0 && registerProgress < 1) {
      const zoom = lerp(1, 1.2, easeOutCubic(rangeProgress(registerProgress, 0.1, 0.15)));
      return { scale: zoom, x: -10, y: 0 };
    }
    if (transitionProgress > 0.55) {
      return {
        scale: lerp(1.2, 0.9, easeOutCubic(rangeProgress(transitionProgress, 0.55, 0.75))),
        x: 0,
        y: 0,
      };
    }
    return { scale: 1, x: 0, y: 0 };
  };

  /* ── Camera ── */
  const camera = cameraAt(progress);

  /* ── Cursor ── */
  const cursor = cursorScreenKeyframes(progress, cameraAt, [
    { at: 0.00, x: 62, y: 34, visible: false, state: "idle" },
    { at: 0.08, x: 62, y: 35, visible: true, state: "idle" },
    { at: 0.15, x: 62, y: 45, state: "idle" },
    { at: 0.20, x: 62, y: 65, state: "hover" },
    { at: 0.24, x: 62, y: 78, state: "click" },
    { at: 0.30, x: 62, y: 78, state: "idle" },
    { at: 0.50, x: 62, y: 78, visible: false, state: "idle" },
    { at: 0.65, x: 50, y: 45, visible: true, state: "idle" },
    { at: 0.70, x: 50, y: 64, state: "hover" },
    { at: 0.75, x: 50, y: 64, state: "click" },
    { at: 0.78, x: 50, y: 64, visible: false, state: "idle" },
  ]);

  /* ── Typewriter progress for fields ── */
  const nameP = rangeProgress(registerP, 0.2, 0.28);
  const emailP = rangeProgress(registerP, 0.28, 0.36);
  const companyP = rangeProgress(registerP, 0.36, 0.44);

  /* ── Login typewriter ── */
  const loginEmailP = rangeProgress(transitionP, 0.3, 0.4);
  const loginPwdP = rangeProgress(transitionP, 0.4, 0.48);

  /* ── Approval animation ── */
  const pendingShow = easeOutCubic(rangeProgress(transitionP, 0, 0.15));
  const approvalMorph = rangeProgress(transitionP, 0.15, 0.3);
  const isApproved = approvalMorph > 0.5;

  /* ── Dashboard reveal ── */
  const dashboardP = rangeProgress(transitionP, 0.75, 1.0);
  const sidebarP = easeOutCubic(rangeProgress(transitionP, 0.55, 0.7));
  const shellSlide = lerp(100, 0, easeOutCubic(rangeProgress(transitionP, 0.55, 0.65)));

  /* ── Scene transitions ── */
  const authSlideIn = lerp(100, 0, easeOutCubic(rangeProgress(registerP, 0, 0.1)));
  const registerSuccess = easeOutCubic(rangeProgress(registerP, 0.48, 0.58));

  const element = (
    <div style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "var(--paper)", fontFamily: "var(--font-sans)", overflow: "hidden" }}>

      {/* ── Register Form Phase ── */}
      {registerP < 1 && transitionP < 0.3 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${authSlideIn}%)`, display: "flex" }}>
          {/* Left branding panel */}
          <div style={{ width: "40%", backgroundColor: "#050505", display: "flex", flexDirection: "column", justifyContent: "center", padding: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green)", textTransform: "uppercase", fontFamily: "var(--font-display)", marginBottom: 24 }}>
              SURPLUSLINK
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.3, marginBottom: 12 }}>
              Join the curated surplus marketplace
            </h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              Connect with verified buyers and suppliers. Trade surplus inventory efficiently.
            </p>
          </div>

          {/* Right form panel */}
          <div style={{ width: "60%", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
            <div style={{ width: "100%", maxWidth: 480 }}>
              <Panel style={{ padding: 32 }}>
                {/* Eyebrow */}
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>
                  Role-Based Onboarding
                </p>
                <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.05em", color: "var(--ink)", marginBottom: 24 }}>
                  Register your business
                </h2>

                {/* Role selector */}
                <div style={{ marginBottom: 20 }}>
                  <Field label="Role">
                    <div style={{ padding: "10px 16px", border: "1px solid var(--line)", backgroundColor: "var(--surface)", fontSize: 14, color: "var(--ink)" }}>
                      Supplier
                    </div>
                  </Field>
                </div>

                {/* Fields */}
                <div style={{ display: "grid", gap: 16 }}>
                  <Field label="Full Name">
                    <Input
                      value={SUPPLIER.name.substring(0, Math.floor(nameP * SUPPLIER.name.length))}
                      readOnly
                      style={{ borderColor: nameP > 0 && nameP < 1 ? "var(--ink)" : "var(--line)" }}
                    />
                  </Field>
                  <Field label="Email Address">
                    <Input
                      value={SUPPLIER.email.substring(0, Math.floor(emailP * SUPPLIER.email.length))}
                      readOnly
                      style={{ borderColor: emailP > 0 && emailP < 1 ? "var(--ink)" : "var(--line)" }}
                    />
                  </Field>
                  <Field label="Company Name">
                    <Input
                      value={SUPPLIER.company.substring(0, Math.floor(companyP * SUPPLIER.company.length))}
                      readOnly
                      style={{ borderColor: companyP > 0 && companyP < 1 ? "var(--ink)" : "var(--line)" }}
                    />
                  </Field>
                </div>

                {/* Register button */}
                <div style={{ marginTop: 24, position: "relative" }}>
                  <Button
                    variant="primary"
                    disabled={registerP >= 0.48}
                    style={{
                      width: "100%",
                      ...(registerP >= 0.48 ? { opacity: 0.5 } : {}),
                    }}
                  >
                    {registerP >= 0.48 ? "Submitting…" : "Register"}
                  </Button>
                  {registerSuccess > 0 && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SuccessCheckmark progress={registerSuccess} size={40} />
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* ── Approval Transition Phase ── */}
      {transitionP > 0 && transitionP < 0.55 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", position: "relative" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 16, opacity: pendingShow }}>
              Account Review
            </p>
            <div style={{ display: "inline-block", position: "relative" }}>
              <StatusBadge status={isApproved ? "approved" : "pending"} />
              {isApproved && (
                <div style={{ position: "absolute", inset: -20 }}>
                  <GreenConfetti progress={rangeProgress(approvalMorph, 0.5, 1)} count={10} spread={60} />
                </div>
              )}
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: 12, opacity: pendingShow }}>
              {SUPPLIER.email}
            </p>
          </div>
        </div>
      )}

      {/* ── Login Phase ── */}
      {transitionP >= 0.3 && transitionP < 0.55 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: easeOutCubic(rangeProgress(transitionP, 0.3, 0.35)) }}>
          <Panel style={{ padding: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>Secure Access</p>
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.05em", marginBottom: 24 }}>Sign in</h2>
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="Email">
                <Input value={SUPPLIER.email.substring(0, Math.floor(loginEmailP * SUPPLIER.email.length))} readOnly />
              </Field>
              <Field label="Password">
                <Input type="password" value={SUPPLIER.password.substring(0, Math.floor(loginPwdP * SUPPLIER.password.length))} readOnly />
              </Field>
            </div>
            <div style={{ marginTop: 24 }}>
              <Button variant="primary" disabled={transitionP >= 0.5} style={{ width: "100%" }}>
                {transitionP >= 0.5 ? "Signing In…" : "Sign In"}
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Dashboard Phase ── */}
      {transitionP >= 0.55 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", transform: `translateX(${shellSlide}%)` }}>
          {/* Mock Sidebar */}
          <aside style={{ width: "20%", minWidth: 200, borderRight: "1px solid var(--line)", backgroundColor: "var(--paper)", display: "flex", flexDirection: "column", opacity: sidebarP }}>
            {/* Brand */}
            <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green-light)", textTransform: "uppercase" }}>SurplusLink</span>
            </div>
            {/* Nav */}
            <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              {SUPPLIER_NAV.map((item, i) => {
                const icons = [<LayoutDashboard key="ld" size={18} />, <Package key="pkg" size={18} />, <FilePlus key="fp" size={18} />];
                const isActive = i === 0;
                return (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 6, fontSize: 14, fontWeight: 500, backgroundColor: isActive ? "var(--brand-green-muted)" : "transparent", color: isActive ? "var(--brand-green)" : "var(--ink-muted)" }}>
                    {icons[i]}
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </nav>
            {/* User */}
            <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{SUPPLIER.name}</p>
              <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{SUPPLIER.email}</p>
            </div>
          </aside>

          {/* Main content */}
          <main style={{ flex: 1, padding: 32, overflow: "hidden", backgroundColor: "var(--surface)", opacity: easeOutCubic(dashboardP) }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <DashboardHero eyebrow="Supplier Overview" title="Welcome, Arjun" description="Your surplus inventory hub. Create and manage your lots here." />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
                <DashboardMetricCard label="Total Lots" value={0} hint="No lots yet" />
                <DashboardMetricCard label="Active Pipeline" value={0} hint="Submit your first lot" accent />
                <DashboardMetricCard label="Assignments" value={0} hint="Pending matches" />
                <DashboardMetricCard label="Sold Lots" value={0} hint="Completed deals" />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );

  return { element, camera, cursor };
}
