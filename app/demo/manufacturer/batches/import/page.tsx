"use client";

/**
 * Intake, end to end. Retexcir is the flow: connect the account, receive what
 * has been sorted, see exactly what came over the wire and what CIRKA did with
 * it, then confirm it into the ledger. Manual entry, spreadsheets and the ERP
 * connector are folded away underneath as the exceptions they are.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, EmptyState, Panel } from "@/components/ui";
import { RETEXCIR } from "../../../_mock/domain";
import { categoryLabel, formatQuantity } from "../../../_mock/selectors-shared";
import {
  getRetexcirConnection,
  listPendingArrivals,
  listRetexcirBatches,
  listRetexcirTransfers,
} from "../../../_mock/selectors-intake";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  SectionHeading,
  formatDate,
  formatDateTime,
} from "../../../_components/cirka-ui";
import { ConnectPanel } from "./connect-panel";
import { OtherWaysIn } from "./other-ways";
import { ConnectedPanel, INBOX_HREF, RetexcirLink, SystemBridge } from "./retexcir-link";

export default function IntakePage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const connection = getRetexcirConnection(db, scope);
  const waiting = listPendingArrivals(db, scope, { channel: "sorting_system" });
  const transfers = listRetexcirTransfers(db, scope);
  const imported = listRetexcirBatches(db, scope);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intake"
        title={`Sorted material arrives from ${RETEXCIR.systemName}`}
        action={
          <Button as={Link} href="/demo/manufacturer/batches" variant="secondary" size="sm">
            All batches
          </Button>
        }
      />

      <SystemBridge connection={connection} />

      {connection ? (
        <ConnectedPanel connection={connection} waitingCount={waiting.length} />
      ) : (
        <ConnectPanel />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
          Received and waiting on you
        </h2>
        {waiting.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            body={
              connection
                ? `Pull again once a batch has been sorted in ${RETEXCIR.systemName}.`
                : `Connect the account to receive sorted batches from ${RETEXCIR.systemName}.`
            }
          />
        ) : (
          <Panel className="divide-y divide-[var(--line)] p-0">
            {waiting.map((arrival) => (
              <div
                key={arrival._id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--ink)]">
                    {arrival.name ?? "Untitled record"}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {arrival.externalRecordId} ·{" "}
                    {arrival.materialCategory
                      ? categoryLabel(arrival.materialCategory)
                      : "no category sent"}{" "}
                    ·{" "}
                    {arrival.quantity !== undefined && arrival.unit
                      ? formatQuantity(arrival.quantity, arrival.unit)
                      : "quantity needs a person"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {arrival.externalRecordUrl && (
                    <RetexcirLink href={arrival.externalRecordUrl}>View in Retexcir</RetexcirLink>
                  )}
                  <Button as={Link} href={INBOX_HREF} size="sm">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Transfer log</h2>
        {transfers.length === 0 ? (
          <EmptyState
            title="No transfers yet"
            body="Every record Retexcir hands over is logged here, accepted or rejected."
          />
        ) : (
          <Panel className="divide-y divide-[var(--line)] p-0">
            {transfers.map((transfer) => (
              <div
                key={transfer._id}
                className="flex flex-wrap items-start justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-[13px] text-[var(--ink)]">
                    {transfer.externalRecordId}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatDateTime(transfer.createdAt)} · {transfer.payloadSummary}
                  </p>
                  {transfer.errorMessage && (
                    <p className="max-w-2xl text-xs leading-relaxed text-[#8A3D11]">
                      {transfer.errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {transfer.externalRecordUrl && (
                    <RetexcirLink href={transfer.externalRecordUrl}>Payload source</RetexcirLink>
                  )}
                  <CirkaBadge
                    status={transfer.status}
                    label={transfer.status === "success" ? "Accepted" : "Rejected"}
                  />
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
          Already in your ledger
        </h2>
        {imported.length === 0 ? (
          <EmptyState
            title="No sorted batches recorded yet"
            body="Confirmed records appear here with a link back to their Retexcir record."
          />
        ) : (
          <Panel className="divide-y divide-[var(--line)] p-0">
            {imported.map((batch) => (
              <div
                key={batch._id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/demo/manufacturer/batches/${batch._id}`}
                    className="group inline-flex items-center gap-2 font-medium text-[var(--ink)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
                  >
                    {batch.name}
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1"
                    />
                  </Link>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {batch.reference} · {batch.externalRecordId ?? "no Retexcir reference"} ·
                    imported {formatDate(batch.importedAt ?? batch.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-[var(--ink-muted)]">
                    {formatQuantity(batch.quantityOriginal, batch.unit)}
                  </span>
                  <CirkaBadge status={batch.status} />
                  {batch.externalRecordUrl && (
                    <RetexcirLink href={batch.externalRecordUrl}>Retexcir record</RetexcirLink>
                  )}
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      <OtherWaysIn />
    </div>
  );
}
