"use client";

/**
 * One listed lot, and the only thing you can do with it: tell CIRKA you want it.
 *
 * The form writes a `ResourceRequest`, nothing more. No pot moves, no hold is
 * placed, and another organisation can enquire on the same lot an hour later.
 * The screen says so plainly, because a listing that looked like a shelf would
 * teach the wrong model of how CIRKA works.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { CirkaRole } from "../_mock/domain";
import { getMarketplaceLot } from "../_mock/selectors-marketplace";
import { useDemoPersona, useDemoStore } from "../_mock/store";
import type { Project } from "../_mock/types";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  ProvenanceChip,
  SectionHeading,
} from "./cirka-ui";
import { MaterialSwatch } from "./material-swatch";
import { useAction } from "./use-action";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const EMPTY_FORM = { quantity: "", intendedUse: "", neededBy: "", projectId: "", note: "" };

export function MarketplaceLotDetail({
  role,
  batchId,
  backHref,
  projects = [],
}: {
  role: CirkaRole;
  batchId: string;
  backHref: string;
  /** Offered on the brand surface so an enquiry can land inside a project. */
  projects?: Project[];
}) {
  const store = useDemoStore();
  const { scope } = useDemoPersona(role);
  const { run, error, pending } = useAction();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { lot: t, market } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

  const lot = getMarketplaceLot(store.db, scope, batchId);

  if (!lot) {
    return (
      <NoticeBanner tone="blocking" title={t.notFound} />
    );
  }

  const { batch } = lot;
  const canEnquire = role === "maker" || role === "brand";
  const openEnquiry = lot.ownEnquiries.find(
    (request) => !["fulfilled", "closed", "cancelled", "unfulfillable"].includes(request.status),
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    await run(async () => {
      await store.requestListedLot(role, {
        batchId,
        quantity: Number(form.quantity),
        intendedUse: form.intendedUse,
        projectId: form.projectId || undefined,
        neededBy: toTimestamp(form.neededBy),
        note: form.note || undefined,
      });

      setForm(EMPTY_FORM);
      setSubmitted(true);
    });
  };

  const currentImage = selectedImage || batch?.imageUrls?.[0];

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] transition-colors duration-150 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
      >
        <ArrowLeft
          size={14}
          className="transition-transform duration-150 ease-[var(--ease-out)] group-hover:-translate-x-0.5"
        />
        {market.title}
      </Link>

      <SectionHeading
        eyebrow={
          lot.supplierName ??
          [labels.ORGANISATION_TYPE_LABELS[lot.supplierType], lot.region].filter(Boolean).join(" · ")
        }
        title={batch.name}
        action={<CirkaBadge status={batch.status} />}
      />

      {lot.blocker && (
        <NoticeBanner tone="warning" title={t.notOpen}>
          {lot.blocker}
        </NoticeBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="space-y-6">
          {/* The lot as drawn from its own record, then the ledger that qualifies it. */}
          <div className="space-y-3">
            <MaterialSwatch
              category={batch.materialCategory}
              format={batch.format}
              colour={batch.colour}
              imageUrl={currentImage}
              className="h-64 sm:h-80 rounded-[1.5rem] border border-[var(--line)] shadow-sm"
            >
              {batch.qualityClass && (
                <span className="absolute right-4 top-4 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)] shadow-sm">
                  {labels.QUALITY_CLASS_LABELS[batch.qualityClass]}
                </span>
              )}
            </MaterialSwatch>

            {batch.imageUrls && batch.imageUrls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {batch.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(url)}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition-all ${
                      (currentImage === url)
                        ? "border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20"
                        : "border-[var(--line)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={format(t.photo, { n: idx + 1 })} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Panel className="space-y-5 p-6">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {t.available}
                </span>
                <p className="text-[42px] font-semibold leading-none tracking-[-0.05em] tabular-nums text-[var(--ink)]">
                  {fmt.quantity(batch.pots.available, batch.unit)}
                </p>
              </div>
              <ProvenanceChip dataSource={batch.dataSource} assuranceLevel={batch.assuranceLevel} />
            </div>
          </Panel>

          <Panel className="space-y-4 p-6">
          <p className="text-sm leading-relaxed text-[var(--ink)]">{batch.description}</p>
          <dl>
            <DataRow label={t.reference} value={batch.reference} />
            <DataRow
              label={t.category}
              value={labels.MATERIAL_CATEGORY_LABELS[batch.materialCategory] ?? batch.materialCategory}
            />
            {batch.composition && (
              <DataRow
                label={t.composition}
                value={batch.composition}
                hint={
                  batch.compositionConfidence
                    ? format(t.confidenceHint, { confidence: t.confidence[batch.compositionConfidence] })
                    : undefined
                }
              />
            )}
            {batch.format && <DataRow label={t.format} value={labels.FORMAT_LABELS[batch.format]} />}
            {batch.qualityClass && (
              <DataRow label={t.grade} value={labels.QUALITY_CLASS_LABELS[batch.qualityClass]} />
            )}
            {batch.colour && <DataRow label={t.colour} value={batch.colour} />}
            {batch.weightPerUnit && (
              <DataRow label={t.weightPerUnit} value={`${batch.weightPerUnit} g/m²`} />
            )}
            <DataRow label={t.origin} value={lot.region ?? t.notRecorded} />
            {lot.facilityName && <DataRow label={t.heldAt} value={lot.facilityName} />}
            {batch.locationText && <DataRow label={t.location} value={batch.locationText} />}
            <DataRow
              label={t.available}
              value={
                batch.availableFrom || batch.availableUntil
                  ? `${fmt.date(batch.availableFrom)} – ${fmt.date(batch.availableUntil)}`
                  : t.noWindow
              }
            />
            <DataRow label={t.reviewedByCirka} value={fmt.date(batch.reviewedAt)} />
            <DataRow label={t.listed} value={fmt.date(batch.releasedAt)} />
            </dl>
          </Panel>
        </div>

        {/* The buy box. It follows you down the page, because it is the only action here. */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {lot.enquiryCount > 0 && (
          <Panel className="space-y-3 p-5">
            <p className="flex items-center gap-2.5 text-sm font-medium text-[var(--ink)]">
              <Users size={15} className="text-[var(--ink-muted)]" />
              {format(lot.enquiryCount === 1 ? market.openEnquiryOne : market.openEnquiryMany, { count: lot.enquiryCount })}
            </p>

            {lot.allEnquiries && lot.allEnquiries.length > 0 && (
              <ul className="space-y-1.5 border-t border-[var(--line)] pt-3">
                {lot.allEnquiries.map(({ request, requesterName }) => (
                  <li key={request._id}>
                    <Link
                      href={`/demo/admin/matching/${request._id}`}
                      className="group flex items-center justify-between gap-3 text-xs text-[var(--ink-muted)] transition-colors duration-150 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
                    >
                      <span className="truncate">
                        {requesterName} · {fmt.quantity(request.quantityNeeded, request.unit)}
                      </span>
                      <CirkaBadge status={request.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          )}

          {canEnquire && !(lot.blocker && !openEnquiry && !submitted) && (
            <Panel className="space-y-4 p-5">
              {error && (
                <NoticeBanner tone="blocking" title={t.notSent}>
                  {error}
                </NoticeBanner>
              )}

              {openEnquiry ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {openEnquiry.reference}
                    </span>
                    <CirkaBadge status={openEnquiry.status} />
                  </div>
                  <p className="text-sm tabular-nums text-[var(--ink-muted)]">
                    {fmt.quantity(openEnquiry.quantityNeeded, openEnquiry.unit)} ·{" "}
                    {fmt.date(openEnquiry.createdAt)}
                  </p>
                </div>
              ) : submitted ? (
                <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                  {t.sent}
                </p>
              ) : lot.blocker ? null : (
                <form onSubmit={submit} className="space-y-4">
                  <Field
                    label={t.quantity}
                    required
                    hint={format(t.upTo, { quantity: fmt.quantity(batch.pots.available, batch.unit) })}
                  >
                    <Input
                      type="number"
                      min={1}
                      max={batch.pots.available}
                      value={form.quantity}
                      onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                    />
                  </Field>

                  <Field
                    label={t.intendedUse}
                    required
                  >
                    <Textarea
                      value={form.intendedUse}
                      onChange={(event) => setForm({ ...form, intendedUse: event.target.value })}
                    />
                  </Field>

                  {projects.length > 0 && (
                    <Field label={t.project}>
                      <Select
                        value={form.projectId}
                        onChange={(event) => setForm({ ...form, projectId: event.target.value })}
                      >
                        <option value="">{t.noProject}</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}

                  <Field label={t.neededBy}>
                    <Input
                      type="date"
                      value={form.neededBy}
                      onChange={(event) => setForm({ ...form, neededBy: event.target.value })}
                    />
                  </Field>

                  <Field label={t.note}>
                    <Textarea
                      value={form.note}
                      onChange={(event) => setForm({ ...form, note: event.target.value })}
                    />
                  </Field>

                  <Button type="submit" disabled={pending} className="w-full">
                    {pending ? t.sending : t.request}
                  </Button>
                </form>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
