"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { SUITABILITY_LABELS, SUITABILITY_RATINGS, type SuitabilityRating } from "../_mock/domain";
import type { MakerAllocation } from "../_mock/selectors-maker";
import { formatQuantity } from "../_mock/selectors-shared";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { CirkaBadge, DataRow, NoticeBanner, formatDate } from "./cirka-ui";

interface FeedbackDraft {
  receivedAsDescribed: boolean;
  suitability: SuitabilityRating;
  qualityRating: string;
  damageNote: string;
  recommendedApplications: string;
  limitations: string;
  notes: string;
}

const emptyFeedback: FeedbackDraft = {
  receivedAsDescribed: true,
  suitability: "suitable",
  qualityRating: "4",
  damageNote: "",
  recommendedApplications: "",
  limitations: "",
  notes: "",
};

export function AllocationDetailDrawer({
  entry,
  store,
  run,
  pending,
  error,
  clearError,
  onClose,
}: {
  entry: MakerAllocation;
  store: ReturnType<typeof useDemoStore>;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  error: string | null;
  clearError: () => void;
  onClose: () => void;
}) {
  const { allocation } = entry;
  const dispatched = allocation.quantityDispatched ?? allocation.quantityAllocated;
  const [received, setReceived] = useState(String(dispatched));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackDraft>(emptyFeedback);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex justify-end bg-[var(--ink)]/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--paper)]"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={allocation.reference}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Allocation · {allocation.reference}
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {entry.batchName}
              </h2>
              <CirkaBadge status={allocation.status} />
            </div>
            <p className="text-sm text-[var(--ink-muted)]">
              {entry.batchReference} · from {entry.fromName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title="That step was refused">
              {error}
            </NoticeBanner>
          )}

          <div className="flex items-baseline justify-between gap-4 rounded-2xl bg-[var(--surface)] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Quantity allocated
            </p>
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-[var(--ink)]">
              {formatQuantity(allocation.quantityAllocated, allocation.unit)}
            </p>
          </div>

          <dl>
            <DataRow label="Expected arrival" value={formatDate(allocation.expectedArrivalDate)} />
            <DataRow label="Received" value={formatDate(allocation.receivedAt)} />
            <DataRow
              label="Suitability feedback"
              value={entry.hasFeedback ? "Recorded" : "Not yet recorded"}
            />
            <DataRow
              label="Production"
              value={
                entry.production
                  ? `${entry.production.reference} · ${entry.production.productName}`
                  : "No production batch yet"
              }
            />
            {allocation.notes && <DataRow label="Note from the custodian" value={allocation.notes} />}
          </dl>

          {allocation.status === "proposed" && (
            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              <Button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.respondToAllocation("maker", {
                      allocationId: allocation._id,
                      accept: true,
                      note: "We can take this into the next run.",
                    }),
                  )
                }
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.respondToAllocation("maker", {
                      allocationId: allocation._id,
                      accept: false,
                      note: "Not the right weight for our current programme.",
                    }),
                  )
                }
              >
                Decline
              </Button>
            </div>
          )}

          {allocation.status === "in_transit" && (
            <div className="space-y-4 border-t border-[var(--line)] pt-5">
              <Field
                label={`Quantity received (${allocation.unit})`}
                hint={`Hand-over note says ${formatQuantity(dispatched, allocation.unit)}.`}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                />
              </Field>
              <Button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.confirmReceipt("maker", {
                      allocationId: allocation._id,
                      quantityReceived: Number(received),
                    }),
                  )
                }
              >
                Confirm receipt
              </Button>
            </div>
          )}

          {["received", "completed"].includes(allocation.status) && (
            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              {!entry.hasFeedback && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearError();
                    setFeedbackOpen((open) => !open);
                    setFeedback(emptyFeedback);
                  }}
                >
                  {feedbackOpen ? "Close" : "Assess the material"}
                </Button>
              )}
              {!entry.production && (
                <Button as={Link} href="/demo/maker/production/new">
                  Create production batch
                </Button>
              )}
              {entry.production && (
                <Button as={Link} href={`/demo/maker/production/${entry.production._id}`}>
                  Open production batch
                </Button>
              )}
            </div>
          )}

          {feedbackOpen && (
            <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Material suitability
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Received as described">
                  <Select
                    value={feedback.receivedAsDescribed ? "yes" : "no"}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        receivedAsDescribed: event.target.value === "yes",
                      }))
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <Field label="Suitability">
                  <Select
                    value={feedback.suitability}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        suitability: event.target.value as SuitabilityRating,
                      }))
                    }
                  >
                    {SUITABILITY_RATINGS.map((value) => (
                      <option key={value} value={value}>
                        {SUITABILITY_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Quality rating (1-5)">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={feedback.qualityRating}
                  onChange={(event) =>
                    setFeedback((current) => ({ ...current, qualityRating: event.target.value }))
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Damage or contamination">
                  <Input
                    value={feedback.damageNote}
                    onChange={(event) =>
                      setFeedback((current) => ({ ...current, damageNote: event.target.value }))
                    }
                    placeholder="Two rolls had crushed edges"
                  />
                </Field>
                <Field label="Recommended applications">
                  <Input
                    value={feedback.recommendedApplications}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        recommendedApplications: event.target.value,
                      }))
                    }
                    placeholder="Panelled bags, pouches"
                  />
                </Field>
              </div>

              <Field label="Limitations">
                <Input
                  value={feedback.limitations}
                  onChange={(event) =>
                    setFeedback((current) => ({ ...current, limitations: event.target.value }))
                  }
                  placeholder="Piece size rules out single-panel garments"
                />
              </Field>

              <Field label="Notes">
                <Textarea
                  value={feedback.notes}
                  onChange={(event) =>
                    setFeedback((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </Field>

              <Button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await store.submitSuitabilityFeedback("maker", {
                      allocationId: allocation._id,
                      receivedAsDescribed: feedback.receivedAsDescribed,
                      suitability: feedback.suitability,
                      qualityRating: Number(feedback.qualityRating) || undefined,
                      damageNote: feedback.damageNote || undefined,
                      recommendedApplications: feedback.recommendedApplications || undefined,
                      limitations: feedback.limitations || undefined,
                      notes: feedback.notes || undefined,
                    });
                    setFeedbackOpen(false);
                  })
                }
              >
                Submit assessment
              </Button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-[var(--line)] px-6 py-5">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
