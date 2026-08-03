"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button, EmptyState, Panel } from "@/components/ui";
import { DATA_SOURCE_LABELS } from "../../../_mock/domain";
import { listIntakeChannels, listIntakeJobs } from "../../../_mock/selectors-intake";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { CirkaBadge, NoticeBanner, SectionHeading, formatDateTime } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";

const CHANNEL_HREF: Partial<Record<string, string>> = {
  manual_entry: "/demo/manufacturer/batches/new",
  csv_import: "/demo/manufacturer/batches/import/map",
};

export default function ImportBatchesPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const channels = listIntakeChannels(db, scope);
  const jobs = listIntakeJobs(db, scope);
  const totalPending = channels.reduce((sum, channel) => sum + channel.pendingCount, 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intake"
        title="Where your material data comes in"
        description="Five ways a batch can reach CIRKA. Connected systems queue their records here for a human to confirm before anything becomes a batch."
        action={
          <Button as={Link} href="/demo/manufacturer/batches" variant="secondary" size="sm">
            All batches
          </Button>
        }
      />

      {totalPending > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--brand-primary)] bg-[var(--brand-primary-muted)] px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
              Waiting on you
            </p>
            <p className="mt-1 text-sm text-[var(--ink)]">
              {totalPending} record{totalPending === 1 ? "" : "s"} pushed by a connected system need
              {totalPending === 1 ? "s" : ""} confirmation before becoming a batch.
            </p>
          </div>
          <Button as={Link} href="/demo/manufacturer/batches/import/inbox" size="sm">
            Review them
          </Button>
        </div>
      ) : (
        <NoticeBanner tone="info" title="Nothing waiting on you">
          Every record a connected system has pushed has been confirmed or skipped.
        </NoticeBanner>
      )}

      <Panel className="divide-y divide-[var(--line)] p-0">
        {channels.map((channel) => {
          const href = CHANNEL_HREF[channel.id];

          if (href) {
            return (
              <Link
                key={channel.id}
                href={href}
                className="group flex items-center justify-between gap-4 px-6 py-4 transition-[background-color,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-[1px] hover:bg-[var(--surface)]"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">{channel.name}</p>
                  <p className="text-sm text-[var(--ink-muted)]">{channel.description}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
                  <span>{formatDateTime(channel.lastActivityAt)}</span>
                  <ArrowRight
                    size={16}
                    className="text-[var(--ink-muted)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
                  />
                </div>
              </Link>
            );
          }

          if (channel.kind === "connector") {
            return (
              <ConnectorRow
                key={channel.id}
                channelId={channel.id}
                name={channel.name}
                description={channel.description}
                pendingCount={channel.pendingCount}
                lastActivityAt={channel.lastActivityAt}
              />
            );
          }

          return (
            <div key={channel.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-semibold text-[var(--ink)]">{channel.name}</p>
                <p className="text-sm text-[var(--ink-muted)]">{channel.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <CirkaBadge status="pending" label="Not connected" />
                <Button size="sm" variant="ghost" disabled>
                  Request an API key
                </Button>
              </div>
            </div>
          );
        })}
      </Panel>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Recent intake</h2>
        {jobs.length === 0 ? (
          <EmptyState
            title="No imports yet"
            body="Once you commit a spreadsheet import, it will show up here with its row counts."
          />
        ) : (
          <Panel className="divide-y divide-[var(--line)] p-0">
            {jobs.map((job) => (
              <div key={job._id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-medium text-[var(--ink)]">{job.fileName ?? "Pasted sheet"}</p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {DATA_SOURCE_LABELS[job.source]} · {formatDateTime(job.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--ink-muted)]">
                  <span className="tabular-nums">{job.createdCount ?? 0} created</span>
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
  );
}

function ConnectorRow({
  channelId,
  name,
  description,
  pendingCount,
  lastActivityAt,
}: {
  channelId: string;
  name: string;
  description: string;
  pendingCount: number;
  lastActivityAt?: number;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const externalSystemName = channelId === "erp_import" ? "Nordväst ERP" : "Fibre sorting line";

  return (
    <div className="space-y-3 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-[var(--ink)]">{name}</p>
          <p className="text-sm text-[var(--ink-muted)]">{description}</p>
        </div>
        <span className="text-sm text-[var(--ink-muted)]">{formatDateTime(lastActivityAt)}</span>
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
                channel: channelId as "erp_import" | "sorting_system",
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
