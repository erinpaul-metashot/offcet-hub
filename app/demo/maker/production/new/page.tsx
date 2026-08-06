"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "../../../_mock/domain";
import { listMakerAllocations } from "../../../_mock/selectors-maker";
import { formatQuantity } from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function NewProductionBatchPage() {
  const router = useRouter();
  const store = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const { run, error, pending } = useAction();

  const available = listMakerAllocations(store.db, scope.orgId).filter(
    (entry) =>
      ["accepted", "awaiting_dispatch", "in_transit", "received"].includes(entry.allocation.status) &&
      !entry.production,
  );

  const [form, setForm] = useState({
    allocationId: available[0]?.allocation._id ?? "",
    productName: "",
    productCategory: "bags" as ProductCategory,
    productDescription: "",
    plannedQuantity: "",
    plannedStartDate: "",
    plannedCompletionDate: "",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    await run(async () => {
      const productionBatchId = await store.createProductionBatch("maker", {
        allocationId: form.allocationId,
        productName: form.productName,
        productCategory: form.productCategory,
        productDescription: form.productDescription || undefined,
        plannedQuantity: Number(form.plannedQuantity),
        plannedStartDate: toTimestamp(form.plannedStartDate),
        plannedCompletionDate: toTimestamp(form.plannedCompletionDate),
      });

      router.push(`/demo/maker/production/${productionBatchId}`);
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeading title="New Production Batch" />

      {error && <NoticeBanner tone="blocking" title="The batch was not created">{error}</NoticeBanner>}

      {available.length === 0 ? (
        <EmptyState
          title="No allocation available"
          body="Accept an allocation first. One batch per allocation."
        />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Panel className="space-y-5 p-6">
            <Field label="Allocation">
              <Select
                value={form.allocationId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, allocationId: event.target.value }))
                }
              >
                {available.map((entry) => (
                  <option key={entry.allocation._id} value={entry.allocation._id}>
                    {entry.allocation.reference} · {entry.batchName} ·{" "}
                    {formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Product or collection name">
                <Input
                  required
                  value={form.productName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, productName: event.target.value }))
                  }
                  placeholder="Reclaimed Jersey Tote and Pouch"
                />
              </Field>
              <Field label="Product category">
                <Select
                  value={form.productCategory}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      productCategory: event.target.value as ProductCategory,
                    }))
                  }
                >
                  {PRODUCT_CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {PRODUCT_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                value={form.productDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productDescription: event.target.value }))
                }
                placeholder="Panelled tote with a matching pouch, cut to absorb shade variation."
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Planned units">
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.plannedQuantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, plannedQuantity: event.target.value }))
                  }
                  placeholder="150"
                />
              </Field>
              <Field label="Planned start">
                <Input
                  type="date"
                  value={form.plannedStartDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, plannedStartDate: event.target.value }))
                  }
                />
              </Field>
              <Field label="Planned completion">
                <Input
                  type="date"
                  value={form.plannedCompletionDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      plannedCompletionDate: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </Panel>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              Create production batch
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
