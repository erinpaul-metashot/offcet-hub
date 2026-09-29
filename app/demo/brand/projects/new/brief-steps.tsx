"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { CalendarClock, Layers, Sparkles, type LucideIcon } from "lucide-react";
import { Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import {
  MATERIAL_CATEGORIES,
  UNITS,
  type MaterialCategory,
  type Unit,
} from "../../../_mock/domain";
import { useLabels } from "../../../_components/use-labels";
import {
  BriefResourceDraftList,
  BriefResourcePicker,
  type BriefResourceDraft,
} from "../../../_components/project-brief-pack";

export interface ProjectDraft {
  title: string;
  objective: string;
  intendedProduct: string;
  designIntent: string;
  commercialObjectives: string;
  impactObjectives: string;
  targetCompletionDate: string;
}

export interface DemandDraft {
  include: boolean;
  title: string;
  materialCategory: MaterialCategory;
  materialDescription: string;
  compositionRequirements: string;
  qualityRequirements: string;
  quantityNeeded: string;
  unit: Unit;
  neededBy: string;
  productionLocationPreference: string;
  maxDistanceKm: string;
}

/** The fields a step can refuse to advance on. Each input carries `id="brief-<field>"`. */
export type BriefErrorField = "quantityNeeded" | "title" | "objective";
export type BriefErrors = Partial<Record<BriefErrorField, string>>;

type ProjectChange = (patch: Partial<ProjectDraft>) => void;
type DemandChange = (patch: Partial<DemandDraft>) => void;

export function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function StepPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel className="space-y-5 p-6">
      <h2 className="flex items-center gap-2 border-b border-[var(--line)] pb-3 text-lg font-bold tracking-[-0.03em] text-[var(--ink)]">
        <Icon className="h-5 w-5 shrink-0 text-[var(--brand-primary)]" />
        {title}
      </h2>
      {children}
    </Panel>
  );
}

/* ---------- Step 1: Material ---------- */

