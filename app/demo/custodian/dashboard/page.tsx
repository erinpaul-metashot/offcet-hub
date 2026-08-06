"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardSection,
  SummaryPill,
} from "@/components/dashboard-widgets";
import { getCustodianDashboard } from "../../_mock/selectors-custodian";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, NoticeBanner, formatDate } from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";

export default function CustodianDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("custodian");
  const view = getCustodianDashboard(db, scope);

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Custodian"
        title={`${organisation?.name ?? "Your node"}: arrivals, stock & dispatch`}
      >
        <SummaryPill label="Held here" value={formatQuantity(view.metrics.totalHeld, "kg")} />
        <SummaryPill label="Uncommitted" value={formatQuantity(view.metrics.uncommitted, "kg")} />
        <SummaryPill label="In transit to you" value={formatQuantity(view.metrics.inTransit, "kg")} />
      </DashboardHero>

      {view.metrics.openDiscrepancies > 0 && (
        <NoticeBanner tone="blocking" title="An open discrepancy is waiting on CIRKA" />
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Awaiting your acceptance"
          value={view.metrics.awaitingAcceptance}
          accent={view.metrics.awaitingAcceptance > 0}
        />
        <DashboardMetricCard label="Awaiting receipt" value={view.metrics.awaitingReceipt} />
        <DashboardMetricCard
          label="Overdue arrivals"
          value={view.metrics.overdue}
          accent={view.metrics.overdue > 0}
        />
        <DashboardMetricCard label="Makers served" value={view.metrics.makersServed} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Expected arrivals"
          action={
            <Button as={Link} href="/demo/custodian/arrivals" variant="secondary" size="sm">
              Open arrivals
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.arrivals.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">Nothing expected.</p>
            ) : (
              view.arrivals.slice(0, 5).map((entry) => (
                <LinkRow
                  key={entry.allocation._id}
                  href="/demo/custodian/arrivals"
                  title={`${entry.allocation.reference} · ${entry.batch?.name ?? "Resource batch"}`}
                  meta={`${entry.fromName} · ${formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}${
                    entry.allocation.expectedArrivalDate
                      ? ` · expected ${formatDate(entry.allocation.expectedArrivalDate)}`
                      : ""
                  }${entry.late ? " · overdue" : ""}`}
                  right={<CirkaBadge status={entry.allocation.status} />}
                />
              ))
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Stock held"
          action={
            <Button as={Link} href="/demo/custodian/stock" variant="secondary" size="sm">
              Open stock
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.holdings.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">Nothing held right now.</p>
            ) : (
              view.holdings.map((holding) => (
                <LinkRow
                  key={holding.batch._id}
                  href="/demo/custodian/stock"
                  title={holding.batch.name}
                  meta={`${holding.batch.reference} · owned by ${holding.ownerName} · ${formatQuantity(holding.uncommitted, holding.batch.unit)} uncommitted`}
                  right={
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {formatQuantity(holding.held, holding.batch.unit)}
                    </span>
                  }
                />
              ))
            )}
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        title="Out to makers"
        action={
          <Button as={Link} href="/demo/custodian/dispatches" variant="secondary" size="sm">
            Open dispatches
          </Button>
        }
      >
        <div className="-mx-6 -mb-6">
          {view.outgoing.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
              Nothing has been passed on yet.
            </p>
          ) : (
            view.outgoing.slice(0, 6).map((entry) => (
              <LinkRow
                key={entry.allocation._id}
                href="/demo/custodian/dispatches"
                title={`${entry.allocation.reference} · ${entry.makerName}`}
                meta={`${entry.batch?.name ?? "Resource batch"} · ${formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}`}
                right={<CirkaBadge status={entry.allocation.status} />}
              />
            ))
          )}
        </div>
      </DashboardSection>

      <RoleActivityFeed role="custodian" />
    </div>
  );
}
