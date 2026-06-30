/**
 * remotion/SurplusLinkDemo.tsx
 *
 * The main Remotion composition. Maps `useCurrentFrame()` → progress (0-1),
 * then renders the demo through a Remotion-aware Stage that does NOT use
 * Next.js-specific "use client" or React 19 features that Remotion can't bundle.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { RemotionStage } from "./RemotionStage";

// Import global styles (including Tailwind v4)
import "../app/globals.css";

export const SurplusLinkDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Map frame → progress with easing so each scene feels natural
  const rawProgress = frame / durationInFrames;

  // Slight ease-in at start, ease-out at end — middle is linear
  const progress = interpolate(rawProgress, [0, 0.03, 0.97, 1], [0, 0.03, 0.97, 1], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div 
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        console.log(`[Demo Tracker] x: ${Math.round(x)}, y: ${Math.round(y)} | progress: ${progress.toFixed(4)} | frame: ${frame}`);
      }}
    >
      {/* Global font import — Remotion injects this into the headless browser */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #050505;
          --ink-muted: #666666;
          --paper: #ffffff;
          --surface: #f8f8f7;
          --muted: #f2f2f2;
          --line: #e5e5e5;
          --line-strong: #c8c8c8;
          --brand-green: #1a5632;
          --brand-green-light: #2d7a4a;
          --brand-green-muted: #e8f4ed;
          --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-display: 'Outfit', system-ui, sans-serif;
        }

        /* Demo keyframes */
        @keyframes demo-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes demo-cursor-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.15); }
        }
        @keyframes demo-pulse-border {
          0%, 100% { border-color: rgba(26, 86, 50, 0.3); }
          50% { border-color: rgba(26, 86, 50, 0.6); }
        }
      `}</style>
      <RemotionStage progress={progress} />
    </div>
  );
};
