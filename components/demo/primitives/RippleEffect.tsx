"use client";

import type { CSSProperties } from "react";
import { easeOutCubic } from "@/components/demo/core/utils";

/**
 * RippleEffect — an expanding circle that fades out.
 * progress: 0 = small dot, 1 = fully expanded and faded.
 */
export function RippleEffect({
  progress,
  color = "var(--brand-green)",
  maxSize = 120,
  style,
}: {
  progress: number;
  color?: string;
  maxSize?: number;
  style?: CSSProperties;
}) {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0) return null;

  const easedScale = easeOutCubic(p);
  const size = maxSize * easedScale;
  const opacity = 1 - p;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        borderRadius: 0, // sharp corners matching design language
        border: `2px solid ${color}`,
        opacity,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
