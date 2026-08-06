"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyState, Panel } from "@/components/ui";
import { getMakerProjectDetail } from "../../../_mock/selectors-maker";
import { formatPercent, formatQuantity } from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  FlowBar,
  NoticeBanner,
  SectionHeading,
  formatDate,
  materialFlowSegments,
} from "../../../_components/cirka-ui";
import { ProjectJourneyStepper } from "../../../_components/project-journey-stepper";
import { ProductionListRow } from "../../production/production-views";

export default function MakerProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("maker");

  const detail = getMakerProjectDetail(db, scope.orgId, params.id);

  if (!detail) {
    return (
      <EmptyState
        title="Project not found"
        body="Either you have no production on this project, or the demo data has been reset."
      />
    );
  }

  const { project, material, journey, runs } = detail;
  const overdue = journey.find((row) => row.status === "overdue");
  const segments = materialFlowSegments({
    incorporated: material.incorporated,
    prototypes: material.prototypes,
    reusable: material.remaining,
    offcuts: material.offcuts,
    loss: material.loss,
  });

  return (
    <div className="space-y-8">
      <Link
        href="/demo/maker/projects"
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
            {project.reference} · for {detail.brandName}
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
        <SectionHeading title="Material Usage" />

        <Panel className="space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {formatQuantity(material.incorporated, material.unit)}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                into product
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--brand-secondary)]">
                {material.yield !== undefined ? formatPercent(material.yield) : "-"}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                material yield
              </p>
            </div>
          </div>

          {segments.length > 0 ? (
            <FlowBar segments={segments} max={material.used} unit={material.unit} />
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">
              Material use has not been recorded on any run yet.
            </p>
          )}

          <dl className="border-t border-[var(--line)] pt-1">
            <DataRow
              label="Allocated to you"
              value={formatQuantity(material.allocated, material.unit)}
              hint={`${formatQuantity(material.received, material.unit)} received`}
            />
            <DataRow label="Used in production" value={formatQuantity(material.used, material.unit)} />
            <DataRow
              label="Still reusable or returned"
              value={formatQuantity(material.remaining, material.unit)}
            />
            <DataRow
              label="Labour"
              value={`${detail.hours} hrs`}
              hint={
                detail.unitsCompleted > 0
                  ? `${(detail.hours / detail.unitsCompleted).toFixed(2)} hrs per completed unit`
                  : undefined
              }
            />
          </dl>
        </Panel>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Outputs" />
        {detail.outputs.length === 0 ? (
          <NoticeBanner tone="info" title="No output lines recorded yet">
            Record completed units on a production batch and they will show here.
          </NoticeBanner>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detail.outputs.map((output) => (
              <figure
                key={output._id}
                className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"
              >
                {output.finishedImageUrls[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={output.finishedImageUrls[0]}
                    alt={output.productName}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-[var(--surface)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    No photo yet
                  </div>
                )}
                <figcaption className="space-y-2 p-4">
                  <p className="text-sm font-medium text-[var(--ink)]">{output.productName}</p>
                  {output.productDescription && (
                    <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                      {output.productDescription}
                    </p>
                  )}
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {output.numberCompleted ?? 0} of {output.numberPlanned} made
                    {output.numberRejected ? ` · ${output.numberRejected} rejected` : ""}
                    {output.numberRequiringRework ? ` · ${output.numberRequiringRework} reworked` : ""}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading title="Production Runs" />
        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)]">
          {runs.map(({ production, batch, outputs, overdue: runOverdue }) => (
            <ProductionListRow
              key={production._id}
              href={`/demo/maker/production/${production._id}`}
              production={production}
              batchReference={batch?.reference ?? "a resource batch"}
              outputs={outputs}
              overdue={runOverdue}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Project Journey" />
        {journey.length === 0 ? (
          <NoticeBanner tone="info" title="The journey hasn't started" />
        ) : (
          <Panel className="p-6">
            <ProjectJourneyStepper journey={journey} />
          </Panel>
        )}
      </section>
    </div>
  );
}
