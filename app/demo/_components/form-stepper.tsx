"use client";

import { Check } from "lucide-react";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { classNames } from "@/lib/utils";

export interface FormStep {
  id: string;
  label: string;
}

type NodeState = "visited" | "current" | "upcoming";

/* Same node language as FullStepper in project-journey-stepper.tsx. */
const NODE_CLASS: Record<NodeState, string> = {
  visited: "border-transparent bg-[var(--brand-secondary)] text-[var(--paper)]",
  current: "border-[var(--brand-primary)] bg-[var(--paper)] text-[var(--brand-primary)]",
  upcoming: "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]",
};

const LABEL_CLASS: Record<NodeState, string> = {
  visited: "text-[var(--ink)]",
  current: "text-[var(--brand-primary)]",
  upcoming: "text-[var(--ink-muted)]",
};

function connectorClass(reached: boolean, hidden: boolean): string {
  return classNames(
    "h-px flex-1",
    hidden ? "opacity-0" : reached ? "bg-[var(--brand-secondary)]" : "bg-[var(--line)]",
  );
}

/**
 * Progress through a multi-part form. Steps the user has already reached are
 * buttons that jump back to them; steps ahead of them are inert.
 */
export function FormStepper({
  steps,
  current,
  visited,
  onJump,
}: {
  steps: FormStep[];
  current: number;
  visited: Set<number> | number[];
  onJump: (index: number) => void;
}) {
  const { stepper } = useMessages(demoCommon);
  const reached = visited instanceof Set ? visited : new Set(visited);
  const stateOf = (index: number): NodeState =>
    index === current ? "current" : reached.has(index) ? "visited" : "upcoming";

  return (
    <nav aria-label={format(stepper.stepOf, { current: current + 1, total: steps.length })}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const state = stateOf(index);
          const jumpable = state === "visited";
          const node = (
            <>
              <span className="flex w-full items-center">
                <span className={connectorClass(reached.has(index), index === 0)} />
                <span
                  className={classNames(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums",
                    "transition-transform duration-200 ease-[var(--ease-out)] motion-reduce:transition-none",
                    jumpable && "group-hover:scale-110 group-active:scale-95",
                    NODE_CLASS[state],
                  )}
                >
                  {state === "visited" ? <Check size={15} strokeWidth={2.5} /> : index + 1}
                </span>
                <span
                  className={connectorClass(reached.has(index + 1), index === steps.length - 1)}
                />
              </span>
              <span
                className={classNames(
                  "mt-2 max-w-[7rem] text-[10px] font-bold uppercase leading-tight tracking-[0.1em]",
                  LABEL_CLASS[state],
                )}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center text-center">
              {jumpable ? (
                <button
                  type="button"
                  onClick={() => onJump(index)}
                  aria-label={format(stepper.goTo, { n: index + 1, label: step.label })}
                  className="group flex w-full flex-col items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                >
                  {node}
                </button>
              ) : (
                <div
                  className="flex w-full flex-col items-center"
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {node}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
