"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardList,
  DashboardSection,
  HorizontalBarChart,
  SummaryPill,
  TrendColumns,
} from "@/components/dashboard-widgets";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export default function BuyerOverview() {
  const dashboard = useQuery(api.assignments.getBuyerDashboard);

  if (dashboard === undefined) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-green)] border-t-transparent" />
          <p className="text-sm text-[var(--ink-muted)]">Loading buyer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DashboardHero
        eyebrow="Buyer Pulse"
        title="A sharper view of what has been assigned to you and what deserves a response."
        description="This dashboard keeps the buying side practical: live opportunities, pipeline value, response posture, and the lots that are closest to expiring."
      >
        <SummaryPill label="Active Lots" value={`${dashboard.summary.activeLots}`} />
        <SummaryPill
          label="Pipeline Value"
          value={formatCurrency(dashboard.summary.totalPipelineValue)}
        />
        <SummaryPill label="Pending Replies" value={`${dashboard.summary.pendingResponses}`} />
      </DashboardHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Assigned Lots"
          value={dashboard.summary.assignedLots}
          hint="All lots routed to your account so far."
        />
        <DashboardMetricCard
          label="Active Opportunities"
          value={dashboard.summary.activeLots}
          hint="Assignments that are still currently open."
          accent
        />
        <DashboardMetricCard
          label="Interested"
          value={dashboard.summary.interestedLots}
          hint="Lots you have already signaled interest in."
        />
        <DashboardMetricCard
          label="Expiring Soon"
          value={dashboard.summary.expiringSoon}
          hint="Assignments nearest to their expiry date."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          title="Assignment Trend"
          description="How many lots were assigned to you over the last six months."
          action={
            <Button as={Link} href="/buyer/lots" variant="secondary" size="sm">
              Open Assigned Lots
            </Button>
          }
        >
          <TrendColumns items={dashboard.charts.assignmentTrend} valueLabel="assignments" />
        </DashboardSection>

        <DashboardSection
          title="Response Breakdown"
          description="Where your replies currently stand."
        >
          <HorizontalBarChart items={dashboard.charts.responseBreakdown} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Category Mix"
          description="The kinds of inventory currently being assigned to you."
        >
          <HorizontalBarChart
            items={dashboard.charts.categoryBreakdown}
            emptyLabel="Category patterns will show up once assignments begin."
          />
        </DashboardSection>

        <DashboardSection
          title="Urgent Follow-up"
          description="Active lots that expire soonest."
        >
          <DashboardList
            items={dashboard.lists.urgentLots.map((lot) => ({
              key: lot.assignmentId,
              title: lot.title,
              subtitle: `${sentenceCase(lot.category)} • ${lot.location}`,
              meta: `Expires ${formatDate(lot.expiresAt)}`,
              status: lot.responseStatus,
              amount: lot.expectedPrice,
            }))}
            emptyTitle="No urgent lots"
            emptyBody="As active assignments near expiry, they will appear here for quick follow-up."
          />
        </DashboardSection>
      </div>

      <DashboardSection
        title="Recent Assignments"
        description="The newest supply opportunities delivered to your feed."
      >
        <DashboardList
          items={dashboard.lists.recentAssignments.map((lot) => ({
            key: lot.assignmentId,
            title: lot.title,
            subtitle: `${lot.supplierName} • ${lot.location}`,
            meta: `Assigned ${formatDate(lot.assignedAt)}`,
            status: lot.responseStatus,
            amount: lot.expectedPrice,
          }))}
          emptyTitle="No recent assignments"
          emptyBody="When new lots are matched to you, they will be listed here."
        />
      </DashboardSection>
    </div>
  );
}
