"use client";

import { useState } from "react";
import { Package, PackageCheck, Truck, type LucideIcon } from "lucide-react";
import { Button, EmptyState, Field, Input, Panel } from "@/components/ui";
import { DEMO_NOW } from "../../_mock/data";
import { getManufacturerDashboard } from "../../_mock/selectors-manufacturer";
import { formatQuantity, orgName } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import type { AllocationStatus } from "../../_mock/domain";
import {
  CirkaBadge,
  DataRow,
  FlowBar,
  NoticeBanner,
  RouteProgress,
  SectionHeading,
  formatDate,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";

interface StageMeta {
  fraction: number;
  icon: LucideIcon;
}

const STAGE_META: Partial<Record<AllocationStatus, StageMeta>> = {
  proposed: { fraction: 0.08, icon: Package },
  accepted: { fraction: 0.3, icon: Package },
  awaiting_dispatch: { fraction: 0.55, icon: PackageCheck },
  in_transit: { fraction: 0.85, icon: Truck },
};

const DEFAULT_STAGE: StageMeta = { fraction: 0.08, icon: Package };

export default function ManufacturerDispatchPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");
  const { run, error, pending } = useAction();

  const view = getManufacturerDashboard(store.db, scope);
  const fromLabel = orgName(store.db, scope.orgId);
  const [drafts, setDrafts] = useState<Record<string, { quantity: string; reference: string }>>({});

  const draftFor = (allocationId: string, fallback: number) =>
    drafts[allocationId] ?? { quantity: String(fallback), reference: "" };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Dispatch" title="Material leaving your site" />

      {error && <NoticeBanner tone="blocking" title="That step was refused">{error}</NoticeBanner>}

      {view.discrepancies.length > 0 && (
        <NoticeBanner tone="warning" title="Awaiting your response on a discrepancy">
          {view.discrepancies.map((entry) => (
            <p key={entry.allocation._id}>
              {entry.allocation.reference}: {entry.counterpartyName} received{" "}
              {formatQuantity(entry.allocation.quantityReceived ?? 0, entry.allocation.unit)} against{" "}
              {formatQuantity(entry.allocation.quantityDispatched ?? 0, entry.allocation.unit)}{" "}
              dispatched.
            </p>
          ))}
        </NoticeBanner>
      )}

      {view.dispatchQueue.length === 0 ? (
        <EmptyState
          title="Nothing to dispatch"
          body="Allocations to custodians appear here."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {view.dispatchQueue.map(({ allocation, batch, toName }) => {
            const draft = draftFor(allocation._id, allocation.quantityAllocated);
            const stage = STAGE_META[allocation.status] ?? DEFAULT_STAGE;
            const isOverdue =
              allocation.expectedDispatchDate &&
              allocation.expectedDispatchDate < DEMO_NOW &&
              allocation.status !== "in_transit";
            const headlineQuantity = allocation.quantityDispatched ?? allocation.quantityAllocated;

            return (
              <Panel key={allocation._id} className="flex flex-col gap-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                        {allocation.reference}
                      </h2>
                      <CirkaBadge status={allocation.status} />
                      {isOverdue && <CirkaBadge status="overdue" label="Overdue" />}
                    </div>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {batch?.name} · {batch?.reference}
                    </p>
                  </div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                    {formatQuantity(headlineQuantity, allocation.unit)}
                  </p>
                </div>

                <RouteProgress
                  fromLabel={fromLabel}
                  toLabel={toName}
                  fraction={stage.fraction}
                  icon={stage.icon}
                  tone="current"
                />

                {allocation.status === "in_transit" && allocation.quantityDispatched !== undefined && (
                  <FlowBar
                    unit={allocation.unit}
                    max={allocation.quantityAllocated}
                    segments={[
                      {
                        key: "dispatched",
                        label: "Dispatched",
                        value: allocation.quantityDispatched,
                        colourClass: "bg-[var(--brand-primary)]",
                      },
                      {
                        key: "remainder",
                        label: "Allocated",
                        value: allocation.quantityAllocated,
                        colourClass: "bg-[var(--line)]",
                      },
                    ]}
                  />
                )}

                <dl className="grid gap-x-8 sm:grid-cols-2">
                  <DataRow
                    label="Expected dispatch"
                    value={formatDate(allocation.expectedDispatchDate)}
                    hint={isOverdue ? "Past the expected date" : undefined}
                  />
                  <DataRow
                    label="Expected arrival"
                    value={formatDate(allocation.expectedArrivalDate)}
                  />
                  <DataRow label="Consignment" value={allocation.dispatchReference ?? "-"} />
                </dl>

                {allocation.status === "accepted" && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          store.confirmDispatchReadiness("manufacturer", {
                            allocationId: allocation._id,
                          }),
                        )
                      }
                    >
                      Confirm dispatch readiness
                    </Button>
                  </div>
                )}

                {allocation.status === "awaiting_dispatch" && (
                  <div className="space-y-4 border-t border-[var(--line)] pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label={`Quantity dispatched (${allocation.unit})`}
                        hint={`Cannot exceed the ${formatQuantity(allocation.quantityAllocated, allocation.unit)} allocated.`}
                      >
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={draft.quantity}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [allocation._id]: { ...draft, quantity: event.target.value },
                            }))
                          }
                        />
                      </Field>
                      <Field label="Consignment reference">
                        <Input
                          value={draft.reference}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [allocation._id]: { ...draft, reference: event.target.value },
                            }))
                          }
                          placeholder="NVT-88431"
                        />
                      </Field>
                    </div>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          store.recordDispatch("manufacturer", {
                            allocationId: allocation._id,
                            quantityDispatched: Number(draft.quantity),
                            dispatchReference: draft.reference || undefined,
                          }),
                        )
                      }
                    >
                      Record dispatch
                    </Button>
                  </div>
                )}

                {allocation.status === "in_transit" && (
                  <p className="border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
                    {formatQuantity(allocation.quantityDispatched ?? 0, allocation.unit)} left on{" "}
                    {formatDate(allocation.dispatchedAt)} · awaiting receipt at {toName}
                  </p>
                )}

                {allocation.status === "proposed" && (
                  <p className="border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
                    Awaiting acceptance from {toName}
                  </p>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

