"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Panel } from "@/components/ui";
import { DashboardHero, HorizontalBarChart, SummaryPill } from "@/components/dashboard-widgets";
import { getAdminDashboard } from "../../_mock/selectors-admin";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  QuantityPotsBar,
  SectionHeading,
  formatDate,
} from "../../_components/cirka-ui";
import { AuditTrail } from "../../_components/records";
import { useAction } from "../../_components/use-action";

const SEVERITY_STYLES = {
  blocking: "border-l-4 border-l-[#D14343]",
  warning: "border-l-4 border-l-[#E0952C]",
  info: "border-l-4 border-l-[var(--line-strong)]",
} as const;

export default function AdminDashboardPage() {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const view = getAdminDashboard(store.db);

  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actorName = (userId?: string) =>
    store.db.users.find((user) => user._id === userId)?.name ?? "System";

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="CIRKA admin"
        title="What needs a decision today"
        description="The admin queue derives every row directly from current ledger state — zero stale data, zero missed exceptions."
      >
        <SummaryPill label="Open actions" value={String(view.metrics.openActions)} />
        <SummaryPill label="Blocking" value={String(view.metrics.blocking)} />
        <SummaryPill label="Unexplained" value={formatQuantity(view.metrics.unexplained, "kg")} />
        <SummaryPill
          label="Pending approvals"
          value={String(view.metrics.pendingUsers + view.metrics.pendingOrganisations)}
        />
      </DashboardHero>

      {error && <NoticeBanner tone="blocking" title="That action was refused">{error}</NoticeBanner>}

      <Panel className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Network ledger · {view.metrics.batchCount} recorded batches
          </p>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {formatQuantity(view.metrics.recorded, "kg")} recorded
          </p>
        </div>
        <QuantityPotsBar slices={view.potSlices} total={view.metrics.recorded} unit="kg" />
      </Panel>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Action queue"
            title="Ordered by severity, then by age"
            description="Every row links straight to the decision flow."
          />

          {view.queueBySeverity.map((group) => (
            <div key={group.severity} className="space-y-2">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {group.label}
              </p>
              <Panel className="overflow-hidden">
                <ul className="divide-y divide-[var(--line)]">
                  {group.items.map((row) => {
                    const isExpanded = expandedId === row.id;

                    return (
                      <li
                        key={row.id}
                        className={`space-y-3 px-6 py-4 transition-colors ${SEVERITY_STYLES[row.severity]}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm font-medium text-[var(--ink)]">{row.title}</p>
                            <p className="text-xs text-[var(--ink-muted)]">{row.detail}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Open since {formatDate(row.since)}
                              {row.dueDate ? ` · due ${formatDate(row.dueDate)}` : ""}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <CirkaBadge status={row.severity === "blocking" ? "failed" : "open"} label={row.severity} />
                            {row.href && (
                              <Button as={Link} href={row.href} size="sm" variant="secondary">
                                Open
                              </Button>
                            )}
                            {row.stored && row.actionItemId && (
                              <Button
                                size="sm"
                                variant={isExpanded ? "secondary" : "primary"}
                                onClick={() => setExpandedId(isExpanded ? null : row.id)}
                              >
                                {isExpanded ? "Cancel" : "Respond"}
                              </Button>
                            )}
                          </div>
                        </div>

                        {isExpanded && row.stored && row.actionItemId && (
                          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 animate-stagger-in">
                            <div className="min-w-[16rem] flex-1">
                              <Field label="Resolution note">
                                <Input
                                  value={resolution[row.actionItemId] ?? ""}
                                  onChange={(event) =>
                                    setResolution((current) => ({
                                      ...current,
                                      [row.actionItemId as string]: event.target.value,
                                    }))
                                  }
                                  placeholder="What was done, and by whom"
                                  autoFocus
                                />
                              </Field>
                            </div>
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  store.closeActionItem("admin", {
                                    actionItemId: row.actionItemId as string,
                                    note: resolution[row.actionItemId as string] ?? "",
                                  }),
                                )
                              }
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  store.closeActionItem("admin", {
                                    actionItemId: row.actionItemId as string,
                                    dismiss: true,
                                    note: resolution[row.actionItemId as string] ?? "",
                                  }),
                                )
                              }
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          ))}

          {view.queue.length === 0 && (
            <NoticeBanner tone="info" title="Nothing needs a decision">
              The queue is empty — every request is matched, every allocation has moved, and all evidence has been reviewed.
            </NoticeBanner>
          )}
        </div>

        <div className="space-y-5 xl:sticky xl:top-6">
          <Panel className="space-y-5 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
              Open decisions
            </p>
            <p className="text-[42px] font-semibold leading-none tracking-[-0.04em] text-[var(--ink)] tabular-nums">
              {view.metrics.openActions}
            </p>
            <div className="space-y-2 border-t border-[var(--line)] pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#8A1F1F]">Blocking</span>
                <span className="font-semibold tabular-nums text-[#D14343]">{view.metrics.blocking}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-muted)]">Warning</span>
                <span className="font-semibold tabular-nums text-[var(--ink)]">{view.metrics.warning}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-muted)]">Info</span>
                <span className="font-semibold tabular-nums text-[var(--ink)]">{view.metrics.info}</span>
              </div>
            </div>
          </Panel>

          <Panel className="space-y-4 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
              Material categories
            </p>
            <HorizontalBarChart items={view.categories} emptyLabel="Nothing recorded yet." />
          </Panel>

          <Panel className="space-y-4 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
              Recent activity
            </p>
            <AuditTrail entries={view.recentAudit.map((row) => row.entry)} actorName={actorName} limit={5} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
