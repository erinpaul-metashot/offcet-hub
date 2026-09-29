"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import {
  DashboardHero,
  DashboardSection,
} from "@/components/dashboard-widgets";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { getMakerDashboard } from "../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  ACTION_URGENCY_CLASS,
  CirkaBadge,
  LinkRow,
  tileHref,
} from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { classNames } from "@/lib/utils";

type MakerDashboardView = ReturnType<typeof getMakerDashboard>;
type DashboardMessages = (typeof demoMaker)["en"]["dashboard"];
type Formatters = ReturnType<typeof useFormat>;

const MICRO_LABEL = "text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]";
const NEUTRAL_CARD_CLASS = "border-[var(--line)] text-[var(--ink)]";

interface ActionCardProps {
  href: string;
  title: string;
  context: string;
  toneClass: string;
}

function moreSuffix(count: number, t: DashboardMessages): string {
  return count > 1 ? format(t.more, { count: count - 1 }) : "";
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

function actionCardsFor(view: MakerDashboardView, t: DashboardMessages, fmt: Formatters): ActionCardProps[] {
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
            title: format(t.awaitingResponse, { count: proposed.length }),
            context: `${firstProposed.batchName} · ${fmt.quantity(
              firstProposed.allocation.quantityAllocated,
              firstProposed.allocation.unit,
            )}${moreSuffix(proposed.length, t)}`,
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
            title: format(t.productionOverdue, { count: overdueRows.length }),
            context: `${firstOverdue.production.productName} · ${format(t.units, {
              count: firstOverdue.production.plannedQuantity,
            })}${moreSuffix(overdueRows.length, t)}`,
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
            title: format(t.suitabilityDue, { count: view.feedbackDue.length }),
            context: `${firstFeedback.batchName}${moreSuffix(view.feedbackDue.length, t)}`,
            toneClass: ACTION_URGENCY_CLASS.waiting,
          },
        ]
      : []),
  ];
}

function ActionZone({ view }: { view: MakerDashboardView }) {
  const { dashboard: t } = useMessages(demoMaker);
  const fmt = useFormat();
  const cards = actionCardsFor(view, t, fmt);
  const active = view.metrics.activeProduction;

  return (
    <section className="space-y-3" aria-label={t.needsYou}>
      <ZoneHeader
        icon={<Zap size={14} aria-hidden className="text-[var(--brand-primary)]" />}
        label={t.needsYou}
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
            title={format(t.onSchedule, { count: active })}
            context={t.nothingOverdue}
            toneClass={NEUTRAL_CARD_CLASS}
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">{t.nothingWaiting}</p>
      )}
    </section>
  );
}

function MaterialSplitBar({ held, transformed }: { held: number; transformed: number }) {
  const total = held + transformed;
  const transformedPct = total > 0 ? Math.round((transformed / total) * 100) : 0;
  const heldPct = total > 0 ? 100 - transformedPct : 0;
  const { dashboard: t } = useMessages(demoMaker);
  const fmt = useFormat();

  return (
    <div className="space-y-2.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface)] ring-1 ring-inset ring-[var(--line)]">
        {transformed > 0 && (
          <div
            className="h-full bg-[var(--brand-secondary)]"
            style={{ width: `${transformedPct}%` }}
            title={format(t.barTitle, { label: t.intoProducts, quantity: fmt.quantity(transformed, "kg"), percent: transformedPct })}
          />
        )}
        {held > 0 && (
          <div
            className="h-full border-l border-[var(--paper)] bg-[var(--charcoal)]"
            style={{ width: `${heldPct}%` }}
            title={format(t.barTitle, { label: t.heldByYou, quantity: fmt.quantity(held, "kg"), percent: heldPct })}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] font-medium text-[var(--ink-muted)] tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--brand-secondary)]" />
          {t.intoProducts} · {fmt.quantity(transformed, "kg")} · {transformedPct}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--charcoal)]" />
          {t.inWorkshop} · {fmt.quantity(held, "kg")} · {heldPct}%
        </span>
      </div>
    </div>
  );
}

function MetricsZone({ view }: { view: MakerDashboardView }) {
  const { held, transformed, unitsMade, hours, yieldRate } = view.metrics;
  const { dashboard: t } = useMessages(demoMaker);
  const fmt = useFormat();
  const tiles = [
    { label: t.labourHours, value: format(t.hours, { count: fmt.number(hours) }) },
    { label: t.unitsMade, value: fmt.number(unitsMade) },
    { label: t.yieldRate, value: yieldRate === null ? "—" : `${Math.round(yieldRate * 100)}%` },
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
  const { dashboard: t } = useMessages(demoMaker);
  const fmt = useFormat();

  return (
    <div className="space-y-6">
      <DashboardHero title={organisation?.name ?? t.title} />

      <ActionZone view={view} />
      <MetricsZone view={view} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title={t.allocations}
          action={
            <Button as={Link} href="/demo/maker/allocations" variant="secondary" size="sm">
              {t.openAllocations}
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.allocations.slice(0, 6).map((entry) => (
              <LinkRow
                key={entry.allocation._id}
                href="/demo/maker/allocations"
                title={`${entry.allocation.reference} · ${entry.batchName}`}
                meta={`${entry.fromName} · ${fmt.quantity(entry.allocation.quantityAllocated, entry.allocation.unit)}${
                  entry.hasFeedback ? t.feedbackRecorded : ""
                }`}
                right={<CirkaBadge status={entry.allocation.status} />}
              />
            ))}
            {view.allocations.length === 0 && (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                {t.nothingAllocated}
              </p>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title={t.production}
          description={
            awaitingReview > 0 ? format(t.awaitingReview, { count: awaitingReview }) : undefined
          }
          action={
            <Button as={Link} href="/demo/maker/production" variant="secondary" size="sm">
              {t.openProduction}
            </Button>
          }
        >
          <div className="-mx-6 -mb-6">
            {view.production.map((entry) => (
              <LinkRow
                key={entry.production._id}
                href={`/demo/maker/production/${entry.production._id}`}
                title={`${entry.production.reference} · ${entry.production.productName}`}
                meta={`${format(t.units, { count: entry.production.actualQuantity ?? entry.production.plannedQuantity })}${
                  entry.production.plannedCompletionDate
                    ? format(t.due, { date: fmt.date(entry.production.plannedCompletionDate) })
                    : ""
                }${entry.overdue ? t.overdue : ""}`}
                right={<CirkaBadge status={entry.production.status} />}
              />
            ))}
            {view.production.length === 0 && (
              <p className="px-6 pb-6 text-sm text-[var(--ink-muted)]">
                {t.noProduction}
              </p>
            )}
          </div>
        </DashboardSection>
      </div>

      <RoleActivityFeed role="maker" />
    </div>
  );
}
