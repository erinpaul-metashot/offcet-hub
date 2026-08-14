"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { getMakerDashboard } from "../../_mock/selectors-maker";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { classNames } from "@/lib/utils";

function CompactMakerStatsOverview({
  view,
}: {
  view: ReturnType<typeof getMakerDashboard>;
}) {
  const held = view.metrics.held;
  const transformed = view.metrics.transformed;
  const totalWeight = held + transformed;
  const unitsMade = view.metrics.unitsMade;

  const transformedPct = totalWeight > 0 ? Math.round((transformed / totalWeight) * 100) : 0;
  const heldPct = totalWeight > 0 ? Math.round((held / totalWeight) * 100) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      {/* Material Throughput & Transformation Progress Panel */}
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Material & Production Output
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {formatQuantity(transformed, "kg")}
              </span>
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                transformed into products
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
              {transformedPct}% Into Products
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#545454]" />
              {heldPct}% In Workshop
            </span>
          </div>
        </div>

        {/* Multi-segment Visual Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)] shadow-inner">
            {transformed > 0 && (
              <div
                className="h-full bg-[#8CC63F] transition-all duration-700 ease-out"
                style={{ width: `${transformedPct}%` }}
                title={`Into Products: ${formatQuantity(transformed, "kg")} (${transformedPct}%)`}
              />
            )}
            {held > 0 && (
              <div
                className="h-full bg-[#545454] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${heldPct}%` }}
                title={`Held by you: ${formatQuantity(held, "kg")} (${heldPct}%)`}
              />
            )}
          </div>
        </div>

        {/* Micro breakdown indicators */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              Held by You
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(held, "kg")}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0" />
              Into Products
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(transformed, "kg")}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              Units Made
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--ink)] tabular-nums">
              {unitsMade}
            </p>
          </div>
        </div>
      </Panel>

      {/* Operational Workflow Status Grid */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
        {/* Awaiting your response */}
        <Link
          href="/demo/maker/allocations"
          className="group block rounded-2xl focus-visible:outline-none"
        >
          <Panel
            interactive
            className={classNames(
              "relative h-full p-4 flex flex-col justify-between space-y-2 transition-all duration-200",
              view.metrics.awaitingResponse > 0
                ? "ring-1 ring-[#FF5C00]/20 border-[#FF5C00]/30 bg-[#FF5C00]/5"
                : "bg-[var(--paper)]"
            )}
          >
            <ArrowUpRight
              size={15}
              className="absolute right-3.5 top-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[#FF5C00]"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] leading-tight pr-4">
              Awaiting Response
            </p>
            <div>
              <p
                className={classNames(
                  "text-2xl sm:text-3xl font-bold tracking-tight tabular-nums",
                  view.metrics.awaitingResponse > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                )}
              >
                {view.metrics.awaitingResponse}
              </p>
              <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-0.5">
                {view.metrics.awaitingResponse === 1 ? "1 allocation pending" : `${view.metrics.awaitingResponse} allocations`}
              </p>
            </div>
          </Panel>
        </Link>

        {/* Active Production */}
        <Link
          href="/demo/maker/production"
          className="group block rounded-2xl focus-visible:outline-none"
        >
          <Panel
            interactive
            className="relative h-full p-4 flex flex-col justify-between space-y-2 bg-[var(--paper)] transition-all duration-200"
          >
            <ArrowUpRight
              size={15}
              className="absolute right-3.5 top-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--brand-primary)]"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] leading-tight pr-4">
              Active Production
            </p>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.activeProduction}
              </p>
              <p className="text-[11px] font-medium mt-0.5 tabular-nums text-[var(--ink-muted)]">
                {view.metrics.overdue > 0 ? (
                  <span className="text-[#FF5C00] font-semibold">{view.metrics.overdue} overdue</span>
                ) : (
                  "On schedule"
                )}
              </p>
            </div>
          </Panel>
        </Link>

        {/* Awaiting CIRKA Review */}
        <Link
          href="/demo/maker/production"
          className="group block rounded-2xl focus-visible:outline-none"
        >
          <Panel
            interactive
            className="relative h-full p-4 flex flex-col justify-between space-y-2 bg-[var(--paper)] transition-all duration-200"
          >
            <ArrowUpRight
              size={15}
              className="absolute right-3.5 top-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--brand-primary)]"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] leading-tight pr-4">
              Awaiting Review
            </p>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.awaitingReview}
              </p>
              <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-0.5">
                Submitted runs
              </p>
            </div>
          </Panel>
        </Link>

        {/* Labour Hours */}
        <Link
          href="/demo/maker/production"
          className="group block rounded-2xl focus-visible:outline-none"
        >
          <Panel
            interactive
            className="relative h-full p-4 flex flex-col justify-between space-y-2 bg-[var(--paper)] transition-all duration-200"
          >
            <ArrowUpRight
              size={15}
              className="absolute right-3.5 top-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--brand-primary)]"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] leading-tight pr-4">
              Labour Hours
            </p>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.hours}
              </p>
              <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-0.5">
                Hours recorded
              </p>
            </div>
          </Panel>
        </Link>
      </div>
    </div>
  );
}

export default function MakerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("maker");
  const view = getMakerDashboard(db, scope);

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Maker"
        title={`${organisation?.name ?? "Your workshop"}: material in, products out`}
      />

      {view.metrics.awaitingResponse > 0 && (
        <NoticeBanner tone="info" title="An allocation is waiting on your decision">
          Quantity only reaches you when you confirm receipt.
        </NoticeBanner>
      )}

      {view.feedbackDue.length > 0 && (
        <NoticeBanner tone="warning" title="Suitability feedback outstanding">
          {view.feedbackDue.length} received allocation
          {view.feedbackDue.length === 1 ? "" : "s"} with no suitability recorded.
        </NoticeBanner>
      )}

      <CompactMakerStatsOverview view={view} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Allocations"
          action={
            <Button as={Link} href="/demo/maker/allocations" variant="secondary" size="sm">
              Open allocations
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.allocations.slice(0, 6).map((entry) => (
              <LinkRow
                key={entry.allocation._id}
                href="/demo/maker/allocations"
                title={`${entry.allocation.reference} · ${entry.batchName}`}
                meta={`${entry.fromName} · ${formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}${
                  entry.hasFeedback ? " · feedback recorded" : ""
                }`}
                right={<CirkaBadge status={entry.allocation.status} />}
              />
            ))}
            {view.allocations.length === 0 && (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                Nothing allocated to you yet.
              </p>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Production"
          action={
            <Button as={Link} href="/demo/maker/production" variant="secondary" size="sm">
              Open production
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.production.map((entry) => (
              <LinkRow
                key={entry.production._id}
                href={`/demo/maker/production/${entry.production._id}`}
                title={`${entry.production.reference} · ${entry.production.productName}`}
                meta={`${entry.production.actualQuantity ?? entry.production.plannedQuantity} units${
                  entry.production.plannedCompletionDate
                    ? ` · due ${formatDate(entry.production.plannedCompletionDate)}`
                    : ""
                }${entry.overdue ? " · overdue" : ""}`}
                right={<CirkaBadge status={entry.production.status} />}
              />
            ))}
            {view.production.length === 0 && (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                No production batches yet.
              </p>
            )}
          </div>
        </DashboardSection>
      </div>

      <RoleActivityFeed role="maker" />
    </div>
  );
}
