"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { Button, EmptyState, Panel } from "@/components/ui";
import { RETEXCIR } from "../../../../_mock/domain";
import { categoryLabel, formatQuantity } from "../../../../_mock/selectors-shared";
import {
  getRetexcirConnection,
  listPendingArrivals,
  listRetexcirBatches,
  listRetexcirTransfers,
} from "../../../../_mock/selectors-intake";
import { useDemoPersona, useDemoStore } from "../../../../_mock/store";
import type { IntegrationConnection } from "../../../../_mock/types";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  SectionHeading,
  formatDate,
  formatDateTime,
} from "../../../../_components/cirka-ui";
import { useAction } from "../../../../_components/use-action";
import { ConnectPanel } from "./connect-panel";

const INBOX_HREF = "/demo/manufacturer/batches/import/inbox?channel=sorting_system";

/**
 * The Retexcir side of intake, end to end: connect the account, pull what has
 * been sorted, see exactly what came over the wire and what CIRKA did with it,
 * then confirm it into the ledger. Both systems stay one click apart.
 */
export default function RetexcirIntakePage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const connection = getRetexcirConnection(db, scope);
  const waiting = listPendingArrivals(db, scope, { channel: "sorting_system" });
  const transfers = listRetexcirTransfers(db, scope);
  const imported = listRetexcirBatches(db, scope);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intake · Sorting"
        title={`${RETEXCIR.systemName} sorted batches`}
        action={
          <Button as={Link} href="/demo/manufacturer/batches/import" variant="secondary" size="sm">
            <ArrowLeft size={15} />
            Back to intake
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
          Pulled and waiting on you
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
    </div>
  );
}

/** The two systems and the state of the link between them. */
function SystemBridge({ connection }: { connection?: IntegrationConnection }) {
  return (
    <Panel className="p-6">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <BridgeNode
          name={RETEXCIR.systemName}
          role="Sorted and graded"
          detail={connection ? `Account ${connection.accountRef}` : "Account not linked"}
        />

        <div className="flex flex-1 flex-col items-center gap-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
              connection ? "text-[var(--brand-secondary)]" : "text-[var(--ink-muted)]"
            }`}
          >
            {connection ? `Connected · ${RETEXCIR.events.join(", ")}` : "Not connected"}
          </span>
          <div className="flex w-full items-center gap-2">
            <div
              className={
                connection
                  ? "h-[2px] flex-1 bg-[var(--brand-primary)]"
                  : "h-0 flex-1 border-t-2 border-dashed border-[var(--line-strong)]"
              }
            />
            <ArrowRight
              size={16}
              className={connection ? "text-[var(--brand-primary)]" : "text-[var(--line-strong)]"}
            />
          </div>
          <span className="text-xs text-[var(--ink-muted)]">
            {connection
              ? `Last received ${formatDateTime(connection.lastSyncedAt)}`
              : "Records stay in Retexcir until you connect"}
          </span>
        </div>

        <BridgeNode name="CIRKA" role="Traceable ledger" detail="Confirmed batches, one reference" />
      </div>
    </Panel>
  );
}

function BridgeNode({ name, role, detail }: { name: string; role: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 sm:w-56">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {role}
      </p>
      <p className="mt-1 text-base font-semibold text-[var(--ink)]">{name}</p>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">{detail}</p>
    </div>
  );
}

function ConnectedPanel({
  connection,
  waitingCount,
}: {
  connection: IntegrationConnection;
  waitingCount: number;
}) {
  const store = useDemoStore();
  const pull = useAction();
  const disconnect = useAction();
  const [lastPull, setLastPull] = useState<{ accepted: boolean; message: string } | null>(null);

  return (
    <Panel className="space-y-5 p-6">
      {pull.error && (
        <NoticeBanner tone="warning" title={`${RETEXCIR.systemName} sent nothing`}>
          {pull.error}
        </NoticeBanner>
      )}
      {lastPull && !pull.error && (
        <NoticeBanner
          tone={lastPull.accepted ? "info" : "blocking"}
          title={lastPull.accepted ? "Record received" : "Record rejected at the door"}
        >
          {lastPull.message}
        </NoticeBanner>
      )}
      {disconnect.error && (
        <NoticeBanner tone="blocking" title="Couldn't disconnect the account">
          {disconnect.error}
        </NoticeBanner>
      )}

      <dl>
        <DataRow label="Account" value={connection.accountRef} />
        <DataRow label="Connected" value={formatDate(connection.connectedAt)} />
        <DataRow
          label="Push endpoint"
          value={
            <code className="font-mono text-[12px] break-all">
              {RETEXCIR.webhookUrl(connection.accountRef)}
            </code>
          }
          hint={`Retexcir POSTs ${RETEXCIR.events.join(" and ")} here, signed with the key exchanged at connect.`}
        />
        <DataRow
          label="Last received"
          value={connection.lastSyncedAt ? formatDateTime(connection.lastSyncedAt) : "Never"}
          hint={waitingCount > 0 ? `${waitingCount} awaiting confirmation` : undefined}
        />
      </dl>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
        <Button
          size="sm"
          disabled={pull.pending || disconnect.pending}
          onClick={() =>
            void pull.run(async () => {
              setLastPull(null);
              setLastPull(await store.pullRetexcirRecords("manufacturer"));
            })
          }
        >
          <RefreshCw size={15} className="mr-2" />
          Receive next sorted batch
        </Button>
        <Button
          as="a"
          href={RETEXCIR.appUrl}
          target="_blank"
          rel="noreferrer"
          size="sm"
          variant="secondary"
        >
          Open {RETEXCIR.systemName}
          <ExternalLink size={15} className="ml-2" />
        </Button>
        {waitingCount > 0 && (
          <Button as={Link} href={INBOX_HREF} size="sm" variant="secondary">
            Review {waitingCount}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          disabled={pull.pending || disconnect.pending}
          onClick={() => void disconnect.run(() => store.disconnectRetexcirAccount("manufacturer"))}
        >
          Disconnect
        </Button>
      </div>
    </Panel>
  );
}

function RetexcirLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
    >
      {children}
      <ExternalLink size={14} />
    </a>
  );
}
