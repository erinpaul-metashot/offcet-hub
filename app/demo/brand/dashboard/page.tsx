"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { getBrandDashboard } from "../../_mock/selectors-brand";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { classNames } from "@/lib/utils";

function CompactBrandStatsOverview({
  view,
}: {
  view: ReturnType<typeof getBrandDashboard>;
}) {
  const activated = view.metrics.activated;
  const incorporated = view.metrics.incorporated;
  const unitsCompleted = view.metrics.unitsCompleted;
  const primaryUnit = view.proofViews[0]?.material.unit ?? "kg";

  const incorporatedPct = activated > 0 ? Math.round((incorporated / activated) * 100) : 0;
  const remainingPct = Math.max(0, 100 - incorporatedPct);

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      {/* Material Impact & Transformation Panel */}
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Material Impact & Transformation
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {formatQuantity(activated, primaryUnit)}
              </span>
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                activated material
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
              {incorporatedPct}% Into Products
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#545454]" />
              {remainingPct}% In Pipeline
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)] shadow-inner">
            {incorporated > 0 && (
              <div
                className="h-full bg-[#8CC63F] transition-all duration-700 ease-out"
                style={{ width: `${incorporatedPct}%` }}
                title={`Into Products: ${formatQuantity(incorporated, primaryUnit)} (${incorporatedPct}%)`}
              />
            )}
            {remainingPct > 0 && (
              <div
                className="h-full bg-[#545454] transition-all duration-700 ease-out border-l border-white/20"
                style={{ width: `${remainingPct}%` }}
                title={`In Pipeline: ${formatQuantity(activated - incorporated, primaryUnit)} (${remainingPct}%)`}
              />
            )}
          </div>
        </div>

        {/* Micro Breakdown Indicators */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#545454] shrink-0" />
              Activated
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(activated, primaryUnit)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0" />
              Into Products
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {formatQuantity(incorporated, primaryUnit)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              Units Made
            </div>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
              {unitsCompleted.toLocaleString()}
            </p>
          </div>
        </div>
      </Panel>

      {/* Operational Key Metric Grid Cards */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
        <Link
          href="/demo/brand/projects"
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Active Projects
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.activeProjects}
              </span>
              <p className="text-[11px] text-[var(--ink-muted)] font-medium mt-0.5">
                {view.projects.length} total projects
              </p>
            </div>
          </Panel>
        </Link>

        <Link
          href="/demo/brand/approvals"
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className={classNames(
              "p-3.5 flex flex-col justify-between h-full transition-all group-hover:shadow-sm",
              view.metrics.pendingApprovals > 0
                ? "border-[#FF5C00]/40 bg-[#FF5C00]/5 hover:bg-[#FF5C00]/10"
                : "hover:border-[var(--line-strong)]"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)] truncate">
                Awaiting Approval
              </p>
              <ArrowUpRight
                size={15}
                className={classNames(
                  "transition-colors shrink-0",
                  view.metrics.pendingApprovals > 0 ? "text-[#FF5C00]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
                )}
              />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={classNames(
                    "text-2xl font-bold tracking-tight tabular-nums",
                    view.metrics.pendingApprovals > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                  )}
                >
                  {view.metrics.pendingApprovals}
                </span>
                {view.metrics.pendingApprovals > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#FF5C00] text-white rounded shadow-xs">
                    Action required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] font-medium mt-0.5">
                {view.metrics.pendingApprovals === 1 ? "1 match waiting" : `${view.metrics.pendingApprovals} matches waiting`}
              </p>
            </div>
          </Panel>
        </Link>

        <Link
          href="/demo/brand/projects"
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)] truncate">
                Makers Engaged
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.makersEngaged}
              </span>
              <p className="text-[11px] text-[var(--ink-muted)] font-medium mt-0.5">
                {view.metrics.makersEngaged === 1 ? "1 atelier partner" : `${view.metrics.makersEngaged} atelier partners`}
              </p>
            </div>
          </Panel>
        </Link>

        <Link
          href="/demo/brand/projects"
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)] truncate">
                Open Demand
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.openRequests}
              </span>
              <p className="text-[11px] text-[var(--ink-muted)] font-medium mt-0.5">
                Resource requests
              </p>
            </div>
          </Panel>
        </Link>
      </div>
    </div>
  );
}

export default function BrandDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("brand");
  const view = getBrandDashboard(db, scope);

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Brand workspace"
        title={`${organisation?.name ?? "Your brand"}: projects & proof`}
      />

      <CompactBrandStatsOverview view={view} />

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
              tags.push({ label: "Yield", value: `${Math.round(proof.material.yield * 100)}%` });
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

