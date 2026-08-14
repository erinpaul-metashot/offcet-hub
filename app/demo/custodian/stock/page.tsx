"use client";

import { useState, useMemo } from "react";
import { Search, ShieldAlert, Filter, Layers, PackageCheck, Check } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { classNames } from "@/lib/utils";
import { statusLabel } from "../../_mock/domain";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import type { Holding } from "../../_mock/selectors-custodian";
import { potSlices } from "../../_mock/selectors-batches";
import { categoryLabel, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  SectionHeading,
  ViewModeToggle,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { CustodianStockDrawer } from "../../_components/custodian-stock-drawer";
import type { DamageDraft } from "../../_components/custodian-stock-drawer";

/** Mini pot bar indicator for tabular rows & cards */
function MiniPotsBar({ holding }: { holding: Holding }) {
  const slices = potSlices(holding.batch);
  const total = holding.batch.quantityOriginal || 1;

  const BUCKET_COLOUR: Record<string, string> = {
    available: "bg-[var(--brand-secondary)]",
    reserved: "bg-[#C8A96B]",
    allocated: "bg-[#B4531A]",
    in_transit: "bg-[#7A5CC4]",
    at_custodian: "bg-[#2F6F7A]",
    with_maker: "bg-[var(--brand-primary)]",
    consumed: "bg-[#5C3A21]",
    written_off: "bg-[#9A9A9A]",
    unexplained: "bg-[#D14343]",
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)]">
        {slices.map((slice) => (
          <div
            key={slice.bucket}
            className={BUCKET_COLOUR[slice.bucket] ?? "bg-[var(--line-strong)]"}
            style={{ width: `${Math.max((slice.quantity / total) * 100, 2)}%` }}
            title={`${slice.label}: ${formatQuantity(slice.quantity, holding.batch.unit)}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
        <span className="font-bold text-[var(--brand-primary)]">
          {formatQuantity(holding.uncommitted, holding.batch.unit)} unassigned
        </span>
        <span className="font-medium text-[var(--ink-muted)]">
          {formatQuantity(holding.promised, holding.batch.unit)} assigned out
        </span>
      </div>
    </div>
  );
}

/** Clean, visual node chain replacing verbose text dumping in custody history */
function CustodyNodeChain({ holding }: { holding: Holding }) {
  const [expanded, setExpanded] = useState(false);
  const outgoing = holding.outgoing;
  const hasMultiple = outgoing.length > 2;
  const visibleOutgoing = expanded ? outgoing : outgoing.slice(0, 2);
  const hiddenCount = outgoing.length - 2;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Source node pill */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-medium text-[var(--ink-muted)] shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          From:
        </span>
        <span className="font-semibold text-[var(--ink)]">{holding.receivedFromName}</span>
      </span>

      <span className="text-[var(--ink-muted)] font-bold">→</span>

      {/* Outgoing maker nodes */}
      {outgoing.length === 0 ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1 text-[11px] text-[var(--ink-muted)] font-medium">
          <span className="h-2 w-2 rounded-full bg-[#8CC63F]" />
          Awaiting CIRKA maker assignment
        </span>
      ) : (
        <>
          {visibleOutgoing.map(({ allocation, makerName }) => (
            <span
              key={allocation._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-[11px] font-medium text-[var(--ink)] shadow-xs"
            >
              <span className="h-2 w-2 rounded-full bg-[#FF5C00]" />
              <span className="font-semibold">{makerName}</span>
              <span className="text-[10px] text-[var(--ink-muted)] font-medium">
                ({statusLabel(allocation.status)})
              </span>
            </span>
          ))}

          {hasMultiple && !expanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)] hover:bg-[var(--line)] transition-colors"
            >
              +{hiddenCount} more
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Card representation for intuitive scannability */
function CustodianStockCard({
  holding,
  isSelected,
  onOpenDrawer,
}: {
  holding: Holding;
  isSelected: boolean;
  onOpenDrawer: (batchId: string) => void;
}) {
  const { batch, held, uncommitted, promised, ownerName } = holding;

  return (
    <div
      onClick={() => onOpenDrawer(batch._id)}
      className={classNames(
        "group relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 ease-out hover:shadow-md",
        isSelected
          ? "border-[var(--brand-primary)] bg-[var(--brand-primary-muted,rgba(255,92,0,0.04))] ring-1 ring-[var(--brand-primary)]"
          : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--line-strong)]",
      )}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)] text-[var(--ink)]">
              {categoryLabel(batch.materialCategory)}
            </span>
            <span>·</span>
            <span className="font-mono text-[var(--ink-muted)]">{batch.reference}</span>
          </div>
          <h3 className="text-base font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand-primary)] transition-colors">
            {batch.name}
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Owner: <span className="font-semibold text-[var(--ink)]">{ownerName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <CirkaBadge status={batch.status} />
          <Button
            size="sm"
            variant="secondary"
            className="text-xs shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer(batch._id);
            }}
          >
            <ShieldAlert size={14} className="mr-1.5 text-[#FF5C00]" />
            Report Damage
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4">
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
            Held at Site
          </p>
          <p className="text-xl font-bold tabular-nums text-[var(--ink)]">
            {formatQuantity(held, batch.unit)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#FF5C00]/5 border border-[#FF5C00]/20 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF5C00]">
            <span className="w-2 h-2 rounded-full bg-[#FF5C00]" />
            Unassigned
          </div>
          <p className="text-xl font-bold tabular-nums text-[#FF5C00]">
            {formatQuantity(uncommitted, batch.unit)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
            <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
            Assigned Out
          </div>
          <p className="text-xl font-bold tabular-nums text-[var(--ink)]">
            {formatQuantity(promised, batch.unit)}
          </p>
        </div>
      </div>

      {/* Visual Pot Allocation Bar */}
      <div className="space-y-1.5 pb-4 border-b border-[var(--line)]">
        <MiniPotsBar holding={holding} />
      </div>

      {/* Custody Flow Section */}
      <div className="pt-3.5 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Custody Transfer Nodes
        </p>
        <CustodyNodeChain holding={holding} />
      </div>
    </div>
  );
}

export default function CustodianStockPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("custodian");
  const { run, error, pending, clearError } = useAction();

  const view = getCustodianDashboard(store.db, scope);

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DamageDraft>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const selectedHolding =
    view.holdings.find((h) => h.batch._id === selectedBatchId) ?? null;

  function openDrawer(batchId: string) {
    clearError();
    setDrafts((current) => ({
      ...current,
      [batchId]: current[batchId] ?? { quantity: "", reason: "" },
    }));
    setSelectedBatchId(batchId);
  }

  function closeDrawer() {
    setSelectedBatchId(null);
  }

  // Filtered holdings calculation
  const filteredHoldings = useMemo(() => {
    return view.holdings.filter((holding) => {
      // Search text match
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        holding.batch.name.toLowerCase().includes(query) ||
        holding.batch.reference.toLowerCase().includes(query) ||
        holding.batch.materialCategory.toLowerCase().includes(query) ||
        holding.ownerName.toLowerCase().includes(query) ||
        holding.receivedFromName.toLowerCase().includes(query) ||
        holding.outgoing.some((o) => o.makerName.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      // Status filter
      if (statusFilter === "unassigned" && holding.uncommitted <= 0) return false;
      if (statusFilter === "partially" && holding.batch.status !== "partially_assigned") return false;
      if (statusFilter === "completely" && holding.batch.status !== "completely_assigned") return false;

      return true;
    });
  }, [view.holdings, searchQuery, statusFilter]);

  const totalHeld = view.metrics.totalHeld;
  const uncommitted = view.metrics.uncommitted;
  const assigned = Math.max(0, totalHeld - uncommitted);

  return (
    <div className="space-y-8">
      <SectionHeading title="Physical Stock" />

      {error && (
        <NoticeBanner tone="blocking" title="That adjustment was refused">
          {error}
        </NoticeBanner>
      )}

      {view.holdings.length === 0 ? (
        <EmptyState
          title="Nothing held"
          body="Confirmed receipts appear here."
        />
      ) : (
        <>
          {/* Summary metrics header bar */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[var(--line)] pb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Total Stock Held
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                  {formatQuantity(totalHeld, "kg")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF5C00]">
                  <span className="w-2 h-2 rounded-full bg-[#FF5C00]" />
                  Not Yet Assigned
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-[#FF5C00]">
                  {formatQuantity(uncommitted, "kg")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
                  Assigned to Makers
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                  {formatQuantity(assigned, "kg")}
                </p>
              </div>
            </div>

            {/* Storage Progress Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--ink)]">Total Node Inventory Split</span>
                <span>
                  <strong className="text-[#FF5C00]">{totalHeld > 0 ? Math.round((uncommitted / totalHeld) * 100) : 0}%</strong> unassigned
                </span>
              </div>
              <div className="h-3 w-full flex overflow-hidden rounded-full bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)]">
                {uncommitted > 0 && (
                  <div
                    className="h-full bg-[#FF5C00] transition-all duration-500 ease-out"
                    style={{ width: `${totalHeld > 0 ? (uncommitted / totalHeld) * 100 : 0}%` }}
                    title={`Unassigned: ${formatQuantity(uncommitted, "kg")}`}
                  />
                )}
                {assigned > 0 && (
                  <div
                    className="h-full bg-[#8CC63F] transition-all duration-500 ease-out border-l border-white/20"
                    style={{ width: `${totalHeld > 0 ? (assigned / totalHeld) * 100 : 0}%` }}
                    title={`Assigned out: ${formatQuantity(assigned, "kg")}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Controls: Search, Filter, View Mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <input
                type="text"
                placeholder="Search stock by batch, material, owner, or maker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] pl-10 pr-4 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills & View Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
                {[
                  { id: "all", label: "All Stock" },
                  { id: "unassigned", label: "Has Unassigned" },
                  { id: "partially", label: "Partially Assigned" },
                  { id: "completely", label: "Completely Assigned" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={classNames(
                      "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                      statusFilter === pill.id
                        ? "bg-[var(--paper)] text-[var(--ink)] shadow-xs"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {/* Holdings Counter */}
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <p>
              Showing <strong className="text-[var(--ink)]">{filteredHoldings.length}</strong> of{" "}
              {view.holdings.length} stock holdings
            </p>
          </div>

          {/* Cards View */}
          {filteredHoldings.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--ink)]">No matching stock found</p>
              <p className="text-xs text-[var(--ink-muted)]">
                Try clearing the filters.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHoldings.map((holding) => (
                <CustodianStockCard
                  key={holding.batch._id}
                  holding={holding}
                  isSelected={selectedBatchId === holding.batch._id}
                  onOpenDrawer={openDrawer}
                />
              ))}
            </div>
          ) : (
            /* Streamlined Compact Table View */
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--surface)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      <th className="px-5 py-3.5">Material / Batch</th>
                      <th className="px-5 py-3.5">Owner</th>
                      <th className="px-5 py-3.5">Custody Chain</th>
                      <th className="px-5 py-3.5">Held at Site</th>
                      <th className="px-5 py-3.5">Unassigned</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredHoldings.map((holding) => {
                      const isSelected = selectedBatchId === holding.batch._id;
                      return (
                        <tr
                          key={holding.batch._id}
                          onClick={() => openDrawer(holding.batch._id)}
                          className={[
                            "group cursor-pointer transition-colors duration-150",
                            isSelected
                              ? "bg-[var(--brand-primary-muted,rgba(255,92,0,.08))]"
                              : "hover:bg-[var(--surface)]",
                          ].join(" ")}
                        >
                          <td className="px-5 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {holding.batch.reference} · {categoryLabel(holding.batch.materialCategory)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="font-semibold text-[var(--ink)]">
                                {holding.batch.name}
                              </p>
                              <CirkaBadge status={holding.batch.status} />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-[var(--ink-muted)]">
                            {holding.ownerName}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <CustodyNodeChain holding={holding} />
                          </td>
                          <td className="px-5 py-4 font-semibold tabular-nums text-[var(--ink)]">
                            {formatQuantity(holding.held, holding.batch.unit)}
                          </td>
                          <td className="px-5 py-4 font-extrabold tabular-nums text-[#FF5C00]">
                            {formatQuantity(holding.uncommitted, holding.batch.unit)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDrawer(holding.batch._id);
                              }}
                            >
                              Report Damage
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drawer */}
      {selectedHolding && (
        <CustodianStockDrawer
          holding={selectedHolding}
          draft={
            drafts[selectedHolding.batch._id] ?? {
              quantity: "",
              reason: "",
            }
          }
          onDraftChange={(next) =>
            setDrafts((prev) => ({
              ...prev,
              [selectedHolding.batch._id]: next,
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
