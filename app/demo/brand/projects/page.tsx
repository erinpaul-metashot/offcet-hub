"use client";

import { useState } from "react";
import Link from "next/link";
import { Factory, Layers, Search, ShieldCheck, Users } from "lucide-react";
import { Button, EmptyState, Input, Panel, Select } from "@/components/ui";
import { PROJECT_STATUSES, statusLabel } from "../../_mock/domain";
import { getBrandDashboard } from "../../_mock/selectors-brand";
import { formatPercent, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  SectionHeading,
  formatDate,
} from "../../_components/cirka-ui";
import { ProjectJourneyStepper } from "../../_components/project-journey-stepper";
import { useAction } from "../../_components/use-action";

export default function BrandProjectsPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const { run, pending } = useAction();
  const view = getBrandDashboard(store.db, scope);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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
        eyebrow="Projects"
        title="Your programmes of work"
        action={
          <Button as={Link} href="/demo/brand/projects/new" size="sm">
            New brief
          </Button>
        }
      />

      {/* Executive Impact Hero Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Total Material Activated
            </span>
            <Layers className="h-4 w-4 text-[var(--brand-primary)]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--ink)]">
            {formatQuantity(totalActivated, primaryUnit)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--ink-muted)]">
            Across {view.projects.length} brand brief{view.projects.length === 1 ? "" : "s"}
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Avg. Material Yield
            </span>
            <Factory className="h-4 w-4 text-[var(--brand-secondary)]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--brand-secondary)]">
            {overallYield !== undefined ? formatPercent(overallYield) : "N/A"}
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Craft Makers Engaged
            </span>
            <Users className="h-4 w-4 text-[var(--brand-primary)]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--ink)]">
            {totalMakers} {totalMakers === 1 ? "maker" : "makers"}
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Finished Product Units
            </span>
            <ShieldCheck className="h-4 w-4 text-[var(--brand-secondary)]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--ink)]">
            {totalUnits.toLocaleString()} units
          </p>
        </Panel>
      </div>

      {/* Filter and Search Panel */}
      <Panel className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative">
            <Input
              placeholder="Search title, reference or objective..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          </div>

          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>

          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Sort by: Newest created</option>
            <option value="target">Sort by: Target date</option>
            <option value="yield">Sort by: Highest yield %</option>
          </Select>
        </div>
      </Panel>

      {/* Project Cards (Hybrid Master Variant) */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects match your filter"
          body="Clear the search or status filter."
        />
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
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                        📷 Maker Facility
                      </span>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {proof?.production[0]?.makerName ?? "Verified European Atelier"}
                      </h4>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        {proof?.material.activated
                          ? `${formatQuantity(proof.material.activated, proof.material.unit)} activated`
                          : "Allocated Material"}
                      </p>
                    </div>

                    <div className="relative z-10 pt-3 border-t border-white/20">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Chain of Custody Verified
                      </span>
                    </div>
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
                              {formatQuantity(proof.material.incorporated, proof.material.unit)}
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              incorporated
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] mt-1">
                        {project.reference} · Target: {formatDate(project.targetCompletionDate)}
                      </p>

                      <p className="text-sm leading-relaxed text-[var(--ink-muted)] mt-2">
                        {project.objective}
                      </p>

                      {/* Metrics Summary Strip */}
                      {proof && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Activated
                            </span>
                            <span className="text-sm font-bold text-[var(--ink)]">
                              {formatQuantity(proof.material.activated, proof.material.unit)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Material Yield
                            </span>
                            <span className="text-sm font-bold text-[var(--brand-secondary)]">
                              {proof.material.yield !== undefined
                                ? `${formatPercent(proof.material.yield)} yield`
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Units Completed
                            </span>
                            <span className="text-sm font-bold text-[var(--ink)]">
                              {proof.social.unitsCompleted} units
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Craft Makers
                            </span>
                            <span className="text-sm font-bold text-[var(--brand-primary)]">
                              {proof.social.makersEngaged} makers
                            </span>
                          </div>
                        </div>
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
                          {proof?.requests.length ?? 0} request{(proof?.requests.length ?? 0) === 1 ? "" : "s"} ·{" "}
                          {proof?.matches.length ?? 0} match{(proof?.matches.length ?? 0) === 1 ? "" : "es"} ·{" "}
                          {proof?.production.length ?? 0} production run{(proof?.production.length ?? 0) === 1 ? "" : "s"}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button as={Link} href={`/demo/brand/projects/${project._id}`} size="sm">
                            Open proof view
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
                              Activate project
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
