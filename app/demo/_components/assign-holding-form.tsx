"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import type { CustodianStockRow } from "../_mock/selectors-admin";
import type { Organisation } from "../_mock/types";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { NoticeBanner } from "./cirka-ui";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

/**
 * The second hop is CIRKA's call: the custodian stores the lot, CIRKA decides
 * which maker receives it. This is the form behind that decision.
 */
export function AssignHoldingForm({
  row,
  makers,
  store,
  run,
  pending,
  error,
  onDone,
}: {
  row: CustodianStockRow;
  makers: Organisation[];
  store: ReturnType<typeof useDemoStore>;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  error: string | null;
  onDone: () => void;
}) {
  const { custodian, holding } = row;
  const { batch, uncommitted, sourceAllocation } = holding;

  const [makerOrgId, setMakerOrgId] = useState("");
  const [quantity, setQuantity] = useState(String(uncommitted));
  const [notes, setNotes] = useState("");
  const { assignForm: t } = useMessages(demoAdmin);
  const labels = useLabels();
  const fmt = useFormat();

  const quantityNum = Number(quantity);
  const isOverLimit = quantityNum > uncommitted;

  return (
    <div className="space-y-4 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-5">
      {error && (
        <NoticeBanner tone="blocking" title={t.refused}>
          {error}
        </NoticeBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t.maker}>
          <Select value={makerOrgId} onChange={(event) => setMakerOrgId(event.target.value)}>
            <option value="">{t.chooseMaker}</option>
            {makers.map((maker) => (
              <option key={maker._id} value={maker._id}>
                {maker.name} · {maker.city}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={format(t.quantity, { unit: labels.UNIT_LABELS[batch.unit] })}
          hint={format(t.unassignedAt, { custodian: custodian.name, quantity: fmt.quantity(uncommitted, batch.unit) })}
        >
          <Input
            type="number"
            min="0"
            max={uncommitted}
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </Field>

        <Field label={t.note}>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t.notePlaceholder}
          />
        </Field>
      </div>

      {isOverLimit && (
        <NoticeBanner tone="warning" title={t.overLimitTitle}>
          {format(t.overLimitBody, { quantity: fmt.quantity(uncommitted, batch.unit) })}
        </NoticeBanner>
      )}

      <div className="flex items-center gap-3">
        <Button
          disabled={pending || !makerOrgId || !quantity || isOverLimit || quantityNum <= 0}
          onClick={() =>
            run(async () => {
              await store.proposeAllocationToMaker("admin", {
                batchId: batch._id,
                fromOrgId: custodian._id,
                toOrgId: makerOrgId,
                quantity: quantityNum,
                notes: notes || undefined,
                requestId: sourceAllocation?.requestId,
                projectId: sourceAllocation?.projectId,
              });
              onDone();
            })
          }
        >
          {t.assign}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}
