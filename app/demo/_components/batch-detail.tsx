"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  ASSURANCE_LABELS,
  ASSURANCE_LEVELS,
  BATCH_EXCEPTIONS,
  FORMAT_LABELS,
  QUALITY_CLASS_LABELS,
  statusLabel,
  type AssuranceLevel,
  type BatchException,
  type CirkaRole,
} from "../_mock/domain";
import type { BatchDetail } from "../_mock/selectors-batches";
import { categoryLabel, formatCurrency, formatQuantity } from "../_mock/selectors-shared";
import { useDemoStore } from "../_mock/store";
import { BatchEditForm } from "./batch-edit-form";
import {
  CirkaBadge,
  DataRow,
  LinkRow,
  NoticeBanner,
  ProvenanceChip,
  QuantityPotsBar,
  SectionHeading,
  formatDate,
} from "./cirka-ui";
import { AuditTrail, EvidenceGrid, MovementTable } from "./records";
import { ThreadTimelinePanel } from "./trace-timeline";
import { useAction } from "./use-action";

type BatchTab = "overview" | "activity" | "admin";

export function BatchDetailView({
  detail,
  role,
  backHref,
}: {
  detail: BatchDetail;
  role: CirkaRole;
  backHref: string;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const { batch } = detail;

  const [activeTab, setActiveTab] = useState<BatchTab>("overview");
  const [isEditing, setEditing] = useState(false);
  const [writeOff, setWriteOff] = useState({ quantity: "", reason: "" });
  const [review, setReview] = useState<{ assuranceLevel: AssuranceLevel; notes: string }>({
    assuranceLevel: batch.assuranceLevel,
    notes: batch.reviewNotes ?? "",
  });
  const [exception, setException] = useState<{ status: BatchException | ""; note: string }>({
    status: batch.exceptionStatus ?? "",
    note: batch.exceptionNote ?? "",
  });

  const actorName = (userId?: string) =>
    store.db.users.find((user) => user._id === userId)?.name ?? "System";

  const isOwner = role === "manufacturer";
  const isAdmin = role === "admin";
  const canManage = isOwner || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href={backHref} variant="ghost" size="sm">
          ← Back
        </Button>
        <CirkaBadge status={batch.status} />
        {batch.exceptionStatus && <CirkaBadge status={batch.exceptionStatus} />}
      </div>

      <SectionHeading
        eyebrow={batch.reference}
        title={batch.name}
        description={batch.description}
        action={
          canManage ? (
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing((current) => !current)}
              >
                {isEditing ? "Close editor" : "Edit details"}
              </Button>
              {isOwner && !batch.releasedAt && (
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => store.releaseBatchForMatching(role, { batchId: batch._id }))
                  }
                >
                  Release for matching
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {error && <NoticeBanner tone="blocking" title="That change was refused">{error}</NoticeBanner>}

      {batch.exceptionStatus && (
        <NoticeBanner tone="warning" title={statusLabel(batch.exceptionStatus)}>
          {batch.exceptionNote}
        </NoticeBanner>
      )}

      {isEditing && (
        <BatchEditForm
          batch={batch}
          role={role}
          facilityOptions={store.db.facilities.filter(
            (facility) => facility.orgId === batch.ownerOrgId,
          )}
          onDone={() => setEditing(false)}
        />
      )}

      {!batch.releasedAt && (
        <NoticeBanner tone="info" title={`Not yet released · private to ${detail.ownerName}`} />
      )}

      {batch.releasedAt && !batch.reviewedAt && (
        <NoticeBanner tone="info" title="Awaiting CIRKA review" />
      )}

      {/* Tab Bar Navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--line)] pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
            activeTab === "overview"
              ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
            activeTab === "activity"
              ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          Activity & Ledger ({detail.movements.length})
        </button>
        {canManage && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
              activeTab === "admin"
                ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Management & Controls
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-stagger-in">
          <Panel className="space-y-5 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Quantity ledger
              </h2>
              <p className="text-xs text-[var(--ink-muted)] tabular-nums">
                {formatQuantity(batch.quantityOriginal, batch.unit)} recorded ·{" "}
                {detail.movements.length} movement{detail.movements.length === 1 ? "" : "s"}
              </p>
            </div>
            <QuantityPotsBar
              slices={detail.slices}
              total={batch.quantityOriginal}
              unit={batch.unit}
            />
          </Panel>

          {batch.imageUrls.length > 0 && (
            <Panel className="p-6">
              <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Reference photos
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {batch.imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="h-32 w-full rounded-lg border border-[var(--line)] object-cover"
                  />
                ))}
              </div>
            </Panel>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-6">
              <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                The material
              </h2>
              <dl>
                <DataRow label="Category" value={categoryLabel(batch.materialCategory)} />
                <DataRow label="Composition" value={batch.composition ?? "Not recorded"} hint={batch.compositionConfidence ? `${batch.compositionConfidence} composition` : undefined} />
                <DataRow label="Format" value={batch.format ? FORMAT_LABELS[batch.format] : "-"} />
                <DataRow
                  label="Quality"
                  value={batch.qualityClass ? QUALITY_CLASS_LABELS[batch.qualityClass] : "-"}
                />
                <DataRow label="Colour" value={batch.colour ?? "-"} />
                <DataRow label="Unit" value={batch.unit} />
                {batch.estimatedValue !== undefined && (
                  <DataRow
                    label="Estimated value"
                    value={formatCurrency(batch.estimatedValue, batch.currency)}
                    hint="Protected"
                  />
                )}
              </dl>
            </Panel>

            <Panel className="p-6">
              <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Origin and assurance
              </h2>
              <dl>
                <DataRow label="Owner" value={detail.ownerName} />
                <DataRow label="Source facility" value={detail.facility?.name ?? "Not recorded"} />
                <DataRow label="Location" value={batch.locationText ?? "-"} />
                <DataRow
                  label="Provenance"
                  value={
                    <ProvenanceChip
                      dataSource={batch.dataSource}
                      assuranceLevel={batch.assuranceLevel}
                    />
                  }
                />
                {batch.externalSystemName && (
                  <DataRow
                    label="External record"
                    value={
                      batch.externalRecordUrl ? (
                        <a
                          href={batch.externalRecordUrl}
                          className="underline font-medium"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {batch.externalSystemName} · {batch.externalRecordId}
                        </a>
                      ) : (
                        `${batch.externalSystemName} · ${batch.externalRecordId}`
                      )
                    }
                  />
                )}
                {detail.importJob && (
                  <DataRow
                    label="Import job"
                    value={`${detail.importJob.fileName ?? detail.importJob.source} · ${formatDate(detail.importJob.createdAt)}`}
                  />
                )}
                <DataRow label="Available from" value={formatDate(batch.availableFrom)} />
                <DataRow label="Available until" value={formatDate(batch.availableUntil)} />
                <DataRow label="Recorded" value={formatDate(batch.createdAt)} />
                <DataRow
                  label="Reviewed"
                  value={
                    batch.reviewedAt
                      ? `${formatDate(batch.reviewedAt)} · ${actorName(batch.reviewedByUserId)}`
                      : "Not reviewed by CIRKA"
                  }
                  hint={batch.reviewNotes}
                />
              </dl>
            </Panel>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY & LEDGER */}
      {activeTab === "activity" && (
        <div className="space-y-6 animate-stagger-in">
          {/* The whole story first, the underlying records below it. */}
          <ThreadTimelinePanel
            role={role}
            anchor={{ table: "resourceBatches", id: batch._id }}
            description="Every recorded step, from the day this material was logged."
          />

          {detail.matches.length > 0 && (
            <Panel className="overflow-hidden">
              <div className="border-b border-[var(--line)] px-6 py-4">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Matching decisions
                </h2>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {detail.matches.map(({ match, request }) => (
                  <div key={match._id} className="space-y-2 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-[var(--ink)]">
                        {formatQuantity(match.quantityProposed, match.unit)} for{" "}
                        {request?.reference ?? "a request"}
                      </p>
                      <CirkaBadge status={match.status} />
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{match.rationale}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      Proposed {formatDate(match.proposedAt)} by {actorName(match.proposedByUserId)}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {detail.allocations.length > 0 && (
            <Panel className="overflow-hidden">
              <div className="border-b border-[var(--line)] px-6 py-4">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Allocations
                </h2>
              </div>
              <div>
                {detail.allocations.map(({ allocation, fromName, toName }) => (
                  <LinkRow
                    key={allocation._id}
                    href={isAdmin ? "/demo/admin/allocations" : "/demo/manufacturer/dispatch"}
                    title={`${allocation.reference} · ${fromName} → ${toName}`}
                    tags={[
                      { label: "Allocated", value: formatQuantity(allocation.quantityAllocated, allocation.unit) },
                      ...(allocation.quantityReceived !== undefined
                        ? [{ label: "Received", value: formatQuantity(allocation.quantityReceived, allocation.unit) }]
                        : []),
                    ]}
                    right={<CirkaBadge status={allocation.status} />}
                  />
                ))}
              </div>
            </Panel>
          )}

          {detail.production.length > 0 && (
            <Panel className="overflow-hidden">
              <div className="border-b border-[var(--line)] px-6 py-4">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Production
                </h2>
              </div>
              <div>
                {detail.production.map((production) => (
                  <LinkRow
                    key={production._id}
                    href={
                      isAdmin
                        ? `/demo/admin/production/${production._id}`
                        : `/demo/manufacturer/batches/${batch._id}`
                    }
                    title={`${production.reference} · ${production.productName}`}
                    tags={[
                      { label: "Units", value: String(production.actualQuantity ?? production.plannedQuantity) },
                      { label: "Used", value: production.qtyUsed ? formatQuantity(production.qtyUsed, production.unit) : "Pending" },
                    ]}
                    right={<CirkaBadge status={production.status} />}
                  />
                ))}
              </div>
            </Panel>
          )}

          <Panel className="space-y-4 p-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Quantity movements
            </h2>
            <MovementTable movements={detail.movements} unit={batch.unit} actorName={actorName} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="space-y-4 p-6">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Evidence</h2>
              <EvidenceGrid items={detail.evidence} />
            </Panel>

            <Panel className="space-y-4 p-6">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">History</h2>
              <AuditTrail entries={detail.audit} actorName={actorName} limit={12} />
            </Panel>
          </div>

          {detail.transfers.length > 0 && (
            <Panel className="overflow-hidden">
              <div className="border-b border-[var(--line)] px-6 py-4">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Integration transfers
                </h2>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {detail.transfers.map((transfer) => (
                  <div key={transfer._id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="text-xs font-medium text-[var(--ink)]">
                        {transfer.direction === "inbound" ? "From" : "To"} {transfer.externalSystemName}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        {transfer.errorMessage ?? transfer.payloadSummary}
                      </p>
                    </div>
                    <CirkaBadge status={transfer.status} />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* TAB 3: MANAGEMENT & CONTROLS (Admin/Owner only) */}
      {activeTab === "admin" && canManage && (
        <div className="space-y-6 animate-stagger-in">
          <div className="grid gap-6 lg:grid-cols-2">
            {isAdmin && (
              <Panel className="space-y-4 p-6">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  CIRKA review & assurance
                </h2>
                <Field label="Assurance level">
                  <Select
                    value={review.assuranceLevel}
                    onChange={(event) =>
                      setReview((current) => ({
                        ...current,
                        assuranceLevel: event.target.value as AssuranceLevel,
                      }))
                    }
                  >
                    {ASSURANCE_LEVELS.map((value) => (
                      <option key={value} value={value}>
                        {ASSURANCE_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Review notes">
                  <Textarea
                    value={review.notes}
                    onChange={(event) =>
                      setReview((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="What was checked, and against what evidence."
                  />
                </Field>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      store.reviewBatch(role, {
                        batchId: batch._id,
                        assuranceLevel: review.assuranceLevel,
                        reviewNotes: review.notes,
                      }),
                    )
                  }
                >
                  Save review
                </Button>
              </Panel>
            )}

            <Panel className="space-y-4 p-6">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Write off available material
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Quantity (${batch.unit})`}>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={writeOff.quantity}
                    onChange={(event) =>
                      setWriteOff((current) => ({ ...current, quantity: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Reason">
                  <Input
                    value={writeOff.reason}
                    onChange={(event) =>
                      setWriteOff((current) => ({ ...current, reason: event.target.value }))
                    }
                    placeholder="Water damage in storage"
                  />
                </Field>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await store.writeOffAvailableQuantity(role, {
                      batchId: batch._id,
                      quantity: Number(writeOff.quantity),
                      reason: writeOff.reason,
                    });
                    setWriteOff({ quantity: "", reason: "" });
                  })
                }
              >
                Write off
              </Button>

              <div className="space-y-4 border-t border-[var(--line)] pt-4">
                <Field label="Exception status">
                  <Select
                    value={exception.status}
                    onChange={(event) =>
                      setException((current) => ({
                        ...current,
                        status: event.target.value as BatchException | "",
                      }))
                    }
                  >
                    <option value="">No exception</option>
                    {BATCH_EXCEPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Note">
                  <Input
                    value={exception.note}
                    onChange={(event) =>
                      setException((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="Reason for exception state"
                  />
                </Field>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      store.setBatchException(role, {
                        batchId: batch._id,
                        exceptionStatus: exception.status || undefined,
                        note: exception.note,
                      }),
                    )
                  }
                >
                  Update exception
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
