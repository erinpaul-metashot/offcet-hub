"use client";

import { useState } from "react";
import { ExternalLink, Eye, Lock, X } from "lucide-react";
import { Panel } from "@/components/ui";
import { FORMAT_LABELS, QUALITY_CLASS_LABELS } from "../_mock/domain";
import type { BatchDetail } from "../_mock/selectors-batches";
import { categoryLabel, formatCurrency } from "../_mock/selectors-shared";
import { DataRow, ProvenanceChip, QuantityPotsBar, formatDate } from "./cirka-ui";

const PANEL_TITLE = "text-base font-bold tracking-tight text-[var(--ink)]";

/**
 * The batch at a glance: where its quantity sits, what the material is, and
 * where it came from. One label per value; the pots bar carries every quantity.
 */
export function BatchOverview({
  detail,
  actorName,
}: {
  detail: BatchDetail;
  actorName: (userId?: string) => string;
}) {
  const { batch } = detail;
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const confidence = batch.compositionConfidence?.replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="space-y-6 animate-stagger-in">
      <Panel className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={PANEL_TITLE}>Quantity</h3>
          <ProvenanceChip dataSource={batch.dataSource} assuranceLevel={batch.assuranceLevel} />
        </div>
        <QuantityPotsBar slices={detail.slices} total={batch.quantityOriginal} unit={batch.unit} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className={PANEL_TITLE}>Material</h3>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] font-bold text-[var(--ink)]">
              {categoryLabel(batch.materialCategory)}
            </span>
          </div>
          <dl>
            <DataRow label="Composition" value={batch.composition ?? "-"} hint={confidence} />
            <DataRow label="Format" value={batch.format ? FORMAT_LABELS[batch.format] : "-"} />
            <DataRow
              label="Quality"
              value={batch.qualityClass ? QUALITY_CLASS_LABELS[batch.qualityClass] : "-"}
            />
            <DataRow label="Colour" value={batch.colour ?? "-"} />
            <DataRow
              label="Estimated value"
              value={
                batch.estimatedValue !== undefined ? (
                  <span
                    className="inline-flex items-center gap-1.5"
                    title="Visible to the owner and CIRKA only"
                  >
                    <Lock size={12} className="text-[var(--ink-muted)]" aria-label="Protected" />
                    {formatCurrency(batch.estimatedValue, batch.currency)}
                  </span>
                ) : (
                  "-"
                )
              }
            />
          </dl>

          {batch.imageUrls.length > 0 && (
            <div className="grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-3">
              {batch.imageUrls.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedPhotoUrl(url)}
                  aria-label={`View photo ${idx + 1}`}
                  className="group relative overflow-hidden rounded-xl border border-[var(--line)] transition-transform duration-200 ease-[var(--ease-out)] hover:scale-[1.02]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Reference ${idx + 1}`} className="h-24 w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Eye className="size-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="space-y-4 p-6">
          <h3 className={PANEL_TITLE}>Origin</h3>
          <dl>
            <DataRow label="Owner" value={detail.ownerName} />
            <DataRow
              label="Source facility"
              value={detail.facility?.name ?? "-"}
              hint={batch.locationText}
            />
            <DataRow
              label="Available"
              value={`${formatDate(batch.availableFrom)} → ${formatDate(batch.availableUntil)}`}
            />
            <DataRow
              label="External record"
              value={
                batch.externalSystemName ? (
                  batch.externalRecordUrl ? (
                    <a
                      href={batch.externalRecordUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      {batch.externalSystemName} · {batch.externalRecordId}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    `${batch.externalSystemName} · ${batch.externalRecordId}`
                  )
                ) : (
                  "-"
                )
              }
            />
            {detail.importJob && (
              <DataRow
                label="Imported from"
                value={detail.importJob.fileName ?? detail.importJob.source}
                hint={formatDate(detail.importJob.createdAt)}
              />
            )}
            <DataRow
              label="CIRKA review"
              value={
                batch.reviewedAt
                  ? `${formatDate(batch.reviewedAt)} · ${actorName(batch.reviewedByUserId)}`
                  : "-"
              }
              hint={batch.reviewNotes}
            />
          </dl>
        </Panel>
      </div>

      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhotoUrl(null)}
          role="presentation"
        >
          <div
            className="relative max-w-3xl overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Photo"
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoUrl(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedPhotoUrl} alt="Reference preview" className="max-h-[80vh] w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
