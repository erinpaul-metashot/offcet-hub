"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, Panel, Select } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { REQUEST_STATUSES } from "../../_mock/domain";
import { statusLabelIn } from "../../_mock/domain-labels";
import { getRequestsOverview, listRequests } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading } from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";
import { useLabels } from "../../_components/use-labels";

function OverviewStat({
  label,
  value,
  of,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  of?: number;
  tone?: "warn" | "progress" | "positive";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group space-y-2 py-4 px-4 text-left transition-all duration-150 ease-[var(--ease-out)] cursor-pointer rounded-xl border ${
        active
          ? "bg-[var(--surface)] border-[var(--brand-primary)]/40 shadow-xs"
          : "border-transparent hover:bg-[var(--surface)]/60"
      }`}
    >
      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] group-hover:text-[var(--ink)]">
        {label}
      </dt>
      <dd
        className={`text-[38px] font-semibold leading-none tracking-[-0.05em] tabular-nums ${
          tone === "warn" && value > 0
            ? "text-[#D14343]"
            : tone === "positive" && value > 0
              ? "text-[var(--brand-secondary)]"
              : tone === "progress" && value > 0
                ? "text-[var(--brand-primary)]"
                : "text-[var(--ink)]"
        }`}
      >
        {value}
        {of !== undefined && (
          <span className="text-lg font-medium text-[var(--ink-muted)]"> / {of}</span>
        )}
      </dd>
    </button>
  );
}

export default function AdminRequestsPage() {
  const { db } = useDemoStore();
  const [status, setStatus] = useState("");
  const { requests: t } = useMessages(demoAdmin);
  const labels = useLabels();
  const fmt = useFormat();

  const allRows = listRequests(db);
  const overview = getRequestsOverview(db);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of allRows) {
      counts.set(row.request.status, (counts.get(row.request.status) ?? 0) + 1);
    }
    return counts;
  }, [allRows]);

  const rows = useMemo(() => {
    if (!status) return allRows;
    if (status === "awaiting_match") {
      return allRows.filter((row) => ["submitted", "under_review"].includes(row.request.status));
    }
    if (status === "matched_group") {
      return allRows.filter((row) =>
        ["matched", "partially_matched", "in_delivery", "fulfilled"].includes(row.request.status),
      );
    }
    if (status === "has_matches") {
      return allRows.filter((row) => row.matches.length > 0);
    }
    return allRows.filter((row) => row.request.status === status);
  }, [allRows, status]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t.title}
        action={
          <div className="flex items-center gap-2">
            <Select
                aria-label={t.filterLabel}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-60"
              >
                <option value="">{format(t.allRequests, { count: allRows.length })}</option>
                <option value="awaiting_match">{format(t.awaitingMatchOption, { count: overview.awaitingMatch })}</option>
                <option value="matched_group">{format(t.matchedOption, { count: overview.matched })}</option>
                <option value="has_matches">
                  {format(t.hasMatchesOption, { count: allRows.filter((r) => r.matches.length > 0).length })}
                </option>
                <optgroup label={t.byStatus}>
                  {REQUEST_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {format(t.statusOption, { label: statusLabelIn(labels, value), count: statusCounts.get(value) ?? 0 })}
                    </option>
                  ))}
                </optgroup>
              </Select>
            {status && (
              <Button variant="ghost" size="sm" onClick={() => setStatus("")}>
                {t.clear}
              </Button>
            )}
          </div>
        }
      />

      <dl className="grid grid-cols-2 gap-2 border-y border-[var(--line)] py-2 sm:grid-cols-4">
        <OverviewStat
          label={t.totalRequests}
          value={overview.totalRequests}
          active={status === ""}
          onClick={() => setStatus("")}
        />
        <OverviewStat
          label={t.awaitingMatch}
          value={overview.awaitingMatch}
          tone={overview.awaitingMatch > 0 ? "warn" : undefined}
          active={status === "awaiting_match"}
          onClick={() => setStatus(status === "awaiting_match" ? "" : "awaiting_match")}
        />
        <OverviewStat
          label={t.matchedRequests}
          value={overview.matched}
          tone={overview.matched > 0 ? "positive" : undefined}
          active={status === "matched_group"}
          onClick={() => setStatus(status === "matched_group" ? "" : "matched_group")}
        />
        <OverviewStat
          label={t.matchesRecorded}
          value={overview.totalMatches}
          active={status === "has_matches"}
          onClick={() => setStatus(status === "has_matches" ? "" : "has_matches")}
        />
      </dl>

      {rows.length === 0 ? (
        status ? (
          <EmptyState
            title={t.noMatches}
          />
        ) : (
          <EmptyState title={t.noRequests} />
        )
      ) : (
        <Panel className="overflow-hidden">
          {rows.map(({ request, requesterName, project, matches }) => (
            <LinkRow
              key={request._id}
              href={`/demo/admin/matching/${request._id}`}
              title={request.title}
              meta={
                <>
                  {request.reference} · {requesterName} ·{" "}
                  {fmt.quantity(request.quantityNeeded, request.unit)}{" "}
                  {labels.MATERIAL_CATEGORY_LABELS[request.materialCategory]}
                  {project ? ` · ${project.title}` : ""}
                  {request.neededBy ? format(t.neededBy, { date: fmt.date(request.neededBy) }) : ""}
                  {matches.length > 0
                    ? format(matches.length === 1 ? t.matchesOne : t.matchesMany, { count: matches.length })
                    : ""}
                </>
              }
              right={<CirkaBadge status={request.status} />}
            />
          ))}
        </Panel>
      )}
    </div>
  );
}


