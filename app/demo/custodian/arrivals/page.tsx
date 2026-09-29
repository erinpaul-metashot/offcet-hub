"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, Zap } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoCustodian } from "@/lib/i18n/messages/demo-custodian";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import type { ExpectedArrival } from "../../_mock/selectors-custodian";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, SectionHeading, NoticeBanner } from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { useFormat } from "../../_components/use-format";
import { CustodianArrivalDrawer } from "../../_components/custodian-arrival-drawer";

/* ─────────────────────────────────────────────────────────────────────
   Group logic: maps each arrival's status to one of three action groups
   ───────────────────────────────────────────────────────────────────── */
type GroupKey = "action" | "waiting" | "issue";

function groupOf(entry: ExpectedArrival): GroupKey {
  const { allocation, late } = entry;
  if (entry.openIssue) return "issue";
  if (allocation.status === "discrepancy") return "issue";
  if (allocation.status === "in_transit" && late) return "action";
  if (allocation.status === "proposed") return "action";
  return "waiting";
}

/** Group names live in `demoCustodian.arrivals.groups`, keyed like this map. */
const GROUP_META: Record<GroupKey, { Icon: typeof Zap; iconBg: string }> = {
  action: {
    Icon: Zap,
    iconBg: "bg-[var(--brand-primary)]",
  },
  waiting: {
    Icon: Clock,
    iconBg: "bg-[var(--charcoal,#545454)]",
  },
  issue: {
    Icon: AlertTriangle,
    iconBg: "bg-[#C8A96B]",
  },
};

/* ─────────────────────────────────────────────────────────────────────
   Compact arrival row: the whole card opens the drawer
   ───────────────────────────────────────────────────────────────────── */
function ArrivalRow({
  entry,
  selected,
  onClick,
}: {
  entry: ExpectedArrival;
  selected: boolean;
  onClick: () => void;
}) {
  const { allocation, batch, fromName, late, openIssue } = entry;
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
        {/* Left: ref + material + org */}
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {allocation.reference}
          </p>
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {batch?.name ?? allocation.reference}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">{fromName}</p>
          {openIssue && (
            <p className="text-xs font-semibold text-[#8A1F1F]">{openIssue.title}</p>
          )}
        </div>

        {/* Right: qty + badges */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
            {fmt.quantity(allocation.quantityAllocated, allocation.unit)}
          </p>
          <div className="flex flex-wrap justify-end gap-1">
            <CirkaBadge status={allocation.status} />
            {late && <CirkaBadge status="overdue" />}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────────────── */
export default function CustodianArrivalsPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("custodian");
  const { run, error, pending, clearError } = useAction();
  const { arrivals: t } = useMessages(demoCustodian);
  const { ui } = useMessages(demoCommon);
  const fmt = useFormat();

  const view = useMemo(
    () => getCustodianDashboard(store.db, scope),
    [store.db, scope],
  );

  /* A dashboard tile with exactly one arrival links here with ?id=, opening it straight away. */
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const linked = view.arrivals.find((a) => a.allocation._id === idParam);

  const [selectedId, setSelectedId] = useState<string | null>(() => linked?.allocation._id ?? null);
  const [drafts, setDrafts] = useState<
    Record<string, { received: string; note: string }>
  >(() =>
    linked
      ? {
          [linked.allocation._id]: {
            received: String(linked.allocation.quantityDispatched ?? linked.allocation.quantityAllocated),
            note: "",
          },
        }
      : {},
  );

  const lastOpenedIdRef = useRef<string | null>(linked?.allocation._id ?? null);

  const selectedEntry = view.arrivals.find(
    (a) => a.allocation._id === selectedId,
  ) ?? null;

  function openDrawer(id: string) {
    clearError();
    const entry = view.arrivals.find((a) => a.allocation._id === id);
    if (!entry) return;
    const dispatched =
      entry.allocation.quantityDispatched ?? entry.allocation.quantityAllocated;
    // Seed the draft with the dispatch amount if not already set
    setDrafts((prev) =>
      prev[id]
        ? prev
        : {
            ...prev,
            [id]: { received: String(dispatched), note: "" },
          },
    );
    setSelectedId(id);
    lastOpenedIdRef.current = id;
  }

  useEffect(() => {
    if (!idParam) return;
    if (lastOpenedIdRef.current === idParam) return;
    lastOpenedIdRef.current = idParam;

    const entry = view.arrivals.find((a) => a.allocation._id === idParam);
    if (entry) {
      const dispatched =
        entry.allocation.quantityDispatched ?? entry.allocation.quantityAllocated;
      setDrafts((prev) =>
        prev[idParam]
          ? prev
          : {
              ...prev,
              [idParam]: { received: String(dispatched), note: "" },
            },
      );
      setSelectedId(idParam);
    }
  }, [idParam, view.arrivals]);

  function closeDrawer() {
    setSelectedId(null);
  }

  const groups: GroupKey[] = ["action", "waiting", "issue"];

  const totalKg = view.arrivals.reduce(
    (sum, a) => sum + a.allocation.quantityAllocated,
    0,
  );

  return (
    <div className="space-y-8">
      <SectionHeading title={t.title} />

      {error && (
        <NoticeBanner tone="blocking" title={ui.stepRefused}>
          {error}
        </NoticeBanner>
      )}

      {view.arrivals.length === 0 ? (
        <EmptyState title={t.nothingExpected} />
      ) : (
        <>
          <p className="text-sm tabular-nums text-[var(--ink-muted)]">
            {format(t.summary, { count: view.arrivals.length, quantity: fmt.quantity(totalKg, "kg") })}
          </p>

          {/* ── Action groups ── */}
          <div className="space-y-8">
            {groups.map((key) => {
              const meta = GROUP_META[key];
              const Icon = meta.Icon;
              const items = view.arrivals.filter(
                (a) => groupOf(a) === key,
              );

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
                        <ArrivalRow
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

      {/* ── Right drawer ── */}
      {selectedEntry && (
        <CustodianArrivalDrawer
          entry={selectedEntry}
          draft={
            drafts[selectedEntry.allocation._id] ?? {
              received: "",
              note: "",
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
