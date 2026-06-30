"use client";

import type { SceneOutput } from "@/components/demo/core/types";
import { cursorScreenKeyframes, rangeProgress, lerp, easeOutCubic } from "@/components/demo/core/utils";
import { Button, Input, Textarea, Field, Panel, StatusBadge, EmptyState } from "@/components/demo/ui";
import { SuccessCheckmark, SelectDropdown } from "@/components/demo/primitives";
import { DEMO_LOT, SUPPLIER, SUPPLIER_NAV, LOT_CATEGORIES } from "@/components/demo/core/mock-data";
import { LayoutDashboard, Package, FilePlus } from "lucide-react";

/**
 * Act 3 — Supplier Creates Lot
 * The hero sequence: navigate to form, fill it with live preview, submit.
 */
export function Act3CreateLot({ progress }: { progress: number }): SceneOutput {
  const navP = rangeProgress(progress, 0, 0.15);
  const fillP = rangeProgress(progress, 0.15, 0.70);
  const submitP = rangeProgress(progress, 0.70, 1.0);

  /* ── Typewriter values ── */
  const titleP = rangeProgress(fillP, 0, 0.14);
  const categoryP = rangeProgress(fillP, 0.14, 0.24);
  const descP = rangeProgress(fillP, 0.24, 0.38);
  const qtyP = rangeProgress(fillP, 0.38, 0.47);
  const priceP = rangeProgress(fillP, 0.47, 0.55);
  const locationP = rangeProgress(fillP, 0.55, 0.63);
  const photosP = rangeProgress(fillP, 0.63, 0.80);
  const glamourP = rangeProgress(fillP, 0.80, 1.0);

  const titleText = DEMO_LOT.title.substring(0, Math.floor(titleP * DEMO_LOT.title.length));
  const descText = DEMO_LOT.description.substring(0, Math.floor(descP * DEMO_LOT.description.length));
  const qtyText = DEMO_LOT.quantity.substring(0, Math.floor(qtyP * DEMO_LOT.quantity.length));
  const priceText = "18500".substring(0, Math.floor(priceP * 5));
  const locText = DEMO_LOT.location.substring(0, Math.floor(locationP * DEMO_LOT.location.length));
  const categorySelected = categoryP > 0.6;
  const showDropdown = categoryP > 0.1 && categoryP < 0.6;
  const highlightIdx = LOT_CATEGORIES.indexOf("Textiles & Fabrics");
  const photosShown = Math.floor(Math.min(photosP, 1) * 3);

  /* ── Submit animation ── */
  const btnHover = rangeProgress(submitP, 0, 0.17);
  const btnClick = rangeProgress(submitP, 0.17, 0.27);
  const successP = easeOutCubic(rangeProgress(submitP, 0.27, 0.50));
  const scaleDownP = easeOutCubic(rangeProgress(submitP, 0.50, 1.0));

  /* ── Camera ── */
  const cameraAt = (sceneProgress: number) => {
    const fillProgress = rangeProgress(sceneProgress, 0.15, 0.70);
    const submitProgress = rangeProgress(sceneProgress, 0.70, 1.0);
    const glamourProgress = rangeProgress(fillProgress, 0.80, 1.0);
    const scaleDownProgress = easeOutCubic(rangeProgress(submitProgress, 0.50, 1.0));

    if (submitProgress > 0.5) {
      const s = lerp(1, 0.35, scaleDownProgress);
      return { scale: s, x: lerp(0, -30, scaleDownProgress), y: 0 };
    }
    if (fillProgress > 0 && glamourProgress < 0.5) {
      return { scale: 1.05, x: -5, y: lerp(0, -5, fillProgress) };
    }
    if (glamourProgress >= 0.5) {
      return { scale: lerp(1.05, 1.3, easeOutCubic(rangeProgress(glamourProgress, 0.5, 1))), x: 15, y: -3 };
    }
    return { scale: 0.95, x: 0, y: 0 };
  };

  const camera = cameraAt(progress);

  /* ── Cursor ── */
  const cursor = cursorScreenKeyframes(progress, cameraAt, [
    { at: 0.00, x: 11, y: 12, visible: false, state: "idle" },
    { at: 0.05, x: 11, y: 22, visible: true, state: "hover" },
    { at: 0.13, x: 11, y: 22, state: "click" },
    { at: 0.18, x: 30, y: 22, state: "idle" },
    { at: 0.22, x: 36, y: 28, state: "hover" },
    { at: 0.24, x: 36, y: 28, state: "click" },
    { at: 0.28, x: 32, y: 32, state: "idle" },
    { at: 0.50, x: 32, y: 38, state: "hover" },
    { at: 0.55, x: 32, y: 38, state: "click" },
    { at: 0.62, x: 50, y: 50, state: "idle" },
    { at: 0.70, x: 87, y: 88, state: "hover" },
    { at: 0.75, x: 87, y: 88, state: "click" },
    { at: 0.82, x: 87, y: 88, visible: false, state: "idle" },
  ]);

  const formOpacity = navP > 0.5 ? easeOutCubic(rangeProgress(navP, 0.5, 1)) : 0;
  const dashFadeOut = easeOutCubic(rangeProgress(navP, 0.3, 0.5));
  const showTransition = submitP > 0.5;

  const element = (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      {/* ── App Shell ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", opacity: showTransition ? 1 - scaleDownP : 1 }}>
        {/* Mock Sidebar */}
        <aside style={{ width: "18%", minWidth: 180, borderRight: "1px solid var(--line)", backgroundColor: "var(--paper)", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green-light)", textTransform: "uppercase" }}>SurplusLink</span>
          </div>
          <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {SUPPLIER_NAV.map((item, i) => {
              const icons = [<LayoutDashboard key="ld" size={18} />, <Package key="p" size={18} />, <FilePlus key="fp" size={18} />];
              const isActive = navP > 0.86 ? i === 2 : i === 0;
              const isHovered = navP > 0 && navP < 0.5 && i === 2;
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 6, fontSize: 14, fontWeight: 500, backgroundColor: isActive ? "var(--brand-green-muted)" : isHovered ? "var(--muted)" : "transparent", color: isActive ? "var(--brand-green)" : "var(--ink-muted)", transition: "all 0.2s" }}>
                  {icons[i]}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{SUPPLIER.name}</p>
            <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{SUPPLIER.email}</p>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, backgroundColor: "var(--surface)", overflow: "hidden" }}>
          <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
            {/* Page title */}
            <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 24, marginBottom: 32 }}>
              <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.05em" }}>
                {navP < 0.3 ? "Dashboard" : "New Lot"}
              </h1>
            </div>

            {/* Form + Preview Split */}
            {formOpacity > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, opacity: formOpacity }}>
                {/* ── Left: Form ── */}
                <div>
                  <Panel style={{ padding: 24 }}>
                    <div style={{ display: "grid", gap: 20 }}>
                      {/* Title */}
                      <Field label="Lot Title">
                        <Input value={titleText} readOnly style={{ borderColor: titleP > 0 && titleP < 1 ? "var(--ink)" : "var(--line)" }} />
                      </Field>

                      {/* Category */}
                      <div style={{ position: "relative" }}>
                        <Field label="Category">
                          <div style={{ padding: "10px 16px", border: "1px solid var(--line)", backgroundColor: "var(--surface)", fontSize: 14, color: categorySelected ? "var(--ink)" : "var(--ink-muted)" }}>
                            {categorySelected ? DEMO_LOT.category : "Select category…"}
                          </div>
                        </Field>
                        <SelectDropdown options={LOT_CATEGORIES} highlightIndex={highlightIdx} visible={showDropdown} />
                      </div>

                      {/* Description */}
                      <Field label="Description">
                        <Textarea value={descText} readOnly style={{ borderColor: descP > 0 && descP < 1 ? "var(--ink)" : "var(--line)", minHeight: 80 }} />
                      </Field>

                      {/* Quantity + Price row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Field label="Quantity">
                          <Input value={qtyText ? qtyText + " kg" : ""} readOnly style={{ borderColor: qtyP > 0 && qtyP < 1 ? "var(--ink)" : "var(--line)" }} />
                        </Field>
                        <Field label="Expected Price (USD)">
                          <Input value={priceText} readOnly style={{ borderColor: priceP > 0 && priceP < 1 ? "var(--ink)" : "var(--line)" }} />
                        </Field>
                      </div>

                      {/* Location */}
                      <Field label="Location">
                        <Input value={locText} readOnly style={{ borderColor: locationP > 0 && locationP < 1 ? "var(--ink)" : "var(--line)" }} />
                      </Field>

                      {/* Photos */}
                      <Field label="Photos">
                        <div style={{ display: "flex", gap: 8 }}>
                          {[0, 1, 2].map((i) => (
                            <div key={i} style={{ width: 80, height: 80, border: "1px solid var(--line)", backgroundColor: i < photosShown ? "var(--brand-green-muted)" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--ink-muted)", opacity: i < photosShown ? 1 : 0.3, transition: "opacity 0.3s" }}>
                              {i < photosShown ? "IMG" : ""}
                            </div>
                          ))}
                        </div>
                      </Field>

                      {/* Submit buttons */}
                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8, position: "relative" }}>
                        <Button variant="ghost" size="sm">Save Draft</Button>
                        <Button variant="primary" disabled={submitP >= 0.17} style={submitP >= 0.17 ? { opacity: 0.5 } : undefined}>
                          {submitP >= 0.17 && submitP < 0.5 ? "Submitting…" : "Submit For Review"}
                        </Button>
                        {successP > 0 && (
                          <div style={{ position: "absolute", right: 0, top: -60 }}>
                            <SuccessCheckmark progress={successP} size={48} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                </div>

                {/* ── Right: Live Preview ── */}
                <div style={{ position: "sticky", top: 32 }}>
                  <Panel style={{ padding: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 12 }}>Live Preview</p>
                    {titleText ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--ink)" }}>{titleText}</h3>
                        {categorySelected && (
                          <span style={{ display: "inline-flex", padding: "4px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", border: "1px solid var(--brand-green)", color: "var(--brand-green)", alignSelf: "flex-start" }}>
                            {DEMO_LOT.category}
                          </span>
                        )}
                        {descText && <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>{descText}</p>}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                          {qtyText && (
                            <div><span style={{ color: "var(--ink-muted)" }}>Qty:</span> <span style={{ fontWeight: 600 }}>{qtyText} kg</span></div>
                          )}
                          {priceText && (
                            <div><span style={{ color: "var(--ink-muted)" }}>Price:</span> <span style={{ fontWeight: 600 }}>${Number(priceText).toLocaleString()}</span></div>
                          )}
                          {locText && (
                            <div><span style={{ color: "var(--ink-muted)" }}>Location:</span> <span style={{ fontWeight: 600 }}>{locText}</span></div>
                          )}
                        </div>
                        {photosShown > 0 && (
                          <div style={{ display: "flex", gap: 6 }}>
                            {Array.from({ length: photosShown }).map((_, i) => (
                              <div key={i} style={{ width: 48, height: 48, backgroundColor: "var(--brand-green-muted)", border: "1px solid var(--line)" }} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState title="No Data Yet" body="Start filling the form to see a live preview." />
                    )}
                  </Panel>
                </div>
              </div>
            )}

            {/* Success state */}
            {successP > 0.5 && submitP < 0.5 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, backgroundColor: "var(--surface)" }}>
                <SuccessCheckmark progress={1} size={64} />
                <p style={{ fontSize: 16, fontWeight: 600 }}>Lot submitted for review</p>
                <StatusBadge status="pending_review" />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Transition Overlay ── */}
      {showTransition && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
          {/* Vertical green line */}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 1.5, height: lerp(0, 400, easeOutCubic(rangeProgress(scaleDownP, 0.2, 0.6))), backgroundColor: "var(--brand-green)", transform: "translate(-50%, -50%)" }} />
          {/* Text */}
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink)", opacity: easeOutCubic(rangeProgress(scaleDownP, 0.4, 0.7)) }}>
            Meanwhile, at SurplusLink HQ…
          </p>
        </div>
      )}
    </div>
  );

  return { element, camera, cursor };
}
