"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  MATERIAL_CATEGORIES,
  UNITS,
  UNIT_LABELS,
  type MaterialCategory,
  type Unit,
} from "../../../_mock/domain";
import { categoryLabel } from "../../../_mock/selectors-shared";
import { type JourneyRow } from "../../../_mock/selectors-brand";
import { useDemoStore } from "../../../_mock/store";
import { CirkaBadge, NoticeBanner, SectionHeading, formatDate } from "../../../_components/cirka-ui";
import { ProjectJourneyStepper } from "../../../_components/project-journey-stepper";
import {
  BriefResourceDraftList,
  BriefResourcePicker,
  type BriefResourceDraft,
} from "../../../_components/project-brief-pack";
import { useAction } from "../../../_components/use-action";

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function NewBriefPage() {
  const router = useRouter();
  const store = useDemoStore();
  const { run, error, pending } = useAction();

  const [project, setProject] = useState({
    title: "",
    objective: "",
    intendedProduct: "",
    designIntent: "",
    commercialObjectives: "",
    impactObjectives: "",
    targetCompletionDate: "",
  });

  /* Held until the project exists — references attach to a project id. */
  const [references, setReferences] = useState<BriefResourceDraft[]>([]);

  const [demand, setDemand] = useState({
    include: true,
    title: "",
    materialCategory: "cotton_offcuts" as MaterialCategory,
    materialDescription: "",
    compositionRequirements: "",
    qualityRequirements: "",
    quantityNeeded: "",
    unit: "kg" as Unit,
    neededBy: "",
    productionLocationPreference: "",
    maxDistanceKm: "",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    await run(async () => {
      const projectId = await store.createProject("brand", {
        title: project.title,
        objective: project.objective,
        intendedProduct: project.intendedProduct || undefined,
        designIntent: project.designIntent || undefined,
        commercialObjectives: project.commercialObjectives || undefined,
        impactObjectives: project.impactObjectives || undefined,
        targetCompletionDate: toTimestamp(project.targetCompletionDate),
      });

      await store.activateProject("brand", { projectId });

      for (const reference of references) {
        await store.addProjectReference("brand", { projectId, ...reference });
      }

      if (demand.include) {
        await store.createResourceRequest("brand", {
          projectId,
          title: demand.title || `${project.title}: material request`,
          materialCategory: demand.materialCategory,
          materialDescription: demand.materialDescription || undefined,
          compositionRequirements: demand.compositionRequirements || undefined,
          qualityRequirements: demand.qualityRequirements || undefined,
          quantityNeeded: Number(demand.quantityNeeded),
          unit: demand.unit,
          intendedProduct: project.intendedProduct || undefined,
          neededBy: toTimestamp(demand.neededBy),
          productionLocationPreference: demand.productionLocationPreference || undefined,
          maxDistanceKm: demand.maxDistanceKm ? Number(demand.maxDistanceKm) : undefined,
          submitImmediately: true,
        });
      }

      router.push(`/demo/brand/projects/${projectId}`);
    });
  };

  /* Mock preview journey for live canvas rendering */
  const previewJourney: JourneyRow[] = [
    { stage: "demand_created", label: "Demand Created", responsible: "Brand", status: "completed", note: "Brief created" },
    { stage: "resource_matched", label: "Resource Matched", responsible: "CIRKA", status: "pending" },
    { stage: "maker_allocated", label: "Maker Allocated", responsible: "Maker", status: "pending" },
    { stage: "production_started", label: "Production", responsible: "Maker", status: "pending" },
    { stage: "evidence_reviewed", label: "Evidence Reviewed", responsible: "CIRKA", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading title="Create New Brief" />

      {error && <NoticeBanner tone="blocking" title="The brief was not created">{error}</NoticeBanner>}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Project Details Panel */}
          <Panel className="space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--ink)] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--brand-primary)]" />
                1. The Project Brief
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Core Identity
              </span>
            </div>

            <Field label="Title" required>
              <Input
                required
                value={project.title}
                onChange={(event) => setProject((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Reclaimed Jersey Capsule SS26"
              />
            </Field>

            <Field label="Objective" required>
              <Textarea
                required
                value={project.objective}
                onChange={(event) =>
                  setProject((current) => ({ ...current, objective: event.target.value }))
                }
                placeholder="Prove that a 150-unit accessory capsule can be produced entirely from Swedish post-production offcuts, with evidence we can put in front of our board."
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Intended product">
                <Input
                  value={project.intendedProduct}
                  onChange={(event) =>
                    setProject((current) => ({ ...current, intendedProduct: event.target.value }))
                  }
                  placeholder="Everyday tote and pouch set"
                />
              </Field>
              <Field label="Target completion">
                <Input
                  type="date"
                  value={project.targetCompletionDate}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      targetCompletionDate: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <Field label="Design intent">
              <Textarea
                value={project.designIntent}
                onChange={(event) =>
                  setProject((current) => ({ ...current, designIntent: event.target.value }))
                }
                placeholder="Undyed, panelled construction that accepts shade variation rather than hiding it."
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Commercial objectives">
                <Input
                  value={project.commercialObjectives}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      commercialObjectives: event.target.value,
                    }))
                  }
                  placeholder="Retail at 690 SEK with a repeatable cost base"
                />
              </Field>
              <Field label="Impact objectives">
                <Input
                  value={project.impactObjectives}
                  onChange={(event) =>
                    setProject((current) => ({ ...current, impactObjectives: event.target.value }))
                  }
                  placeholder="Activate 250 kg and keep production within 300 km"
                />
              </Field>
            </div>

            <div className="space-y-4 border-t border-[var(--line)] pt-5">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  What the makers build from
                </p>
                <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                  References, drawings and specifications. They attach when the brief is created,
                  and every maker on the project works from them.
                </p>
              </div>

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
          </Panel>

          {/* Resource Demand Panel */}
          <Panel className="space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demand.include}
                  onChange={(event) =>
                    setDemand((current) => ({ ...current, include: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                />
                <span className="text-lg font-bold tracking-[-0.03em] text-[var(--ink)] flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[var(--brand-primary)]" />
                  2. Submit Resource Demand With Brief
                </span>
              </label>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)]">
                Instant Matching
              </span>
            </div>

            {demand.include && (
              <div className="space-y-5 pt-1">
                <Field label="Request title">
                  <Input
                    value={demand.title}
                    onChange={(event) =>
                      setDemand((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Cotton jersey offcuts for the capsule tote"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Material category">
                    <Select
                      value={demand.materialCategory}
                      onChange={(event) =>
                        setDemand((current) => ({
                          ...current,
                          materialCategory: event.target.value as MaterialCategory,
                        }))
                      }
                    >
                      {MATERIAL_CATEGORIES.map((value) => (
                        <option key={value} value={value}>
                          {categoryLabel(value)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Quantity needed">
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={demand.quantityNeeded}
                      onChange={(event) =>
                        setDemand((current) => ({ ...current, quantityNeeded: event.target.value }))
                      }
                      placeholder="300"
                    />
                  </Field>
                  <Field label="Unit">
                    <Select
                      value={demand.unit}
                      onChange={(event) =>
                        setDemand((current) => ({ ...current, unit: event.target.value as Unit }))
                      }
                    >
                      {UNITS.map((value) => (
                        <option key={value} value={value}>
                          {UNIT_LABELS[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Needed by">
                    <Input
                      type="date"
                      value={demand.neededBy}
                      onChange={(event) =>
                        setDemand((current) => ({ ...current, neededBy: event.target.value }))
                      }
                    />
                  </Field>
                </div>

                <Field label="Material requirements">
                  <Textarea
                    value={demand.materialDescription}
                    onChange={(event) =>
                      setDemand((current) => ({
                        ...current,
                        materialDescription: event.target.value,
                      }))
                    }
                    placeholder="Light to mid-weight jersey, undyed or pale, minimum piece size 30 x 30 cm."
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Composition requirements">
                    <Input
                      value={demand.compositionRequirements}
                      onChange={(event) =>
                        setDemand((current) => ({
                          ...current,
                          compositionRequirements: event.target.value,
                        }))
                      }
                      placeholder="Cotton-dominant, no elastane above 3%"
                    />
                  </Field>
                  <Field label="Quality requirements">
                    <Input
                      value={demand.qualityRequirements}
                      onChange={(event) =>
                        setDemand((current) => ({
                          ...current,
                          qualityRequirements: event.target.value,
                        }))
                      }
                      placeholder="No staining or contamination"
                    />
                  </Field>
                  <Field label="Production location preference">
                    <Input
                      value={demand.productionLocationPreference}
                      onChange={(event) =>
                        setDemand((current) => ({
                          ...current,
                          productionLocationPreference: event.target.value,
                        }))
                      }
                      placeholder="Within 300 km of Malmö"
                    />
                  </Field>
                  <Field label="Maximum distance (km)">
                    <Input
                      type="number"
                      min="0"
                      value={demand.maxDistanceKm}
                      onChange={(event) =>
                        setDemand((current) => ({ ...current, maxDistanceKm: event.target.value }))
                      }
                      placeholder="300"
                    />
                  </Field>
                </div>
              </div>
            )}
          </Panel>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending} size="md">
              {pending ? "Creating brief…" : "Create brief & activate matching"}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Proof Canvas Preview (5 Columns, Sticky) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <Panel className="p-6 border-2 border-[var(--brand-primary)] shadow-[0_8px_32px_-8px_rgba(255,92,0,0.15)] space-y-5">
            {/* Live Indicator Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[var(--brand-primary)] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                  Live Dashboard Card Preview
                </span>
              </div>
              <CirkaBadge status="draft" label="DRAFT BRIEF" />
            </div>

            {/* Authentic Cirka SOT White-Bordered Craft Photography Frame */}
            <div className="relative flex flex-col justify-end p-4 rounded-xl bg-[#545454] text-white border-4 border-white shadow-md min-h-[160px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90 z-0" />
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                  📷 Verified Craft Atelier
                </span>
                <p className="text-xs font-bold text-white leading-snug">
                  European Craft Partner · Atelier Match Pending
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Chain of Custody Audit Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Live Text Preview */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-[var(--ink)] leading-tight">
                    {project.title.trim() || "Untitled Brief"}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] mt-1">
                    PRJ-NEW · Target: {project.targetCompletionDate ? formatDate(toTimestamp(project.targetCompletionDate)) : "Target Date Pending"}
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

              <div className="p-3 bg-[var(--surface-muted)] rounded-lg text-xs leading-relaxed text-[var(--ink)] border-l-2 border-[var(--brand-primary)]">
                <span className="font-bold text-[10px] uppercase tracking-[0.16em] text-[var(--brand-primary)] block mb-1">Objective</span>
                {project.objective.trim() || "Fill out the project objective on the left to see how your brief summary will appear to CIRKA coordinators and craft partners."}
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
                      Resource Demand Spec
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
                      <span className="block font-bold text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-0.5">Requirements (Desc · Comp · Quality)</span>
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

              {/* Journey Stepper Preview */}
              <div className="pt-2 border-t border-[var(--line)]">
                <ProjectJourneyStepper journey={previewJourney} compact />
              </div>

              {/* Preview Footer */}
              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <span>
                  {demand.include ? "1 request" : "No request"} ·{" "}
                  {references.length === 1 ? "1 resource" : `${references.length} resources`}
                </span>
                <span className="text-[var(--brand-primary)] flex items-center gap-1">
                  Open proof view <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </form>
    </div>
  );
}
