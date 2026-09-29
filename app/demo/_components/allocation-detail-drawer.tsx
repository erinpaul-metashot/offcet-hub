"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { SUITABILITY_RATINGS, type SuitabilityRating } from "../_mock/domain";
import type { MakerAllocation } from "../_mock/selectors-maker";
import { projectReferences } from "../_mock/selectors-shared";
import type { useAction } from "./use-action";
import type { useDemoStore } from "../_mock/store";
import { CirkaBadge, DataRow, NoticeBanner } from "./cirka-ui";
import { ProjectBriefPack } from "./project-brief-pack";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

interface FeedbackDraft {
  receivedAsDescribed: boolean;
  suitability: SuitabilityRating;
  qualityRating: string;
  damageNote: string;
  recommendedApplications: string;
  limitations: string;
  notes: string;
}

const emptyFeedback: FeedbackDraft = {
  receivedAsDescribed: true,
  suitability: "suitable",
  qualityRating: "4",
  damageNote: "",
  recommendedApplications: "",
  limitations: "",
  notes: "",
};

export function AllocationDetailDrawer({
  entry,
  store,
  run,
  pending,
  error,
  clearError,
  onClose,
}: {
  entry: MakerAllocation;
  store: ReturnType<typeof useDemoStore>;
  run: ReturnType<typeof useAction>["run"];
  pending: boolean;
  error: string | null;
  clearError: () => void;
  onClose: () => void;
}) {
  const { allocation } = entry;
  const project = allocation.projectId
    ? store.db.projects.find((item) => item._id === allocation.projectId)
    : undefined;
  const dispatched = allocation.quantityDispatched ?? allocation.quantityAllocated;
  const [received, setReceived] = useState(String(dispatched));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackDraft>(emptyFeedback);
  const { allocationDrawer: t } = useMessages(demoMaker);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex justify-end bg-[var(--ink)]/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--paper)]"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={allocation.reference}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {allocation.reference}
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {entry.batchName}
              </h2>
              <CirkaBadge status={allocation.status} />
            </div>
            <p className="text-sm text-[var(--ink-muted)]">
              {format(t.fromLine, { reference: entry.batchReference, from: entry.fromName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <NoticeBanner tone="blocking" title={ui.stepRefused}>
              {error}
            </NoticeBanner>
          )}

          <div className="flex items-baseline justify-between gap-4 rounded-2xl bg-[var(--surface)] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {t.quantityAllocated}
            </p>
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-[var(--ink)]">
              {fmt.quantity(allocation.quantityAllocated, allocation.unit)}
            </p>
          </div>

          <dl>
            <DataRow label={t.expectedArrival} value={fmt.date(allocation.expectedArrivalDate)} />
            <DataRow label={t.received} value={fmt.date(allocation.receivedAt)} />
            <DataRow
              label={t.suitabilityFeedback}
              value={entry.hasFeedback ? t.recorded : t.notRecorded}
            />
            <DataRow
              label={t.production}
              value={
                entry.production
                  ? `${entry.production.reference} · ${entry.production.productName}`
                  : t.noProduction
              }
            />
            {allocation.notes && <DataRow label={t.custodianNote} value={allocation.notes} />}
          </dl>

          {project && (
            <section className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {format(t.brief, { reference: project.reference })}
                </p>
                <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  {project.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {project.objective}
                </p>
              </div>
              <ProjectBriefPack items={projectReferences(store.db, project._id)} />
              <Link
                href={`/demo/maker/projects/${project._id}`}
                className="inline-flex text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--ink)]"
              >
                {t.openBrief}
              </Link>
            </section>
          )}

          {allocation.status === "proposed" && (
            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              <Button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.respondToAllocation("maker", {
                      allocationId: allocation._id,
                      accept: true,
                      note: t.acceptNote,
                    }),
                  )
                }
              >
                {t.accept}
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.respondToAllocation("maker", {
                      allocationId: allocation._id,
                      accept: false,
                      note: t.declineNote,
                    }),
                  )
                }
              >
                {t.decline}
              </Button>
            </div>
          )}

          {allocation.status === "in_transit" && (
            <div className="space-y-4 border-t border-[var(--line)] pt-5">
              <Field
                label={format(t.quantityReceived, { unit: labels.UNIT_LABELS[allocation.unit] })}
                hint={format(t.handOverNote, { quantity: fmt.quantity(dispatched, allocation.unit) })}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                />
              </Field>
              <Button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    store.confirmReceipt("maker", {
                      allocationId: allocation._id,
                      quantityReceived: Number(received),
                    }),
                  )
                }
              >
                {t.confirmReceipt}
              </Button>
            </div>
          )}

          {["received", "completed"].includes(allocation.status) && (
            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              {!entry.hasFeedback && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearError();
                    setFeedbackOpen((open) => !open);
                    setFeedback(emptyFeedback);
                  }}
                >
                  {feedbackOpen ? t.close : t.recordSuitability}
                </Button>
              )}
              {!entry.production && (
                <Button as={Link} href="/demo/maker/production/new">
                  {t.createProduction}
                </Button>
              )}
              {entry.production && (
                <Button as={Link} href={`/demo/maker/production/${entry.production._id}`}>
                  {t.openProduction}
                </Button>
              )}
            </div>
          )}

          {feedbackOpen && (
            <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t.materialSuitability}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.receivedAsDescribed}>
                  <Select
                    value={feedback.receivedAsDescribed ? "yes" : "no"}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        receivedAsDescribed: event.target.value === "yes",
                      }))
                    }
                  >
                    <option value="yes">{t.yes}</option>
                    <option value="no">{t.no}</option>
                  </Select>
                </Field>
                <Field label={t.suitability}>
                  <Select
                    value={feedback.suitability}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        suitability: event.target.value as SuitabilityRating,
                      }))
                    }
                  >
                    {SUITABILITY_RATINGS.map((value) => (
                      <option key={value} value={value}>
                        {labels.SUITABILITY_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label={t.qualityRating}>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={feedback.qualityRating}
                  onChange={(event) =>
                    setFeedback((current) => ({ ...current, qualityRating: event.target.value }))
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.damage}>
                  <Input
                    value={feedback.damageNote}
                    onChange={(event) =>
                      setFeedback((current) => ({ ...current, damageNote: event.target.value }))
                    }
                    placeholder={t.damagePlaceholder}
                  />
                </Field>
                <Field label={t.applications}>
                  <Input
                    value={feedback.recommendedApplications}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        recommendedApplications: event.target.value,
                      }))
                    }
                    placeholder={t.applicationsPlaceholder}
                  />
                </Field>
              </div>

              <Field label={t.limitations}>
                <Input
                  value={feedback.limitations}
                  onChange={(event) =>
                    setFeedback((current) => ({ ...current, limitations: event.target.value }))
                  }
                  placeholder={t.limitationsPlaceholder}
                />
              </Field>

              <Field label={t.notes}>
                <Textarea
                  value={feedback.notes}
                  onChange={(event) =>
                    setFeedback((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </Field>

              <Button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await store.submitSuitabilityFeedback("maker", {
                      allocationId: allocation._id,
                      receivedAsDescribed: feedback.receivedAsDescribed,
                      suitability: feedback.suitability,
                      qualityRating: Number(feedback.qualityRating) || undefined,
                      damageNote: feedback.damageNote || undefined,
                      recommendedApplications: feedback.recommendedApplications || undefined,
                      limitations: feedback.limitations || undefined,
                      notes: feedback.notes || undefined,
                    });
                    setFeedbackOpen(false);
                  })
                }
              >
                {t.submit}
              </Button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-[var(--line)] px-6 py-5">
          <Button variant="secondary" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
