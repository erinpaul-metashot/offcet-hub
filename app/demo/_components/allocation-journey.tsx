"use client";

/** The six-stage allocation lifecycle, rendered as a stepper — detail view only. */

import { AlertTriangle, Check, X } from "lucide-react";
import { classNames } from "@/lib/utils";
import type { Allocation } from "../_mock/types";

type StepState = "done" | "current" | "warn" | "aborted" | "pending";

interface JourneyStep {
  key: string;
  label: string;
  state: StepState;
}

const STAGES: { key: string; label: string }[] = [
  { key: "proposed", label: "Proposed" },
  { key: "accepted", label: "Accepted" },
  { key: "awaiting_dispatch", label: "Awaiting dispatch" },
  { key: "in_transit", label: "In transit" },
  { key: "received", label: "Received" },
  { key: "completed", label: "Completed" },
];

/** How far the allocation has actually travelled, independent of its current status. */
function progressIndex(allocation: Allocation): number {
  if (allocation.receivedAt) return 4;
  if (allocation.dispatchedAt) return 3;
  if (allocation.dispatchReadyAt) return 2;
  if (allocation.respondedAt && allocation.status !== "declined") return 1;
  return 0;
}

export function buildJourneySteps(allocation: Allocation): JourneyStep[] {
  const reached = progressIndex(allocation);

  if (allocation.status === "declined") {
    return STAGES.map((stage, index) => {
      if (index === 0) return { ...stage, state: "done" };
      if (index === 1) return { key: stage.key, label: "Declined", state: "aborted" };
      return { ...stage, state: "pending" };
    });
  }

  if (allocation.status === "cancelled") {
    const abortedAt = Math.min(reached + 1, STAGES.length - 1);
    return STAGES.map((stage, index) => {
      if (index === abortedAt) return { key: stage.key, label: "Cancelled", state: "aborted" };
      if (index < abortedAt) return { ...stage, state: "done" };
      return { ...stage, state: "pending" };
    });
  }

  if (allocation.status === "returned") {
    return STAGES.map((stage, index) => {
      if (index <= 4) return { ...stage, state: "done" };
      return { key: stage.key, label: "Returned", state: "aborted" };
    });
  }

  return STAGES.map((stage, index) => {
    if (allocation.status === "discrepancy" && index === 4) {
      return { ...stage, state: "warn" };
    }
    if (index < reached) return { ...stage, state: "done" };
    if (index === reached) {
      return { ...stage, state: allocation.status === "completed" ? "done" : "current" };
    }
    return { ...stage, state: "pending" };
  });
}

const NODE_STYLES: Record<StepState, string> = {
  done: "border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-white",
  current: "border-dashed border-[var(--brand-primary)] bg-[var(--paper)] text-[var(--brand-primary)]",
  warn: "border-[#B4531A] bg-[#FBE9DC] text-[#8A3D11]",
  aborted: "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-muted)]",
  pending: "border-[var(--line)] bg-[var(--paper)] text-[var(--line-strong)]",
};

const LABEL_STYLES: Record<StepState, string> = {
  done: "text-[var(--ink)]",
  current: "text-[var(--brand-primary)]",
  warn: "text-[#8A3D11]",
  aborted: "text-[var(--ink-muted)]",
  pending: "text-[var(--ink-muted)]",
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <Check size={16} strokeWidth={2.5} />;
  if (state === "warn") return <AlertTriangle size={15} strokeWidth={2.25} />;
  if (state === "aborted") return <X size={15} strokeWidth={2.25} />;
  return <span className="h-2 w-2 rounded-full bg-current" />;
}

export function AllocationJourney({ allocation }: { allocation: Allocation }) {
  const steps = buildJourneySteps(allocation);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {steps.map((step, index) => (
        <li key={step.key} className="flex flex-1 items-stretch gap-3 sm:flex-col sm:items-center sm:gap-3">
          <div className="flex flex-col items-center sm:w-full sm:flex-row">
            <span
              className={classNames(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                NODE_STYLES[step.state],
              )}
            >
              <StepIcon state={step.state} />
            </span>
            {index < steps.length - 1 && (
              <span
                className={classNames(
                  "sm:mt-0 sm:ml-2 sm:h-0.5 sm:flex-1",
                  "mt-2 mb-2 ml-[15px] h-6 w-0.5 sm:mb-0 sm:mr-2 sm:w-auto",
                  step.state === "done" ? "bg-[var(--brand-secondary)]" : "bg-[var(--line)]",
                )}
              />
            )}
          </div>
          <p
            className={classNames(
              "pb-2 text-[11px] font-bold uppercase tracking-[0.14em] sm:pb-0 sm:text-center",
              LABEL_STYLES[step.state],
            )}
          >
            {step.label}
          </p>
        </li>
      ))}
    </ol>
  );
}
