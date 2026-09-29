"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoCustodian } from "@/lib/i18n/messages/demo-custodian";
import { ARRIVAL_ISSUES, type ArrivalIssue, type Unit } from "../_mock/domain";
import type { ExpectedArrival } from "../_mock/selectors-custodian";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { AllocationJourney } from "./allocation-journey";
import { CirkaBadge, DataRow, NoticeBanner } from "./cirka-ui";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

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
  unit: Unit;
}) {
  const { arrivalDrawer: t } = useMessages(demoCustodian);
  const labels = useLabels();
  const fmt = useFormat();
  const unitLabel = labels.UNIT_LABELS[unit];
  const hasReceived = received !== null && !isNaN(received);
  const delta = hasReceived ? Math.round((dispatched - received!) * 1000) / 1000 : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Dispatch note side */}
        <div className="rounded-xl bg-[var(--charcoal,#545454)] px-4 py-3 text-center text-white">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">
            {t.dispatchNote}
          </p>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight">
            {fmt.number(dispatched)}
            <span className="ml-1 text-sm font-semibold">{unitLabel}</span>
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
            {t.weighIn}
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
            {hasReceived ? fmt.number(received!) : "-"}
            <span className="ml-1 text-sm font-semibold">{unitLabel}</span>
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
            ? format(t.short, { quantity: fmt.quantity(delta, unit) })
            : delta < 0
              ? format(t.over, { quantity: fmt.quantity(Math.abs(delta), unit) })
              : t.matches}
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
  const { allocation, batch, fromName, late, openIssue } = entry;
  const dispatched = allocation.quantityDispatched ?? allocation.quantityAllocated;
  const canReportIssue =
    !openIssue && ["in_transit", "received", "discrepancy"].includes(allocation.status);
  const [issueForm, setIssueForm] = useState<{ issue: ArrivalIssue; note: string } | null>(null);
  const receivedNum = draft.received !== "" ? Number(draft.received) : null;
  const { arrivalDrawer: t } = useMessages(demoCustodian);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();
  const respond = (accept: boolean) =>
    run(() =>
      store.respondToAllocation("custodian", {
        allocationId: allocation._id,
        accept,
        note: accept ? t.acceptNote : t.declineNote,
      }),
    );

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
            aria-label={t.closeDrawer}
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title={ui.stepRefused}>
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
              label={t.allocated}
              value={fmt.quantity(allocation.quantityAllocated, allocation.unit)}
            />
            <DataRow label={t.from} value={fromName} />
            {batch && (
              <DataRow label={t.batch} value={`${batch.name} · ${batch.reference}`} />
            )}
            {allocation.status === "in_transit" && (
              <>
                <DataRow
                  label={t.consignmentRef}
                  value={allocation.dispatchReference ?? "-"}
                />
                <DataRow
                  label={t.dispatched}
                  value={
                    allocation.quantityDispatched !== undefined
                      ? `${fmt.quantity(allocation.quantityDispatched, allocation.unit)} · ${fmt.date(allocation.dispatchedAt)}`
                      : "-"
                  }
                />
                <DataRow
                  label={t.expectedArrival}
                  value={fmt.date(allocation.expectedArrivalDate)}
                />
              </>
            )}
            {allocation.status === "discrepancy" && (
              <>
                <DataRow
                  label={t.consignmentRef}
                  value={allocation.dispatchReference ?? "-"}
                />
                <DataRow
                  label={t.dispatched}
                  value={fmt.quantity(
                    allocation.quantityDispatched ?? allocation.quantityAllocated,
                    allocation.unit,
                  )}
                />
                <DataRow
                  label={t.received}
                  value={`${fmt.quantity(allocation.quantityReceived ?? 0, allocation.unit)} · ${fmt.date(allocation.receivedAt)}`}
                />
                <DataRow
                  label={t.unexplained}
                  value={
                    <span className="font-semibold text-[var(--brand-primary)]">
                      {fmt.quantity(allocation.quantityDiscrepancy ?? 0, allocation.unit)}
                    </span>
                  }
                />
              </>
            )}
            {(allocation.status === "accepted" ||
              allocation.status === "awaiting_dispatch") && (
              <>
                <DataRow
                  label={t.expectedArrival}
                  value={fmt.date(allocation.expectedArrivalDate)}
                />
              </>
            )}
            {allocation.notes && (
              <DataRow label={t.notes} value={allocation.notes} />
            )}
          </dl>

          {/* In transit: receipt form */}
          {allocation.status === "in_transit" && (
            <div className="rounded-2xl bg-[var(--surface)] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={format(t.quantityReceived, { unit: labels.UNIT_LABELS[allocation.unit] })}>
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
                <Field label={t.noteOptional}>
                  <Input
                    value={draft.note}
                    onChange={(e) =>
                      onDraftChange({ ...draft, note: e.target.value })
                    }
                    placeholder={t.notePlaceholder}
                  />
                </Field>
              </div>
            </div>
          )}

          {allocation.status === "discrepancy" && (
            <NoticeBanner tone="blocking" title={t.openWithCirka} />
          )}

          {/* Reported issue: open with CIRKA, no quantity moved */}
          {openIssue && (
            <NoticeBanner
              tone={openIssue.severity === "blocking" ? "blocking" : "warning"}
              title={openIssue.title}
            >
              <p>{allocation.arrivalIssueNote}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em]">
                {format(t.reported, { date: fmt.date(allocation.arrivalIssueReportedAt) })}
              </p>
            </NoticeBanner>
          )}

          {/* Report a problem the weight does not show */}
          {canReportIssue &&
            (issueForm === null ? (
              <button
                type="button"
                onClick={() => setIssueForm({ issue: "damaged", note: "" })}
                className="w-full rounded-2xl border border-dashed border-[var(--line-strong)] px-5 py-3 text-left text-sm font-semibold text-[var(--ink-muted)] transition-colors duration-150 ease-[var(--ease-out)] hover:border-[var(--brand-primary)] hover:text-[var(--ink)]"
              >
                {t.reportIssue}
              </button>
            ) : (
              <div className="space-y-4 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {t.reportIssue}
                </p>
                <Field label={t.issue}>
                  <Select
                    value={issueForm.issue}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, issue: e.target.value as ArrivalIssue })
                    }
                  >
                    {ARRIVAL_ISSUES.map((issue) => (
                      <option key={issue} value={issue}>
                        {labels.ARRIVAL_ISSUE_LABELS[issue]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.details}>
                  <Input
                    value={issueForm.note}
                    onChange={(e) => setIssueForm({ ...issueForm, note: e.target.value })}
                    placeholder={t.detailsPlaceholder}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    disabled={pending || issueForm.note.trim() === ""}
                    onClick={async () => {
                      const ok = await run(() =>
                        store.reportArrivalIssue("custodian", {
                          allocationId: allocation._id,
                          issue: issueForm.issue,
                          note: issueForm.note,
                        }),
                      );
                      if (ok) setIssueForm(null);
                    }}
                  >
                    {t.submitIssue}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setIssueForm(null)}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            ))}
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex shrink-0 items-center gap-3 border-t border-[var(--line)] px-6 py-5">
          {allocation.status === "in_transit" && (
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
              {t.confirmReceipt}
            </Button>
          )}
          {allocation.status === "proposed" && (
            <>
              <Button disabled={pending} onClick={() => respond(true)}>
                {t.accept}
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => respond(false)}>
                {t.decline}
              </Button>
            </>
          )}
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
