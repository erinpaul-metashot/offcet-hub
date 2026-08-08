"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ImageOff } from "lucide-react";
import { Button, EmptyState, Panel } from "@/components/ui";
import { listMakerProjects, UNASSIGNED_PROJECT } from "../../_mock/selectors-maker";
import type { MakerProjectRow } from "../../_mock/selectors-maker";
import { formatPercent, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  FlowBar,
  LinkRow,
  SectionHeading,
  materialFlowSegments,
} from "../../_components/cirka-ui";

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

  if (photos.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 bg-[var(--surface)] p-6 text-center lg:w-[220px] lg:shrink-0">
        <ImageOff size={18} className="text-[var(--ink-muted)]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          No finished output photographed yet
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
                title={`${p.output.productName} (${idx + 1}/${photos.length})`}
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
  const rows = listMakerProjects(db, scope.orgId);

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
        eyebrow="Projects"
        title="What you have made"
        action={
          <Button as={Link} href="/demo/maker/production/new" size="sm">
            New production batch
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing made yet"
          body="Open a production batch against an allocation."
        />
      ) : (
        <>
          <Panel className="space-y-5 p-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Material you turned into product
                </p>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  {formatQuantity(portfolio.incorporated, unit)}
                  <span className="ml-2 text-sm font-medium text-[var(--ink-muted)]">
                    of {formatQuantity(portfolio.used, unit)} used
                    {portfolio.used > 0
                      ? ` · ${formatPercent(portfolio.incorporated / portfolio.used)} yield`
                      : ""}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-8">
                <Figure label="Units completed" value={`${portfolio.units}`} />
                <Figure label="Labour hours" value={`${portfolio.hours}`} />
                <Figure
                  label="Runs"
                  value={`${portfolio.runs} across ${rows.length} project${rows.length === 1 ? "" : "s"}`}
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
                                  label={`${row.activeRuns} in production`}
                                />
                              )}
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {unassigned
                                ? "Own initiative · no brand brief"
                                : `${row.reference} · for ${row.brandName}`}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                              {formatQuantity(row.material.incorporated, row.material.unit)}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              into product
                              {row.material.yield !== undefined
                                ? ` · ${formatPercent(row.material.yield)} yield`
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
                            Material use not recorded yet:{" "}
                            {formatQuantity(row.material.received, row.material.unit)} received so far.
                          </p>
                        )}

                        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-[var(--line)] pt-4">
                          <div className="flex flex-wrap gap-8">
                            <Figure
                              label="Units"
                              value={`${row.unitsCompleted} of ${row.unitsPlanned || row.unitsCompleted} planned`}
                            />
                            <Figure label="Labour" value={`${row.hours} hrs`} />
                            <Figure
                              label="Evidence reviewed"
                              value={`${row.reviewedRuns} of ${row.runs.length} run${row.runs.length === 1 ? "" : "s"}`}
                            />
                          </div>

                          {!unassigned && (
                            <Link
                              href={`/demo/maker/projects/${row.key}`}
                              className="group inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--ink)]"
                            >
                              Open project
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
                                meta={`${production.reference} · from ${batch?.reference ?? "a resource batch"}`}
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
