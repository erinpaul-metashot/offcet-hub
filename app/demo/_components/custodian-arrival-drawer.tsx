"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import type { ExpectedArrival } from "../_mock/selectors-custodian";
import { formatQuantity } from "../_mock/selectors-shared";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { AllocationJourney } from "./allocation-journey";
import { CirkaBadge, DataRow, NoticeBanner, formatDate } from "./cirka-ui";

interface Draft {
  received: string;
  note: string;
}

/** Weighbridge-style two-block comparison: dispatch note vs your weigh-in. */
function ScaleComparison({
  dispatched,
  received,
  unit,
}: {
  dispatched: number;
  received: number | null;
  unit: string;
}) {
  const hasReceived = received !== null && !isNaN(received);
  const delta = hasReceived ? Math.round((dispatched - received!) * 1000) / 1000 : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Dispatch note side */}
        <div className="rounded-xl bg-[var(--charcoal,#545454)] px-4 py-3 text-center text-white">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">
            Dispatch note
          </p>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight">
            {dispatched}
            <span className="ml-1 text-sm font-semibold">{unit}</span>
          </p>
        </div>

        {/* Weigh-in side */}
        <div
          className={[
            "rounded-xl px-4 py-3 text-center transition-colors duration-200",
            !hasReceived
              ? "border-2 border-dashed border-[var(--brand-primary)] bg-[var(--surface)]"
              : delta === 0
                ? "border-2 border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted,rgba(140,198,63,.12))]"
                : "border-2 border-[var(--brand-primary)] bg-[var(--brand-primary-muted,rgba(255,92,0,.08))]",
          ].join(" ")}
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Your weigh-in
          </p>
          <p
            className={[
              "text-2xl font-extrabold tabular-nums tracking-tight",
              !hasReceived
                ? "text-[var(--ink-muted)]"
                : delta === 0
                  ? "text-[var(--brand-secondary)]"
                  : "text-[var(--brand-primary)]",
            ].join(" ")}
          >
            {hasReceived ? received : "—"}
            <span className="ml-1 text-sm font-semibold">{unit}</span>
          </p>
        </div>
      </div>

      {hasReceived && delta !== null && (
        <p
          className={[
            "rounded-lg px-3 py-2 text-center text-[11px] font-semibold",
            delta > 0
              ? "bg-[#FBE9DC] text-[#8A3D11]"
              : delta < 0
                ? "bg-[#FBE2E2] text-[#8A1F1F]"
                : "bg-[var(--brand-secondary-muted,rgba(140,198,63,.12))] text-[var(--brand-secondary)]",
          ].join(" ")}
        >
          {delta > 0
            ? `${delta} ${unit} short of dispatch note — held as unexplained`
            : delta < 0
              ? `${Math.abs(delta)} ${unit} over the dispatch note — also flagged`
              : "Matches the dispatch note exactly"}
        </p>
      )}
    </div>
  );
}

