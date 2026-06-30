/**
 * remotion/SurplusLink3D.tsx
 *
 * SurplusLink premium product film.
 * Bespoke Remotion timeline using cloned SurplusLink UI primitives, not the
 * old interactive stage embedded in a tilted browser slab.
 */

import React, { type CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { COLORS, FONT } from "./utils/styles";
import {
  ADMIN,
  ADMIN_METRICS,
  ADMIN_PENDING_LOTS,
  AGENT,
  ASSIGNMENT_NOTE,
  BUYER_1,
  BUYER_2,
  BUYER_METRICS,
  BUYER_RECENT_ASSIGNMENTS,
  CLOSING_METRICS,
  DEMO_LOT,
  LOT_CATEGORIES,
  NON_MATCH_USERS,
  SUPPLIER,
} from "../components/demo/core/mock-data";
import "../app/globals.css";

const TOTAL_FRAMES = 1214;
const power3Out = Easing.bezier(0.16, 1, 0.3, 1);
const expoOut = Easing.bezier(0.19, 1, 0.22, 1);
const powerInOut = Easing.bezier(0.77, 0, 0.175, 1);
const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

type StatusKey =
  | "draft"
  | "pending_review"
  | "approved"
  | "assigned"
  | "interested";

type Candidate = {
  name: string;
  business: string;
  role: string;
  categories: readonly string[];
  score: number;
  smart: boolean;
};

const MATCH_CANDIDATES: Candidate[] = [
  {
    name: BUYER_1.name,
    business: BUYER_1.business,
    role: "buyer",
    categories: BUYER_1.categories,
    score: 96,
    smart: true,
  },
  {
    name: BUYER_2.name,
    business: BUYER_2.business,
    role: "buyer",
    categories: BUYER_2.categories,
    score: 91,
    smart: true,
  },
  {
    name: AGENT.name,
    business: AGENT.business,
    role: "agent",
    categories: AGENT.categories,
    score: 88,
    smart: true,
  },
  ...NON_MATCH_USERS.slice(0, 3).map((user, index) => ({
    name: user.name,
    business: user.business,
    role: user.role,
    categories: user.categories,
    score: [42, 37, 31][index],
    smart: false,
  })),
];

function cleanText(value: string) {
  return value
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00e2\u20ac\u00a2/g, "*");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function prog(
  frame: number,
  start: number,
  end: number,
  easing: (input: number) => number = power3Out,
) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

function sceneOpacity(frame: number, start: number, end: number, fade = 24) {
  return interpolate(frame, [start, start + fade, end - fade, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: power3Out,
  });
}

function typeText(frame: number, start: number, end: number, text: string) {
  const safeText = cleanText(text);
  const amount = Math.floor(safeText.length * prog(frame, start, end, Easing.linear));
  return safeText.slice(0, amount);
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function textWithCursor(frame: number, value: string, active: boolean) {
  return (
    <>
      {value}
      {active && Math.floor(frame / 7) % 2 === 0 ? (
        <span style={{ color: COLORS.brandGreen }}>_</span>
      ) : null}
    </>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: COLORS.inkMuted,
};

const fieldStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${COLORS.line}`,
  backgroundColor: COLORS.surface,
  color: COLORS.ink,
  padding: "12px 16px",
  fontSize: 14,
  lineHeight: 1.4,
  outline: "none",
  borderRadius: 0,
  boxShadow: "none",
  minHeight: 48,
  fontFamily: FONT.sans,
};

function Backdrop({ frame }: { frame: number }) {
  const drift = interpolate(frame, [0, TOTAL_FRAMES], [-52, 54], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020302", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 560px at 50% 86%, rgba(26,86,50,0.34), transparent 68%), radial-gradient(720px 420px at 82% 18%, rgba(255,255,255,0.08), transparent 62%), linear-gradient(180deg, #070807 0%, #020302 68%, #000 100%)",
          transform: `translateY(${drift * 0.15}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -120,
          backgroundSize: "74px 74px",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
          transform: `perspective(1000px) rotateX(64deg) translateY(${244 + drift * 0.25}px)`,
          transformOrigin: "center bottom",
          opacity: 0.42,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.08) 0.7px, transparent 0.8px)",
          backgroundSize: "100% 3px, 28px 28px",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
}

function LightSweep({
  frame,
  start,
  end,
  angle = -10,
  opacity = 0.24,
}: {
  frame: number;
  start: number;
  end: number;
  angle?: number;
  opacity?: number;
}) {
  const t = prog(frame, start, end, powerInOut);
  const x = interpolate(t, [0, 1], [-35, 130]);
  const alpha = interpolate(t, [0, 0.16, 0.84, 1], [0, opacity, opacity, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "-25%",
        bottom: "-25%",
        left: `${x}%`,
        width: 320,
        opacity: alpha,
        transform: `rotate(${angle}deg)`,
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 48%, rgba(26,86,50,0.38) 56%, transparent 100%)",
        filter: "blur(26px)",
        mixBlendMode: "screen",
      }}
    />
  );
}

function ScanBand({
  frame,
  start,
  end,
  top,
  width = 920,
}: {
  frame: number;
  start: number;
  end: number;
  top: number;
  width?: number;
}) {
  const t = prog(frame, start, end, powerInOut);
  const x = interpolate(t, [0, 1], [-width, 1920 + width]);
  const alpha = interpolate(t, [0, 0.18, 0.82, 1], [0, 0.48, 0.48, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top,
        width,
        height: 126,
        opacity: alpha,
        transform: "translateY(-50%) skewX(-14deg)",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(26,86,50,0.46), rgba(255,255,255,0.2), transparent)",
        filter: "blur(14px)",
        mixBlendMode: "screen",
      }}
    />
  );
}

function EditorialNote({
  frame,
  start,
  kicker,
  title,
  body,
  x,
  y,
  width = 520,
}: {
  frame: number;
  start: number;
  kicker: string;
  title: string;
  body: string;
  x: number;
  y: number;
  width?: number;
}) {
  const show = prog(frame, start, start + 24, expoOut);
  const titleText = typeText(frame, start + 8, start + 40, title);
  const bodyText = typeText(frame, start + 36, start + 96, body);
  const titleActive = titleText.length < title.length;
  const bodyActive = !titleActive && bodyText.length < body.length;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        opacity: show,
        transform: `translateY(${lerp(24, 0, show)}px)`,
        borderLeft: `2px solid ${COLORS.brandGreen}`,
        padding: "18px 22px",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.86), rgba(0,0,0,0.58) 68%, rgba(0,0,0,0))",
        boxShadow: "0 22px 70px rgba(0,0,0,0.26)",
        color: COLORS.white,
        zIndex: 120,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: COLORS.brandGreen,
          marginBottom: 14,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 42,
          lineHeight: 1.02,
          fontWeight: 850,
        }}
      >
        {textWithCursor(frame, titleText, titleActive)}
      </div>
      <div
        style={{
          marginTop: 13,
          minHeight: 62,
          color: "rgba(255,255,255,0.56)",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {textWithCursor(frame, bodyText, bodyActive)}
      </div>
    </div>
  );
}

