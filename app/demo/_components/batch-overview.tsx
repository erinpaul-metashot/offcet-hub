"use client";

import { useState } from "react";
import { ExternalLink, Eye, Lock, X } from "lucide-react";
import { Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { BatchDetail } from "../_mock/selectors-batches";
import { DataRow, ProvenanceChip, QuantityPotsBar } from "./cirka-ui";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

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
  const { batch: t, lot, ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();
  const confidence = batch.compositionConfidence ? lot.confidence[batch.compositionConfidence] : undefined;

  return (
    <div className="space-y-6 animate-stagger-in">
      <Panel className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={PANEL_TITLE}>{t.quantity}</h3>
          <ProvenanceChip dataSource={batch.dataSource} assuranceLevel={batch.assuranceLevel} />
        </div>
        <QuantityPotsBar slices={detail.slices} total={batch.quantityOriginal} unit={batch.unit} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className={PANEL_TITLE}>{t.material}</h3>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] font-bold text-[var(--ink)]">
              {labels.MATERIAL_CATEGORY_LABELS[batch.materialCategory]}
            </span>
          </div>
          <dl>
            <DataRow label={t.composition} value={batch.composition ?? "-"} hint={confidence} />
            <DataRow label={t.format} value={batch.format ? labels.FORMAT_LABELS[batch.format] : "-"} />
            <DataRow
              label={t.quality}
              value={batch.qualityClass ? labels.QUALITY_CLASS_LABELS[batch.qualityClass] : "-"}
            />
            <DataRow label={t.colour} value={batch.colour ?? "-"} />
            <DataRow
              label={t.estimatedValue}
              value={
                batch.estimatedValue !== undefined ? (
                  <span
                    className="inline-flex items-center gap-1.5"
                    title={t.ownerOnly}
                  >
                    <Lock size={12} className="text-[var(--ink-muted)]" aria-label={t.protected} />
                    {fmt.currency(batch.estimatedValue, batch.currency)}
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
                  aria-label={format(t.viewPhoto, { n: idx + 1 })}
                  className="group relative overflow-hidden rounded-xl border border-[var(--line)] transition-transform duration-200 ease-[var(--ease-out)] hover:scale-[1.02]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={format(t.photoAlt, { n: idx + 1 })} className="h-24 w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Eye className="size-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="space-y-4 p-6">
          <h3 className={PANEL_TITLE}>{t.origin}</h3>
          <dl>
            <DataRow label={t.owner} value={detail.ownerName} />
            <DataRow
              label={t.sourceFacility}
              value={detail.facility?.name ?? "-"}
              hint={batch.locationText}
            />
            <DataRow
              label={t.available}
              value={`${fmt.date(batch.availableFrom)} → ${fmt.date(batch.availableUntil)}`}
            />
            <DataRow
              label={t.externalRecord}
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
                label={t.importedFrom}
                value={detail.importJob.fileName ?? detail.importJob.source}
                hint={fmt.date(detail.importJob.createdAt)}
              />
            )}
            <DataRow
              label={t.cirkaReview}
              value={
                batch.reviewedAt
                  ? `${fmt.date(batch.reviewedAt)} · ${actorName(batch.reviewedByUserId)}`
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
            aria-label={t.photo}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoUrl(null)}
              aria-label={ui.close}
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedPhotoUrl} alt={t.photoPreview} className="max-h-[80vh] w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
