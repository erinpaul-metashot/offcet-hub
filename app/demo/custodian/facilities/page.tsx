"use client";

import { useState } from "react";
import { MapPin, UserRound } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { FACILITY_TYPE_LABELS } from "../../_mock/domain";
import type { FacilityInput, FacilityPatch } from "../../_mock/operations/facilities";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import type { Facility } from "../../_mock/types";
import { CirkaBadge, Modal, NoticeBanner, SectionHeading } from "../../_components/cirka-ui";
import { FacilityForm } from "../../_components/facility-form";
import { useAction } from "../../_components/use-action";

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

/** How much of the declared capacity is spoken for, org-wide. */
function CapacitySummary({ capacityKg, heldKg }: { capacityKg: number; heldKg: number }) {
  const pct = capacityKg > 0 ? Math.min((heldKg / capacityKg) * 100, 100) : 0;
  const tight = capacityKg > 0 && heldKg / capacityKg >= 0.9;

  return (
    <Panel className="space-y-3 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Warehouse capacity
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          <span
            className={[
              "font-semibold tabular-nums",
              tight ? "text-[var(--brand-primary)]" : "text-[var(--ink)]",
            ].join(" ")}
          >
            {formatQuantity(heldKg, "kg")}
          </span>{" "}
          held of {formatQuantity(capacityKg, "kg")} declared
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out)]",
            tight ? "bg-[var(--brand-primary)]" : "bg-[var(--brand-secondary)]",
          ].join(" ")}
          style={{ width: `${Math.max(pct, heldKg > 0 ? 2 : 0)}%` }}
        />
      </div>
      {tight && (
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
          Near capacity
        </p>
      )}
    </Panel>
  );
}

export default function CustodianFacilitiesPage() {
  const store = useDemoStore();
  const { scope, organisation } = useDemoPersona("custodian");
  const rowAction = useAction();
  const form = useAction();

  const facilities = store.db.facilities.filter(
    (facility) => facility.orgId === scope.orgId && !facility.deletedAt,
  );
  const { metrics } = getCustodianDashboard(store.db, scope);

  const capacityKg = facilities
    .filter((facility) => facility.isActive && facility.storageCapacityKg !== undefined)
    .reduce((sum, facility) => sum + (facility.storageCapacityKg ?? 0), 0);

  /** `null` = closed. An entry with no `facility` is a new site. */
  const [editing, setEditing] = useState<{ facility?: Facility } | null>(null);

  const activeCount = facilities.filter((facility) => facility.isActive).length;

  const closeForm = () => {
    form.clearError();
    setEditing(null);
  };

  const handleSubmit = async (input: FacilityInput) => {
    const target = editing?.facility;

    const ok = await form.run(() =>
      target
        ? store.updateFacility("custodian", { facilityId: target._id, patch: toPatch(input) })
        : store.createFacility("custodian", input),
    );

    if (ok) {
      setEditing(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading title="Facilities & Capacity" />

      {rowAction.error && (
        <NoticeBanner tone="blocking" title="That change was refused">
          {rowAction.error}
        </NoticeBanner>
      )}

      {capacityKg > 0 && <CapacitySummary capacityKg={capacityKg} heldKg={metrics.totalHeld} />}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Sites ({facilities.length})</h2>
          {activeCount !== facilities.length && (
            <p className="text-xs tabular-nums text-[var(--ink-muted)]">
              {activeCount} active · {facilities.length - activeCount} deactivated
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setEditing({})}>
          Add site
        </Button>
      </div>

      {facilities.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">No sites recorded</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Declare a warehouse and its capacity.
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden p-0">
          <ul className="animate-stagger-in">
            {facilities.map((facility) => (
              <li
                key={facility._id}
                className="grid gap-3 border-b border-[var(--line)] px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">{facility.name}</p>
                    <span className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {FACILITY_TYPE_LABELS[facility.type]}
                    </span>
                    {facility.isActive ? (
                      <CirkaBadge status="available" label="Active" />
                    ) : (
                      <CirkaBadge status="disabled" label="Deactivated" />
                    )}
                  </div>

                  <p className="flex items-start gap-1.5 text-[13px] text-[var(--ink-muted)]">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span>{addressOf(facility)}</span>
                  </p>

                  {(facility.contactName || facility.contactEmail) && (
                    <p className="flex items-center gap-1.5 text-[13px] text-[var(--ink-muted)]">
                      <UserRound size={13} className="shrink-0" />
                      <span className="truncate">
                        {[facility.contactName, facility.contactEmail]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        Protected
                      </span>
                    </p>
                  )}

                  <p className="text-[13px] text-[var(--ink-muted)]">
                    {facility.storageCapacityKg !== undefined ? (
                      <>
                        Storage capacity{" "}
                        <span className="font-semibold text-[var(--ink)]">
                          {formatQuantity(facility.storageCapacityKg, "kg")}
                        </span>
                      </>
                    ) : (
                      "No storage capacity declared"
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
                        store.setFacilityActive("custodian", {
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
            ))}
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
