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

export default function MakerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("maker");
  const view = getMakerDashboard(db, scope);

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Maker"
        title={`${organisation?.name ?? "Your workshop"} — material in, products out`}
        description="Accept what you can use, say what the material was actually like, and record what you made with it. Your costs and prices stay private to you and CIRKA."
      >
        <SummaryPill label="Held by you" value={formatQuantity(view.metrics.held, "kg")} />
        <SummaryPill label="Into products" value={formatQuantity(view.metrics.transformed, "kg")} />
        <SummaryPill label="Units made" value={String(view.metrics.unitsMade)} />
      </DashboardHero>

      {view.metrics.awaitingResponse > 0 && (
        <NoticeBanner tone="info" title="An allocation is waiting on your decision">
          A custodian has offered you material. Accepting does not move anything yet — the quantity
          only reaches you when you confirm receipt.
        </NoticeBanner>
      )}

      {view.feedbackDue.length > 0 && (
        <NoticeBanner tone="warning" title="Suitability feedback outstanding">
          You have received material without recording what it was like. This is what makes future
          matching better, and the brand sees a summary of it.
        </NoticeBanner>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Awaiting your response"
          value={view.metrics.awaitingResponse}
          hint="Allocations proposed to you"
          accent={view.metrics.awaitingResponse > 0}
        />
        <DashboardMetricCard
          label="Active production"
          value={view.metrics.activeProduction}
          hint={`${view.metrics.overdue} past the planned completion date`}
        />
        <DashboardMetricCard
          label="Awaiting CIRKA review"
          value={view.metrics.awaitingReview}
          hint="Evidence submitted, not yet signed off"
        />
        <DashboardMetricCard
          label="Labour hours recorded"
          value={view.metrics.hours}
          hint="Across all your production batches"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Allocations"
          description="Material offered, on its way, or already with you."
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
          description="What you are making, and where each batch has reached."
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
    </div>
  );
}
