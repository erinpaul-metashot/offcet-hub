"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, EmptyState, Field, Input } from "@/components/ui";
import { getPendingApprovalDetail } from "../../../_mock/selectors-brand";
import { categoryLabel, formatQuantity, orgName } from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { useAction } from "../../../_components/use-action";
import {
  CirkaBadge,
  DataRow,
  FlowBar,
  NoticeBanner,
  ProvenanceChip,
  SectionHeading,
  formatDate,
} from "../../../_components/cirka-ui";

export default function BrandApprovalDetailPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const { run, error, pending } = useAction();
  const [note, setNote] = useState("");

  const detail = getPendingApprovalDetail(store.db, scope, params.matchId);

  if (!detail) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          title="Match not found"
          body="This match may have been withdrawn, or the demo data has been reset."
        />
      </div>
    );
  }

  const { match, request, batch, project } = detail;
  const isPending = match.status === "proposed";

  const handleDecision = async (approve: boolean) => {
    const succeeded = await run(() =>
      store.decideMatch("brand", {
        matchId: match._id,
        approve,
        note: note || undefined,
        custodianOrgId: match.suggestedCustodianOrgId,
      }),
    );

    if (succeeded) {
      router.push("/demo/brand/approvals");
    }
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <SectionHeading
        eyebrow={project ? `${project.title} · ${request?.reference}` : request?.reference}
        title={batch?.name ?? "Unknown batch"}
        action={<CirkaBadge status={match.status} />}
      />

      {error && (
        <NoticeBanner tone="blocking" title="That step was refused">
          {error}
        </NoticeBanner>
      )}

      <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Quantity
        </p>
        <FlowBar
          segments={[
            {
              key: "proposed",
              label: "Proposed",
              value: match.quantityProposed,
              colourClass: "bg-[var(--brand-primary)]",
            },
          ]}
          max={request?.quantityNeeded ?? match.quantityProposed}
          unit={match.unit}
        />
        <p className="text-sm text-[var(--ink-muted)]">
          {formatQuantity(match.quantityProposed, match.unit)} proposed
          {request &&
            (match.quantityProposed >= request.quantityNeeded
              ? " — covers the full request"
              : ` of ${formatQuantity(request.quantityNeeded, request.unit)} needed`)}
        </p>
      </div>

      <NoticeBanner tone="info" title="Why CIRKA suggested this match">
        {match.rationale}
      </NoticeBanner>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            The resource
          </p>
          <dl>
            <DataRow
              label="Category"
              value={batch ? categoryLabel(batch.materialCategory) : "—"}
            />
            <DataRow label="Composition" value={batch?.composition ?? "Not recorded"} />
            <DataRow label="Source" value={batch ? orgName(store.db, batch.ownerOrgId) : "—"} />
            <DataRow label="Location" value={batch?.locationText ?? "Not recorded"} />
            {batch && (
              <DataRow
                label="Provenance"
                value={
                  <ProvenanceChip
                    dataSource={batch.dataSource}
                    assuranceLevel={batch.assuranceLevel}
                  />
                }
              />
            )}
          </dl>
        </div>

        <div className="space-y-1 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            The proposed route
          </p>
          <dl>
            <DataRow
              label="Custodian"
              value={
                match.suggestedCustodianOrgId
                  ? orgName(store.db, match.suggestedCustodianOrgId)
                  : "Not yet chosen"
              }
            />
            <DataRow
              label="Maker"
              value={
                match.suggestedMakerOrgId
                  ? orgName(store.db, match.suggestedMakerOrgId)
                  : "Not yet chosen"
              }
            />
            <DataRow
              label="Distance"
              value={match.distanceKm !== undefined ? `${match.distanceKm} km` : "—"}
            />
            <DataRow label="Proposed" value={formatDate(match.proposedAt)} />
          </dl>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Your decision
          </p>
          <Field label="Note (optional)" hint="Recorded alongside the decision.">
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Good fit for the winter accessories line"
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button disabled={pending} onClick={() => handleDecision(true)}>
              Approve
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => handleDecision(false)}>
              Reject
            </Button>
          </div>
        </div>
      ) : (
        <NoticeBanner tone="info" title="This match has already been decided">
          {match.status === "approved" ? "Approved" : "Rejected"}
          {match.decidedAt ? ` on ${formatDate(match.decidedAt)}` : ""}
          {match.decisionNote ? ` — ${match.decisionNote}` : ""}
        </NoticeBanner>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/demo/brand/approvals"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-muted)] transition-colors duration-150 ease-[var(--ease-out)] hover:text-[var(--ink)]"
    >
      <ArrowLeft size={16} />
      Back to approvals
    </Link>
  );
}
