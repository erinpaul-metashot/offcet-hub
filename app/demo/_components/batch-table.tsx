"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { BatchRow } from "../_mock/selectors-batches";
import { CirkaBadge, ProvenanceChip, QuantityPotsBar, ViewModeToggle } from "./cirka-ui";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";
import { classNames } from "@/lib/utils";

export function BatchTable({
  rows,
  hrefPrefix,
  showOwner = false,
  emptyTitle,
}: {
  rows: BatchRow[];
  hrefPrefix: string;
  showOwner?: boolean;
  emptyTitle?: string;
}) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { batchTable: t } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle ?? t.empty} />;
  }

  return (
    <div className="space-y-3">
      {/* Header bar with count and view mode toggle */}
      <div className="flex items-center justify-between px-1 text-xs text-[var(--ink-muted)]">
        <span className="font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {format(rows.length === 1 ? t.countOne : t.countMany, { count: rows.length })}
        </span>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      <ul
        className={classNames(
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
            : "space-y-3"
        )}
      >
        {rows.map((row) => {
          const isGrid = viewMode === "grid";

          return (
            <li key={row.batch._id} className={classNames(isGrid && "h-full flex")}>
              <Link
                href={`${hrefPrefix}/${row.batch._id}`}
                className={classNames(
                  "group block rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 transition-all duration-200 hover:border-[var(--brand-primary)] hover:shadow-sm w-full",
                  isGrid ? "flex flex-col justify-between h-full" : "space-y-3"
                )}
              >
                <div className="space-y-3">
                  {/* Top Header: Title, Badges & Available Quantity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                      <h3 className="text-base font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand-primary)] transition-colors truncate max-w-full">
                        {row.batch.name}
                      </h3>
                      <CirkaBadge status={row.batch.status} />
                      {row.batch.exceptionStatus && (
                        <CirkaBadge status={row.batch.exceptionStatus} />
                      )}
                    </div>

                    {/* Quantity Display - Locked to top right */}
                    <div className="flex items-center gap-1.5 shrink-0 rounded-lg bg-[var(--surface)] px-2.5 py-1 border border-[var(--line)] text-xs self-start">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                        {t.available}
                      </span>
                      <span className="font-bold text-[var(--ink)] tabular-nums">
                        {fmt.quantity(row.batch.pots.available, row.batch.unit)}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--ink-muted)] tabular-nums">
                        / {fmt.quantity(row.batch.quantityOriginal, row.batch.unit)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata & Details */}
                  <div
                    className={classNames(
                      "text-xs text-[var(--ink-muted)]",
                      isGrid ? "space-y-2" : "flex flex-wrap items-center justify-between gap-y-2 gap-x-4"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-semibold text-[var(--ink)]">{row.batch.reference}</span>
                      <span className="text-[var(--line-strong)]">•</span>
                      <span className="font-semibold text-[var(--ink)]">{labels.MATERIAL_CATEGORY_LABELS[row.batch.materialCategory]}</span>
                      {showOwner && (
                        <>
                          <span className="text-[var(--line-strong)]">•</span>
                          <span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] mr-1">{t.owner}</span>
                            <span className="font-semibold text-[var(--ink)]">{row.ownerName}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <ProvenanceChip
                        dataSource={row.batch.dataSource}
                        assuranceLevel={row.batch.assuranceLevel}
                      />
                      <span className="text-[11px] font-medium text-[var(--ink-muted)] truncate min-w-0">
                        {row.batch.locationText ?? t.noLocation} · {fmt.date(row.batch.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Slim visual Progress Bar pinned to bottom */}
                <div className="pt-3 mt-auto">
                  <QuantityPotsBar
                    slices={row.slices}
                    total={row.batch.quantityOriginal}
                    unit={row.batch.unit}
                    compact
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

