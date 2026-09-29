"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { PRODUCT_CATEGORIES, type ProductCategory } from "../../../_mock/domain";
import { listMakerAllocations } from "../../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";

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
  const { newProduction: t } = useMessages(demoMaker);
  const labels = useLabels();
  const fmt = useFormat();

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
      <SectionHeading title={t.title} />

      {error && <NoticeBanner tone="blocking" title={t.notCreated}>{error}</NoticeBanner>}

      {available.length === 0 ? (
        <EmptyState
          title={t.noAllocation}
          body={t.noAllocationBody}
        />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Panel className="space-y-5 p-6">
            <Field label={t.allocation}>
              <Select
                value={form.allocationId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, allocationId: event.target.value }))
                }
              >
                {available.map((entry) => (
                  <option key={entry.allocation._id} value={entry.allocation._id}>
                    {entry.allocation.reference} · {entry.batchName} ·{" "}
                    {fmt.quantity(entry.allocation.quantityAllocated, entry.allocation.unit)}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t.productName}>
                <Input
                  required
                  value={form.productName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, productName: event.target.value }))
                  }
                  placeholder={t.productNamePlaceholder}
                />
              </Field>
              <Field label={t.productCategory}>
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
                      {labels.PRODUCT_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label={t.description}>
              <Textarea
                value={form.productDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productDescription: event.target.value }))
                }
                placeholder={t.descriptionPlaceholder}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label={t.plannedUnits}>
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
              <Field label={t.plannedStart}>
                <Input
                  type="date"
                  value={form.plannedStartDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, plannedStartDate: event.target.value }))
                  }
                />
              </Field>
              <Field label={t.plannedCompletion}>
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
              {t.create}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
