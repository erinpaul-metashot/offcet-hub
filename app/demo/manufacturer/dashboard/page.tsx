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
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { CirkaBadge, LinkRow, NoticeBanner, tileHref } from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";
import { useLabels } from "../../_components/use-labels";
import { getManufacturerDashboard } from "../../_mock/selectors-manufacturer";
import { orgName } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { statusLabelIn } from "../../_mock/domain-labels";
import type { Unit } from "../../_mock/domain";
import { classNames } from "@/lib/utils";
import { DiscrepancyModal } from "../../_components/discrepancy-analysis";
import type { Allocation, ResourceBatch } from "../../_mock/types";

/**
 * Every batch passes Draft → Awaiting review → Recorded before it can be
 * matched. Each stage opens the batch list filtered to it; recorded batches
 * span several statuses, so that stage opens the whole list.
 */
function BatchReviewTile({ view }: { view: ReturnType<typeof getManufacturerDashboard> }) {
  const { dashboard: t } = useMessages(demoManufacturer);
  const labels = useLabels();
  const stages = [
    {
      label: statusLabelIn(labels, "draft"),
      count: view.reviewTrack.draft,
      href: "/demo/manufacturer/batches?status=draft",
    },
    {
      label: statusLabelIn(labels, "awaiting_review"),
      count: view.reviewTrack.awaitingReview,
      href: "/demo/manufacturer/batches?status=awaiting_review",
    },
    { label: t.recordedStage, count: view.reviewTrack.recorded, href: "/demo/manufacturer/batches" },
  ];

  return (
    <Panel className="p-3.5 flex flex-col justify-between gap-2.5 h-full">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {t.totalBatches}
        </p>
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
          {view.metrics.batchCount}
        </span>
      </div>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs" aria-label={t.reviewStages}>
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
  const { dashboard: t } = useMessages(demoManufacturer);
  const fmt = useFormat();

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      {/* Inventory & Allocation Volume Breakdown */}
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            {t.recorded}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums mt-0.5">
            {fmt.quantity(total, unit)}
          </p>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)] shadow-inner">
            {transformed > 0 && (
              <div
                className="h-full bg-[#8CC63F] transition-all duration-700 ease-out"
                style={{ width: `${transformedPct}%` }}
                title={format(t.barTitle, { label: t.transformed, quantity: fmt.quantity(transformed, unit), percent: Math.round(transformedPct) })}
              />
            )}
            {committed > 0 && (
              <div
                className="h-full bg-[#FF5C00] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${committedPct}%` }}
                title={format(t.barTitle, { label: t.committed, quantity: fmt.quantity(committed, unit), percent: Math.round(committedPct) })}
              />
            )}
            {available > 0 && (
              <div
                className="h-full bg-[#545454] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${availablePct}%` }}
                title={format(t.barTitle, { label: t.available, quantity: fmt.quantity(available, unit), percent: Math.round(availablePct) })}
              />
            )}
          </div>
        </div>

        {/* Micro breakdown indicators */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0" />
              {t.transformed}
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {fmt.quantity(transformed, unit)}
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(transformedPct)}%</span>
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              {t.committed}
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {fmt.quantity(committed, unit)}
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(committedPct)}%</span>
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              {t.available}
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {fmt.quantity(available, unit)}
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
                {t.awaitingDispatch}
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
                {t.openDiscrepancies}
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
  const { dashboard: t } = useMessages(demoManufacturer);
  const labels = useLabels();
  const named = arrivals
    .slice(0, 2)
    .map((arrival) =>
      arrival.name ??
      (arrival.materialCategory ? labels.MATERIAL_CATEGORY_LABELS[arrival.materialCategory] : arrival.externalSystemName),
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
            {t.intake}
          </p>
          {arrivals.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              {t.noArrivals}
            </p>
          ) : (
            <Link
              href="/demo/manufacturer/batches/import/inbox"
              className="group inline-flex max-w-full items-center gap-1.5 text-sm text-[var(--ink)]"
            >
              <span className="shrink-0 font-semibold tabular-nums">
                {format(arrivals.length === 1 ? t.arrivalsOne : t.arrivalsMany, { count: arrivals.length })}
              </span>
              <span className="truncate text-[var(--ink-muted)]">
                · {named.join(" · ")}
                {more > 0 ? format(t.more, { count: more }) : ""}
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
        {t.recordIntake}
      </Button>
    </Panel>
  );
}

