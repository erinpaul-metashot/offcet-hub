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
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionHeading
        eyebrow="Intake · Automated Arrivals"
        title="Confirm what came in"
        action={
          <Button
            as={Link}
            href="/demo/manufacturer/batches/import"
            variant="secondary"
            size="sm"
            className="border-[var(--line-strong)] hover:border-[#FF5C00]"
          >
            <ArrowLeft size={15} />
            Back to intake
          </Button>
        }
      />

      {arrivals.length === 0 ? (
        <EmptyState
          title="Nothing left to review"
          body="Every pushed record has been processed into the CIRKA ledger."
        />
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[20rem_1fr] items-stretch">
          {/* Queue Navigation Panel */}
          <div className="flex flex-col bg-[var(--surface)] border-b lg:border-b-0 lg:border-r border-[var(--line)]">
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[#545454]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8CC63F] animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                  Incoming Queue
                </h3>
              </div>
              <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[#FF5C00] px-2 text-[11px] font-bold text-white shadow-sm">
                {arrivals.length}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[var(--line)] p-2 space-y-1">
              {arrivals.map((arrival) => {
                const isActive = selected?._id === arrival._id;
                return (
                  <button
                    key={arrival._id}
                    type="button"
                    onClick={() => setSelectedId(arrival._id)}
                    className={`relative w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 ease-out group ${
                      isActive
                        ? "bg-white shadow-sm border-l-4 border-l-[#FF5C00] text-[var(--ink)]"
                        : "hover:bg-white/60 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`shrink-0 w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          isActive
                            ? "bg-[#FF5C00] shadow-[0_0_8px_rgba(255,92,0,0.5)] scale-110"
                            : "bg-[var(--line-strong)] group-hover:bg-[#545454]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm transition-colors duration-200 ${
                            isActive ? "font-bold text-[var(--ink)]" : "font-medium text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
                          }`}
                        >
                          {arrival.name ?? "Untitled record"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isActive
                                ? "bg-[#8CC63F]/15 text-[#545454]"
                                : "bg-[var(--line)]/50 text-[var(--ink-muted)] group-hover:bg-[var(--line)]"
                            }`}
                          >
                            {arrival.externalSystemName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Batch Verification Ledger */}
          {selected && (
            <div className="p-6 sm:p-8 bg-white">
              <ArrivalDetail key={selected._id} arrival={selected} />
            </div>
          )}
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
    <div className="flex flex-col gap-6">
      {/* Main Ledger Card */}
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header section with system status & action */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[var(--line)]">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8CC63F]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#545454]">
                <span className="w-2 h-2 rounded-full bg-[#8CC63F] animate-pulse" />
                {arrival.externalSystemName} Verified Feed
              </span>
              <span className="text-xs text-[var(--ink-muted)] font-mono">
                ID: {arrival.externalRecordId ?? "N/A"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
              {arrival.name ?? "Untitled Record"}
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Pushed to CIRKA • {formatDateTime(arrival.arrivedAt)}
            </p>
          </div>

          {arrival.externalRecordUrl && (
            <a
              href={arrival.externalRecordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[#FF5C00] hover:text-[#FF5C00]"
            >
              Open in {arrival.externalSystemName}
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Network Node Data Pipeline Banner (Cirka SOT Visual Motif) */}
        <div className="rounded-xl bg-[#545454]/5 border border-[#545454]/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-full bg-[#545454] flex items-center justify-center text-white shrink-0 font-mono text-xs font-bold">
              R
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                {arrival.externalSystemName}
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">External Sorting Engine</p>
            </div>
          </div>

          {/* Connection Line with Orange Node */}
          <div className="flex-1 max-w-xs w-full flex items-center gap-2 px-2">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-[#545454]/30 via-[#FF5C00] to-[#8CC63F]" />
            <div className="w-3 h-3 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00] shrink-0" />
            <div className="h-0.5 flex-1 bg-gradient-to-r from-[#FF5C00] via-[#8CC63F] to-[#8CC63F]/30" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                CIRKA Ledger
              </p>
              <p className="text-[11px] text-[#8CC63F] font-semibold">Intake Verification</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-white shrink-0 font-bold text-xs">
              C
            </div>
          </div>
        </div>

        {arrival.updateOf && (
          <div className="rounded-xl border-l-4 border-l-[#FF5C00] bg-[#FF5C00]/5 p-4">
            <h4 className="text-sm font-bold text-[var(--ink)]">Updating Existing Batch Record</h4>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Confirming this record will update <strong>{arrival.updateOf.reference}</strong> ({arrival.updateOf.name}) rather than creating a duplicate entry.
            </p>
          </div>
        )}

        {/* Material Specification Grid */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Material Specifications
            </h3>
            {correcting && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5C00]">
                Editing mode active
              </span>
            )}
          </div>

          {correcting ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-[var(--line)] bg-[var(--surface)]">
              <Field label="Name" required>
                <Input
                  value={correction.name ?? ""}
                  onChange={(event) => patch("name", event.target.value)}
                  className="bg-white"
                />
              </Field>
              <Field label="Material Category" required>
                <Select
                  value={correction.materialCategory ?? ""}
                  onChange={(event) => patch("materialCategory", event.target.value as MaterialCategory)}
                  className="bg-white"
                >
                  <option value="">Select a category</option>
                  {MATERIAL_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {categoryLabel(option)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" required>
                  <Input
                    value={correction.description ?? ""}
                    onChange={(event) => patch("description", event.target.value)}
                    className="bg-white"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <Field label="Quantity" required>
                  <Input
                    type="number"
                    value={correction.quantity ?? ""}
                    onChange={(event) => patch("quantity", Number(event.target.value))}
                    className="bg-white"
                  />
                </Field>
                <Field label="Unit" required>
                  <Select
                    value={correction.unit ?? ""}
                    onChange={(event) => patch("unit", event.target.value as Unit)}
                    className="bg-white"
                  >
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
                  className="bg-white"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={correction.locationText ?? ""}
                  onChange={(event) => patch("locationText", event.target.value)}
                  className="bg-white"
                />
              </Field>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] overflow-hidden">
              <SpecRow
                label="Description"
                value={arrival.description}
                source={arrival.externalSystemName}
                fullWidth
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
                <SpecRow
                  label="Material Category"
                  value={arrival.materialCategory ? categoryLabel(arrival.materialCategory) : undefined}
                  source={arrival.externalSystemName}
                />
                <SpecRow
                  label="Quantity"
                  value={arrival.quantity !== undefined && arrival.unit ? formatQuantity(arrival.quantity, arrival.unit) : undefined}
                  source={arrival.externalSystemName}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
                <SpecRow
                  label="Composition"
                  value={arrival.composition}
                  source={arrival.externalSystemName}
                />
                <SpecRow
                  label="Location"
                  value={arrival.locationText}
                  source={arrival.externalSystemName}
                />
              </div>
            </div>
          )}
        </div>
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

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
        <Button
          variant="ghost"
          disabled={confirmAction.pending || skipAction.pending}
          onClick={() => skipAction.run(() => store.skipArrival("manufacturer", { arrivalId: arrival._id }))}
          className="text-[var(--ink-muted)] hover:text-[#545454] hover:bg-[var(--surface)] font-medium"
        >
          Skip for now
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={confirmAction.pending || skipAction.pending}
            onClick={() => setCorrecting((current) => !current)}
            className="border-[var(--line-strong)] text-[var(--ink)] font-semibold hover:border-[#FF5C00]"
          >
            {correcting ? "Cancel Corrections" : "Edit Fields"}
          </Button>
          <Button
            disabled={confirmAction.pending || skipAction.pending}
            onClick={() =>
              confirmAction.run(() =>
                store.confirmArrival("manufacturer", {
                  arrivalId: arrival._id,
                  correction: correcting ? correction : undefined,
                }),
              )
            }
            className="bg-[#FF5C00] hover:bg-[#E55300] text-white font-semibold border-transparent shadow-md shadow-[#FF5C00]/25 px-6 py-2.5"
          >
            {arrival.updateOf ? "Confirm Update" : "Confirm Record"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  source,
  fullWidth = false,
}: {
  label: string;
  value?: string;
  source: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`p-4 bg-white hover:bg-[var(--surface)]/50 transition-colors ${fullWidth ? "" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)] mb-1.5">
        {label}
      </p>
      {value === undefined || value === "" ? (
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#FF5C00]/10 px-2.5 py-1 text-xs font-semibold text-[#FF5C00]">
          CIRKA required field — missing from {source}
        </div>
      ) : (
        <p className="text-sm font-semibold text-[var(--ink)] leading-snug">
          {value}
        </p>
      )}
    </div>
  );
}
