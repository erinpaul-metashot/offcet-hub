"use client";

/**
 * The Retexcir side of intake: the link between the two systems and the
 * controls that act on it. This is the primary way material data reaches
 * CIRKA, so it sits at the top of the intake screen — everything else on that
 * page is a fallback for material Retexcir never handled.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { RETEXCIR } from "../../../_mock/domain";
import { useDemoStore } from "../../../_mock/store";
import type { IntegrationConnection } from "../../../_mock/types";
import { DataRow, NoticeBanner, formatDate, formatDateTime } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";

export const INBOX_HREF = "/demo/manufacturer/batches/import/inbox?channel=sorting_system";

/** The two systems and the state of the link between them. */
export function SystemBridge({ connection }: { connection?: IntegrationConnection }) {
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

export function ConnectedPanel({
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

export function RetexcirLink({ href, children }: { href: string; children: React.ReactNode }) {
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
