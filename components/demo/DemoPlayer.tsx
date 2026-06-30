"use client";

import { Player } from "@remotion/player";
import { SurplusLinkDemo } from "@/remotion/SurplusLinkDemo";

/**
 * DemoPlayer — embeds the Remotion composition directly inside the Next.js app
 * using @remotion/player. No video file needed — renders in-browser.
 */
export function DemoPlayer() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 25px 60px -12px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Player
        component={SurplusLinkDemo}
        durationInFrames={1800}
        fps={30}
        compositionWidth={1440}
        compositionHeight={900}
        style={{
          width: "100%",
          aspectRatio: "1440 / 900",
        }}
        controls
        loop
        autoPlay={false}
        clickToPlay
        showVolumeControls={false}
        renderLoading={() => (
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#050505",
            color: "#1a5632",
            fontFamily: "var(--font-display)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}>
            Loading Demo…
          </div>
        )}
      />
    </div>
  );
}
