"use client";

import { useRef, useState, useEffect } from "react";
import { SCENES } from "../core/types";

/**
 * ScrollStage — wraps the Stage in a scroll-driven container.
 * Creates a tall invisible scrollable div, and maps scroll position to progress (0–1).
 */
export function ScrollStage({
  children,
  totalHeight = 28000,
}: {
  children: (progress: number) => React.ReactNode;
  totalHeight?: number;
}) {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let targetP = 0;
    let currentP = 0;
    let rafId: number;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = totalHeight - window.innerHeight;
      targetP = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;
    };

    const loop = () => {
      currentP += (targetP - currentP) * 0.1;
      if (Math.abs(targetP - currentP) > 0.0001) {
        setProgress(currentP);
      } else {
        setProgress(targetP);
        currentP = targetP;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [totalHeight]);

  return (
    <>
      {/* Fixed viewport layer — the Stage renders here */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {children(progress)}
      </div>

      {/* Scrollable spacer */}
      <div
        ref={containerRef}
        style={{
          height: totalHeight,
          position: "relative",
          zIndex: 0,
        }}
      />

      {/* Progress bar at top */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 9998,
          backgroundColor: "var(--line)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: "var(--brand-green)",
            transition: "width 0.05s linear",
          }}
        />
      </div>

      {/* Scene label at bottom */}
      <SceneLabel progress={progress} />
    </>
  );
}

/* ── Scene Label ── */
function SceneLabel({ progress }: { progress: number }) {
  const scene = SCENES.find((s) => progress >= s.start && progress < s.end) ?? SCENES[SCENES.length - 1];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        padding: "6px 16px",
        backgroundColor: "rgba(5, 5, 5, 0.75)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "var(--paper)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        fontFamily: "var(--font-sans)",
        pointerEvents: "none",
      }}
    >
      {scene.label}
    </div>
  );
}
