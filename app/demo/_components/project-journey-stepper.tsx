"use client";

import { AlertTriangle, Check } from "lucide-react";
import { classNames } from "@/lib/utils";
import { MILESTONE_LABELS, MILESTONE_STAGES, type MilestoneStage } from "../_mock/domain";
import type { JourneyRow } from "../_mock/selectors-brand";
import { formatDate } from "./cirka-ui";

type StageState = "completed" | "overdue" | "current" | "upcoming";

interface Stage {
  stage: MilestoneStage;
  label: string;
  row?: JourneyRow;
  state: StageState;
}

function buildStages(journey: JourneyRow[]): Stage[] {
  const byStage = new Map(journey.map((row) => [row.stage, row]));
  let currentAssigned = false;

  return MILESTONE_STAGES.map((stage) => {
    const row = byStage.get(stage);
    const label = row?.label ?? MILESTONE_LABELS[stage];

    if (row?.status === "completed") {
      return { stage, label, row, state: "completed" as const };
    }
    if (row?.status === "overdue") {
      currentAssigned = true;
      return { stage, label, row, state: "overdue" as const };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { stage, label, row, state: "current" as const };
    }
    return { stage, label, row, state: "upcoming" as const };
  });
}

const DOT_CLASS: Record<StageState, string> = {
  completed: "border-transparent bg-[var(--brand-secondary)]",
  overdue: "border-transparent bg-[#B4531A]",
  current: "border-2 border-[var(--brand-primary)] bg-[var(--paper)]",
  upcoming: "border border-[var(--line-strong)] bg-[var(--surface)]",
};

const NODE_CLASS: Record<StageState, string> = {
  completed: "border-transparent bg-[var(--brand-secondary)] text-white",
  overdue: "border-[#B4531A] bg-[#FBE9DC] text-[#8A3D11]",
  current: "border-[var(--brand-primary)] bg-[var(--paper)] text-[var(--brand-primary)]",
  upcoming: "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]",
};

/** Compact dots-and-line summary for a list row: where the project's journey stands. */
function CompactStepper({ stages }: { stages: Stage[] }) {
  const overdue = stages.find((entry) => entry.state === "overdue");
  const current = stages.find((entry) => entry.state === "current");

  return (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center">
        {stages.map((entry, index) => (
          <div key={entry.stage} className="flex items-center">
            <span
              title={`${entry.label}${entry.row?.actualDate ? ` · ${formatDate(entry.row.actualDate)}` : ""}`}
              className={classNames("h-2.5 w-2.5 shrink-0 rounded-full", DOT_CLASS[entry.state])}
            />
            {index < stages.length - 1 && (
              <span
                className={classNames(
                  "h-px w-3",
                  entry.state === "completed" ? "bg-[var(--brand-secondary)]" : "bg-[var(--line)]",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="truncate text-xs text-[var(--ink-muted)]">
        {overdue ? (
          <span className="font-semibold text-[#8A3D11]">{overdue.label} overdue</span>
        ) : (
          (current ?? stages[stages.length - 1]).label
        )}
      </p>
    </div>
  );
}

/** Full node-by-node stepper for the project detail page. */
function FullStepper({ stages }: { stages: Stage[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[46rem] items-start">
        {stages.map((entry, index) => (
          <div key={entry.stage} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={classNames(
                  "h-px flex-1",
                  index === 0
                    ? "opacity-0"
                    : stages[index - 1].state === "completed"
                      ? "bg-[var(--brand-secondary)]"
                      : "bg-[var(--line)]",
                )}
              />
              <span
                className={classNames(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  NODE_CLASS[entry.state],
                )}
              >
                {entry.state === "completed" ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : entry.state === "overdue" ? (
                  <AlertTriangle size={14} strokeWidth={2.25} />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={classNames(
                  "h-px flex-1",
                  index === stages.length - 1
                    ? "opacity-0"
                    : entry.state === "completed"
                      ? "bg-[var(--brand-secondary)]"
                      : "bg-[var(--line)]",
                )}
              />
            </div>
            <p className="mt-2 max-w-[7rem] text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-[var(--ink-muted)]">
              {entry.label}
            </p>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              {entry.state === "completed"
                ? formatDate(entry.row?.actualDate)
                : entry.state === "overdue"
                  ? "Overdue"
                  : entry.row?.plannedDate
                    ? formatDate(entry.row.plannedDate)
                    : "Not started"}
            </p>
            {entry.row?.responsible && entry.state !== "upcoming" && (
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{entry.row.responsible}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectJourneyStepper({
  journey,
  compact = false,
}: {
  journey: JourneyRow[];
  compact?: boolean;
}) {
  const stages = buildStages(journey);
  return compact ? <CompactStepper stages={stages} /> : <FullStepper stages={stages} />;
}
