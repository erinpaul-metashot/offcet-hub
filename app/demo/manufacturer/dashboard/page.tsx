"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardSection,
  PieChart,
} from "@/components/dashboard-widgets";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate } from "../../_components/cirka-ui";
import { getManufacturerDashboard } from "../../_mock/selectors-manufacturer";
import { formatQuantity, orgName } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import type { Unit } from "../../_mock/domain";
import { classNames } from "@/lib/utils";
import { DiscrepancyModal } from "../../_components/discrepancy-analysis";
import type { Allocation, ResourceBatch } from "../../_mock/types";

function CompactStatsOverview({
  view,
  unit,
}: {
  view: ReturnType<typeof getManufacturerDashboard>;
  unit: Unit;
}) {
  const total = view.metrics.recorded;
  const transformed = view.metrics.transformed;
  const committed = view.metrics.committed;
  const available = view.metrics.available;

  const transformedPct = total > 0 ? (transformed / total) * 100 : 0;
  const committedPct = total > 0 ? (committed / total) * 100 : 0;
  const availablePct = total > 0 ? (available / total) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      {/* Inventory & Allocation Volume Breakdown */}
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Total Inventory Volume
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums mt-0.5">
              {formatQuantity(total, unit)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
              {Math.round(transformedPct)}% Transformed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00]" />
              {Math.round(committedPct)}% Committed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#545454]" />
              {Math.round(availablePct)}% Available
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)] shadow-inner">
            {transformed > 0 && (
              <div
                className="h-full bg-[#8CC63F] transition-all duration-700 ease-out"
                style={{ width: `${transformedPct}%` }}
                title={`Transformed: ${formatQuantity(transformed, unit)} (${Math.round(transformedPct)}%)`}
              />
            )}
            {committed > 0 && (
              <div
                className="h-full bg-[#FF5C00] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${committedPct}%` }}
                title={`Committed: ${formatQuantity(committed, unit)} (${Math.round(committedPct)}%)`}
              />
            )}
            {available > 0 && (
              <div
                className="h-full bg-[#545454] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${availablePct}%` }}
                title={`Available: ${formatQuantity(available, unit)} (${Math.round(availablePct)}%)`}
              />
            )}
          </div>
        </div>

        {/* Micro breakdown indicators */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0" />
              Transformed
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(transformed, unit)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              Committed
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(committed, unit)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              Available
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(available, unit)}
            </p>
          </div>
        </div>
      </Panel>

      {/* Operational Key Metric Cards */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
        <Link
          href="/demo/manufacturer/batches"
          className="group block focus-visible:outline-none h-full"
        >
          <Panel
            interactive
            className="p-3.5 flex items-center justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Total Lots
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                  {view.metrics.batchCount}
                </span>
                <span className="text-xs text-[var(--ink-muted)] font-medium">
                  · {view.metrics.awaitingRelease} awaiting release
                </span>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
          </Panel>
        </Link>

        <Link
          href="/demo/manufacturer/dispatch"
          className="group block focus-visible:outline-none h-full"
        >
          <Panel
            interactive
            className={classNames(
              "p-3.5 flex items-center justify-between h-full transition-all group-hover:shadow-sm",
              view.metrics.awaitingDispatch > 0
                ? "border-[#FF5C00]/40 bg-[#FF5C00]/5 hover:bg-[#FF5C00]/10"
                : "hover:border-[var(--line-strong)]"
            )}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Awaiting Dispatch
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={classNames(
                    "text-xl sm:text-2xl font-bold tracking-tight tabular-nums",
                    view.metrics.awaitingDispatch > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                  )}
                >
                  {view.metrics.awaitingDispatch}
                </span>
                {view.metrics.awaitingDispatch > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#FF5C00] text-white rounded-md shadow-xs">
                    Action required
                  </span>
                )}
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className={classNames(
                "transition-colors shrink-0",
                view.metrics.awaitingDispatch > 0 ? "text-[#FF5C00]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
              )}
            />
          </Panel>
        </Link>

        <Link
          href="/demo/manufacturer/dispatch"
          className="group block focus-visible:outline-none h-full"
        >
          <Panel
            interactive
            className={classNames(
              "p-3.5 flex items-center justify-between h-full transition-all group-hover:shadow-sm",
              view.metrics.openDiscrepancies > 0
                ? "border-[#FF5C00]/40 bg-[#FF5C00]/5 hover:bg-[#FF5C00]/10"
                : "hover:border-[var(--line-strong)]"
            )}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Open Discrepancies
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={classNames(
                    "text-xl sm:text-2xl font-bold tracking-tight tabular-nums",
                    view.metrics.openDiscrepancies > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                  )}
                >
                  {view.metrics.openDiscrepancies}
                </span>
                {view.metrics.openDiscrepancies > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#FF5C00] text-white rounded-md shadow-xs">
                    Needs review
                  </span>
                )}
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className={classNames(
                "transition-colors shrink-0",
                view.metrics.openDiscrepancies > 0 ? "text-[#FF5C00]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
              )}
            />
          </Panel>
        </Link>
      </div>
    </div>
  );
}

