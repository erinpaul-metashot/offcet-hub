"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardSection,
  SummaryPill,
} from "@/components/dashboard-widgets";
import { getBrandDashboard } from "../../_mock/selectors-brand";
import { formatPercent, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";

export default function BrandDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("brand");
  const view = getBrandDashboard(db, scope);

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Brand workspace"
        title={`${organisation?.name ?? "Your brand"}: projects & proof`}
      >
        <SummaryPill label="Activated" value={formatQuantity(view.metrics.activated, "kg")} />
        <SummaryPill
          label="Into products"
          value={formatQuantity(view.metrics.incorporated, "kg")}
        />
        <SummaryPill label="Units made" value={String(view.metrics.unitsCompleted)} />
      </DashboardHero>

      {view.metrics.pendingApprovals > 0 && (
        <NoticeBanner tone="info" title="CIRKA has proposed a match for your approval">
          <p>
            {view.metrics.pendingApprovals} match
            {view.metrics.pendingApprovals === 1 ? "" : "es"} waiting on you.{" "}
            <Link href="/demo/brand/approvals" className="underline font-medium">
              Review matches →
            </Link>
          </p>
        </NoticeBanner>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Active projects"
          value={view.metrics.activeProjects}
          hint={`${view.projects.length} total projects`}
        />
        <DashboardMetricCard
          label="Awaiting your approval"
          value={view.metrics.pendingApprovals}
          accent={view.metrics.pendingApprovals > 0}
        />
        <DashboardMetricCard label="Makers engaged" value={view.metrics.makersEngaged} />
        <DashboardMetricCard label="Open demand" value={view.metrics.openRequests} />
      </div>

      <DashboardSection
        title="Your projects"
        action={
          <Button as={Link} href="/demo/brand/projects/new" size="sm">
            New brief
          </Button>
        }
      >
        <div className="-mx-6 -mb-6">
          {view.proofViews.map((proof) => {
            const tags = [
              { label: "Ref", value: proof.project.reference },
              { label: "Activated", value: formatQuantity(proof.material.activated, proof.material.unit) },
              { label: "Into products", value: formatQuantity(proof.material.incorporated, proof.material.unit) },
            ];

            if (proof.material.yield !== undefined) {
              tags.push({ label: "Yield", value: formatPercent(proof.material.yield) });
            }

            return (
              <LinkRow
                key={proof.project._id}
                href={`/demo/brand/projects/${proof.project._id}`}
                title={proof.project.title}
                tags={tags}
                right={<CirkaBadge status={proof.project.status} />}
              />
            );
          })}
          {view.proofViews.length === 0 && (
            <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
              No projects yet. Start with a brief.
            </p>
          )}
        </div>
      </DashboardSection>

      <RoleActivityFeed role="brand" />
    </div>
  );
}
