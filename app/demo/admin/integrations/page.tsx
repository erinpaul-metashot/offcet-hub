"use client";

import { Button, EmptyState, Panel } from "@/components/ui";
import { listTransfers } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  SectionHeading,
  formatDateTime,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";

export default function AdminIntegrationsPage() {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const rows = listTransfers(store.db);

  const failed = rows.filter((row) => row.transfer.status === "failed");

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Integrations" title="Data moving in and out" />

      {error && <NoticeBanner tone="blocking" title="The retry was refused">{error}</NoticeBanner>}

      {failed.length > 0 && (
        <NoticeBanner tone="warning" title={`${failed.length} transfer(s) failed`}>
          Data that was thought to be sent was never sent. Each failure keeps its error message and
          attempt count so it can be retried rather than quietly lost.
        </NoticeBanner>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No transfers" body="Inbound and outbound attempts are recorded here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map(({ transfer, entityLabel }) => (
            <Panel key={transfer._id} className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--ink)]">
                    {transfer.direction === "inbound" ? "Inbound from" : "Outbound to"}{" "}
                    {transfer.externalSystemName}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {transfer.entityTable} · {entityLabel ?? transfer.entityId}
                  </p>
                </div>
                <CirkaBadge status={transfer.status} />
              </div>

              <dl>
                <DataRow label="External record" value={transfer.externalRecordId ?? "-"} />
                <DataRow
                  label="External link"
                  value={
                    transfer.externalRecordUrl ? (
                      <a
                        href={transfer.externalRecordUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-dotted"
                      >
                        Open in the partner system
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <DataRow label="Payload" value={transfer.payloadSummary ?? "-"} />
                <DataRow label="Attempts" value={transfer.attemptCount} />
                <DataRow label="Last attempt" value={formatDateTime(transfer.lastAttemptAt)} />
                <DataRow label="Succeeded" value={formatDateTime(transfer.succeededAt)} />
              </dl>

              {transfer.errorMessage && (
                <p className="rounded-2xl bg-[#FBE2E2] p-4 text-sm text-[#8A1F1F]">
                  {transfer.errorMessage}
                </p>
              )}

              {transfer.status !== "success" && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => run(() => store.retryTransfer("admin", { transferId: transfer._id }))}
                >
                  Retry transfer
                </Button>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