export default function ManufacturerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("manufacturer");
  const view = getManufacturerDashboard(db, scope);
  const unit = view.unit;

  const [activeModalAllocation, setActiveModalAllocation] = useState<{
    allocation: Allocation;
    batch?: ResourceBatch;
    toName: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Modal for Quick Discrepancy Inspection */}
      {activeModalAllocation && (
        <DiscrepancyModal
          isOpen={Boolean(activeModalAllocation)}
          onClose={() => setActiveModalAllocation(null)}
          allocation={activeModalAllocation.allocation}
          batch={activeModalAllocation.batch}
          fromName={orgName(db, scope.orgId)}
          toName={activeModalAllocation.toName}
        />
      )}

      <DashboardHero
        eyebrow="Manufacturer"
        title={`${organisation?.name ?? "Your organisation"}: inventory & allocations`}
      />

      <CompactStatsOverview view={view} unit={unit} />

      {view.metrics.openDiscrepancies > 0 && (
        <NoticeBanner tone="warning" title="Quantity Discrepancy Reported">
          <div className="space-y-3">
            {view.discrepancies.map((entry) => (
              <div key={entry.allocation._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FF5C00]/20 pb-2.5 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-semibold text-[#2A2A2A]">
                    <span className="font-bold text-[#FF5C00]">{entry.allocation.reference}</span> · {entry.batch?.name ?? `Batch ${entry.allocation.batchId}`}
                  </p>
                  <p className="text-xs text-[#545454] mt-0.5">
                    Custodian <strong>{entry.counterpartyName}</strong> received{" "}
                    {formatQuantity(entry.allocation.quantityReceived ?? 0, entry.allocation.unit)} against{" "}
                    {formatQuantity(entry.allocation.quantityDispatched ?? 0, entry.allocation.unit)} dispatched.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setActiveModalAllocation({
                        allocation: entry.allocation,
                        batch: entry.batch,
                        toName: entry.counterpartyName,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00] px-3.5 py-1 text-xs font-bold text-white hover:bg-[#e05200] transition-colors shadow-xs"
                  >
                    <span>Analyze Discrepancy</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Dispatch queue"
          action={
            <Button as={Link} href="/demo/manufacturer/dispatch" variant="secondary" size="sm" className="normal-case tracking-normal font-semibold text-xs flex items-center gap-1.5">
              <span>View Dispatch Log</span>
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.dispatchQueue.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                Nothing is waiting to be dispatched.
              </p>
            ) : (
              view.dispatchQueue.slice(0, 3).map((entry) => (
                <LinkRow
                  key={entry.allocation._id}
                  href="/demo/manufacturer/dispatch"
                  title={`${entry.allocation.reference} · ${entry.batch?.name ?? "Resource batch"}`}
                  tags={[
                    { label: "To", value: entry.toName },
                    { label: "Allocated", value: formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit) },
                    ...(entry.allocation.expectedDispatchDate
                      ? [{ label: "Expected", value: formatDate(entry.allocation.expectedDispatchDate) }]
                      : []),
                  ]}
                  right={<CirkaBadge status={entry.allocation.status} />}
                />
              ))
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Recently recorded"
          action={
            <Button as={Link} href="/demo/manufacturer/batches" variant="secondary" size="sm">
              All batches
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.recentBatches.slice(0, 3).map((row) => (
              <LinkRow
                key={row.batch._id}
                href={`/demo/manufacturer/batches/${row.batch._id}`}
                title={row.batch.name}
                tags={[
                  { label: "Ref", value: row.batch.reference },
                  { label: "Original", value: formatQuantity(row.batch.quantityOriginal, row.batch.unit) },
                  { label: "Available", value: formatQuantity(row.batch.pots.available, row.batch.unit) },
                ]}
                right={<CirkaBadge status={row.batch.exceptionStatus ?? row.batch.status} />}
              />
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <DashboardSection title="Material categories">
          <PieChart items={view.categories} emptyLabel="No batches recorded yet." />
        </DashboardSection>

        <RoleActivityFeed role="manufacturer" />
      </div>
    </div>
  );
}
