"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, Field, Panel, Select } from "@/components/ui";
import { REQUEST_STATUSES, statusLabel } from "../../_mock/domain";
import { listRequests } from "../../_mock/selectors-admin";
import { categoryLabel, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading, formatDate } from "../../_components/cirka-ui";

export default function AdminRequestsPage() {
  const { db } = useDemoStore();
  const [status, setStatus] = useState("");

  const allRows = listRequests(db);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of allRows) {
      counts.set(row.request.status, (counts.get(row.request.status) ?? 0) + 1);
    }
    return counts;
  }, [allRows]);

  const rows = status ? allRows.filter((row) => row.request.status === status) : allRows;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Demand"
        title="Requests and matching"
        action={
          <div className="flex flex-col gap-1.5">
            <Field label="Status">
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-56"
              >
                <option value="">All statuses</option>
                {REQUEST_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)} ({statusCounts.get(value) ?? 0})
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-3 pl-0.5">
              <span className="text-xs text-[var(--ink-muted)]">
                {status ? `${rows.length} of ${allRows.length} requests` : `${allRows.length} requests`}
              </span>
              {status && (
                <Button variant="ghost" size="sm" className="min-h-0! px-2! py-1!" onClick={() => setStatus("")}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        }
      />

      {rows.length === 0 ? (
        status ? (
          <EmptyState
            title="No matches for this status"
            body={`Nothing is currently ${statusLabel(status).toLowerCase()}. Clear the filter to see every request.`}
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
