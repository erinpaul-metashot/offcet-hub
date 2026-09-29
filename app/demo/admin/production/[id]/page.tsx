"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, EmptyState, Field, Panel, Textarea } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { getProductionDetail } from "../../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  SectionHeading,
} from "../../../_components/cirka-ui";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";
import { EvidenceGrid } from "../../../_components/records";
import { ThreadTimelinePanel } from "../../../_components/trace-timeline";
import { useAction } from "../../../_components/use-action";

export default function AdminProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { scope } = useDemoPersona("admin");
  const { run, error, pending } = useAction();

  const detail = getProductionDetail(store.db, scope, params.id);
  const [reviewNotes, setReviewNotes] = useState("");
  const { productionReview: t } = useMessages(demoAdmin);
  /** Field names shared with the maker's production screen, reviewed once there. */
  const { productionDetail: m } = useMessages(demoMaker);
  const labels = useLabels();
  const fmt = useFormat();

  if (!detail) {
    return <EmptyState title={m.notFound} />;
  }

  const { production, balance, costs } = detail;
  const actorName = (userId?: string) =>
    store.db.users.find((user) => user._id === userId)?.name ?? t.system;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href="/demo/admin/production" variant="ghost" size="sm">
          {m.allProduction}
        </Button>
        <CirkaBadge status={production.status} />
        <CirkaBadge status={production.evidenceStatus} />
      </div>

      <SectionHeading
        eyebrow={`${production.reference} · ${detail.makerName}`}
        title={production.productName}
      />

      {error && <NoticeBanner tone="blocking" title={t.refused}>{error}</NoticeBanner>}

      {production.makerNotes && (
        <NoticeBanner tone="info" title={t.makerNotes}>{production.makerNotes}</NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.materialBalance}
          </h2>
          <dl>
            <DataRow
              label={m.material.qtyReceived}
              value={fmt.quantity(production.qtyReceived ?? 0, production.unit)}
            />
            <DataRow label={m.material.qtyUsed} value={fmt.quantity(production.qtyUsed ?? 0, production.unit)} />
            <DataRow
              label={m.material.qtyIncorporated}
              value={fmt.quantity(production.qtyIncorporated ?? 0, production.unit)}
            />
            <DataRow
              label={m.material.qtyPrototypes}
              value={fmt.quantity(production.qtyPrototypes ?? 0, production.unit)}
            />
            <DataRow
              label={m.material.qtyOffcuts}
              value={fmt.quantity(production.qtyOffcuts ?? 0, production.unit)}
            />
            <DataRow
              label={m.material.qtyLoss}
              value={fmt.quantity(production.qtyLoss ?? 0, production.unit)}
            />
            <DataRow
              label={m.material.qtyReusableRemaining}
              value={fmt.quantity(production.qtyReusableRemaining ?? 0, production.unit)}
            />
            <DataRow
              label={m.materialYield}
              value={
                production.materialYield !== undefined
                  ? fmt.percent(production.materialYield)
                  : "-"
              }
            />
          </dl>

          {balance.balanced ? (
            <p className="mt-4 text-sm text-[var(--brand-secondary)]">
              {format(t.balanced, {
                received: fmt.number(balance.received),
                accounted: fmt.number(balance.accountedFor),
              })}
            </p>
          ) : (
            <NoticeBanner tone="warning" title={t.notBalanced}>
              {balance.problems.map((problem) => (
                <p key={problem}>{problem}</p>
              ))}
            </NoticeBanner>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.run}
          </h2>
          <dl>
            <DataRow label={t.maker} value={detail.makerName} />
            <DataRow label={t.site} value={detail.facility?.name ?? "-"} />
            <DataRow label={m.resourceBatch} value={detail.batch?.reference ?? "-"} />
            <DataRow label={m.allocation} value={detail.allocation?.reference ?? "-"} />
            <DataRow label={m.project} value={detail.project?.title ?? m.standalone} />
            <DataRow
              label={m.category}
              value={labels.PRODUCT_CATEGORY_LABELS[production.productCategory]}
            />
            <DataRow
              label={t.units}
              value={format(t.unitsValue, {
                completed: detail.completedUnits,
                rejected: detail.rejectedUnits,
                reworked: detail.reworkUnits,
              })}
            />
            <DataRow
              label={t.schedule}
              value={format(t.planned, { date: fmt.date(production.plannedCompletionDate) })}
              hint={
                production.actualCompletionDate
                  ? format(t.actual, { date: fmt.date(production.actualCompletionDate) })
                  : t.notCompleted
              }
            />
            <DataRow
              label={t.labour}
              value={format(t.hours, { count: fmt.number(production.totalLabourHours ?? 0) })}
              hint={
                production.hoursPerSaleableUnit
                  ? format(t.perUnit, { count: fmt.number(production.hoursPerSaleableUnit) }) +
                    (production.timeIsEstimated ? t.includesEstimates : "")
                  : undefined
              }
            />
          </dl>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-3 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.inputsAndTime}
          </h2>
          <ul className="divide-y divide-[var(--line)]">
            {detail.inputs.map((input) => (
              <li key={input._id} className="py-3">
                <p className="text-sm font-medium text-[var(--ink)]">
                  {labels.INPUT_TYPE_LABELS[input.inputType]} · {input.description}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {fmt.number(input.quantity)} {input.unit} ·{" "}
                  {labels.SOURCING_CATEGORY_LABELS[input.sourcingCategory]}
                  {input.supplierName ? ` · ${input.supplierName}` : ""}
                  {input.cost !== undefined ? ` · ${fmt.currency(input.cost)}` : ""}
                </p>
              </li>
            ))}
            {detail.timeEntries.map((entry) => (
              <li key={entry._id} className="py-3">
                <p className="text-sm font-medium text-[var(--ink)]">
                  {labels.TIME_ACTIVITY_LABELS[entry.activity]} ·{" "}
                  {format(m.hoursShort, { count: fmt.number(entry.hours) })}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {entry.peopleInvolved ? format(m.peopleDot, { count: entry.peopleInvolved }) : ""}
                  {entry.isEstimated ? m.estimated : m.actualLower}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-3 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {m.costs}
          </h2>
          {costs ? (
            <dl>
              <DataRow label={m.cost.resourceCost} value={fmt.currency(costs.resourceCost, costs.currency)} />
              <DataRow label={m.cost.additionalInputCost} value={fmt.currency(costs.additionalInputCost, costs.currency)} />
              <DataRow label={m.cost.labourCost} value={fmt.currency(costs.labourCost, costs.currency)} />
              <DataRow label={m.cost.transportCost} value={fmt.currency(costs.transportCost, costs.currency)} />
              <DataRow label={m.cost.custodianFees} value={fmt.currency(costs.custodianFees, costs.currency)} />
              <DataRow label={m.totalBatchCost} value={fmt.currency(costs.totalBatchCost, costs.currency)} />
              <DataRow label={m.baseCostPerUnit} value={fmt.currency(costs.baseCostPerUnit, costs.currency)} />
              <DataRow label={m.revenue} value={fmt.currency(costs.revenueGenerated, costs.currency)} />
              <DataRow
                label={m.sharedWithBrand}
                value={costs.shareCostPerUnitWithBrand ? m.costPerUnit : "-"}
              />
            </dl>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">{t.noCosts}</p>
          )}
        </Panel>
      </div>

      {detail.suitability && (
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {m.suitability}
          </h2>
          <dl>
            <DataRow
              label={m.assessment}
              value={labels.SUITABILITY_LABELS[detail.suitability.suitability]}
              hint={
                detail.suitability.qualityRating
                  ? format(m.quality, { rating: detail.suitability.qualityRating })
                  : undefined
              }
            />
            <DataRow
              label={m.receivedAsDescribed}
              value={detail.suitability.receivedAsDescribed ? m.yes : m.no}
            />
            <DataRow label={t.damage} value={detail.suitability.damageNote ?? t.noneReported} />
            <DataRow label={m.recommendedFor} value={detail.suitability.recommendedApplications ?? "-"} />
            <DataRow label={m.limitations} value={detail.suitability.limitations ?? "-"} />
          </dl>
        </Panel>
      )}

      <Panel className="space-y-4 p-6">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{m.evidence}</h2>
        <EvidenceGrid items={detail.evidence} />

        {production.status === "evidence_submitted" && (
          <div className="space-y-4 border-t border-[var(--line)] pt-4">
            <Field label={t.reviewNotes} hint={t.reviewNotesHint}>
              <Textarea
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder={t.reviewNotesPlaceholder}
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.reviewEvidence("admin", {
                      productionBatchId: production._id,
                      approve: true,
                      reviewNotes: reviewNotes || undefined,
                    }),
                  )
                }
              >
                {t.approve}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.reviewEvidence("admin", {
                      productionBatchId: production._id,
                      approve: false,
                      reviewNotes,
                    }),
                  )
                }
              >
                {t.sendBack}
              </Button>
            </div>
          </div>
        )}

        {production.evidenceStatus === "cirka_reviewed" && (
          <p className="border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
            {format(t.reviewed, {
              date: fmt.date(production.reviewedAt),
              name: actorName(production.reviewedByUserId),
            })}
            {production.reviewNotes ? ` ${production.reviewNotes}` : ""}
          </p>
        )}
      </Panel>

      {detail.transfers.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--line)] px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {t.transfers}
            </h2>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {detail.transfers.map((transfer) => (
              <div
                key={transfer._id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {format(transfer.direction === "inbound" ? t.fromSystem : t.toSystem, {
                      system: transfer.externalSystemName,
                    })}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {transfer.errorMessage ?? transfer.payloadSummary}
                  </p>
                </div>
                <CirkaBadge status={transfer.status} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      <ThreadTimelinePanel
        role="admin"
        anchor={{ table: "productionBatches", id: production._id }}
      />
    </div>
  );
}
