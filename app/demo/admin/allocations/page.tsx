"use client";

import { useState } from "react";
import { Button, EmptyState, Panel, Select } from "@/components/ui";
import { ALLOCATION_STATUSES, statusLabel } from "../../_mock/domain";
import { listAllocationsOverview, listCustodianStock } from "../../_mock/selectors-admin";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading, formatDate } from "../../_components/cirka-ui";
import { AssignHoldingForm } from "../../_components/assign-holding-form";
import { useAction } from "../../_components/use-action";

export default function AdminAllocationsPage() {
  const store = useDemoStore();
  const { db } = store;
  const { run, error, pending, clearError } = useAction();
  const [status, setStatus] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);

  const rows = listAllocationsOverview(db).filter((row) =>
    status ? row.allocation.status === status : true,
  );

  const stock = listCustodianStock(db);
  const makers = db.organisations.filter(
    (org) => org.type === "maker" && org.status === "approved",
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Allocations"
        title="Every hand-off in the network"
        action={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-56">
            <option value="">All statuses</option>
            {ALLOCATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        }
      />

      {/* The second hop is CIRKA's decision: custodians store, they do not choose. */}
      <section className="space-y-3">
        <SectionHeading eyebrow="Second hop" title="Stock sitting in warehouses" />
        {stock.length === 0 ? (
          <EmptyState
            title="No stock at a custodian"
            body="Once a custodian confirms receipt, their holdings appear here."
          />
        ) : (
          <Panel className="overflow-hidden">
            {stock.map((row) => {
              const key = `${row.custodian._id}:${row.holding.batch._id}`;
              const open = assigning === key;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {row.holding.batch.reference} · {row.custodian.name}
                      </p>
                      <p className="truncate font-semibold text-[var(--ink)]">
                        {row.holding.batch.name}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {formatQuantity(row.holding.held, row.holding.batch.unit)} held ·{" "}
                        {formatQuantity(row.holding.promised, row.holding.batch.unit)} already
                        assigned
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <p className="text-right text-lg font-extrabold tabular-nums tracking-[-0.03em] text-[var(--brand-primary)]">
                        {formatQuantity(row.holding.uncommitted, row.holding.batch.unit)}
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                          Unassigned
                        </span>
                      </p>
                      <Button
                        size="sm"
                        variant={open ? "secondary" : "primary"}
                        disabled={row.holding.uncommitted <= 0}
                        onClick={() => {
                          clearError();
                          setAssigning(open ? null : key);
                        }}
                      >
                        {open ? "Close" : "Assign to Maker"}
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <AssignHoldingForm
                      row={row}
                      makers={makers}
                      store={store}
                      run={run}
                      pending={pending}
                      error={error}
                      onDone={() => setAssigning(null)}
                    />
                  )}
                </div>
              );
            })}
          </Panel>
        )}
      </section>

      {rows.length === 0 ? (
        <EmptyState title="No allocations" body="Approved matches create the first one." />
      ) : (
        <Panel className="overflow-hidden">
          {rows.map(({ allocation, batch, fromName, toName, project }) => (
            <LinkRow
              key={allocation._id}
              href={`/demo/admin/allocations/${allocation._id}`}
              title={`${allocation.reference} · ${fromName} → ${toName}`}
              meta={
                <>
                  {batch?.name ?? "-"}
                  {project ? ` · ${project.title}` : ""} ·{" "}
                  {formatQuantity(allocation.quantityAllocated, allocation.unit)} ·{" "}
                  {formatDate(allocation.updatedAt)}
                </>
              }
              right={<CirkaBadge status={allocation.status} />}
            />
          ))}
        </Panel>
      )}
    </div>
  );
}
