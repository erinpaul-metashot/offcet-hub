"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import {
  MATERIAL_CATEGORIES,
  UNITS,
  type MaterialCategory,
  type Unit,
} from "../../../_mock/domain";
import { getProjectProofView } from "../../../_mock/selectors-brand";
import { potSlices } from "../../../_mock/selectors-batches";
import type { Id } from "../../../_mock/types";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  ProvenanceChip,
  QuantityPotsBar,
  SectionHeading,
} from "../../../_components/cirka-ui";
import { EvidenceGrid } from "../../../_components/records";
import { AddBriefResource, ProjectBriefPack } from "../../../_components/project-brief-pack";
import { ThreadTimelinePanel } from "../../../_components/trace-timeline";
import { downloadCsv, downloadJson } from "../../../_mock/exports";
import { useAction } from "../../../_components/use-action";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const EMPTY_DEMAND = {
  title: "",
  materialCategory: "cotton_offcuts" as MaterialCategory,
  materialDescription: "",
  quantityNeeded: "",
  unit: "kg" as Unit,
  neededBy: "",
};

/** A project can carry more than one open demand: this adds another without leaving the proof view. */
function AddDemandForm({ projectId, projectTitle }: { projectId: Id; projectTitle: string }) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const [open, setOpen] = useState(false);
  const [demand, setDemand] = useState(EMPTY_DEMAND);
  const { project: t } = useMessages(demoBrand);
  const labels = useLabels();

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {t.addDemand}
      </Button>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    await run(async () => {
      await store.createResourceRequest("brand", {
        projectId,
        title: demand.title || format(t.defaultRequestTitle, { project: projectTitle }),
        materialCategory: demand.materialCategory,
        materialDescription: demand.materialDescription || undefined,
        quantityNeeded: Number(demand.quantityNeeded),
        unit: demand.unit,
        neededBy: toTimestamp(demand.neededBy),
        submitImmediately: true,
      });

      setDemand(EMPTY_DEMAND);
      setOpen(false);
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
    >
      {error && (
        <NoticeBanner tone="blocking" title={t.demandNotCreated}>
          {error}
        </NoticeBanner>
      )}

      <Field label={t.requestTitle}>
        <Input
          value={demand.title}
          onChange={(event) => setDemand((current) => ({ ...current, title: event.target.value }))}
          placeholder={t.requestTitlePlaceholder}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t.materialCategory}>
          <Select
            value={demand.materialCategory}
            onChange={(event) =>
              setDemand((current) => ({
                ...current,
                materialCategory: event.target.value as MaterialCategory,
              }))
            }
          >
            {MATERIAL_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {labels.MATERIAL_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.quantityNeeded} required>
          <Input
            required
            type="number"
            min="0"
            step="0.001"
            value={demand.quantityNeeded}
            onChange={(event) =>
              setDemand((current) => ({ ...current, quantityNeeded: event.target.value }))
            }
            placeholder="300"
          />
        </Field>
        <Field label={t.unit}>
          <Select
            value={demand.unit}
            onChange={(event) =>
              setDemand((current) => ({ ...current, unit: event.target.value as Unit }))
            }
          >
            {UNITS.map((value) => (
              <option key={value} value={value}>
                {labels.UNIT_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t.neededBy}>
        <Input
          type="date"
          value={demand.neededBy}
          onChange={(event) => setDemand((current) => ({ ...current, neededBy: event.target.value }))}
        />
      </Field>

      <Field label={t.requirements}>
        <Textarea
          value={demand.materialDescription}
          onChange={(event) =>
            setDemand((current) => ({ ...current, materialDescription: event.target.value }))
          }
          placeholder={t.requirementsPlaceholder}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t.cancel}
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t.adding : t.addDemandSubmit}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h2>
      {children}
    </section>
  );
}

type Material = NonNullable<ReturnType<typeof getProjectProofView>>["material"];

/**
 * Where the activated material ended up. `received` counts both hops, so the
 * split is built from parts that don't overlap; whatever they don't cover is
 * still somewhere in the chain.
 */
function MaterialOutcome({ material }: { material: Material }) {
  const { project: t } = useMessages(demoBrand);
  const fmt = useFormat();
  const parts = [
    { bucket: "incorporated", label: t.intoProducts, quantity: material.incorporated },
    { bucket: "prototypes", label: t.prototypes, quantity: material.prototypes },
    { bucket: "reusable", label: t.reusable, quantity: material.remaining + material.offcuts },
    { bucket: "lost", label: t.lost, quantity: material.loss + material.writtenOffInTransit },
  ];
  const accounted = parts.reduce((total, part) => total + part.quantity, 0);
  const total = Math.max(material.activated, accounted);
  const slices = [
    ...parts,
    { bucket: "not_yet_used", label: t.notYetUsed, quantity: total - accounted },
  ]
    .filter((part) => part.quantity > 0)
    .map((part) => ({ ...part, share: part.quantity / total }));

  return (
    <Panel className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      {total > 0 ? (
        <QuantityPotsBar slices={slices} total={total} unit={material.unit} totalLabel={t.activated} />
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">{t.noneActivated}</p>
      )}
      <div className="md:border-l md:border-[var(--line)] md:pl-6 md:text-right">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {t.materialYield}
        </p>
        <p className="text-4xl font-semibold tracking-[-0.05em] tabular-nums text-[var(--brand-primary)]">
          {fmt.percent(material.yield)}
        </p>
        <p className="text-xs tabular-nums text-[var(--ink-muted)]">
          {format(t.ofUsed, {
            incorporated: fmt.quantity(material.incorporated, material.unit),
            used: fmt.quantity(material.used, material.unit),
          })}
        </p>
      </div>
    </Panel>
  );
}

export default function BrandProofViewPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const { run } = useAction();

  const proof = getProjectProofView(store.db, scope, params.id);
  const { project: t } = useMessages(demoBrand);
  const labels = useLabels();
  const fmt = useFormat();

  if (!proof) {
    return <EmptyState title={t.notFound} />;
  }

  const { project, material, operational, social, commercial, assurance } = proof;

  const exportRows = proof.production.map((entry) => ({
    production_reference: entry.production.reference,
    product: entry.production.productName,
    maker: entry.makerName,
    units_completed: entry.outputs.reduce(
      (total, output) => total + (output.numberCompleted ?? 0),
      0,
    ),
    quantity_used: entry.production.qtyUsed ?? 0,
    quantity_incorporated: entry.production.qtyIncorporated ?? 0,
    material_yield: entry.yield ?? "",
    unit: entry.production.unit,
    evidence_status: entry.production.evidenceStatus,
    assurance_level: entry.production.evidenceStatus === "cirka_reviewed" ? "cirka_reviewed" : "self_reported",
    recorded_by_org: entry.makerName,
    recorded_at: new Date(entry.production.createdAt).toISOString(),
    last_reviewed_at: entry.production.reviewedAt
      ? new Date(entry.production.reviewedAt).toISOString()
      : "",
  }));

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button as={Link} href="/demo/brand/projects" variant="ghost" size="sm">
          {t.allProjects}
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button as={Link} href={`/demo/brand/projects/${project._id}/report`} size="sm">
            {t.report}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              run(async () => {
                downloadCsv(`${project.reference}-production`, exportRows);
                await store.recordExport("brand", {
                  exportName: `${project.reference} production`,
                  format: "csv",
                  rowCount: exportRows.length,
                });
              })
            }
          >
            {t.downloadCsv}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              run(async () => {
                downloadJson(`${project.reference}-project`, {
                  project,
                  material,
                  operational,
                  social,
                  assurance: {
                    reviewed: assurance.reviewed,
                    selfReported: assurance.selfReported,
                    dataSources: assurance.dataSources,
                  },
                  production: exportRows,
                });
                await store.recordExport("brand", {
                  exportName: `${project.reference} project summary`,
                  format: "json",
                  rowCount: exportRows.length,
                });
              })
            }
          >
            {t.downloadJson}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeading
          eyebrow={project.reference}
          title={project.title}
          action={<CirkaBadge status={project.status} />}
        />
        <MaterialOutcome material={material} />
      </div>

      <Section title={t.brief}>
        <Panel className="p-6">
          <dl>
            <DataRow label={t.objective} value={project.objective} />
            <DataRow label={t.intendedProduct} value={project.intendedProduct ?? "-"} />
            <DataRow label={t.designIntent} value={project.designIntent ?? "-"} />
            <DataRow label={t.commercialObjectives} value={project.commercialObjectives ?? "-"} />
            <DataRow label={t.impactObjectives} value={project.impactObjectives ?? "-"} />
            <DataRow
              label={t.timeline}
              value={`${fmt.date(project.startDate)} → ${fmt.date(project.targetCompletionDate)}`}
            />
          </dl>

          {proof.requests.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5">
              {proof.requests.map((request) => (
                <div key={request._id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">{request.title}</p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {request.reference} · {fmt.quantity(request.quantityNeeded, request.unit)}{" "}
                      {labels.MATERIAL_CATEGORY_LABELS[request.materialCategory]}
                      {request.neededBy ? format(t.neededByDate, { date: fmt.date(request.neededBy) }) : ""}
                    </p>
                  </div>
                  <CirkaBadge status={request.status} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-4 border-t border-[var(--line)] pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {t.briefPack}
            </p>
            <ProjectBriefPack items={proof.references} />
            <AddBriefResource projectId={project._id} />
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-5">
            <AddDemandForm projectId={project._id} projectTitle={project.title} />
          </div>
        </Panel>
      </Section>

      <Section title={t.materialSources}>
        <div className="space-y-4">
          {proof.batches.map((batch) => (
            <Panel key={batch._id} className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--ink)]">{batch.name}</h3>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {batch.reference} · {labels.MATERIAL_CATEGORY_LABELS[batch.materialCategory]} ·{" "}
                    {batch.composition ?? t.compositionMissing}
                  </p>
                </div>
                <ProvenanceChip
                  dataSource={batch.dataSource}
                  assuranceLevel={batch.assuranceLevel}
                />
              </div>

              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{batch.description}</p>

              <QuantityPotsBar
                slices={potSlices(batch)}
                total={batch.quantityOriginal}
                unit={batch.unit}
              />

              <dl className="grid gap-x-8 sm:grid-cols-2">
                <DataRow label={t.sourceLocation} value={batch.locationText ?? "-"} />
                <DataRow label={t.availableFrom} value={fmt.date(batch.availableFrom)} />
                <DataRow
                  label={t.quality}
                  value={batch.qualityClass ? labels.QUALITY_CLASS_LABELS[batch.qualityClass] : "-"}
                />
              </dl>
            </Panel>
          ))}
          {proof.batches.length === 0 && <EmptyState title={t.noResource} />}
        </div>
      </Section>

      <Section title={t.matchesParticipants}>
        <div className="space-y-4">
          {proof.matches.map(({ match, batch }) => (
            <Panel key={match._id} className="space-y-3 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-[var(--ink)]">
                  {fmt.quantity(match.quantityProposed, match.unit)} · {batch?.name}
                </p>
                <CirkaBadge status={match.status} />
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-4">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {t.matchingRationale}
                </p>
                <p className="text-sm leading-relaxed text-[var(--ink)]">{match.rationale}</p>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                {format(t.proposedOn, { date: fmt.date(match.proposedAt) })}
                {match.decidedAt ? format(t.approvedOn, { date: fmt.date(match.decidedAt) }) : ""}
                {match.distanceKm ? ` · ${match.distanceKm} km` : ""}
              </p>
            </Panel>
          ))}

          <Panel className="overflow-hidden">
            <div className="border-b border-[var(--line)] px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t.participating}
              </h3>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {proof.allocations.map(({ allocation, fromName, toName }) => (
                <div
                  key={allocation._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {fromName} → {toName}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {allocation.reference} ·{" "}
                      {fmt.quantity(allocation.quantityAllocated, allocation.unit)}
                      {allocation.quantityReceived !== undefined
                        ? format(t.receivedQuantity, { quantity: fmt.quantity(allocation.quantityReceived, allocation.unit) })
                        : ""}
                    </p>
                  </div>
                  <CirkaBadge status={allocation.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Section>

      <Section title={t.journey}>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <th className="px-6 py-4">{t.stage}</th>
                <th className="px-6 py-4">{t.responsible}</th>
                <th className="px-6 py-4">{t.expected}</th>
                <th className="px-6 py-4">{t.actual}</th>
                <th className="px-6 py-4">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {proof.journey.map((row) => (
                <tr key={row.stage} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[var(--ink)]">{labels.MILESTONE_LABELS[row.stage] ?? row.label}</p>
                    {row.note && <p className="text-xs text-[var(--ink-muted)]">{row.note}</p>}
                  </td>
                  <td className="px-6 py-4 text-[var(--ink-muted)]">{row.responsible}</td>
                  <td className="px-6 py-4 text-[var(--ink-muted)]">{fmt.date(row.plannedDate)}</td>
                  <td className="px-6 py-4 text-[var(--ink-muted)]">{fmt.date(row.actualDate)}</td>
                  <td className="px-6 py-4">
                    <CirkaBadge
                      status={
                        row.status === "completed"
                          ? "completed"
                          : row.status === "overdue"
                            ? "overdue"
                            : "pending"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {(material.writtenOffInTransit > 0 || operational.issuesRaised > 0) && (
          <NoticeBanner tone="warning" title={t.exceptions}>
            {material.writtenOffInTransit > 0 && (
              <p>{format(t.writtenOffInTransit, { quantity: fmt.quantity(material.writtenOffInTransit, material.unit) })}</p>
            )}
            {operational.issuesRaised > 0 && (
              <p>
                {format(operational.issuesRaised === 1 ? t.issuesResolvedOne : t.issuesResolvedMany, {
                  resolved: operational.issuesResolved,
                  raised: operational.issuesRaised,
                })}
              </p>
            )}
          </NoticeBanner>
        )}
      </Section>

      <Section title={t.production}>
        <div className="space-y-4">
          {proof.production.length === 0 && <EmptyState title={t.noProduction} />}
          {proof.production.map((entry) => (
            <Panel key={entry.production._id} className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--ink)]">
                    {entry.production.productName}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {entry.production.reference} · {entry.makerName}
                  </p>
                </div>
                <CirkaBadge status={entry.production.evidenceStatus} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      <th className="py-3 pr-4">{t.product}</th>
                      <th className="py-3 pr-4 text-right">{t.planned}</th>
                      <th className="py-3 pr-4 text-right">{t.completed}</th>
                      <th className="py-3 text-right">{t.rejected}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.outputs.map((output) => (
                      <tr key={output._id} className="border-b border-[var(--line)] last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-[var(--ink)]">
                          {output.productName}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{output.numberPlanned}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {output.numberCompleted ?? "-"}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {output.numberRejected ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
        </div>
      </Section>

      <Section title={t.results}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {t.operational}
            </h3>
            <dl>
              <DataRow
                label={t.demandToMatch}
                value={
                  operational.demandToMatchDays !== undefined
                    ? format(t.days, { count: operational.demandToMatchDays })
                    : "-"
                }
              />
              <DataRow
                label={t.matchToProduction}
                value={
                  operational.allocationToProductionDays !== undefined
                    ? format(t.days, { count: operational.allocationToProductionDays })
                    : "-"
                }
              />
              <DataRow label={t.deliveryAccuracy} value={fmt.percent(operational.deliveryAccuracy)} />
              <DataRow
                label={t.completion}
                value={fmt.percent(operational.completionRate)}
              />
              <DataRow label={t.matchSuccess} value={fmt.percent(operational.matchSuccess)} />
              <DataRow
                label={t.issues}
                value={format(t.issuesValue, { resolved: operational.issuesResolved, raised: operational.issuesRaised })}
              />
            </dl>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {t.social}
            </h3>
            <dl>
              <DataRow label={t.localMakers} value={social.makersEngaged} />
              <DataRow label={t.organisations} value={social.organisationsParticipating} />
              <DataRow label={t.hours} value={social.productionHours} />
              <DataRow
                label={t.units}
                value={format(t.unitsValue, { completed: social.unitsCompleted, planned: social.unitsPlanned })}
              />
            </dl>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {t.commercial}
            </h3>
            <dl>
              <DataRow
                label={t.timePerUnit}
                value={commercial.hoursPerUnit !== undefined ? format(t.hours_short, { count: commercial.hoursPerUnit }) : "-"}
              />
              {commercial.sharedCosts.map((row) => (
                <DataRow
                  key={row.productionReference}
                  label={format(t.costPerUnitOf, { maker: row.makerName })}
                  value={fmt.currency(row.baseCostPerUnit, row.currency)}
                />
              ))}
              {commercial.sharedCosts.length === 0 && (
                <DataRow label={t.costPerUnit} value={t.notShared} />
              )}
            </dl>
          </Panel>
        </div>
      </Section>

      <Section title={t.evidence}>
        <div className="space-y-5">
          <Panel className="p-6">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DataRow
                label={t.cirkaReviewed}
                value={format(t.reviewedValue, { reviewed: assurance.reviewed, total: proof.production.length })}
              />
              <DataRow label={t.selfReported} value={assurance.selfReported} />
              <DataRow
                label={t.dataSources}
                value={assurance.dataSources
                  .map((source) => labels.DATA_SOURCE_LABELS[source])
                  .join(", ")}
              />
              <DataRow
                label={t.externalRecords}
                value={
                  assurance.externalRecords.length > 0
                    ? assurance.externalRecords
                        .map((transfer) => transfer.externalRecordId ?? transfer.externalSystemName)
                        .join(", ")
                    : t.noneYet
                }
              />
            </dl>
          </Panel>

          <EvidenceGrid items={proof.evidence} />
        </div>
      </Section>

      <ThreadTimelinePanel
        role="brand"
        anchor={{ table: "projects", id: project._id }}
        title={t.activity}
      />
    </div>
  );
}
