"use client";

import type { SceneOutput } from "@/components/demo/core/types";
import { cursorScreenKeyframes, rangeProgress, lerp, easeOutCubic } from "@/components/demo/core/utils";
import { Button, Panel, StatusBadge, Textarea } from "@/components/demo/ui";
import { BUYER_1, BUYER_2, AGENT, NON_MATCH_USERS, DEMO_LOT, ADMIN, ADMIN_NAV, ASSIGNMENT_NOTE } from "@/components/demo/core/mock-data";
import { LayoutDashboard, Users, Package, FileText, Check } from "lucide-react";

const ALL_CANDIDATES = [BUYER_1, BUYER_2, AGENT, ...NON_MATCH_USERS];
const SMART_ORDER = [BUYER_1, BUYER_2, AGENT, ...NON_MATCH_USERS];

/**
 * Act 5 — Admin Assigns
 * Scene 5.1: Select lot, view candidates, toggle smart matching
 * Scene 5.2: Multi-select, type notes, assign, transition out
 */
export function Act5AdminAssign({ progress }: { progress: number }): SceneOutput {
  const matchP = rangeProgress(progress, 0, 0.4);
  const assignP = rangeProgress(progress, 0.4, 1.0);

  /* ── Smart match toggle ── */
  const lotSelect = rangeProgress(matchP, 0.05, 0.15);
  const candidatesFade = easeOutCubic(rangeProgress(matchP, 0.15, 0.35));
  const smartToggle = rangeProgress(matchP, 0.5, 0.7);
  const isSmartOn = smartToggle > 0.5;

  /* ── Multi-select ── */
  const check1 = rangeProgress(assignP, 0, 0.13);
  const check2 = rangeProgress(assignP, 0.13, 0.22);
  const check3 = rangeProgress(assignP, 0.22, 0.30);
  const actionBarP = easeOutCubic(rangeProgress(assignP, 0.28, 0.35));
  const noteP = rangeProgress(assignP, 0.30, 0.47);
  const assignBtnP = rangeProgress(assignP, 0.47, 0.55);
  const successP = easeOutCubic(rangeProgress(assignP, 0.55, 0.70));
  const transitionP = easeOutCubic(rangeProgress(assignP, 0.70, 1.0));

  const checkedCount = (check1 > 0.5 ? 1 : 0) + (check2 > 0.5 ? 1 : 0) + (check3 > 0.5 ? 1 : 0);
  const noteText = ASSIGNMENT_NOTE.substring(0, Math.floor(noteP * ASSIGNMENT_NOTE.length));

  /* ── Camera ── */
  const cameraAt = (sceneProgress: number) => {
    const assignProgress = rangeProgress(sceneProgress, 0.4, 1.0);
    const transitionProgress = easeOutCubic(rangeProgress(assignProgress, 0.70, 1.0));

    if (transitionProgress > 0) {
      const s = lerp(0.85, 0.35, transitionProgress);
      return { scale: s, x: lerp(0, 30, transitionProgress), y: 0 };
    }
    return { scale: 0.85, x: 0, y: 0 };
  };

  const camera = cameraAt(progress);

  /* ── Cursor ── */
  const cursor = cursorScreenKeyframes(progress, cameraAt, [
    { at: 0.00, x: 33, y: 15, visible: false, state: "idle" },
    { at: 0.06, x: 33, y: 29, visible: true, state: "hover" },
    { at: 0.11, x: 33, y: 29, state: "click" },
    { at: 0.18, x: 82, y: 26, state: "hover" },
    { at: 0.22, x: 82, y: 26, state: "click" },
    { at: 0.38, x: 40, y: 36, state: "hover" },
    { at: 0.42, x: 40, y: 36, state: "click" },
    { at: 0.48, x: 40, y: 42, state: "hover" },
    { at: 0.51, x: 40, y: 42, state: "click" },
    { at: 0.56, x: 40, y: 47, state: "hover" },
    { at: 0.59, x: 40, y: 47, state: "click" },
    { at: 0.65, x: 80, y: 74, state: "hover" },
    { at: 0.70, x: 80, y: 74, state: "click" },
    { at: 0.72, x: 60, y: 24, state: "hover" },
    { at: 0.75, x: 60, y: 24, state: "click" },
    { at: 0.80, x: 60, y: 24, visible: false, state: "idle" },
  ]);

  const showMainView = transitionP < 0.8;

  const element = (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", opacity: showMainView ? 1 : 1 - transitionP }}>
        {/* ── Sidebar ── */}
        <aside style={{ width: "18%", minWidth: 180, borderRight: "1px solid var(--line)", backgroundColor: "var(--paper)", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green-light)", textTransform: "uppercase" }}>SurplusLink</span>
          </div>
          <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {ADMIN_NAV.map((item, i) => {
              const icons = [<LayoutDashboard key="ld" size={18} />, <Users key="u" size={18} />, <Package key="p" size={18} />, <FileText key="ft" size={18} />];
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 6, fontSize: 14, fontWeight: 500, backgroundColor: i === 3 ? "var(--brand-green-muted)" : "transparent", color: i === 3 ? "var(--brand-green)" : "var(--ink-muted)" }}>
                  {icons[i]}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{ADMIN.name}</p>
            <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{ADMIN.email}</p>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, backgroundColor: "var(--surface)", overflow: "hidden", padding: 32 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.05em", marginBottom: 32 }}>Assignments</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
              {/* ── Left: Lot Explorer ── */}
              <Panel style={{ padding: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 12 }}>Supply Lots</p>
                <div style={{ padding: 12, border: lotSelect > 0.5 ? "2px solid var(--brand-green)" : "1px solid var(--line)", backgroundColor: lotSelect > 0.5 ? "var(--brand-green-muted)" : "transparent", marginBottom: 8, transition: "all 0.2s" }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{DEMO_LOT.title}</p>
                  <p style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{DEMO_LOT.category} · $18,500</p>
                </div>
                <div style={{ padding: 12, border: "1px solid var(--line)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>Galvanised Steel Sheets</p>
                  <p style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>Metals · $32,000</p>
                </div>
              </Panel>

              {/* ── Right: Candidates Panel ── */}
              <Panel style={{ overflow: "hidden" }}>
                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", borderBottom: successP > 0.5 ? "none" : "2px solid var(--brand-green)", color: successP > 0.5 ? "var(--ink-muted)" : "var(--brand-green)" }}>Recruit Candidates</div>
                  <div style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: successP > 0.5 ? "var(--brand-green)" : "var(--ink-muted)", borderBottom: successP > 0.5 ? "2px solid var(--brand-green)" : "none" }}>Active Assignments</div>
                </div>

                {/* Smart Match toggle */}
                {lotSelect > 0.5 && successP < 0.3 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Smart Matches</span>
                    <div style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: isSmartOn ? "var(--brand-green)" : "var(--line-strong)", padding: 2, cursor: "pointer", transition: "background-color 0.2s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "white", transform: `translateX(${isSmartOn ? 18 : 0}px)`, transition: "transform 0.2s" }} />
                    </div>
                  </div>
                )}

                {/* Candidate rows OR Active Assignments */}
                <div style={{ padding: 16 }}>
                  {successP < 0.5 ? (
                    /* Recruit Candidates view */
                    lotSelect > 0.5 ? (
                      <div style={{ opacity: candidatesFade }}>
                        {(isSmartOn ? SMART_ORDER : ALL_CANDIDATES).map((user, i) => {
                          const isMatch = user.isSmartMatch;
                          const dimmed = isSmartOn && !isMatch;
                          const isChecked = (i === 0 && check1 > 0.5) || (i === 1 && check2 > 0.5) || (i === 2 && check3 > 0.5);
                          return (
                            <div key={user.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderBottom: "1px solid var(--line)", opacity: dimmed ? 0.4 : 1, backgroundColor: isChecked ? "var(--brand-green-muted)" : "transparent", transition: "all 0.3s" }}>
                              {/* Checkbox */}
                              <div style={{ width: 20, height: 20, border: isChecked ? "none" : "1.5px solid var(--line-strong)", backgroundColor: isChecked ? "var(--brand-green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {isChecked && <Check size={14} color="white" strokeWidth={3} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</span>
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 8px", border: "1px solid var(--line)", color: "var(--ink-muted)" }}>{user.role}</span>
                                  {isSmartOn && isMatch && (
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 6px", backgroundColor: "var(--brand-green)", color: "white" }}>Smart Match</span>
                                  )}
                                </div>
                                <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{user.business}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: "grid", placeItems: "center", minHeight: 200, border: "1px dashed var(--line)", padding: 24, textAlign: "center" }}>
                        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>Select a lot to view candidates</p>
                      </div>
                    )
                  ) : (
                    /* Active Assignments view */
                    <div>
                      {[BUYER_1, BUYER_2, AGENT].map((user, i) => {
                        const rowP = easeOutCubic(rangeProgress(successP, 0.3 + i * 0.1, 0.5 + i * 0.1));
                        return (
                          <div key={user.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderBottom: "1px solid var(--line)", opacity: rowP }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</p>
                              <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>{user.business}</p>
                            </div>
                            <StatusBadge status="pending" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action bar */}
                {checkedCount > 0 && successP < 0.3 && (
                  <div style={{ borderTop: "1px solid var(--line)", padding: 16, backgroundColor: "var(--paper)", opacity: actionBarP, transform: `translateY(${lerp(20, 0, actionBarP)}px)` }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-green)", marginBottom: 8 }}>{checkedCount} candidate{checkedCount > 1 ? "s" : ""} selected</p>
                    <div style={{ marginBottom: 12 }}>
                      <Textarea value={noteText} readOnly placeholder="Add assignment notes…" style={{ minHeight: 48, fontSize: 13 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button variant="primary" size="sm" disabled={assignBtnP >= 0.5} style={assignBtnP >= 0.5 ? { opacity: 0.5 } : undefined}>
                        {assignBtnP >= 0.5 ? "Assigning…" : "Assign Selected"}
                      </Button>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </main>
      </div>

      {/* ── Transition Overlay ── */}
      {transitionP > 0.2 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 1.5, height: lerp(0, 400, easeOutCubic(rangeProgress(transitionP, 0.2, 0.6))), backgroundColor: "var(--brand-green)", transform: "translate(-50%, -50%)" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--ink)", opacity: easeOutCubic(rangeProgress(transitionP, 0.4, 0.7)) }}>
            On the buyer&apos;s screen…
          </p>
        </div>
      )}
    </div>
  );

  return { element, camera, cursor };
}
