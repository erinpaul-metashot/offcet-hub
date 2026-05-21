"use client";

import {
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ElementType,
  type ComponentPropsWithoutRef,
} from "react";
import { STATUS_LABELS } from "@/types/domain";
import { classNames } from "@/lib/utils";

const baseFieldStyles =
  "w-full rounded-none border border-(--line) bg-(--surface) px-4 py-3 text-sm text-foreground outline-none transition focus:border-(--ink)";

export function Button<T extends ElementType = "button">({
  as,
  className,
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
  const variantStyles =
    variant === "primary"
      ? "bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-light)] [&_*]:!text-white"
      : variant === "secondary"
        ? "border border-[var(--ink)] bg-[var(--paper)] text-foreground hover:bg-[var(--brand-green-muted)]"
        : "border border-[var(--line)] bg-transparent text-foreground hover:bg-[var(--muted)]";

  const sizeStyles = size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm";

  return (
    <Component
      className={classNames(
        "inline-flex items-center justify-center font-medium uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50",
        sizeStyles,
        variantStyles,
        className,
      )}
      style={
        variant === "primary"
          ? { ...(style ?? {}), color: "var(--paper)" }
          : style
      }
      {...(props as ComponentPropsWithoutRef<T>)}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={classNames(baseFieldStyles, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={classNames(baseFieldStyles, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={classNames(baseFieldStyles, className)} {...props} />;
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
    <label className="grid gap-2">
      <span className={classNames(
        "text-[11px] font-semibold uppercase tracking-[0.24em]",
        error ? "text-red-500" : "text-[var(--ink-muted)]"
      )}>
        {label}
      </span>
      {children}
      {hint && !error ? <span className="text-xs text-[var(--ink-muted)]">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  );
}

export function StatusBadge({
  status,
}: {
  status: keyof typeof STATUS_LABELS;
}) {
  const styles: Record<string, string> = {
    pending: "border border-dashed border-(--line-strong) text-(--ink-muted)",
    rejected: "border border-(--line) bg-(--muted) text-(--ink-muted)",
    approved: "border border-(--brand-green) text-(--brand-green)",
    draft: "border border-(--line) text-(--ink-muted)",
    pending_review: "border border-dashed border-(--line-strong) text-(--ink-muted)",
    assigned: "bg-(--brand-green) text-(--paper)",
    sold: "border border-(--line) bg-(--muted) line-through",
    expired: "border border-(--line) bg-[repeating-linear-gradient(135deg,#f4f4f4,#f4f4f4_8px,#ececec_8px,#ececec_16px)] text-(--ink-muted)",
    interested: "border border-(--ink) bg-(--muted) text-(--ink)",
    not_interested: "border border-(--line) bg-(--muted) text-(--ink-muted)",
  };

  return (
    <span
      className={classNames(
        "inline-flex min-h-8 items-center px-3 text-[10px] font-semibold uppercase tracking-[0.22em]",
        styles[status] ?? "border border-(--line)",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={classNames("border border-(--line) bg-(--surface)", className)}>
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
    <div className="grid min-h-48 place-items-center border border-dashed border-(--line) bg-(--surface) p-8 text-center">
      <div className="max-w-sm space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em]">{title}</p>
        <p className="text-sm leading-6 text-(--ink-muted)">{body}</p>
      </div>
    </div>
  );
}
