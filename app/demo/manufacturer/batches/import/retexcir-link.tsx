"use client";

/**
 * The Retexcir side of intake: the link between the two systems and the
 * controls that act on it. This is the primary way material data reaches
 * CIRKA, so it sits at the top of the intake screen — everything else on that
 * page is a fallback for material Retexcir never handled.
 */

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, RefreshCw, PlugZap } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { RETEXCIR } from "../../../_mock/domain";
import { useDemoStore } from "../../../_mock/store";
import type { IntegrationConnection } from "../../../_mock/types";
import { DataRow, NoticeBanner, formatDate, formatDateTime } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";

export const INBOX_HREF = "/demo/manufacturer/batches/import/inbox?channel=sorting_system";

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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Panel className="space-y-4 p-5 border-[var(--line)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8CC63F]/10 text-[#8CC63F]">
            <PlugZap size={20} />
          </div>
          <div>
            <h3 className="font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Connected to {RETEXCIR.systemName}
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Receiving automated imports • Last sync:{" "}
              {connection.lastSyncedAt ? formatDateTime(connection.lastSyncedAt) : "Never"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            <RefreshCw size={15} className={`mr-2 ${pull.pending ? "animate-spin" : ""}`} />
            Receive next batch
          </Button>
        </div>
      </div>

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

      <div className="border-t border-[var(--line)] pt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between py-1 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <span className="font-medium">Technical Details</span>
          {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {showDetails && (
          <div className="mt-4 space-y-4 pb-2">
            <dl className="space-y-3">
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
            </dl>
            <div className="flex items-center gap-3 pt-2">
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
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-[#8A3D11] hover:bg-[#8A3D11]/10 hover:text-[#8A3D11]"
                disabled={pull.pending || disconnect.pending}
                onClick={() => void disconnect.run(() => store.disconnectRetexcirAccount("manufacturer"))}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
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
      className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[#FF5C00]"
    >
      {children}
      <ExternalLink size={14} />
    </a>
  );
}
