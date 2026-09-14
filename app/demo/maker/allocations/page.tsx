"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

  const searchParams = useSearchParams();

  const allocations = listMakerAllocations(store.db, scope.orgId);
  const [tab, setTab] = useState<TabKey>(() => {
    const requested = searchParams.get("tab") ?? "";
    return TABS.find((entry) => entry.key === requested)?.key ?? "all";
  });
  /* A dashboard card with exactly one allocation links here with ?id=, opening it straight away. */
  const [openId, setOpenId] = useState<string | null>(() => {
    const requested = searchParams.get("id");
    return allocations.some((entry) => entry.allocation._id === requested) ? requested : null;
  });

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
      <SectionHeading title="Allocations" />

      {error && !openEntry && (
        <NoticeBanner tone="blocking" title="That step was refused">
          {error}
        </NoticeBanner>
      )}

      {allocations.length === 0 ? (
        <EmptyState title="Nothing allocated yet" />
      ) : (
        <>
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
                <span
                  className={`ml-2 text-[11px] tabular-nums ${
                    entry.key === "needs-you" && counts[entry.key] > 0
                      ? "font-bold text-[var(--brand-primary)]"
                      : "font-medium text-[var(--ink-muted)]"
                  }`}
                >
                  {counts[entry.key]}
                </span>
                {tab === entry.key && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState title="Nothing here" />
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

