"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
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
import { isListedLot } from "../_mock/operations/marketplace";
import type { BatchDetail } from "../_mock/selectors-batches";
import { enquiriesForBatch } from "../_mock/selectors-marketplace";
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
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const availableQuantity = (batch.pots.available ?? 0) + (batch.pots.at_custodian ?? 0);
  const unexplainedQuantity = batch.pots.unexplained ?? 0;
  const availablePercent =
    batch.quantityOriginal > 0
      ? Math.round((availableQuantity / batch.quantityOriginal) * 100)
      : 0;

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

      {/* Listed is derived, never stored: released, reviewed, clean, and with
          quantity left. Enquiries are demand — none of them holds anything. */}
      {isListedLot(batch) && (
        <NoticeBanner
          tone="info"
          title={`Listed as available material · ${formatQuantity(batch.pots.available, batch.unit)} open to enquiry`}
        >
          {enquiries.length === 0
            ? "No enquiries yet."
            : `${enquiries.length} organisation${enquiries.length === 1 ? " has" : "s have"} enquired. CIRKA is weighing them and will propose a match — nothing is reserved until you see one.`}
        </NoticeBanner>
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
            Management & Controls
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-stagger-in">
          {/* Top KPI Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Total Volume */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--line-strong)]">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Total Recorded Volume</span>
                <Scale className="size-4 text-[var(--brand-primary)]" />
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                {formatQuantity(batch.quantityOriginal, batch.unit)}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--ink-muted)] font-medium">
                <Layers className="size-3.5 text-[var(--brand-primary)]" />
                <span>{detail.movements.length} movement{detail.movements.length === 1 ? "" : "s"} logged</span>
              </div>
            </div>

            {/* KPI 2: Available Volume */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--line-strong)]">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Available Quantity</span>
                <CheckCircle2 className="size-4 text-[#8CC63F]" />
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                {formatQuantity(availableQuantity, batch.unit)}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#8CC63F] font-semibold">
                <span className="inline-block size-2 rounded-full bg-[#8CC63F] animate-pulse" />
                <span>{availablePercent}% ready for allocation</span>
              </div>
            </div>

            {/* KPI 3: Exception & Hold */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--line-strong)]">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Hold & Unexplained</span>
                <AlertTriangle className={`size-4 ${unexplainedQuantity > 0 ? "text-[#FF5C00]" : "text-[var(--ink-muted)]"}`} />
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                {formatQuantity(unexplainedQuantity, batch.unit)}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                {unexplainedQuantity > 0 ? (
                  <span className="text-[#FF5C00] flex items-center gap-1">
                    <span className="inline-block size-2 rounded-full bg-[#FF5C00]" />
                    Requires attention
                  </span>
                ) : (
                  <span className="text-[var(--ink-muted)] font-normal">Zero discrepancy recorded</span>
                )}
              </div>
            </div>

            {/* KPI 4: Provenance Assurance */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--line-strong)]">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Verification Status</span>
                <ShieldCheck className="size-4 text-[var(--brand-primary)]" />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <ProvenanceChip dataSource={batch.dataSource} assuranceLevel={batch.assuranceLevel} />
              </div>
              <div className="mt-2 text-[11px] text-[var(--ink-muted)] font-medium truncate">
                {batch.reviewedAt ? `Audited ${formatDate(batch.reviewedAt)}` : "Pending CIRKA Audit"}
              </div>
            </div>
          </div>

          {/* Slim Visual Volume Breakdown Bar (No redundant text cards) */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] flex items-center gap-1.5">
                <Layers className="size-3.5 text-[var(--brand-primary)]" />
                Visual Pot Breakdown ({detail.slices.length} active pots)
              </span>
              <span className="text-xs font-bold text-[var(--ink)]">
                {formatQuantity(batch.quantityOriginal, batch.unit)} Total
              </span>
            </div>
            <QuantityPotsBar
              slices={detail.slices}
              total={batch.quantityOriginal}
              unit={batch.unit}
              compact
            />
          </div>

          {/* Main Content 2-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Panel: Material Passport Specifications */}
            <Panel className="flex flex-col justify-between space-y-6 p-6">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#FF5C00]/10 text-[#FF5C00]">
                      <Box className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--ink)] tracking-tight">Material Passport</h3>
                      <p className="text-xs text-[var(--ink-muted)]">Technical parameters & fabric attributes</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-[11px] font-bold text-[var(--ink)] border border-[var(--line)]">
                    {categoryLabel(batch.materialCategory)}
                  </span>
                </div>

                {/* Primary Composition Highlight Card */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 mb-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-1">
                    Material Composition
                  </div>
                  <div className="text-lg font-bold text-[var(--ink)]">
                    {batch.composition ?? "Not recorded"}
                  </div>
                  {batch.compositionConfidence && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#8CC63F]/15 px-2.5 py-1 text-xs font-bold text-[#8CC63F] border border-[#8CC63F]/30">
                      <Sparkles className="size-3" />
                      <span>{batch.compositionConfidence} Composition Confidence</span>
                    </div>
                  )}
                </div>

                {/* 2x2 Visual Spec Attribute Cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Format */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-1">
                      Format
                    </div>
                    <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
                      <Tag className="size-3.5 text-[var(--brand-primary)]" />
                      {batch.format ? FORMAT_LABELS[batch.format] : "-"}
                    </div>
                  </div>

                  {/* Quality Tier */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-1">
                      Quality Grade
                    </div>
                    <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-[#8CC63F]" />
                      {batch.qualityClass ? QUALITY_CLASS_LABELS[batch.qualityClass] : "-"}
                    </div>
                  </div>

                  {/* Colour */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-1">
                      Colour Profile
                    </div>
                    <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
                      <span className="size-3 rounded-full border border-black/20 bg-[#FF5C00] inline-block" />
                      {batch.colour ?? "-"}
                    </div>
                  </div>

                  {/* Commercial Value */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] mb-1">
                      Estimated Value
                    </div>
                    <div className="text-sm font-semibold text-[var(--ink)] flex items-center justify-between">
                      <span>
                        {batch.estimatedValue !== undefined
                          ? formatCurrency(batch.estimatedValue, batch.currency)
                          : "-"}
                      </span>
                      {batch.estimatedValue !== undefined && (
                        <span className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider bg-[var(--surface-strong)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                          Protected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Photos Gallery Component */}
              {batch.imageUrls.length > 0 && (
                <div className="border-t border-[var(--line)] pt-4 mt-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] mb-3">
                    <ImageIcon className="size-3.5 text-[var(--brand-primary)]" />
                    <span>Reference Photos ({batch.imageUrls.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {batch.imageUrls.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedPhotoUrl(url)}
                        className="group relative overflow-hidden rounded-xl border-2 border-white shadow-sm bg-black/5 transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer text-left"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Reference ${idx + 1}`}
                          className="h-24 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="size-3.5" />
                          <span>View</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            {/* Right Panel: Chain of Custody & Assurance */}
            <Panel className="flex flex-col justify-between space-y-6 p-6">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#8CC63F]/10 text-[#8CC63F]">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--ink)] tracking-tight">Origin & Assurance</h3>
                      <p className="text-xs text-[var(--ink-muted)]">Facility location, provenance & review audit</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Custody & Location */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      Ownership & Facility
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2.5">
                        <Building2 className="size-4 text-[var(--brand-primary)] mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Batch Owner</div>
                          <div className="text-sm font-bold text-[var(--ink)]">{detail.ownerName}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="size-4 text-[#FF5C00] mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Source Facility</div>
                          <div className="text-sm font-bold text-[var(--ink)]">
                            {detail.facility?.name ?? "Not recorded"}
                          </div>
                          {batch.locationText && (
                            <div className="text-xs text-[var(--ink-muted)] mt-0.5">{batch.locationText}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* External Integration & Provenance Source */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      Integrations & Provenance
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] text-[var(--ink-muted)] font-medium mb-1">External Record</div>
                        {batch.externalSystemName ? (
                          batch.externalRecordUrl ? (
                            <a
                              href={batch.externalRecordUrl}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-primary)] hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>{batch.externalSystemName} · {batch.externalRecordId}</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-[var(--ink)]">
                              {batch.externalSystemName} · {batch.externalRecordId}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-[var(--ink-muted)]">-</span>
                        )}
                      </div>

                      {detail.importJob && (
                        <div>
                          <div className="text-[11px] text-[var(--ink-muted)] font-medium mb-1">Import Source</div>
                          <div className="text-xs font-bold text-[var(--ink)]">
                            {detail.importJob.fileName ?? detail.importJob.source}
                          </div>
                          <div className="text-[10px] text-[var(--ink-muted)]">
                            {formatDate(detail.importJob.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Availability Window & CIRKA Audit */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      Lifecycle Window & Review Log
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)] font-medium mb-1">
                          <Calendar className="size-3 text-[var(--brand-primary)]" />
                          <span>Availability Window</span>
                        </div>
                        <div className="text-xs font-semibold text-[var(--ink)]">
                          {formatDate(batch.availableFrom)} → {formatDate(batch.availableUntil)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-[var(--ink-muted)] font-medium mb-1">CIRKA Review</div>
                        {batch.reviewedAt ? (
                          <div>
                            <div className="text-xs font-bold text-[#8CC63F] flex items-center gap-1">
                              <CheckCircle2 className="size-3.5" />
                              <span>Reviewed {formatDate(batch.reviewedAt)}</span>
                            </div>
                            <div className="text-[10px] text-[var(--ink-muted)]">
                              By {actorName(batch.reviewedByUserId)}
                            </div>
                            {batch.reviewNotes && (
                              <div className="mt-1 text-xs text-[var(--ink-muted)] italic">
                                &quot;{batch.reviewNotes}&quot;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-[var(--ink-muted)] italic">
                            Not reviewed by CIRKA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Reference Photo Lightbox Modal */}
          {selectedPhotoUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setSelectedPhotoUrl(null)}
            >
              <div
                className="relative max-w-3xl overflow-hidden rounded-2xl border-4 border-white bg-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPhotoUrl(null)}
                  className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                >
                  <X className="size-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhotoUrl}
                  alt="Reference preview"
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVITY & LEDGER */}
      {activeTab === "activity" && (
        <div className="space-y-6 animate-stagger-in">
          {/* 1. Unified Event & Movement Ledger Panel */}
          <Panel className="overflow-hidden">
            <div
              className={`flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]/30 cursor-pointer select-none hover:bg-[var(--surface)] transition-colors`}
              onClick={() => setIsLedgerExpanded((prev) => !prev)}
            >
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Event & Movement Ledger
                </h2>
              </div>

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
                    Journey Timeline
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
                    Quantity Movements ({detail.movements.length})
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
                    Connected Operations & Systems
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
                    Evidence & Verification ({detail.evidence.length})
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

            {/* Only CIRKA places a batch. The custodian then accepts before the
                manufacturer dispatches: nothing moves on one party's say-so. */}
            {isAdmin && (
              <Panel className="space-y-4 p-6">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Send to a custodian
                </h2>
                {batch.reviewedAt ? (
                  <p className="text-sm text-[var(--ink-muted)]">
                    {formatQuantity(batch.pots.available, batch.unit)} unallocated. The custodian
                    accepts before {detail.ownerName} can dispatch.
                  </p>
                ) : (
                  <NoticeBanner tone="warning" title="Review this batch first">
                    A batch is placed with a custodian only after CIRKA has reviewed it and set an
                    assurance level.
                  </NoticeBanner>
                )}
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
