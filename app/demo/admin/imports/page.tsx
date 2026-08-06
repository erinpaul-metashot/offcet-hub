"use client";

import { EmptyState, Panel } from "@/components/ui";
import { listImportJobs } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  DataRow,
  SectionHeading,
  formatDateTime,
} from "../../_components/cirka-ui";

export default function AdminImportsPage() {
  const { db } = useDemoStore();
  const rows = listImportJobs(db);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Imports" title="Bulk and machine-to-machine arrivals" />

      {rows.length === 0 ? (
        <EmptyState title="No imports yet" body="Uploads and API pushes are logged here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map(({ job, orgLabel, uploadedBy, batches }) => (
            <Panel key={job._id} className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--ink)]">
                    {job.fileName ?? job.source.replace(/_/g, " ")}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {orgLabel}
                    {uploadedBy ? ` · ${uploadedBy}` : ""} · {job.source.replace(/_/g, " ")}
                  </p>
                </div>
                <CirkaBadge status={job.status} />
              </div>

              <dl>
                <DataRow label="Rows" value={job.rowCount ?? 0} />
                <DataRow label="Valid" value={job.validCount ?? 0} />
                <DataRow label="Created" value={job.createdCount ?? 0} />
                <DataRow
                  label="Updated"
                  value={job.updatedCount ?? 0}
                />
                <DataRow label="Failed" value={job.failedCount ?? 0} />
                <DataRow label="Started" value={formatDateTime(job.createdAt)} />
                <DataRow label="Completed" value={formatDateTime(job.completedAt)} />
              </dl>

              {job.rowErrors.length > 0 && (
                <div className="space-y-1 rounded-2xl bg-[#FBE9DC] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A3D11]">
                    Row errors
                  </p>
                  {job.rowErrors.map((rowError) => (
                    <p
                      key={`${rowError.rowNumber}-${rowError.field}`}
                      className="text-sm text-[#8A3D11]"
                    >
                      Row {rowError.rowNumber} · {rowError.field}: {rowError.message}
                    </p>
                  ))}
                </div>
              )}

              {batches.length > 0 && (
                <p className="text-xs text-[var(--ink-muted)]">
                  Created: {batches.map((batch) => batch.reference).join(", ")}
                </p>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