function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        border: `1px solid ${COLORS.line}`,
        backgroundColor: COLORS.surface,
        color: COLORS.ink,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function StatusBadge({ status, scale = 1 }: { status: StatusKey; scale?: number }) {
  const labels: Record<StatusKey, string> = {
    draft: "Draft",
    pending_review: "Pending review",
    approved: "Approved",
    assigned: "Assigned",
    interested: "Interested",
  };
  const statusStyles: Record<StatusKey, CSSProperties> = {
    draft: {
      border: `1px solid ${COLORS.line}`,
      color: COLORS.inkMuted,
      backgroundColor: "transparent",
    },
    pending_review: {
      border: `1px dashed ${COLORS.lineStrong}`,
      color: COLORS.inkMuted,
      backgroundColor: "transparent",
    },
    approved: {
      border: `1px solid ${COLORS.brandGreen}`,
      color: COLORS.brandGreen,
      backgroundColor: "transparent",
    },
    assigned: {
      border: `1px solid ${COLORS.brandGreen}`,
      color: COLORS.paper,
      backgroundColor: COLORS.brandGreen,
    },
    interested: {
      border: `1px solid ${COLORS.ink}`,
      color: COLORS.ink,
      backgroundColor: COLORS.muted,
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 32,
        padding: "0 12px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transform: `scale(${scale})`,
        transformOrigin: "center",
        ...statusStyles[status],
      }}
    >
      {labels[status]}
    </span>
  );
}

function ButtonLike({
  children,
  variant = "primary",
  pressed = 0,
  style,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  pressed?: number;
  style?: CSSProperties;
}) {
  const variantStyle: CSSProperties =
    variant === "primary"
      ? {
          backgroundColor: COLORS.brandGreen,
          border: `1px solid ${COLORS.brandGreen}`,
          color: COLORS.paper,
        }
      : variant === "secondary"
        ? {
            backgroundColor: COLORS.paper,
            border: `1px solid ${COLORS.ink}`,
            color: COLORS.ink,
          }
        : {
            backgroundColor: "transparent",
            border: `1px solid ${COLORS.line}`,
            color: COLORS.ink,
          };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        transform: `scale(${lerp(1, 0.97, pressed)})`,
        transformOrigin: "center",
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function FieldBlock({
  label,
  value,
  active = false,
  height,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  active?: boolean;
  height?: number;
  muted?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ ...labelStyle, color: active ? COLORS.brandGreen : COLORS.inkMuted }}>
        {label}
      </span>
      <div
        style={{
          ...fieldStyle,
          minHeight: height ?? 48,
          backgroundColor: active ? COLORS.paper : COLORS.surface,
          borderColor: active ? COLORS.brandGreen : COLORS.line,
          boxShadow: active ? "0 0 0 3px rgba(26,86,50,0.08)" : "none",
          color: muted ? COLORS.inkMuted : COLORS.ink,
        }}
      >
        {value}
      </div>
    </label>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent = false,
  progress = 1,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent?: boolean;
  progress?: number;
}) {
  return (
    <Panel
      style={{
        height: "100%",
        padding: 20,
        backgroundColor: accent ? "rgba(232,244,237,0.45)" : COLORS.paper,
        borderColor: accent ? "rgba(26,86,50,0.28)" : COLORS.line,
        opacity: progress,
        transform: `translateY(${lerp(22, 0, progress)}px)`,
      }}
    >
      <p style={{ ...labelStyle, marginBottom: 12 }}>{label}</p>
      <p
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.ink,
          marginBottom: 12,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.inkMuted }}>{hint}</p>
    </Panel>
  );
}

function DashboardHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow: string;
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <Panel
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(26,86,50,0.08), rgba(26,86,50,0.02) 40%, rgba(255,255,255,1) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(26,86,50,0.13), transparent 31%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: right ? "minmax(0, 1fr) 290px" : "minmax(0, 1fr)",
          gap: 24,
          alignItems: "end",
          padding: 28,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: COLORS.brandGreenLight,
              marginBottom: 12,
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              maxWidth: 720,
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.ink,
              marginBottom: 12,
              lineHeight: 1.08,
            }}
          >
            {title}
          </h1>
          <p style={{ maxWidth: 560, fontSize: 15, lineHeight: 1.6, color: COLORS.inkMuted }}>
            {description}
          </p>
        </div>
        {right ? <div style={{ display: "grid", gap: 12 }}>{right}</div> : null}
      </div>
    </Panel>
  );
}

function SectionPanel({
  title,
  description,
  children,
  action,
  style,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Panel style={{ overflow: "hidden", ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          borderBottom: `1px solid ${COLORS.line}`,
          backgroundColor: "rgba(251,251,251,0.86)",
          padding: "16px 20px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.ink,
              marginBottom: description ? 4 : 0,
            }}
          >
            {title}
          </h2>
          {description ? (
            <p style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.inkMuted }}>
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </Panel>
  );
}

function AppSurface({
  children,
  label,
  user,
  style,
}: {
  children: React.ReactNode;
  label: string;
  user: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: 1280,
        height: 780,
        border: "1px solid rgba(255,255,255,0.14)",
        backgroundColor: COLORS.paper,
        boxShadow:
          "0 72px 160px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 0 90px rgba(26,86,50,0.18)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          height: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${COLORS.line}`,
          backgroundColor: COLORS.paper,
          padding: "0 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              backgroundColor: COLORS.brandGreen,
              boxShadow: "0 0 18px rgba(26,86,50,0.6)",
            }}
          />
          <div
            style={{
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "0.12em",
              color: COLORS.ink,
              textTransform: "uppercase",
            }}
          >
            Surplus<span style={{ color: COLORS.brandGreen }}>Link</span>
          </div>
          <div
            style={{
              marginLeft: 10,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: COLORS.inkMuted,
            }}
          >
            {label}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkMuted }}>{user}</div>
      </div>
      {children}
    </div>
  );
}

