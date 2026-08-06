"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative space-y-5 py-2">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--brand-primary)]">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-3 pt-1">{children}</div> : null}
    </div>
  );
}

export function DashboardMetricCard({
  label,
  value,
  hint,
  accent = false,
  href,
}: {
  label: string;
  value: string | number;
  /** Only a number that adds to the headline figure. Never a sentence explaining the label. */
  hint?: string;
  accent?: boolean;
  href?: string;
}) {
  const card = (
    <Panel
      interactive={Boolean(href)}
      className={classNames(
        "relative h-full p-6 animate-stagger-in",
        accent
          ? "ring-1 ring-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 bg-[var(--brand-primary-light)]/10"
          : "bg-[var(--paper)]",
        href && "group-hover:border-[var(--brand-primary)]/40",
      )}
    >
      {href ? (
        <ArrowUpRight
          size={15}
          className="absolute right-5 top-5 opacity-0 transition-opacity duration-200 ease-[var(--ease-out)] group-hover:opacity-100 text-[var(--brand-primary)]"
        />
      ) : null}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          {label}
        </p>
        <p className={classNames(
          "text-4xl font-semibold tracking-[-0.05em] tabular-nums",
          accent ? "text-[var(--brand-primary)]" : "text-[var(--ink)]"
        )}>{value}</p>
        {hint ? (
          <p className="text-[13px] leading-5 tabular-nums text-[var(--ink-muted)]">{hint}</p>
        ) : null}
      </div>
    </Panel>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="group block rounded-[1.5rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
    >
      {card}
    </Link>
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
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-[var(--ink)] tabular-nums">{value}</p>
    </div>
  );
}

export function dashboardDateMeta(date: number) {
  return formatDate(date);
}
