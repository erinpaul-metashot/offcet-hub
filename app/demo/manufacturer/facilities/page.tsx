"use client";

import { useState } from "react";
import { MapPin, UserRound, HardDrive, Building2, Boxes, Plus } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { classNames } from "@/lib/utils";
import { FACILITY_TYPE_LABELS, MATERIAL_CATEGORY_LABELS } from "../../_mock/domain";
import type { FacilityInput, FacilityPatch } from "../../_mock/operations/facilities";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import type { Facility } from "../../_mock/types";
import { CirkaBadge, Modal, NoticeBanner, SectionHeading, ViewModeToggle } from "../../_components/cirka-ui";
import { FacilityForm } from "../../_components/facility-form";
import { useAction } from "../../_components/use-action";
import { batchActiveQuantity, formatQuantity } from "../../_mock/selectors-shared";

/**
 * A site never changes hands, so the patch deliberately drops `orgId`. Every
 * other key is sent even when empty: `updateFacility` reads key presence, so
 * an emptied field clears its column instead of being ignored.
 */
function toPatch(input: FacilityInput): FacilityPatch {
  return {
    name: input.name,
    type: input.type,
    addressLine: input.addressLine,
    city: input.city,
    postcode: input.postcode,
    country: input.country,
    latitude: input.latitude,
    longitude: input.longitude,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    storageCapacityKg: input.storageCapacityKg,
  };
}

function addressOf(facility: Facility): string {
  return [facility.addressLine, facility.city, facility.postcode, facility.country]
    .filter(Boolean)
    .join(", ");
}

