"use client";

import type { ReactNode } from "react";
import { Panel, StatusBadge } from "@/components/ui";
import { classNames, formatCurrency, formatDate } from "@/lib/utils";

export function DashboardHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Panel className="relative overflow-hidden border-transparent bg-[var(--sidebar-bg)] shadow-none rounded-[2rem]">
      {/* Subtle constellation motif — scaled down to avoid competing with content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,92,0,0.1),transparent_35%)]" />
      <div className="absolute right-0 top-0 h-full w-[20%] opacity-10 pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-full h-full text-[var(--brand-primary)]">
          <circle cx="300" cy="100" r="4" fill="currentColor" />
          <circle cx="200" cy="200" r="6" fill="currentColor" />
          <circle cx="350" cy="250" r="3" fill="currentColor" />
          <path d="M 300 100 L 200 200 L 350 250" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="relative p-8 sm:p-10 space-y-5">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--brand-primary)]">
            {eyebrow}
          </p>
          <h1 className="max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-xl text-[13px] leading-relaxed text-[var(--sidebar-text-muted)]">
            {description}
          </p>
        </div>
        {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </Panel>
  );
}

export function DashboardMetricCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Panel
      className={classNames(
        "h-full p-6 animate-stagger-in",
        accent
          ? "ring-1 ring-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 bg-[var(--brand-primary-light)]/10"
          : "bg-[var(--paper)]",
      )}
    >
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          {label}
        </p>
        <p className={classNames(
          "text-4xl font-semibold tracking-[-0.05em] tabular-nums",
          accent ? "text-[var(--brand-primary)]" : "text-[var(--ink)]"
        )}>{value}</p>
        <p className="text-[13px] leading-5 text-[var(--ink-muted)]">{hint}</p>
      </div>
    </Panel>
  );
}

export function DashboardSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Panel className="overflow-hidden flex flex-col h-full">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] border-t-[3px] border-t-[var(--brand-primary)] bg-[var(--paper)] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h2>
          {description ? (
            <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-6 flex-1 bg-[var(--paper)]">{children}</div>
    </Panel>
  );
}

export function HorizontalBarChart({
  items,
  emptyLabel = "No data yet",
}: {
  items: Array<{ label: string; value: number; tone?: "default" | "accent" }>;
  emptyLabel?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (!items.length || maxValue === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0);

        return (
          <div key={item.label} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[var(--ink)]">{item.label}</span>
              <span className="text-[var(--ink-muted)]">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className={classNames(
                  "h-full rounded-full transition-all duration-1000 ease-[var(--ease-out)]",
                  item.tone === "accent" ? "bg-[var(--brand-primary)]" : "bg-[var(--brand-secondary)]",
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrendColumns({
  items,
  valueLabel,
}: {
  items: Array<{ label: string; value: number }>;
  valueLabel: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (!items.length || maxValue === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No recent activity to chart yet.</p>;
  }

  return (
    <div className="grid grid-cols-6 gap-3">
      {items.map((item) => {
        const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0);

        return (
          <div key={item.label} className="flex min-w-0 flex-col items-center gap-3">
            <div className="flex h-36 w-full items-end rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2">
              <div
                className="w-full rounded-xl bg-[var(--brand-primary)] transition-all duration-1000 ease-[var(--ease-out)]"
                style={{ height: `${height}%` }}
                title={`${item.value} ${valueLabel}`}
              />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-[var(--ink)]">{item.value}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {item.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardList({
  items,
  emptyTitle,
  emptyBody,
}: {
  items: Array<{
    key: string;
    title: string;
    subtitle: string;
    meta: string;
    status?: Parameters<typeof StatusBadge>[0]["status"];
    href?: string;
    amount?: number;
  }>;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (!items.length) {
    return (
      <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-6 py-10 text-center">
        <div className="max-w-sm space-y-2">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--ink)]">
            {emptyTitle}
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--line)]">
      {items.map((item) => (
        <div key={item.key} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-[var(--ink)]">{item.title}</p>
              {item.status ? <StatusBadge status={item.status} /> : null}
            </div>
            <p className="text-sm text-[var(--ink-muted)]">{item.subtitle}</p>
          </div>
          <div className="space-y-1 text-left sm:text-right">
            <p className="text-sm font-medium text-[var(--ink)]">
              {item.amount !== undefined ? formatCurrency(item.amount) : item.meta}
            </p>
            {item.amount !== undefined ? (
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">{item.meta}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

export function dashboardDateMeta(date: number) {
  return formatDate(date);
}
