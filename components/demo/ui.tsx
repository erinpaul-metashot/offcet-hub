"use client";

import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { STATUS_LABELS } from "@/types/domain";

const baseFieldStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--line)",
  backgroundColor: "var(--surface)",
  color: "var(--ink)",
  padding: "12px 16px",
  fontSize: 14,
  lineHeight: 1.4,
  outline: "none",
  borderRadius: 0,
  boxShadow: "none",
  transition: "border-color 0.2s ease, background-color 0.2s ease",
};

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  style,
  ...props
}: {
  as?: T;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "variant" | "size">) {
  const Component = as || "button";

  const variantStyle: CSSProperties =
    variant === "primary"
      ? {
          backgroundColor: "var(--brand-green)",
          border: "1px solid var(--brand-green)",
          color: "var(--paper)",
        }
      : variant === "secondary"
        ? {
            backgroundColor: "var(--paper)",
            border: "1px solid var(--ink)",
            color: "var(--ink)",
          }
        : {
            backgroundColor: "transparent",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          };

  const sizeStyle: CSSProperties =
    size === "sm"
      ? { minHeight: 36, padding: "0 12px", fontSize: 12 }
      : { minHeight: 44, padding: "0 16px", fontSize: 14 };

  return (
    <Component
      {...(props as ComponentPropsWithoutRef<T>)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        cursor: (props as { disabled?: boolean }).disabled ? "not-allowed" : "pointer",
        opacity: (props as { disabled?: boolean }).disabled ? 0.5 : 1,
        transition:
          "transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
        fontFamily: "var(--font-sans)",
        ...sizeStyle,
        ...variantStyle,
        ...style,
      }}
    />
  );
}

export function Input({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...baseFieldStyle, ...style }} />;
}

export function Textarea({ style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        ...baseFieldStyle,
        minHeight: 112,
        resize: "vertical",
        ...style,
      }}
    />
  );
}

export function Select({ style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        ...baseFieldStyle,
        appearance: "none",
        ...style,
      }}
    />
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: error ? "#dc2626" : "var(--ink-muted)",
        }}
      >
        {label}
      </span>
      {children}
      {hint && !error ? <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{hint}</span> : null}
      {error ? <span style={{ fontSize: 12, fontWeight: 500, color: "#dc2626" }}>{error}</span> : null}
    </label>
  );
}

export function StatusBadge({
  status,
}: {
  status: keyof typeof STATUS_LABELS;
}) {
  const styles: Record<string, CSSProperties> = {
    pending: {
      border: "1px dashed var(--line-strong)",
      color: "var(--ink-muted)",
      backgroundColor: "transparent",
    },
    rejected: {
      border: "1px solid var(--line)",
      backgroundColor: "var(--muted)",
      color: "var(--ink-muted)",
    },
    approved: {
      border: "1px solid var(--brand-green)",
      color: "var(--brand-green)",
      backgroundColor: "transparent",
    },
    draft: {
      border: "1px solid var(--line)",
      color: "var(--ink-muted)",
      backgroundColor: "transparent",
    },
    pending_review: {
      border: "1px dashed var(--line-strong)",
      color: "var(--ink-muted)",
      backgroundColor: "transparent",
    },
    assigned: {
      border: "1px solid var(--brand-green)",
      backgroundColor: "var(--brand-green)",
      color: "var(--paper)",
    },
    sold: {
      border: "1px solid var(--line)",
      backgroundColor: "var(--muted)",
      color: "var(--ink-muted)",
      textDecoration: "line-through",
    },
    expired: {
      border: "1px solid var(--line)",
      backgroundImage:
        "repeating-linear-gradient(135deg, #f4f4f4, #f4f4f4 8px, #ececec 8px, #ececec 16px)",
      color: "var(--ink-muted)",
    },
    interested: {
      border: "1px solid var(--ink)",
      backgroundColor: "var(--muted)",
      color: "var(--ink)",
    },
    not_interested: {
      border: "1px solid var(--line)",
      backgroundColor: "var(--muted)",
      color: "var(--ink-muted)",
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
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...styles[status],
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Panel({
  style,
  children,
}: {
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--line)",
        backgroundColor: "var(--surface)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        minHeight: 192,
        placeItems: "center",
        border: "1px dashed var(--line)",
        backgroundColor: "var(--surface)",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 320 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--ink)",
            marginBottom: 8,
          }}
        >
          {title}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-muted)" }}>{body}</p>
      </div>
    </div>
  );
}
