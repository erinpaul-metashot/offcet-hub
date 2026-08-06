"use client";

import { useState, type KeyboardEvent } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { classNames } from "@/lib/utils";
import { ORGANISATION_TYPES, ORGANISATION_TYPE_LABELS, type OrganisationType } from "../_mock/domain";
import type { OrganisationInput } from "../_mock/operations/admin";
import type { Organisation } from "../_mock/types";
import { FormSection, NoticeBanner } from "./cirka-ui";

/**
 * Every writable column of the `organisations` table (06_DATA_MODEL). The form
 * holds numbers as strings so a half-typed coordinate is never a `NaN`, and
 * parses on submit.
 */
interface OrganisationFormState {
  name: string;
  type: OrganisationType;
  registrationNumber: string;
  taxId: string;
  addressLine: string;
  city: string;
  postcode: string;
  country: string;
  latitude: string;
  longitude: string;
  websiteUrl: string;
  description: string;
  capabilityTags: string[];
}

const EMPTY: OrganisationFormState = {
  name: "",
  type: "brand",
  registrationNumber: "",
  taxId: "",
  addressLine: "",
  city: "",
  postcode: "",
  country: "",
  latitude: "",
  longitude: "",
  websiteUrl: "",
  description: "",
  capabilityTags: [],
};

function fromOrganisation(org: Organisation): OrganisationFormState {
  return {
    name: org.name,
    type: org.type,
    registrationNumber: org.registrationNumber ?? "",
    taxId: org.taxId ?? "",
    addressLine: org.addressLine ?? "",
    city: org.city ?? "",
    postcode: org.postcode ?? "",
    country: org.country,
    latitude: org.latitude !== undefined ? String(org.latitude) : "",
    longitude: org.longitude !== undefined ? String(org.longitude) : "",
    websiteUrl: org.websiteUrl ?? "",
    description: org.description ?? "",
    capabilityTags: [...org.capabilityTags],
  };
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

/**
 * Sends every key, including the empty ones: `updateOrganisation` reads key
 * presence, so an emptied field clears the column rather than being ignored.
 */
function toInput(form: OrganisationFormState): OrganisationInput {
  return {
    name: form.name,
    type: form.type,
    registrationNumber: form.registrationNumber,
    taxId: form.taxId,
    addressLine: form.addressLine,
    city: form.city,
    postcode: form.postcode,
    country: form.country,
    latitude: toNumber(form.latitude),
    longitude: toNumber(form.longitude),
    websiteUrl: form.websiteUrl,
    description: form.description,
    capabilityTags: form.capabilityTags,
  };
}

/** Free-text tags, committed on Enter or comma so the set stays explicit. */
function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim().toLowerCase();

    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }

    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder="cutting, sewing, cold storage…"
      />
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onChange(tags.filter((entry) => entry !== tag))}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] py-1 pl-3 pr-2 text-xs text-[var(--ink)] transition-colors duration-200 ease-[var(--ease-out)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                aria-label={`Remove ${tag}`}
              >
                {tag}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="opacity-40 transition-opacity duration-200 ease-[var(--ease-out)] group-hover:opacity-100"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrganisationForm({
  organisation,
  error,
  pending,
  onSubmit,
  onCancel,
}: {
  /** Absent when registering a new organisation. */
  organisation?: Organisation;
  error?: string | null;
  pending: boolean;
  onSubmit: (input: OrganisationInput) => void;
  onCancel: () => void;
}) {
  const isEdit = organisation !== undefined;
  const [form, setForm] = useState<OrganisationFormState>(() =>
    organisation ? fromOrganisation(organisation) : EMPTY,
  );

  const update = <K extends keyof OrganisationFormState>(
    key: K,
    value: OrganisationFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const countryLooksWrong = form.country.trim() !== "" && !/^[A-Za-z]{2}$/.test(form.country.trim());
  const canSubmit = form.name.trim() !== "" && form.country.trim() !== "" && !countryLooksWrong;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(toInput(form));
      }}
    >
      {error && (
        <NoticeBanner tone="blocking" title="That change was refused">
          {error}
        </NoticeBanner>
      )}

      <FormSection title="Identity">
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Legal or trading name"
            autoFocus
          />
        </Field>
        <Field
          label="Type"
          hint={isEdit ? "Fixed at registration: register a new organisation to change it." : undefined}
        >
          <Select
            value={form.type}
            onChange={(event) => update("type", event.target.value as OrganisationType)}
            disabled={isEdit}
          >
            {ORGANISATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {ORGANISATION_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="What they do, in a sentence or two."
          />
        </Field>
      </FormSection>

      <FormSection
        title="Registration"
        hint="Protected"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company number">
            <Input
              value={form.registrationNumber}
              onChange={(event) => update("registrationNumber", event.target.value)}
              placeholder="556812-4497"
            />
          </Field>
          <Field label="Tax / VAT reference">
            <Input
              value={form.taxId}
              onChange={(event) => update("taxId", event.target.value)}
              placeholder="SE556812449701"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Registered address">
        <Field label="Address">
          <Input
            value={form.addressLine}
            onChange={(event) => update("addressLine", event.target.value)}
            placeholder="Industrigatan 14"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <Input
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="Norrköping"
            />
          </Field>
          <Field label="Postcode">
            <Input
              value={form.postcode}
              onChange={(event) => update("postcode", event.target.value)}
              placeholder="602 28"
            />
          </Field>
          <Field
            label="Country"
            required
            error={countryLooksWrong ? "Two-letter ISO code" : undefined}
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

      <FormSection
        title="Coordinates"
        hint="Optional · ranks distance in matching"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude">
            <Input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={form.latitude}
              onChange={(event) => update("latitude", event.target.value)}
              placeholder="58.5877"
            />
          </Field>
          <Field label="Longitude">
            <Input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={form.longitude}
              onChange={(event) => update("longitude", event.target.value)}
              placeholder="16.1920"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Profile">
        <Field label="Website">
          <Input
            value={form.websiteUrl}
            onChange={(event) => update("websiteUrl", event.target.value)}
            placeholder="https://example.com"
          />
        </Field>
        <Field
          label="Capability tags"
          hint="Enter or comma to add"
        >
          <TagInput tags={form.capabilityTags} onChange={(next) => update("capabilityTags", next)} />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !canSubmit}>
          {isEdit ? "Save changes" : "Create organisation"}
        </Button>
      </div>
    </form>
  );
}
