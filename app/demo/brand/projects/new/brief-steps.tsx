"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { CalendarClock, Layers, Sparkles, type LucideIcon } from "lucide-react";
import { Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  MATERIAL_CATEGORIES,
  UNITS,
  UNIT_LABELS,
  type MaterialCategory,
  type Unit,
} from "../../../_mock/domain";
import { categoryLabel } from "../../../_mock/selectors-shared";
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
          Request material
        </label>
      }
    >
      {demand.include && (
        <div className="space-y-5">
          <Field label="Request title">
            <Input
              value={demand.title}
              onChange={(event) => onDemandChange({ title: event.target.value })}
              placeholder="Named after the brief"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Material category">
              <Select
                value={demand.materialCategory}
                onChange={(event) =>
                  onDemandChange({ materialCategory: event.target.value as MaterialCategory })
                }
              >
                {MATERIAL_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {categoryLabel(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantity needed" required error={errors.quantityNeeded}>
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
            <Field label="Unit">
              <Select
                value={demand.unit}
                onChange={(event) => onDemandChange({ unit: event.target.value as Unit })}
              >
                {UNITS.map((value) => (
                  <option key={value} value={value}>
                    {UNIT_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Material requirements">
            <Textarea
              value={demand.materialDescription}
              onChange={(event) => onDemandChange({ materialDescription: event.target.value })}
              placeholder="Light to mid-weight jersey, undyed or pale, minimum piece size 30 x 30 cm."
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Composition requirements">
              <Input
                value={demand.compositionRequirements}
                onChange={(event) => onDemandChange({ compositionRequirements: event.target.value })}
                placeholder="Cotton-dominant, no elastane above 3%"
              />
            </Field>
            <Field label="Quality requirements">
              <Input
                value={demand.qualityRequirements}
                onChange={(event) => onDemandChange({ qualityRequirements: event.target.value })}
                placeholder="No staining or contamination"
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
  return (
    <StepPanel icon={CalendarClock} title="Timeline & location">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Target completion">
          <Input
            type="date"
            value={project.targetCompletionDate}
            onChange={(event) => onProjectChange({ targetCompletionDate: event.target.value })}
          />
        </Field>
        {demand.include && (
          <Field label="Material needed by">
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
          <Field label="Production location preference">
            <Input
              value={demand.productionLocationPreference}
              onChange={(event) =>
                onDemandChange({ productionLocationPreference: event.target.value })
              }
              placeholder="Within 300 km of Malmö"
            />
          </Field>
          <Field label="Maximum distance (km)">
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
  return (
    <StepPanel icon={Sparkles} title="Project vision">
      <Field label="Title" required error={errors.title}>
        <Input
          id="brief-title"
          required
          aria-invalid={Boolean(errors.title)}
          value={project.title}
          onChange={(event) => onProjectChange({ title: event.target.value })}
          placeholder="e.g. Reclaimed Jersey Capsule SS26"
        />
      </Field>

      <Field label="Objective" required error={errors.objective}>
        <Textarea
          id="brief-objective"
          required
          aria-invalid={Boolean(errors.objective)}
          value={project.objective}
          onChange={(event) => onProjectChange({ objective: event.target.value })}
          placeholder="A 150-unit capsule from Swedish offcuts"
        />
      </Field>

      <Field label="Intended product">
        <Input
          value={project.intendedProduct}
          onChange={(event) => onProjectChange({ intendedProduct: event.target.value })}
          placeholder="Everyday tote and pouch set"
        />
      </Field>

      <Field label="Design intent">
        <Textarea
          value={project.designIntent}
          onChange={(event) => onProjectChange({ designIntent: event.target.value })}
          placeholder="Undyed, panelled construction that accepts shade variation rather than hiding it."
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Commercial objectives">
          <Input
            value={project.commercialObjectives}
            onChange={(event) => onProjectChange({ commercialObjectives: event.target.value })}
            placeholder="Retail at 690 SEK with a repeatable cost base"
          />
        </Field>
        <Field label="Impact objectives">
          <Input
            value={project.impactObjectives}
            onChange={(event) => onProjectChange({ impactObjectives: event.target.value })}
            placeholder="Activate 250 kg and keep production within 300 km"
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-[var(--line)] pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Brief pack
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
