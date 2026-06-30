"use client";

import { DemoPlayer } from "@/components/demo/DemoPlayer";

/**
 * /demo-video — SurplusLink product demo powered by Remotion.
 * Renders the animation directly in-browser using @remotion/player.
 * Use `npm run remotion:studio` to open the full Remotion editor.
 * Use `npm run remotion:render` to export as an MP4 file.
 */
export default function DemoVideoPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "var(--font-sans)",
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.32em", color: "var(--brand-green)", textTransform: "uppercase", fontFamily: "var(--font-display)", marginBottom: 12 }}>
          SURPLUSLINK
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em", color: "#ffffff", lineHeight: 1.2 }}>
          Product Video
        </h1>
        <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
          60 seconds · 1440×900 · 30fps
        </p>
      </div>

      {/* Player */}
      <DemoPlayer />

      {/* Footer links */}
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand-green)", textDecoration: "none", borderBottom: "1px solid rgba(26,86,50,0.3)", paddingBottom: 2 }}
        >
          Open Remotion Studio →
        </a>
        <span style={{ color: "#333" }}>|</span>
        <span style={{ fontSize: 12, color: "#444", letterSpacing: "0.12em" }}>
          Run <code style={{ color: "#888", fontFamily: "monospace" }}>npm run remotion:render</code> to export MP4
        </span>
      </div>
    </div>
  );
}