function SideNav({ active }: { active: string }) {
  const items = ["Overview", "Lots", "New lot", "Assignments"];

  return (
    <aside
      style={{
        width: 226,
        minWidth: 226,
        borderRight: `1px solid ${COLORS.line}`,
        backgroundColor: COLORS.paper,
        padding: 20,
      }}
    >
      <div style={{ ...labelStyle, marginBottom: 20 }}>Workspace</div>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 38,
              padding: "0 12px",
              border: active === item ? `1px solid ${COLORS.brandGreen}` : `1px solid ${COLORS.line}`,
              backgroundColor: active === item ? COLORS.brandGreenMuted : "transparent",
              color: active === item ? COLORS.brandGreen : COLORS.inkMuted,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                backgroundColor: active === item ? COLORS.brandGreen : COLORS.lineStrong,
              }}
            />
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Cursor({
  frame,
  x,
  y,
  visible = true,
  click = 0,
  label,
}: {
  frame: number;
  x: number;
  y: number;
  visible?: boolean;
  click?: number;
  label?: string;
}) {
  const blink = interpolate(click, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idleGlow = 0.3 + Math.sin(frame / 10) * 0.08;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: visible ? 1 : 0,
        transform: `translate(-5px, -5px) scale(${lerp(1, 0.9, click)})`,
        zIndex: 80,
        filter: `drop-shadow(0 14px 22px rgba(0,0,0,0.34)) drop-shadow(0 0 14px rgba(26,86,50,${idleGlow}))`,
      }}
    >
      <svg width="34" height="40" viewBox="0 0 24 30" fill="none">
        <path
          d="M2 2L2 25L8 19L13 28L17 26L12 17L21 17L2 2Z"
          fill="#050505"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M2 2L2 25L8 19L13 28"
          stroke={COLORS.brandGreen}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: -19,
          top: -19,
          width: 50,
          height: 50,
          borderRadius: 999,
          border: `2px solid ${COLORS.brandGreen}`,
          opacity: blink * 0.62,
          transform: `scale(${lerp(0.65, 1.45, blink)})`,
        }}
      />
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 28,
            minWidth: 118,
            padding: "8px 10px",
            backgroundColor: COLORS.ink,
            color: COLORS.paper,
            border: `1px solid ${COLORS.brandGreen}`,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

function pathPosition(
  frame: number,
  points: Array<{ f: number; x: number; y: number; ease?: (input: number) => number }>,
) {
  if (frame <= points[0].f) return points[0];
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    if (frame >= current.f && frame <= next.f) {
      const t = prog(frame, current.f, next.f, current.ease ?? power3Out);
      return { f: frame, x: lerp(current.x, next.x, t), y: lerp(current.y, next.y, t) };
    }
  }
  return points[points.length - 1];
}

function clickPulse(frame: number, at: number, length = 10) {
  const t = Math.abs(frame - at);
  return clamp01(1 - t / length);
}

function AssemblyCard({
  frame,
  start,
  x,
  y,
  w,
  h,
  title,
  body,
  accent = false,
  rotate = 0,
}: {
  frame: number;
  start: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  body: string;
  accent?: boolean;
  rotate?: number;
}) {
  const show = prog(frame, start, start + 28, backOut);
  const float = Math.sin((frame + start) / 34) * 4;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        padding: 20,
        border: accent ? `1px solid ${COLORS.brandGreen}` : `1px solid rgba(255,255,255,0.12)`,
        backgroundColor: accent ? "rgba(232,244,237,0.98)" : "rgba(255,255,255,0.95)",
        color: COLORS.ink,
        opacity: show,
        transform: `translateY(${lerp(62, float, show)}px) rotate(${rotate * show}deg) scale(${lerp(0.86, 1, show)})`,
        boxShadow: accent
          ? "0 28px 90px rgba(0,0,0,0.42), 0 0 44px rgba(26,86,50,0.22)"
          : "0 28px 90px rgba(0,0,0,0.38)",
      }}
    >
      <div style={{ ...labelStyle, color: accent ? COLORS.brandGreen : COLORS.inkMuted }}>
        {title}
      </div>
      <div style={{ marginTop: 14, fontSize: 25, fontWeight: 750, lineHeight: 1.08 }}>{body}</div>
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 20,
          height: 6,
          backgroundColor: COLORS.muted,
        }}
      >
        <div
          style={{
            width: `${accent ? 82 : 52}%`,
            height: "100%",
            backgroundColor: accent ? COLORS.brandGreen : COLORS.lineStrong,
          }}
        />
      </div>
    </div>
  );
}

function OpeningScene({ frame }: { frame: number }) {
  const opacity = sceneOpacity(frame, 0, 165, 24);
  const title = prog(frame, 18, 70, expoOut);
  const systemLock = prog(frame, 95, 140, powerInOut);

  return (
    <AbsoluteFill style={{ opacity }}>
      <LightSweep frame={frame} start={18} end={92} opacity={0.28} />
      <ScanBand frame={frame} start={74} end={134} top={615} width={740} />
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 72,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: COLORS.brandGreen,
        }}
      >
        SurplusLink product system
      </div>
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 178,
          width: 770,
          opacity: title,
          transform: `translateY(${lerp(54, 0, title)}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 106,
            lineHeight: 0.94,
            fontWeight: 900,
            color: COLORS.white,
            textShadow: "0 0 82px rgba(26,86,50,0.28)",
          }}
        >
          Marketplace flow, built from motion.
        </div>
        <div
          style={{
            marginTop: 28,
            maxWidth: 610,
            fontSize: 18,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.58)",
          }}
        >
          The interface assembles into the story: supplier input, admin review,
          routed matches, buyer response, and final marketplace readiness.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 910,
          top: 150,
          width: 810,
          height: 670,
          transform: `perspective(1600px) rotateX(${lerp(16, 7, systemLock)}deg) rotateY(${lerp(-24, -9, systemLock)}deg) rotateZ(${lerp(4, -1, systemLock)}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <AssemblyCard
          frame={frame}
          start={34}
          x={60}
          y={38}
          w={300}
          h={178}
          title="Lot data"
          body="Cotton surplus"
          accent
          rotate={-5}
        />
        <AssemblyCard
          frame={frame}
          start={48}
          x={360}
          y={98}
          w={350}
          h={206}
          title="Admin queue"
          body="Review and assign"
          rotate={4}
        />
        <AssemblyCard
          frame={frame}
          start={64}
          x={110}
          y={278}
          w={360}
          h={210}
          title="Buyer lane"
          body="Interested status"
          rotate={3}
        />
        <AssemblyCard
          frame={frame}
          start={78}
          x={460}
          y={340}
          w={260}
          h={156}
          title="Pipeline"
          body="$2.4M"
          accent
          rotate={-3}
        />
      </div>
    </AbsoluteFill>
  );
}

