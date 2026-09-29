"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyState, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { getMakerProjectDetail } from "../../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  FlowBar,
  NoticeBanner,
  SectionHeading,
  materialFlowSegments,
} from "../../../_components/cirka-ui";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";
import { ProjectBriefPack } from "../../../_components/project-brief-pack";
import { ProjectJourneyStepper } from "../../../_components/project-journey-stepper";
import { ProductionListRow } from "../../production/production-views";

export default function MakerProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const { projectDetail: t } = useMessages(demoMaker);
  const labels = useLabels();
  const fmt = useFormat();

  const detail = getMakerProjectDetail(db, scope.orgId, params.id);

  if (!detail) {
    return (
      <EmptyState title={t.notFound} />
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
            {format(t.forBrand, { reference: project.reference, brand: detail.brandName ?? "" })}
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
        <SectionHeading title={format(t.briefFrom, { brand: detail.brandName ?? "" })} />
        <ProjectBriefPack items={detail.references} />
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.material} />

        <Panel className="space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {fmt.quantity(material.incorporated, material.unit)}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t.intoProduct}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--brand-secondary)]">
                {material.yield !== undefined ? fmt.percent(material.yield) : "-"}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t.materialYield}
              </p>
            </div>
          </div>

          {segments.length > 0 ? (
            <FlowBar segments={segments} max={material.used} unit={material.unit} />
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">
              {t.useNotRecorded}
            </p>
          )}

          <dl className="border-t border-[var(--line)] pt-1">
            <DataRow
              label={t.allocatedToYou}
              value={fmt.quantity(material.allocated, material.unit)}
              hint={format(t.received, { quantity: fmt.quantity(material.received, material.unit) })}
            />
            <DataRow label={t.usedInProduction} value={fmt.quantity(material.used, material.unit)} />
            <DataRow
              label={t.stillReusable}
              value={fmt.quantity(material.remaining, material.unit)}
            />
            <DataRow
              label={t.labour}
              value={format(t.hrs, { count: fmt.number(detail.hours) })}
              hint={
                detail.unitsCompleted > 0
                  ? format(t.hrsPerUnit, { count: fmt.number(Number((detail.hours / detail.unitsCompleted).toFixed(2))) })
                  : undefined
              }
            />
          </dl>
        </Panel>
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.outputs} />
        {detail.outputs.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">{t.noOutputs}</p>
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
                    {t.noPhoto}
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
                    {format(t.made, { completed: output.numberCompleted ?? 0, planned: output.numberPlanned })}
                    {output.numberRejected ? format(t.rejected, { count: output.numberRejected }) : ""}
                    {output.numberRequiringRework
                      ? format(t.reworked, { count: output.numberRequiringRework })
                      : ""}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.production} />
        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)]">
          {runs.map(({ production, batch, outputs, overdue: runOverdue }) => (
            <ProductionListRow
              key={production._id}
              href={`/demo/maker/production/${production._id}`}
              production={production}
              batchReference={batch?.reference ?? t.aBatch}
              outputs={outputs}
              overdue={runOverdue}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.journey} />
        <Panel className="p-6">
          <ProjectJourneyStepper journey={journey} />
        </Panel>
      </section>
    </div>
  );
}
