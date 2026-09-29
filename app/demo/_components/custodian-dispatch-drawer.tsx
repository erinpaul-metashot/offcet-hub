"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoCustodian } from "@/lib/i18n/messages/demo-custodian";
import type { Allocation, ResourceBatch } from "../_mock/types";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { AllocationJourney } from "./allocation-journey";
import { CirkaBadge, DataRow, NoticeBanner } from "./cirka-ui";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

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
  const { dispatchDrawer: t } = useMessages(demoCustodian);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

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
              {allocation.reference}
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
            aria-label={t.closeDrawer}
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title={ui.stepRefused}>
              {error}
            </NoticeBanner>
          )}

          {/* Allocation Journey Stepper */}
          <AllocationJourney allocation={allocation} />

          {/* Quantity Callout */}
          <div className="flex items-baseline justify-between rounded-2xl bg-[var(--surface)] px-5 py-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {t.quantity}
            </span>
            <span className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
              {fmt.quantity(allocation.quantityAllocated, allocation.unit)}
            </span>
          </div>

          {/* Timeline & Metadata */}
          <dl>
            <DataRow label={t.proposed} value={fmt.date(allocation.createdAt)} />
            <DataRow
              label={t.makerResponse}
              value={
                allocation.respondedAt
                  ? `${fmt.date(allocation.respondedAt)}${allocation.responseNote ? ` · ${allocation.responseNote}` : ""}`
                  : "-"
              }
            />
            <DataRow
              label={t.dispatched}
              value={
                allocation.dispatchedAt
                  ? `${fmt.date(allocation.dispatchedAt)}${allocation.dispatchReference ? ` (${allocation.dispatchReference})` : ""}`
                  : "-"
              }
            />
            <DataRow
              label={t.receivedByMaker}
              value={
                allocation.receivedAt
                  ? format(t.receivedOn, {
                      quantity: fmt.quantity(allocation.quantityReceived ?? 0, allocation.unit),
                      date: fmt.date(allocation.receivedAt),
                    })
                  : "-"
              }
            />
            {allocation.notes && <DataRow label={t.note} value={allocation.notes} />}
          </dl>

          {isAwaitingDispatch && (
            <div className="rounded-2xl bg-[var(--surface)] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={format(t.quantityHandedOver, { unit: labels.UNIT_LABELS[allocation.unit] })}>
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
                <Field label={t.reference}>
                  <Input
                    value={draft.reference}
                    onChange={(e) =>
                      onDraftChange({ ...draft, reference: e.target.value })
                    }
                    placeholder={t.referencePlaceholder}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-[var(--line)] px-6 py-5">
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
              {t.ready}
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
              {t.record}
            </Button>
          )}

          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
