"use client";

import type { CursorState } from "./types";
import { cursorPercentToPixels } from "./utils";

/**
 * AnimatedCursor — a custom SVG cursor overlay positioned absolutely.
 * The sharp, angular pointer matches the SurplusLink design language
 * (no rounded corners, brand-green accent).
 */
export function AnimatedCursor({ state }: { state: CursorState }) {
  if (!state.visible) return null;

  const isClick = state.state === "click";
  const isHover = state.state === "hover";
  const scale = isClick ? 0.85 : 1;
  const position = cursorPercentToPixels(state);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 9999,
        pointerEvents: "none",
        transform: `translate3d(${position.x - 2}px, ${position.y - 2}px, 0)`,
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          transition: "transform 0.1s ease",
          willChange: "transform",
        }}
      >
        {/* Main pointer SVG — sharp angular shape */}
        <svg
          width="24"
          height="32"
          viewBox="0 0 24 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
        >
          <path
            d="M2 2L2 26L8 20L14 30L18 28L12 18L20 18L2 2Z"
            fill="var(--ink)"
            stroke="var(--brand-green)"
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
        </svg>

        {/* Hover ring */}
        {isHover && (
          <div
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              width: 28,
              height: 28,
              border: "2px solid var(--brand-green)",
              opacity: 0.4,
              animation: "demo-cursor-ring 1s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}
