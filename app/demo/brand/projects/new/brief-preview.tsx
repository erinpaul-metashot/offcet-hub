"use client";

import { Eye, Layers } from "lucide-react";
import { Panel } from "@/components/ui";
import { UNIT_LABELS } from "../../../_mock/domain";
import { categoryLabel } from "../../../_mock/selectors-shared";
import { CirkaBadge, formatDate } from "../../../_components/cirka-ui";
import type { BriefResourceDraft } from "../../../_components/project-brief-pack";
import { toTimestamp, type DemandDraft, type ProjectDraft } from "./brief-steps";

interface BriefPreviewProps {
  project: ProjectDraft;
  demand: DemandDraft;
  references: BriefResourceDraft[];
}

/** Live dashboard-card preview of the brief as it is being written. */
export function BriefPreview({ project, demand, references }: BriefPreviewProps) {
  return (
    <Panel className="p-6 border-2 border-[var(--brand-primary)] shadow-[0_8px_32px_-8px_rgba(255,92,0,0.15)] space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[var(--brand-primary)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
            Preview
          </span>
        </div>
        <CirkaBadge status="draft" />
      </div>

      {/* Dynamic Live Text Preview */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-[-0.03em] text-[var(--ink)] leading-tight">
              {project.title.trim() || "Untitled Brief"}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] mt-1">
              Target: {project.targetCompletionDate ? formatDate(toTimestamp(project.targetCompletionDate)) : "–"}
            </p>
          </div>
          {demand.include && demand.quantityNeeded && (
            <div className="text-right shrink-0">
              <span className="text-lg font-bold tracking-[-0.04em] text-[var(--brand-primary)] leading-tight block">
                {Number(demand.quantityNeeded).toLocaleString()} {demand.unit}
              </span>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                requested
              </p>
            </div>
          )}
        </div>

        <div className="p-3 bg-[var(--surface)] rounded-lg text-xs leading-relaxed text-[var(--ink)] border-l-2 border-[var(--brand-primary)]">
          <span className="font-bold text-[10px] uppercase tracking-[0.16em] text-[var(--brand-primary)] block mb-1">Objective</span>
          {project.objective.trim() || "–"}
        </div>

        {/* Additional Project Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-[var(--ink-muted)] bg-[var(--surface)] p-3 rounded-lg border border-[var(--line)]">
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">Intended Product</span>
            <span className="text-[var(--ink-muted)]">{project.intendedProduct || "-"}</span>
          </div>
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">Design Intent</span>
            <span className="text-[var(--ink-muted)]">{project.designIntent || "-"}</span>
          </div>
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">Commercial Objectives</span>
            <span className="text-[var(--ink-muted)]">{project.commercialObjectives || "-"}</span>
          </div>
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">Impact Objectives</span>
            <span className="text-[var(--ink-muted)]">{project.impactObjectives || "-"}</span>
          </div>
        </div>

        {/* Resource Demand Live Box */}
        {demand.include && (
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line-strong)] space-y-3 relative overflow-hidden">
            {/* Decorative background logo or pattern could go here */}
            <div className="absolute -right-4 -top-4 opacity-5">
              <Layers className="h-24 w-24" />
            </div>

            <div className="relative z-10">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)] mb-1">
                Material request
              </span>
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-[var(--ink)] leading-tight pr-4">
                  {demand.title || categoryLabel(demand.materialCategory)}
                </span>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-y-3 text-[11px]">
              <div>
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">Category</span>
                <span className="text-[var(--ink)] font-medium">{categoryLabel(demand.materialCategory)}</span>
              </div>
              <div>
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">Needed By</span>
                <span className="text-[var(--ink)] font-medium">{demand.neededBy ? formatDate(toTimestamp(demand.neededBy)) : "-"}</span>
              </div>
              <div className="col-span-2">
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">Requirements</span>
                <span className="text-[var(--ink)] leading-snug block">
                  {[demand.materialDescription, demand.compositionRequirements, demand.qualityRequirements].filter(Boolean).length > 0
                    ? [demand.materialDescription, demand.compositionRequirements, demand.qualityRequirements].filter(Boolean).join(" · ")
                    : "-"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">Location Preference</span>
                <span className="text-[var(--ink)]">
                  {demand.productionLocationPreference || "-"}
                  {demand.maxDistanceKm ? ` (Max ${demand.maxDistanceKm}km)` : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="pt-3 border-t border-[var(--line)] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {demand.include ? "1 request" : "No request"} ·{" "}
          {references.length === 1 ? "1 resource" : `${references.length} resources`}
        </p>
      </div>
    </Panel>
  );
}

/* ---------- Step 4: Review ---------- */

interface ReviewGroup {
  step: number;
  title: string;
  rows: [label: string, value: string][];
  note?: string;
}

function reviewGroups({ project, demand, references }: BriefPreviewProps): ReviewGroup[] {
  const date = (value: string) => (value ? formatDate(toTimestamp(value)) : "-");

  return [
    {
      step: 0,
      title: "Material",
      note: demand.include ? undefined : "No material request",
      rows: demand.include
        ? [
            ["Request title", demand.title || "Named after the brief"],
            ["Category", categoryLabel(demand.materialCategory)],
            ["Quantity", `${Number(demand.quantityNeeded).toLocaleString()} ${UNIT_LABELS[demand.unit]}`],
            ["Requirements", demand.materialDescription || "-"],
            ["Composition", demand.compositionRequirements || "-"],
            ["Quality", demand.qualityRequirements || "-"],
          ]
        : [],
    },
    {
      step: 1,
      title: "Timeline & location",
      rows: [
        ["Target completion", date(project.targetCompletionDate)],
        ...(demand.include
          ? ([
              ["Material needed by", date(demand.neededBy)],
              ["Location preference", demand.productionLocationPreference || "-"],
              ["Maximum distance", demand.maxDistanceKm ? `${demand.maxDistanceKm} km` : "-"],
            ] satisfies ReviewGroup["rows"])
          : []),
      ],
    },
    {
      step: 2,
      title: "Project vision",
      rows: [
        ["Title", project.title || "-"],
        ["Objective", project.objective || "-"],
        ["Intended product", project.intendedProduct || "-"],
        ["Design intent", project.designIntent || "-"],
        ["Commercial objectives", project.commercialObjectives || "-"],
        ["Impact objectives", project.impactObjectives || "-"],
        ["Brief pack", references.length === 1 ? "1 resource" : `${references.length} resources`],
      ],
    },
  ];
}

/** Everything entered, grouped by the step it came from, each with a way back to fix it. */
export function BriefReview({
  onEdit,
  ...brief
}: BriefPreviewProps & { onEdit: (step: number) => void }) {
  return (
    <div className="space-y-6">
      <Panel className="grid gap-8 p-6 lg:grid-cols-3">
        {reviewGroups(brief).map((group) => (
          <section key={group.title} className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
                {group.title}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(group.step)}
                aria-label={`Edit ${group.title}`}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)] transition-opacity duration-200 ease-[var(--ease-out)] hover:opacity-70"
              >
                Edit
              </button>
            </div>
            {group.note && <p className="text-sm text-[var(--ink-muted)]">{group.note}</p>}
            <dl className="space-y-3">
              {group.rows.map(([label, value]) => (
                <div key={label} className="space-y-0.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {label}
                  </dt>
                  <dd className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--ink)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </Panel>
    </div>
  );
}
