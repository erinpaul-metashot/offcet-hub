"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import { getBrandDashboard } from "../../_mock/selectors-brand";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, tileHref } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { useFormat } from "../../_components/use-format";
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
  const { dashboard: t } = useMessages(demoBrand);
  const fmt = useFormat();

  const incorporatedPct = activated > 0 ? Math.round((incorporated / activated) * 100) : 0;
  const remainingPct = Math.max(0, 100 - incorporatedPct);

  return (
    <div className="grid gap-4 lg:grid-cols-12 items-stretch">
      <Panel className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {t.material}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {fmt.quantity(activated, primaryUnit)}
              </span>
              <span className="text-xs font-semibold text-[var(--ink-muted)]">{t.activated}</span>
            </div>
          </div>
          <p className="text-sm text-[var(--ink-muted)] tabular-nums">
            {format(t.unitsMade, { count: fmt.number(unitsCompleted) })}
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)]">
            {incorporated > 0 && (
              <div
                className="h-full bg-[var(--brand-secondary)]"
                style={{ width: `${incorporatedPct}%` }}
              />
            )}
            {remainingPct > 0 && (
              <div
                className="h-full bg-[var(--charcoal)] border-l border-[var(--paper)]"
                style={{ width: `${remainingPct}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] font-medium text-[var(--ink-muted)] tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-secondary)]" />
              {t.intoProducts} · {fmt.quantity(incorporated, primaryUnit)} · {incorporatedPct}%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--charcoal)]" />
              {t.inPipeline} · {fmt.quantity(Math.max(activated - incorporated, 0), primaryUnit)} · {remainingPct}%
            </span>
          </div>
        </div>
      </Panel>

      {/* Operational Key Metric Grid Cards */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
        <Link
          href={tileHref(
            view.projects.filter((project) => project.status === "active"),
            "/demo/brand/projects?status=active",
            (project) => `/demo/brand/projects/${project._id}`,
          )}
          className="group block focus-visible:outline-none"
        >
          <Panel
            interactive
            className="p-3.5 flex flex-col justify-between h-full hover:border-[var(--line-strong)] transition-all group-hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {t.activeProjects}
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.activeProjects}
              </span>
              <p className="text-[11px] text-[var(--ink-muted)] font-medium mt-0.5">
                {format(t.totalProjects, { count: view.projects.length })}
              </p>
            </div>
          </Panel>
        </Link>

        <Link
          href={tileHref(
            view.pendingApprovals,
            "/demo/brand/approvals",
            (entry) => `/demo/brand/approvals/${entry.match._id}`,
          )}
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
                {t.awaitingApproval}
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
              <span
                className={classNames(
                  "text-2xl font-bold tracking-tight tabular-nums",
                  view.metrics.pendingApprovals > 0 ? "text-[#FF5C00]" : "text-[var(--ink)]"
                )}
              >
                {view.metrics.pendingApprovals}
              </span>
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
                {t.makersEngaged}
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.makersEngaged}
              </span>
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
                {t.openRequests}
              </p>
              <ArrowUpRight size={15} className="text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors shrink-0" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
                {view.metrics.openRequests}
              </span>
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
  const { dashboard: t } = useMessages(demoBrand);
  const fmt = useFormat();

  return (
    <div className="space-y-6">
      <DashboardHero title={organisation?.name ?? t.title} />

      <CompactBrandStatsOverview view={view} />

      <DashboardSection
        title={t.projects}
        action={
          <Button as={Link} href="/demo/brand/projects/new" size="sm">
            {t.newBrief}
          </Button>
        }
      >
        <div className="-mx-6 -mb-6">
          {view.proofViews.map((proof) => {
            const tags = [
              { label: t.ref, value: proof.project.reference },
              { label: t.activatedTag, value: fmt.quantity(proof.material.activated, proof.material.unit) },
              { label: t.intoProducts, value: fmt.quantity(proof.material.incorporated, proof.material.unit) },
            ];

            if (proof.material.yield !== undefined) {
              tags.push({ label: t.yield, value: `${Math.round(proof.material.yield * 100)}%` });
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
              {t.noProjects}
            </p>
          )}
        </div>
      </DashboardSection>

      <RoleActivityFeed role="brand" />
    </div>
  );
}

