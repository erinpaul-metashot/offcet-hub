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
  "w-full rounded-md border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:shadow-[0_0_0_3px_var(--brand-primary-muted)] placeholder:text-[var(--ink-muted)]";

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
      ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-light)] [&_*]:!text-white border-transparent"
      : variant === "secondary"
        ? "border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface)]"
        : "border border-transparent bg-transparent text-[var(--ink)] hover:bg-[var(--surface)]";

  const sizeStyles = size === "sm" ? "min-h-9 px-4 text-[11px]" : "min-h-12 px-6 text-[13px]";

  return (
    <Component
      className={classNames(
        "inline-flex items-center justify-center font-bold uppercase tracking-[0.15em] rounded-full disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]",
        "transition-[transform,box-shadow,background-color] duration-[160ms] ease-[var(--ease-out)]",
        sizeStyles,
        variantStyles,
        variant === "primary" ? "hover:shadow-[0_2px_12px_rgba(255,92,0,0.2)]" : "",
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
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  /** Marks the label so the requirement is visible before the form is submitted. */
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className={classNames(
        "text-[11px] font-semibold uppercase tracking-[0.24em]",
        error ? "text-red-500" : "text-[var(--ink-muted)]"
      )}>
        {label}
        {required ? <span className="ml-1 text-[var(--brand-primary)]" aria-hidden="true">*</span> : null}
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
    pending: "border border-dashed border-[var(--line-strong)] text-[var(--ink-muted)]",
    rejected: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]",
    approved: "border border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted)] text-[var(--brand-secondary)]",
    draft: "border border-[var(--line)] text-[var(--ink-muted)]",
    pending_review: "border border-dashed border-[var(--brand-primary)] text-[var(--brand-primary)]",
    assigned: "bg-[var(--brand-primary)] text-white border-transparent",
    sold: "border border-[var(--line)] bg-[var(--surface)] line-through text-[var(--ink-muted)]",
    expired: "border border-[var(--line)] bg-[repeating-linear-gradient(135deg,#f4f4f4,#f4f4f4_8px,#ececec_8px,#ececec_16px)] text-[var(--ink-muted)]",
    interested: "border border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted)] text-[var(--brand-secondary)]",
    not_interested: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]",
  };

  return (
    <span
      className={classNames(
        "inline-flex min-h-7 items-center px-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
        styles[status] ?? "border border-[var(--line)]",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Panel({
  className,
  interactive = false,
  children,
  ...props
}: {
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <section
      className={classNames(
        "rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]",
        interactive && "transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]",
        className,
      )}
      {...props}
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
    <div className="grid min-h-48 place-items-center rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-[var(--paper)] p-8 text-center">
      <div className="max-w-sm space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--ink)]">{title}</p>
        <p className="text-sm leading-6 text-[var(--ink-muted)]">{body}</p>
      </div>
    </div>
  );
}

export function Spinner({ 
  className, 
  size = "md",
  variant = "black"
}: { 
  className?: string; 
  size?: "sm" | "md" | "lg";
  variant?: "white" | "black" 
}) {
  const sizeClass = size === "sm" ? "h-6 w-6" : size === "md" ? "h-12 w-12" : "h-16 w-16";
  const strokeColor = variant === "white" ? "#FFFFFF" : "var(--color-charcoal, #545454)";
  
  return (
    <div className={classNames("relative flex items-center justify-center mx-auto", sizeClass, className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* The Outer Spinning 'C' shape */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          className="animate-cirka-draw opacity-90"
        />
        
        {/* The Inner Pulsing Node (Orange) */}
        <circle 
          cx="50" 
          cy="50" 
          r="14" 
          fill="var(--brand-primary, #FF5C00)" 
          className="animate-cirka-dot"
        />
      </svg>
    </div>
  );
}

