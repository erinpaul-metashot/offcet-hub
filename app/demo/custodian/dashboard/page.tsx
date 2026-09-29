"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCustodian } from "@/lib/i18n/messages/demo-custodian";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner, tileHref } from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { classNames } from "@/lib/utils";
import { DiscrepancyModal } from "../../_components/discrepancy-analysis";
import type { Allocation, ResourceBatch } from "../../_mock/types";

/** One arrival opens straight into its drawer on the arrivals page. */
const arrivalHref = (entry: { allocation: { _id: string } }) =>
  `/demo/custodian/arrivals?id=${entry.allocation._id}`;

function CompactCustodianStatsOverview({
  view,
}: {
  view: ReturnType<typeof getCustodianDashboard>;
}) {
  const totalHeld = view.metrics.totalHeld;
  const uncommitted = view.metrics.uncommitted;
  const promised = Math.max(0, totalHeld - uncommitted);
  const inTransit = view.metrics.inTransit;

  const uncommittedPct = totalHeld > 0 ? (uncommitted / totalHeld) * 100 : 0;
  const promisedPct = totalHeld > 0 ? (promised / totalHeld) * 100 : 0;
  const { dashboard: t } = useMessages(demoCustodian);
  const fmt = useFormat();

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      {/* Node Stock Volume Breakdown */}
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            {t.held}
          </p>
          <p className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
            {fmt.quantity(totalHeld, "kg")}
          </p>
        </div>

        {/* Multi-segment Visual Storage Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)] shadow-inner">
            {uncommitted > 0 && (
              <div
                className="h-full bg-[#8CC63F] transition-all duration-700 ease-out"
                style={{ width: `${uncommittedPct}%` }}
                title={format(t.barTitle, { label: t.unassigned, quantity: fmt.quantity(uncommitted, "kg"), percent: Math.round(uncommittedPct) })}
              />
            )}
            {promised > 0 && (
              <div
                className="h-full bg-[#FF5C00] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${promisedPct}%` }}
                title={format(t.barTitle, { label: t.assigned, quantity: fmt.quantity(promised, "kg"), percent: Math.round(promisedPct) })}
              />
            )}
          </div>
        </div>

        {/* Micro breakdown indicators */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0" />
              {t.unassigned}
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {fmt.quantity(uncommitted, "kg")}
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(uncommittedPct)}%</span>
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              {t.assigned}
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {fmt.quantity(promised, "kg")}
              <span className="ml-1 text-xs font-medium text-[var(--ink-muted)]">{Math.round(promisedPct)}%</span>
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              {t.inTransit}
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {fmt.quantity(inTransit, "kg")}
            </p>
          </div>
        </div>
      </Panel>

      {/* Operational Key Metric Cards */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Link
          href={tileHref(
            view.arrivals.filter((entry) => entry.allocation.status === "proposed"),
            "/demo/custodian/arrivals#group-action",
            arrivalHref,
          )}
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className={classNames(
              "p-3.5 flex flex-col justify-between h-full transition-all group-hover:shadow-sm",
              view.metrics.awaitingAcceptance > 0
                ? "border-[#FF5C00]/40 bg-[#FF5C00]/5 hover:bg-[#FF5C00]/10"
                : "hover:border-[var(--line-strong)]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {t.awaitingAcceptance}
              </p>
              <ArrowUpRight
                size={15}
                className={classNames(
                  "transition-colors shrink-0",
                  view.metrics.awaitingAcceptance > 0 ? "text-[#FF5C00]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
                )}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={classNames(
                  "text-xl sm:text-2xl font-bold tracking-tight tabular-nums",
                  view.metrics.awaitingAcceptance > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                )}
              >
                {view.metrics.awaitingAcceptance}
              </span>
            </div>
          </Panel>
        </Link>

        <Link
          href={tileHref(
            view.arrivals.filter((entry) => entry.late),
            "/demo/custodian/arrivals",
            arrivalHref,
          )}
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className={classNames(
              "p-3.5 flex flex-col justify-between h-full transition-all group-hover:shadow-sm",
              view.metrics.overdue > 0
                ? "border-[#FF5C00]/40 bg-[#FF5C00]/5 hover:bg-[#FF5C00]/10"
                : "hover:border-[var(--line-strong)]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {t.overdueArrivals}
              </p>
              <ArrowUpRight
                size={15}
                className={classNames(
                  "transition-colors shrink-0",
                  view.metrics.overdue > 0 ? "text-[#FF5C00]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
                )}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={classNames(
                  "text-xl sm:text-2xl font-bold tracking-tight tabular-nums",
                  view.metrics.overdue > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                )}
              >
                {view.metrics.overdue}
              </span>
            </div>
          </Panel>
        </Link>

        <Link
          href={tileHref(
            view.arrivals.filter((entry) => entry.allocation.status === "in_transit"),
            "/demo/custodian/arrivals",
            arrivalHref,
          )}
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {t.awaitingReceipt}
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.awaitingReceipt}
              </span>
            </div>
          </Panel>
        </Link>

        <Link
          href="/demo/custodian/dispatches"
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {t.makersServed}
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.makersServed}
              </span>
            </div>
          </Panel>
        </Link>
      </div>
    </div>
  );
}

export default function CustodianDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("custodian");
  const view = getCustodianDashboard(db, scope);
  const { dashboard: t } = useMessages(demoCustodian);
  const fmt = useFormat();

  const [activeModalAllocation, setActiveModalAllocation] = useState<{
    allocation: Allocation;
    batch?: ResourceBatch;
    fromName: string;
    toName: string;
  } | null>(null);

  const discrepancyEntries = view.arrivals.filter(
    (entry) => entry.allocation.status === "discrepancy",
  );

  return (
    <div className="space-y-6">
      {/* Modal for Quick Discrepancy Inspection */}
      {activeModalAllocation && (
        <DiscrepancyModal
          isOpen={Boolean(activeModalAllocation)}
          onClose={() => setActiveModalAllocation(null)}
          allocation={activeModalAllocation.allocation}
          batch={activeModalAllocation.batch}
          fromName={activeModalAllocation.fromName}
          toName={activeModalAllocation.toName}
        />
      )}

      <DashboardHero title={organisation?.name ?? t.title} />

      <CompactCustodianStatsOverview view={view} />

      {discrepancyEntries.length > 0 && (
        <NoticeBanner
          tone="blocking"
          title={format(discrepancyEntries.length === 1 ? t.discrepancyOne : t.discrepancyMany, {
            count: discrepancyEntries.length,
          })}
        >
          <div className="space-y-3 pt-1">
            {discrepancyEntries.map((entry) => {
              const dispatched =
                entry.allocation.quantityDispatched ?? entry.allocation.quantityAllocated;
              const received = entry.allocation.quantityReceived ?? 0;
              const shortfall =
                entry.allocation.quantityDiscrepancy ?? Math.max(0, dispatched - received);

              return (
                <div
                  key={entry.allocation._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FF5C00]/20 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#2A2A2A]">
                      <span className="font-bold text-[#FF5C00]">{entry.allocation.reference}</span> ·{" "}
                      {entry.batch?.name ?? format(t.batchFallback, { id: entry.allocation.batchId })}
                    </p>
                    <p className="text-xs text-[#545454] mt-0.5">
                      {t.from} <strong>{entry.fromName}</strong> ·{" "}
                      {format(t.receivedOf, {
                        received: fmt.quantity(received, entry.allocation.unit),
                        dispatched: fmt.quantity(dispatched, entry.allocation.unit),
                      })}{" "}
                      (
                      <span className="font-semibold text-[#FF5C00]">
                        {format(t.short, { quantity: fmt.quantity(shortfall, entry.allocation.unit) })}
                      </span>
                      )
                    </p>
                    {entry.allocation.discrepancyReason && (
                      <p className="text-[11px] text-[var(--ink-muted)] italic mt-1">
                        “{entry.allocation.discrepancyReason}”
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveModalAllocation({
                          allocation: entry.allocation,
                          batch: entry.batch,
                          fromName: entry.fromName,
                          toName: organisation?.name ?? "Malmö Resource Node",
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#e05200] transition-colors shadow-xs"
                    >
                      <span>{t.analyze}</span>
                      <ArrowUpRight size={13} />
                    </button>
                    <Link
                      href={`/demo/custodian/arrivals?id=${entry.allocation._id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors"
                    >
                      <span>{t.openInArrivals}</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title={t.expectedArrivals}
          action={
            <Button as={Link} href="/demo/custodian/arrivals" variant="secondary" size="sm">
              {t.openArrivals}
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.arrivals.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">{t.nothingExpected}</p>
            ) : (
              view.arrivals.slice(0, 5).map((entry) => (
                <LinkRow
                  key={entry.allocation._id}
                  href={`/demo/custodian/arrivals?id=${entry.allocation._id}`}
                  title={`${entry.allocation.reference} · ${entry.batch?.name ?? t.resourceBatch}`}
                  meta={`${entry.fromName} · ${fmt.quantity(entry.allocation.quantityAllocated, entry.allocation.unit)}${
                    entry.allocation.expectedArrivalDate
                      ? format(t.expected, { date: fmt.date(entry.allocation.expectedArrivalDate) })
                      : ""
                  }${entry.late ? t.overdue : ""}`}
                  right={<CirkaBadge status={entry.allocation.status} />}
                />
              ))
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title={t.stockHeld}
          action={
            <Button as={Link} href="/demo/custodian/stock" variant="secondary" size="sm">
              {t.openStock}
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.holdings.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">{t.nothingHeld}</p>
            ) : (
              view.holdings.map((holding) => (
                <LinkRow
                  key={holding.batch._id}
                  href={`/demo/custodian/stock?batchId=${holding.batch._id}`}
                  title={holding.batch.name}
                  meta={format(t.holdingMeta, {
                    reference: holding.batch.reference,
                    owner: holding.ownerName,
                    quantity: fmt.quantity(holding.uncommitted, holding.batch.unit),
                  })}
                  right={
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {fmt.quantity(holding.held, holding.batch.unit)}
                    </span>
                  }
                />
              ))
            )}
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        title={t.outToMakers}
        action={
          <Button as={Link} href="/demo/custodian/dispatches" variant="secondary" size="sm">
            {t.openDispatches}
          </Button>
        }
      >
        <div className="-mx-6 -mb-6">
          {view.outgoing.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
              {t.nothingPassed}
            </p>
          ) : (
            view.outgoing.slice(0, 6).map((entry) => (
              <LinkRow
                key={entry.allocation._id}
                href={`/demo/custodian/dispatches?id=${entry.allocation._id}`}
                title={`${entry.allocation.reference} · ${entry.makerName}`}
                meta={`${entry.batch?.name ?? t.resourceBatch} · ${fmt.quantity(entry.allocation.quantityAllocated, entry.allocation.unit)}`}
                right={<CirkaBadge status={entry.allocation.status} />}
              />
            ))
          )}
        </div>
      </DashboardSection>

      <RoleActivityFeed role="custodian" />
    </div>
  );
}
