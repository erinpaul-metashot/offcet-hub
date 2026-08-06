"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, EmptyState, Field, Panel, Textarea } from "@/components/ui";
import {
  INPUT_TYPE_LABELS,
  PRODUCT_CATEGORY_LABELS,
  SOURCING_CATEGORY_LABELS,
  SUITABILITY_LABELS,
  TIME_ACTIVITY_LABELS,
} from "../../../_mock/domain";
import { getProductionDetail } from "../../../_mock/selectors-maker";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatQuantity,
} from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  SectionHeading,
  formatDate,
} from "../../../_components/cirka-ui";
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

  if (!detail) {
    return <EmptyState title="Production batch not found" body="The demo data may have been reset." />;
  }

  const { production, balance, costs } = detail;
  const actorName = (userId?: string) =>
    store.db.users.find((user) => user._id === userId)?.name ?? "System";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href="/demo/admin/production" variant="ghost" size="sm">
          ← All production
        </Button>
        <CirkaBadge status={production.status} />
        <CirkaBadge status={production.evidenceStatus} />
      </div>

      <SectionHeading
        eyebrow={`${production.reference} · ${detail.makerName}`}
        title={production.productName}
        description={production.productDescription}
      />

      {error && <NoticeBanner tone="blocking" title="That review step was refused">{error}</NoticeBanner>}

      {production.makerNotes && (
        <NoticeBanner tone="info" title="Notes from the maker">{production.makerNotes}</NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Material balance
          </h2>
          <dl>
            <DataRow
              label="Received"
              value={formatQuantity(production.qtyReceived ?? 0, production.unit)}
            />
            <DataRow label="Used" value={formatQuantity(production.qtyUsed ?? 0, production.unit)} />
            <DataRow
              label="Into finished products"
              value={formatQuantity(production.qtyIncorporated ?? 0, production.unit)}
            />
            <DataRow
              label="Into prototypes"
              value={formatQuantity(production.qtyPrototypes ?? 0, production.unit)}
            />
            <DataRow
              label="Reusable offcuts"
              value={formatQuantity(production.qtyOffcuts ?? 0, production.unit)}
            />
            <DataRow
              label="Unusable loss"
              value={formatQuantity(production.qtyLoss ?? 0, production.unit)}
            />
            <DataRow
              label="Reusable remaining"
              value={formatQuantity(production.qtyReusableRemaining ?? 0, production.unit)}
            />
            <DataRow
              label="Material yield"
              value={
                production.materialYield !== undefined
                  ? formatPercent(production.materialYield)
                  : "-"
              }
            />
          </dl>

          {balance.balanced ? (
            <p className="mt-4 text-sm text-[var(--brand-secondary)]">
              The numbers balance: {balance.received} received = {balance.accountedFor} accounted for.
            </p>
          ) : (
            <NoticeBanner tone="warning" title="The maker's figures do not balance">
              {balance.problems.map((problem) => (
                <p key={problem}>{problem}</p>
              ))}
            </NoticeBanner>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            The run
          </h2>
          <dl>
            <DataRow label="Maker" value={detail.makerName} />
            <DataRow label="Site" value={detail.facility?.name ?? "-"} />
            <DataRow label="Resource batch" value={detail.batch?.reference ?? "-"} />
            <DataRow label="Allocation" value={detail.allocation?.reference ?? "-"} />
            <DataRow label="Project" value={detail.project?.title ?? "Standalone"} />
            <DataRow
              label="Category"
              value={PRODUCT_CATEGORY_LABELS[production.productCategory]}
            />
            <DataRow
              label="Units"
              value={`${detail.completedUnits} completed · ${detail.rejectedUnits} rejected · ${detail.reworkUnits} reworked`}
            />
            <DataRow
              label="Schedule"
              value={`Planned ${formatDate(production.plannedCompletionDate)}`}
              hint={
                production.actualCompletionDate
                  ? `Actual ${formatDate(production.actualCompletionDate)}`
                  : "Not completed"
              }
            />
            <DataRow
              label="Labour"
              value={`${production.totalLabourHours ?? 0} hours`}
              hint={
                production.hoursPerSaleableUnit
                  ? `${production.hoursPerSaleableUnit} h per unit${production.timeIsEstimated ? " · includes estimates" : ""}`
                  : undefined
              }
            />
          </dl>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-3 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Inputs and time
          </h2>
          <ul className="divide-y divide-[var(--line)]">
            {detail.inputs.map((input) => (
              <li key={input._id} className="py-3">
                <p className="text-sm font-medium text-[var(--ink)]">
                  {INPUT_TYPE_LABELS[input.inputType]} · {input.description}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {formatNumber(input.quantity)} {input.unit} ·{" "}
                  {SOURCING_CATEGORY_LABELS[input.sourcingCategory]}
                  {input.supplierName ? ` · ${input.supplierName}` : ""}
                  {input.cost !== undefined ? ` · ${formatCurrency(input.cost)}` : ""}
                </p>
              </li>
            ))}
            {detail.timeEntries.map((entry) => (
              <li key={entry._id} className="py-3">
                <p className="text-sm font-medium text-[var(--ink)]">
                  {TIME_ACTIVITY_LABELS[entry.activity]} · {entry.hours} h
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {entry.peopleInvolved ? `${entry.peopleInvolved} people · ` : ""}
                  {entry.isEstimated ? "estimated" : "actual"}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-3 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Costs: CIRKA and maker only
          </h2>
          {costs ? (
            <dl>
              <DataRow label="Resource" value={formatCurrency(costs.resourceCost, costs.currency)} />
              <DataRow label="Additional inputs" value={formatCurrency(costs.additionalInputCost, costs.currency)} />
              <DataRow label="Labour" value={formatCurrency(costs.labourCost, costs.currency)} />
              <DataRow label="Transport" value={formatCurrency(costs.transportCost, costs.currency)} />
              <DataRow label="Custodian fees" value={formatCurrency(costs.custodianFees, costs.currency)} />
              <DataRow label="Total batch cost" value={formatCurrency(costs.totalBatchCost, costs.currency)} />
              <DataRow label="Base cost per unit" value={formatCurrency(costs.baseCostPerUnit, costs.currency)} />
              <DataRow label="Revenue" value={formatCurrency(costs.revenueGenerated, costs.currency)} />
              <DataRow
                label="Shared with the brand"
                value={costs.shareCostPerUnitWithBrand ? "Cost per unit only" : "Nothing"}
              />
            </dl>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">No costs recorded for this batch.</p>
          )}
        </Panel>
      </div>

      {detail.suitability && (
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Material suitability feedback
          </h2>
          <dl>
            <DataRow
              label="Assessment"
              value={SUITABILITY_LABELS[detail.suitability.suitability]}
              hint={
                detail.suitability.qualityRating
                  ? `Quality ${detail.suitability.qualityRating}/5`
                  : undefined
              }
            />
            <DataRow
              label="Received as described"
              value={detail.suitability.receivedAsDescribed ? "Yes" : "No"}
            />
            <DataRow label="Damage" value={detail.suitability.damageNote ?? "None reported"} />
            <DataRow label="Recommended for" value={detail.suitability.recommendedApplications ?? "-"} />
            <DataRow label="Limitations" value={detail.suitability.limitations ?? "-"} />
          </dl>
        </Panel>
      )}

      <Panel className="space-y-4 p-6">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Evidence</h2>
        <EvidenceGrid items={detail.evidence} />

        {production.status === "evidence_submitted" && (
          <div className="space-y-4 border-t border-[var(--line)] pt-4">
            <Field label="Review notes" hint="Required to send back">
              <Textarea
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Weights, counts and photos reconcile with the allocation."
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
                Mark CIRKA reviewed
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
                Send back for more detail
              </Button>
            </div>
          </div>
        )}

        {production.evidenceStatus === "cirka_reviewed" && (
          <p className="border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
            Reviewed {formatDate(production.reviewedAt)} by {actorName(production.reviewedByUserId)}.
            {production.reviewNotes ? ` ${production.reviewNotes}` : ""}
          </p>
        )}
      </Panel>

      {detail.transfers.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--line)] px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Integration transfers
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
                    {transfer.direction === "inbound" ? "From" : "To"} {transfer.externalSystemName}
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
        description="What this run was made from, and everything that happened to the material first."
      />
    </div>
  );
}
