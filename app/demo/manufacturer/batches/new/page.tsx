"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  COMPOSITION_CONFIDENCES,
  RETEXCIR,
  MATERIAL_CATEGORIES,
  MATERIAL_FORMATS,
  QUALITY_CLASSES,
  UNITS,
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
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";
import { BatchPreviewCard } from "./batch-preview-card";

const PHOTO_CHOICES = [
  { url: "/cirka_textile_waste.png", label: "Baled offcuts" },
  { url: "/cirka_pattern_maker.png", label: "Cutting table" },
  { url: "/cirka_sewing_machine.png", label: "Rolls in store" },
  { url: "/cirka_shopping_bags.png", label: "Finished stock" },
];

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function RecordBatchPage() {
  const router = useRouter();
  const { createResourceBatch, db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");
  const { run, error, pending } = useAction();

  const facilities = db.facilities.filter(
    (facility) => facility.orgId === scope.orgId && facility.isActive,
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    materialCategory: "cotton_offcuts" as MaterialCategory,
    composition: "",
    compositionConfidence: "stated" as CompositionConfidence,
    format: "bale" as MaterialFormat,
    qualityClass: "a_grade" as QualityClass,
    colour: "",
    quantity: "",
    unit: "kg" as Unit,
    sourceFacilityId: facilities[0]?._id ?? "",
    locationText: facilities[0]?.addressLine ?? "",
    availableFrom: "",
    availableUntil: "",
    estimatedValue: "",
    releaseImmediately: true,
  });

  const [images, setImages] = useState<string[]>([]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const created = await run(async () => {
      const batchId = await createResourceBatch("manufacturer", {
        name: form.name,
        description: form.description,
        materialCategory: form.materialCategory,
        composition: form.composition || undefined,
        compositionConfidence: form.compositionConfidence,
        format: form.format,
        qualityClass: form.qualityClass,
        colour: form.colour || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        sourceFacilityId: form.sourceFacilityId || undefined,
        locationText: form.locationText || undefined,
        availableFrom: toTimestamp(form.availableFrom),
        availableUntil: toTimestamp(form.availableUntil),
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        imageUrls: images,
        dataSource: "manual_entry",
        releaseImmediately: form.releaseImmediately,
      });

      router.push(`/demo/manufacturer/batches/${batchId}`);
    });

    return created;
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        title="New Resource Batch"
        action={
          <Button as={Link} href="/demo/manufacturer/batches/import" variant="secondary" size="sm">
            <ArrowLeft size={15} />
            Back to intake
          </Button>
        }
      />

      <NoticeBanner tone="info" title={`For material ${RETEXCIR.systemName} never handled`}>
        Sorted batches arrive on their own and carry their sorting data with them. Anything typed
        here lands as self-reported until someone verifies it.
      </NoticeBanner>

      {error && <NoticeBanner tone="blocking" title="The batch was not saved">{error}</NoticeBanner>}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <form onSubmit={submit} className="space-y-6 lg:col-span-8">
        <Panel className="space-y-5 p-6">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            What the material is
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Organic cotton jersey offcuts"
              />
            </Field>
            <Field label="Material category">
              <Select
                value={form.materialCategory}
                onChange={(event) =>
                  update("materialCategory", event.target.value as MaterialCategory)
                }
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
              required
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Where it came from, how it is packed, average piece size, storage conditions."
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Composition">
              <Input
                value={form.composition}
                onChange={(event) => update("composition", event.target.value)}
                placeholder="100% organic cotton"
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
            <Field label="Quality classification">
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

          <Field label="Colour">
            <Input
              value={form.colour}
              onChange={(event) => update("colour", event.target.value)}
              placeholder="Ecru / off-white"
            />
          </Field>
        </Panel>

        <Panel className="space-y-5 p-6">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Quantity, location and availability
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Quantity">
              <Input
                required
                type="number"
                min="0"
                step="0.001"
                value={form.quantity}
                onChange={(event) => update("quantity", event.target.value)}
                placeholder="500"
              />
            </Field>
            <Field label="Unit">
              <Select
                value={form.unit}
                onChange={(event) => update("unit", event.target.value as Unit)}
              >
                {UNITS.map((value) => (
                  <option key={value} value={value}>
                    {UNIT_LABELS[value]}
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
            <Field label="Source facility">
              <Select
                value={form.sourceFacilityId}
                onChange={(event) => {
                  const facility = facilities.find((entry) => entry._id === event.target.value);
                  update("sourceFacilityId", event.target.value);

                  if (facility) {
                    update(
                      "locationText",
                      `${facility.addressLine}, ${facility.postcode ?? ""} ${facility.city ?? ""}`.trim(),
                    );
                  }
                }}
              >
                <option value="">Not recorded</option>
                {facilities.map((facility) => (
                  <option key={facility._id} value={facility._id}>
                    {facility.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location">
              <Input
                value={form.locationText}
                onChange={(event) => update("locationText", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Estimated value (SEK)" hint="Never shown to brands">
            <Input
              type="number"
              min="0"
              value={form.estimatedValue}
              onChange={(event) => update("estimatedValue", event.target.value)}
              placeholder="5400"
            />
          </Field>
        </Panel>

        <Panel className="space-y-5 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Images</h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] tabular-nums text-[var(--ink-muted)]">
              {images.length} selected
            </span>
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
        </Panel>

        <Panel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-3 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={form.releaseImmediately}
              onChange={(event) => update("releaseImmediately", event.target.checked)}
              className="mt-1"
            />
            <span>Release for matching straight away</span>
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Recording…" : "Record batch"}
          </Button>
        </Panel>
      </form>

      <div className="lg:col-span-4 sticky top-6">
        <BatchPreviewCard
          name={form.name}
          materialCategory={form.materialCategory}
          description={form.description}
          composition={form.composition}
          compositionConfidence={form.compositionConfidence}
          format={form.format}
          qualityClass={form.qualityClass}
          colour={form.colour}
          quantity={form.quantity}
          unit={form.unit}
          locationText={form.locationText}
          availableFrom={form.availableFrom}
          availableUntil={form.availableUntil}
          releaseImmediately={form.releaseImmediately}
          selectedImageUrls={images}
        />
      </div>
      </div>
    </div>
  );
}
