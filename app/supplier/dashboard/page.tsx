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

export default function SupplierOverview() {
  const dashboard = useQuery(api.lots.getSupplierDashboard);

  if (dashboard === undefined) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-green)] border-t-transparent" />
          <p className="text-sm text-[var(--ink-muted)]">Loading supplier dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DashboardHero
        eyebrow="Supplier Snapshot"
        title="Track what you have listed, what is moving, and where buyer interest is showing up."
        description="This keeps your dashboard centered on the real commercial flow in the app: lot pipeline, expected value, assignment activity, and the listings that need attention soon."
      >
        <SummaryPill label="Active Lots" value={`${dashboard.summary.activeLots}`} />
        <SummaryPill
          label="Expected Value"
          value={formatCurrency(dashboard.summary.totalExpectedValue)}
        />
        <SummaryPill
          label="Interested Responses"
          value={`${dashboard.summary.interestedResponses}`}
        />
      </DashboardHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Total Lots"
          value={dashboard.summary.totalLots}
          hint="All lots created by your account."
        />
        <DashboardMetricCard
          label="Active Pipeline"
          value={dashboard.summary.activeLots}
          hint="Draft-excluded lots that are in review or live."
          accent
        />
        <DashboardMetricCard
          label="Assignments"
          value={dashboard.summary.totalAssignments}
          hint="Buyer and agent assignment activity across your supply."
        />
        <DashboardMetricCard
          label="Sold Lots"
          value={dashboard.summary.soldLots}
          hint="Lots that have already been closed out."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          title="Lots Added Over Time"
          description="Your listing activity across the last six months."
          action={
            <Button as={Link} href="/supplier/lots/new" variant="secondary" size="sm">
              Create Lot
            </Button>
          }
        >
          <TrendColumns items={dashboard.charts.lotTrend} valueLabel="lots" />
        </DashboardSection>

        <DashboardSection
          title="Pipeline Status"
          description="How your current supply is distributed by lifecycle stage."
        >
          <HorizontalBarChart items={dashboard.charts.statusBreakdown} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Top Categories"
          description="The categories you list most often."
        >
          <HorizontalBarChart
            items={dashboard.charts.categoryBreakdown}
            emptyLabel="Your category mix will appear once lots are added."
          />
        </DashboardSection>

        <DashboardSection
          title="Buyer Response Mix"
          description="Signals coming back from assignments on your lots."
        >
          <HorizontalBarChart items={dashboard.charts.responseBreakdown} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Expiring Lots"
          description="Listings that may need attention first."
          action={
            <Button as={Link} href="/supplier/lots" variant="secondary" size="sm">
              Open My Lots
            </Button>
          }
        >
          <DashboardList
            items={dashboard.lists.expiringLots.map((lot) => ({
              key: lot._id,
              title: lot.title,
              subtitle: lot.location,
              meta: `Expires ${formatDate(lot.expiresAt)}`,
              status: lot.status,
              amount: lot.expectedPrice,
            }))}
            emptyTitle="No urgent expiries"
            emptyBody="The nearest live expiry dates will appear here once your lots are active."
          />
        </DashboardSection>

        <DashboardSection
          title="Recent Lot Activity"
          description="Latest updates across your supply feed."
        >
          <DashboardList
            items={dashboard.lists.recentLots.map((lot) => ({
              key: lot._id,
              title: lot.title,
              subtitle: `${sentenceCase(lot.category)} • ${lot.assignmentCount} assignments`,
              meta: `Updated ${formatDate(lot.updatedAt)}`,
              status: lot.status,
              amount: lot.expectedPrice,
            }))}
            emptyTitle="No recent updates"
            emptyBody="Your newest or most recently updated lots will appear here."
          />
        </DashboardSection>
      </div>
    </div>
  );
}
