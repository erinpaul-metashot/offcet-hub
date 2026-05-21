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

export default function AdminOverview() {
  const dashboard = useQuery(api.admin.getDashboardOverview);

  if (dashboard === undefined) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-green)] border-t-transparent" />
          <p className="text-sm text-[var(--ink-muted)]">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DashboardHero
        eyebrow="Platform Control"
        title="A clean read on approvals, supply flow, and live marketplace activity."
        description="This view highlights the real operational pressure points in the app right now: who is waiting for review, how much supply is live, and where buyer engagement is actually happening."
      >
        <SummaryPill label="Pending Users" value={`${dashboard.summary.pendingUsers}`} />
        <SummaryPill label="Pending Lots" value={`${dashboard.summary.pendingLots}`} />
        <SummaryPill
          label="Live Supply Value"
          value={formatCurrency(dashboard.summary.liveSupplyValue)}
        />
      </DashboardHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Total Users"
          value={dashboard.summary.totalUsers}
          hint="Registered accounts across every role."
        />
        <DashboardMetricCard
          label="Live Lots"
          value={dashboard.summary.liveLots}
          hint="Approved or assigned lots currently in circulation."
          accent
        />
        <DashboardMetricCard
          label="Assignments"
          value={dashboard.summary.totalAssignments}
          hint="Total lot-to-buyer or agent assignment records."
        />
        <DashboardMetricCard
          label="Interested Responses"
          value={dashboard.summary.interestedResponses}
          hint="Buyer signals that are worth following up on."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          title="Supply Added Over Time"
          description="Lots created in the last six months."
          action={
            <Button as={Link} href="/admin/lots" variant="secondary" size="sm">
              Manage Supply
            </Button>
          }
        >
          <TrendColumns items={dashboard.charts.lotTrend} valueLabel="lots" />
        </DashboardSection>

        <DashboardSection
          title="Account Mix"
          description="Approved users by role."
          action={
            <Button as={Link} href="/admin/users" variant="secondary" size="sm">
              Review Users
            </Button>
          }
        >
          <HorizontalBarChart items={dashboard.charts.roleBreakdown} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Supply Status"
          description="Where inventory is sitting in the process right now."
        >
          <HorizontalBarChart items={dashboard.charts.supplyBreakdown} />
        </DashboardSection>

        <DashboardSection
          title="Top Categories"
          description="Most common supply categories currently in the app."
        >
          <HorizontalBarChart
            items={dashboard.charts.categoryBreakdown}
            emptyLabel="Category breakdown will populate as suppliers add lots."
          />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardSection
          title="Pending User Approvals"
          description="Newest registration requests waiting on admin action."
        >
          <DashboardList
            items={dashboard.queues.pendingUsers.map((user) => ({
              key: user._id,
              title: user.name,
              subtitle: `${sentenceCase(user.role)} • ${user.email}`,
              meta: formatDate(user.createdAt),
            }))}
            emptyTitle="No pending users"
            emptyBody="New registrations will appear here when they are submitted."
          />
        </DashboardSection>

        <DashboardSection
          title="Pending Lot Reviews"
          description="Supply waiting to be reviewed before it can go live."
        >
          <DashboardList
            items={dashboard.queues.pendingLots.map((lot) => ({
              key: lot._id,
              title: lot.title,
              subtitle: `${lot.supplierName} • ${lot.location}`,
              meta: `${sentenceCase(lot.category)} • ${formatDate(lot.createdAt)}`,
              amount: lot.expectedPrice,
            }))}
            emptyTitle="Review queue is clear"
            emptyBody="There are no supplier lots waiting for approval right now."
          />
        </DashboardSection>

        <DashboardSection
          title="Expiring Soon"
          description="Live lots that may need action before they age out."
        >
          <DashboardList
            items={dashboard.queues.expiringLots.map((lot) => ({
              key: lot._id,
              title: lot.title,
              subtitle: `${lot.supplierName} • ${lot.location}`,
              meta: `Expires ${formatDate(lot.expiresAt)}`,
              status: lot.status,
              amount: lot.expectedPrice,
            }))}
            emptyTitle="No urgent expiries"
            emptyBody="Approved and assigned lots with the nearest expiry dates will show up here."
          />
        </DashboardSection>
      </div>
    </div>
  );
}
