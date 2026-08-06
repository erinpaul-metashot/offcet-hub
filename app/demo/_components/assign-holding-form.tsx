"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import type { CustodianStockRow } from "../_mock/selectors-admin";
import type { Organisation } from "../_mock/types";
import { formatQuantity } from "../_mock/selectors-shared";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { NoticeBanner } from "./cirka-ui";

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

  const quantityNum = Number(quantity);
  const isOverLimit = quantityNum > uncommitted;

  return (
    <div className="space-y-4 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-5">
      {error && (
        <NoticeBanner tone="blocking" title="That assignment was refused">
          {error}
        </NoticeBanner>
      )}

      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        Assign from {custodian.name} to a maker
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Maker">
          <Select value={makerOrgId} onChange={(event) => setMakerOrgId(event.target.value)}>
            <option value="">Choose a maker</option>
            {makers.map((maker) => (
              <option key={maker._id} value={maker._id}>
                {maker.name} · {maker.city}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={`Quantity (${batch.unit})`}
          hint={`Unassigned at ${custodian.name}: ${formatQuantity(uncommitted, batch.unit)}`}
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

        <Field label="Note for the maker (optional)">
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="For the lined pouch run"
          />
        </Field>
      </div>

      {isOverLimit && (
        <NoticeBanner tone="warning" title="More than is unassigned">
          Only {formatQuantity(uncommitted, batch.unit)} of this lot is still unassigned.
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
          Assign to Maker
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
