"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { Button, EmptyState, Input, Panel, Select } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import { PROJECT_STATUSES } from "../../_mock/domain";
import { statusLabelIn } from "../../_mock/domain-labels";
import { getBrandDashboard } from "../../_mock/selectors-brand";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  SectionHeading,
} from "../../_components/cirka-ui";
import { ProjectJourneyStepper } from "../../_components/project-journey-stepper";
import { useAction } from "../../_components/use-action";
import { useFormat } from "../../_components/use-format";
import { useLabels } from "../../_components/use-labels";

/** What the evidence actually says. Nothing is claimed until a production run exists. */
function ReviewState({ reviewed, selfReported }: { reviewed: number; selfReported: number }) {
  const { projects: t } = useMessages(demoBrand);
  const labels = useLabels();
  const runs = reviewed + selfReported;
  if (runs === 0) {
    return null;
  }

  const allReviewed = selfReported === 0;

  return (
    <div className="relative z-10 pt-3 border-t border-white/20">
      <span
        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
          allReviewed ? "text-[var(--brand-secondary)]" : "text-white/80"
        }`}
      >
        {allReviewed && <ShieldCheck className="h-3.5 w-3.5" />}
        {allReviewed ? statusLabelIn(labels, "cirka_reviewed") : format(t.runsReviewed, { reviewed, runs })}
      </span>
    </div>
  );
}

export default function BrandProjectsPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const { run, pending } = useAction();
  const view = getBrandDashboard(store.db, scope);
  const { projects: t } = useMessages(demoBrand);
  const labels = useLabels();
  const fmt = useFormat();

  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    const requested = searchParams.get("status") ?? "";
    return (PROJECT_STATUSES as readonly string[]).includes(requested) ? requested : "";
  });
  const [sortBy, setSortBy] = useState("newest");

  /* Executive Hero Aggregate Metrics Calculation */
  let totalActivated = 0;
  let totalIncorporated = 0;
  let totalUsed = 0;
  let totalMakers = 0;
  let totalUnits = 0;
  const primaryUnit = view.proofViews[0]?.material.unit ?? "kg";

  for (const proof of view.proofViews) {
    totalActivated += proof.material.activated;
    totalIncorporated += proof.material.incorporated;
    totalUsed += proof.material.used;
    totalMakers += proof.social.makersEngaged;
    totalUnits += proof.social.unitsCompleted;
  }

  const overallYield = totalUsed > 0 ? totalIncorporated / totalUsed : undefined;

  /* Filter and Sort Projects */
  const filteredProjects = view.projects
    .filter((project) => {
      if (status && project.status !== status) return false;
      if (search) {
        const needle = search.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(needle);
        const matchesRef = project.reference.toLowerCase().includes(needle);
        const matchesObj = project.objective.toLowerCase().includes(needle);
        if (!matchesTitle && !matchesRef && !matchesObj) return false;
      }
      return true;
    })
    .sort((left, right) => {
      if (sortBy === "target") {
        return (left.targetCompletionDate ?? 0) - (right.targetCompletionDate ?? 0);
      }
      if (sortBy === "yield") {
        const proofLeft = view.proofViews.find((p) => p.project._id === left._id);
        const proofRight = view.proofViews.find((p) => p.project._id === right._id);
        return (proofRight?.material.yield ?? 0) - (proofLeft?.material.yield ?? 0);
      }
      return right.createdAt - left.createdAt;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeading
        title={t.title}
        action={
          <Button as={Link} href="/demo/brand/projects/new" size="sm">
            {t.newBrief}
          </Button>
        }
      />

      {view.projects.length > 0 && (
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums text-[var(--ink-muted)]">
          <span>{format(t.activated, { quantity: fmt.quantity(totalActivated, primaryUnit) })}</span>
          <span>{format(t.yield, { value: overallYield !== undefined ? fmt.percent(overallYield) : "-" })}</span>
          <span>{format(t.makers, { count: totalMakers })}</span>
          <span>{format(t.units, { count: fmt.number(totalUnits) })}</span>
        </p>
      )}

      {/* Filter and Search Panel */}
      <Panel className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative">
            <Input
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          </div>

          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t.allStatuses}</option>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabelIn(labels, value)}
              </option>
            ))}
          </Select>

          <Select aria-label={t.sort} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{t.sortNewest}</option>
            <option value="target">{t.sortTarget}</option>
            <option value="yield">{t.sortYield}</option>
          </Select>
        </div>
      </Panel>

      {/* Project Cards (Hybrid Master Variant) */}
      {filteredProjects.length === 0 ? (
        <EmptyState title={view.projects.length === 0 ? t.noProjects : t.noMatches} />
      ) : (
        <div className="space-y-6">
          {filteredProjects.map((project) => {
            const proof = view.proofViews.find((entry) => entry.project._id === project._id);

            return (
              <Panel
                key={project._id}
                className="p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                  {/* Left Column: Human Connection Photo Frame (Cirka SOT Mandated) */}
                  <div className="relative flex flex-col justify-between p-4 rounded-xl bg-[#545454] text-white border-4 border-white shadow-md min-h-[190px] lg:w-[230px] shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80 z-0" />
                    
                    <div className="relative z-10 space-y-1">
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {proof?.production[0]?.makerName ?? t.noMaker}
                      </h4>
                      {proof && proof.material.activated > 0 && (
                        <p className="text-[10px] text-white/80 leading-relaxed">
                          {format(t.activated, { quantity: fmt.quantity(proof.material.activated, proof.material.unit) })}
                        </p>
                      )}
                    </div>

                    {proof && <ReviewState {...proof.assurance} />}
                  </div>

                  {/* Right Column: Title, Objective, Metrics, Journey & Actions */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--ink)]">
                            {project.title}
                          </h2>
                          <CirkaBadge status={project.status} />
                        </div>
                        {proof && (
                          <div className="text-right">
                            <span className="text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
                              {fmt.quantity(proof.material.incorporated, proof.material.unit)}
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {t.incorporated}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] mt-1">
                        {format(t.target, { reference: project.reference, date: fmt.date(project.targetCompletionDate) })}
                      </p>

                      <p className="text-sm leading-relaxed text-[var(--ink-muted)] mt-2">
                        {project.objective}
                      </p>

                      {/* Metrics Summary Strip */}
                      {proof && (
                        <dl className="mt-4 grid grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                          {[
                            [t.metricYield, proof.material.yield !== undefined ? fmt.percent(proof.material.yield) : "-"],
                            [t.metricUnits, fmt.number(proof.social.unitsCompleted)],
                            [t.metricMakers, String(proof.social.makersEngaged)],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                                {label}
                              </dt>
                              <dd className="text-sm font-bold tabular-nums text-[var(--ink)]">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>

                    {/* Journey Stepper & Actions */}
                    <div>
                      {proof && (
                        <div className="pt-2 border-t border-[var(--line)]">
                          <ProjectJourneyStepper journey={proof.journey} compact />
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                          {[
                            [proof?.requests.length ?? 0, t.requestOne, t.requestMany],
                            [proof?.matches.length ?? 0, t.matchOne, t.matchMany],
                            [proof?.production.length ?? 0, t.runOne, t.runMany],
                          ]
                            .map(([count, one, many]) => format(count === 1 ? String(one) : String(many), { count }))
                            .join(" · ")}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button as={Link} href={`/demo/brand/projects/${project._id}`} size="sm">
                            {t.open}
                          </Button>
                          {project.status === "draft" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={pending}
                              onClick={() =>
                                run(() => store.activateProject("brand", { projectId: project._id }))
                              }
                            >
                              {t.activate}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