export function CustodianArrivalDrawer({
  entry,
  draft,
  onDraftChange,
  store,
  run,
  pending,
  error,
  onClose,
}: {
  entry: ExpectedArrival;
  draft: Draft;
  onDraftChange: (next: Draft) => void;
  store: ReturnType<typeof useDemoStore>;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const { allocation, batch, fromName, late } = entry;
  const dispatched = allocation.quantityDispatched ?? allocation.quantityAllocated;
  const receivedNum = draft.received !== "" ? Number(draft.received) : null;
  const shortfall =
    receivedNum !== null && !isNaN(receivedNum)
      ? Math.round((dispatched - receivedNum) * 1000) / 1000
      : 0;

  // Escape key + scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

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
        {/* ── Header ── */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {allocation.reference}
            </p>
            <h2 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-[var(--ink)]">
              {batch?.name ?? allocation.reference}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <CirkaBadge status={allocation.status} />
              {late && <CirkaBadge status="overdue" />}
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

        {/* ── Scrollable body ── */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title="That step was refused">
              {error}
            </NoticeBanner>
          )}

          {/* Journey stepper */}
          <AllocationJourney allocation={allocation} />

          {/* Weighbridge scale for in_transit and discrepancy */}
          {(allocation.status === "in_transit" ||
            allocation.status === "discrepancy") && (
            <ScaleComparison
              dispatched={dispatched}
              received={
                allocation.status === "discrepancy"
                  ? (allocation.quantityReceived ?? null)
                  : receivedNum
              }
              unit={allocation.unit}
            />
          )}

          {/* Data rows */}
          <dl>
            <DataRow
              label="Allocated"
              value={formatQuantity(allocation.quantityAllocated, allocation.unit)}
            />
            <DataRow label="From" value={fromName} />
            {batch && (
              <DataRow label="Batch" value={`${batch.name} · ${batch.reference}`} />
            )}
            {allocation.status === "in_transit" && (
              <>
                <DataRow
                  label="Consignment ref"
                  value={allocation.dispatchReference ?? "—"}
                />
                <DataRow
                  label="Dispatched"
                  value={
                    allocation.quantityDispatched !== undefined
                      ? `${formatQuantity(allocation.quantityDispatched, allocation.unit)} · ${formatDate(allocation.dispatchedAt)}`
                      : "—"
                  }
                />
                <DataRow
                  label="Expected arrival"
                  value={formatDate(allocation.expectedArrivalDate)}
                />
              </>
            )}
            {allocation.status === "discrepancy" && (
              <>
                <DataRow
                  label="Consignment ref"
                  value={allocation.dispatchReference ?? "—"}
                />
                <DataRow
                  label="Dispatched"
                  value={formatQuantity(
                    allocation.quantityDispatched ?? allocation.quantityAllocated,
                    allocation.unit,
                  )}
                />
                <DataRow
                  label="Received"
                  value={`${formatQuantity(allocation.quantityReceived ?? 0, allocation.unit)} · ${formatDate(allocation.receivedAt)}`}
                />
                <DataRow
                  label="Unexplained"
                  value={
                    <span className="font-semibold text-[var(--brand-primary)]">
                      {allocation.quantityDiscrepancy} {allocation.unit}
                    </span>
                  }
                />
              </>
            )}
            {(allocation.status === "accepted" ||
              allocation.status === "awaiting_dispatch") && (
              <>
                <DataRow
                  label="Expected arrival"
                  value={formatDate(allocation.expectedArrivalDate)}
                />
              </>
            )}
            {allocation.notes && (
              <DataRow label="Notes" value={allocation.notes} />
            )}
          </dl>

          {/* Status-specific content */}

          {/* Proposed — accept / decline */}
          {allocation.status === "proposed" && (
            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-4">
              <Button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.respondToAllocation("custodian", {
                      allocationId: allocation._id,
                      accept: true,
                      note: "Space confirmed.",
                    }),
                  )
                }
              >
                Accept allocation
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.respondToAllocation("custodian", {
                      allocationId: allocation._id,
                      accept: false,
                      note: "No capacity for this quantity.",
                    }),
                  )
                }
              >
                Decline
              </Button>
            </div>
          )}

          {/* Accepted / awaiting dispatch */}
          {(allocation.status === "accepted" ||
            allocation.status === "awaiting_dispatch") && (
            <NoticeBanner tone="info" title={`Waiting on ${fromName}`}>
              Not dispatched yet. Nothing for you to do here until it moves.
            </NoticeBanner>
          )}

          {/* In transit — receipt form */}
          {allocation.status === "in_transit" && (
            <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Confirm receipt
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={`Quantity received (${allocation.unit})`}
                  hint={`Dispatch note says ${formatQuantity(dispatched, allocation.unit)}.`}
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={draft.received}
                    onChange={(e) =>
                      onDraftChange({ ...draft, received: e.target.value })
                    }
                  />
                </Field>
                <Field label="Note (optional)">
                  <Input
                    value={draft.note}
                    onChange={(e) =>
                      onDraftChange({ ...draft, note: e.target.value })
                    }
                    placeholder="Weighed on the pallet scale"
                  />
                </Field>
              </div>
              {shortfall > 0 && (
                <NoticeBanner
                  tone="warning"
                  title={`${shortfall} ${allocation.unit} short`}
                >
                  Confirming will move {draft.received} {allocation.unit} into
                  your holding and hold {shortfall} {allocation.unit} as
                  unexplained. CIRKA raises this with the manufacturer before
                  deciding whether it is a loss or a counting error.
                </NoticeBanner>
              )}
            </div>
          )}

          {/* Discrepancy */}
          {allocation.status === "discrepancy" && (
            <NoticeBanner tone="blocking" title="Discrepancy open with CIRKA">
              You received{" "}
              {formatQuantity(
                allocation.quantityReceived ?? 0,
                allocation.unit,
              )}{" "}
              against{" "}
              {formatQuantity(dispatched, allocation.unit)} dispatched.{" "}
              {allocation.quantityDiscrepancy} {allocation.unit} is held as
              unexplained until an admin closes it.
            </NoticeBanner>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-5">
          {allocation.status === "in_transit" ? (
            <Button
              disabled={pending || draft.received === ""}
              onClick={() =>
                run(() =>
                  store.confirmReceipt("custodian", {
                    allocationId: allocation._id,
                    quantityReceived: Number(draft.received),
                    note: draft.note || undefined,
                  }),
                )
              }
            >
              Confirm receipt
            </Button>
          ) : (
            <span className="text-sm text-[var(--ink-muted)]">
              {allocation.status === "proposed"
                ? "Respond above to accept or decline."
                : allocation.status === "discrepancy"
                  ? "Pending CIRKA admin resolution."
                  : "No action required right now."}
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
