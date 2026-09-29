"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { Unit } from "../_mock/domain";
import { NoticeBanner } from "./cirka-ui";
import { useLabels } from "./use-labels";

interface ProposeDrawerOrg {
  _id: string;
  name: string;
  city?: string;
}

export interface ProposeDrawerValues {
  quantity: string;
  rationale: string;
  custodianOrgId: string;
  makerOrgId: string;
  categoryFitNote: string;
}

export function ProposeDrawer({
  batchName,
  batchUnit,
  custodians,
  makers,
  values,
  onChange,
  error,
  pending,
  onSubmit,
  onClose,
}: {
  batchName: string;
  batchUnit: Unit;
  custodians: ProposeDrawerOrg[];
  makers: ProposeDrawerOrg[];
  values: ProposeDrawerValues;
  onChange: (values: ProposeDrawerValues) => void;
  error?: string | null;
  pending: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const { propose: t } = useMessages(demoAdmin);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex justify-end bg-[var(--ink)]/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--paper)]"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={format(t.ariaLabel, { batch: batchName })}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {t.eyebrow}
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {batchName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title={ui.stepRefused}>
              {error}
            </NoticeBanner>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={format(t.quantity, { unit: labels.UNIT_LABELS[batchUnit] })}>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={values.quantity}
                onChange={(event) => onChange({ ...values, quantity: event.target.value })}
              />
            </Field>
            <Field label={t.custodian}>
              <Select
                value={values.custodianOrgId}
                onChange={(event) => onChange({ ...values, custodianOrgId: event.target.value })}
              >
                <option value="">{t.chooseCustodian}</option>
                {custodians.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name} · {org.city}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.maker}>
              <Select
                value={values.makerOrgId}
                onChange={(event) => onChange({ ...values, makerOrgId: event.target.value })}
              >
                <option value="">{t.chooseMaker}</option>
                {makers.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name} · {org.city}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.categoryFitNote}>
              <Input
                value={values.categoryFitNote}
                onChange={(event) => onChange({ ...values, categoryFitNote: event.target.value })}
              />
            </Field>
          </div>

          <Field label={t.rationale} required hint={t.rationaleHint}>
            <Textarea
              value={values.rationale}
              onChange={(event) => onChange({ ...values, rationale: event.target.value })}
              placeholder={t.rationalePlaceholder}
            />
          </Field>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--line)] px-6 py-5">
          <Button variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button disabled={pending} onClick={onSubmit}>
            {t.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
