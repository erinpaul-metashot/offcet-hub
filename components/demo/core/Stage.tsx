"use client";

import type { SceneOutput } from "./types";
import { Camera } from "./Camera";
import { AnimatedCursor } from "./AnimatedCursor";
import { rangeProgress } from "./utils";

/* ── Scene imports ── */
import { Act1Opening } from "../scenes/Act1Opening";
import { Act2Registration } from "../scenes/Act2Registration";
import { Act3CreateLot } from "../scenes/Act3CreateLot";
import { Act4AdminReview } from "../scenes/Act4AdminReview";
import { Act5AdminAssign } from "../scenes/Act5AdminAssign";
import { Act6BuyerResponse } from "../scenes/Act6BuyerResponse";
import { Act7Closing } from "../scenes/Act7Closing";

/* ── Scene render function map ── */
function renderScene(progress: number): SceneOutput {
  /* Act 1 — Opening */
  if (progress < 0.080) {
    return Act1Opening({ progress: rangeProgress(progress, 0.000, 0.080) });
  }
  /* Act 2 — Registration */
  if (progress < 0.180) {
    return Act2Registration({ progress: rangeProgress(progress, 0.080, 0.180) });
  }
  /* Act 3 — Supplier Creates Lot */
  if (progress < 0.380) {
    return Act3CreateLot({ progress: rangeProgress(progress, 0.180, 0.380) });
  }
  /* Act 4 — Admin Reviews */
  if (progress < 0.530) {
    return Act4AdminReview({ progress: rangeProgress(progress, 0.380, 0.530) });
  }
  /* Act 5 — Admin Assigns */
  if (progress < 0.700) {
    return Act5AdminAssign({ progress: rangeProgress(progress, 0.530, 0.700) });
  }
  /* Act 6 — Buyer Responds */
  if (progress < 0.850) {
    return Act6BuyerResponse({ progress: rangeProgress(progress, 0.700, 0.850) });
  }
  /* Act 7 — Closing */
  return Act7Closing({ progress: rangeProgress(progress, 0.850, 1.000) });
}

/**
 * Stage — the root orchestrator.
 * Receives a normalized progress (0–1) and renders the active scene
 * with the correct camera and cursor state.
 */
export function Stage({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const sceneOutput = renderScene(clamped);

  return (
    <>
      <Camera state={sceneOutput.camera} overlay={<AnimatedCursor state={sceneOutput.cursor} />}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {sceneOutput.element}
        </div>
      </Camera>
    </>
  );
}
