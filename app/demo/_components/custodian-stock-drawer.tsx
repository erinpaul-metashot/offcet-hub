"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import type { Holding } from "../_mock/selectors-custodian";
import type { Organisation } from "../_mock/types";
import { potSlices } from "../_mock/selectors-batches";
import { categoryLabel, formatQuantity } from "../_mock/selectors-shared";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  ProvenanceChip,
  QuantityPotsBar,
  formatDate,
} from "./cirka-ui";

interface AllocationDraft {
  makerOrgId: string;
  quantity: string;
  notes: string;
}

export function CustodianStockDrawer({
  holding,
  makers,
  draft,
  onDraftChange,
  store,
  run,
  pending,
  error,
  onClose,
}: {
  holding: Holding;
  makers: Organisation[];
  draft: AllocationDraft;
  onDraftChange: (next: AllocationDraft) => void;
  store: ReturnType<typeof useDemoStore>;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const { batch, held, promised, uncommitted, ownerName, receivedAt, sourceAllocation } = holding;

  // Keypress listener for Escape & Body Scroll-lock
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

  const maxQuantity = uncommitted;
  const quantityNum = Number(draft.quantity);
  const isOverLimit = quantityNum > maxQuantity;

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
        aria-label={batch.name}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {batch.reference} · {categoryLabel(batch.materialCategory)}
            </p>
            <h2 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-[var(--ink)]">
              {batch.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CirkaBadge status={batch.status} />
              <ProvenanceChip
                dataSource={batch.dataSource}
                assuranceLevel={batch.assuranceLevel}
              />
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
            <NoticeBanner tone="blocking" title="That allocation was refused">
              {error}
            </NoticeBanner>
          )}

          {/* Quantities Overview */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--surface)] p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Physically Held
              </p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                {formatQuantity(held, batch.unit)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Uncommitted Available
              </p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--brand-primary)]">
                {formatQuantity(uncommitted, batch.unit)}
              </p>
            </div>
          </div>

          {/* Pots Bar */}
          <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Pot Allocation Breakdown
            </p>
            <QuantityPotsBar
              slices={potSlices(batch)}
              total={batch.quantityOriginal}
              unit={batch.unit}
            />
          </div>

          {/* Batch Details */}
          <dl>
            <DataRow label="Owned by" value={ownerName} />
            <DataRow
              label="Promised to makers"
              value={formatQuantity(promised, batch.unit)}
            />
            <DataRow
              label="Uncommitted here"
              value={formatQuantity(uncommitted, batch.unit)}
            />
            <DataRow label="Received at site" value={formatDate(receivedAt)} />
          </dl>

          {/* Allocation Form */}
          <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Propose Allocation to a Maker
            </p>
            <Field label="Maker Organisation">
              <Select
                value={draft.makerOrgId}
                onChange={(e) =>
                  onDraftChange({ ...draft, makerOrgId: e.target.value })
                }
              >
                <option value="">Choose a maker</option>
                {makers.map((maker) => (
                  <option key={maker._id} value={maker._id}>
                    {maker.name} · {maker.city}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={`Quantity (${batch.unit})`}
              hint={`Maximum uncommitted available: ${formatQuantity(uncommitted, batch.unit)}`}
            >
              <Input
                type="number"
                min="0"
                max={uncommitted}
                step="0.001"
                value={draft.quantity}
                onChange={(e) =>
                  onDraftChange({ ...draft, quantity: e.target.value })
                }
              />
            </Field>

            <Field label="Note for Maker (optional)">
              <Input
                value={draft.notes}
                onChange={(e) =>
                  onDraftChange({ ...draft, notes: e.target.value })
                }
                placeholder="For the lined pouch run"
              />
            </Field>

            {isOverLimit && (
              <NoticeBanner
                tone="warning"
                title="Exceeds uncommitted quantity"
              >
                You cannot allocate more than {formatQuantity(uncommitted, batch.unit)}.
              </NoticeBanner>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-5">
          <Button
            disabled={
              pending ||
              !draft.makerOrgId ||
              !draft.quantity ||
              isOverLimit ||
              quantityNum <= 0
            }
            onClick={() =>
              run(async () => {
                await store.proposeAllocationToMaker("custodian", {
                  batchId: batch._id,
                  toOrgId: draft.makerOrgId,
                  quantity: Number(draft.quantity),
                  notes: draft.notes || undefined,
                  requestId: sourceAllocation?.requestId,
                  projectId: sourceAllocation?.projectId,
                });
                onClose();
              })
            }
          >
            Propose Allocation
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
