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
  "w-full rounded-none border-2 border-[var(--black)] bg-[var(--white)] px-4 py-3 text-sm text-[var(--black)] outline-none transition focus:border-[var(--lime)] focus:ring-2 focus:ring-[var(--lime)] focus:ring-offset-2";

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
      ? "bg-[var(--lime)] text-[var(--black)] border-2 border-[var(--black)] hover:bg-[#C4E936] [&_*]:!text-[var(--black)]"
      : variant === "secondary"
        ? "border-2 border-[var(--black)] bg-[var(--white)] text-[var(--black)] hover:bg-[var(--cream)]"
        : "border-2 border-[var(--black)] bg-transparent text-[var(--black)] hover:bg-[var(--cream)]";

  const sizeStyles = size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm";

  return (
    <Component
      className={classNames(
        "inline-flex items-center justify-center font-bold uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-50",
        sizeStyles,
        variantStyles,
        className,
      )}
      style={style}
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
        "text-[11px] font-bold uppercase tracking-[0.24em]",
        error ? "text-red-500" : "text-[var(--espresso)]"
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
    pending: "border-2 border-dashed border-[var(--black)] text-[var(--espresso)]",
    rejected: "border-2 border-[var(--black)] bg-[var(--sand)] text-[var(--espresso)]",
    approved: "border-2 border-[var(--black)] bg-[var(--lime)] text-[var(--black)]",
    draft: "border-2 border-[var(--black)] bg-[var(--white)] text-[var(--espresso)]",
    pending_review: "border-2 border-dashed border-[var(--black)] text-[var(--espresso)]",
    assigned: "border-2 border-[var(--black)] bg-[var(--lime)] text-[var(--black)]",
    sold: "border-2 border-[var(--black)] bg-[var(--sand)] line-through",
    expired: "border-2 border-[var(--black)] bg-[repeating-linear-gradient(135deg,#f4f4f4,#f4f4f4_8px,#E3D4C1_8px,#E3D4C1_16px)] text-[var(--espresso)]",
    interested: "border-2 border-[var(--black)] bg-[var(--cream)] text-[var(--black)]",
    not_interested: "border-2 border-[var(--black)] bg-[var(--sand)] text-[var(--espresso)]",
  };

  return (
    <span
      className={classNames(
        "inline-flex min-h-8 items-center px-3 text-[10px] font-bold uppercase tracking-[0.22em]",
        styles[status] ?? "border-2 border-[var(--black)]",
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
    <section className={classNames("border-2 border-[var(--black)] bg-[var(--white)]", className)}>
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
    <div className="grid min-h-48 place-items-center border-2 border-dashed border-[var(--black)] bg-[var(--cream)] p-8 text-center">
      <div className="max-w-sm space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--black)]">{title}</p>
        <p className="text-sm leading-6 text-[var(--espresso)]">{body}</p>
      </div>
    </div>
  );
}