function SupplierFormScene({ frame }: { frame: number }) {
  const opacity = sceneOpacity(frame, 126, 410, 28);
  const enter = prog(frame, 142, 190, expoOut);
  const camera = prog(frame, 220, 334, powerInOut);
  const submit = clickPulse(frame, 346, 12);
  const cursor = pathPosition(frame, [
    { f: 154, x: 1068, y: 384 },
    { f: 200, x: 948, y: 316 },
    { f: 246, x: 1128, y: 412 },
    { f: 290, x: 936, y: 548 },
    { f: 340, x: 1308, y: 740 },
  ]);
  const title = typeText(frame, 186, 236, DEMO_LOT.title);
  const category = prog(frame, 242, 272) > 0.7 ? cleanText(DEMO_LOT.category) : "Select category";
  const categoryOpen = frame >= 250 && frame < 272;
  const categoryDropdownOpacity = categoryOpen
    ? prog(frame, 250, 258)
    : frame >= 272 && frame < 280
      ? 1 - prog(frame, 272, 280, powerInOut)
      : 0;
  const description = typeText(frame, 270, 326, DEMO_LOT.description);
  const quantity = typeText(frame, 286, 316, `${DEMO_LOT.quantity} ${DEMO_LOT.unit}`);
  const price = typeText(frame, 304, 332, money(DEMO_LOT.expectedPrice));
  const location = typeText(frame, 320, 344, DEMO_LOT.location);

  return (
    <AbsoluteFill style={{ opacity }}>
      <LightSweep frame={frame} start={148} end={222} opacity={0.18} angle={7} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${lerp(80, -90, camera)}px, ${lerp(32, -20, camera)}px) perspective(1800px) rotateX(${lerp(8, 2, camera)}deg) rotateY(${lerp(-12, -4, camera)}deg) rotateZ(${lerp(-1.5, 0, camera)}deg) scale(${lerp(0.78, 0.92, camera) * lerp(0.92, 1, enter)})`,
          transformStyle: "preserve-3d",
          opacity: enter,
          filter: `blur(${lerp(8, 0, enter)}px)`,
        }}
      >
        <AppSurface label="Supplier workspace" user={SUPPLIER.name}>
          <div style={{ display: "flex", height: 726 }}>
            <SideNav active="New lot" />
            <main style={{ flex: 1, backgroundColor: COLORS.surface, padding: 30, overflow: "hidden" }}>
              <DashboardHeader
                eyebrow="Create surplus lot"
                title="List verified inventory for review"
                description="Submit surplus stock with enough detail for admin approval and smart assignment."
                right={
                  <>
                    <MetricCard label="Supplier" value={SUPPLIER.company} hint="Verified textile exporter" accent />
                    <StatusBadge status={prog(frame, 352, 374) > 0.4 ? "pending_review" : "draft"} />
                  </>
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, marginTop: 18 }}>
                <SectionPanel title="Lot details" description="These fields become the admin review packet.">
                  <div style={{ display: "grid", gap: 14 }}>
                    <FieldBlock
                      label="Lot title"
                      active={frame >= 186 && frame < 236}
                      value={textWithCursor(frame, title, frame >= 186 && frame < 236)}
                    />
                    <div style={{ position: "relative" }}>
                      <FieldBlock label="Category" active={frame >= 242 && frame < 272} value={category} />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 78,
                          zIndex: 6,
                          border: `1px solid ${COLORS.line}`,
                          backgroundColor: COLORS.paper,
                          opacity: categoryDropdownOpacity,
                          transform: `translateY(${categoryOpen ? lerp(-6, 0, prog(frame, 250, 258)) : lerp(0, -6, prog(frame, 272, 280, powerInOut))}px)`,
                          boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
                        }}
                      >
                        {LOT_CATEGORIES.slice(0, 5).map((item) => (
                          <div
                            key={item}
                            style={{
                              padding: "10px 14px",
                              fontSize: 13,
                              color: item === DEMO_LOT.category ? COLORS.brandGreen : COLORS.ink,
                              backgroundColor: item === DEMO_LOT.category ? COLORS.brandGreenMuted : COLORS.paper,
                              borderTop: item === LOT_CATEGORIES[0] ? "none" : `1px solid ${COLORS.line}`,
                              fontWeight: item === DEMO_LOT.category ? 800 : 500,
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <FieldBlock
                      label="Description"
                      active={frame >= 270 && frame < 326}
                      height={96}
                      value={textWithCursor(frame, description, frame >= 270 && frame < 326)}
                    />
                  </div>
                </SectionPanel>
                <SectionPanel
                  title="Commercials"
                  action={<ButtonLike pressed={submit}>Submit for review</ButtonLike>}
                >
                  <div style={{ display: "grid", gap: 14 }}>
                    <FieldBlock
                      label="Quantity"
                      active={frame >= 286 && frame < 316}
                      value={textWithCursor(frame, quantity, frame >= 286 && frame < 316)}
                    />
                    <FieldBlock
                      label="Expected price"
                      active={frame >= 304 && frame < 332}
                      value={textWithCursor(frame, price, frame >= 304 && frame < 332)}
                    />
                    <FieldBlock
                      label="Location"
                      active={frame >= 320 && frame < 344}
                      value={textWithCursor(frame, location, frame >= 320 && frame < 344)}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginTop: 4,
                      }}
                    >
                      <ButtonLike variant="ghost">Save draft</ButtonLike>
                      <ButtonLike pressed={submit}>Submit</ButtonLike>
                    </div>
                  </div>
                </SectionPanel>
              </div>
            </main>
          </div>
        </AppSurface>
      </div>
      <SubmittedLotToken frame={frame} />
      <Cursor frame={frame} x={cursor.x} y={cursor.y} click={submit} label={submit > 0.1 ? "Submit" : undefined} />
      <EditorialNote
        frame={frame}
        start={168}
        kicker="Supplier creation"
        title="The form becomes the transition."
        body="Every typed field is a piece of the next admin packet, so the movement has a reason instead of a decorative slab spin."
        x={78}
        y={672}
        width={610}
      />
    </AbsoluteFill>
  );
}

function SubmittedLotToken({ frame }: { frame: number }) {
  const fly = prog(frame, 350, 430, powerInOut);
  const visible = interpolate(frame, [342, 356, 424, 438], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = lerp(1265, 585, fly);
  const y = lerp(705, 315, fly);
  const scale = lerp(0.78, 1.03, fly);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 300,
        padding: 18,
        opacity: visible,
        transform: `translate(-50%, -50%) rotate(${lerp(-2, 0, fly)}deg) scale(${scale})`,
        backgroundColor: COLORS.paper,
        border: `1px solid ${COLORS.brandGreen}`,
        color: COLORS.ink,
        boxShadow: "0 32px 90px rgba(0,0,0,0.45), 0 0 42px rgba(26,86,50,0.26)",
        zIndex: 50,
      }}
    >
      <div style={{ ...labelStyle, color: COLORS.brandGreen, marginBottom: 10 }}>{DEMO_LOT.id}</div>
      <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.24 }}>
        {cleanText(DEMO_LOT.title)}
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: COLORS.inkMuted }}>{DEMO_LOT.category}</span>
        <StatusBadge status="pending_review" />
      </div>
    </div>
  );
}

function QueueRow({
  title,
  subtitle,
  amount,
  status,
  active = false,
  progress = 1,
}: {
  title: string;
  subtitle: string;
  amount: number;
  status: StatusKey;
  active?: boolean;
  progress?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 16,
        padding: "16px 18px",
        border: active ? `1px solid ${COLORS.brandGreen}` : `1px solid ${COLORS.line}`,
        backgroundColor: active ? COLORS.brandGreenMuted : COLORS.paper,
        opacity: progress,
        transform: `translateY(${lerp(22, 0, progress)}px)`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 750,
              color: COLORS.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cleanText(title)}
          </p>
          <StatusBadge status={status} />
        </div>
        <p style={{ fontSize: 13, color: COLORS.inkMuted }}>{cleanText(subtitle)}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 14, fontWeight: 750, color: COLORS.ink }}>{money(amount)}</p>
        <p
          style={{
            marginTop: 4,
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.inkMuted,
          }}
        >
          Review
        </p>
      </div>
    </div>
  );
}

function AdminReviewScene({ frame }: { frame: number }) {
  const opacity = sceneOpacity(frame, 374, 660, 28);
  const enter = prog(frame, 392, 438, expoOut);
  const detail = prog(frame, 442, 500, powerInOut);
  const approve = clickPulse(frame, 548, 12);
  const assign = clickPulse(frame, 604, 12);
  const cursor = pathPosition(frame, [
    { f: 404, x: 608, y: 360 },
    { f: 456, x: 706, y: 470 },
    { f: 540, x: 1306, y: 710 },
    { f: 598, x: 1446, y: 710 },
  ]);
  const status: StatusKey = frame > 604 ? "assigned" : frame > 548 ? "approved" : "pending_review";

  return (
    <AbsoluteFill style={{ opacity }}>
      <ScanBand frame={frame} start={402} end={468} top={340} width={760} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${lerp(-180, -70, detail)}px, ${lerp(20, -18, detail)}px) perspective(1800px) rotateX(${lerp(6, 3, detail)}deg) rotateY(${lerp(10, 2, detail)}deg) rotateZ(${lerp(1.2, 0, detail)}deg) scale(${lerp(0.82, 0.91, detail) * lerp(0.92, 1, enter)})`,
          opacity: enter,
          filter: `blur(${lerp(7, 0, enter)}px)`,
        }}
      >
        <AppSurface label="Admin workspace" user={ADMIN.name}>
          <div style={{ display: "flex", height: 726 }}>
            <SideNav active="Assignments" />
            <main style={{ flex: 1, padding: 28, backgroundColor: COLORS.surface }}>
              <DashboardHeader
                eyebrow="Admin control room"
                title="A new lot arrives as a reviewable packet"
                description="The submitted supplier form resolves into the queue, then expands into approval and assignment controls."
                right={
                  <>
                    <MetricCard label="Users" value={ADMIN_METRICS.totalUsers} hint="Verified accounts" accent />
                    <MetricCard label="Live lots" value={ADMIN_METRICS.liveLots} hint="Marketplace supply" />
                  </>
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "0.94fr 1.06fr", gap: 18, marginTop: 18 }}>
                <SectionPanel title="Pending supply" description="Queue sorted by newest submissions.">
                  <div style={{ display: "grid", gap: 12 }}>
                    {ADMIN_PENDING_LOTS.map((lot, index) => (
                      <QueueRow
                        key={lot.key}
                        title={lot.title}
                        subtitle={lot.subtitle}
                        amount={lot.amount}
                        status={index === 0 ? status : "pending_review"}
                        active={index === 0}
                        progress={prog(frame, 410 + index * 14, 438 + index * 14)}
                      />
                    ))}
                  </div>
                </SectionPanel>
                <SectionPanel
                  title="Review packet"
                  description="The first row opens into exact inventory, supplier, and action data."
                  action={<StatusBadge status={status} scale={1 + approve * 0.04 + assign * 0.04} />}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 0.72fr", gap: 16 }}>
                    <Panel style={{ padding: 18, backgroundColor: COLORS.paper }}>
                      <p style={{ ...labelStyle, color: COLORS.brandGreen, marginBottom: 12 }}>
                        {DEMO_LOT.id}
                      </p>
                      <h3 style={{ fontSize: 26, lineHeight: 1.08, fontWeight: 800, marginBottom: 14 }}>
                        {cleanText(DEMO_LOT.title)}
                      </h3>
                      <p style={{ fontSize: 14, lineHeight: 1.62, color: COLORS.inkMuted }}>
                        {cleanText(DEMO_LOT.description)}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
                        <FieldBlock label="Qty" value={`${DEMO_LOT.quantity} ${DEMO_LOT.unit}`} />
                        <FieldBlock label="Price" value={money(DEMO_LOT.expectedPrice)} />
                        <FieldBlock label="Location" value={DEMO_LOT.location} />
                      </div>
                    </Panel>
                    <Panel style={{ padding: 18, backgroundColor: COLORS.paper }}>
                      <p style={{ ...labelStyle, marginBottom: 12 }}>Supplier</p>
                      <h3 style={{ fontSize: 23, fontWeight: 800, marginBottom: 6 }}>{SUPPLIER.company}</h3>
                      <p style={{ fontSize: 13, color: COLORS.inkMuted, marginBottom: 18 }}>{SUPPLIER.email}</p>
                      <FieldBlock label="Warehouse" value={SUPPLIER.warehouse} muted />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                        <ButtonLike variant="secondary" pressed={approve}>Approve</ButtonLike>
                        <ButtonLike pressed={assign}>Assign</ButtonLike>
                      </div>
                    </Panel>
                  </div>
                </SectionPanel>
              </div>
            </main>
          </div>
        </AppSurface>
      </div>
      <AssignmentToken frame={frame} />
      <Cursor frame={frame} x={cursor.x} y={cursor.y} click={Math.max(approve, assign)} label={assign > 0.1 ? "Assign" : undefined} />
      <EditorialNote
        frame={frame}
        start={424}
        kicker="Admin review"
        title="A queue row expands into a decision."
        body="The camera follows the data packet from submission to review, approval, and assignment controls."
        x={82}
        y={672}
        width={590}
      />
    </AbsoluteFill>
  );
}

