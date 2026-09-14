"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { getMakerDashboard } from "../../_mock/selectors-maker";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  ACTION_URGENCY_CLASS,
  CirkaBadge,
  LinkRow,
  formatDate,
  tileHref,
} from "../../_components/cirka-ui";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { classNames } from "@/lib/utils";

type MakerDashboardView = ReturnType<typeof getMakerDashboard>;

const MICRO_LABEL = "text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]";
const NEUTRAL_CARD_CLASS = "border-[var(--line)] text-[var(--ink)]";

interface ActionCardProps {
  href: string;
  title: string;
  context: string;
  toneClass: string;
}

function moreSuffix(count: number): string {
  return count > 1 ? ` · +${count - 1} more` : "";
}

function ZoneHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className={MICRO_LABEL}>{label}</p>
    </div>
  );
}

function ActionCard({ href, title, context, toneClass }: ActionCardProps) {
  return (
    <Link
      href={href}
      className={classNames(
        "group flex items-center justify-between gap-4 rounded-2xl border bg-[var(--paper)] px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
        toneClass,
      )}
    >
      <span className="min-w-0 space-y-1">
        <span className="block text-base font-semibold tracking-[-0.02em] tabular-nums">
          {title}
        </span>
        <span className="block truncate text-[13px] text-[var(--ink-muted)] tabular-nums">
          {context}
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current">
        <ArrowRight
          size={16}
          aria-hidden
          className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </span>
    </Link>
  );
}

function actionCardsFor(view: MakerDashboardView): ActionCardProps[] {
  const proposed = view.allocations.filter((entry) => entry.allocation.status === "proposed");
  const overdueRows = view.production.filter((row) => row.overdue);
  const [firstProposed] = proposed;
  const [firstOverdue] = overdueRows;
  const [firstFeedback] = view.feedbackDue;

  return [
    ...(firstProposed
      ? [
          {
            href: tileHref(
              proposed,
              "/demo/maker/allocations?tab=needs-you",
              (entry) => `/demo/maker/allocations?id=${entry.allocation._id}`,
            ),
            title: `${proposed.length} awaiting response`,
            context: `${firstProposed.batchName} · ${formatQuantity(
              firstProposed.allocation.quantityAllocated,
              firstProposed.allocation.unit,
            )}${moreSuffix(proposed.length)}`,
            toneClass: ACTION_URGENCY_CLASS.waiting,
          },
        ]
      : []),
    ...(firstOverdue
      ? [
          {
            href: tileHref(
              overdueRows,
              "/demo/maker/production",
              (row) => `/demo/maker/production/${row.production._id}`,
            ),
            title: `${overdueRows.length} production overdue`,
            context: `${firstOverdue.production.productName} · ${
              firstOverdue.production.plannedQuantity
            } units${moreSuffix(overdueRows.length)}`,
            toneClass: ACTION_URGENCY_CLASS.late,
          },
        ]
      : []),
    ...(firstFeedback
      ? [
          {
            href: tileHref(
              view.feedbackDue,
              "/demo/maker/allocations?tab=needs-you",
              (entry) => `/demo/maker/allocations?id=${entry.allocation._id}`,
            ),
            title: `${view.feedbackDue.length} suitability due`,
            context: `${firstFeedback.batchName}${moreSuffix(view.feedbackDue.length)}`,
            toneClass: ACTION_URGENCY_CLASS.waiting,
          },
        ]
      : []),
  ];
}

function ActionZone({ view }: { view: MakerDashboardView }) {
  const cards = actionCardsFor(view);
  const active = view.metrics.activeProduction;

  return (
    <section className="space-y-3" aria-label="Needs you now">
      <ZoneHeader
        icon={<Zap size={14} aria-hidden className="text-[var(--brand-primary)]" />}
        label="Needs you now"
      />
      {cards.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <ActionCard key={card.title} {...card} />
          ))}
        </div>
      ) : active > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            href="/demo/maker/production"
            title={`${active} in production · on schedule`}
            context="Nothing overdue"
            toneClass={NEUTRAL_CARD_CLASS}
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">Nothing waiting on you.</p>
      )}
    </section>
  );
}

