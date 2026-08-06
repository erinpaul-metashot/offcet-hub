"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, Field, Panel, Select } from "@/components/ui";
import { REQUEST_STATUSES, statusLabel } from "../../_mock/domain";
import { getRequestsOverview, listRequests } from "../../_mock/selectors-admin";
import { categoryLabel, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading, formatDate } from "../../_components/cirka-ui";

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

  const activeFilterLabel =
    status === "awaiting_match"
      ? "awaiting match"
      : status === "matched_group"
        ? "matched"
        : status === "has_matches"
          ? "with matches recorded"
          : status
            ? statusLabel(status).toLowerCase()
            : "";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Demand"
        title="Requests and matching"
        action={
          <div className="flex flex-col gap-1.5">
            <Field label="Filter requests">
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-60"
              >
                <option value="">All requests ({allRows.length})</option>
                <option value="awaiting_match">Awaiting match ({overview.awaitingMatch})</option>
                <option value="matched_group">Matched requests ({overview.matched})</option>
                <option value="has_matches">Has matches ({allRows.filter((r) => r.matches.length > 0).length})</option>
                <optgroup label="By status">
                  {REQUEST_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {statusLabel(value)} ({statusCounts.get(value) ?? 0})
                    </option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-3 pl-0.5">
              <span className="text-xs text-[var(--ink-muted)]">
                {status ? `${rows.length} of ${allRows.length} requests` : `${allRows.length} requests`}
              </span>
              {status && (
                <Button variant="ghost" size="sm" className="min-h-0! px-2! py-1!" onClick={() => setStatus("")}>
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        }
      />

      <dl className="grid grid-cols-2 gap-2 border-y border-[var(--line)] py-2 sm:grid-cols-4">
        <OverviewStat
          label="Total requests"
          value={overview.totalRequests}
          active={status === ""}
          onClick={() => setStatus("")}
        />
        <OverviewStat
          label="Awaiting match"
          value={overview.awaitingMatch}
          tone={overview.awaitingMatch > 0 ? "warn" : undefined}
          active={status === "awaiting_match"}
          onClick={() => setStatus(status === "awaiting_match" ? "" : "awaiting_match")}
        />
        <OverviewStat
          label="Matched requests"
          value={overview.matched}
          tone={overview.matched > 0 ? "positive" : undefined}
          active={status === "matched_group"}
          onClick={() => setStatus(status === "matched_group" ? "" : "matched_group")}
        />
        <OverviewStat
          label="Matches recorded"
          value={overview.totalMatches}
          active={status === "has_matches"}
          onClick={() => setStatus(status === "has_matches" ? "" : "has_matches")}
        />
      </dl>

      {rows.length === 0 ? (
        status ? (
          <EmptyState
            title="No matches for this filter"
            body={`No request is currently ${activeFilterLabel}. Clear the filter to see every request.`}
          />
        ) : (
          <EmptyState title="No requests" body="Demand submitted by brands and makers appears here." />
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
                  {formatQuantity(request.quantityNeeded, request.unit)}{" "}
                  {categoryLabel(request.materialCategory)}
                  {project ? ` · ${project.title}` : ""}
                  {request.neededBy ? ` · needed by ${formatDate(request.neededBy)}` : ""}
                  {matches.length > 0
                    ? ` · ${matches.length} match${matches.length === 1 ? "" : "es"} recorded`
                    : " · no match yet"}
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


