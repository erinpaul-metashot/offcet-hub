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
    <Panel className="relative overflow-hidden border-[var(--line)] bg-[linear-gradient(135deg,rgba(26,86,50,0.08),rgba(26,86,50,0.02)_40%,rgba(255,255,255,1)_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(26,86,50,0.12),transparent_30%)]" />
      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-green-light)]">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-muted)] sm:text-base">
            {description}
          </p>
        </div>
        {children ? <div className="grid gap-3">{children}</div> : null}
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
        "h-full p-5",
        accent
          ? "border-[var(--brand-green)]/25 bg-[var(--brand-green-muted)]/40"
          : "bg-[var(--paper)]",
      )}
    >
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{value}</p>
        <p className="text-sm leading-5 text-[var(--ink-muted)]">{hint}</p>
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
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--surface)]/80 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h2>
          {description ? (
            <p className="text-sm leading-5 text-[var(--ink-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
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
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className={classNames(
                  "h-full rounded-full",
                  item.tone === "accent" ? "bg-[var(--brand-green)]" : "bg-[var(--line-strong)]",
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
            <div className="flex h-32 w-full items-end rounded-2xl border border-[var(--line)] bg-[linear-gradient(180deg,rgba(26,86,50,0.06),rgba(26,86,50,0.14))] p-2">
              <div
                className="w-full rounded-xl bg-[linear-gradient(180deg,var(--brand-green-light),var(--brand-green))]"
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
      <div className="grid min-h-44 place-items-center border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
        <div className="max-w-sm space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ink)]">
            {emptyTitle}
          </p>
          <p className="text-sm leading-6 text-[var(--ink-muted)]">{emptyBody}</p>
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
    <div className="rounded-2xl border border-[var(--brand-green)]/20 bg-white/70 px-4 py-3 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

export function dashboardDateMeta(date: number) {
  return formatDate(date);
}
