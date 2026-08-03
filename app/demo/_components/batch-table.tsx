"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui";
import type { BatchRow } from "../_mock/selectors-batches";
import { categoryLabel, formatQuantity } from "../_mock/selectors-shared";
import { CirkaBadge, ProvenanceChip, QuantityPotsBar, formatDate } from "./cirka-ui";

export function BatchTable({
  rows,
  hrefPrefix,
  showOwner = false,
  emptyTitle = "No resource batches",
  emptyBody = "Batches recorded, imported or pushed in by a connected system will appear here.",
}: {
  rows: BatchRow[];
  hrefPrefix: string;
  showOwner?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.batch._id}>
          <Link
            href={`${hrefPrefix}/${row.batch._id}`}
            className="block rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[var(--ink)]">{row.batch.name}</h3>
                  <CirkaBadge status={row.batch.status} />
                  {row.batch.exceptionStatus && (
                    <CirkaBadge status={row.batch.exceptionStatus} />
                  )}
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {row.batch.reference} · {categoryLabel(row.batch.materialCategory)}
                  {showOwner ? ` · ${row.ownerName}` : ""}
                </p>
                <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
                  {row.batch.description}
                </p>
              </div>

              <div className="shrink-0 space-y-2 sm:text-right">
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  {formatQuantity(row.batch.pots.available, row.batch.unit)}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  available of {formatQuantity(row.batch.quantityOriginal, row.batch.unit)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <QuantityPotsBar
                slices={row.slices}
                total={row.batch.quantityOriginal}
                unit={row.batch.unit}
                compact
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ProvenanceChip
                  dataSource={row.batch.dataSource}
                  assuranceLevel={row.batch.assuranceLevel}
                />
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {row.batch.locationText ?? "Location not recorded"} · recorded{" "}
                  {formatDate(row.batch.createdAt)}
                </p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