export default function ManufacturerFacilitiesPage() {
  const store = useDemoStore();
  const { scope, organisation } = useDemoPersona("manufacturer");
  const rowAction = useAction();
  const form = useAction();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const facilities = store.db.facilities.filter(
    (facility) => facility.orgId === scope.orgId && !facility.deletedAt,
  );

  /** `null` = closed. An entry with no `facility` is a new site. */
  const [editing, setEditing] = useState<{ facility?: Facility } | null>(null);

  const activeCount = facilities.filter((facility) => facility.isActive).length;

  // Aggregate metrics across facilities
  const facilityMetrics = facilities.map((facility) => {
    const batches = store.db.resourceBatches.filter(
      (b) => b.sourceFacilityId === facility._id && !b.deletedAt,
    );
    const occupiedKg = batches.reduce(
      (sum, batch) => sum + batchActiveQuantity(batch),
      0,
    );
    const capacityKg = facility.storageCapacityKg;
    const remainingKg =
      capacityKg !== undefined ? Math.max(0, capacityKg - occupiedKg) : undefined;
    const utilizationPct =
      capacityKg && capacityKg > 0
        ? Math.min(100, Math.round((occupiedKg / capacityKg) * 1000) / 10)
        : undefined;

    return {
      facility,
      batches,
      occupiedKg,
      capacityKg,
      remainingKg,
      utilizationPct,
    };
  });

  const totalCapacityKg = facilities.reduce(
    (sum, fac) => sum + (fac.storageCapacityKg ?? 0),
    0,
  );
  const facilitiesWithCapacityCount = facilities.filter(
    (fac) => fac.storageCapacityKg !== undefined && fac.storageCapacityKg > 0,
  ).length;
  const totalOccupiedKg = facilityMetrics.reduce(
    (sum, m) => sum + m.occupiedKg,
    0,
  );
  const totalRemainingKg =
    totalCapacityKg > 0 ? Math.max(0, totalCapacityKg - totalOccupiedKg) : 0;
  const overallUtilizationPct =
    totalCapacityKg > 0
      ? Math.min(100, (totalOccupiedKg / totalCapacityKg) * 100)
      : 0;
  const totalBatchesCount = facilityMetrics.reduce(
    (sum, m) => sum + m.batches.length,
    0,
  );

  const closeForm = () => {
    form.clearError();
    setEditing(null);
  };

  const handleSubmit = async (input: FacilityInput) => {
    const target = editing?.facility;

    const ok = await form.run(() =>
      target
        ? store.updateFacility("manufacturer", { facilityId: target._id, patch: toPatch(input) })
        : store.createFacility("manufacturer", input),
    );

    if (ok) {
      setEditing(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading 
        title="Manufacturing Facilities" 
        eyebrow="Sites & Storage Capacity"
      />

      {rowAction.error && (
        <NoticeBanner tone="blocking" title="That change was refused">
          {rowAction.error}
        </NoticeBanner>
      )}

      {/* Facility Capacity Quick Gauge */}
      {totalCapacityKg > 0 && (
        <Panel className="p-4 bg-[var(--paper)]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <HardDrive size={14} className="text-[var(--brand-primary)]" />
              <span className="font-semibold text-[var(--ink)]">Total Storage Capacity Utilization</span>
            </div>
            <span className="font-medium tabular-nums text-[var(--ink-muted)]">
              <span className="text-[var(--ink)] font-semibold">{formatQuantity(totalOccupiedKg, "kg")}</span> / {formatQuantity(totalCapacityKg, "kg")} ({overallUtilizationPct.toFixed(1)}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className={classNames(
                "h-full transition-all duration-500 ease-out",
                overallUtilizationPct > 90
                  ? "bg-[#D14343]"
                  : overallUtilizationPct > 75
                  ? "bg-[#FF5C00]"
                  : "bg-[#8CC63F]",
              )}
              style={{ width: `${Math.min(overallUtilizationPct, 100)}%` }}
            />
          </div>
        </Panel>
      )}

      {/* Subheader & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Sites ({facilities.length})</h2>
          {activeCount !== facilities.length && (
            <p className="text-xs tabular-nums text-[var(--ink-muted)]">
              {activeCount} active · {facilities.length - activeCount} deactivated
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus size={14} className="mr-1.5" />
            Add site
          </Button>
        </div>
      </div>

      {facilities.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">No sites recorded</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            A batch needs a source site.
          </p>
        </Panel>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-stagger-in">
          {facilityMetrics.map(
            ({ facility, batches, occupiedKg, capacityKg, remainingKg, utilizationPct }) => {
              const categories = Array.from(
                new Set(batches.map((batch) => batch.materialCategory)),
              ).slice(0, 3);

              return (
                <Panel
                  key={facility._id}
                  className="flex flex-col justify-between space-y-4 p-5 transition-all hover:border-[var(--line-strong)]"
                >
                  <div className="space-y-3">
                    {/* Header: Name, Type, Status */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-[var(--ink)] truncate">
                            {facility.name}
                          </h3>
                          <span className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                            {FACILITY_TYPE_LABELS[facility.type]}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                          <MapPin size={13} className="shrink-0 text-[var(--ink-muted)]" />
                          <span className="truncate">{addressOf(facility)}</span>
                        </p>
                      </div>

                      {facility.isActive ? (
                        <CirkaBadge status="available" label="Active" />
                      ) : (
                        <CirkaBadge status="disabled" label="Deactivated" />
                      )}
                    </div>

                    {/* Contact Person */}
                    {(facility.contactName || facility.contactEmail) && (
                      <p className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)] border-t border-[var(--line)]/60 pt-2.5">
                        <UserRound size={13} className="shrink-0" />
                        <span className="truncate">
                          {[facility.contactName, facility.contactEmail].filter(Boolean).join(" · ")}
                        </span>
                      </p>
                    )}

                    {/* Visual Capacity & Utilization Gauge */}
                    <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <HardDrive size={13} className="text-[var(--brand-primary)]" />
                          <span className="font-semibold text-[var(--ink)]">Storage Capacity</span>
                        </div>
                        {utilizationPct !== undefined ? (
                          <span
                            className={classNames(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                              utilizationPct > 90
                                ? "bg-[#FDE8E8] text-[#D14343]"
                                : utilizationPct > 75
                                ? "bg-[#FFF0E6] text-[#FF5C00]"
                                : "bg-[#F2F9E8] text-[#4A7318]",
                            )}
                          >
                            {utilizationPct.toFixed(0)}% Occupied
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                            Uncapped
                          </span>
                        )}
                      </div>

                      {/* Visual progress bar */}
                      {capacityKg && capacityKg > 0 ? (
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--paper)]">
                          <div
                            className={classNames(
                              "h-full transition-all duration-500 ease-out",
                              (utilizationPct ?? 0) > 90
                                ? "bg-[#D14343]"
                                : (utilizationPct ?? 0) > 75
                                ? "bg-[#FF5C00]"
                                : "bg-[#8CC63F]",
                            )}
                            style={{ width: `${Math.min(utilizationPct ?? 0, 100)}%` }}
                          />
                        </div>
                      ) : null}

                      {/* Compact Storage Numbers */}
                      <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] pt-0.5">
                        <span className="font-medium text-[var(--ink)]">
                          {formatQuantity(occupiedKg, "kg")}{" "}
                          <span className="font-normal text-[var(--ink-muted)]">
                            / {capacityKg !== undefined ? formatQuantity(capacityKg, "kg") : "∞"}
                          </span>
                        </span>
                        <span>
                          {remainingKg !== undefined ? `${formatQuantity(remainingKg, "kg")} free` : "Flexible capacity"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Batches, Categories, Actions */}
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium text-[var(--ink)]">
                        {batches.length} batch{batches.length === 1 ? "" : "es"}
                      </span>
                      {categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--ink-muted)]"
                        >
                          {MATERIAL_CATEGORY_LABELS[category]}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditing({ facility })}
                        disabled={rowAction.pending}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={rowAction.pending}
                        onClick={() =>
                          rowAction.run(() =>
                            store.setFacilityActive("manufacturer", {
                              facilityId: facility._id,
                              isActive: !facility.isActive,
                            }),
                          )
                        }
                      >
                        {facility.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </Panel>
              );
            },
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <Panel className="overflow-hidden p-0">
          <ul className="animate-stagger-in divide-y divide-[var(--line)]">
            {facilityMetrics.map(
              ({ facility, batches, occupiedKg, capacityKg, remainingKg, utilizationPct }) => {
                const categories = Array.from(
                  new Set(batches.map((batch) => batch.materialCategory)),
                ).slice(0, 2);

                return (
                  <li
                    key={facility._id}
                    className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-center sm:gap-6 hover:bg-[var(--surface)]/50 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">{facility.name}</p>
                        <span className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                          {FACILITY_TYPE_LABELS[facility.type]}
                        </span>
                        {facility.isActive ? (
                          <CirkaBadge status="available" label="Active" />
                        ) : (
                          <CirkaBadge status="disabled" label="Deactivated" />
                        )}
                      </div>

                      <p className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)] truncate">
                        <MapPin size={13} className="shrink-0" />
                        <span className="truncate">{addressOf(facility)}</span>
                        {facility.contactName && (
                          <span className="truncate">· Contact: {facility.contactName}</span>
                        )}
                      </p>
                    </div>

                    {/* Inline Capacity Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                          {formatQuantity(occupiedKg, "kg")} / {capacityKg !== undefined ? formatQuantity(capacityKg, "kg") : "Uncapped"}
                        </span>
                        {utilizationPct !== undefined && (
                          <span className="text-[10px] font-bold tabular-nums text-[var(--ink-muted)]">
                            {utilizationPct.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {capacityKg && capacityKg > 0 ? (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                          <div
                            className={classNames(
                              "h-full transition-all duration-500 ease-out",
                              (utilizationPct ?? 0) > 90
                                ? "bg-[#D14343]"
                                : (utilizationPct ?? 0) > 75
                                ? "bg-[#FF5C00]"
                                : "bg-[#8CC63F]",
                            )}
                            style={{ width: `${Math.min(utilizationPct ?? 0, 100)}%` }}
                          />
                        </div>
                      ) : (
                        <div className="h-2 w-full rounded-full bg-[var(--surface)]" />
                      )}
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-2 sm:justify-end shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditing({ facility })}
                        disabled={rowAction.pending}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={rowAction.pending}
                        onClick={() =>
                          rowAction.run(() =>
                            store.setFacilityActive("manufacturer", {
                              facilityId: facility._id,
                              isActive: !facility.isActive,
                            }),
                          )
                        }
                      >
                        {facility.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </li>
                );
              },
            )}
          </ul>
        </Panel>
      )}

      {editing && (
        <Modal
          eyebrow={editing.facility ? "Edit site" : "New site"}
          title={editing.facility?.name ?? `Add a site to ${organisation?.name ?? "your organisation"}`}
          onClose={closeForm}
        >
          <FacilityForm
            key={editing.facility?._id ?? "new"}
            orgId={scope.orgId}
            facility={editing.facility}
            error={form.error}
            pending={form.pending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  );
}

