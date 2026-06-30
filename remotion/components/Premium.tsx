import React from "react";
import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { COLORS, FONT } from "../utils/styles";

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.77, 0, 0.175, 1);

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function frameProgress(
  frame: number,
  start: number,
  end: number,
  easing: (input: number) => number = easeOut,
): number {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

export function softFloat(frame: number, amplitude = 8, speed = 0.045, phase = 0): number {
  return Math.sin(frame * speed + phase) * amplitude;
}

export const premiumEase = easeOut;
export const premiumEaseInOut = easeInOut;

export function CinematicBackdrop({
  frame,
  glow = 1,
  grid = true,
}: {
  frame: number;
  glow?: number;
  grid?: boolean;
}) {
  const drift = interpolate(frame, [0, 240], [-8, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#040504", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 560px at 52% 86%, rgba(26,86,50,0.34), transparent 68%), radial-gradient(760px 420px at 70% 24%, rgba(255,255,255,0.055), transparent 62%), linear-gradient(180deg, #050605 0%, #080a08 52%, #020302 100%)",
          opacity: glow,
          transform: `translateY(${drift}px)`,
        }}
      />
      {grid && (
        <div
          style={{
            position: "absolute",
            inset: -80,
            backgroundSize: "84px 84px",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.018) 1px, transparent 1px)",
            transform: "perspective(900px) rotateX(62deg) translateY(180px)",
            transformOrigin: "center bottom",
            opacity: 0.5,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.58) 100%)",
        }}
      />
      <FilmGrain opacity={0.1} />
    </AbsoluteFill>
  );
}

export function FilmGrain({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "screen",
        backgroundImage:
          "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 0 1px, transparent 1px), radial-gradient(circle at 72% 44%, rgba(255,255,255,0.65) 0 1px, transparent 1px), radial-gradient(circle at 38% 78%, rgba(255,255,255,0.5) 0 1px, transparent 1px)",
        backgroundSize: "17px 19px, 23px 29px, 31px 37px",
        pointerEvents: "none",
      }}
    />
  );
}

