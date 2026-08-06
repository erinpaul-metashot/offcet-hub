"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardSection,
  SummaryPill,
} from "@/components/dashboard-widgets";
import { getMakerDashboard } from "../../_mock/selectors-maker";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";

export default function MakerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("maker");
  const view = getMakerDashboard(db, scope);

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Maker"
        title={`${organisation?.name ?? "Your workshop"}: material in, products out`}
      >
        <SummaryPill label="Held by you" value={formatQuantity(view.metrics.held, "kg")} />
        <SummaryPill label="Into products" value={formatQuantity(view.metrics.transformed, "kg")} />
        <SummaryPill label="Units made" value={String(view.metrics.unitsMade)} />
      </DashboardHero>

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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Awaiting your response"
          value={view.metrics.awaitingResponse}
          accent={view.metrics.awaitingResponse > 0}
        />
        <DashboardMetricCard
          label="Active production"
          value={view.metrics.activeProduction}
          hint={`${view.metrics.overdue} overdue`}
        />
        <DashboardMetricCard label="Awaiting CIRKA review" value={view.metrics.awaitingReview} />
        <DashboardMetricCard label="Labour hours recorded" value={view.metrics.hours} />
      </div>

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
