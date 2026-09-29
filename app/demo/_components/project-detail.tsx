"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import type { CirkaRole } from "../_mock/domain";
import type { ProjectProofView } from "../_mock/selectors-brand";
import { CirkaBadge, DataRow, NoticeBanner, SectionHeading } from "./cirka-ui";
import { ProjectJourneyStepper } from "./project-journey-stepper";
import { ThreadTimelinePanel } from "./trace-timeline";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

function MaterialTile({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{value}</p>
    </Panel>
  );
}

export function ProjectDetailView({
  proof,
  backHref,
  role = "admin",
}: {
  proof: ProjectProofView;
  backHref: string;
  role?: CirkaRole;
}) {
  const overdue = proof.journey.find((row) => row.status === "overdue");
  const { project, material } = proof;
  const { projectDetail: t } = useMessages(demoAdmin);
  const labels = useLabels();
  const fmt = useFormat();

  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
      >
        <ArrowLeft size={14} />
        {t.allProjects}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {project.title}
            </h1>
            <CirkaBadge status={project.status} />
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {project.reference} · {proof.brandName}
          </p>
        </div>
        <p className="max-w-xs text-right text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {t.targetCompletion}
          <span className="mt-1 block text-sm font-medium normal-case tracking-normal text-[var(--ink)]">
            {fmt.date(project.targetCompletionDate)}
          </span>
        </p>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">{project.objective}</p>

      {overdue && (
        <NoticeBanner
          tone="warning"
          title={format(t.overdueTitle, { stage: labels.MILESTONE_LABELS[overdue.stage] ?? overdue.label })}
        >
          {format(t.overdueBody, { date: fmt.date(overdue.plannedDate), responsible: overdue.responsible })}
        </NoticeBanner>
      )}

      <section className="space-y-4">
        <SectionHeading title={t.journey} />
        <Panel className="p-6">
          <ProjectJourneyStepper journey={proof.journey} />
        </Panel>
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.material} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MaterialTile label={t.activated} value={fmt.quantity(material.activated, material.unit)} />
          <MaterialTile label={t.received} value={fmt.quantity(material.received, material.unit)} />
          <MaterialTile label={t.usedInProduction} value={fmt.quantity(material.used, material.unit)} />
          <MaterialTile
            label={t.intoProducts}
            value={fmt.quantity(material.incorporated, material.unit)}
          />
        </div>
        <Panel className="p-5">
          <dl>
            <DataRow
              label={t.yield}
              value={material.yield !== undefined ? fmt.percent(material.yield) : "-"}
            />
            <DataRow
              label={t.offcutsAndPrototypes}
              value={format(t.offcutsValue, {
                offcuts: fmt.quantity(material.offcuts, material.unit),
                prototypes: fmt.quantity(material.prototypes, material.unit),
              })}
            />
            <DataRow label={t.loss} value={fmt.quantity(material.loss, material.unit)} />
            <DataRow
              label={t.remaining}
              value={fmt.quantity(material.remaining, material.unit)}
            />
          </dl>
        </Panel>
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.matchesAndAllocations} />
        <Panel className="p-5">
          <dl>
            <DataRow label={t.requests} value={proof.requests.length} />
            <DataRow
              label={t.matches}
              value={proof.matches.length}
              hint={
                proof.operational.matchSuccess !== undefined
                  ? format(t.approved, { percent: fmt.percent(proof.operational.matchSuccess) })
                  : undefined
              }
            />
            <DataRow label={t.allocations} value={proof.allocations.length} />
            <DataRow
              label={t.evidenceReviewed}
              value={format(t.reviewedOf, { reviewed: proof.assurance.reviewed, count: proof.production.length })}
            />
          </dl>
        </Panel>
      </section>

      {proof.production.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title={t.production} />
          <Panel className="divide-y divide-[var(--line)] p-0">
            {proof.production.map((entry) => (
              <div key={entry.production._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">
                    {entry.production.productName}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {entry.production.reference} · {entry.makerName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-sm text-[var(--ink-muted)]">
                    {fmt.quantity(entry.production.qtyIncorporated ?? 0, entry.production.unit)}
                    {entry.yield !== undefined ? format(t.yieldSuffix, { percent: fmt.percent(entry.yield) }) : ""}
                  </p>
                  <CirkaBadge status={entry.production.status} />
                </div>
              </div>
            ))}
          </Panel>
        </section>
      )}

      <ThreadTimelinePanel
        role={role}
        anchor={{ table: "projects", id: project._id }}
        title={t.activity}
      />

      {proof.commercial.sharedCosts.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title={t.costPerUnit} />
          <Panel className="p-5">
            <dl>
              {proof.commercial.sharedCosts.map((entry) => (
                <DataRow
                  key={entry.productionReference}
                  label={entry.makerName}
                  value={fmt.currency(entry.baseCostPerUnit, entry.currency)}
                  hint={entry.productionReference}
                />
              ))}
            </dl>
          </Panel>
        </section>
      )}
    </div>
  );
}
