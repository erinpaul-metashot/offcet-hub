"use client";

import { EmptyState, Panel } from "@/components/ui";
import { listProductionOverview } from "../../_mock/selectors-admin";
import { formatPercent, formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading, formatDate } from "../../_components/cirka-ui";

export default function AdminProductionPage() {
  const { db } = useDemoStore();
  const rows = listProductionOverview(db);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Production"
        title="Every run in the network"
        description="Open a batch to check the material balance, the outputs and the evidence before marking it CIRKA reviewed. Cost data is visible here and to the maker only."
      />

      {rows.length === 0 ? (
        <EmptyState title="No production yet" body="Makers create a batch against an allocation." />
      ) : (
        <Panel className="overflow-hidden">
          {rows.map(({ production, makerName, batch, project, outputs, evidenceCount }) => (
            <LinkRow
              key={production._id}
              href={`/demo/admin/production/${production._id}`}
              title={`${production.reference} · ${production.productName}`}
              meta={
                <>
                  {makerName} · from {batch?.reference ?? "—"}
                  {project ? ` · ${project.title}` : ""} ·{" "}
                  {outputs.reduce((total, output) => total + (output.numberCompleted ?? 0), 0)} units
                  {production.materialYield !== undefined
                    ? ` · ${formatPercent(production.materialYield)} yield`
                    : ""}
                  {production.qtyUsed
                    ? ` · ${formatQuantity(production.qtyUsed, production.unit)} used`
                    : ""}{" "}
                  · {evidenceCount} evidence file{evidenceCount === 1 ? "" : "s"}
                  {production.plannedCompletionDate
                    ? ` · due ${formatDate(production.plannedCompletionDate)}`
                    : ""}
                </>
              }
              right={<CirkaBadge status={production.status} />}
            />
          ))}
        </Panel>
      )}
    </div>
  );
}
