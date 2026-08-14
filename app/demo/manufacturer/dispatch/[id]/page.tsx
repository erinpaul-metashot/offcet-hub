"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, EmptyState, Field, Input, Panel } from "@/components/ui";
import { getAllocationDetail } from "../../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { formatQuantity } from "../../../_mock/selectors-shared";
import { CirkaBadge, DataRow, formatDate, SectionHeading } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";
import { ArrowUpRight } from "lucide-react";
import { AllocationJourney } from "../../../_components/allocation-journey";
import { DiscrepancyAnalysisPanel } from "../../../_components/discrepancy-analysis";
import { ThreadTimelinePanel } from "../../../_components/trace-timeline";

export default function ManufacturerDispatchDetailPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { run, pending } = useAction();
  const { scope } = useDemoPersona("manufacturer");

  // We can use the admin selector to get the detail data safely for the UI
  const detail = getAllocationDetail(store.db, params.id);
  const [draftQuantity, setDraftQuantity] = useState("");
  const [draftReference, setDraftReference] = useState("");

  if (!detail || detail.allocation.fromOrgId !== scope.orgId) {
    return (
      <EmptyState
        title="Dispatch not found"
        body="It may have been removed."
      />
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
          ← Back to Log
        </Button>
        <CirkaBadge status={allocation.status} />
      </div>

      <SectionHeading
        eyebrow={allocation.reference}
        title={`${fromName} → ${toName}`}
        description={batch ? `${batch.name}` : `Batch ${allocation.batchId}`}
        action={
          batch ? (
            <Button as={Link} href={`/demo/manufacturer/batches/${batch._id}`} variant="secondary" size="sm">
              Open batch
            </Button>
          ) : undefined
        }
      />

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
            Dispatch Quantities
          </h2>
          <dl>
            <DataRow label="Allocated" value={formatQuantity(allocation.quantityAllocated, allocation.unit)} />
            <DataRow
              label="Dispatched"
              value={
                allocation.quantityDispatched !== undefined
                  ? formatQuantity(allocation.quantityDispatched, allocation.unit)
                  : "-"
              }
              hint={formatDate(allocation.dispatchedAt)}
            />
            <DataRow
              label="Received"
              value={
                allocation.quantityReceived !== undefined
                  ? formatQuantity(allocation.quantityReceived, allocation.unit)
                  : "-"
              }
              hint={formatDate(allocation.receivedAt)}
            />
            {allocation.quantityDiscrepancy !== undefined && (
              <DataRow
                label="Unexplained Shortfall"
                value={formatQuantity(allocation.quantityDiscrepancy, allocation.unit)}
                hint={allocation.discrepancyResolution?.replace(/_/g, " ") ?? "Awaiting resolution"}
              />
            )}
          </dl>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Consignment Details
          </h2>
          <dl>
            <DataRow label="Expected dispatch" value={formatDate(allocation.expectedDispatchDate)} />
            <DataRow label="Expected arrival" value={formatDate(allocation.expectedArrivalDate)} />
            <DataRow label="Consignment Ref" value={allocation.dispatchReference ?? "-"} />
            {batch && (
              <DataRow
                label="Resource Lot"
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
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Next Step: Prepare for Dispatch
          </h2>
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
            Confirm Dispatch Readiness
          </Button>
        </Panel>
      )}

      {allocation.status === "awaiting_dispatch" && (
        <Panel className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Next Step: Record Dispatch
          </h2>
          <div className="space-y-4 max-w-lg">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Quantity dispatched (${allocation.unit})`}
                hint={`Cannot exceed the ${formatQuantity(allocation.quantityAllocated, allocation.unit)} allocated.`}
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
              <Field label="Consignment reference">
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
              Record Dispatch & Generate Manifest
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

