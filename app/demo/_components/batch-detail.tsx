"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Button, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  ASSURANCE_LABELS,
  ASSURANCE_LEVELS,
  BATCH_EXCEPTIONS,
  statusLabel,
  type AssuranceLevel,
  type BatchException,
  type CirkaRole,
} from "../_mock/domain";
import { isListedLot } from "../_mock/operations/marketplace";
import type { BatchDetail } from "../_mock/selectors-batches";
import { enquiriesForBatch } from "../_mock/selectors-marketplace";
import { formatQuantity } from "../_mock/selectors-shared";
import { useDemoStore } from "../_mock/store";
import { BatchEditForm } from "./batch-edit-form";
import { BatchOverview } from "./batch-overview";
import {
  CirkaBadge,
  LinkRow,
  NoticeBanner,
  SectionHeading,
  formatDate,
} from "./cirka-ui";
import { AuditTrail, EvidenceGrid, MovementTable } from "./records";
import { ThreadTimelinePanel } from "./trace-timeline";
import { useAction } from "./use-action";
import { DiscrepancyAnalysisPanel } from "./discrepancy-analysis";

type BatchTab = "overview" | "activity" | "discrepancies" | "admin";

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
  const [ledgerSubView, setLedgerSubView] = useState<"journey" | "movements" | "audit">("journey");
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(true);
  const [isConnectedOperationsExpanded, setIsConnectedOperationsExpanded] = useState(true);
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(true);
  const [isEditing, setEditing] = useState(false);
  const [writeOff, setWriteOff] = useState({ quantity: "", reason: "" });
  const [review, setReview] = useState<{ assuranceLevel: AssuranceLevel; notes: string }>({
    assuranceLevel: batch.assuranceLevel,
    notes: batch.reviewNotes ?? "",
  });
  const [placement, setPlacement] = useState({ custodianOrgId: "", quantity: "", notes: "" });
  const [exception, setException] = useState<{ status: BatchException | ""; note: string }>({
    status: batch.exceptionStatus ?? "",
    note: batch.exceptionNote ?? "",
  });
  const actorName = (userId?: string) =>
    store.db.users.find((user) => user._id === userId)?.name ?? "System";

  const isOwner = role === "manufacturer";
  const isAdmin = role === "admin";
  const canManage = isOwner || isAdmin;

  const custodians = store.db.organisations.filter(
    (org) => org.type === "custodian" && org.status === "approved",
  );

  const enquiries = enquiriesForBatch(store.db, batch._id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href={backHref} variant="ghost" size="sm">
          ← Back
        </Button>
        <CirkaBadge status={batch.status} />
        {!batch.releasedAt && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]"
            title={`Only ${detail.ownerName} can see it until it is released`}
          >
            <Lock size={12} /> Private
          </span>
        )}
        {/* Listed is derived, never stored: released, reviewed, clean, and with
            quantity left. Enquiries are demand: none of them holds anything. */}
        {isListedLot(batch) && (
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)]">
            Listed · {formatQuantity(batch.pots.available, batch.unit)} open
            {enquiries.length > 0 &&
              ` · ${enquiries.length} enquir${enquiries.length === 1 ? "y" : "ies"}`}
          </span>
        )}
      </div>

      <SectionHeading
        eyebrow={batch.reference}
        title={batch.name}
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

      {/* Tab Bar Navigation */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--line)] pb-px">
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
        {detail.allocations.some(
          (entry) => entry.allocation.status === "discrepancy" || Boolean(entry.allocation.quantityDiscrepancy),
        ) && (
          <button
            onClick={() => setActiveTab("discrepancies")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
              activeTab === "discrepancies"
                ? "text-[#FF5C00] border-b-2 border-[#FF5C00]"
                : "text-[var(--ink-muted)] hover:text-[#FF5C00]"
            }`}
          >
            <span>Discrepancies</span>
            <span className="rounded-full bg-[#FF5C00] px-2 py-0.5 text-[10px] font-extrabold text-white">
              {
                detail.allocations.filter(
                  (entry) => entry.allocation.status === "discrepancy" || Boolean(entry.allocation.quantityDiscrepancy),
                ).length
              }
            </span>
          </button>
        )}
        {canManage && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
              activeTab === "admin"
                ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Manage
          </button>
        )}
      </div>

      {activeTab === "overview" && <BatchOverview detail={detail} actorName={actorName} />}

      {/* TAB 2: ACTIVITY & LEDGER */}
      {activeTab === "activity" && (
        <div className="space-y-6 animate-stagger-in">
          {/* 1. Unified Event & Movement Ledger Panel */}
          <Panel className="overflow-hidden">
            <div
              className={`flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]/30 cursor-pointer select-none hover:bg-[var(--surface)] transition-colors`}
              onClick={() => setIsLedgerExpanded((prev) => !prev)}
            >
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {/* Sub-view switcher toggles */}
                <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLedgerSubView("journey")}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                      ledgerSubView === "journey"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerSubView("movements")}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                      ledgerSubView === "movements"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Movements ({detail.movements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerSubView("audit")}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                      ledgerSubView === "audit"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Audit Log ({detail.audit.length})
                  </button>
                </div>

                {/* Parent Container Collapse Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLedgerExpanded((prev) => !prev);
                  }}
                  className="flex items-center justify-center p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white transition-colors"
                  aria-label={isLedgerExpanded ? "Collapse ledger" : "Expand ledger"}
                  title={isLedgerExpanded ? "Collapse ledger" : "Expand ledger"}
                >
                  {isLedgerExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </div>
            </div>

            {isLedgerExpanded && (
              <>
                {ledgerSubView === "journey" && (
                  <ThreadTimelinePanel
                    role={role}
                    anchor={{ table: "resourceBatches", id: batch._id }}
                    plain
                    showHeader={false}
                  />
                )}

                {ledgerSubView === "movements" && (
                  <div className="p-6">
                    <MovementTable movements={detail.movements} unit={batch.unit} actorName={actorName} />
                  </div>
                )}

                {ledgerSubView === "audit" && (
                  <div className="p-6">
                    <AuditTrail entries={detail.audit} actorName={actorName} limit={20} />
                  </div>
                )}
              </>
            )}
          </Panel>

          {/* 2. Connected Operations & Systems Bento Grid */}
          {(detail.matches.length > 0 ||
            detail.allocations.length > 0 ||
            detail.production.length > 0 ||
            detail.transfers.length > 0) && (
            <Panel className="overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]/30 cursor-pointer select-none hover:bg-[var(--surface)] transition-colors"
                onClick={() => setIsConnectedOperationsExpanded((prev) => !prev)}
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    Linked records
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConnectedOperationsExpanded((prev) => !prev);
                  }}
                  className="flex items-center justify-center p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white transition-colors"
                  aria-label={isConnectedOperationsExpanded ? "Collapse connected operations" : "Expand connected operations"}
                  title={isConnectedOperationsExpanded ? "Collapse connected operations" : "Expand connected operations"}
                >
                  {isConnectedOperationsExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </div>

              {isConnectedOperationsExpanded && (
                <div className="p-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column: Matching Proposals & Allocations */}
                    <div className="space-y-6">
                      {detail.matches.length > 0 && (
                        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/30 overflow-hidden">
                          <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Matching Proposals ({detail.matches.length})
                            </h3>
                          </div>
                          <div className="divide-y divide-[var(--line)] bg-white">
                            {detail.matches.map(({ match, request }) => (
                              <div key={match._id} className="space-y-2 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-medium text-[var(--ink)] text-sm">
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
                        </div>
                      )}

                      {detail.allocations.length > 0 && (
                        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/30 overflow-hidden">
                          <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Allocations ({detail.allocations.length})
                            </h3>
                          </div>
                          <div className="divide-y divide-[var(--line)] bg-white">
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
                        </div>
                      )}
                    </div>

                    {/* Right Column: Production & Integration Transfers */}
                    <div className="space-y-6">
                      {detail.production.length > 0 && (
                        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/30 overflow-hidden">
                          <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Production ({detail.production.length})
                            </h3>
                          </div>
                          <div className="divide-y divide-[var(--line)] bg-white">
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
                        </div>
                      )}

                      {detail.transfers.length > 0 && (
                        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/30 overflow-hidden">
                          <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              Integration Transfers ({detail.transfers.length})
                            </h3>
                          </div>
                          <div className="divide-y divide-[var(--line)] bg-white">
                            {detail.transfers.map((transfer) => (
                              <div key={transfer._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* 3. Evidence & Verification Grid */}
          {detail.evidence.length > 0 && (
            <Panel className="overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]/30 cursor-pointer select-none hover:bg-[var(--surface)] transition-colors"
                onClick={() => setIsEvidenceExpanded((prev) => !prev)}
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    Evidence ({detail.evidence.length})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEvidenceExpanded((prev) => !prev);
                  }}
                  className="flex items-center justify-center p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white transition-colors"
                  aria-label={isEvidenceExpanded ? "Collapse evidence" : "Expand evidence"}
                  title={isEvidenceExpanded ? "Collapse evidence" : "Expand evidence"}
                >
                  {isEvidenceExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </div>

              {isEvidenceExpanded && (
                <div className="p-6">
                  <EvidenceGrid items={detail.evidence} />
                </div>
              )}
            </Panel>
          )}
        </div>
      )}

      {/* TAB 3: DISCREPANCIES AUDIT */}
      {activeTab === "discrepancies" && (
        <div className="space-y-6 animate-stagger-in">
          {detail.allocations
            .filter((entry) => entry.allocation.status === "discrepancy" || Boolean(entry.allocation.quantityDiscrepancy))
            .map(({ allocation, fromName, toName }) => (
              <DiscrepancyAnalysisPanel
                key={allocation._id}
                allocation={allocation}
                batch={batch}
                fromName={fromName}
                toName={toName}
              />
            ))}
        </div>
      )}

      {/* TAB 4: MANAGEMENT & CONTROLS (Admin/Owner only) */}
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

            {/* Only CIRKA places a batch. The custodian then accepts before the
                manufacturer dispatches: nothing moves on one party's say-so. */}
            {isAdmin && (
              <Panel className="space-y-4 p-6">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Send to a custodian
                </h2>
                <p className="text-sm text-[var(--ink-muted)]">
                  {formatQuantity(batch.pots.available, batch.unit)} unallocated
                </p>
                <Field label="Custodian">
                  <Select
                    value={placement.custodianOrgId}
                    onChange={(event) =>
                      setPlacement((current) => ({
                        ...current,
                        custodianOrgId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose a custodian</option>
                    {custodians.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`Quantity (${batch.unit})`}>
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={placement.quantity}
                      onChange={(event) =>
                        setPlacement((current) => ({ ...current, quantity: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Note to the custodian">
                    <Input
                      value={placement.notes}
                      onChange={(event) =>
                        setPlacement((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Hold for the Nordic spring line"
                    />
                  </Field>
                </div>
                <Button
                  size="sm"
                  title={batch.reviewedAt ? undefined : "Review this batch first"}
                  disabled={
                    pending ||
                    !batch.reviewedAt ||
                    !placement.custodianOrgId ||
                    Number(placement.quantity) <= 0
                  }
                  onClick={() =>
                    run(async () => {
                      await store.proposeAllocationToCustodian(role, {
                        batchId: batch._id,
                        toOrgId: placement.custodianOrgId,
                        quantity: Number(placement.quantity),
                        notes: placement.notes || undefined,
                      });
                      setPlacement({ custodianOrgId: "", quantity: "", notes: "" });
                    })
                  }
                >
                  Propose allocation
                </Button>
              </Panel>
            )}

            <Panel className="space-y-4 p-6">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Write off
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
