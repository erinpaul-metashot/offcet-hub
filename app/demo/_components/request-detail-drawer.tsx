"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import type { Match, ResourceRequest } from "../_mock/types";
import { categoryLabel, formatQuantity, isOverdue } from "../_mock/selectors-shared";
import { CirkaBadge, DataRow, FlowBar, formatDate } from "./cirka-ui";

export function RequestDetailDrawer({
  request,
  matches,
  onClose,
}: {
  request: ResourceRequest;
  matches: Match[];
  onClose: () => void;
}) {
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

  const activeMatches = matches.filter((match) => match.status !== "withdrawn");
  const overdue = isOverdue(request.neededBy) && !["fulfilled", "closed", "cancelled"].includes(request.status);

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
        aria-label={request.title}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Request · {request.reference}
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {request.title}
              </h2>
              <CirkaBadge status={request.status} />
            </div>
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
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Quantity
            </p>
            <FlowBar
              segments={[
                {
                  key: "matched",
                  label: "Matched",
                  value: request.quantityMatched,
                  colourClass: "bg-[var(--brand-secondary)]",
                },
              ]}
              max={request.quantityNeeded}
              unit={request.unit}
            />
            <p className="text-sm text-[var(--ink-muted)]">
              {formatQuantity(request.quantityMatched, request.unit)} matched of{" "}
              {formatQuantity(request.quantityNeeded, request.unit)} needed
            </p>
          </div>

          <dl>
            <DataRow label="Category" value={categoryLabel(request.materialCategory)} />
            {request.intendedProduct && (
              <DataRow label="Intended product" value={request.intendedProduct} />
            )}
            {request.productionLocationPreference && (
              <DataRow label="Production location" value={request.productionLocationPreference} />
            )}
            <DataRow
              label="Needed by"
              value={formatDate(request.neededBy)}
              hint={overdue ? "Overdue" : undefined}
            />
            <DataRow label="Submitted" value={formatDate(request.submittedAt)} />
          </dl>

          {request.materialDescription && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                What you need
              </p>
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                {request.materialDescription}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Matching
            </p>
            {activeMatches.length === 0 ? (
              <EmptyState
                title="No matches proposed yet"
                body="An admin proposes matches once a request enters review."
              />
            ) : (
              <div className="space-y-3">
                {activeMatches.map((match) => (
                  <div key={match._id} className="rounded-2xl bg-[var(--surface)] p-4">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {formatQuantity(match.quantityProposed, match.unit)} proposed
                      </p>
                      <CirkaBadge status={match.status} />
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                      {match.rationale}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
