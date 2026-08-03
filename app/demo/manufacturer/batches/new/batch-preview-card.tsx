"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import { Lock, Package } from "lucide-react";
import { classNames } from "@/lib/utils";
import {
  CirkaBadge,
  ProvenanceChip,
  QuantityPotsBar,
  formatDate,
} from "../../../_components/cirka-ui";
import {
  FORMAT_LABELS,
  QUALITY_CLASS_LABELS,
  UNIT_LABELS,
  type CompositionConfidence,
  type MaterialCategory,
  type MaterialFormat,
  type QualityClass,
  type Unit,
} from "../../../_mock/domain";
import { categoryLabel } from "../../../_mock/selectors-shared";
import type { PotSlice } from "../../../_mock/selectors-batches";

export interface BatchPreviewCardProps {
  name: string;
  materialCategory: MaterialCategory;
  description: string;
  composition: string;
  compositionConfidence: CompositionConfidence;
  format: MaterialFormat;
  qualityClass: QualityClass;
  colour: string;
  quantity: string;
  unit: Unit;
  locationText: string;
  availableFrom: string;
  availableUntil: string;
  releaseImmediately: boolean;
  selectedImageUrls: string[];
}

const CONFIDENCE_LABELS: Record<CompositionConfidence, string> = {
  stated: "Stated",
  tested: "Tested",
  estimated: "Estimated",
};

const CARD_CLASSES =
  "relative bg-[var(--paper)] border border-[var(--line)] rounded-[3px_18px_18px_3px] pl-9 pr-5 py-6 shadow-[0_16px_32px_-8px_rgba(51,51,51,0.12)] rotate-[-1.75deg] hover:rotate-0 focus-within:rotate-0 transition-transform duration-200 ease-[var(--ease-out)] motion-reduce:transition-none motion-reduce:rotate-0";

/** Same rule the `page.tsx` submit handler uses to turn a yyyy-mm-dd input into a timestamp. */
function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function availabilityText(availableFrom: string, availableUntil: string): string | undefined {
  const from = toTimestamp(availableFrom);
  const until = toTimestamp(availableUntil);

  if (from && until) {
    return `${formatDate(from)} – ${formatDate(until)}`;
  }
  if (from) {
    return `From ${formatDate(from)}`;
  }
  if (until) {
    return `Until ${formatDate(until)}`;
  }
  return undefined;
}

interface DetailRow {
  key: string;
  label: string;
  value: React.ReactNode;
}

function buildDetailRows(props: BatchPreviewCardProps): DetailRow[] {
  const rows: DetailRow[] = [];

  if (props.composition.trim() !== "") {
    rows.push({
      key: "composition",
      label: "Composition",
      value: `${props.composition.trim()} · ${CONFIDENCE_LABELS[props.compositionConfidence]}`,
    });
  }

  rows.push({
    key: "format",
    label: "Format & quality",
    value: `${FORMAT_LABELS[props.format]} · ${QUALITY_CLASS_LABELS[props.qualityClass]}`,
  });

  if (props.colour.trim() !== "") {
    rows.push({
      key: "colour",
      label: "Colour",
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--line-strong)] bg-[var(--ink-muted)]" />
          {props.colour.trim()}
        </span>
      ),
    });
  }

  if (props.description.trim() !== "") {
    rows.push({ key: "description", label: "Description", value: props.description.trim() });
  }

  if (props.locationText.trim() !== "") {
    rows.push({ key: "location", label: "Location", value: props.locationText.trim() });
  }

  const availability = availabilityText(props.availableFrom, props.availableUntil);
  if (availability) {
    rows.push({ key: "availability", label: "Available", value: availability });
  }

  return rows;
}

function PunchedHole() {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2">
      <div className="relative h-[15px] w-[15px] rounded-full bg-[var(--surface)] shadow-[inset_0_0_0_1.5px_var(--line-strong)]">
        <div className="absolute left-1/2 top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--paper)]" />
      </div>
    </div>
  );
}

function AvailablePot({ quantity, unit }: { quantity: number; unit: Unit }) {
  const springValue = useSpring(quantity, { stiffness: 200, damping: 30 });

  useEffect(() => {
    springValue.set(quantity);
  }, [quantity, springValue]);

  const displayValue = useTransform(springValue, (value) => Math.round(value).toLocaleString());

  if (quantity <= 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
        <Lock size={13} className="shrink-0" />
        Not yet recorded — type a quantity to open the ledger
      </div>
    );
  }

  const slices: PotSlice[] = [
    { bucket: "available", label: "Available", quantity, share: 1, terminal: false },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Available pot
        </span>
        <span className="inline-flex items-baseline gap-1">
          <motion.span className="text-sm font-semibold text-[var(--ink)]">
            {displayValue}
          </motion.span>
          <span className="text-xs font-medium text-[var(--ink-muted)]">{UNIT_LABELS[unit]}</span>
        </span>
      </div>
      <QuantityPotsBar slices={slices} total={quantity} unit={unit} compact />
    </div>
  );
}

function EmptyPreview() {
  return (
    <motion.div
      key="empty-preview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border-2 border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-10 text-center"
    >
      <Package size={28} strokeWidth={1.5} className="mx-auto mb-3 text-[var(--ink-muted)]" />
      <p className="text-sm font-semibold text-[var(--ink)]">Nothing recorded yet</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
        Name the batch or type a quantity — the ledger preview opens as soon as either exists.
      </p>
    </motion.div>
  );
}

function PopulatedPreview(props: BatchPreviewCardProps) {
  const quantityNum = parseFloat(props.quantity) || 0;
  const rows = buildDetailRows(props);

  return (
    <motion.div
      key="preview-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_CLASSES}
    >
      <PunchedHole />

      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Ledger preview
        </p>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {categoryLabel(props.materialCategory)}
          </span>
          <CirkaBadge status={props.releaseImmediately ? "available" : "recorded"} />
        </div>

        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {props.name.trim() === "" ? (
            <span className="italic text-[var(--ink-muted)]">Untitled batch</span>
          ) : (
            props.name
          )}
        </h3>

        {props.selectedImageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {props.selectedImageUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-14 w-14 rounded-lg border border-[var(--line)] object-cover"
              />
            ))}
          </div>
        )}

        <AvailablePot quantity={quantityNum} unit={props.unit} />

        {rows.length > 0 && (
          <dl>
            {rows.map((row, index) => (
              <div
                key={row.key}
                className={classNames(
                  "flex flex-col gap-1 py-2.5",
                  index > 0 && "border-t border-[var(--line)]",
                )}
              >
                <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {row.label}
                </dt>
                <dd className="text-[13px] leading-relaxed text-[var(--ink)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
          <Lock size={13} className="shrink-0" />
          Estimated value — protected, excluded from preview.
        </div>

        <ProvenanceChip dataSource="manual_entry" assuranceLevel="self_reported" />
      </div>
    </motion.div>
  );
}

/**
 * The live "hang tag" preview beside the record-batch form — the quantity the
 * manufacturer is about to record, read back as the ledger will see it.
 */
export function BatchPreviewCard(props: BatchPreviewCardProps) {
  const isDirty = props.name.trim() !== "" || props.quantity !== "";

  return (
    <AnimatePresence mode="wait">
      {isDirty ? <PopulatedPreview {...props} /> : <EmptyPreview />}
    </AnimatePresence>
  );
}
