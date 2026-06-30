"use client";

import { useEffect, useState } from "react";
import type { CameraState } from "./types";

/**
 * Camera — a viewport wrapper that simulates zoom and pan via CSS transforms.
 * Renders at a fixed 1440×900 internal resolution inside a mock browser window,
 * responsively scaled to fit the user's actual viewport.
 */
export function Camera({
  state,
  overlay,
  children,
}: {
  state: CameraState;
  overlay?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [baseScale, setBaseScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const CANVAS_W = 1440;
      const CANVAS_H = 900;
      const PADDING = 48; // Padding around the window
      
      const availableW = window.innerWidth - PADDING * 2;
      const availableH = window.innerHeight - PADDING * 2;

      const scaleX = availableW / CANVAS_W;
      const scaleY = availableH / CANVAS_H;
      // Fit within the viewport, but cap at 1.0 so it doesn't get pixelated on huge screens
      const scale = Math.min(scaleX, scaleY, 1.0);
      
      setBaseScale(scale);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#050505", // Dark background outside the window
      }}
    >
      {/* The responsive scaling wrapper */}
      <div
        style={{
          width: 1440,
          height: 900,
          transform: `scale(${baseScale})`,
          transformOrigin: "center center",
          position: "relative",
          backgroundColor: "var(--paper)",
          borderRadius: 12,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden", // clip the app content inside the window
        }}
      >
        {/* MacOS-style Window Header */}
        <div style={{
          height: 32,
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          position: "relative",
          zIndex: 9999, // above everything
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ED6A5E" }} />
          <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#F4BF4F" }} />
          <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#61C554" }} />
          <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 12, fontWeight: 500, color: "var(--ink-muted)", pointerEvents: "none" }}>
            surpluslink.com
          </div>
        </div>

        {/* The actual Camera Viewport */}
        <div style={{
          position: "absolute",
          top: 32,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `scale(${state.scale}) translate(${state.x}%, ${state.y}%)`,
              transformOrigin: "center center",
              willChange: "transform",
              position: "relative",
            }}
          >
            {children}
          </div>
        </div>

        {overlay}
      </div>
    </div>
  );
}
