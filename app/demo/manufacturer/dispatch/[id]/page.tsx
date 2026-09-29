"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, EmptyState, Field, Input, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { getAllocationDetail } from "../../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { CirkaBadge, DataRow, NoticeBanner, SectionHeading } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";
import { ArrowUpRight } from "lucide-react";
import { AllocationJourney } from "../../../_components/allocation-journey";
import { DiscrepancyAnalysisPanel } from "../../../_components/discrepancy-analysis";
import { ThreadTimelinePanel } from "../../../_components/trace-timeline";

export default function ManufacturerDispatchDetailPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const { scope } = useDemoPersona("manufacturer");

  // We can use the admin selector to get the detail data safely for the UI
  const detail = getAllocationDetail(store.db, params.id);
  const [draftQuantity, setDraftQuantity] = useState("");
  const [draftReference, setDraftReference] = useState("");
  const { dispatchDetail: t } = useMessages(demoManufacturer);
  const { ui, discrepancy } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

  if (!detail || detail.allocation.fromOrgId !== scope.orgId) {
    return (
      <EmptyState title={t.notFound} />
    );
  }

  const { allocation, batch, fromName, toName } = detail;
  const hasDiscrepancy =
    allocation.status === "discrepancy" ||
    Boolean(allocation.quantityDiscrepancy) ||
    Boolean(allocation.discrepancyResolution);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href="/demo/manufacturer/dispatch" variant="ghost" size="sm">
          {t.back}
        </Button>
        <CirkaBadge status={allocation.status} />
      </div>

      <SectionHeading
        eyebrow={allocation.reference}
        title={`${fromName} → ${toName}`}
        action={
          batch ? (
            <Button as={Link} href={`/demo/manufacturer/batches/${batch._id}`} variant="secondary" size="sm">
              {t.openBatch}
            </Button>
          ) : undefined
        }
      />

      {error && <NoticeBanner tone="blocking" title={ui.stepRefused}>{error}</NoticeBanner>}

      <Panel className="p-6">
        <AllocationJourney allocation={allocation} />
      </Panel>

      {/* Discrepancy Breakdown & Audit Panel */}
      {hasDiscrepancy && (
        <DiscrepancyAnalysisPanel
          allocation={allocation}
          batch={batch}
          fromName={fromName}
          toName={toName}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.quantities}
          </h2>
          <dl>
            <DataRow label={t.allocated} value={fmt.quantity(allocation.quantityAllocated, allocation.unit)} />
            <DataRow
              label={t.dispatched}
              value={
                allocation.quantityDispatched !== undefined
                  ? fmt.quantity(allocation.quantityDispatched, allocation.unit)
                  : "-"
              }
              hint={fmt.date(allocation.dispatchedAt)}
            />
            <DataRow
              label={t.received}
              value={
                allocation.quantityReceived !== undefined
                  ? fmt.quantity(allocation.quantityReceived, allocation.unit)
                  : "-"
              }
              hint={fmt.date(allocation.receivedAt)}
            />
            {allocation.quantityDiscrepancy !== undefined && (
              <DataRow
                label={t.shortfall}
                value={fmt.quantity(allocation.quantityDiscrepancy, allocation.unit)}
                hint={
                  allocation.discrepancyResolution
                    ? discrepancy.resolutions[allocation.discrepancyResolution]
                    : t.awaitingResolution
                }
              />
            )}
          </dl>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.consignment}
          </h2>
          <dl>
            <DataRow label={t.expectedDispatch} value={fmt.date(allocation.expectedDispatchDate)} />
            <DataRow label={t.expectedArrival} value={fmt.date(allocation.expectedArrivalDate)} />
            <DataRow label={t.consignmentRef} value={allocation.dispatchReference ?? "-"} />
            {batch && (
              <DataRow
                label={t.resourceBatch}
                value={
                  <Link
                    href={`/demo/manufacturer/batches/${batch._id}`}
                    className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    <span>{batch.reference}</span>
                    <ArrowUpRight size={13} />
                  </Link>
                }
              />
            )}
          </dl>
        </Panel>
      </div>

      {/* Actionable Forms */}
      {allocation.status === "accepted" && (
        <Panel className="p-6">
          <Button
            disabled={pending}
            onClick={() =>
              run(() =>
                store.confirmDispatchReadiness("manufacturer", {
                  allocationId: allocation._id,
                }),
              )
            }
            className="bg-[#FF5C00] hover:bg-[#e05200] text-white normal-case font-semibold tracking-normal flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm"
          >
            {t.confirmReadiness}
          </Button>
        </Panel>
      )}

      {allocation.status === "awaiting_dispatch" && (
        <Panel className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.recordDispatch}
          </h2>
          <div className="space-y-4 max-w-lg">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={format(t.quantityDispatched, { unit: labels.UNIT_LABELS[allocation.unit] })}
                hint={format(t.cannotExceed, { quantity: fmt.quantity(allocation.quantityAllocated, allocation.unit) })}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={draftQuantity}
                  onChange={(event) => setDraftQuantity(event.target.value)}
                  placeholder={allocation.quantityAllocated.toString()}
                />
              </Field>
              <Field label={t.consignmentReference}>
                <Input
                  value={draftReference}
                  onChange={(event) => setDraftReference(event.target.value)}
                  placeholder="NVT-88431"
                />
              </Field>
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                run(() =>
                  store.recordDispatch("manufacturer", {
                    allocationId: allocation._id,
                    quantityDispatched: Number(draftQuantity) || allocation.quantityAllocated,
                    dispatchReference: draftReference || undefined,
                  }),
                )
              }
              className="bg-[#FF5C00] hover:bg-[#e05200] text-white normal-case font-semibold tracking-normal flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm"
            >
              {t.recordDispatch}
            </Button>
          </div>
        </Panel>
      )}

      {/* Activity Timeline & Audit */}
      <ThreadTimelinePanel
        role="manufacturer"
        anchor={{ table: "allocations", id: allocation._id }}
      />
    </div>
  );
}

