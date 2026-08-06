"use client";

import { useState } from "react";
import { EmptyState, Panel, Select } from "@/components/ui";
import { ALLOCATION_STATUSES, statusLabel } from "../../_mock/domain";
import { listAllocationsOverview } from "../../_mock/selectors-admin";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading, formatDate } from "../../_components/cirka-ui";

export default function AdminAllocationsPage() {
  const { db } = useDemoStore();
  const [status, setStatus] = useState("");

  const rows = listAllocationsOverview(db).filter((row) =>
    status ? row.allocation.status === status : true,
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Allocations"
        title="Every hand-off in the network"
        action={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-56">
            <option value="">All statuses</option>
            {ALLOCATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No allocations" body="Approved matches create the first one." />
      ) : (
        <Panel className="overflow-hidden">
          {rows.map(({ allocation, batch, fromName, toName, project }) => (
            <LinkRow
              key={allocation._id}
              href={`/demo/admin/allocations/${allocation._id}`}
              title={`${allocation.reference} · ${fromName} → ${toName}`}
              meta={
                <>
                  {batch?.name ?? "-"}
                  {project ? ` · ${project.title}` : ""} ·{" "}
                  {formatQuantity(allocation.quantityAllocated, allocation.unit)} ·{" "}
                  {formatDate(allocation.updatedAt)}
                </>
              }
              right={<CirkaBadge status={allocation.status} />}
            />
          ))}
        </Panel>
      )}
    </div>
  );
}
