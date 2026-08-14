"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { classNames } from "@/lib/utils";

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

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      {/* Node Stock Volume Breakdown */}
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Node Stock Volume
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {formatQuantity(totalHeld, "kg")}
              </span>
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                physically held
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
              {Math.round(uncommittedPct)}% Uncommitted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00]" />
              {Math.round(promisedPct)}% Committed
            </span>
          </div>
        </div>

        {/* Multi-segment Visual Storage Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)] shadow-inner">
            {uncommitted > 0 && (
              <div
                className="h-full bg-[#8CC63F] transition-all duration-700 ease-out"
                style={{ width: `${uncommittedPct}%` }}
                title={`Uncommitted: ${formatQuantity(uncommitted, "kg")} (${Math.round(uncommittedPct)}%)`}
              />
            )}
            {promised > 0 && (
              <div
                className="h-full bg-[#FF5C00] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${promisedPct}%` }}
                title={`Committed to Makers: ${formatQuantity(promised, "kg")} (${Math.round(promisedPct)}%)`}
              />
            )}
          </div>
        </div>

        {/* Micro breakdown indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Held Here
            </p>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(totalHeld, "kg")}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0" />
              Uncommitted
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(uncommitted, "kg")}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              Committed
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(promised, "kg")}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              In Transit
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(inTransit, "kg")}
            </p>
          </div>
        </div>
      </Panel>

      {/* Operational Key Metric Cards */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Link
          href="/demo/custodian/arrivals"
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
                Awaiting Acceptance
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
              {view.metrics.awaitingAcceptance > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#FF5C00] text-white rounded-md shadow-xs">
                  Action required
                </span>
              )}
            </div>
          </Panel>
        </Link>

        <Link
          href="/demo/custodian/arrivals"
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
                Overdue Arrivals
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
              {view.metrics.overdue > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#FF5C00] text-white rounded-md shadow-xs">
                  Attention
                </span>
              )}
            </div>
          </Panel>
        </Link>

        <Link
          href="/demo/custodian/arrivals"
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Awaiting Receipt
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.awaitingReceipt}
              </span>
              <span className="text-xs text-[var(--ink-muted)] font-medium">
                in transit
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
                Makers Served
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.makersServed}
              </span>
              <span className="text-xs text-[var(--ink-muted)] font-medium">
                active network
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

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Custodian"
        title={`${organisation?.name ?? "Your node"}: arrivals, stock & dispatch`}
      />

      <CompactCustodianStatsOverview view={view} />

      {view.metrics.openDiscrepancies > 0 && (
        <NoticeBanner tone="blocking" title="An open discrepancy is waiting on CIRKA">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <Link
              href="/demo/custodian/arrivals"
              className="inline-flex items-center gap-1 shrink-0 rounded-full bg-[#FF5C00] px-3.5 py-1 text-xs font-bold text-white hover:bg-[#e05200] transition-colors shadow-xs"
            >
              <span>View Discrepant Arrivals</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Expected arrivals"
          action={
            <Button as={Link} href="/demo/custodian/arrivals" variant="secondary" size="sm">
              Open arrivals
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.arrivals.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">Nothing expected.</p>
            ) : (
              view.arrivals.slice(0, 5).map((entry) => (
                <LinkRow
                  key={entry.allocation._id}
                  href="/demo/custodian/arrivals"
                  title={`${entry.allocation.reference} · ${entry.batch?.name ?? "Resource batch"}`}
                  meta={`${entry.fromName} · ${formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}${
                    entry.allocation.expectedArrivalDate
                      ? ` · expected ${formatDate(entry.allocation.expectedArrivalDate)}`
                      : ""
                  }${entry.late ? " · overdue" : ""}`}
                  right={<CirkaBadge status={entry.allocation.status} />}
                />
              ))
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Stock held"
          action={
            <Button as={Link} href="/demo/custodian/stock" variant="secondary" size="sm">
              Open stock
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.holdings.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">Nothing held right now.</p>
            ) : (
              view.holdings.map((holding) => (
                <LinkRow
                  key={holding.batch._id}
                  href="/demo/custodian/stock"
                  title={holding.batch.name}
                  meta={`${holding.batch.reference} · owned by ${holding.ownerName} · ${formatQuantity(holding.uncommitted, holding.batch.unit)} uncommitted`}
                  right={
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {formatQuantity(holding.held, holding.batch.unit)}
                    </span>
                  }
                />
              ))
            )}
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        title="Out to makers"
        action={
          <Button as={Link} href="/demo/custodian/dispatches" variant="secondary" size="sm">
            Open dispatches
          </Button>
        }
      >
        <div className="-mx-6 -mb-6">
          {view.outgoing.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
              Nothing has been passed on yet.
            </p>
          ) : (
            view.outgoing.slice(0, 6).map((entry) => (
              <LinkRow
                key={entry.allocation._id}
                href="/demo/custodian/dispatches"
                title={`${entry.allocation.reference} · ${entry.makerName}`}
                meta={`${entry.batch?.name ?? "Resource batch"} · ${formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}`}
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
