"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ImageOff } from "lucide-react";
import { Button, EmptyState, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { listMakerProjects, UNASSIGNED_PROJECT } from "../../_mock/selectors-maker";
import type { MakerProjectRow } from "../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  FlowBar,
  LinkRow,
  SectionHeading,
  materialFlowSegments,
} from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";

interface Disposition {
  incorporated: number;
  prototypes: number;
  remaining: number;
  offcuts: number;
  loss: number;
}

/** The five dispositions of used material, in the shape `FlowBar` wants. */
function segmentsFor(material: Disposition) {
  return materialFlowSegments({
    incorporated: material.incorporated,
    prototypes: material.prototypes,
    reusable: material.remaining,
    offcuts: material.offcuts,
    loss: material.loss,
  });
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="text-sm font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

/** Finished work, photographed. Single frame with photo pagination to maintain clean card height. */
function OutputRail({ row }: { row: MakerProjectRow }) {
  const photos = row.outputs.flatMap((output) =>
    output.finishedImageUrls.map((url) => ({ url, output }))
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const { projects: t } = useMessages(demoMaker);

  if (photos.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 bg-[var(--surface)] p-6 text-center lg:w-[220px] lg:shrink-0">
        <ImageOff size={18} className="text-[var(--ink-muted)]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {t.noPhoto}
        </p>
      </div>
    );
  }

  const current = photos[activeIndex] ?? photos[0];

  return (
    <div className="group relative min-h-[180px] w-full overflow-hidden bg-[var(--surface)] lg:w-[220px] lg:shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt={current.output.productName}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-[var(--ink)]/85 via-[var(--ink)]/40 to-transparent p-3 pt-8 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white drop-shadow-sm">
          {current.output.productName} · {current.output.numberCompleted ?? 0} made
        </p>
        {photos.length > 1 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {photos.map((p, idx) => (
              <button
                key={`${p.output._id}-${p.url}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === activeIndex
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/90"
                }`}
                title={format(t.photoOf, { product: p.output.productName, n: idx + 1, total: photos.length })}
              />
            ))}
            <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-white/80">
              {activeIndex + 1}/{photos.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MakerProjectsPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const allRows = listMakerProjects(db, scope.orgId);
  const { projects: t } = useMessages(demoMaker);
  const fmt = useFormat();
  const upcoming = allRows.filter((row) => row.runs.length === 0);
  const rows = allRows.filter((row) => row.runs.length > 0);

  const unit = rows[0]?.material.unit ?? "kg";
  const portfolio = rows.reduce(
    (total, row) => ({
      used: total.used + row.material.used,
      incorporated: total.incorporated + row.material.incorporated,
      prototypes: total.prototypes + row.material.prototypes,
      remaining: total.remaining + row.material.remaining,
      offcuts: total.offcuts + row.material.offcuts,
      loss: total.loss + row.material.loss,
      units: total.units + row.unitsCompleted,
      hours: total.hours + row.hours,
      runs: total.runs + row.runs.length,
    }),
    { used: 0, incorporated: 0, prototypes: 0, remaining: 0, offcuts: 0, loss: 0, units: 0, hours: 0, runs: 0 },
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t.title}
        action={
          <Button as={Link} href="/demo/maker/production/new" size="sm">
            {t.newProduction}
          </Button>
        }
      />

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.upcoming}
          </p>
          <Panel className="overflow-hidden p-0">
            {upcoming.map((row) => (
              <LinkRow
                key={row.key}
                href={`/demo/maker/projects/${row.key}`}
                title={row.title}
                meta={format(t.upcomingMeta, { reference: row.reference ?? "", brand: row.brandName ?? "" })}
                right={row.project && <CirkaBadge status={row.project.status} />}
              />
            ))}
          </Panel>
        </section>
      )}

      {rows.length === 0 ? (
        upcoming.length === 0 && <EmptyState title={t.nothingMade} />
      ) : (
        <>
          <Panel className="space-y-5 p-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {t.intoProduct}
                </p>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  {fmt.quantity(portfolio.incorporated, unit)}
                  <span className="ml-2 text-sm font-medium text-[var(--ink-muted)]">
                    {format(t.ofUsed, { quantity: fmt.quantity(portfolio.used, unit) })}
                    {portfolio.used > 0
                      ? format(t.yield, { percent: fmt.percent(portfolio.incorporated / portfolio.used) })
                      : ""}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-8">
                <Figure label={t.unitsCompleted} value={fmt.number(portfolio.units)} />
                <Figure label={t.labourHours} value={fmt.number(portfolio.hours)} />
                <Figure
                  label={t.runs}
                  value={format(rows.length === 1 ? t.runsAcrossOne : t.runsAcrossMany, { runs: portfolio.runs, count: rows.length })}
                />
              </div>
            </div>

            <FlowBar segments={segmentsFor(portfolio)} max={portfolio.used} unit={unit} />
          </Panel>

          <ul className="space-y-6">
            {rows.map((row) => {
              const unassigned = row.key === UNASSIGNED_PROJECT;
              const segments = segmentsFor(row.material);

              return (
                <li key={row.key}>
                  <Panel className="animate-stagger-in overflow-hidden p-0">
                    <div className="flex flex-col lg:flex-row">
                      <OutputRail row={row} />

                      <div className="min-w-0 flex-1 space-y-5 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                                {row.title}
                              </h2>
                              {row.project && <CirkaBadge status={row.project.status} />}
                              {row.activeRuns > 0 && (
                                <CirkaBadge
                                  status="in_production"
                                  label={format(t.inProduction, { count: row.activeRuns })}
                                />
                              )}
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {unassigned
                                ? t.ownInitiative
                                : format(t.forBrand, { reference: row.reference ?? "", brand: row.brandName ?? "" })}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                              {fmt.quantity(row.material.incorporated, row.material.unit)}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {t.intoProductLower}
                              {row.material.yield !== undefined
                                ? format(t.yield, { percent: fmt.percent(row.material.yield) })
                                : ""}
                            </p>
                          </div>
                        </div>

                        {segments.length > 0 ? (
                          <FlowBar
                            segments={segments}
                            max={row.material.used}
                            unit={row.material.unit}
                          />
                        ) : (
                          <p className="text-sm text-[var(--ink-muted)]">
                            {format(t.receivedNoUse, { quantity: fmt.quantity(row.material.received, row.material.unit) })}
                          </p>
                        )}

                        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-[var(--line)] pt-4">
                          <div className="flex flex-wrap gap-8">
                            <Figure
                              label={t.units}
                              value={format(t.unitsOf, { completed: row.unitsCompleted, planned: row.unitsPlanned || row.unitsCompleted })}
                            />
                            <Figure label={t.labour} value={format(t.hrs, { count: row.hours })} />
                            <Figure
                              label={t.evidenceReviewed}
                              value={format(row.runs.length === 1 ? t.runsReviewedOne : t.runsReviewedMany, {
                                reviewed: row.reviewedRuns,
                                count: row.runs.length,
                              })}
                            />
                          </div>

                          {!unassigned && (
                            <Link
                              href={`/demo/maker/projects/${row.key}`}
                              className="group inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--ink)]"
                            >
                              {t.openProject}
                              <ArrowRight
                                size={14}
                                className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1"
                              />
                            </Link>
                          )}
                        </div>

                        {unassigned && (
                          <div className="-mx-6 -mb-6 border-t border-[var(--line)]">
                            {row.runs.map(({ production, batch }) => (
                              <LinkRow
                                key={production._id}
                                href={`/demo/maker/production/${production._id}`}
                                title={production.productName}
                                meta={format(t.fromBatch, { reference: production.reference, batch: batch?.reference ?? t.aBatch })}
                                right={<CirkaBadge status={production.status} />}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
