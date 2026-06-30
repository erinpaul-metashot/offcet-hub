"use client";

import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/utils";
import { Panel, StatusBadge } from "@/components/demo/ui";

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
    <Panel
      style={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--line)",
        background:
          "linear-gradient(135deg, rgba(26,86,50,0.08), rgba(26,86,50,0.02) 40%, rgba(255,255,255,1) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(26,86,50,0.12), transparent 30%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 24,
          gridTemplateColumns: children ? "minmax(0, 1fr) 320px" : "minmax(0, 1fr)",
          alignItems: "end",
          padding: 28,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--brand-green-light)",
              marginBottom: 12,
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              maxWidth: 720,
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              color: "var(--ink)",
              marginBottom: 12,
            }}
          >
            {title}
          </h1>
          <p style={{ maxWidth: 560, fontSize: 15, lineHeight: 1.6, color: "var(--ink-muted)" }}>
            {description}
          </p>
        </div>
        {children ? <div style={{ display: "grid", gap: 12 }}>{children}</div> : null}
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
      style={{
        height: "100%",
        padding: 20,
        backgroundColor: accent ? "rgba(232, 244, 237, 0.4)" : "var(--paper)",
        borderColor: accent ? "rgba(26, 86, 50, 0.25)" : "var(--line)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.05em",
          color: "var(--ink)",
          marginBottom: 12,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-muted)" }}>{hint}</p>
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
    <Panel style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          borderBottom: "1px solid var(--line)",
          backgroundColor: "rgba(251, 251, 251, 0.8)",
          padding: "16px 20px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              marginBottom: description ? 4 : 0,
            }}
          >
            {title}
          </h2>
          {description ? (
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-muted)" }}>
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

export function HorizontalBarChart({
  items,
  emptyLabel = "No data yet",
}: {
  items: Array<{ label: string; value: number; tone?: "default" | "accent" }>;
  emptyLabel?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (!items.length || maxValue === 0) {
    return <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{emptyLabel}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {items.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0);

        return (
          <div key={item.label} style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>{item.label}</span>
              <span style={{ color: "var(--ink-muted)" }}>{item.value}</span>
            </div>
            <div
              style={{
                height: 10,
                overflow: "hidden",
                borderRadius: 999,
                backgroundColor: "var(--muted)",
              }}
            >
              <div
                style={{
                  width: `${width}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor:
                    item.tone === "accent" ? "var(--brand-green)" : "var(--line-strong)",
                }}
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
    return <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>No recent activity to chart yet.</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
      {items.map((item) => {
        const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0);

        return (
          <div
            key={item.label}
            style={{
              display: "flex",
              minWidth: 0,
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                height: 128,
                width: "100%",
                alignItems: "flex-end",
                border: "1px solid var(--line)",
                background:
                  "linear-gradient(180deg, rgba(26,86,50,0.06), rgba(26,86,50,0.14))",
                padding: 8,
                borderRadius: 24,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${height}%`,
                  borderRadius: 16,
                  background:
                    "linear-gradient(180deg, var(--brand-green-light), var(--brand-green))",
                }}
                title={`${item.value} ${valueLabel}`}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                {item.value}
              </p>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                }}
              >
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
      <div
        style={{
          display: "grid",
          minHeight: 176,
          placeItems: "center",
          border: "1px dashed var(--line)",
          backgroundColor: "var(--surface)",
          padding: "40px 24px",
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
            {emptyTitle}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-muted)" }}>{emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={item.key}
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            padding: "16px 0",
            borderTop: index === 0 ? "none" : "1px solid var(--line)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </p>
              {item.status ? <StatusBadge status={item.status} /> : null}
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{item.subtitle}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              {item.amount !== undefined ? formatCurrency(item.amount) : item.meta}
            </p>
            {item.amount !== undefined ? (
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                }}
              >
                {item.meta}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
