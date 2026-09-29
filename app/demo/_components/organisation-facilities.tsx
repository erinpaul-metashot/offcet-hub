"use client";

import { useState } from "react";
import { MapPin, UserRound } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { FacilityInput, FacilityPatch } from "../_mock/operations/facilities";
import type { OrganisationFacility } from "../_mock/selectors-admin";
import { useDemoStore } from "../_mock/store";
import type { Facility, Organisation } from "../_mock/types";
import { CirkaBadge, ConfirmDialog, Modal, NoticeBanner } from "./cirka-ui";
import { FacilityForm } from "./facility-form";
import { useAction } from "./use-action";
import { useLabels } from "./use-labels";

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

/** What is recorded against the site: the reason it may not be removable. */
function Reference({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm font-semibold tabular-nums text-[var(--ink)]">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </span>
    </div>
  );
}

function addressOf(facility: Facility): string {
  return [facility.addressLine, facility.city, facility.postcode, facility.country]
    .filter(Boolean)
    .join(", ");
}

/**
 * The organisation's sites, and everything an admin can do to them.
 *
 * A site that material has moved through cannot be removed at all: the batches
 * recorded against it must keep pointing at a real record: so the row shows
 * the counts that block it and offers deactivation instead.
 */
export function OrganisationFacilities({
  organisation,
  facilities,
}: {
  organisation: Organisation;
  facilities: OrganisationFacility[];
}) {
  const store = useDemoStore();
  /* Three surfaces, three errors: a refused row action must not appear in the form. */
  const rowAction = useAction();
  const form = useAction();
  const removal = useAction();
  const { orgFacilities: t } = useMessages(demoAdmin);
  /** Site vocabulary shared with the manufacturer and custodian facilities screens. */
  const { facilities: c } = useMessages(demoCommon);
  const labels = useLabels();

  /** `null` = closed. An entry with no `facility` is a new site. */
  const [editing, setEditing] = useState<{ facility?: Facility } | null>(null);
  const [removing, setRemoving] = useState<Facility | null>(null);

  const activeCount = facilities.filter((entry) => entry.facility.isActive).length;

  const closeForm = () => {
    form.clearError();
    setEditing(null);
  };

  const closeRemoval = () => {
    removal.clearError();
    setRemoving(null);
  };

  const handleSubmit = async (input: FacilityInput) => {
    const target = editing?.facility;

    const ok = await form.run(() =>
      target
        ? store.updateFacility("admin", { facilityId: target._id, patch: toPatch(input) })
        : store.createFacility("admin", { ...input, orgId: organisation._id }),
    );

    if (ok) {
      setEditing(null);
    }
  };

  const handleRemove = async (facility: Facility) => {
    const ok = await removal.run(() =>
      store.removeFacility("admin", { facilityId: facility._id }),
    );

    if (ok) {
      setRemoving(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{format(t.title, { count: facilities.length })}</h3>
          {activeCount !== facilities.length && (
            <p className="text-xs tabular-nums text-[var(--ink-muted)]">
              {format(c.activeSplit, { active: activeCount, inactive: facilities.length - activeCount })}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setEditing({})}>
          {c.addSite}
        </Button>
      </div>

      {rowAction.error && (
        <NoticeBanner tone="blocking" title={t.refused}>
          {rowAction.error}
        </NoticeBanner>
      )}

      {facilities.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">{c.noSites}</p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden p-0">
          <ul className="animate-stagger-in">
            {facilities.map(
              ({ facility, batchCount, allocationCount, productionCount, canRemove }) => (
                <li
                  key={facility._id}
                  className="grid gap-3 border-b border-[var(--line)] px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">{facility.name}</p>
                      <span className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {labels.FACILITY_TYPE_LABELS[facility.type]}
                      </span>
                      {!facility.isActive && <CirkaBadge status="disabled" label={c.deactivated} />}
                    </div>

                    <p className="flex items-start gap-1.5 text-[13px] text-[var(--ink-muted)]">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span>
                        {addressOf(facility)}
                        {facility.latitude !== undefined && facility.longitude !== undefined && (
                          <span className="ml-2 tabular-nums opacity-70">
                            {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
                          </span>
                        )}
                      </span>
                    </p>

                    {(facility.contactName || facility.contactEmail) && (
                      <p className="flex items-center gap-1.5 text-[13px] text-[var(--ink-muted)]">
                        <UserRound size={13} className="shrink-0" />
                        <span className="truncate">
                          {[facility.contactName, facility.contactEmail]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </p>
                    )}

                    {!canRemove && (
                      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 pt-0.5">
                        <Reference label={t.batches} value={batchCount} />
                        <Reference label={t.allocations} value={allocationCount} />
                        <Reference label={t.production} value={productionCount} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing({ facility })}
                      disabled={rowAction.pending}
                    >
                      {c.edit}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={rowAction.pending}
                      onClick={() =>
                        rowAction.run(() =>
                          store.setFacilityActive("admin", {
                            facilityId: facility._id,
                            isActive: !facility.isActive,
                          }),
                        )
                      }
                    >
                      {facility.isActive ? c.deactivate : c.activate}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="border-[#E4A9A9] text-[#B93A3A] hover:bg-[#FBE2E2]"
                      disabled={rowAction.pending || !canRemove}
                      title={
                        canRemove
                          ? undefined
                          : t.cannotRemove
                      }
                      onClick={() => setRemoving(facility)}
                    >
                      {t.remove}
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </Panel>
      )}

      {editing && (
        <Modal
          eyebrow={editing.facility ? c.editSite : undefined}
          title={editing.facility?.name ?? c.newSite}
          onClose={closeForm}
        >
          <FacilityForm
            key={editing.facility?._id ?? "new"}
            orgId={organisation._id}
            facility={editing.facility}
            error={form.error}
            pending={form.pending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {removing && (
        <ConfirmDialog
          title={format(t.removeTitle, { name: removing.name })}
          confirmLabel={t.removeConfirm}
          error={removal.error}
          pending={removal.pending}
          onCancel={closeRemoval}
          onConfirm={() => handleRemove(removing)}
          body={t.removeBody}
        />
      )}
    </section>
  );
}
