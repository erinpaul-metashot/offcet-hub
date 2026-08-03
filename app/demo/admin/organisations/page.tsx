"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Building2,
  Package,
  Pencil,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button, Panel, Input } from "@/components/ui";
import { ORGANISATION_TYPE_LABELS } from "../../_mock/domain";
import type { OrganisationInput } from "../../_mock/operations/admin";
import { listOrganisations } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import type { Organisation } from "../../_mock/types";
import {
  CirkaBadge,
  ConfirmDialog,
  Modal,
  NoticeBanner,
  SectionHeading,
  ViewModeToggle,
  formatDate,
} from "../../_components/cirka-ui";
import { OrganisationForm } from "../../_components/organisation-form";
import { useAction } from "../../_components/use-action";

/** First letter of the first two words, so "Atelier Rask" reads as "AR". */
function orgInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function MetricCell({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-[var(--paper)] p-3">
      <Icon size={14} className="text-[var(--ink-muted)]" />
      <span className="text-lg font-bold tabular-nums text-[var(--ink)]">{value}</span>
      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </span>
    </div>
  );
}

/**
 * The two-tier action cluster: View plus the one state-changing action
 * (Approve/Suspend, tone-filled) read as a single primary cluster; Edit and
 * Delete demote to bare icons behind a hairline. Shared by the grid card and
 * the list row so the two view modes can't drift apart.
 */
