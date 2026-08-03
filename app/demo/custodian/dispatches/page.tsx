"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Zap } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import type { OutgoingEntry } from "../../_components/custodian-dispatch-drawer";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  SectionHeading,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { CustodianDispatchDrawer } from "../../_components/custodian-dispatch-drawer";

type GroupKey = "action" | "waiting" | "completed";

function groupOf(entry: OutgoingEntry): GroupKey {
  const { status } = entry.allocation;
  if (["accepted", "awaiting_dispatch"].includes(status)) return "action";
  if (["proposed", "in_transit"].includes(status)) return "waiting";
  return "completed";
}

const GROUP_META: Record<
  GroupKey,
  { label: string; Icon: typeof Zap; iconBg: string; emptyNote: string }
> = {
  action: {
    label: "Needs your action",
    Icon: Zap,
    iconBg: "bg-[var(--brand-primary)]",
    emptyNote: "No dispatches currently require your action.",
  },
  waiting: {
    label: "Waiting on maker",
    Icon: Clock,
    iconBg: "bg-[var(--charcoal,#545454)]",
    emptyNote: "No dispatches are currently pending with a maker.",
  },
  completed: {
    label: "Completed hand-overs",
    Icon: CheckCircle2,
    iconBg: "bg-[var(--brand-secondary)]",
    emptyNote: "No completed hand-overs yet.",
  },
};

function DispatchRow({
  entry,
  selected,
  onClick,
}: {
  entry: OutgoingEntry;
  selected: boolean;
  onClick: () => void;
}) {
  const { allocation, batch, makerName } = entry;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-2xl border bg-[var(--paper)] px-5 py-4 text-left",
        "transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)]",
        selected
          ? "border-2 border-[var(--brand-primary)] shadow-[0_0_0_3px_rgba(255,92,0,.10)]"
          : "border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left info */}
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {allocation.reference}
          </p>
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {batch?.name ?? allocation.reference}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">→ Destined for {makerName}</p>
        </div>

        {/* Right status */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
            {formatQuantity(allocation.quantityAllocated, allocation.unit)}
          </p>
          <CirkaBadge status={allocation.status} />
        </div>
      </div>

      <div
        className={[
          "mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]",
          "transition-colors duration-150",
          selected
            ? "text-[var(--brand-primary)]"
            : "text-[var(--ink-muted)] group-hover:text-[var(--brand-primary)]",
        ].join(" ")}
      >
        Open hand-over details →
      </div>
    </button>
  );
}

export default function CustodianDispatchesPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("custodian");
  const { run, error, pending, clearError } = useAction();

  const view = getCustodianDashboard(store.db, scope);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { quantity: string; reference: string }>
  >({});

  const selectedEntry =
    view.outgoing.find((a) => a.allocation._id === selectedId) ?? null;

  function openDrawer(id: string) {
    clearError();
    const entry = view.outgoing.find((a) => a.allocation._id === id);
    if (entry) {
      setDrafts((current) => ({
        ...current,
        [id]: current[id] ?? {
          quantity: String(entry.allocation.quantityAllocated),
          reference: "",
        },
      }));
    }
    setSelectedId(id);
  }

  function closeDrawer() {
    setSelectedId(null);
  }

  const groups: GroupKey[] = ["action", "waiting", "completed"];
  const actionCount = view.outgoing.filter((a) => groupOf(a) === "action").length;
  const inTransitCount = view.outgoing.filter(
    (a) => a.allocation.status === "in_transit",
  ).length;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Out to makers"
        title="Sub-allocations from this node"
        description="Once a maker accepts, record the hand-over. The quantity leaves your holding and only reaches the maker's pot when they confirm receipt."
      />

      {error && (
        <NoticeBanner tone="blocking" title="That step was refused">
          {error}
        </NoticeBanner>
      )}

      {view.outgoing.length === 0 ? (
        <EmptyState
          title="Nothing allocated to makers"
          body="Allocate part of a holding from the Stock screen to get started."
        />
      ) : (
        <>
          {/* Metrics summary bar */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--line)] sm:grid-cols-3">
            <div className="bg-[var(--paper)] px-5 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                {view.outgoing.length}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--ink-muted)]">
                Total outgoing
              </p>
            </div>
            <div className="bg-[var(--paper)] px-5 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--brand-primary)]">
                {actionCount}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--ink-muted)]">
                Needs your action
              </p>
            </div>
            <div className="bg-[var(--paper)] px-5 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                {inTransitCount}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--ink-muted)]">
                In transit to maker
              </p>
            </div>
          </div>

          {/* Group sections */}
          <div className="space-y-8">
            {groups.map((key) => {
              const meta = GROUP_META[key];
              const Icon = meta.Icon;
              const items = view.outgoing.filter((a) => groupOf(a) === key);

              return (
                <section key={key} aria-labelledby={`group-${key}`}>
                  {/* Group heading */}
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
                        meta.iconBg,
                      ].join(" ")}
                    >
                      <Icon size={14} strokeWidth={2.25} />
                    </span>
                    <h2
                      id={`group-${key}`}
                      className="text-base font-semibold text-[var(--ink)]"
                    >
                      {meta.label}
                    </h2>
                    <span className="ml-auto rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {items.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-5 text-sm text-[var(--ink-muted)]">
                      {meta.emptyNote}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((entry) => (
                        <DispatchRow
                          key={entry.allocation._id}
                          entry={entry}
                          selected={selectedId === entry.allocation._id}
                          onClick={() => openDrawer(entry.allocation._id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* Drawer */}
      {selectedEntry && (
        <CustodianDispatchDrawer
          entry={selectedEntry}
          draft={
            drafts[selectedEntry.allocation._id] ?? {
              quantity: String(selectedEntry.allocation.quantityAllocated),
              reference: "",
            }
          }
          onDraftChange={(next) =>
            setDrafts((prev) => ({
              ...prev,
              [selectedEntry.allocation._id]: next,
            }))
          }
          store={store}
          run={run}
          pending={pending}
          error={error}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
