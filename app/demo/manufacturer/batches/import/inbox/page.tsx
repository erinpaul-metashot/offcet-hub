"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button, EmptyState, Field, Input, Panel, Select } from "@/components/ui";
import { MATERIAL_CATEGORIES, UNITS, type MaterialCategory, type Unit } from "../../../../_mock/domain";
import { categoryLabel, formatQuantity } from "../../../../_mock/selectors-shared";
import { listPendingArrivals, type PendingArrivalRow } from "../../../../_mock/selectors-intake";
import { useDemoPersona, useDemoStore } from "../../../../_mock/store";
import { DataRow, GapNote, NoticeBanner, SectionHeading, formatDateTime } from "../../../../_components/cirka-ui";
import { useAction } from "../../../../_components/use-action";
import type { ArrivalCorrection } from "../../../../_mock/operations/arrivals";

export default function ArrivalsInboxPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel") ?? undefined;

  const arrivals = listPendingArrivals(db, scope, {
    channel: channel as "erp_import" | "sorting_system" | undefined,
  });

  const [selectedId, setSelectedId] = useState<string | null>(arrivals[0]?._id ?? null);
  const selected = arrivals.find((arrival) => arrival._id === selectedId) ?? arrivals[0] ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intake · Arrivals"
        title="Confirm what came in"
        action={
          <Button
            as={Link}
            href={
              channel === "sorting_system"
                ? "/demo/manufacturer/batches/import/retexcir"
                : "/demo/manufacturer/batches/import"
            }
            variant="secondary"
            size="sm"
          >
            <ArrowLeft size={15} />
            Back to intake
          </Button>
        }
      />

      {arrivals.length === 0 ? (
        <EmptyState
          title="Nothing left to review"
          body="Every pushed record has been handled."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
          <Panel className="h-fit divide-y divide-[var(--line)] p-0">
            {arrivals.map((arrival) => (
              <button
                key={arrival._id}
                type="button"
                onClick={() => setSelectedId(arrival._id)}
                className={`block w-full border-l-2 px-4 py-3 text-left transition-[background-color] duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] ${
                  selected?._id === arrival._id
                    ? "border-l-[var(--brand-primary)] bg-[var(--surface)]"
                    : "border-l-transparent"
                }`}
              >
                <p className="font-medium text-[var(--ink)]">{arrival.name ?? "Untitled record"}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {arrival.externalSystemName} · {formatDateTime(arrival.arrivedAt)}
                </p>
              </button>
            ))}
          </Panel>

          {selected && <ArrivalDetail key={selected._id} arrival={selected} />}
        </div>
      )}
    </div>
  );
}

function ArrivalDetail({ arrival }: { arrival: PendingArrivalRow }) {
  const store = useDemoStore();
  const confirmAction = useAction();
  const skipAction = useAction();
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState<ArrivalCorrection>({
    name: arrival.name,
    description: arrival.description,
    materialCategory: arrival.materialCategory,
    quantity: arrival.quantity,
    unit: arrival.unit,
    composition: arrival.composition,
    locationText: arrival.locationText,
  });

  const patch = (field: keyof ArrivalCorrection, value: string | number | undefined) => {
    setCorrection((current) => ({ ...current, [field]: value }));
  };

  return (
    <Panel className="flex flex-col gap-5 p-6">
      {arrival.updateOf && (
        <NoticeBanner tone="info" title="This will update an existing batch">
          {arrival.externalSystemName} already sent record {arrival.externalRecordId}: confirming
          will update <strong>{arrival.updateOf.reference}</strong> ({arrival.updateOf.name}) rather
          than create a new batch.
        </NoticeBanner>
      )}

      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
            {arrival.externalSystemName}
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            Pushed {formatDateTime(arrival.arrivedAt)} · {arrival.externalRecordId ?? "no reference"}
          </p>
        </div>
        {arrival.externalRecordUrl && (
          <a
            href={arrival.externalRecordUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
          >
            Open in {arrival.externalSystemName}
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {confirmAction.error && (
        <NoticeBanner tone="blocking" title="Couldn't confirm this record">
          {confirmAction.error}
        </NoticeBanner>
      )}
      {skipAction.error && (
        <NoticeBanner tone="blocking" title="Couldn't skip this record">
          {skipAction.error}
        </NoticeBanner>
      )}

      {correcting ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={correction.name ?? ""}
              onChange={(event) => patch("name", event.target.value)}
            />
          </Field>
          <Field label="Material category" required>
            <Select
              value={correction.materialCategory ?? ""}
              onChange={(event) => patch("materialCategory", event.target.value as MaterialCategory)}
            >
              <option value="">Select a category</option>
              {MATERIAL_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {categoryLabel(option)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" required>
            <Input
              value={correction.description ?? ""}
              onChange={(event) => patch("description", event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity" required>
              <Input
                type="number"
                value={correction.quantity ?? ""}
                onChange={(event) => patch("quantity", Number(event.target.value))}
              />
            </Field>
            <Field label="Unit" required>
              <Select value={correction.unit ?? ""} onChange={(event) => patch("unit", event.target.value as Unit)}>
                <option value="">Select a unit</option>
                {UNITS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Composition">
            <Input
              value={correction.composition ?? ""}
              onChange={(event) => patch("composition", event.target.value)}
            />
          </Field>
          <Field label="Location">
            <Input
              value={correction.locationText ?? ""}
              onChange={(event) => patch("locationText", event.target.value)}
            />
          </Field>
        </div>
      ) : (
        <dl className="divide-y divide-[var(--line)]">
          <ArrivalField label="Name" value={arrival.name} source={arrival.externalSystemName} />
          <ArrivalField
            label="Description"
            value={arrival.description}
            source={arrival.externalSystemName}
          />
          <ArrivalField
            label="Material category"
            value={arrival.materialCategory ? categoryLabel(arrival.materialCategory) : undefined}
            source={arrival.externalSystemName}
          />
          <ArrivalField
            label="Quantity"
            value={
              arrival.quantity !== undefined && arrival.unit
                ? formatQuantity(arrival.quantity, arrival.unit)
                : undefined
            }
            source={arrival.externalSystemName}
          />
          <ArrivalField label="Composition" value={arrival.composition} source={arrival.externalSystemName} />
          <ArrivalField label="Location" value={arrival.locationText} source={arrival.externalSystemName} />
        </dl>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={confirmAction.pending || skipAction.pending}
          onClick={() => skipAction.run(() => store.skipArrival("manufacturer", { arrivalId: arrival._id }))}
        >
          Skip for now
        </Button>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={confirmAction.pending || skipAction.pending}
            onClick={() => setCorrecting((current) => !current)}
          >
            {correcting ? "Use the original values" : "Correct something"}
          </Button>
          <Button
            size="sm"
            disabled={confirmAction.pending || skipAction.pending}
            onClick={() =>
              confirmAction.run(() =>
                store.confirmArrival("manufacturer", {
                  arrivalId: arrival._id,
                  correction: correcting ? correction : undefined,
                }),
              )
            }
          >
            {arrival.updateOf ? "Confirm the update" : "Confirm and release"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function ArrivalField({
  label,
  value,
  source,
}: {
  label: string;
  value?: string;
  source: string;
}) {
  if (value === undefined || value === "") {
    return (
      <DataRow
        label={label}
        value={<GapNote>CIRKA needs this: {source} did not send it</GapNote>}
      />
    );
  }

  return <DataRow label={label} value={value} />;
}