export function MaterialStep({
  demand,
  errors,
  onDemandChange,
}: {
  demand: DemandDraft;
  errors: BriefErrors;
  onDemandChange: DemandChange;
}) {
  const { briefSteps: t } = useMessages(demoBrand);
  const labels = useLabels();

  return (
    <StepPanel
      icon={Layers}
      title={
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={demand.include}
            onChange={(event) => onDemandChange({ include: event.target.checked })}
            className="h-4 w-4 rounded border-[var(--line-strong)] accent-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          {t.requestMaterial}
        </label>
      }
    >
      {demand.include && (
        <div className="space-y-5">
          <Field label={t.requestTitle}>
            <Input
              value={demand.title}
              onChange={(event) => onDemandChange({ title: event.target.value })}
              placeholder={t.requestTitlePlaceholder}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t.materialCategory}>
              <Select
                value={demand.materialCategory}
                onChange={(event) =>
                  onDemandChange({ materialCategory: event.target.value as MaterialCategory })
                }
              >
                {MATERIAL_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {labels.MATERIAL_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.quantityNeeded} required error={errors.quantityNeeded}>
              <Input
                id="brief-quantityNeeded"
                type="number"
                min="0"
                step="0.001"
                inputMode="decimal"
                aria-invalid={Boolean(errors.quantityNeeded)}
                className="text-right tabular-nums"
                value={demand.quantityNeeded}
                onChange={(event) => onDemandChange({ quantityNeeded: event.target.value })}
                placeholder="300"
              />
            </Field>
            <Field label={t.unit}>
              <Select
                value={demand.unit}
                onChange={(event) => onDemandChange({ unit: event.target.value as Unit })}
              >
                {UNITS.map((value) => (
                  <option key={value} value={value}>
                    {labels.UNIT_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t.requirements}>
            <Textarea
              value={demand.materialDescription}
              onChange={(event) => onDemandChange({ materialDescription: event.target.value })}
              placeholder={t.requirementsPlaceholder}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.composition}>
              <Input
                value={demand.compositionRequirements}
                onChange={(event) => onDemandChange({ compositionRequirements: event.target.value })}
                placeholder={t.compositionPlaceholder}
              />
            </Field>
            <Field label={t.quality}>
              <Input
                value={demand.qualityRequirements}
                onChange={(event) => onDemandChange({ qualityRequirements: event.target.value })}
                placeholder={t.qualityPlaceholder}
              />
            </Field>
          </div>
        </div>
      )}
    </StepPanel>
  );
}

/* ---------- Step 2: Timeline & location ---------- */

export function TimelineStep({
  project,
  demand,
  onProjectChange,
  onDemandChange,
}: {
  project: ProjectDraft;
  demand: DemandDraft;
  onProjectChange: ProjectChange;
  onDemandChange: DemandChange;
}) {
  const { briefSteps: t } = useMessages(demoBrand);

  return (
    <StepPanel icon={CalendarClock} title={t.timelineTitle}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.targetCompletion}>
          <Input
            type="date"
            value={project.targetCompletionDate}
            onChange={(event) => onProjectChange({ targetCompletionDate: event.target.value })}
          />
        </Field>
        {demand.include && (
          <Field label={t.materialNeededBy}>
            <Input
              type="date"
              value={demand.neededBy}
              onChange={(event) => onDemandChange({ neededBy: event.target.value })}
            />
          </Field>
        )}
      </div>

      {demand.include && (
        <div className="grid gap-5 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
          <Field label={t.locationPreference}>
            <Input
              value={demand.productionLocationPreference}
              onChange={(event) =>
                onDemandChange({ productionLocationPreference: event.target.value })
              }
              placeholder={t.locationPlaceholder}
            />
          </Field>
          <Field label={t.maxDistance}>
            <Input
              type="number"
              min="0"
              inputMode="numeric"
              className="text-right tabular-nums"
              value={demand.maxDistanceKm}
              onChange={(event) => onDemandChange({ maxDistanceKm: event.target.value })}
              placeholder="300"
            />
          </Field>
        </div>
      )}
    </StepPanel>
  );
}

/* ---------- Step 3: Project vision ---------- */

export function VisionStep({
  project,
  errors,
  onProjectChange,
  references,
  setReferences,
  pending,
}: {
  project: ProjectDraft;
  errors: BriefErrors;
  onProjectChange: ProjectChange;
  references: BriefResourceDraft[];
  setReferences: Dispatch<SetStateAction<BriefResourceDraft[]>>;
  pending: boolean;
}) {
  const { briefSteps: t } = useMessages(demoBrand);

  return (
    <StepPanel icon={Sparkles} title={t.visionTitle}>
      <Field label={t.title} required error={errors.title}>
        <Input
          id="brief-title"
          required
          aria-invalid={Boolean(errors.title)}
          value={project.title}
          onChange={(event) => onProjectChange({ title: event.target.value })}
          placeholder={t.titlePlaceholder}
        />
      </Field>

      <Field label={t.objective} required error={errors.objective}>
        <Textarea
          id="brief-objective"
          required
          aria-invalid={Boolean(errors.objective)}
          value={project.objective}
          onChange={(event) => onProjectChange({ objective: event.target.value })}
          placeholder={t.objectivePlaceholder}
        />
      </Field>

      <Field label={t.intendedProduct}>
        <Input
          value={project.intendedProduct}
          onChange={(event) => onProjectChange({ intendedProduct: event.target.value })}
          placeholder={t.intendedProductPlaceholder}
        />
      </Field>

      <Field label={t.designIntent}>
        <Textarea
          value={project.designIntent}
          onChange={(event) => onProjectChange({ designIntent: event.target.value })}
          placeholder={t.designIntentPlaceholder}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.commercialObjectives}>
          <Input
            value={project.commercialObjectives}
            onChange={(event) => onProjectChange({ commercialObjectives: event.target.value })}
            placeholder={t.commercialPlaceholder}
          />
        </Field>
        <Field label={t.impactObjectives}>
          <Input
            value={project.impactObjectives}
            onChange={(event) => onProjectChange({ impactObjectives: event.target.value })}
            placeholder={t.impactPlaceholder}
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-[var(--line)] pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {t.briefPack}
        </p>

        <BriefResourceDraftList
          drafts={references}
          onRemove={(index) =>
            setReferences((current) => current.filter((_, position) => position !== index))
          }
        />

        <BriefResourcePicker
          pending={pending}
          onAdd={async (draft) => {
            setReferences((current) => [...current, draft]);
            return true;
          }}
        />
      </div>
    </StepPanel>
  );
}
