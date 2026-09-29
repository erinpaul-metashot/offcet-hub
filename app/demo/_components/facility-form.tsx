"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { classNames } from "@/lib/utils";
import { FACILITY_TYPES, type FacilityType } from "../_mock/domain";
import type { FacilityInput } from "../_mock/operations/facilities";
import type { Facility, Id } from "../_mock/types";
import { FormSection, NoticeBanner } from "./cirka-ui";
import { useLabels } from "./use-labels";

/**
 * Every writable column of the `facilities` table (06_DATA_MODEL §facilities).
 * Coordinates are held as strings so a half-typed value is never a `NaN`.
 */
interface FacilityFormState {
  name: string;
  type: FacilityType;
  addressLine: string;
  city: string;
  postcode: string;
  country: string;
  latitude: string;
  longitude: string;
  contactName: string;
  contactEmail: string;
  storageCapacityKg: string;
}

function fromFacility(facility: Facility): FacilityFormState {
  return {
    name: facility.name,
    type: facility.type,
    addressLine: facility.addressLine,
    city: facility.city ?? "",
    postcode: facility.postcode ?? "",
    country: facility.country,
    latitude: facility.latitude !== undefined ? String(facility.latitude) : "",
    longitude: facility.longitude !== undefined ? String(facility.longitude) : "",
    contactName: facility.contactName ?? "",
    contactEmail: facility.contactEmail ?? "",
    storageCapacityKg:
      facility.storageCapacityKg !== undefined ? String(facility.storageCapacityKg) : "",
  };
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

export function FacilityForm({
  orgId,
  facility,
  error,
  pending,
  onSubmit,
  onCancel,
}: {
  /** Whose site this is. Fixed: this form is scoped to one organisation. */
  orgId: Id;
  /** Absent when adding a new site. */
  facility?: Facility;
  error?: string | null;
  pending: boolean;
  onSubmit: (input: FacilityInput) => void;
  onCancel: () => void;
}) {
  const isEdit = facility !== undefined;
  const { facilityForm: t, ui } = useMessages(demoCommon);
  const labels = useLabels();
  const [form, setForm] = useState<FacilityFormState>(() =>
    facility
      ? fromFacility(facility)
      : {
          name: "",
          type: "source",
          addressLine: "",
          city: "",
          postcode: "",
          country: "",
          latitude: "",
          longitude: "",
          contactName: "",
          contactEmail: "",
          storageCapacityKg: "",
        },
  );

  const update = <K extends keyof FacilityFormState>(key: K, value: FacilityFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const countryLooksWrong =
    form.country.trim() !== "" && !/^[A-Za-z]{2}$/.test(form.country.trim());
  const emailLooksWrong =
    form.contactEmail.trim() !== "" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.contactEmail.trim());
  const capacityLooksWrong =
    form.storageCapacityKg.trim() !== "" && (toNumber(form.storageCapacityKg) ?? 0) <= 0;

  const canSubmit =
    form.name.trim() !== "" &&
    form.addressLine.trim() !== "" &&
    form.country.trim() !== "" &&
    !countryLooksWrong &&
    !emailLooksWrong &&
    !capacityLooksWrong;

  /* Every key is sent, so an emptied optional field clears its column. */
  const toInput = (): FacilityInput => ({
    orgId,
    name: form.name,
    type: form.type,
    addressLine: form.addressLine,
    city: form.city,
    postcode: form.postcode,
    country: form.country,
    latitude: toNumber(form.latitude),
    longitude: toNumber(form.longitude),
    contactName: form.contactName,
    contactEmail: form.contactEmail,
    storageCapacityKg: toNumber(form.storageCapacityKg),
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(toInput());
      }}
    >
      {error && (
        <NoticeBanner tone="blocking" title={ui.refused}>
          {error}
        </NoticeBanner>
      )}

      <FormSection title={t.site}>
        <Field label={t.name} required>
          <Input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t.namePlaceholder}
            autoFocus
          />
        </Field>
        <Field label={t.type}>
          <Select
            value={form.type}
            onChange={(event) => update("type", event.target.value as FacilityType)}
          >
            {FACILITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {labels.FACILITY_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <FormSection title={t.address}>
        <Field label={t.street} required>
          <Input
            value={form.addressLine}
            onChange={(event) => update("addressLine", event.target.value)}
            placeholder="Industrigatan 14"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.city}>
            <Input
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="Malmö"
            />
          </Field>
          <Field label={t.postcode}>
            <Input
              value={form.postcode}
              onChange={(event) => update("postcode", event.target.value)}
              placeholder="211 20"
            />
          </Field>
          <Field
            label={t.country}
            required
            error={countryLooksWrong ? t.countryError : undefined}
          >
            <Input
              value={form.country}
              onChange={(event) => update("country", event.target.value.toUpperCase())}
              placeholder="SE"
              maxLength={2}
              className={classNames(form.country !== "" && "uppercase tracking-[0.1em]")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t.capacity}>
        <Field
          label={t.storageCapacity}
          error={capacityLooksWrong ? t.capacityError : undefined}
        >
          <Input
            type="number"
            min="0"
            step="1"
            value={form.storageCapacityKg}
            onChange={(event) => update("storageCapacityKg", event.target.value)}
            placeholder={t.noLimit}
          />
        </Field>
      </FormSection>

      <FormSection title={t.coordinates} hint={t.optional}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.latitude}>
            <Input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={form.latitude}
              onChange={(event) => update("latitude", event.target.value)}
              placeholder="55.6050"
            />
          </Field>
          <Field label={t.longitude}>
            <Input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={form.longitude}
              onChange={(event) => update("longitude", event.target.value)}
              placeholder="13.0038"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t.siteContact} hint={t.protected}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.contactName}>
            <Input
              value={form.contactName}
              onChange={(event) => update("contactName", event.target.value)}
              placeholder={t.contactNamePlaceholder}
            />
          </Field>
          <Field
            label={t.contactEmail}
            error={emailLooksWrong ? t.emailError : undefined}
          >
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(event) => update("contactEmail", event.target.value)}
              placeholder="site@company.com"
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={pending || !canSubmit}>
          {isEdit ? t.save : t.add}
        </Button>
      </div>
    </form>
  );
}
