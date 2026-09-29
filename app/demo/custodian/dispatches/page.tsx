"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Zap } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoCustodian } from "@/lib/i18n/messages/demo-custodian";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import type { OutgoingEntry } from "../../_components/custodian-dispatch-drawer";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  SectionHeading,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { useFormat } from "../../_components/use-format";
import { CustodianDispatchDrawer } from "../../_components/custodian-dispatch-drawer";

type GroupKey = "action" | "waiting" | "completed";

function groupOf(entry: OutgoingEntry): GroupKey {
  const { status } = entry.allocation;
  if (["accepted", "awaiting_dispatch"].includes(status)) return "action";
  if (["proposed", "in_transit"].includes(status)) return "waiting";
  return "completed";
}

/** Group names live in `demoCustodian.dispatches.groups`, keyed like this map. */
const GROUP_META: Record<GroupKey, { Icon: typeof Zap; iconBg: string }> = {
  action: {
    Icon: Zap,
    iconBg: "bg-[var(--brand-primary)]",
  },
  waiting: {
    Icon: Clock,
    iconBg: "bg-[var(--charcoal,#545454)]",
  },
  completed: {
    Icon: CheckCircle2,
    iconBg: "bg-[var(--brand-secondary)]",
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
  const fmt = useFormat();

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
          <p className="text-xs text-[var(--ink-muted)]">→ {makerName}</p>
        </div>

        {/* Right status */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
            {fmt.quantity(allocation.quantityAllocated, allocation.unit)}
          </p>
          <CirkaBadge status={allocation.status} />
        </div>
      </div>
    </button>
  );
}

export default function CustodianDispatchesPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("custodian");
  const { run, error, pending, clearError } = useAction();
  const { dispatches: t } = useMessages(demoCustodian);
  const { ui } = useMessages(demoCommon);

  const view = useMemo(
    () => getCustodianDashboard(store.db, scope),
    [store.db, scope],
  );

  const searchParams = useSearchParams();
  const linkedId = searchParams.get("id");
  const linkedEntry = view.outgoing.find((a) => a.allocation._id === linkedId);

  const [selectedId, setSelectedId] = useState<string | null>(() => linkedEntry?.allocation._id ?? null);
  const [drafts, setDrafts] = useState<
    Record<string, { quantity: string; reference: string }>
  >(() =>
    linkedEntry
      ? {
          [linkedEntry.allocation._id]: {
            quantity: String(linkedEntry.allocation.quantityAllocated),
            reference: "",
          },
        }
      : {},
  );

  const lastOpenedIdRef = useRef<string | null>(linkedEntry?.allocation._id ?? null);

  useEffect(() => {
    if (!linkedId) return;
    if (lastOpenedIdRef.current === linkedId) return;
    lastOpenedIdRef.current = linkedId;

    const entry = view.outgoing.find((a) => a.allocation._id === linkedId);
    if (entry) {
      setSelectedId(linkedId);
      setDrafts((current) =>
        current[linkedId]
          ? current
          : {
              ...current,
              [linkedId]: {
                quantity: String(entry.allocation.quantityAllocated),
                reference: "",
              },
            },
      );
    }
  }, [linkedId, view.outgoing]);

  const selectedEntry =
    view.outgoing.find((a) => a.allocation._id === selectedId) ?? null;

  function openDrawer(id: string) {
    clearError();
    const entry = view.outgoing.find((a) => a.allocation._id === id);
    if (entry) {
      setDrafts((current) =>
        current[id]
          ? current
          : {
              ...current,
              [id]: {
                quantity: String(entry.allocation.quantityAllocated),
                reference: "",
              },
            },
      );
    }
    setSelectedId(id);
    lastOpenedIdRef.current = id;
  }

  function closeDrawer() {
    setSelectedId(null);
  }

  const groups: GroupKey[] = ["action", "waiting", "completed"];
  const inTransitCount = view.outgoing.filter(
    (a) => a.allocation.status === "in_transit",
  ).length;

  return (
    <div className="space-y-8">
      <SectionHeading title={t.title} />

      {error && (
        <NoticeBanner tone="blocking" title={ui.stepRefused}>
          {error}
        </NoticeBanner>
      )}

      {view.outgoing.length === 0 ? (
        <EmptyState title={t.nothingAssigned} />
      ) : (
        <>
          <p className="text-sm tabular-nums text-[var(--ink-muted)]">
            {format(t.summary, { out: view.outgoing.length, transit: inTransitCount })}
          </p>

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
                      {t.groups[key]}
                    </h2>
                    <span className="ml-auto rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {items.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-5 text-sm text-[var(--ink-muted)]">
                      {t.none}
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
