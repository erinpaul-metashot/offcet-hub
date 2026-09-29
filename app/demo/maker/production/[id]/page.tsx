"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import {
  INPUT_TYPES,
  PRODUCT_CATEGORIES,
  SOURCING_CATEGORIES,
  TIME_ACTIVITIES,
  type InputType,
  type ProductCategory,
  type SourcingCategory,
  type TimeActivity,
} from "../../../_mock/domain";
import { getProductionDetail } from "../../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  Modal,
  NoticeBanner,
  SectionHeading,
} from "../../../_components/cirka-ui";
import { EvidenceGrid } from "../../../_components/records";
import { ThreadTimelinePanel } from "../../../_components/trace-timeline";
import { useAction } from "../../../_components/use-action";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";

/** `label` is stored as the evidence caption (record data); button text comes from `productionDetail.addEvidence`. */
const EVIDENCE_CHOICES = [
  { kind: "wip_photo" as const, url: "/cirka_sewing_machine.png", label: "Work in progress" },
  { kind: "finished_product" as const, url: "/cirka_shopping_bags.png", label: "Finished product" },
  { kind: "remaining_material" as const, url: "/cirka_batch_jersey_rolls.png", label: "Remaining material" },
];

export default function MakerProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const { run, error, pending } = useAction();
  const { productionDetail: t } = useMessages(demoMaker);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

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
    return <EmptyState title={t.notFound} />;
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
          {t.allProduction}
        </Button>
        <CirkaBadge status={production.status} />
        <CirkaBadge status={production.evidenceStatus} />
      </div>

      <SectionHeading
        eyebrow={production.reference}
        title={production.productName}
      />

      {error && <NoticeBanner tone="blocking" title={ui.stepRefused}>{error}</NoticeBanner>}

      {production.reviewNotes && production.evidenceStatus !== "cirka_reviewed" && (
        <NoticeBanner tone="warning" title={t.sentBack}>
          {production.reviewNotes}
        </NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.theRun}
          </h2>
          <dl>
            <DataRow
              label={t.resourceBatch}
              value={`${detail.batch?.name ?? "-"} · ${detail.batch?.reference ?? ""}`}
            />
            <DataRow label={t.allocation} value={detail.allocation?.reference ?? "-"} />
            <DataRow label={t.project} value={detail.project?.title ?? t.standalone} />
            <DataRow label={t.productionSite} value={detail.facility?.name ?? "-"} />
            <DataRow
              label={t.category}
              value={labels.PRODUCT_CATEGORY_LABELS[production.productCategory]}
            />
            <DataRow
              label={t.planned}
              value={format(t.units, { count: fmt.number(production.plannedQuantity) })}
              hint={
                production.plannedCompletionDate
                  ? format(t.due, { date: fmt.date(production.plannedCompletionDate) })
                  : undefined
              }
            />
            <DataRow
              label={t.actual}
              value={
                production.actualQuantity !== undefined
                  ? format(t.units, { count: fmt.number(production.actualQuantity) })
                  : t.notCompleted
              }
              hint={
                production.actualCompletionDate
                  ? format(t.completed, { date: fmt.date(production.actualCompletionDate) })
                  : undefined
              }
            />
            <DataRow
              label={t.materialYield}
              value={
                production.materialYield !== undefined
                  ? fmt.percent(production.materialYield)
                  : t.notCalculated
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
                  {t.startProduction}
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
                {t.moveToQuality}
              </Button>
            </div>
          )}
        </Panel>

        <Panel className="space-y-4 p-6">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.materialUse}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["qtyReceived", t.material.qtyReceived, production.qtyReceived],
              ["qtyUsed", t.material.qtyUsed, production.qtyUsed],
              ["qtyIncorporated", t.material.qtyIncorporated, production.qtyIncorporated],
              ["qtyPrototypes", t.material.qtyPrototypes, production.qtyPrototypes],
              ["qtyOffcuts", t.material.qtyOffcuts, production.qtyOffcuts],
              ["qtyLoss", t.material.qtyLoss, production.qtyLoss],
              ["qtyReusableRemaining", t.material.qtyReusableRemaining, production.qtyReusableRemaining],
              ["qtyReturned", t.material.qtyReturned, production.qtyReturned],
            ].map(([field, label, current]) => (
              <Field
                key={field as string}
                label={format(t.materialField, { label: label as string, unit: labels.UNIT_LABELS[unit] })}
              >
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
            <NoticeBanner tone="warning" title={t.notBalanced}>
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
              {t.saveMaterial}
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
                {t.completeProduction}
              </Button>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {t.otherInputs}
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsInputModalOpen(true)}
            >
              {t.addInput}
            </Button>
          </div>

          {detail.inputs.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              {t.noInputs}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {detail.inputs.map((input) => (
                <li key={input._id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {labels.INPUT_TYPE_LABELS[input.inputType]} · {input.description}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {fmt.number(input.quantity)} {input.unit} ·{" "}
                      {labels.SOURCING_CATEGORY_LABELS[input.sourcingCategory]}
                      {input.supplierName ? ` · ${input.supplierName}` : ""}
                      {input.cost !== undefined ? ` · ${fmt.currency(input.cost)}` : ""}
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
                    {t.remove}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {t.productionTime}
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsTimeModalOpen(true)}
            >
              {t.addTimeEntry}
            </Button>
          </div>

          {detail.timeEntries.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">{t.noTime}</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {detail.timeEntries.map((entry) => (
                <li key={entry._id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {labels.TIME_ACTIVITY_LABELS[entry.activity]} ·{" "}
                      {format(t.hoursShort, { count: fmt.number(entry.hours) })}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {entry.peopleInvolved ? format(t.peopleDot, { count: entry.peopleInvolved }) : ""}
                      {entry.isEstimated ? t.estimated : t.actualLower}
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
                    {t.remove}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <dl className="border-t border-[var(--line)] pt-4">
            <DataRow
              label={t.totalLabour}
              value={fmt.number(production.totalLabourHours ?? 0)}
              hint={
                production.hoursPerSaleableUnit
                  ? format(t.perSaleable, { count: fmt.number(production.hoursPerSaleableUnit) })
                  : undefined
              }
            />
            <DataRow label={t.peopleInvolved} value={production.peopleInvolved ?? "-"} />
          </dl>
        </Panel>
      </div>

      <Panel className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{t.outputs}</h2>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsOutputModalOpen(true)}
          >
            {t.addOutputLine}
          </Button>
        </div>

        {detail.outputs.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">{t.noOutputs}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  <th className="py-3 pr-4">{t.colProduct}</th>
                  <th className="py-3 pr-4 text-right">{t.colPlanned}</th>
                  <th className="py-3 pr-4 text-right">{t.colCompleted}</th>
                  <th className="py-3 pr-4 text-right">{t.colRejected}</th>
                  <th className="py-3 text-right">{t.colRework}</th>
                </tr>
              </thead>
              <tbody>
                {detail.outputs.map((output) => (
                  <tr key={output._id} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[var(--ink)]">{output.productName}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {labels.PRODUCT_CATEGORY_LABELS[output.productCategory]}
                        {output.unitWeight ? format(t.kgEach, { weight: fmt.number(output.unitWeight) }) : ""}
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
          title={t.inputModalTitle}
          width="lg"
          onClose={() => setIsInputModalOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.inputType}>
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
                    {labels.INPUT_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.description}>
              <Input
                value={inputDraft.description}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder={t.descriptionPlaceholder}
              />
            </Field>
            <Field label={t.quantity}>
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
            <Field label={t.unit}>
              <Input
                value={inputDraft.unit}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, unit: event.target.value }))
                }
              />
            </Field>
            <Field label={t.supplier} hint={t.protected}>
              <Input
                value={inputDraft.supplierName}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, supplierName: event.target.value }))
                }
              />
            </Field>
            <Field label={t.costSek} hint={t.protected}>
              <Input
                type="number"
                min="0"
                value={inputDraft.cost}
                onChange={(event) =>
                  setInputDraft((current) => ({ ...current, cost: event.target.value }))
                }
              />
            </Field>
            <Field label={t.sourcing}>
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
                    {labels.SOURCING_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
            <Button variant="ghost" onClick={() => setIsInputModalOpen(false)}>
              {t.cancel}
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
              {t.addInputSubmit}
            </Button>
          </div>
        </Modal>
      )}

      {isTimeModalOpen && (
        <Modal
          title={t.timeModalTitle}
          width="lg"
          onClose={() => setIsTimeModalOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.activity}>
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
                    {labels.TIME_ACTIVITY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.hours}>
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
            <Field label={t.peopleInvolved}>
              <Input
                type="number"
                min="0"
                value={timeDraft.peopleInvolved}
                onChange={(event) =>
                  setTimeDraft((current) => ({ ...current, peopleInvolved: event.target.value }))
                }
              />
            </Field>
            <Field label={t.estimatedOrActual}>
              <Select
                value={timeDraft.isEstimated ? "estimated" : "actual"}
                onChange={(event) =>
                  setTimeDraft((current) => ({
                    ...current,
                    isEstimated: event.target.value === "estimated",
                  }))
                }
              >
                <option value="actual">{t.optionActual}</option>
                <option value="estimated">{t.optionEstimated}</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label={t.notes}>
                <Input
                  value={timeDraft.notes}
                  onChange={(event) =>
                    setTimeDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
            <Button variant="ghost" onClick={() => setIsTimeModalOpen(false)}>
              {t.cancel}
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
              {t.addTimeSubmit}
            </Button>
          </div>
        </Modal>
      )}

      {isOutputModalOpen && (
        <Modal
          title={t.outputModalTitle}
          width="lg"
          onClose={() => setIsOutputModalOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t.productName}>
              <Input
                value={outputDraft.productName}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, productName: event.target.value }))
                }
              />
            </Field>
            <Field label={t.category}>
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
                    {labels.PRODUCT_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.planned}>
              <Input
                type="number"
                min="0"
                value={outputDraft.numberPlanned}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, numberPlanned: event.target.value }))
                }
              />
            </Field>
            <Field label={t.colCompleted}>
              <Input
                type="number"
                min="0"
                value={outputDraft.numberCompleted}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, numberCompleted: event.target.value }))
                }
              />
            </Field>
            <Field label={t.rejected}>
              <Input
                type="number"
                min="0"
                value={outputDraft.numberRejected}
                onChange={(event) =>
                  setOutputDraft((current) => ({ ...current, numberRejected: event.target.value }))
                }
              />
            </Field>
            <Field label={t.rework}>
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
              {t.cancel}
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
              {t.addOutputSubmit}
            </Button>
          </div>
        </Modal>
      )}

      <Panel className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{t.costs}</h2>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]"
            title={t.privateHint}
          >
            <Lock size={12} /> {t.private}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {([
            "resourceCost",
            "additionalInputCost",
            "labourCost",
            "treatmentCost",
            "packagingCost",
            "transportCost",
            "custodianFees",
            "otherCosts",
            "saleableUnits",
            "intendedWholesalePrice",
            "intendedRetailPrice",
            "actualSellingPrice",
            "unitsSold",
          ] as const).map((field) => (
            <Field key={field} label={t.cost[field]}>
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
            <DataRow label={t.totalBatchCost} value={fmt.currency(costs.totalBatchCost)} />
            <DataRow
              label={t.baseCostPerUnit}
              value={fmt.currency(costs.baseCostPerUnit)}
              hint={t.baseCostHint}
            />
            <DataRow label={t.revenue} value={fmt.currency(costs.revenueGenerated)} />
            <DataRow
              label={t.sharedWithBrand}
              value={costs.shareCostPerUnitWithBrand ? t.costPerUnit : "-"}
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
            {t.saveCosts}
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
                ? t.stopSharing
                : t.shareCost}
            </Button>
          )}
        </div>
      </Panel>

      <Panel className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{t.evidence}</h2>
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
              {t.addEvidence[choice.kind]}
            </Button>
          ))}
        </div>

        {production.status === "completed" && (
          <div className="space-y-4 border-t border-[var(--line)] pt-4">
            <Field label={t.notesForCirka}>
              <Textarea
                value={makerNotes}
                onChange={(event) => setMakerNotes(event.target.value)}
                placeholder={t.notesPlaceholder}
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
              {t.submitReview}
            </Button>
          </div>
        )}
      </Panel>

      {detail.suitability && (
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.suitability}
          </h2>
          <dl>
            <DataRow
              label={t.assessment}
              value={labels.SUITABILITY_LABELS[detail.suitability.suitability]}
              hint={
                detail.suitability.qualityRating
                  ? format(t.quality, { rating: detail.suitability.qualityRating })
                  : undefined
              }
            />
            <DataRow
              label={t.receivedAsDescribed}
              value={detail.suitability.receivedAsDescribed ? t.yes : t.no}
            />
            <DataRow label={t.recommendedFor} value={detail.suitability.recommendedApplications ?? "-"} />
            <DataRow label={t.limitations} value={detail.suitability.limitations ?? "-"} />
            <DataRow label={t.notes} value={detail.suitability.notes ?? "-"} />
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
