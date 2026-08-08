"use client";

/**
 * The fallbacks, folded away. Sorted material arrives from Retexcir on its own;
 * these three channels exist for what it never handled — legacy stock, a
 * one-off, or a system still being wired up. Kept behind a disclosure so the
 * intake screen reads as one flow with exceptions, not four equal options.
 */

import Link from "next/link";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Button, EmptyState, Panel } from "@/components/ui";
import { DATA_SOURCE_LABELS } from "../../../_mock/domain";
import { listIntakeChannels, listIntakeJobs } from "../../../_mock/selectors-intake";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner, formatDateTime } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";

/** One line each on why you would reach for a channel instead of the connector. */
const CHANNEL_NOTE: Record<string, string> = {
  manual_entry: "One batch, typed by a person. Lands as self-reported until someone verifies it.",
  csv_import: "Map a column export once, then commit the rows in one go.",
  erp_import: "Records your ERP pushes across. Still needs confirming, same as sorted batches.",
};

const CHANNEL_HREF: Record<string, string> = {
  manual_entry: "/demo/manufacturer/batches/new",
  csv_import: "/demo/manufacturer/batches/import/map",
};

export function OtherWaysIn() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const channels = listIntakeChannels(db, scope).filter(
    (channel) => channel.dataSource !== "sorting_system",
  );
  const jobs = listIntakeJobs(db, scope);
  const pendingCount = channels.reduce((sum, channel) => sum + channel.pendingCount, 0);

  return (
    <details className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Optional
          </p>
          <p className="mt-1 font-semibold text-[var(--ink)]">
            Other ways to get material in
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
          {pendingCount > 0 && (
            <span className="tabular-nums text-[var(--brand-primary)]">
              {pendingCount} waiting
            </span>
          )}
          <span className="hidden sm:inline">
            {channels.map((channel) => channel.name).join(" · ")}
          </span>
          <ChevronDown
            size={16}
            className="transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-180"
          />
        </div>
      </summary>

      <div className="space-y-6 border-t border-[var(--line)] px-6 py-5">
        <Panel className="p-0">
          {channels.map((channel) => {
            const href = CHANNEL_HREF[channel.id];

            if (href) {
              return (
                <LinkRow
                  key={channel.id}
                  href={href}
                  title={channel.name}
                  meta={CHANNEL_NOTE[channel.id]}
                  right={
                    <span className="hidden text-xs text-[var(--ink-muted)] sm:inline">
                      {formatDateTime(channel.lastActivityAt)}
                    </span>
                  }
                />
              );
            }

            if (channel.kind === "connector") {
              return (
                <ConnectorRow
                  key={channel.id}
                  channelId={channel.id}
                  name={channel.name}
                  note={CHANNEL_NOTE[channel.id]}
                  pendingCount={channel.pendingCount}
                  lastActivityAt={channel.lastActivityAt}
                />
              );
            }

            return (
              <div
                key={channel.id}
                className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-3.5 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{channel.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{CHANNEL_NOTE[channel.id]}</p>
                </div>
                <CirkaBadge status="pending" label="Not connected" />
              </div>
            );
          })}
        </Panel>

        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Recent intake
          </h3>
          {jobs.length === 0 ? (
            <EmptyState title="No imports yet" body="Committed imports appear here." />
          ) : (
            <Panel className="divide-y divide-[var(--line)] p-0">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {job.fileName ?? "Pasted sheet"}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {DATA_SOURCE_LABELS[job.source]} · {formatDateTime(job.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)]">
                    <span className="tabular-nums">{job.createdCount ?? 0} queued</span>
                    <span className="tabular-nums">{job.updatedCount ?? 0} updated</span>
                    <span className="tabular-nums">{job.failedCount ?? 0} failed</span>
                    <CirkaBadge status={job.status} />
                  </div>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </details>
  );
}

function ConnectorRow({
  channelId,
  name,
  note,
  pendingCount,
  lastActivityAt,
}: {
  channelId: string;
  name: string;
  note?: string;
  pendingCount: number;
  lastActivityAt?: number;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  /** Only the ERP channel lands here: Retexcir has the top of the page. */
  const externalSystemName = "Nordväst ERP";

  return (
    <div className="space-y-3 border-b border-[var(--line)] px-5 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">{name}</p>
          {note && <p className="text-xs text-[var(--ink-muted)]">{note}</p>}
        </div>
        <span className="text-xs text-[var(--ink-muted)]">{formatDateTime(lastActivityAt)}</span>
      </div>

      {error && (
        <NoticeBanner tone="warning" title="Couldn't check for new records">
          {error}
        </NoticeBanner>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await store.receiveArrival("manufacturer", {
                channel: "erp_import",
                externalSystemName,
              });
            })
          }
        >
          <RefreshCw size={15} />
          Check for new records
        </Button>
        {pendingCount > 0 && (
          <Button
            as={Link}
            href={`/demo/manufacturer/batches/import/inbox?channel=${channelId}`}
            size="sm"
          >
            Review {pendingCount}
          </Button>
        )}
      </div>
    </div>
  );
}
