"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import type { Allocation, ResourceBatch } from "../_mock/types";
import { formatQuantity } from "../_mock/selectors-shared";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { AllocationJourney } from "./allocation-journey";
import { CirkaBadge, DataRow, NoticeBanner, formatDate } from "./cirka-ui";

export interface OutgoingEntry {
  allocation: Allocation;
  batch?: ResourceBatch;
  makerName: string;
}

interface DispatchDraft {
  quantity: string;
  reference: string;
}

export function CustodianDispatchDrawer({
  entry,
  draft,
  onDraftChange,
  store,
  run,
  pending,
  error,
  onClose,
}: {
  entry: OutgoingEntry;
  draft: DispatchDraft;
  onDraftChange: (next: DispatchDraft) => void;
  store: ReturnType<typeof useDemoStore>;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const { allocation, batch, makerName } = entry;

  // Escape key & body overflow lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const isAccepted = allocation.status === "accepted";
  const isAwaitingDispatch = allocation.status === "awaiting_dispatch";
  const isProposed = allocation.status === "proposed";
  const isInTransit = allocation.status === "in_transit";
  const isComplete = ["received", "completed"].includes(allocation.status);

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex justify-end bg-[var(--ink)]/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--paper)]"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={allocation.reference}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {allocation.reference} · Out to Maker
            </p>
            <h2 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-[var(--ink)]">
              {batch?.name ?? allocation.reference}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CirkaBadge status={allocation.status} />
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                → {makerName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title="That step was refused">
              {error}
            </NoticeBanner>
          )}

          {/* Allocation Journey Stepper */}
          <AllocationJourney allocation={allocation} />

          {/* Quantity Callout */}
          <div className="flex items-baseline justify-between rounded-2xl bg-[var(--surface)] px-5 py-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Sub-allocation quantity
            </span>
            <span className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
              {formatQuantity(allocation.quantityAllocated, allocation.unit)}
            </span>
          </div>

          {/* Timeline & Metadata */}
          <dl>
            <DataRow label="Destination Maker" value={makerName} />
            <DataRow label="Proposed" value={formatDate(allocation.createdAt)} />
            <DataRow
              label="Maker response"
              value={
                allocation.respondedAt
                  ? `${formatDate(allocation.respondedAt)}${allocation.responseNote ? ` · ${allocation.responseNote}` : ""}`
                  : "Waiting on maker"
              }
            />
            <DataRow
              label="Dispatched"
              value={
                allocation.dispatchedAt
                  ? `${formatDate(allocation.dispatchedAt)}${allocation.dispatchReference ? ` (${allocation.dispatchReference})` : ""}`
                  : "Not yet dispatched"
              }
            />
            <DataRow
              label="Received by maker"
              value={
                allocation.receivedAt
                  ? `${formatQuantity(allocation.quantityReceived ?? 0, allocation.unit)} on ${formatDate(allocation.receivedAt)}`
                  : "Not yet received"
              }
            />
            {allocation.notes && (
              <DataRow label="Allocation Note" value={allocation.notes} />
            )}
          </dl>

          {/* Status-specific Action Forms / Notices */}

          {isAccepted && (
            <div className="space-y-3 rounded-2xl bg-[var(--surface)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Stage 1: Staging Readiness
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {makerName} has accepted this allocation. Confirm the material is prepared and ready for hand-over at your node.
              </p>
            </div>
          )}

          {isAwaitingDispatch && (
            <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Stage 2: Record Physical Hand-over
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Quantity handed over (${allocation.unit})`}>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={draft.quantity}
                    onChange={(e) =>
                      onDraftChange({ ...draft, quantity: e.target.value })
                    }
                  />
                </Field>
                <Field label="Dispatch Reference / Note">
                  <Input
                    value={draft.reference}
                    onChange={(e) =>
                      onDraftChange({ ...draft, reference: e.target.value })
                    }
                    placeholder="Collected in person"
                  />
                </Field>
              </div>
            </div>
          )}

          {isProposed && (
            <NoticeBanner tone="info" title={`Waiting on ${makerName}`}>
              The allocation has been proposed. Nothing for you to do until the maker accepts or declines.
            </NoticeBanner>
          )}

          {isInTransit && (
            <NoticeBanner tone="info" title="Hand-over recorded">
              You recorded the physical dispatch. The material is currently in transit to {makerName}.
            </NoticeBanner>
          )}

          {isComplete && (
            <NoticeBanner tone="info" title="Hand-over completed">
              {makerName} confirmed receipt of {formatQuantity(allocation.quantityReceived ?? 0, allocation.unit)} on {formatDate(allocation.receivedAt)}.
            </NoticeBanner>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-5">
          {isAccepted && (
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await store.confirmDispatchReadiness("custodian", {
                    allocationId: allocation._id,
                  });
                  onClose();
                })
              }
            >
              Confirm Ready for Dispatch
            </Button>
          )}

          {isAwaitingDispatch && (
            <Button
              disabled={pending || !draft.quantity || Number(draft.quantity) <= 0}
              onClick={() =>
                run(async () => {
                  await store.recordDispatch("custodian", {
                    allocationId: allocation._id,
                    quantityDispatched: Number(draft.quantity),
                    dispatchReference: draft.reference || undefined,
                  });
                  onClose();
                })
              }
            >
              Record Hand-over
            </Button>
          )}

          {!isAccepted && !isAwaitingDispatch && (
            <span className="text-sm text-[var(--ink-muted)]">
              {isProposed
                ? `Waiting for ${makerName} to accept.`
                : isInTransit
                  ? `Waiting for ${makerName} to confirm receipt.`
                  : "Dispatch complete."}
            </span>
          )}

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
