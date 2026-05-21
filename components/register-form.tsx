"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { PUBLIC_USER_ROLES, ROLE_LABELS, type PublicUserRole } from "@/types/domain";
import { splitCommaSeparated } from "@/lib/utils";
import { publicRegistrationSchema } from "@/lib/validators";

type FormState = {
  role: PublicUserRole;
  email: string;
  password: string;
  name: string;
  phone: string;
  companyName: string;
  taxId: string;
  address: string;
  warehouseAddress: string;
  goodsTypes: string;
  businessName: string;
  categoriesInterested: string;
  fullName: string;
  serviceDescription: string;
  preferredCategories: string;
};

const initialState: FormState = {
  role: "supplier",
  email: "",
  password: "",
  name: "",
  phone: "",
  companyName: "",
  taxId: "",
  address: "",
  warehouseAddress: "",
  goodsTypes: "",
  businessName: "",
  categoriesInterested: "",
  fullName: "",
  serviceDescription: "",
  preferredCategories: "",
};

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useAction(api.users.registerUser);
  const [state, setState] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const payload =
          state.role === "supplier"
            ? {
                role: state.role,
                email: state.email,
                password: state.password,
                name: state.name,
                phone: state.phone,
                companyName: state.companyName,
                taxId: state.taxId,
                address: state.address,
                warehouseAddress: state.warehouseAddress || undefined,
                goodsTypes: splitCommaSeparated(state.goodsTypes),
              }
            : state.role === "buyer"
              ? {
                  role: state.role,
                  email: state.email,
                  password: state.password,
                  name: state.name,
                  phone: state.phone,
                  businessName: state.businessName,
                  address: state.address,
                  categoriesInterested: splitCommaSeparated(state.categoriesInterested),
                }
              : {
                  role: state.role,
                  email: state.email,
                  password: state.password,
                  name: state.name,
                  phone: state.phone,
                  fullName: state.fullName || state.name,
                  businessName: state.businessName || undefined,
                  address: state.address,
                  serviceDescription: state.serviceDescription || undefined,
                  preferredCategories: splitCommaSeparated(state.preferredCategories),
                };

        publicRegistrationSchema.parse(payload);
        await registerUser(payload);
        router.push("/login?registered=1");
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Registration failed.",
        );
      }
    });
  }

  return (
    <Panel className="w-full max-w-3xl p-8 sm:p-10">
      <div className="mb-8 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
          Role-Based Onboarding
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.05em]">Register your business</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
          Every account enters manual review before dashboard access. Provide the operational details
          admins need to verify the business and route the right lots.
        </p>
      </div>

      <form className="grid gap-6" onSubmit={onSubmit}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Role">
            <Select
              value={state.role}
              onChange={(event) => update("role", event.target.value as PublicUserRole)}
            >
              {PUBLIC_USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Contact Name">
            <Input
              value={state.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Primary contact"
              required
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Email">
            <Input
              type="email"
              value={state.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="contact@company.com"
              required
            />
          </Field>

          <Field label="Phone">
            <Input
              value={state.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+1 555 0100"
              required
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Password" hint="Minimum 8 characters.">
            <Input
              type="password"
              value={state.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Create a password"
              required
            />
          </Field>

          <Field label="Full Address">
            <Textarea
              value={state.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Street, city, state, postal code"
              required
            />
          </Field>
        </div>

        {state.role === "supplier" ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Company Name">
              <Input
                value={state.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                required
              />
            </Field>
            <Field label="Tax ID">
              <Input
                value={state.taxId}
                onChange={(event) => update("taxId", event.target.value)}
                required
              />
            </Field>
            <Field label="Warehouse Address">
              <Textarea
                value={state.warehouseAddress}
                onChange={(event) => update("warehouseAddress", event.target.value)}
                placeholder="Optional second location"
              />
            </Field>
            <Field label="Goods Types" hint="Comma-separated materials or categories.">
              <Textarea
                value={state.goodsTypes}
                onChange={(event) => update("goodsTypes", event.target.value)}
                placeholder="PET resin, corrugated cartons, aluminum scrap"
                required
              />
            </Field>
          </div>
        ) : null}

        {state.role === "buyer" ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Business Name">
              <Input
                value={state.businessName}
                onChange={(event) => update("businessName", event.target.value)}
                required
              />
            </Field>
            <Field label="Categories of Interest" hint="Comma-separated.">
              <Textarea
                value={state.categoriesInterested}
                onChange={(event) => update("categoriesInterested", event.target.value)}
                placeholder="Packaging, plastics, secondary metals"
                required
              />
            </Field>
          </div>
        ) : null}

        {state.role === "agent" ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Agent Full Name">
              <Input
                value={state.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                placeholder="If different from contact"
                required
              />
            </Field>
            <Field label="Business Name">
              <Input
                value={state.businessName}
                onChange={(event) => update("businessName", event.target.value)}
                placeholder="Optional brokerage name"
              />
            </Field>
            <Field label="Service Description">
              <Textarea
                value={state.serviceDescription}
                onChange={(event) => update("serviceDescription", event.target.value)}
                placeholder="Describe your market coverage or buyer network"
              />
            </Field>
            <Field label="Preferred Categories" hint="Comma-separated.">
              <Textarea
                value={state.preferredCategories}
                onChange={(event) => update("preferredCategories", event.target.value)}
                placeholder="Industrial packaging, regrind, hardware lots"
                required
              />
            </Field>
          </div>
        ) : null}

        {error ? <p className="text-sm">{error}</p> : null}

        <Button disabled={isPending} type="submit">
          {isPending ? "Submitting" : "Submit For Review"}
        </Button>
      </form>
    </Panel>
  );
}
