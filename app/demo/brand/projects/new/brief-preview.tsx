"use client";

import { Eye, Layers } from "lucide-react";
import { Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import type { DomainLabels } from "../../../_mock/domain-labels";
import { CirkaBadge } from "../../../_components/cirka-ui";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";
import type { BriefResourceDraft } from "../../../_components/project-brief-pack";
import { toTimestamp, type DemandDraft, type ProjectDraft } from "./brief-steps";

interface BriefPreviewProps {
  project: ProjectDraft;
  demand: DemandDraft;
  references: BriefResourceDraft[];
}

/** Live dashboard-card preview of the brief as it is being written. */
export function BriefPreview({ project, demand, references }: BriefPreviewProps) {
  const { briefPreview: t } = useMessages(demoBrand);
  const labels = useLabels();
  const fmt = useFormat();

  return (
    <Panel className="p-6 border-2 border-[var(--brand-primary)] shadow-[0_8px_32px_-8px_rgba(255,92,0,0.15)] space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[var(--brand-primary)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
            {t.preview}
          </span>
        </div>
        <CirkaBadge status="draft" />
      </div>

      {/* Dynamic Live Text Preview */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-[-0.03em] text-[var(--ink)] leading-tight">
              {project.title.trim() || t.untitled}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] mt-1">
              {format(t.target, { date: project.targetCompletionDate ? fmt.date(toTimestamp(project.targetCompletionDate)) : "–" })}
            </p>
          </div>
          {demand.include && demand.quantityNeeded && (
            <div className="text-right shrink-0">
              <span className="text-lg font-bold tracking-[-0.04em] text-[var(--brand-primary)] leading-tight block">
                {fmt.quantity(Number(demand.quantityNeeded), demand.unit)}
              </span>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t.requested}
              </p>
            </div>
          )}
        </div>

        <div className="p-3 bg-[var(--surface)] rounded-lg text-xs leading-relaxed text-[var(--ink)] border-l-2 border-[var(--brand-primary)]">
          <span className="font-bold text-[10px] uppercase tracking-[0.16em] text-[var(--brand-primary)] block mb-1">{t.objective}</span>
          {project.objective.trim() || "–"}
        </div>

        {/* Additional Project Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-[var(--ink-muted)] bg-[var(--surface)] p-3 rounded-lg border border-[var(--line)]">
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">{t.intendedProduct}</span>
            <span className="text-[var(--ink-muted)]">{project.intendedProduct || "-"}</span>
          </div>
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">{t.designIntent}</span>
            <span className="text-[var(--ink-muted)]">{project.designIntent || "-"}</span>
          </div>
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">{t.commercialObjectives}</span>
            <span className="text-[var(--ink-muted)]">{project.commercialObjectives || "-"}</span>
          </div>
          <div>
            <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink)] mb-0.5">{t.impactObjectives}</span>
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
                {t.materialRequest}
              </span>
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-[var(--ink)] leading-tight pr-4">
                  {demand.title || labels.MATERIAL_CATEGORY_LABELS[demand.materialCategory]}
                </span>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-y-3 text-[11px]">
              <div>
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">{t.category}</span>
                <span className="text-[var(--ink)] font-medium">{labels.MATERIAL_CATEGORY_LABELS[demand.materialCategory]}</span>
              </div>
              <div>
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">{t.neededBy}</span>
                <span className="text-[var(--ink)] font-medium">{demand.neededBy ? fmt.date(toTimestamp(demand.neededBy)) : "-"}</span>
              </div>
              <div className="col-span-2">
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">{t.requirements}</span>
                <span className="text-[var(--ink)] leading-snug block">
                  {[demand.materialDescription, demand.compositionRequirements, demand.qualityRequirements].filter(Boolean).length > 0
                    ? [demand.materialDescription, demand.compositionRequirements, demand.qualityRequirements].filter(Boolean).join(" · ")
                    : "-"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">{t.locationPreference}</span>
                <span className="text-[var(--ink)]">
                  {demand.productionLocationPreference || "-"}
                  {demand.maxDistanceKm ? format(t.maxDistance, { km: demand.maxDistanceKm }) : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="pt-3 border-t border-[var(--line)] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {demand.include ? t.oneRequest : t.noRequest} ·{" "}
          {format(references.length === 1 ? t.resourceOne : t.resourceMany, { count: references.length })}
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

type BrandMessages = (typeof demoBrand)["en"];

function reviewGroups(
  { project, demand, references }: BriefPreviewProps,
  m: BrandMessages,
  labels: DomainLabels,
  fmt: ReturnType<typeof useFormat>,
): ReviewGroup[] {
  const t = m.briefPreview;
  const steps = m.briefSteps;
  const date = (value: string) => (value ? fmt.date(toTimestamp(value)) : "-");

  return [
    {
      step: 0,
      title: m.newBrief.steps.material,
      note: demand.include ? undefined : t.noMaterialRequest,
      rows: demand.include
        ? [
            [steps.requestTitle, demand.title || steps.requestTitlePlaceholder],
            [t.category, labels.MATERIAL_CATEGORY_LABELS[demand.materialCategory]],
            [t.quantity, fmt.quantity(Number(demand.quantityNeeded), demand.unit)],
            [t.requirements, demand.materialDescription || "-"],
            [t.composition, demand.compositionRequirements || "-"],
            [t.quality, demand.qualityRequirements || "-"],
          ]
        : [],
    },
    {
      step: 1,
      title: m.newBrief.steps.timeline,
      rows: [
        [steps.targetCompletion, date(project.targetCompletionDate)],
        ...(demand.include
          ? ([
              [steps.materialNeededBy, date(demand.neededBy)],
              [t.locationPreference, demand.productionLocationPreference || "-"],
              [t.maximumDistance, demand.maxDistanceKm ? format(t.km, { km: demand.maxDistanceKm }) : "-"],
            ] satisfies ReviewGroup["rows"])
          : []),
      ],
    },
    {
      step: 2,
      title: m.newBrief.steps.vision,
      rows: [
        [steps.title, project.title || "-"],
        [steps.objective, project.objective || "-"],
        [steps.intendedProduct, project.intendedProduct || "-"],
        [steps.designIntent, project.designIntent || "-"],
        [steps.commercialObjectives, project.commercialObjectives || "-"],
        [steps.impactObjectives, project.impactObjectives || "-"],
        [steps.briefPack, format(references.length === 1 ? t.resourceOne : t.resourceMany, { count: references.length })],
      ],
    },
  ];
}

/** Everything entered, grouped by the step it came from, each with a way back to fix it. */
export function BriefReview({
  onEdit,
  ...brief
}: BriefPreviewProps & { onEdit: (step: number) => void }) {
  const m = useMessages(demoBrand);
  const labels = useLabels();
  const fmt = useFormat();

  return (
    <div className="space-y-6">
      <Panel className="grid gap-8 p-6 lg:grid-cols-3">
        {reviewGroups(brief, m, labels, fmt).map((group) => (
          <section key={group.title} className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
                {group.title}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(group.step)}
                aria-label={format(m.briefPreview.editGroup, { group: group.title })}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)] transition-opacity duration-200 ease-[var(--ease-out)] hover:opacity-70"
              >
                {m.briefPreview.edit}
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