function MaterialSplitBar({ held, transformed }: { held: number; transformed: number }) {
  const total = held + transformed;
  const transformedPct = total > 0 ? Math.round((transformed / total) * 100) : 0;
  const heldPct = total > 0 ? 100 - transformedPct : 0;

  return (
    <div className="space-y-2.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)]">
        {transformed > 0 && (
          <div
            className="h-full bg-[var(--brand-secondary)]"
            style={{ width: `${transformedPct}%` }}
            title={`Into products: ${formatQuantity(transformed, "kg")} (${transformedPct}%)`}
          />
        )}
        {held > 0 && (
          <div
            className="h-full border-l border-[var(--paper)] bg-[var(--charcoal)]"
            style={{ width: `${heldPct}%` }}
            title={`Held by you: ${formatQuantity(held, "kg")} (${heldPct}%)`}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] font-medium text-[var(--ink-muted)] tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--brand-secondary)]" />
          Into products · {formatQuantity(transformed, "kg")} · {transformedPct}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--charcoal)]" />
          In your workshop · {formatQuantity(held, "kg")} · {heldPct}%
        </span>
      </div>
    </div>
  );
}

function MetricsZone({ view }: { view: MakerDashboardView }) {
  const { held, transformed, unitsMade, hours, yieldRate } = view.metrics;
  const tiles = [
    { label: "Labour hours", value: `${hours}h` },
    { label: "Units made", value: String(unitsMade) },
    { label: "Yield rate", value: yieldRate === null ? "—" : `${Math.round(yieldRate * 100)}%` },
  ];

  return (
    <Panel className="space-y-5 p-5">
      <MaterialSplitBar held={held} transformed={transformed} />
      <dl className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex flex-col-reverse gap-1 rounded-xl bg-[var(--surface)] px-4 py-3.5"
          >
            <dt className={MICRO_LABEL}>{tile.label}</dt>
            <dd className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)] tabular-nums">
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export default function MakerDashboardPage() {
  const { db } = useDemoStore();
  const { scope, organisation } = useDemoPersona("maker");
  const view = getMakerDashboard(db, scope);
  const awaitingReview = view.metrics.awaitingReview;

  return (
    <div className="space-y-6">
      <DashboardHero title={organisation?.name ?? "Dashboard"} />

      <ActionZone view={view} />
      <MetricsZone view={view} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Allocations"
          action={
            <Button as={Link} href="/demo/maker/allocations" variant="secondary" size="sm">
              Open allocations
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.allocations.slice(0, 6).map((entry) => (
              <LinkRow
                key={entry.allocation._id}
                href="/demo/maker/allocations"
                title={`${entry.allocation.reference} · ${entry.batchName}`}
                meta={`${entry.fromName} · ${formatQuantity(entry.allocation.quantityAllocated, entry.allocation.unit)}${
                  entry.hasFeedback ? " · feedback recorded" : ""
                }`}
                right={<CirkaBadge status={entry.allocation.status} />}
              />
            ))}
            {view.allocations.length === 0 && (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                Nothing allocated to you yet.
              </p>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Production"
          description={
            awaitingReview > 0 ? `${awaitingReview} awaiting CIRKA review` : undefined
          }
          action={
            <Button as={Link} href="/demo/maker/production" variant="secondary" size="sm">
              Open production
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.production.map((entry) => (
              <LinkRow
                key={entry.production._id}
                href={`/demo/maker/production/${entry.production._id}`}
                title={`${entry.production.reference} · ${entry.production.productName}`}
                meta={`${entry.production.actualQuantity ?? entry.production.plannedQuantity} units${
                  entry.production.plannedCompletionDate
                    ? ` · due ${formatDate(entry.production.plannedCompletionDate)}`
                    : ""
                }${entry.overdue ? " · overdue" : ""}`}
                right={<CirkaBadge status={entry.production.status} />}
              />
            ))}
            {view.production.length === 0 && (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                No production batches yet.
              </p>
            )}
          </div>
        </DashboardSection>
      </div>

      <RoleActivityFeed role="maker" />
    </div>
  );
}