export function LightSweep({
  frame,
  start,
  end,
  opacity = 0.45,
  angle = -12,
  color = "rgba(255,255,255,0.85)",
}: {
  frame: number;
  start: number;
  end: number;
  opacity?: number;
  angle?: number;
  color?: string;
}) {
  const p = frameProgress(frame, start, end, premiumEaseInOut);
  const x = interpolate(p, [0, 1], [-55, 155]);
  const fade = interpolate(p, [0, 0.12, 0.82, 1], [0, opacity, opacity, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "-22%",
        bottom: "-22%",
        left: `${x}%`,
        width: 250,
        opacity: fade,
        transform: `rotate(${angle}deg)`,
        background: `linear-gradient(90deg, transparent 0%, ${color} 48%, transparent 100%)`,
        filter: "blur(24px)",
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
}

export function ScanBand({
  frame,
  start,
  end,
  top = "43%",
  height = 120,
  opacity = 0.68,
}: {
  frame: number;
  start: number;
  end: number;
  top?: number | string;
  height?: number;
  opacity?: number;
}) {
  const p = frameProgress(frame, start, end, premiumEaseInOut);
  const y = interpolate(p, [0, 1], [-220, 220]);
  const alpha = interpolate(p, [0, 0.1, 0.84, 1], [0, opacity, opacity, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "-8%",
        right: "-8%",
        top,
        height,
        opacity: alpha,
        transform: `translateY(${y}px)`,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.2) 24%, rgba(26,86,50,0.3) 48%, rgba(255,255,255,0.16) 66%, transparent 100%)",
        filter: "blur(10px)",
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
}

export function BrowserSlab({
  frame,
  children,
  delay = 0,
  width = 1480,
  height = 820,
  rotateX = 8,
  rotateY = -12,
  rotateZ = -2,
  x = 0,
  y = 0,
  scale = 1,
  chromeTitle = "surpluslink.com",
  style,
}: {
  frame: number;
  children: React.ReactNode;
  delay?: number;
  width?: number;
  height?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  x?: number;
  y?: number;
  scale?: number;
  chromeTitle?: string;
  style?: CSSProperties;
}) {
  const enter = frameProgress(frame, delay, delay + 28);
  const opacity = frameProgress(frame, delay, delay + 16);
  const depthY = interpolate(enter, [0, 1], [72, 0]);
  const depthScale = interpolate(enter, [0, 1], [0.94, scale]);
  const blur = interpolate(enter, [0, 1], [10, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        height,
        opacity,
        transform: `translate(-50%, -50%) translate(${x}px, ${y + depthY}px) perspective(1600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${depthScale})`,
        transformStyle: "preserve-3d",
        filter: `blur(${blur}px)`,
        borderRadius: 24,
        boxShadow:
          "0 42px 130px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.16), 0 0 95px rgba(26,86,50,0.18)",
        overflow: "hidden",
        backgroundColor: COLORS.paper,
        ...style,
      }}
    >
      <div
        style={{
          height: 42,
          background: "linear-gradient(180deg, #141414, #050505)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          color: "rgba(255,255,255,0.52)",
          fontSize: 11,
          fontFamily: FONT.sans,
          letterSpacing: "0.08em",
        }}
      >
        <div style={{ width: 11, height: 11, borderRadius: 11, backgroundColor: "#f2675f" }} />
        <div style={{ width: 11, height: 11, borderRadius: 11, backgroundColor: "#f3bd4f" }} />
        <div style={{ width: 11, height: 11, borderRadius: 11, backgroundColor: "#62c554" }} />
        <div
          style={{
            marginLeft: 16,
            height: 22,
            minWidth: 360,
            borderRadius: 11,
            backgroundColor: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
          }}
        >
          https://{chromeTitle}
        </div>
      </div>
      <div style={{ position: "absolute", top: 42, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        {children}
      </div>
      <LightSweep frame={frame} start={delay + 12} end={delay + 58} opacity={0.2} />
    </div>
  );
}

export function DepthShadow({
  frame,
  delay = 0,
  width = 980,
  height = 150,
  y = 330,
}: {
  frame: number;
  delay?: number;
  width?: number;
  height?: number;
  y?: number;
}) {
  const opacity = interpolate(frame, [delay, delay + 28], [0, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        height,
        opacity,
        transform: `translate(-50%, -50%) translateY(${y}px)`,
        background: "radial-gradient(ellipse, rgba(0,0,0,0.72), transparent 68%)",
        filter: "blur(34px)",
      }}
    />
  );
}

export function SectionKicker({
  frame,
  children,
  delay = 0,
}: {
  frame: number;
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = frameProgress(frame, delay, delay + 14);
  const x = interpolate(opacity, [0, 1], [-18, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 42,
        left: 58,
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: 42,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.brandGreen})`,
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.34em",
          color: COLORS.brandGreen,
          textTransform: "uppercase",
          fontFamily: FONT.sans,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export function ApprovalPill({
  frame,
  start,
  text,
  subtext,
}: {
  frame: number;
  start: number;
  text: string;
  subtext?: string;
}) {
  const p = frameProgress(frame, start, start + 18);
  const opacity = interpolate(p, [0, 1], [0, 1]);
  const scale = interpolate(p, [0, 1], [0.95, 1]);
  const y = interpolate(p, [0, 1], [24, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translateY(${y}px) scale(${scale})`,
        opacity,
        width: subtext ? 650 : 560,
        minHeight: subtext ? 122 : 92,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 6,
        color: COLORS.white,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.14), rgba(26,86,50,0.78) 42%, rgba(255,255,255,0.2))",
        border: "1px solid rgba(255,255,255,0.34)",
        boxShadow:
          "0 0 44px rgba(26,86,50,0.5), 0 24px 90px rgba(0,0,0,0.48), inset 0 0 38px rgba(255,255,255,0.18)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        zIndex: 80,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: FONT.display }}>
        {text}
      </div>
      {subtext && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.64)",
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

export function BrandLockup({
  frame,
  start = 0,
  size = 72,
  subtitle,
}: {
  frame: number;
  start?: number;
  size?: number;
  subtitle?: string;
}) {
  const p = frameProgress(frame, start, start + 28);
  const opacity = frameProgress(frame, start, start + 12);
  const y = interpolate(p, [0, 1], [28, 0]);
  const scale = interpolate(p, [0, 1], [0.96, 1]);

  return (
    <div
      style={{
        textAlign: "center",
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: size,
          fontWeight: 850,
          letterSpacing: "0.26em",
          color: COLORS.white,
          textShadow: "0 0 58px rgba(26,86,50,0.48)",
        }}
      >
        SURPLUS<span style={{ color: COLORS.brandGreen }}>LINK</span>
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 14,
            color: "rgba(255,255,255,0.52)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontFamily: FONT.sans,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
