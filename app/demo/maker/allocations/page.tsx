"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui";
import type { AllocationStatus } from "../../_mock/domain";
import { listMakerAllocations } from "../../_mock/selectors-maker";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, NoticeBanner, SectionHeading } from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { AllocationDetailDrawer } from "../../_components/allocation-detail-drawer";

type Bucket = "needs-you" | "in-progress" | "settled";

function bucketFor(status: AllocationStatus, hasFeedback: boolean): Bucket {
  if (status === "proposed" || status === "in_transit") {
    return "needs-you";
  }

  if ((status === "received" || status === "completed") && !hasFeedback) {
    return "needs-you";
  }

  if (status === "declined" || status === "cancelled" || status === "returned" || status === "completed") {
    return "settled";
  }

  return "in-progress";
}

const TABS = [
  { key: "all", label: "All" },
  { key: "needs-you", label: "Needs you" },
  { key: "in-progress", label: "In progress" },
  { key: "settled", label: "Settled" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BUCKET_PRIORITY: Record<Bucket, number> = {
  "needs-you": 0,
  "in-progress": 1,
  settled: 2,
};

export default function MakerAllocationsPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const { run, error, pending, clearError } = useAction();

  const allocations = listMakerAllocations(store.db, scope.orgId);
  const [tab, setTab] = useState<TabKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      allocations
        .map((entry) => ({ entry, bucket: bucketFor(entry.allocation.status, entry.hasFeedback) }))
        .sort((a, b) => BUCKET_PRIORITY[a.bucket] - BUCKET_PRIORITY[b.bucket]),
    [allocations],
  );

  const counts: Record<TabKey, number> = {
    all: grouped.length,
    "needs-you": grouped.filter((group) => group.bucket === "needs-you").length,
    "in-progress": grouped.filter((group) => group.bucket === "in-progress").length,
    settled: grouped.filter((group) => group.bucket === "settled").length,
  };

  const visible = tab === "all" ? grouped : grouped.filter((group) => group.bucket === tab);
  const openEntry = openId ? allocations.find((entry) => entry.allocation._id === openId) ?? null : null;

  return (
    <div className="space-y-6">
      <SectionHeading title="Material Allocations" />

      {error && !openEntry && (
        <NoticeBanner tone="blocking" title="That step was refused">
          {error}
        </NoticeBanner>
      )}

      {allocations.length === 0 ? (
        <EmptyState
          title="Nothing allocated yet"
          body="Allocations to you appear here."
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <OverviewStat
              label="Total Allocations"
              value={counts.all}
              active={tab === "all"}
              onClick={() => setTab("all")}
            />
            <OverviewStat
              label="Needs You"
              value={counts["needs-you"]}
              tone={counts["needs-you"] > 0 ? "warn" : undefined}
              active={tab === "needs-you"}
              onClick={() => setTab(tab === "needs-you" ? "all" : "needs-you")}
            />
            <OverviewStat
              label="In Progress"
              value={counts["in-progress"]}
              tone="progress"
              active={tab === "in-progress"}
              onClick={() => setTab(tab === "in-progress" ? "all" : "in-progress")}
            />
            <OverviewStat
              label="Settled"
              value={counts.settled}
              tone={counts.settled > 0 ? "positive" : undefined}
              active={tab === "settled"}
              onClick={() => setTab(tab === "settled" ? "all" : "settled")}
            />
          </dl>

          <div className="flex gap-6 border-b border-[var(--line)]">
            {TABS.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setTab(entry.key)}
                className={`relative pb-3 text-sm font-medium transition-colors duration-150 ease-[var(--ease-out)] ${
                  tab === entry.key
                    ? "text-[var(--ink)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {entry.label}
                <span className="ml-2 text-[11px] font-medium tabular-nums text-[var(--ink-muted)]">
                  {counts[entry.key]}
                </span>
                {tab === entry.key && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title="Nothing here"
              body="No allocations match this filter right now."
            />
          ) : (
            <div>
              {visible.map(({ entry, bucket }) => {
                const { allocation } = entry;
                const accent =
                  bucket === "needs-you"
                    ? "bg-[var(--brand-primary)]"
                    : bucket === "settled"
                      ? "bg-[var(--brand-secondary)]"
                      : "bg-[var(--line-strong)]";

                return (
                  <button
                    key={allocation._id}
                    type="button"
                    onClick={() => {
                      clearError();
                      setOpenId(allocation._id);
                    }}
                    className="group grid w-full grid-cols-[3px_1fr_auto_auto] items-center gap-4 border-t border-[var(--line)] py-4 text-left transition-colors duration-150 ease-[var(--ease-out)] first:border-t-0 hover:bg-[var(--surface)]"
                  >
                    <span className={`h-10 self-center rounded-full ${accent}`} />
                    <span className="min-w-0 space-y-0.5">
                      <span className="block truncate text-sm font-medium text-[var(--ink)]">
                        {entry.batchName}
                      </span>
                      <span className="block truncate text-[13px] text-[var(--ink-muted)]">
                        {allocation.reference} · {entry.fromName}
                      </span>
                    </span>
                    <CirkaBadge status={allocation.status} />
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums text-[var(--ink)]">
                        {formatQuantity(allocation.quantityAllocated, allocation.unit)}
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-[var(--ink-muted)] opacity-0 transition-all duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {openEntry && (
        <AllocationDetailDrawer
          entry={openEntry}
          store={store}
          run={run}
          pending={pending}
          error={error}
          clearError={clearError}
          onClose={() => {
            clearError();
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}

function OverviewStat({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "warn" | "progress" | "positive";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group space-y-2 py-4 px-4 text-left transition-all duration-150 ease-[var(--ease-out)] cursor-pointer rounded-xl border ${
        active
          ? "bg-[var(--surface)] border-[var(--brand-primary)]/40 shadow-xs ring-1 ring-[var(--brand-primary)]/20"
          : "border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface)]/60"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] group-hover:text-[var(--ink)]">
          {label}
        </dt>
        {active && (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
        )}
      </div>
      <dd
        className={`text-[34px] font-semibold leading-none tracking-[-0.05em] tabular-nums ${
          tone === "warn" && value > 0
            ? "text-[var(--brand-primary)]"
            : tone === "positive" && value > 0
              ? "text-[var(--brand-secondary)]"
              : tone === "progress" && value > 0
                ? "text-[var(--ink)]"
                : "text-[var(--ink)]"
        }`}
      >
        {value}
      </dd>
    </button>
  );
}