export default function ManufacturerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("manufacturer");
  const view = getManufacturerDashboard(db, scope);
  const unit = view.unit;
  const { dashboard: t } = useMessages(demoManufacturer);
  const labels = useLabels();
  const fmt = useFormat();

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

      <DashboardHero title={organisation?.name ?? t.title} />

      <CompactStatsOverview view={view} unit={unit} />

      {view.metrics.openDiscrepancies > 0 && (
        <NoticeBanner
          tone="warning"
          title={format(view.metrics.openDiscrepancies === 1 ? t.discrepancyOne : t.discrepancyMany, {
            count: view.metrics.openDiscrepancies,
          })}
        >
          <div className="space-y-3">
            {view.discrepancies.map((entry) => (
              <div key={entry.allocation._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FF5C00]/20 pb-2.5 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-semibold text-[#2A2A2A]">
                    <span className="font-bold text-[#FF5C00]">{entry.allocation.reference}</span> · {entry.batch?.name ?? format(t.batchFallback, { id: entry.allocation.batchId })}
                  </p>
                  <p className="text-xs text-[#545454] mt-0.5">
                    <strong>{entry.counterpartyName}</strong> ·{" "}
                    {format(t.receivedOf, {
                      received: fmt.quantity(entry.allocation.quantityReceived ?? 0, entry.allocation.unit),
                      dispatched: fmt.quantity(entry.allocation.quantityDispatched ?? 0, entry.allocation.unit),
                    })}
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
                    <span>{t.analyze}</span>
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
          title={t.dispatchQueue}
          action={
            <Button as={Link} href="/demo/manufacturer/dispatch" variant="secondary" size="sm" className="normal-case tracking-normal font-semibold text-xs flex items-center gap-1.5">
              <span>{t.viewDispatchLog}</span>
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.dispatchQueue.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                {t.nothingToDispatch}
              </p>
            ) : (
              view.dispatchQueue.slice(0, 3).map((entry) => (
                <LinkRow
                  key={entry.allocation._id}
                  href={`/demo/manufacturer/dispatch/${entry.allocation._id}`}
                  title={`${entry.allocation.reference} · ${entry.batch?.name ?? t.resourceBatch}`}
                  tags={[
                    { label: t.to, value: entry.toName },
                    { label: t.allocated, value: fmt.quantity(entry.allocation.quantityAllocated, entry.allocation.unit) },
                    ...(entry.allocation.expectedDispatchDate
                      ? [{ label: t.expected, value: fmt.date(entry.allocation.expectedDispatchDate) }]
                      : []),
                  ]}
                  right={<CirkaBadge status={entry.allocation.status} />}
                />
              ))
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title={t.recentlyRecorded}
          action={
            <Button as={Link} href="/demo/manufacturer/batches" variant="secondary" size="sm">
              {t.allBatches}
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
                  { label: t.ref, value: row.batch.reference },
                  { label: t.original, value: fmt.quantity(row.batch.quantityOriginal, row.batch.unit) },
                  { label: t.available, value: fmt.quantity(row.batch.pots.available, row.batch.unit) },
                ]}
                right={<CirkaBadge status={row.batch.exceptionStatus ?? row.batch.status} />}
              />
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <DashboardSection title={t.categories}>
          <PieChart
            items={view.categories.map((item) => ({ ...item, label: labels.MATERIAL_CATEGORY_LABELS[item.key] ?? item.label }))}
            emptyLabel={t.noBatches}
          />
        </DashboardSection>

        <RoleActivityFeed role="manufacturer" />
      </div>
    </div>
  );
}
