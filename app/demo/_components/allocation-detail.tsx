"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Panel, Select } from "@/components/ui";
import { DISCREPANCY_RESOLUTIONS, statusLabel, type DiscrepancyResolution } from "../_mock/domain";
import type { AllocationDetail } from "../_mock/selectors-admin";
import { formatQuantity } from "../_mock/selectors-shared";
import { useDemoStore } from "../_mock/store";
import { AllocationJourney } from "./allocation-journey";
import { CirkaBadge, DataRow, NoticeBanner, SectionHeading, formatDate } from "./cirka-ui";
import { ThreadTimelinePanel } from "./trace-timeline";
import { useAction } from "./use-action";

export function AllocationDetailView({
  detail,
  backHref,
}: {
  detail: AllocationDetail;
  backHref: string;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const { allocation, batch, project, fromName, toName, fromFacility, toFacility } = detail;

  const [resolution, setResolution] = useState<DiscrepancyResolution>("loss_confirmed");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href={backHref} variant="ghost" size="sm">
          ← Back
        </Button>
        <CirkaBadge status={allocation.status} />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {allocation.hop.replace(/_/g, " ")}
        </span>
      </div>

      <SectionHeading
        eyebrow={allocation.reference}
        title={`${fromName} → ${toName}`}
        description={
          batch ? `${batch.name}${project ? ` · ${project.title}` : ""}` : project?.title
        }
        action={
          batch ? (
            <Button as={Link} href={`/demo/admin/batches/${batch._id}`} variant="secondary" size="sm">
              Open batch
            </Button>
          ) : undefined
        }
      />

      {error && (
        <NoticeBanner tone="blocking" title="That step was refused">
          {error}
        </NoticeBanner>
      )}

      <Panel className="p-6">
        <AllocationJourney allocation={allocation} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Quantity
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
            <DataRow
              label="Discrepancy"
              value={
                allocation.quantityDiscrepancy
                  ? formatQuantity(allocation.quantityDiscrepancy, allocation.unit)
                  : "None"
              }
              hint={allocation.discrepancyResolution?.replace(/_/g, " ")}
            />
          </dl>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Route and timing
          </h2>
          <dl>
            <DataRow label="From" value={fromName} hint={fromFacility?.name} />
            <DataRow label="To" value={toName} hint={toFacility?.name} />
            <DataRow label="Expected dispatch" value={formatDate(allocation.expectedDispatchDate)} />
            <DataRow label="Dispatch reference" value={allocation.dispatchReference ?? "-"} />
            <DataRow label="Expected arrival" value={formatDate(allocation.expectedArrivalDate)} />
            <DataRow
              label="Proposed"
              value={`${formatDate(allocation.createdAt)} · ${detail.proposedByName}`}
            />
            {detail.respondedByName && (
              <DataRow
                label={allocation.status === "declined" ? "Declined" : "Accepted"}
                value={`${formatDate(allocation.respondedAt)} · ${detail.respondedByName}`}
                hint={allocation.responseNote}
              />
            )}
          </dl>
        </Panel>
      </div>

      {allocation.status === "discrepancy" && (
        <section className="space-y-4 rounded-2xl border border-[#B4531A] bg-[#FBE9DC] p-6">
          <div>
            <p className="text-sm font-semibold text-[#8A3D11]">
              {formatQuantity(allocation.quantityDiscrepancy ?? 0, allocation.unit)} is sitting in the
              Unexplained pot
            </p>
            <p className="text-sm text-[#8A3D11]">
              {allocation.discrepancyReason} Closing it as a loss writes the quantity off; closing it
              as a counting correction returns it to available stock. Either way the batch total stays
              the same.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Resolution">
              <Select
                value={resolution}
                onChange={(event) => setResolution(event.target.value as DiscrepancyResolution)}
              >
                {DISCREPANCY_RESOLUTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Note">
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Manufacturer confirmed a damaged bale"
              />
            </Field>
          </div>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() =>
                store.resolveDiscrepancy("admin", {
                  allocationId: allocation._id,
                  resolution,
                  note,
                }),
              )
            }
          >
            Close discrepancy
          </Button>
        </section>
      )}

      {allocation.discrepancyResolvedAt && (
        <NoticeBanner tone="info" title={`Discrepancy resolved: ${statusLabel(allocation.discrepancyResolution ?? "")}`}>
          {formatDate(allocation.discrepancyResolvedAt)} · {detail.discrepancyResolvedByName}
        </NoticeBanner>
      )}

      <ThreadTimelinePanel
        role="admin"
        anchor={{ table: "allocations", id: allocation._id }}
      />
    </div>
  );
}
