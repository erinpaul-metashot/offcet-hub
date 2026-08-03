"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, EmptyState, Panel } from "@/components/ui";
import { ASSURANCE_LABELS, DATA_SOURCE_LABELS } from "../../../_mock/domain";
import { getProjectProofView } from "../../../_mock/selectors-brand";
import { potSlices } from "../../../_mock/selectors-batches";
import {
  categoryLabel,
  formatCurrency,
  formatPercent,
  formatQuantity,
} from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  ProvenanceChip,
  QuantityPotsBar,
  SectionHeading,
  formatDate,
} from "../../../_components/cirka-ui";
import { EvidenceGrid } from "../../../_components/records";
import { downloadCsv, downloadJson } from "../../../_mock/exports";
import { useAction } from "../../../_components/use-action";

function StoryStep({
  index,
  title,
  lead,
  children,
}: {
  index: number;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-4">
        <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-white">
          {index}
        </span>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{title}</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--ink-muted)]">{lead}</p>
        </div>
      </div>
      <div className="sm:pl-13">{children}</div>
    </section>
  );
}

export default function BrandProofViewPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const { run } = useAction();

  const proof = getProjectProofView(store.db, scope, params.id);

  if (!proof) {
    return <EmptyState title="Project not found" body="The demo data may have been reset." />;
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
    <div className="space-y-12 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button as={Link} href="/demo/brand/projects" variant="ghost" size="sm">
          ← All projects
        </Button>
        <div className="flex flex-wrap gap-3">
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
            Download CSV
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
            Download JSON
          </Button>
        </div>
      </div>

      <SectionHeading
        eyebrow={`${project.reference} · ${proof.brandName}`}
        title={project.title}
        description="One page, top to bottom: what you asked for, what was found, how CIRKA activated it, what happened, what was made, what it produced, and what supports the claim."
        action={<CirkaBadge status={project.status} />}
      />

      {/* 1 — The brief */}
      <StoryStep
        index={1}
        title="The brief"
        lead="What you set out to do, in your own words."
      >
        <Panel className="p-6">
          <dl>
            <DataRow label="Objective" value={project.objective} />
            <DataRow label="Intended product" value={project.intendedProduct ?? "—"} />
            <DataRow label="Design intent" value={project.designIntent ?? "—"} />
            <DataRow label="Commercial objectives" value={project.commercialObjectives ?? "—"} />
            <DataRow label="Impact objectives" value={project.impactObjectives ?? "—"} />
            <DataRow
              label="Timeline"
              value={`${formatDate(project.startDate)} → ${formatDate(project.targetCompletionDate)}`}
            />
          </dl>

          {proof.requests.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5">
              {proof.requests.map((request) => (
                <div key={request._id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">{request.title}</p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {request.reference} · {formatQuantity(request.quantityNeeded, request.unit)}{" "}
                      {categoryLabel(request.materialCategory)}
                      {request.neededBy ? ` · needed by ${formatDate(request.neededBy)}` : ""}
                    </p>
                  </div>
                  <CirkaBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </StoryStep>

      {/* 2 — The resource */}
      <StoryStep
        index={2}
        title="The resource"
        lead="What material was found, where it came from, and how we know."
      >
        <div className="space-y-4">
          {proof.batches.map((batch) => (
            <Panel key={batch._id} className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--ink)]">{batch.name}</h3>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {batch.reference} · {categoryLabel(batch.materialCategory)} ·{" "}
                    {batch.composition ?? "composition not recorded"}
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
                <DataRow label="Source location" value={batch.locationText ?? "—"} />
                <DataRow label="Available from" value={formatDate(batch.availableFrom)} />
                <DataRow label="Quality" value={batch.qualityClass?.replace(/_/g, " ") ?? "—"} />
                <DataRow
                  label="Data source"
                  value={DATA_SOURCE_LABELS[batch.dataSource]}
                  hint={ASSURANCE_LABELS[batch.assuranceLevel]}
                />
              </dl>
            </Panel>
          ))}
          {proof.batches.length === 0 && (
            <EmptyState
              title="No resource matched yet"
              body="Once CIRKA proposes a batch and you approve it, the material appears here."
            />
          )}
        </div>
      </StoryStep>

      {/* 3 — CIRKA activation */}
      <StoryStep
        index={3}
        title="CIRKA activation"
        lead="Why this resource, which custodian, which maker — and how much was reserved."
      >
        <div className="space-y-4">
          {proof.matches.map(({ match, batch }) => (
            <Panel key={match._id} className="space-y-3 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-[var(--ink)]">
                  {formatQuantity(match.quantityProposed, match.unit)} · {batch?.name}
                </p>
                <CirkaBadge status={match.status} />
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-4">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Matching rationale
                </p>
                <p className="text-sm leading-relaxed text-[var(--ink)]">{match.rationale}</p>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                Proposed {formatDate(match.proposedAt)}
                {match.decidedAt ? ` · approved ${formatDate(match.decidedAt)}` : ""}
                {match.distanceKm ? ` · ${match.distanceKm} km between the parties` : ""}
              </p>
            </Panel>
          ))}

          <Panel className="overflow-hidden">
            <div className="border-b border-[var(--line)] px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Participating organisations
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
                      {formatQuantity(allocation.quantityAllocated, allocation.unit)}
                      {allocation.quantityReceived !== undefined
                        ? ` · ${formatQuantity(allocation.quantityReceived, allocation.unit)} received`
                        : ""}
                    </p>
                  </div>
                  <CirkaBadge status={allocation.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </StoryStep>

      {/* 4 — The journey */}
      <StoryStep
        index={4}
        title="The journey"
        lead="Planned against actual, with the exceptions shown rather than hidden. A report that is always green is a report nobody believes."
      >
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Responsible</th>
                <th className="px-6 py-4">Expected</th>
                <th className="px-6 py-4">Actual</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {proof.journey.map((row) => (
                <tr key={row.stage} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[var(--ink)]">{row.label}</p>
                    {row.note && <p className="text-xs text-[var(--ink-muted)]">{row.note}</p>}
                  </td>
                  <td className="px-6 py-4 text-[var(--ink-muted)]">{row.responsible}</td>
                  <td className="px-6 py-4 text-[var(--ink-muted)]">{formatDate(row.plannedDate)}</td>
                  <td className="px-6 py-4 text-[var(--ink-muted)]">{formatDate(row.actualDate)}</td>
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
          <NoticeBanner tone="warning" title="Exceptions on this project">
            {material.writtenOffInTransit > 0 && (
              <p>
                {formatQuantity(material.writtenOffInTransit, material.unit)} was lost between
                dispatch and receipt, investigated and closed as a confirmed loss.
              </p>
            )}
            {operational.issuesRaised > 0 && (
              <p>
                {operational.issuesRaised} operational issue
                {operational.issuesRaised === 1 ? "" : "s"} raised, {operational.issuesResolved}{" "}
                resolved.
              </p>
            )}
          </NoticeBanner>
        )}
      </StoryStep>

      {/* 5 — The outputs */}
      <StoryStep
        index={5}
        title="The outputs"
        lead="What was made, how much material went into it, and what is left. Material yield, not a broad diversion claim."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Activated", material.activated],
              ["Received", material.received],
              ["Used", material.used],
              ["Into products", material.incorporated],
              ["Prototypes", material.prototypes],
              ["Reusable offcuts", material.offcuts],
              ["Production loss", material.loss],
              ["Back in stock", material.remaining],
            ].map(([label, value]) => (
              <Panel key={label as string} className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  {formatQuantity(value as number, material.unit)}
                </p>
              </Panel>
            ))}
          </div>

          <Panel className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Material yield
            </p>
            <p className="mt-1 text-4xl font-semibold tracking-[-0.05em] text-[var(--brand-primary)]">
              {formatPercent(material.yield)}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
              {formatQuantity(material.incorporated, material.unit)} incorporated into finished
              outputs ÷ {formatQuantity(material.used, material.unit)} used. Every figure here traces
              back to a movement row with a person and a timestamp against it.
            </p>
          </Panel>

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
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4 text-right">Planned</th>
                      <th className="py-3 pr-4 text-right">Completed</th>
                      <th className="py-3 text-right">Rejected</th>
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
                          {output.numberCompleted ?? "—"}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {output.numberRejected ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
        </div>
      </StoryStep>

      {/* 6 — The results */}
      <StoryStep
        index={6}
        title="The results"
        lead="Operational, environmental, social and commercial value — showing only what an agreed method supports."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Operational
            </h3>
            <dl>
              <DataRow
                label="Time from demand to match"
                value={
                  operational.demandToMatchDays !== undefined
                    ? `${operational.demandToMatchDays} days`
                    : "—"
                }
              />
              <DataRow
                label="Time from match to production"
                value={
                  operational.allocationToProductionDays !== undefined
                    ? `${operational.allocationToProductionDays} days`
                    : "—"
                }
              />
              <DataRow
                label="Delivery accuracy"
                value={formatPercent(operational.deliveryAccuracy)}
                hint="Received against dispatched"
              />
              <DataRow
                label="Production completion"
                value={formatPercent(operational.completionRate)}
              />
              <DataRow label="Match success" value={formatPercent(operational.matchSuccess)} />
              <DataRow
                label="Issues"
                value={`${operational.issuesResolved} of ${operational.issuesRaised} resolved`}
              />
            </dl>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Environmental
            </h3>
            <dl>
              <DataRow
                label="Secondary resource activated"
                value={formatQuantity(material.activated, material.unit)}
              />
              <DataRow
                label="Incorporated into products"
                value={formatQuantity(material.incorporated, material.unit)}
              />
              <DataRow
                label="Remaining available for further use"
                value={formatQuantity(material.remaining + material.offcuts, material.unit)}
              />
              <DataRow
                label="Production loss"
                value={formatQuantity(material.loss + material.writtenOffInTransit, material.unit)}
              />
              <DataRow label="Material yield" value={formatPercent(material.yield)} />
            </dl>
            <p className="mt-4 rounded-2xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--ink-muted)]">
              Carbon and water figures are deliberately absent. CIRKA will not present them until a
              methodology and source factors have been agreed and documented — and when they arrive,
              the method will be named on screen.
            </p>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Local economic and social
            </h3>
            <dl>
              <DataRow label="Local makers engaged" value={social.makersEngaged} />
              <DataRow label="Organisations participating" value={social.organisationsParticipating} />
              <DataRow label="Production hours generated" value={social.productionHours} />
              <DataRow
                label="Units completed"
                value={`${social.unitsCompleted} of ${social.unitsPlanned} planned`}
              />
            </dl>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Commercial learning
            </h3>
            <dl>
              <DataRow
                label="Production time per unit"
                value={commercial.hoursPerUnit !== undefined ? `${commercial.hoursPerUnit} h` : "—"}
              />
              <DataRow label="Material yield" value={formatPercent(material.yield)} />
              <DataRow
                label="Intended vs actual output"
                value={`${social.unitsCompleted} of ${social.unitsPlanned}`}
              />
            </dl>

            {commercial.sharedCosts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {commercial.sharedCosts.map((row) => (
                  <div
                    key={row.productionReference}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{row.makerName}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Cost per unit, shared voluntarily by the maker
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-[var(--ink)]">
                      {formatCurrency(row.baseCostPerUnit, row.currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--ink-muted)]">
                No maker on this project has opted in to sharing cost per unit. Cost breakdowns,
                labour rates, supplier prices and margins are never part of this view.
              </p>
            )}
          </Panel>
        </div>
      </StoryStep>

      {/* 7 — Evidence and reporting */}
      <StoryStep
        index={7}
        title="Evidence and reporting"
        lead="What supports the claims, what CIRKA has checked, and what you can take away."
      >
        <div className="space-y-5">
          <Panel className="p-6">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DataRow
                label="CIRKA reviewed"
                value={`${assurance.reviewed} of ${proof.production.length} production batches`}
              />
              <DataRow label="Self-reported" value={assurance.selfReported} />
              <DataRow
                label="How the resource data arrived"
                value={assurance.dataSources
                  .map((source) => DATA_SOURCE_LABELS[source])
                  .join(", ")}
              />
              <DataRow
                label="External traceability records"
                value={
                  assurance.externalRecords.length > 0
                    ? assurance.externalRecords
                        .map((transfer) => transfer.externalRecordId ?? transfer.externalSystemName)
                        .join(", ")
                    : "None yet"
                }
              />
            </dl>
          </Panel>

          <EvidenceGrid items={proof.evidence} />

          <Panel className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Take the data with you
              </h3>
              <p className="max-w-2xl text-sm text-[var(--ink-muted)]">
                Every export carries the same provenance columns — data source, assurance level, who
                recorded it, when, and when it was last reviewed. No lock-in, no permission needed.
              </p>
            </div>
            <Button as={Link} href={`/demo/brand/projects/${project._id}/report`} size="sm">
              Open the printable report
            </Button>
          </Panel>
        </div>
      </StoryStep>
    </div>
  );
}
