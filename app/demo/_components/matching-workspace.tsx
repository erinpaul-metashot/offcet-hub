"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button, Field, Input, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { MatchingWorkspace } from "../_mock/selectors-admin";
import { useDemoStore } from "../_mock/store";
import {
  CirkaBadge,
  DataRow,
  NoticeBanner,
  ProvenanceChip,
  QuantityPotsBar,
} from "./cirka-ui";
import { ProposeDrawer, type ProposeDrawerValues } from "./propose-drawer";
import { useAction } from "./use-action";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

type WorkspaceTab = "shortlist" | "decisions";

const EMPTY_PROPOSAL: ProposeDrawerValues = {
  quantity: "",
  rationale: "",
  custodianOrgId: "",
  makerOrgId: "",
  categoryFitNote: "",
};

export function MatchingWorkspaceView({ workspace }: { workspace: MatchingWorkspace }) {
  const store = useDemoStore();
  const { request, candidates, matches } = workspace;
  const { matching: t } = useMessages(demoAdmin);
  const { ui } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();
  const category = (value: typeof request.materialCategory) => labels.MATERIAL_CATEGORY_LABELS[value];

  const briefAction = useAction();
  const proposeAction = useAction();
  const decisionAction = useAction();

  const [briefExpanded, setBriefExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("shortlist");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposeDrawerValues>(EMPTY_PROPOSAL);
  const [availabilityFitNote, setAvailabilityFitNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [unfulfillableNote, setUnfulfillableNote] = useState("");

  const selected = candidates.find((candidate) => candidate.row.batch._id === selectedBatchId);

  function openProposal(candidate: (typeof candidates)[number]) {
    const { batch } = candidate.row;
    setSelectedBatchId(batch._id);
    proposeAction.clearError();
    setProposal({
      quantity: String(Math.min(request.quantityNeeded, batch.pots.available)),
      rationale: "",
      custodianOrgId: "",
      makerOrgId: "",
      categoryFitNote: candidate.categoryFit
        ? format(t.exactCategory, { category: category(batch.materialCategory) })
        : format(t.differentCategory, {
            category: category(batch.materialCategory),
            requested: category(request.materialCategory),
          }),
    });
    setAvailabilityFitNote(
      format(t.uncommitted, { quantity: fmt.quantity(batch.pots.available, batch.unit) }),
    );
  }

  function closeProposal() {
    setSelectedBatchId(null);
    setProposal(EMPTY_PROPOSAL);
    proposeAction.clearError();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href="/demo/admin/requests" variant="ghost" size="sm">
          {t.allRequests}
        </Button>
        <CirkaBadge status={request.status} />
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
              {request.reference}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {request.title}
            </h1>
            <p className="text-[13px] text-[var(--ink-muted)]">
              {format(t.needs, {
                requester: workspace.requesterName,
                quantity: fmt.quantity(request.quantityNeeded, request.unit),
                category: category(request.materialCategory),
              })}
              {request.neededBy ? format(t.by, { date: fmt.date(request.neededBy) }) : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {fmt.quantity(request.quantityMatched, request.unit)} /{" "}
                {fmt.quantity(request.quantityNeeded, request.unit)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t.matched}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBriefExpanded((current) => !current)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              aria-expanded={briefExpanded}
            >
              {briefExpanded ? t.hideBrief : t.viewBrief}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ease-[var(--ease-out)] ${briefExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {briefExpanded && (
          <div className="mt-5 space-y-5 border-t border-[var(--line)] pt-5">
            <dl>
              <DataRow label={t.requestedBy} value={workspace.requesterName} />
              {workspace.project && (
                <DataRow
                  label={t.project}
                  value={workspace.project.title}
                  hint={workspace.project.reference}
                />
              )}
              <DataRow label={t.material} value={request.materialDescription ?? "-"} />
              <DataRow label={t.composition} value={request.compositionRequirements ?? "-"} />
              <DataRow label={t.quality} value={request.qualityRequirements ?? "-"} />
              <DataRow label={t.intendedProduct} value={request.intendedProduct ?? "-"} />
              <DataRow
                label={t.locationPreference}
                value={request.productionLocationPreference ?? "-"}
                hint={request.maxDistanceKm ? format(t.within, { distance: fmt.number(request.maxDistanceKm) }) : undefined}
              />
              <DataRow label={t.neededBy} value={fmt.date(request.neededBy)} />
            </dl>

            {["submitted", "under_review"].includes(request.status) && (
              <div className="space-y-3 border-t border-[var(--line)] pt-5">
                {briefAction.error && (
                  <NoticeBanner tone="blocking" title={ui.stepRefused}>
                    {briefAction.error}
                  </NoticeBanner>
                )}
                <Field label={t.unfulfillableReason}>
                  <Input
                    value={unfulfillableNote}
                    onChange={(event) => setUnfulfillableNote(event.target.value)}
                    placeholder={t.unfulfillablePlaceholder}
                  />
                </Field>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={briefAction.pending}
                  onClick={() =>
                    briefAction.run(() =>
                      store.markRequestUnfulfillable("admin", {
                        requestId: request._id,
                        note: unfulfillableNote,
                      }),
                    )
                  }
                >
                  {t.markUnfulfillable}
                </Button>
              </div>
            )}
          </div>
        )}
      </Panel>

      <div className="flex items-center gap-1 border-b border-[var(--line)] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("shortlist")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
            activeTab === "shortlist"
              ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          {format(t.shortlist, { count: candidates.length })}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("decisions")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors relative ${
            activeTab === "decisions"
              ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          {format(t.decisions, { count: matches.length })}
        </button>
      </div>

      {activeTab === "shortlist" && (
        <Panel className="overflow-hidden animate-stagger-in">
          <div className="divide-y divide-[var(--line)]">
            {candidates.slice(0, 6).map((candidate) => {
              const { batch } = candidate.row;
              const isSelected = selectedBatchId === batch._id;

              return (
                <button
                  key={batch._id}
                  type="button"
                  onClick={() => openProposal(candidate)}
                  className={`w-full space-y-3 px-6 py-5 text-left transition-colors ${
                    isSelected ? "bg-[var(--brand-primary-muted)]" : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--ink)]">{batch.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {batch.reference} · {candidate.row.ownerName}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-[var(--ink)]">
                      {fmt.quantity(batch.pots.available, batch.unit)}
                    </p>
                  </div>

                  <QuantityPotsBar
                    slices={candidate.row.slices}
                    total={batch.quantityOriginal}
                    unit={batch.unit}
                    compact
                  />

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                    {candidate.requested && (
                      <span className="rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary-muted)] px-2.5 py-1 text-[var(--brand-primary)]">
                        {t.askedForLot}
                      </span>
                    )}
                    {!candidate.categoryFit && (
                      <span className="rounded-full border border-dashed border-[var(--line-strong)] px-2.5 py-1 text-[var(--ink-muted)]">
                        {t.categoryDiffers}
                      </span>
                    )}
                    {!candidate.quantityFit && (
                      <span className="rounded-full border border-dashed border-[var(--line-strong)] px-2.5 py-1 text-[var(--ink-muted)]">
                        {t.partial}
                      </span>
                    )}
                    {candidate.distanceKm !== undefined && (
                      <span className="tabular-nums text-[var(--ink-muted)]">{candidate.distanceKm} km</span>
                    )}
                    <ProvenanceChip
                      dataSource={batch.dataSource}
                      assuranceLevel={batch.assuranceLevel}
                    />
                  </div>
                </button>
              );
            })}
            {candidates.length === 0 && (
              <p className="px-6 py-8 text-sm text-[var(--ink-muted)]">
                {t.noCandidates}
              </p>
            )}
          </div>
        </Panel>
      )}

      {activeTab === "decisions" && (
        <Panel className="overflow-hidden animate-stagger-in">

          {decisionAction.error && (
            <div className="px-6 pt-5">
              <NoticeBanner tone="blocking" title={ui.stepRefused}>
                {decisionAction.error}
              </NoticeBanner>
            </div>
          )}

          {matches.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[var(--ink-muted)]">
              {t.noMatches}
            </p>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {matches.map(({ match, batch, custodianName, makerName }) => (
                <div key={match._id} className="space-y-3 px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--ink)]">
                        {fmt.quantity(match.quantityProposed, match.unit)} · {batch?.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {batch?.reference}
                        {custodianName ? format(t.custodian, { name: custodianName }) : ""}
                        {makerName ? format(t.maker, { name: makerName }) : ""}
                      </p>
                    </div>
                    <CirkaBadge status={match.status} />
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                    {match.rationale}
                  </p>

                  {(match.categoryFitNote || match.availabilityFitNote || match.distanceKm) && (
                    <p className="text-xs text-[var(--ink-muted)]">
                      {[
                        match.categoryFitNote,
                        match.availabilityFitNote,
                        match.distanceKm ? `${match.distanceKm} km` : undefined,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  {match.status === "proposed" && (
                    <div className="space-y-3 rounded-2xl bg-[var(--surface)] p-4">
                      <Field label={t.decisionNote}>
                        <Input
                          value={decisionNote}
                          onChange={(event) => setDecisionNote(event.target.value)}
                        />
                      </Field>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          size="sm"
                          disabled={decisionAction.pending}
                          onClick={() =>
                            decisionAction.run(() =>
                              store.decideMatch("admin", {
                                matchId: match._id,
                                approve: true,
                                note: decisionNote,
                                custodianOrgId: match.suggestedCustodianOrgId,
                              }),
                            )
                          }
                        >
                          {t.approve}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={decisionAction.pending}
                          onClick={() =>
                            decisionAction.run(() =>
                              store.decideMatch("admin", {
                                matchId: match._id,
                                approve: false,
                                note: decisionNote,
                              }),
                            )
                          }
                        >
                          {t.reject}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={decisionAction.pending}
                          onClick={() =>
                            decisionAction.run(() =>
                              store.withdrawMatch("admin", {
                                matchId: match._id,
                                note: decisionNote,
                              }),
                            )
                          }
                        >
                          {t.withdraw}
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {format(t.proposed, { date: fmt.date(match.proposedAt) })}
                    {match.decidedAt ? format(t.decided, { date: fmt.date(match.decidedAt) }) : ""}
                    {match.decisionNote ? ` · ${match.decisionNote}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {selected && (
        <ProposeDrawer
          batchName={selected.row.batch.name}
          batchUnit={selected.row.batch.unit}
          custodians={workspace.custodians}
          makers={workspace.makers}
          values={proposal}
          onChange={setProposal}
          error={proposeAction.error}
          pending={proposeAction.pending}
          onClose={closeProposal}
          onSubmit={() =>
            proposeAction.run(async () => {
              await store.proposeMatch("admin", {
                requestId: request._id,
                batchId: selected.row.batch._id,
                quantityProposed: Number(proposal.quantity),
                rationale: proposal.rationale,
                suggestedCustodianOrgId: proposal.custodianOrgId || undefined,
                suggestedMakerOrgId: proposal.makerOrgId || undefined,
                categoryFitNote: proposal.categoryFitNote,
                availabilityFitNote,
                distanceKm: selected.distanceKm,
              });
              closeProposal();
            })
          }
        />
      )}
    </div>
  );
}
