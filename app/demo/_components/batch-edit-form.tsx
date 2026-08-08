"use client";

import { useState } from "react";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  COMPOSITION_CONFIDENCES,
  FORMAT_LABELS,
  MATERIAL_CATEGORIES,
  MATERIAL_FORMATS,
  QUALITY_CLASSES,
  QUALITY_CLASS_LABELS,
  type CirkaRole,
  type CompositionConfidence,
  type MaterialCategory,
  type MaterialFormat,
  type QualityClass,
} from "../_mock/domain";
import { categoryLabel } from "../_mock/selectors-shared";
import { useDemoStore } from "../_mock/store";
import type { ResourceBatch } from "../_mock/types";
import { NoticeBanner } from "./cirka-ui";
import { useAction } from "./use-action";

function toDateInput(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toISOString().slice(0, 10) : "";
}

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Editing a batch changes only its description: never its quantity. Quantity
 * moves through the ledger, so there is deliberately no field for it here.
 */
export function BatchEditForm({
  batch,
  role,
  facilityOptions,
  onDone,
}: {
  batch: ResourceBatch;
  role: CirkaRole;
  facilityOptions: Array<{ _id: string; name: string }>;
  onDone: () => void;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();

  const PHOTO_CHOICES = [
    { url: "/cirka_batch_jersey_offcuts.png", label: "Jersey offcuts" },
    { url: "/cirka_batch_denim_rolls.png", label: "Denim rolls" },
    { url: "/cirka_batch_merino_knit.png", label: "Merino knit" },
    { url: "/cirka_batch_cotton_twill.png", label: "Cotton twill" },
    { url: "/cirka_batch_flax_linen.png", label: "Flax linen" },
    { url: "/cirka_batch_fleece_trimmings.png", label: "Fleece trimmings" },
    { url: "/cirka_batch_melton_wool.png", label: "Melton wool" },
    { url: "/cirka_pattern_maker.png", label: "Cutting table" },
    { url: "/cirka_sewing_machine.png", label: "Sewing line" },
  ];

  const [form, setForm] = useState({
    name: batch.name,
    description: batch.description,
    materialCategory: batch.materialCategory,
    composition: batch.composition ?? "",
    compositionConfidence: batch.compositionConfidence ?? ("stated" as CompositionConfidence),
    format: batch.format ?? ("bale" as MaterialFormat),
    qualityClass: batch.qualityClass ?? ("a_grade" as QualityClass),
    colour: batch.colour ?? "",
    locationText: batch.locationText ?? "",
    sourceFacilityId: batch.sourceFacilityId ?? "",
    availableFrom: toDateInput(batch.availableFrom),
    availableUntil: toDateInput(batch.availableUntil),
    estimatedValue: batch.estimatedValue !== undefined ? String(batch.estimatedValue) : "",
  });

  const [images, setImages] = useState<string[]>(batch.imageUrls ?? []);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Panel className="space-y-5 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
          Edit batch details
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Quantity moves through the ledger only
        </span>
      </div>

      {error && <NoticeBanner tone="blocking" title="The change was refused">{error}</NoticeBanner>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <Input value={form.name} onChange={(event) => update("name", event.target.value)} />
        </Field>
        <Field label="Material category">
          <Select
            value={form.materialCategory}
            onChange={(event) => update("materialCategory", event.target.value as MaterialCategory)}
          >
            {MATERIAL_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {categoryLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Composition">
          <Input
            value={form.composition}
            onChange={(event) => update("composition", event.target.value)}
          />
        </Field>
        <Field label="Composition confidence">
          <Select
            value={form.compositionConfidence}
            onChange={(event) =>
              update("compositionConfidence", event.target.value as CompositionConfidence)
            }
          >
            {COMPOSITION_CONFIDENCES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Format">
          <Select
            value={form.format}
            onChange={(event) => update("format", event.target.value as MaterialFormat)}
          >
            {MATERIAL_FORMATS.map((value) => (
              <option key={value} value={value}>
                {FORMAT_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quality">
          <Select
            value={form.qualityClass}
            onChange={(event) => update("qualityClass", event.target.value as QualityClass)}
          >
            {QUALITY_CLASSES.map((value) => (
              <option key={value} value={value}>
                {QUALITY_CLASS_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Colour">
          <Input value={form.colour} onChange={(event) => update("colour", event.target.value)} />
        </Field>
        <Field label="Source facility">
          <Select
            value={form.sourceFacilityId}
            onChange={(event) => update("sourceFacilityId", event.target.value)}
          >
            <option value="">Not recorded</option>
            {facilityOptions.map((facility) => (
              <option key={facility._id} value={facility._id}>
                {facility.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Available from">
          <Input
            type="date"
            value={form.availableFrom}
            onChange={(event) => update("availableFrom", event.target.value)}
          />
        </Field>
        <Field label="Available until">
          <Input
            type="date"
            value={form.availableUntil}
            onChange={(event) => update("availableUntil", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location">
          <Input
            value={form.locationText}
            onChange={(event) => update("locationText", event.target.value)}
          />
        </Field>
        <Field label="Estimated value (SEK)" hint="Protected">
          <Input
            type="number"
            min="0"
            value={form.estimatedValue}
            onChange={(event) => update("estimatedValue", event.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-[var(--ink)]">Reference photos</label>
          <p className="text-xs text-[var(--ink-muted)]">Select photos that match this batch.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {PHOTO_CHOICES.map((photo) => {
            const selected = images.includes(photo.url);

            return (
              <button
                key={photo.url}
                type="button"
                onClick={() =>
                  setImages((current) =>
                    selected
                      ? current.filter((entry) => entry !== photo.url)
                      : [...current, photo.url],
                  )
                }
                className={`overflow-hidden rounded-2xl border-2 text-left transition-all ${
                  selected ? "border-[var(--brand-primary)]" : "border-[var(--line)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.label} className="h-24 w-full object-cover" />
                <span className="block px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  {photo.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await store.updateResourceBatch(role, {
                batchId: batch._id,
                patch: {
                  name: form.name,
                  description: form.description,
                  materialCategory: form.materialCategory,
                  composition: form.composition || undefined,
                  compositionConfidence: form.compositionConfidence,
                  format: form.format,
                  qualityClass: form.qualityClass,
                  colour: form.colour || undefined,
                  locationText: form.locationText || undefined,
                  sourceFacilityId: form.sourceFacilityId || undefined,
                  availableFrom: toTimestamp(form.availableFrom),
                  availableUntil: toTimestamp(form.availableUntil),
                  estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
                  imageUrls: images,
                },
              });
              onDone();
            })
          }
        >
          Save changes
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
