"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, EmptyState, Field, Input } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { getPendingApprovalDetail } from "../../../_mock/selectors-brand";
import { orgName } from "../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import { useAction } from "../../../_components/use-action";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";
import {
  CirkaBadge,
  DataRow,
  FlowBar,
  NoticeBanner,
  ProvenanceChip,
  SectionHeading,
} from "../../../_components/cirka-ui";

export default function BrandApprovalDetailPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const { run, error, pending } = useAction();
  const [note, setNote] = useState("");
  const { approvals: t } = useMessages(demoBrand);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();

  const detail = getPendingApprovalDetail(store.db, scope, params.matchId);

  if (!detail) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState title={t.notFound} />
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
        title={batch?.name ?? ui.unknownBatch}
        action={<CirkaBadge status={match.status} />}
      />

      {error && (
        <NoticeBanner tone="blocking" title={ui.stepRefused}>
          {error}
        </NoticeBanner>
      )}

      <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {t.quantity}
        </p>
        <FlowBar
          segments={[
            {
              key: "proposed",
              label: t.proposed,
              value: match.quantityProposed,
              colourClass: "bg-[var(--brand-primary)]",
            },
          ]}
          max={request?.quantityNeeded ?? match.quantityProposed}
          unit={match.unit}
        />
        <p className="text-sm text-[var(--ink-muted)]">
          {format(t.proposedQuantity, { quantity: fmt.quantity(match.quantityProposed, match.unit) })}
          {request &&
            (match.quantityProposed >= request.quantityNeeded
              ? t.fullRequest
              : format(t.ofNeededFull, { quantity: fmt.quantity(request.quantityNeeded, request.unit) }))}
        </p>
      </div>

      <NoticeBanner tone="info" title={t.rationale}>
        {match.rationale}
      </NoticeBanner>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.resource}
          </p>
          <dl>
            <DataRow
              label={t.category}
              value={batch ? labels.MATERIAL_CATEGORY_LABELS[batch.materialCategory] ?? batch.materialCategory : "-"}
            />
            <DataRow label={t.composition} value={batch?.composition ?? ui.notRecorded} />
            <DataRow label={t.source} value={batch ? orgName(store.db, batch.ownerOrgId) : "-"} />
            <DataRow label={t.location} value={batch?.locationText ?? ui.notRecorded} />
            {batch && (
              <DataRow
                label={t.provenance}
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
            {t.route}
          </p>
          <dl>
            <DataRow
              label={t.custodian}
              value={
                match.suggestedCustodianOrgId
                  ? orgName(store.db, match.suggestedCustodianOrgId)
                  : t.notChosen
              }
            />
            <DataRow
              label={t.maker}
              value={
                match.suggestedMakerOrgId
                  ? orgName(store.db, match.suggestedMakerOrgId)
                  : t.notChosen
              }
            />
            <DataRow
              label={t.distance}
              value={match.distanceKm !== undefined ? `${match.distanceKm} km` : "-"}
            />
            <DataRow label={t.proposed} value={fmt.date(match.proposedAt)} />
          </dl>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-5">
          <Field label={t.note}>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.notePlaceholder}
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button disabled={pending} onClick={() => handleDecision(true)}>
              {t.approve}
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => handleDecision(false)}>
              {t.reject}
            </Button>
          </div>
        </div>
      ) : (
        <NoticeBanner
          tone="info"
          title={format(match.status === "approved" ? t.approvedOn : t.rejectedOn, {
            date: match.decidedAt ? fmt.date(match.decidedAt) : "",
          }).trim()}
        >
          {match.decisionNote}
        </NoticeBanner>
      )}
    </div>
  );
}

function BackLink() {
  const { approvals: t } = useMessages(demoBrand);

  return (
    <Link
      href="/demo/brand/approvals"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-muted)] transition-colors duration-150 ease-[var(--ease-out)] hover:text-[var(--ink)]"
    >
      <ArrowLeft size={16} />
      {t.back}
    </Link>
  );
}
