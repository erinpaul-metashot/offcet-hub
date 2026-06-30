/**
 * remotion/RemotionStage.tsx
 *
 * A Remotion-compatible Stage that re-uses the existing scene components.
 * This avoids duplicating scene logic — we import the scene functions directly.
 *
 * Key differences from the Next.js Stage:
 *   - No "use client" (Remotion is its own bundler, not Next.js)
 *   - Camera applies transforms inside a fixed 1440x900 frame (no CSS viewport units)
 *   - AnimatedCursor positions use pixel coords (not viewport %)
 *   - No useEffect/useState — everything is purely derived from `progress`
 */

import React from "react";
import type { SceneOutput, CameraState, CursorState } from "../components/demo/core/types";
import { cursorPercentToPixels, rangeProgress } from "../components/demo/core/utils";

/* ── Scene imports — these are pure functions, safe to use anywhere ── */
import { Act1Opening } from "../components/demo/scenes/Act1Opening";
import { Act2Registration } from "../components/demo/scenes/Act2Registration";
import { Act3CreateLot } from "../components/demo/scenes/Act3CreateLot";
import { Act4AdminReview } from "../components/demo/scenes/Act4AdminReview";
import { Act5AdminAssign } from "../components/demo/scenes/Act5AdminAssign";
import { Act6BuyerResponse } from "../components/demo/scenes/Act6BuyerResponse";
import { Act7Closing } from "../components/demo/scenes/Act7Closing";

function renderScene(progress: number): SceneOutput {
  if (progress < 0.080) return Act1Opening({ progress: rangeProgress(progress, 0.000, 0.080) });
  if (progress < 0.180) return Act2Registration({ progress: rangeProgress(progress, 0.080, 0.180) });
  if (progress < 0.380) return Act3CreateLot({ progress: rangeProgress(progress, 0.180, 0.380) });
  if (progress < 0.530) return Act4AdminReview({ progress: rangeProgress(progress, 0.380, 0.530) });
  if (progress < 0.700) return Act5AdminAssign({ progress: rangeProgress(progress, 0.530, 0.700) });
  if (progress < 0.850) return Act6BuyerResponse({ progress: rangeProgress(progress, 0.700, 0.850) });
  return Act7Closing({ progress: rangeProgress(progress, 0.850, 1.000) });
}

/* ── Remotion Camera ── */
function RemotionCamera({
  state,
  children,
}: {
  state: CameraState;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 1440,
        height: 900,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--paper)",
      }}
    >
      {/* macOS window chrome */}
      <div style={{
        height: 32,
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        gap: 8,
        position: "relative",
        zIndex: 100,
        flexShrink: 0,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ED6A5E" }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#F4BF4F" }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#61C554" }} />
        <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 12, fontWeight: 500, color: "#999", pointerEvents: "none", fontFamily: "var(--font-sans)" }}>
          surpluslink.com
        </div>
      </div>

      {/* Viewport area */}
      <div style={{
        position: "absolute",
        top: 32,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}>
        <div style={{
          width: "100%",
          height: "100%",
          transform: `scale(${state.scale}) translate(${state.x}%, ${state.y}%)`,
          transformOrigin: "center center",
          position: "relative",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Remotion Cursor (pixel-positioned within 1440×868 viewport) ── */
function RemotionCursor({ state }: { state: CursorState }) {
  if (!state.visible) return null;

  const { x, y } = cursorPercentToPixels(state);
  const isClick = state.state === "click";
  const isHover = state.state === "hover";

  return (
    <div style={{
      position: "absolute",
      left: x,
      top: y,
      zIndex: 9999,
      pointerEvents: "none",
      transform: `translate(-2px, -2px) scale(${isClick ? 0.85 : 1})`,
    }}>
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
        <path
          d="M2 2L2 26L8 20L14 30L18 28L12 18L20 18L2 2Z"
          fill="#050505"
          stroke="#1a5632"
          strokeWidth="1.5"
          strokeLinejoin="miter"
        />
      </svg>
      {isHover && (
        <div style={{
          position: "absolute",
          left: 6,
          top: 6,
          width: 28,
          height: 28,
          border: "2px solid #1a5632",
          opacity: 0.4,
        }} />
      )}
    </div>
  );
}

/* ── RemotionStage (root export) ── */
export function RemotionStage({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const sceneOutput = renderScene(clamped);

  return (
    <div style={{ width: 1440, height: 900, position: "relative", overflow: "hidden", backgroundColor: "#050505" }}>
      <RemotionCamera state={sceneOutput.camera}>
        <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
          {sceneOutput.element}
        </div>
      </RemotionCamera>
      <RemotionCursor state={sceneOutput.cursor} />
    </div>
  );
}
