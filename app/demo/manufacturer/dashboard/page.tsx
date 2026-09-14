"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Inbox, Plus } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
  PieChart,
} from "@/components/dashboard-widgets";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate, tileHref } from "../../_components/cirka-ui";
import { getManufacturerDashboard } from "../../_mock/selectors-manufacturer";
import { categoryLabel, formatQuantity, orgName } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { statusLabel, type Unit } from "../../_mock/domain";
import { classNames } from "@/lib/utils";
import { DiscrepancyModal } from "../../_components/discrepancy-analysis";
import type { Allocation, ResourceBatch } from "../../_mock/types";

/**
 * Every batch passes Draft → Awaiting review → Recorded before it can be
 * matched. Each stage opens the batch list filtered to it; recorded batches
 * span several statuses, so that stage opens the whole list.
 */
function BatchReviewTile({ view }: { view: ReturnType<typeof getManufacturerDashboard> }) {
  const stages = [
    {
      label: statusLabel("draft"),
      count: view.reviewTrack.draft,
      href: "/demo/manufacturer/batches?status=draft",
    },
    {
      label: statusLabel("awaiting_review"),
      count: view.reviewTrack.awaitingReview,
      href: "/demo/manufacturer/batches?status=awaiting_review",
    },
    { label: "Recorded", count: view.reviewTrack.recorded, href: "/demo/manufacturer/batches" },
  ];

  return (
    <Panel className="p-3.5 flex flex-col justify-between gap-2.5 h-full">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Total Batches
        </p>
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
          {view.metrics.batchCount}
        </span>
      </div>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs" aria-label="Batch review stages">
        {stages.map((stage, index) => (
          <li key={stage.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={12} aria-hidden className="shrink-0 text-[var(--line-strong)]" />}
            <Link
              href={stage.href}
              className="group inline-flex items-baseline gap-1 rounded-md px-1.5 py-0.5 transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)]"
            >
              <span
                className={classNames(
                  "font-semibold tabular-nums",
                  stage.count > 0 ? "text-[var(--ink)]" : "text-[var(--ink-muted)]",
                )}
              >
                {stage.count}
              </span>
              <span className="text-[var(--ink-muted)] group-hover:text-[var(--ink)]">{stage.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            Recorded
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums mt-0.5">
            {formatQuantity(total, unit)}
          </p>
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
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(transformedPct)}%</span>
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              Committed
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(committed, unit)}
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(committedPct)}%</span>
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              Available
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(available, unit)}
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(availablePct)}%</span>
            </p>
          </div>
        </div>
      </Panel>

      {/* Operational Key Metric Cards */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
        <BatchReviewTile view={view} />

        <Link
          href={tileHref(
            view.readyToDispatch,
            "/demo/manufacturer/dispatch?tab=active",
            (entry) => `/demo/manufacturer/dispatch/${entry.allocation._id}`,
          )}
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
          href={tileHref(
            view.discrepancies,
            "/demo/manufacturer/dispatch?tab=discrepancy",
            (entry) => `/demo/manufacturer/dispatch/${entry.allocation._id}`,
          )}
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

/**
 * Logging what came in is the manufacturer's daily job, so it sits on the
 * dashboard. The count links to the inbox unfiltered: the intake hub only lists
 * the sorting channel, and ERP arrivals would look like nothing is waiting.
 */
function IntakeStrip({
  arrivals,
}: {
  arrivals: ReturnType<typeof getManufacturerDashboard>["pendingArrivals"];
}) {
  const named = arrivals
    .slice(0, 2)
    .map((arrival) =>
      arrival.name ??
      (arrival.materialCategory ? categoryLabel(arrival.materialCategory) : arrival.externalSystemName),
    );
  const more = arrivals.length - named.length;

  return (
    <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]">
          <Inbox size={16} />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Intake
          </p>
          {arrivals.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              No arrivals waiting
            </p>
          ) : (
            <Link
              href="/demo/manufacturer/batches/import/inbox"
              className="group inline-flex max-w-full items-center gap-1.5 text-sm text-[var(--ink)]"
            >
              <span className="shrink-0 font-semibold tabular-nums">
                {arrivals.length} arrival{arrivals.length === 1 ? "" : "s"} waiting for review
              </span>
              <span className="truncate text-[var(--ink-muted)]">
                · {named.join(" · ")}
                {more > 0 ? ` · +${more} more` : ""}
              </span>
              <ArrowRight
                size={14}
                className="shrink-0 text-[var(--line-strong)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
              />
            </Link>
          )}
        </div>
      </div>
      <Button as={Link} href="/demo/manufacturer/batches/new" size="sm" className="shrink-0 gap-1.5">
        <Plus size={14} />
        Record intake
      </Button>
    </Panel>
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

      <DashboardHero title={organisation?.name ?? "Dashboard"} />

      <CompactStatsOverview view={view} unit={unit} />

      {view.metrics.openDiscrepancies > 0 && (
        <NoticeBanner
          tone="warning"
          title={`${view.metrics.openDiscrepancies} open discrepanc${view.metrics.openDiscrepancies === 1 ? "y" : "ies"}`}
        >
          <div className="space-y-3">
            {view.discrepancies.map((entry) => (
              <div key={entry.allocation._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FF5C00]/20 pb-2.5 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-semibold text-[#2A2A2A]">
                    <span className="font-bold text-[#FF5C00]">{entry.allocation.reference}</span> · {entry.batch?.name ?? `Batch ${entry.allocation.batchId}`}
                  </p>
                  <p className="text-xs text-[#545454] mt-0.5">
                    <strong>{entry.counterpartyName}</strong> ·{" "}
                    {formatQuantity(entry.allocation.quantityReceived ?? 0, entry.allocation.unit)} of{" "}
                    {formatQuantity(entry.allocation.quantityDispatched ?? 0, entry.allocation.unit)} received
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

      <IntakeStrip arrivals={view.pendingArrivals} />

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
                  href={`/demo/manufacturer/dispatch/${entry.allocation._id}`}
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
