"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Button, Panel } from "@/components/ui";
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

export default function BrandDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("brand");
  const view = getBrandDashboard(db, scope);

  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Brand workspace"
        title={`${organisation?.name ?? "Your brand"} — circular ambition to finished product`}
        description="Track resource activation, maker transformation, material yield, and verified proof without exposing supplier costs."
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
            {view.metrics.pendingApprovals === 1 ? "" : "es"} waiting on you. Each comes with a
            written reason for choice of resource, custodian, and maker.{" "}
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
          hint="Proposed matches with rationale"
          accent={view.metrics.pendingApprovals > 0}
        />
        <DashboardMetricCard
          label="Makers engaged"
          value={view.metrics.makersEngaged}
          hint="Local transformation partners"
        />
        <DashboardMetricCard
          label="Open demand"
          value={view.metrics.openRequests}
          hint="Requests in matching or delivery"
        />
      </div>

      <DashboardSection
        title="Your projects"
        description="Select a project for the full proof story — brief, resource, journey, yield, and evidence."
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

      {/* Privacy Guarantee Disclosure */}
      <Panel className="p-4 border-dashed">
        <button
          onClick={() => setShowPrivacyNotice((prev) => !prev)}
          className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Lock size={14} className="text-[var(--brand-primary)]" />
            Structural privacy guarantee — what CIRKA will not show you
          </span>
          {showPrivacyNotice ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showPrivacyNotice && (
          <div className="mt-3 pt-3 border-t border-[var(--line)] text-xs leading-relaxed text-[var(--ink-muted)] space-y-2 animate-stagger-in">
            <p>
              Maker cost breakdowns, labour rates, supplier prices, margins, and personal contact details are omitted from brand views.
            </p>
            <p>
              They are stored in isolated tables with strict access policies, so they are structurally absent rather than hidden. Makers may selectively opt in to share specific cost figures if desired.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