function AssignmentToken({ frame }: { frame: number }) {
  const fly = prog(frame, 610, 692, powerInOut);
  const visible = interpolate(frame, [600, 616, 682, 698], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = lerp(1420, 468, fly);
  const y = lerp(706, 390, fly);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 260,
        padding: 15,
        opacity: visible,
        transform: `translate(-50%, -50%) rotate(${lerp(2, -4, fly)}deg) scale(${lerp(0.84, 1, fly)})`,
        backgroundColor: COLORS.brandGreen,
        color: COLORS.paper,
        border: `1px solid ${COLORS.brandGreen}`,
        boxShadow: "0 32px 90px rgba(0,0,0,0.46), 0 0 48px rgba(26,86,50,0.34)",
        zIndex: 55,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          opacity: 0.72,
          marginBottom: 8,
        }}
      >
        Assignment packet
      </div>
      <div style={{ fontSize: 18, lineHeight: 1.2, fontWeight: 850 }}>{DEMO_LOT.id}</div>
    </div>
  );
}

function ScannerWorld({ frame }: { frame: number }) {
  const sweep = prog(frame, 28, 112, powerInOut);
  const rotate = interpolate(frame, [0, 210], [-0.32, 0.24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanX = lerp(-2.9, 2.9, sweep);

  return (
    <group rotation={[0.18, rotate, -0.04]}>
      <ambientLight intensity={0.52} />
      <pointLight position={[0, 3, 5]} intensity={24} color="#ffffff" />
      <pointLight position={[-4, -1.5, 3.5]} intensity={18} color={COLORS.brandGreen} />
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[0, 0, -1.25 + index * 0.78]} rotation={[0, 0, index * 0.035]}>
          <boxGeometry args={[6.2 - index * 0.44, 3.4 - index * 0.22, 0.018]} />
          <meshStandardMaterial
            color={index === 0 ? COLORS.brandGreen : "#f6f8f6"}
            emissive={index === 0 ? COLORS.brandGreen : "#dce5df"}
            emissiveIntensity={index === 0 ? 0.4 : 0.08}
            opacity={index === 0 ? 0.11 : 0.08}
            transparent
            roughness={0.22}
            metalness={0.12}
          />
        </mesh>
      ))}
      <mesh position={[scanX, 0, 0.46]}>
        <boxGeometry args={[0.045, 3.85, 0.045]} />
        <meshBasicMaterial color={COLORS.brandGreen} opacity={0.76} transparent />
      </mesh>
      {[-2.2, -0.8, 0.8, 2.2].map((x, index) => (
        <mesh key={x} position={[x, -1.95, 0.12]} scale={[1, prog(frame, 52 + index * 8, 84 + index * 8), 1]}>
          <boxGeometry args={[0.52, 0.18, 0.08]} />
          <meshStandardMaterial
            color={index < 3 ? COLORS.brandGreen : "#2b302d"}
            emissive={index < 3 ? COLORS.brandGreen : "#0f1210"}
            emissiveIntensity={index < 3 ? 0.9 : 0.1}
            opacity={index < 3 ? 0.72 : 0.18}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function CandidateCard({
  frame,
  candidate,
  index,
}: {
  frame: number;
  candidate: Candidate;
  index: number;
}) {
  const scoreIn = prog(frame, 690 + index * 9, 732 + index * 9);
  const route = prog(frame, 748 + index * 9, 810 + index * 7, candidate.smart ? powerInOut : power3Out);
  const fromX = 0;
  const toX = candidate.smart ? 356 : 44;
  const fromY = index * 82;
  const toY = candidate.smart ? index * 92 : 388 + (index - 3) * 74;
  const opacity = candidate.smart ? 1 : interpolate(route, [0, 1], [1, 0.32]);

  return (
    <div
      style={{
        position: "absolute",
        left: lerp(fromX, toX, route),
        top: lerp(fromY, toY, route),
        width: candidate.smart ? 330 : 300,
        minHeight: 70,
        padding: 14,
        border: candidate.smart ? `1px solid ${COLORS.brandGreen}` : `1px solid ${COLORS.line}`,
        backgroundColor: candidate.smart ? COLORS.paper : COLORS.surface,
        opacity: scoreIn * opacity,
        transform: `translateX(${lerp(-38, 0, scoreIn)}px) scale(${candidate.smart ? 1 : 0.94})`,
        boxShadow: candidate.smart ? "0 18px 54px rgba(0,0,0,0.12)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 850, color: COLORS.ink }}>{candidate.name}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: COLORS.inkMuted }}>{candidate.business}</div>
        </div>
        <div
          style={{
            minWidth: 52,
            textAlign: "right",
            fontSize: 20,
            fontWeight: 850,
            color: candidate.smart ? COLORS.brandGreen : COLORS.inkMuted,
          }}
        >
          {Math.round(candidate.score * scoreIn)}
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ ...labelStyle, letterSpacing: "0.16em" }}>{candidate.role}</span>
        {candidate.smart ? <StatusBadge status="assigned" /> : <StatusBadge status="draft" />}
      </div>
    </div>
  );
}

function RoutingBoardScene({ frame }: { frame: number }) {
  const opacity = sceneOpacity(frame, 638, 884, 28);
  const enter = prog(frame, 656, 704, expoOut);
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [650, 680, 848, 880], [0, 0.36, 0.36, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 8], fov: 42 }}>
          <ScannerWorld frame={frame - 650} />
        </ThreeCanvas>
      </div>
      <LightSweep frame={frame} start={660} end={746} opacity={0.18} angle={-4} />
      <div
        style={{
          position: "absolute",
          left: 236,
          top: 138,
          width: 1180,
          height: 720,
          opacity: enter,
          transform: `perspective(1800px) rotateX(${lerp(10, 3, enter)}deg) rotateY(${lerp(-9, 0, enter)}deg) rotateZ(${lerp(-1, 0, enter)}deg) scale(${lerp(0.9, 1, enter)})`,
          transformStyle: "preserve-3d",
          filter: `blur(${lerp(6, 0, enter)}px)`,
        }}
      >
        <Panel
          style={{
            height: "100%",
            backgroundColor: COLORS.paper,
            padding: 24,
            boxShadow: "0 58px 150px rgba(0,0,0,0.56), 0 0 70px rgba(26,86,50,0.16)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 360px", gap: 22, height: "100%" }}>
            <div style={{ display: "grid", alignContent: "start", gap: 16 }}>
              <p style={{ ...labelStyle, color: COLORS.brandGreen }}>Assigned lot</p>
              <Panel style={{ padding: 18, backgroundColor: COLORS.brandGreenMuted, borderColor: "rgba(26,86,50,0.28)" }}>
                <p style={{ ...labelStyle, color: COLORS.brandGreen, marginBottom: 12 }}>{DEMO_LOT.id}</p>
                <h3 style={{ fontSize: 25, lineHeight: 1.06, fontWeight: 850 }}>{cleanText(DEMO_LOT.title)}</h3>
                <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, color: COLORS.inkMuted }}>
                  {DEMO_LOT.category} / {DEMO_LOT.quantity} {DEMO_LOT.unit} / {money(DEMO_LOT.expectedPrice)}
                </p>
                <div style={{ marginTop: 18 }}>
                  <StatusBadge status="assigned" />
                </div>
              </Panel>
              <SectionPanel title="Rules" description="No map. Just routing criteria." style={{ backgroundColor: COLORS.paper }}>
                <div style={{ display: "grid", gap: 10 }}>
                  {["Category fit", "Verified business", "Recent activity"].map((rule, index) => (
                    <div
                      key={rule}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: COLORS.ink,
                      }}
                    >
                      <span>{rule}</span>
                      <span style={{ color: COLORS.brandGreen, fontWeight: 850 }}>
                        {Math.round([100, 94, 89][index] * prog(frame, 680, 730))}%
                      </span>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            </div>
            <div style={{ position: "relative", overflow: "hidden", border: `1px solid ${COLORS.line}`, backgroundColor: COLORS.surface, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 18 }}>
                <div>
                  <p style={{ ...labelStyle, color: COLORS.brandGreen, marginBottom: 8 }}>Candidate scoring</p>
                  <h2 style={{ fontSize: 28, fontWeight: 850 }}>Sort, filter, route</h2>
                </div>
                <div style={{ fontSize: 11, color: COLORS.inkMuted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  {Math.round(MATCH_CANDIDATES.length * prog(frame, 680, 720))} scanned
                </div>
              </div>
              <div style={{ position: "relative", height: 552 }}>
                {MATCH_CANDIDATES.map((candidate, index) => (
                  <CandidateCard key={candidate.name} frame={frame} candidate={candidate} index={index} />
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: 340,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: COLORS.brandGreen,
                    opacity: prog(frame, 724, 770) * 0.45,
                    boxShadow: "0 0 24px rgba(26,86,50,0.42)",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
              <p style={{ ...labelStyle, color: COLORS.brandGreen }}>Assignment lane</p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  opacity: prog(frame, 680, 708) * interpolate(frame, [736, 770], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    style={{
                      height: 86,
                      border: `1px dashed ${COLORS.lineStrong}`,
                      background:
                        "linear-gradient(90deg, rgba(26,86,50,0.08), rgba(255,255,255,0.55))",
                      transform: `translateX(${lerp(28, 0, prog(frame, 680 + index * 8, 706 + index * 8))}px)`,
                    }}
                  />
                ))}
              </div>
              {[BUYER_1, BUYER_2, AGENT].map((user, index) => {
                const reveal = prog(frame, 734 + index * 16, 792 + index * 16, powerInOut);
                return (
                  <Panel
                    key={user.email}
                    style={{
                      padding: 18,
                      backgroundColor: COLORS.paper,
                      borderColor: "rgba(26,86,50,0.28)",
                      opacity: reveal,
                      transform: `translateX(${lerp(34, 0, reveal)}px)`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                      <div>
                        <h3 style={{ fontSize: 20, fontWeight: 850, marginBottom: 5 }}>{user.name}</h3>
                        <p style={{ fontSize: 13, color: COLORS.inkMuted }}>{user.business}</p>
                      </div>
                      <StatusBadge status="assigned" />
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.inkMuted }}>
                      {user.categories.slice(0, 2).join(" / ")}
                    </p>
                  </Panel>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>
      <EditorialNote
        frame={frame}
        start={664}
        kicker="Smart routing"
        title="Matching becomes operational."
        body="The hated network map is gone. Scoring, filtering, and assignment now happen as visible product choreography."
        x={92}
        y={672}
        width={430}
      />
    </AbsoluteFill>
  );
}

function BuyerResponseScene({ frame }: { frame: number }) {
  const opacity = sceneOpacity(frame, 842, 1068, 28);
  const enter = prog(frame, 858, 900, expoOut);
  const noteProgress = prog(frame, 956, 1030, Easing.linear);
  const click = clickPulse(frame, 944, 12);
  const cursor = pathPosition(frame, [
    { f: 860, x: 1078, y: 378 },
    { f: 904, x: 950, y: 594 },
    { f: 938, x: 1278, y: 626 },
    { f: 990, x: 1178, y: 716 },
  ]);
  const status: StatusKey = frame > 944 ? "interested" : "assigned";
  const typedNote = ASSIGNMENT_NOTE.slice(0, Math.floor(ASSIGNMENT_NOTE.length * noteProgress));

  return (
    <AbsoluteFill style={{ opacity }}>
      <ScanBand frame={frame} start={870} end={936} top={610} width={920} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${lerp(112, 30, enter)}px, ${lerp(46, -10, enter)}px) perspective(1800px) rotateX(${lerp(9, 3, enter)}deg) rotateY(${lerp(-14, -2, enter)}deg) rotateZ(${lerp(-1.4, 0, enter)}deg) scale(${lerp(0.86, 0.94, enter)})`,
          opacity: enter,
          filter: `blur(${lerp(7, 0, enter)}px)`,
        }}
      >
        <AppSurface label="Buyer workspace" user={BUYER_1.name}>
          <div style={{ display: "flex", height: 726 }}>
            <SideNav active="Assignments" />
            <main style={{ flex: 1, padding: 28, backgroundColor: COLORS.surface }}>
              <DashboardHeader
                eyebrow="Buyer dashboard"
                title="Assigned lots become buyer decisions"
                description="The buyer sees the assignment, opens the lot, and responds from the same product language."
                right={
                  <>
                    <MetricCard label="Assigned" value={BUYER_METRICS.assignedLots} hint="Lots in review" accent />
                    <MetricCard label="Interested" value={frame > 944 ? BUYER_METRICS.interested + 1 : BUYER_METRICS.interested} hint="Responses sent" />
                  </>
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 0.86fr", gap: 18, marginTop: 18 }}>
                <SectionPanel title="Recent assignments" description="The routed lot lands at the top.">
                  <div style={{ display: "grid", gap: 12 }}>
                    {BUYER_RECENT_ASSIGNMENTS.map((item, index) => (
                      <QueueRow
                        key={item.key}
                        title={item.title}
                        subtitle={item.subtitle}
                        amount={item.amount}
                        status={index === 0 ? status : item.status}
                        active={index === 0}
                        progress={prog(frame, 888 + index * 16, 924 + index * 16)}
                      />
                    ))}
                  </div>
                </SectionPanel>
                <SectionPanel
                  title="Lot response"
                  description="No glass pill. The status changes in the component."
                  action={<StatusBadge status={status} scale={1 + click * 0.05} />}
                >
                  <Panel style={{ padding: 18, backgroundColor: COLORS.paper, marginBottom: 14 }}>
                    <p style={{ ...labelStyle, color: COLORS.brandGreen, marginBottom: 10 }}>{DEMO_LOT.id}</p>
                    <h3 style={{ fontSize: 25, lineHeight: 1.08, fontWeight: 850 }}>
                      {cleanText(DEMO_LOT.title)}
                    </h3>
                    <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.58, color: COLORS.inkMuted }}>
                      {cleanText(DEMO_LOT.description)}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                      <ButtonLike pressed={click}>Interested</ButtonLike>
                      <ButtonLike variant="ghost">Not interested</ButtonLike>
                    </div>
                  </Panel>
                  <FieldBlock
                    label="Assignment note"
                    height={92}
                    active={frame >= 956 && frame < 1030}
                    value={textWithCursor(frame, typedNote, frame >= 956 && frame < 1030)}
                  />
                </SectionPanel>
              </div>
            </main>
          </div>
        </AppSurface>
      </div>
      <Cursor frame={frame} x={cursor.x} y={cursor.y} click={click} label={click > 0.1 ? "Respond" : undefined} />
      <EditorialNote
        frame={frame}
        start={876}
        kicker="Buyer response"
        title="The status change is the payoff."
        body="A real cursor click and a typed assignment note replace the floating success badge."
        x={92}
        y={672}
        width={430}
      />
    </AbsoluteFill>
  );
}

function ClosingScene({ frame }: { frame: number }) {
  const opacity = sceneOpacity(frame, 1030, TOTAL_FRAMES, 20);
  const lock = prog(frame, 1084, 1150, expoOut);
  const settle = spring({
    frame: frame - 1126,
    fps: 30,
    config: { damping: 18, stiffness: 110, mass: 0.9 },
    durationInFrames: 44,
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <LightSweep frame={frame} start={1052} end={1138} opacity={0.2} angle={8} />
      <ScanBand frame={frame} start={1074} end={1140} top={520} width={840} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1000,
          height: 560,
          transform: `translate(-50%, -50%) perspective(1700px) rotateX(${lerp(14, 0, lock)}deg) rotateY(${lerp(-18, 0, lock)}deg) scale(${lerp(0.88, 1, lock)})`,
          transformStyle: "preserve-3d",
        }}
      >
        {CLOSING_METRICS.map((metric, index) => {
          const t = prog(frame, 1048 + index * 14, 1116 + index * 12, powerInOut);
          const x = lerp([-320, 290, -20][index], [-290, 0, 290][index], lock);
          const y = lerp([60, -80, 150][index], 210, lock);
          return (
            <Panel
              key={metric.label}
              style={{
                position: "absolute",
                left: 500 + x,
                top: 212 + y,
                width: 230,
                padding: 22,
                backgroundColor: index === 1 ? COLORS.brandGreenMuted : COLORS.paper,
                borderColor: index === 1 ? "rgba(26,86,50,0.3)" : COLORS.line,
                opacity: t,
                transform: `translate(-50%, -50%) translateZ(${80 - index * 22}px) scale(${lerp(0.86, 1, t)})`,
                boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
              }}
            >
              <div style={{ ...labelStyle, color: index === 1 ? COLORS.brandGreen : COLORS.inkMuted }}>
                {metric.label}
              </div>
              <div style={{ marginTop: 12, fontSize: 46, fontWeight: 900, color: COLORS.ink }}>
                {metric.value}
              </div>
            </Panel>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "44%",
            transform: `translate(-50%, -50%) scale(${lerp(0.92, 1 + settle * 0.018, lock)})`,
            opacity: prog(frame, 1098, 1140),
            textAlign: "center",
            color: COLORS.white,
            width: 900,
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 78,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textShadow: "0 0 80px rgba(26,86,50,0.42)",
            }}
          >
            Surplus<span style={{ color: COLORS.brandGreen }}>Link</span>
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.58)",
            }}
          >
            Supplier supply. Admin control. Buyer demand. One marketplace loop.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const SurplusLink3D: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#020302", overflow: "hidden", fontFamily: FONT.sans }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
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
        `}
      </style>
      <Backdrop frame={frame} />
      <OpeningScene frame={frame} />
      <SupplierFormScene frame={frame} />
      <AdminReviewScene frame={frame} />
      <RoutingBoardScene frame={frame} />
      <BuyerResponseScene frame={frame} />
      <ClosingScene frame={frame} />
      <LightSweep frame={frame} start={1130} end={1202} opacity={0.16} angle={-6} />
    </AbsoluteFill>
  );
};
