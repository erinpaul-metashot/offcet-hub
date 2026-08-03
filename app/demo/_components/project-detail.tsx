"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel } from "@/components/ui";
import type { ProjectProofView } from "../_mock/selectors-brand";
import { formatCurrency, formatPercent, formatQuantity } from "../_mock/selectors-shared";
import { CirkaBadge, DataRow, NoticeBanner, SectionHeading, formatDate } from "./cirka-ui";
import { ProjectJourneyStepper } from "./project-journey-stepper";

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
}: {
  proof: ProjectProofView;
  backHref: string;
}) {
  const overdue = proof.journey.find((row) => row.status === "overdue");
  const { project, material } = proof;

  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
      >
        <ArrowLeft size={14} />
        All projects
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
          Target completion
          <span className="mt-1 block text-sm font-medium normal-case tracking-normal text-[var(--ink)]">
            {formatDate(project.targetCompletionDate)}
          </span>
        </p>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">{project.objective}</p>

      {overdue && (
        <NoticeBanner tone="warning" title={`${overdue.label} is overdue`}>
          Expected {formatDate(overdue.plannedDate)}, responsible: {overdue.responsible}.
        </NoticeBanner>
      )}

      <section className="space-y-4">
        <SectionHeading eyebrow="Journey" title="Where this project stands" />
        {proof.journey.length === 0 ? (
          <NoticeBanner tone="info" title="The journey hasn't started">
            No milestones are recorded yet — this project is still a draft.
          </NoticeBanner>
        ) : (
          <Panel className="p-6">
            <ProjectJourneyStepper journey={proof.journey} />
          </Panel>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Material" title="What moved, from the ledger" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MaterialTile label="Activated" value={formatQuantity(material.activated, material.unit)} />
          <MaterialTile label="Received" value={formatQuantity(material.received, material.unit)} />
          <MaterialTile label="Used in production" value={formatQuantity(material.used, material.unit)} />
          <MaterialTile
            label="Into products"
            value={formatQuantity(material.incorporated, material.unit)}
          />
        </div>
        <Panel className="p-5">
          <dl>
            <DataRow
              label="Yield"
              value={material.yield !== undefined ? formatPercent(material.yield) : "—"}
              hint="Incorporated as a share of material used"
            />
            <DataRow
              label="Offcuts and prototypes"
              value={`${formatQuantity(material.offcuts, material.unit)} offcuts · ${formatQuantity(material.prototypes, material.unit)} prototypes`}
            />
            <DataRow label="Loss" value={formatQuantity(material.loss, material.unit)} />
            <DataRow
              label="Remaining and returned"
              value={formatQuantity(material.remaining, material.unit)}
            />
          </dl>
        </Panel>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Activity" title="Requests, matches and allocations" />
        <Panel className="p-5">
          <dl>
            <DataRow label="Requests" value={proof.requests.length} />
            <DataRow
              label="Matches"
              value={`${proof.matches.length} recorded`}
              hint={
                proof.operational.matchSuccess !== undefined
                  ? `${formatPercent(proof.operational.matchSuccess)} approved`
                  : undefined
              }
            />
            <DataRow label="Allocations" value={proof.allocations.length} />
            <DataRow
              label="Evidence reviewed"
              value={`${proof.assurance.reviewed} of ${proof.production.length} production batches`}
            />
          </dl>
        </Panel>
      </section>

      {proof.production.length > 0 && (
        <section className="space-y-4">
          <SectionHeading eyebrow="Production" title="Per production run" />
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
                    {formatQuantity(entry.production.qtyIncorporated ?? 0, entry.production.unit)}
                    {entry.yield !== undefined ? ` · ${formatPercent(entry.yield)} yield` : ""}
                  </p>
                  <CirkaBadge status={entry.production.status} />
                </div>
              </div>
            ))}
          </Panel>
        </section>
      )}

      {proof.commercial.sharedCosts.length > 0 && (
        <section className="space-y-4">
          <SectionHeading eyebrow="Commercial" title="What makers opted to share" />
          <Panel className="p-5">
            <dl>
              {proof.commercial.sharedCosts.map((entry) => (
                <DataRow
                  key={entry.productionReference}
                  label={entry.makerName}
                  value={formatCurrency(entry.baseCostPerUnit, entry.currency)}
                  hint={`${entry.productionReference} · cost per unit`}
                />
              ))}
            </dl>
          </Panel>
        </section>
      )}
    </div>
  );
}
