"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  INPUT_TYPES,
  INPUT_TYPE_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  SOURCING_CATEGORIES,
  SOURCING_CATEGORY_LABELS,
  SUITABILITY_LABELS,
  TIME_ACTIVITIES,
  TIME_ACTIVITY_LABELS,
  type InputType,
  type ProductCategory,
  type SourcingCategory,
  type TimeActivity,
} from "../../../_mock/domain";
import { getProductionDetail } from "../../../_mock/selectors-maker";
import { formatCurrency, formatNumber, formatPercent } from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  Modal,
  NoticeBanner,
  SectionHeading,
  formatDate,
} from "../../../_components/cirka-ui";
import { EvidenceGrid } from "../../../_components/records";
import { ThreadTimelinePanel } from "../../../_components/trace-timeline";
import { useAction } from "../../../_components/use-action";

const EVIDENCE_CHOICES = [
  { kind: "wip_photo" as const, url: "/cirka_sewing_machine.png", label: "Work in progress" },
  { kind: "finished_product" as const, url: "/cirka_shopping_bags.png", label: "Finished product" },
  { kind: "remaining_material" as const, url: "/cirka_textile_waste.png", label: "Remaining material" },
];

export default function MakerProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const { run, error, pending } = useAction();

  const detail = getProductionDetail(store.db, scope, params.id);

  const [material, setMaterial] = useState<Record<string, string>>({});
  const [inputDraft, setInputDraft] = useState({
    inputType: "thread" as InputType,
    description: "",
    quantity: "",
    unit: "cones",
    supplierName: "",
    cost: "",
    sourcingCategory: "new" as SourcingCategory,
  });
  const [timeDraft, setTimeDraft] = useState({
    activity: "sewing_assembly" as TimeActivity,
    hours: "",
    peopleInvolved: "",
    isEstimated: false,
    notes: "",
  });
  const [outputDraft, setOutputDraft] = useState({
    productName: "",
    productCategory: "bags" as ProductCategory,
    numberPlanned: "",
    numberCompleted: "",
    numberRejected: "",
    numberRequiringRework: "",
  });
  const [costDraft, setCostDraft] = useState<Record<string, string>>({});
  const [makerNotes, setMakerNotes] = useState("");
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);

  if (!detail) {
    return <EmptyState title="Production batch not found" body="The demo data may have been reset." />;
  }

  const { production, balance, costs } = detail;
  const unit = production.unit;
  const materialValue = (field: string, current?: number) =>
    material[field] ?? (current !== undefined ? String(current) : "");

  const numberOrUndefined = (value: string) =>
    value === "" ? undefined : Number(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href="/demo/maker/production" variant="ghost" size="sm">
          ← All production
        </Button>
        <CirkaBadge status={production.status} />
        <CirkaBadge status={production.evidenceStatus} />
      </div>

      <SectionHeading
        eyebrow={production.reference}
        title={production.productName}
        description={production.productDescription}
      />

      {error && <NoticeBanner tone="blocking" title="That step was refused">{error}</NoticeBanner>}

      {production.reviewNotes && production.evidenceStatus !== "cirka_reviewed" && (
        <NoticeBanner tone="warning" title="CIRKA sent this back for more detail">
          {production.reviewNotes}
        </NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            The run
          </h2>
          <dl>
            <DataRow
              label="Resource batch"
              value={`${detail.batch?.name ?? "-"} · ${detail.batch?.reference ?? ""}`}
            />
            <DataRow label="Allocation" value={detail.allocation?.reference ?? "-"} />
            <DataRow label="Project" value={detail.project?.title ?? "Standalone"} />
            <DataRow label="Production site" value={detail.facility?.name ?? "-"} />
            <DataRow
              label="Category"
              value={PRODUCT_CATEGORY_LABELS[production.productCategory]}
            />
            <DataRow
              label="Planned"
              value={`${production.plannedQuantity} units`}
              hint={
                production.plannedCompletionDate
                  ? `Due ${formatDate(production.plannedCompletionDate)}`
                  : undefined
              }
            />
            <DataRow
              label="Actual"
              value={
                production.actualQuantity !== undefined
                  ? `${production.actualQuantity} units`
                  : "Not completed"
              }
              hint={
                production.actualCompletionDate
                  ? `Completed ${formatDate(production.actualCompletionDate)}`
                  : undefined
              }
            />
            <DataRow
              label="Material yield"
              value={
                production.materialYield !== undefined
                  ? formatPercent(production.materialYield)
                  : "Not calculated yet"
              }
            />
          </dl>

          {["planned", "awaiting_material", "material_received", "quality_review", "on_hold"].includes(
            production.status,
          ) && (
            <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              {production.status !== "in_production" && (
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      store.setProductionStatus("maker", {
                        productionBatchId: production._id,
                        status: "in_production",
                      }),
                    )
                  }
                >
                  Start production
                </Button>
              )}
            </div>
          )}

          {production.status === "in_production" && (
            <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.setProductionStatus("maker", {
                      productionBatchId: production._id,
                      status: "quality_review",
                    }),
                  )
                }
              >
                Move to quality review
              </Button>
            </div>
          )}
        </Panel>

        <Panel className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Material use
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Received = used + reusable + returned · Used = incorporated + prototypes + offcuts + loss
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["qtyReceived", "Received", production.qtyReceived],
              ["qtyUsed", "Used", production.qtyUsed],
              ["qtyIncorporated", "Into finished products", production.qtyIncorporated],
              ["qtyPrototypes", "Into prototypes", production.qtyPrototypes],
              ["qtyOffcuts", "Reusable offcuts", production.qtyOffcuts],
              ["qtyLoss", "Unusable loss", production.qtyLoss],
              ["qtyReusableRemaining", "Reusable remaining", production.qtyReusableRemaining],
              ["qtyReturned", "Returned", production.qtyReturned],
            ].map(([field, label, current]) => (
              <Field key={field as string} label={`${label} (${unit})`}>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={materialValue(field as string, current as number | undefined)}
                  onChange={(event) =>
                    setMaterial((currentState) => ({
                      ...currentState,
                      [field as string]: event.target.value,
                    }))
                  }
                />
              </Field>
            ))}
          </div>

          {!balance.balanced && (
            <NoticeBanner tone="warning" title="The material numbers do not balance yet">
              {balance.problems.map((problem) => (
                <p key={problem}>{problem}</p>
              ))}
            </NoticeBanner>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(() =>
                  store.recordMaterialUse("maker", {
                    productionBatchId: production._id,
                    qtyReceived: numberOrUndefined(materialValue("qtyReceived", production.qtyReceived)),
                    qtyUsed: numberOrUndefined(materialValue("qtyUsed", production.qtyUsed)),
                    qtyIncorporated: numberOrUndefined(
                      materialValue("qtyIncorporated", production.qtyIncorporated),
                    ),
                    qtyPrototypes: numberOrUndefined(
                      materialValue("qtyPrototypes", production.qtyPrototypes),
                    ),
                    qtyOffcuts: numberOrUndefined(materialValue("qtyOffcuts", production.qtyOffcuts)),
                    qtyLoss: numberOrUndefined(materialValue("qtyLoss", production.qtyLoss)),
                    qtyReusableRemaining: numberOrUndefined(
                      materialValue("qtyReusableRemaining", production.qtyReusableRemaining),
                    ),
                    qtyReturned: numberOrUndefined(
                      materialValue("qtyReturned", production.qtyReturned),
                    ),
                  }),
                )
              }
            >
              Save material use
            </Button>

            {production.status === "quality_review" && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.completeProduction("maker", { productionBatchId: production._id }),
                  )
                }
              >
                Complete production
              </Button>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Other production inputs
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsInputModalOpen(true)}
            >
              + Add input
            </Button>
          </div>

          {detail.inputs.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              Nothing else has gone into this run yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {detail.inputs.map((input) => (
                <li key={input._id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {INPUT_TYPE_LABELS[input.inputType]} · {input.description}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {formatNumber(input.quantity)} {input.unit} ·{" "}
                      {SOURCING_CATEGORY_LABELS[input.sourcingCategory]}
                      {input.supplierName ? ` · ${input.supplierName}` : ""}
                      {input.cost !== undefined ? ` · ${formatCurrency(input.cost)}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      run(() => store.removeProductionInput("maker", { inputId: input._id }))
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Production time
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsTimeModalOpen(true)}
            >
              + Add time entry
            </Button>
          </div>

          {detail.timeEntries.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">No time recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {detail.timeEntries.map((entry) => (
                <li key={entry._id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {TIME_ACTIVITY_LABELS[entry.activity]} · {entry.hours} h
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {entry.peopleInvolved ? `${entry.peopleInvolved} people · ` : ""}
                      {entry.isEstimated ? "estimated" : "actual"}
                      {entry.notes ? ` · ${entry.notes}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      run(() => store.removeTimeEntry("maker", { timeEntryId: entry._id }))
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <dl className="border-t border-[var(--line)] pt-4">
            <DataRow
              label="Total labour hours"
              value={production.totalLabourHours ?? 0}
              hint={
                production.hoursPerSaleableUnit
                  ? `${production.hoursPerSaleableUnit} h per saleable unit`
                  : undefined
              }
            />
            <DataRow label="People involved" value={production.peopleInvolved ?? "-"} />
          </dl>
        </Panel>
      </div>

      <Panel className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Outputs</h2>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsOutputModalOpen(true)}
          >
            + Add output line
          </Button>
        </div>

        {detail.outputs.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No finished products recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4 text-right">Planned</th>
                  <th className="py-3 pr-4 text-right">Completed</th>
                  <th className="py-3 pr-4 text-right">Rejected</th>
                  <th className="py-3 text-right">Rework</th>
                </tr>
              </thead>
              <tbody>
                {detail.outputs.map((output) => (
                  <tr key={output._id} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[var(--ink)]">{output.productName}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {PRODUCT_CATEGORY_LABELS[output.productCategory]}
                        {output.unitWeight ? ` · ${output.unitWeight} kg each` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{output.numberPlanned}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {output.numberCompleted ?? "-"}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {output.numberRejected ?? "-"}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {output.numberRequiringRework ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modals for adding entries */}
      {isInputModalOpen && (
        <Modal
          eyebrow="Input details"
          title="Add production input"
          width="lg"
          onClose={() => setIsInputModalOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Input type">
              <Select
                value={inputDraft.inputType}
                onChange={(event) =>
                  setInputDraft((current) => ({
                    ...current,
                    inputType: event.target.value as InputType,
                  }))
                }
              >
                {INPUT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {INPUT_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description">
              <Input
                value={inputDraft.description}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Recycled polyester thread, ecru"
              />
            </Field>
            <Field label="Quantity">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={inputDraft.quantity}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, quantity: event.target.value }))
                }
              />
            </Field>
            <Field label="Unit">
              <Input
                value={inputDraft.unit}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, unit: event.target.value }))
                }
              />
            </Field>
            <Field label="Supplier" hint="Protected">
              <Input
                value={inputDraft.supplierName}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, supplierName: event.target.value }))
                }
              />
            </Field>
            <Field label="Cost (SEK)" hint="Protected">
              <Input
                type="number"
                min="0"
                value={inputDraft.cost}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, cost: event.target.value }))
                }
              />
            </Field>
            <Field label="Sourcing">
              <Select
                value={inputDraft.sourcingCategory}
                onChange={(event) =>
                  setInputDraft((current) => ({
                    ...current,
                    sourcingCategory: event.target.value as SourcingCategory,
                  }))
                }
              >
                {SOURCING_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {SOURCING_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
            <Button variant="ghost" onClick={() => setIsInputModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await store.addProductionInput("maker", {
                    productionBatchId: production._id,
                    inputType: inputDraft.inputType,
                    description: inputDraft.description,
                    quantity: Number(inputDraft.quantity),
                    unit: inputDraft.unit,
                    supplierName: inputDraft.supplierName || undefined,
                    cost: inputDraft.cost ? Number(inputDraft.cost) : undefined,
                    sourcingCategory: inputDraft.sourcingCategory,
                  });
                  setInputDraft((current) => ({ ...current, description: "", quantity: "", cost: "" }));
                  setIsInputModalOpen(false);
                })
              }
            >
              Add input
            </Button>
          </div>
        </Modal>
      )}

      {isTimeModalOpen && (
        <Modal
          eyebrow="Time record"
          title="Add production time"
          width="lg"
          onClose={() => setIsTimeModalOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Activity">
              <Select
                value={timeDraft.activity}
                onChange={(event) =>
                  setTimeDraft((current) => ({
                    ...current,
                    activity: event.target.value as TimeActivity,
                  }))
                }
              >
                {TIME_ACTIVITIES.map((value) => (
                  <option key={value} value={value}>
                    {TIME_ACTIVITY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Hours">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={timeDraft.hours}
                onChange={(event) =>
                  setTimeDraft((current) => ({ ...current, hours: event.target.value }))
                }
              />
            </Field>
            <Field label="People involved">
              <Input
                type="number"
                min="0"
                value={timeDraft.peopleInvolved}
                onChange={(event) =>
                  setTimeDraft((current) => ({ ...current, peopleInvolved: event.target.value }))
                }
              />
            </Field>
            <Field label="Estimated or actual">
              <Select
                value={timeDraft.isEstimated ? "estimated" : "actual"}
                onChange={(event) =>
                  setTimeDraft((current) => ({
                    ...current,
                    isEstimated: event.target.value === "estimated",
                  }))
                }
              >
                <option value="actual">Actual</option>
                <option value="estimated">Estimated</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Input
                  value={timeDraft.notes}
                  onChange={(event) =>
                    setTimeDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Optional notes or details..."
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
            <Button variant="ghost" onClick={() => setIsTimeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await store.addTimeEntry("maker", {
                    productionBatchId: production._id,
                    activity: timeDraft.activity,
                    hours: Number(timeDraft.hours),
                    peopleInvolved: timeDraft.peopleInvolved
                      ? Number(timeDraft.peopleInvolved)
                      : undefined,
                    isEstimated: timeDraft.isEstimated,
                    notes: timeDraft.notes || undefined,
                  });
                  setTimeDraft((current) => ({ ...current, hours: "", notes: "" }));
                  setIsTimeModalOpen(false);
                })
              }
            >
              Add time entry
            </Button>
          </div>
        </Modal>
      )}

      {isOutputModalOpen && (
        <Modal
          eyebrow="Output record"
          title="Add output line"
          width="lg"
          onClose={() => setIsOutputModalOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Product name">
              <Input
                value={outputDraft.productName}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, productName: event.target.value }))
                }
              />
            </Field>
            <Field label="Category">
              <Select
                value={outputDraft.productCategory}
                onChange={(event) =>
                  setOutputDraft((current) => ({
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
            <Field label="Planned">
              <Input
                type="number"
                min="0"
                value={outputDraft.numberPlanned}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, numberPlanned: event.target.value }))
                }
              />
            </Field>
            <Field label="Completed">
              <Input
                type="number"
                min="0"
                value={outputDraft.numberCompleted}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, numberCompleted: event.target.value }))
                }
              />
            </Field>
            <Field label="Rejected">
              <Input
                type="number"
                min="0"
                value={outputDraft.numberRejected}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, numberRejected: event.target.value }))
                }
              />
            </Field>
            <Field label="Rework">
              <Input
                type="number"
                min="0"
                value={outputDraft.numberRequiringRework}
                onChange={(event) =>
                  setOutputDraft((current) => ({
                    ...current,
                    numberRequiringRework: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
            <Button variant="ghost" onClick={() => setIsOutputModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await store.addProductionOutput("maker", {
                    productionBatchId: production._id,
                    productName: outputDraft.productName,
                    productCategory: outputDraft.productCategory,
                    numberPlanned: Number(outputDraft.numberPlanned),
                    numberCompleted: outputDraft.numberCompleted
                      ? Number(outputDraft.numberCompleted)
                      : undefined,
                    numberRejected: outputDraft.numberRejected
                      ? Number(outputDraft.numberRejected)
                      : undefined,
                    numberRequiringRework: outputDraft.numberRequiringRework
                      ? Number(outputDraft.numberRequiringRework)
                      : undefined,
                  });
                  setOutputDraft((current) => ({
                    ...current,
                    productName: "",
                    numberPlanned: "",
                    numberCompleted: "",
                    numberRejected: "",
                    numberRequiringRework: "",
                  }));
                  setIsOutputModalOpen(false);
                })
              }
            >
              Add output line
            </Button>
          </div>
        </Modal>
      )}

      <Panel className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Costs and commercial data
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Private · never reaches brand queries
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            ["resourceCost", "Resource cost"],
            ["additionalInputCost", "Additional inputs"],
            ["labourCost", "Labour"],
            ["treatmentCost", "Treatment / cleaning"],
            ["packagingCost", "Packaging"],
            ["transportCost", "Transport"],
            ["custodianFees", "Custodian fees"],
            ["otherCosts", "Other"],
            ["saleableUnits", "Saleable units"],
            ["intendedWholesalePrice", "Intended wholesale"],
            ["intendedRetailPrice", "Intended retail"],
            ["actualSellingPrice", "Actual selling price"],
            ["unitsSold", "Units sold"],
          ].map(([field, label]) => (
            <Field key={field} label={label}>
              <Input
                type="number"
                min="0"
                value={
                  costDraft[field] ??
                  (costs ? String((costs as unknown as Record<string, unknown>)[field] ?? "") : "")
                }
                onChange={(event) =>
                  setCostDraft((current) => ({ ...current, [field]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>

        {costs && (
          <dl className="border-t border-[var(--line)] pt-4">
            <DataRow label="Total batch cost" value={formatCurrency(costs.totalBatchCost)} />
            <DataRow
              label="Base cost per unit"
              value={formatCurrency(costs.baseCostPerUnit)}
              hint="Total batch cost / saleable units"
            />
            <DataRow label="Revenue generated" value={formatCurrency(costs.revenueGenerated)} />
            <DataRow
              label="Shared with the brand"
              value={costs.shareCostPerUnitWithBrand ? "Cost per unit is shared" : "Nothing shared"}
            />
          </dl>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(() =>
                store.upsertProductionCosts("maker", {
                  productionBatchId: production._id,
                  input: Object.fromEntries(
                    Object.entries(costDraft)
                      .filter(([, value]) => value !== "")
                      .map(([field, value]) => [field, Number(value)]),
                  ),
                }),
              )
            }
          >
            Save costs
          </Button>
          {costs && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(() =>
                  store.setCostSharing("maker", {
                    productionBatchId: production._id,
                    share: !costs.shareCostPerUnitWithBrand,
                  }),
                )
              }
            >
              {costs.shareCostPerUnitWithBrand
                ? "Stop sharing cost per unit"
                : "Share cost per unit with the brand"}
            </Button>
          )}
        </div>
      </Panel>

      <Panel className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Evidence</h2>
        </div>

        <EvidenceGrid items={detail.evidence} />

        <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-4">
          {EVIDENCE_CHOICES.map((choice) => (
            <Button
              key={choice.kind}
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(() =>
                  store.addEvidenceItem("maker", {
                    entityTable: "productionBatches",
                    entityId: production._id,
                    kind: choice.kind,
                    fileName: `${choice.kind}-${production.reference}.jpg`,
                    fileUrl: choice.url,
                    caption: choice.label,
                    visibility: "brand",
                  }),
                )
              }
            >
              Add {choice.label.toLowerCase()}
            </Button>
          ))}
        </div>

        {production.status === "completed" && (
          <div className="space-y-4 border-t border-[var(--line)] pt-4">
            <Field label="Notes for CIRKA">
              <Textarea
                value={makerNotes}
                onChange={(event) => setMakerNotes(event.target.value)}
                placeholder="Anything the reviewer should know: rework cycles, material behaviour, delays."
              />
            </Field>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() =>
                  store.submitEvidence("maker", {
                    productionBatchId: production._id,
                    makerNotes: makerNotes || undefined,
                  }),
                )
              }
            >
              Submit evidence for CIRKA review
            </Button>
          </div>
        )}
      </Panel>

      {detail.suitability && (
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Material suitability you recorded
          </h2>
          <dl>
            <DataRow
              label="Assessment"
              value={SUITABILITY_LABELS[detail.suitability.suitability]}
              hint={
                detail.suitability.qualityRating
                  ? `Quality ${detail.suitability.qualityRating}/5`
                  : undefined
              }
            />
            <DataRow
              label="Received as described"
              value={detail.suitability.receivedAsDescribed ? "Yes" : "No"}
            />
            <DataRow label="Recommended for" value={detail.suitability.recommendedApplications ?? "-"} />
            <DataRow label="Limitations" value={detail.suitability.limitations ?? "-"} />
            <DataRow label="Notes" value={detail.suitability.notes ?? "-"} />
          </dl>
        </Panel>
      )}

      <ThreadTimelinePanel
        role="maker"
        anchor={{ table: "productionBatches", id: production._id }}
      />
    </div>
  );
}
