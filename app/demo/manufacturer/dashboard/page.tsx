"use client";

import Link from "next/link";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardSection,
  HorizontalBarChart,
  TrendColumns,
} from "@/components/dashboard-widgets";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate } from "../../_components/cirka-ui";
import { getManufacturerDashboard } from "../../_mock/selectors-manufacturer";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { RoleActivityFeed } from "../../_components/trace-timeline";

export default function ManufacturerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("manufacturer");
  const view = getManufacturerDashboard(db, scope);
  const unit = view.unit;

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Manufacturer"
        title={`${organisation?.name ?? "Your organisation"}: inventory & allocations`}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <DashboardMetricCard
          label="Total lots"
          value={view.metrics.batchCount}
          hint={`${view.metrics.awaitingRelease} awaiting release`}
          href="/demo/manufacturer/batches"
        />
        <DashboardMetricCard
          label="Total size"
          value={formatQuantity(view.metrics.recorded, unit)}
          hint={`${formatQuantity(view.metrics.available, unit)} still available`}
          href="/demo/manufacturer/batches?status=awaiting_allocation"
        />
        <DashboardMetricCard
          label="Total transformed"
          value={formatQuantity(view.metrics.transformed, unit)}
          href="/demo/manufacturer/batches?status=closed"
        />
      </div>

      {view.metrics.openDiscrepancies > 0 && (
        <NoticeBanner tone="warning" title="A custodian has reported a quantity discrepancy">
          {view.discrepancies.map((entry) => (
            <p key={entry.allocation._id}>
              {entry.allocation.reference} · {entry.batch?.name}: {entry.counterpartyName} received{" "}
              {formatQuantity(entry.allocation.quantityReceived ?? 0, entry.allocation.unit)} against{" "}
              {formatQuantity(entry.allocation.quantityDispatched ?? 0, entry.allocation.unit)}{" "}
              dispatched.
            </p>
          ))}
        </NoticeBanner>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <DashboardMetricCard
          label="Committed"
          value={formatQuantity(view.metrics.committed, unit)}
        />
        <DashboardMetricCard
          label="Awaiting dispatch"
          value={view.metrics.awaitingDispatch}
          accent={view.metrics.awaitingDispatch > 0}
          href="/demo/manufacturer/dispatch"
        />
        <DashboardMetricCard
          label="Open discrepancies"
          value={view.metrics.openDiscrepancies}
          href="/demo/manufacturer/dispatch"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Dispatch queue"
          action={
            <Button as={Link} href="/demo/manufacturer/dispatch" variant="secondary" size="sm">
              Open dispatch
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.dispatchQueue.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                Nothing is waiting to be dispatched.
              </p>
            ) : (
              view.dispatchQueue.slice(0, 3).map((entry) => (
                <LinkRow
                  key={entry.allocation._id}
                  href="/demo/manufacturer/dispatch"
                  title={`${entry.allocation.reference} · ${entry.batch?.name ?? "Resource batch"}`}
                  tags={[
                    { label: "To", value: entry.toName },
                    { label: "Allocated", value: formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit) },
                    ...(entry.allocation.expectedDispatchDate
                      ? [{ label: "Expected", value: formatDate(entry.allocation.expectedDispatchDate) }]
                      : []),
                  ]}
                  right={<CirkaBadge status={entry.allocation.status} />}
                />
              ))
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Recently recorded"
          action={
            <Button as={Link} href="/demo/manufacturer/batches" variant="secondary" size="sm">
              All batches
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.recentBatches.slice(0, 3).map((row) => (
              <LinkRow
                key={row.batch._id}
                href={`/demo/manufacturer/batches/${row.batch._id}`}
                title={row.batch.name}
                tags={[
                  { label: "Ref", value: row.batch.reference },
                  { label: "Original", value: formatQuantity(row.batch.quantityOriginal, row.batch.unit) },
                  { label: "Available", value: formatQuantity(row.batch.pots.available, row.batch.unit) },
                ]}
                right={<CirkaBadge status={row.batch.exceptionStatus ?? row.batch.status} />}
              />
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <DashboardSection
          title="Batches recorded per month"
        >
          <TrendColumns items={view.trend} valueLabel="batches" />
        </DashboardSection>

        <DashboardSection title="Material categories">
          <HorizontalBarChart items={view.categories} emptyLabel="No batches recorded yet." />
        </DashboardSection>
      </div>

      {view.awaitingRelease.length > 0 && (
        <Panel className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Waiting to be released for matching
            </h2>
            <div className="-mx-6 -mb-6">
              {view.awaitingRelease.map((batch) => (
                <LinkRow
                  key={batch._id}
                  href={`/demo/manufacturer/batches/${batch._id}`}
                  title={batch.name}
                  tags={[
                    { label: "Ref", value: batch.reference },
                    { label: "Original", value: formatQuantity(batch.quantityOriginal, batch.unit) },
                    { label: "Recorded", value: formatDate(batch.createdAt) },
                  ]}
                  right={<CirkaBadge status={batch.status} />}
                />
              ))}
            </div>
          </div>
        </Panel>
      )}

      <RoleActivityFeed role="manufacturer" />
    </div>
  );
}
