"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  MATERIAL_CATEGORIES,
  UNITS,
  UNIT_LABELS,
  type MaterialCategory,
  type Unit,
} from "../_mock/domain";
import { categoryLabel } from "../_mock/selectors-shared";
import { NoticeBanner } from "./cirka-ui";

export interface NewRequestValues {
  title: string;
  materialCategory: MaterialCategory;
  materialDescription: string;
  quantityNeeded: string;
  unit: Unit;
  intendedProduct: string;
  neededBy: string;
  productionLocationPreference: string;
}

export function NewRequestDrawer({
  values,
  onChange,
  error,
  pending,
  onSubmit,
  onClose,
}: {
  values: NewRequestValues;
  onChange: (values: NewRequestValues) => void;
  error?: string | null;
  pending: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
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
      <form
        onSubmit={onSubmit}
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--paper)]"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Submit a request"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              New request
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Submit a request
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title="The request was not submitted">
              {error}
            </NoticeBanner>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title">
              <Input
                required
                value={values.title}
                onChange={(event) => onChange({ ...values, title: event.target.value })}
                placeholder="Linen for a small shirting run"
              />
            </Field>
            <Field label="Intended product">
              <Input
                value={values.intendedProduct}
                onChange={(event) => onChange({ ...values, intendedProduct: event.target.value })}
                placeholder="Overshirts"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Material category">
              <Select
                value={values.materialCategory}
                onChange={(event) =>
                  onChange({ ...values, materialCategory: event.target.value as MaterialCategory })
                }
              >
                {MATERIAL_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {categoryLabel(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Needed by">
              <Input
                type="date"
                value={values.neededBy}
                onChange={(event) => onChange({ ...values, neededBy: event.target.value })}
              />
            </Field>
            <Field label="Quantity needed">
              <Input
                required
                type="number"
                min="0"
                step="0.001"
                value={values.quantityNeeded}
                onChange={(event) => onChange({ ...values, quantityNeeded: event.target.value })}
              />
            </Field>
            <Field label="Unit">
              <Select
                value={values.unit}
                onChange={(event) => onChange({ ...values, unit: event.target.value as Unit })}
              >
                {UNITS.map((value) => (
                  <option key={value} value={value}>
                    {UNIT_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Production location preference">
            <Input
              value={values.productionLocationPreference}
              onChange={(event) =>
                onChange({ ...values, productionLocationPreference: event.target.value })
              }
              placeholder="Malmö"
            />
          </Field>

          <Field label="What you need">
            <Textarea
              value={values.materialDescription}
              onChange={(event) => onChange({ ...values, materialDescription: event.target.value })}
              placeholder="Shirting weight, natural or undyed, minimum 1.5 m usable lengths."
            />
          </Field>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--line)] px-6 py-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            Submit request
          </Button>
        </div>
      </form>
    </div>
  );
}
