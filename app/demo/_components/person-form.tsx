"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  CIRKA_ROLES,
  ORG_ROLES,
  ORG_ROLE_DESCRIPTIONS,
  ORG_ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type CirkaRole,
  type OrgRole,
} from "../_mock/domain";
import type { UserInput } from "../_mock/operations/admin";
import type { Id, Organisation, User } from "../_mock/types";
import { FormSection, NoticeBanner } from "./cirka-ui";

/** Every writable column of the `users` table (06_DATA_MODEL §users). */
interface PersonFormState {
  name: string;
  email: string;
  phone: string;
  role: CirkaRole;
  orgRole: OrgRole;
}

/** The organisation's own type is the role its people almost always hold. */
function defaultRoleFor(organisation: Organisation): CirkaRole {
  return CIRKA_ROLES.includes(organisation.type as CirkaRole)
    ? (organisation.type as CirkaRole)
    : "admin";
}

function fromUser(user: User): PersonFormState {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    orgRole: user.orgRole,
  };
}

export function PersonForm({
  organisation,
  person,
  error,
  pending,
  onSubmit,
  onCancel,
}: {
  /** The organisation the person belongs to. Fixed — this form is scoped to it. */
  organisation: Organisation;
  /** Absent when adding someone new. */
  person?: User;
  error?: string | null;
  pending: boolean;
  onSubmit: (input: UserInput) => void;
  onCancel: () => void;
}) {
  const isEdit = person !== undefined;
  const [form, setForm] = useState<PersonFormState>(() =>
    person
      ? fromUser(person)
      : {
          name: "",
          email: "",
          phone: "",
          role: defaultRoleFor(organisation),
          orgRole: "member",
        },
  );

  const update = <K extends keyof PersonFormState>(key: K, value: PersonFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const emailLooksWrong = form.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim());
  const canSubmit = form.name.trim() !== "" && form.email.trim() !== "" && !emailLooksWrong;

  /* Every key is sent, so an emptied phone number clears the column. */
  const toInput = (): UserInput => ({
    name: form.name,
    email: form.email,
    phone: form.phone,
    role: form.role,
    orgRole: form.orgRole,
    orgId: organisation._id as Id,
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
        <NoticeBanner tone="blocking" title="That change was refused">
          {error}
        </NoticeBanner>
      )}

      <FormSection title="Person">
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Full name"
            autoFocus
          />
        </Field>
      </FormSection>

      <FormSection
        title="Contact"
        hint="Protected — visible only to CIRKA and this organisation."
      >
        <Field
          label="Email"
          required
          error={emailLooksWrong ? "That is not a valid email address" : undefined}
          hint={emailLooksWrong ? undefined : "Doubles as the login."}
        >
          <Input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="name@company.com"
          />
        </Field>
        <Field label="Phone" hint="Optional — recorded only where it is needed.">
          <Input
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+46 70 123 45 67"
          />
        </Field>
      </FormSection>

      <FormSection title="Access">
        <Field label="CIRKA role" hint={ROLE_DESCRIPTIONS[form.role]}>
          <Select
            value={form.role}
            onChange={(event) => update("role", event.target.value as CirkaRole)}
          >
            {CIRKA_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Organisation role" hint={ORG_ROLE_DESCRIPTIONS[form.orgRole]}>
          <Select
            value={form.orgRole}
            onChange={(event) => update("orgRole", event.target.value as OrgRole)}
          >
            {ORG_ROLES.map((orgRole) => (
              <option key={orgRole} value={orgRole}>
                {ORG_ROLE_LABELS[orgRole]}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !canSubmit}>
          {isEdit ? "Save changes" : "Add person"}
        </Button>
      </div>
    </form>
  );
}
