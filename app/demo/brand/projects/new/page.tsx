"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import { useDemoStore } from "../../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../../_components/cirka-ui";
import { FormStepper, type FormStep } from "../../../_components/form-stepper";
import { type BriefResourceDraft } from "../../../_components/project-brief-pack";
import { useAction } from "../../../_components/use-action";
import {
  MaterialStep,
  TimelineStep,
  VisionStep,
  toTimestamp,
  type BriefErrorField,
  type BriefErrors,
  type DemandDraft,
  type ProjectDraft,
} from "./brief-steps";
import { BriefPreview, BriefReview } from "./brief-preview";

const BRIEF_STEP_IDS = ["material", "timeline", "vision", "review"] as const;

const REVIEW_STEP = BRIEF_STEP_IDS.length - 1;

type BriefMessages = (typeof demoBrand)["en"]["newBrief"];

/** What stops a step from advancing. Empty object means the step is complete. */
function validateStep(index: number, project: ProjectDraft, demand: DemandDraft, t: BriefMessages): BriefErrors {
  if (index === 0 && demand.include && !(Number(demand.quantityNeeded) > 0)) {
    return { quantityNeeded: t.errorQuantity };
  }

  if (index === 2) {
    return {
      ...(project.title.trim() ? {} : { title: t.errorTitle }),
      ...(project.objective.trim() ? {} : { objective: t.errorObjective }),
    };
  }

  return {};
}

/** The first step in [from, to) that is incomplete, with its messages. */
function firstBlockedStep(from: number, to: number, project: ProjectDraft, demand: DemandDraft, t: BriefMessages) {
  for (let index = from; index < to; index += 1) {
    const errors = validateStep(index, project, demand, t);
    if (Object.keys(errors).length > 0) {
      return { index, errors };
    }
  }
  return null;
}

export default function NewBriefPage() {
  const router = useRouter();
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const topRef = useRef<HTMLDivElement>(null);
  const { newBrief: t } = useMessages(demoBrand);
  const briefSteps: FormStep[] = BRIEF_STEP_IDS.map((id) => ({ id, label: t.steps[id] }));

  const [project, setProject] = useState<ProjectDraft>({
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

  const [demand, setDemand] = useState<DemandDraft>({
    include: true,
    title: "",
    materialCategory: "cotton_offcuts",
    materialDescription: "",
    compositionRequirements: "",
    qualityRequirements: "",
    quantityNeeded: "",
    unit: "kg",
    neededBy: "",
    productionLocationPreference: "",
    maxDistanceKm: "",
  });

  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const [errors, setErrors] = useState<BriefErrors>({});

  const clearErrors = (fields: string[]) =>
    setErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([field]) => !fields.includes(field))),
    );

  const updateProject = (patch: Partial<ProjectDraft>) => {
    setProject((current) => ({ ...current, ...patch }));
    clearErrors(Object.keys(patch));
  };

  const updateDemand = (patch: Partial<DemandDraft>) => {
    setDemand((current) => ({ ...current, ...patch }));
    /* Toggling the request off (or back on) makes a stale quantity message meaningless. */
    clearErrors("include" in patch ? [...Object.keys(patch), "quantityNeeded"] : Object.keys(patch));
  };

  const goTo = (index: number) => {
    setStep(index);
    setVisited((current) => (current.includes(index) ? current : [...current, index]));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const showBlocked = (blocked: { index: number; errors: BriefErrors }) => {
    setErrors(blocked.errors);
    if (blocked.index === step) {
      const [field] = Object.keys(blocked.errors) as BriefErrorField[];
      document.getElementById(`brief-${field}`)?.focus();
    } else {
      goTo(blocked.index);
    }
  };

  /** Backwards is always allowed; forwards only past steps that are complete. */
  const moveTo = (target: number) => {
    if (target > step) {
      const blocked = firstBlockedStep(step, target, project, demand, t);
      if (blocked) {
        showBlocked(blocked);
        return;
      }
      setErrors({});
    }
    goTo(target);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    /* Enter inside a field on steps 1-3 advances; only the review step creates anything. */
    if (step !== REVIEW_STEP) {
      moveTo(step + 1);
      return;
    }

    const blocked = firstBlockedStep(0, REVIEW_STEP, project, demand, t);
    if (blocked) {
      showBlocked(blocked);
      return;
    }

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
          title: demand.title || format(t.defaultRequestTitle, { project: project.title }),
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

  const isReview = step === REVIEW_STEP;
  const brief = { project, demand, references };

  const stepBody = [
    <MaterialStep key="material" demand={demand} errors={errors} onDemandChange={updateDemand} />,
    <TimelineStep
      key="timeline"
      project={project}
      demand={demand}
      onProjectChange={updateProject}
      onDemandChange={updateDemand}
    />,
    <VisionStep
      key="vision"
      project={project}
      errors={errors}
      onProjectChange={updateProject}
      references={references}
      setReferences={setReferences}
      pending={pending}
    />,
    <BriefReview key="review" {...brief} onEdit={goTo} />,
  ][step];

  return (
    <div ref={topRef} className="scroll-mt-6 space-y-6">
      <SectionHeading title={t.title} />

      <Panel className="p-5 sm:p-6">
        <FormStepper steps={briefSteps} current={step} visited={visited} onJump={moveTo} />
      </Panel>

      {error && <NoticeBanner tone="blocking" title={t.notCreated}>{error}</NoticeBanner>}

      <form noValidate onSubmit={submit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className={isReview ? "lg:col-span-12" : "lg:col-span-7"}>
          <div key={step} className="animate-stagger-in">
            {stepBody}
          </div>

          <div className="sticky bottom-0 z-10 mt-6 flex items-center gap-3 border-t border-[var(--line)] bg-[var(--surface)] py-4">
            {step > 0 && (
              <Button key="back" type="button" variant="secondary" onClick={() => goTo(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
              </Button>
            )}

            <div className="ml-auto flex items-center gap-4">
              {/* Distinct keys: React must not morph the Next button into the submit
                  button mid-click, or the browser submits the form on the same click. */}
              {isReview ? (
                <Button key="submit" type="submit" disabled={pending}>
                  {pending ? t.creating : t.create}
                </Button>
              ) : (
                <Button key="next" type="button" onClick={() => moveTo(step + 1)}>
                  {t.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {!isReview && (
          <div className="sticky top-6 space-y-4 lg:col-span-5">
            <BriefPreview {...brief} />
          </div>
        )}
      </form>
    </div>
  );
}