function OrganisationActions({
  organisation,
  pending,
  onApprove,
  onSuspend,
  onEdit,
  onRemove,
}: {
  organisation: Organisation;
  pending: boolean;
  onApprove: () => void;
  onSuspend: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const showApprove = organisation.type !== "cirka" && organisation.status !== "approved";
  const showSuspend = organisation.type !== "cirka" && organisation.status === "approved";
  const showDelete = organisation.type !== "cirka";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Button as={Link} href={`/demo/admin/organisations/${organisation._id}`} size="sm">
          View
        </Button>
        {/* Fixed-width slot: reserved whether Approve, Suspend, or nothing renders, so
            the rail's total width — and therefore the View button's position — never
            shifts between rows. */}
        <div className="flex w-26 shrink-0">
          {showApprove && (
            <button
              type="button"
              disabled={pending}
              onClick={onApprove}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted)] px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--brand-secondary)] transition-[transform,opacity] duration-[160ms] ease-[var(--ease-out)] hover:opacity-80 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {showSuspend && (
            <button
              type="button"
              disabled={pending}
              onClick={onSuspend}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#B4531A] bg-[#FBE9DC] px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[#8A3D11] transition-[transform,opacity] duration-[160ms] ease-[var(--ease-out)] hover:opacity-80 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-l border-[var(--line-strong)] pl-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={pending}
          aria-label="Edit organisation"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)] active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={15} />
        </button>
        {/* Reserved even when hidden (cirka orgs have no delete action) so the divider
            and everything left of it lands at the same X on every row. */}
        <div className="h-9 w-9 shrink-0">
          {showDelete && (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              aria-label="Delete organisation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:border-[#E4A9A9] hover:bg-[#FBE2E2] hover:text-[#B93A3A] active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrganisationsPage() {
  const store = useDemoStore();
  /* Row actions and the form fail independently, so each reports its own error. */
  const { run, error, pending } = useAction();
  const form = useAction();
  const removal = useAction();
  const allRows = listOrganisations(store.db);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const rows = allRows.filter(({ organisation }) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      organisation.name.toLowerCase().includes(query) ||
      (organisation.city && organisation.city.toLowerCase().includes(query)) ||
      organisation.country.toLowerCase().includes(query) ||
      (organisation.registrationNumber ?? "").toLowerCase().includes(query) ||
      organisation.capabilityTags.some((tag) => tag.includes(query)) ||
      ORGANISATION_TYPE_LABELS[organisation.type].toLowerCase().includes(query) ||
      (organisation.description && organisation.description.toLowerCase().includes(query))
    );
  });

  /** `null` = closed. An entry with no `organisation` is a new registration. */
  const [editing, setEditing] = useState<{ organisation?: Organisation } | null>(null);
  const [removing, setRemoving] = useState<Organisation | null>(null);

  /** Clearing on close stops a refusal from reappearing over the next form. */
  const closeForm = () => {
    form.clearError();
    setEditing(null);
  };

  const closeRemoval = () => {
    removal.clearError();
    setRemoving(null);
  };

  const handleSubmit = async (input: OrganisationInput) => {
    const target = editing?.organisation;

    const ok = await form.run(() =>
      target
        ? store.updateOrganisation("admin", { orgId: target._id, patch: input })
        : store.createOrganisation("admin", input),
    );

    if (ok) {
      setEditing(null);
    }
  };

  const handleRemove = async (organisation: Organisation) => {
    const ok = await removal.run(() =>
      store.deleteOrganisation("admin", { orgId: organisation._id }),
    );

    if (ok) {
      setRemoving(null);
    }
  };

  const renderActions = (organisation: Organisation) => (
    <OrganisationActions
      organisation={organisation}
      pending={pending}
      onApprove={() =>
        run(() =>
          store.reviewOrganisation("admin", {
            orgId: organisation._id,
            status: "approved",
            note: "Verified as part of the CIRKA network.",
          }),
        )
      }
      onSuspend={() =>
        run(() =>
          store.reviewOrganisation("admin", {
            orgId: organisation._id,
            status: "suspended",
            note: "Suspended pending re-verification.",
          }),
        )
      }
      onEdit={() => setEditing({ organisation })}
      onRemove={() => setRemoving(organisation)}
    />
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Organisations"
        title="Who is in the network"
        description="Organisation, not user, is the unit of ownership and access. Every operational record belongs to one, and permission questions are asked of it."
      />

      {error && <NoticeBanner tone="blocking" title="That change was refused">{error}</NoticeBanner>}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-4 flex-1">
          <Button onClick={() => setEditing({})}>Add Organisation</Button>
          <div className="relative max-w-sm w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input
              placeholder="Search organisations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map(({ organisation, userCount, facilityCount, batchCount, allocationCount }) => (
            <Panel key={organisation._id} className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] text-base font-extrabold tracking-[-0.02em] text-[var(--ink)]">
                  {orgInitials(organisation.name)}
                </div>
                <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                      {organisation.name}
                    </h2>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {ORGANISATION_TYPE_LABELS[organisation.type]} · {organisation.city ?? ""}{" "}
                      {organisation.country}
                    </p>
                  </div>
                  <CirkaBadge status={organisation.status} />
                </div>
              </div>

              {organisation.description && (
                <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                  {organisation.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
                <MetricCell icon={Users} value={userCount} label="People" />
                <MetricCell icon={Building2} value={facilityCount} label="Facilities" />
                <MetricCell icon={Package} value={batchCount} label="Batches" />
                <MetricCell icon={ArrowLeftRight} value={allocationCount} label="Allocations" />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Capabilities
                </p>
                {organisation.capabilityTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {organisation.capabilityTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--ink-muted)]">None recorded</p>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
                <span>
                  Co. no.{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {organisation.registrationNumber ?? "Not recorded"}
                  </span>
                </span>
                <span>
                  Registered{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {formatDate(organisation.createdAt)}
                  </span>
                </span>
              </div>

              <div className="flex justify-end border-t border-[var(--line)] pt-4">
                {renderActions(organisation)}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="divide-y divide-[var(--line)] overflow-hidden p-0">
          {rows.map(({ organisation, userCount, facilityCount, batchCount, allocationCount }) => (
            <div
              key={organisation._id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] text-[13px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
                  {orgInitials(organisation.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                      {organisation.name}
                    </h3>
                    <CirkaBadge status={organisation.status} />
                  </div>
                  <p className="truncate text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {ORGANISATION_TYPE_LABELS[organisation.type]} · {organisation.city ?? ""}{" "}
                    {organisation.country}
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-4 text-xs text-[var(--ink-muted)] xl:flex">
                <span className="flex items-center gap-1.5" title="People">
                  <Users size={13} />
                  {userCount}
                </span>
                <span className="flex items-center gap-1.5" title="Facilities">
                  <Building2 size={13} />
                  {facilityCount}
                </span>
                <span className="flex items-center gap-1.5" title="Batches">
                  <Package size={13} />
                  {batchCount}
                </span>
                <span className="flex items-center gap-1.5" title="Allocations">
                  <ArrowLeftRight size={13} />
                  {allocationCount}
                </span>
              </div>

              {renderActions(organisation)}
            </div>
          ))}
        </Panel>
      )}

      {editing && (
        <Modal
          eyebrow={editing.organisation ? "Edit organisation" : "New organisation"}
          title={editing.organisation?.name ?? "Register a company in the network"}
          description={
            editing.organisation ? undefined : (
              <>
                It joins as <span className="text-[var(--ink)]">pending</span> and needs approving
                before it can trade.
              </>
            )
          }
          onClose={closeForm}
        >
          <OrganisationForm
            key={editing.organisation?._id ?? "new"}
            organisation={editing.organisation}
            error={form.error}
            pending={form.pending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {removing && (
        <ConfirmDialog
          eyebrow="Remove organisation"
          title={`Remove ${removing.name}?`}
          confirmLabel="Remove it"
          error={removal.error}
          pending={removal.pending}
          onCancel={closeRemoval}
          onConfirm={() => handleRemove(removing)}
          body={
            <>
              It stops appearing anywhere in the network, along with its people and sites. Its
              batches, allocations and audit history stay intact — nothing already recorded
              changes.
            </>
          }
        />
      )}
    </div>
  );
}
