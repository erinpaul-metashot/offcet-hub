"use client";

import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import type { Holding } from "../../_mock/selectors-custodian";
import { potSlices } from "../../_mock/selectors-batches";
import { categoryLabel, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  SectionHeading,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { CustodianStockDrawer } from "../../_components/custodian-stock-drawer";

/** Mini pot bar indicator for tabular rows */
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
    <div className="space-y-1">
      <div className="flex h-2 w-28 overflow-hidden rounded-full bg-[var(--surface)]">
        {slices.map((slice) => (
          <div
            key={slice.bucket}
            className={BUCKET_COLOUR[slice.bucket] ?? "bg-[var(--line-strong)]"}
            style={{ width: `${Math.max((slice.quantity / total) * 100, 2)}%` }}
            title={`${slice.label}: ${formatQuantity(slice.quantity, holding.batch.unit)}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-[var(--ink-muted)]">
        <span className="font-semibold text-[var(--brand-primary)]">
          {holding.uncommitted} {holding.batch.unit} free
        </span>
        {" / "}
        {holding.promised} promised
      </p>
    </div>
  );
}

export default function CustodianStockPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("custodian");
  const { run, error, pending, clearError } = useAction();

  const view = getCustodianDashboard(store.db, scope);
  const makers = store.db.organisations.filter(
    (org) => org.type === "maker" && org.status === "approved",
  );

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { makerOrgId: string; quantity: string; notes: string }>
  >({});

  const selectedHolding =
    view.holdings.find((h) => h.batch._id === selectedBatchId) ?? null;

  function openDrawer(batchId: string) {
    clearError();
    const holding = view.holdings.find((h) => h.batch._id === batchId);
    if (holding) {
      setDrafts((current) => ({
        ...current,
        [batchId]: current[batchId] ?? {
          makerOrgId: "",
          quantity: String(holding.uncommitted),
          notes: "",
        },
      }));
    }
    setSelectedBatchId(batchId);
  }

  function closeDrawer() {
    setSelectedBatchId(null);
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Stock"
        title="What is physically here"
        description="You hold this material; you do not own it. Allocate part of a holding to an approved maker — CIRKA will not let you promise more than is uncommitted."
      />

      {error && (
        <NoticeBanner tone="blocking" title="That allocation was refused">
          {error}
        </NoticeBanner>
      )}

      {view.holdings.length === 0 ? (
        <EmptyState
          title="Nothing held"
          body="Once you confirm receipt of an allocation, the material appears here."
        />
      ) : (
        <>
          {/* Metrics summary bar */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--line)] sm:grid-cols-3">
            <div className="bg-[var(--paper)] px-5 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                {formatQuantity(view.metrics.totalHeld, "kg")}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--ink-muted)]">
                Total stock held
              </p>
            </div>
            <div className="bg-[var(--paper)] px-5 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--brand-primary)]">
                {formatQuantity(view.metrics.uncommitted, "kg")}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--ink-muted)]">
                Uncommitted available
              </p>
            </div>
            <div className="bg-[var(--paper)] px-5 py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--ink)]">
                {formatQuantity(
                  view.metrics.totalHeld - view.metrics.uncommitted,
                  "kg",
                )}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--ink-muted)]">
                Promised to makers
              </p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    <th className="px-5 py-3.5">Material / Batch</th>
                    <th className="px-5 py-3.5">Owner</th>
                    <th className="px-5 py-3.5">Pot Allocation</th>
                    <th className="px-5 py-3.5">Held at Site</th>
                    <th className="px-5 py-3.5">Uncommitted</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {view.holdings.map((holding) => {
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
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--ink)]">
                              {holding.batch.name}
                            </p>
                            <CirkaBadge status={holding.batch.status} />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-[var(--ink-muted)]">
                          {holding.ownerName}
                        </td>
                        <td className="px-5 py-4">
                          <MiniPotsBar holding={holding} />
                        </td>
                        <td className="px-5 py-4 font-semibold tabular-nums text-[var(--ink)]">
                          {formatQuantity(holding.held, holding.batch.unit)}
                        </td>
                        <td className="px-5 py-4 font-extrabold tabular-nums text-[var(--brand-primary)]">
                          {formatQuantity(holding.uncommitted, holding.batch.unit)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDrawer(holding.batch._id);
                            }}
                          >
                            Allocate to Maker
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Drawer */}
      {selectedHolding && (
        <CustodianStockDrawer
          holding={selectedHolding}
          makers={makers}
          draft={
            drafts[selectedHolding.batch._id] ?? {
              makerOrgId: "",
              quantity: String(selectedHolding.uncommitted),
              notes: "",
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
