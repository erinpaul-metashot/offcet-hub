"use client";

import { EmptyState, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { listProductionOverview } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import { CirkaBadge, LinkRow, SectionHeading } from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";

export default function AdminProductionPage() {
  const { db } = useDemoStore();
  const rows = listProductionOverview(db);
  const { production: t } = useMessages(demoAdmin);
  const fmt = useFormat();

  return (
    <div className="space-y-6">
      <SectionHeading title={t.title} />

      {rows.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <Panel className="overflow-hidden">
          {rows.map(({ production, makerName, batch, project, outputs, evidenceCount }) => (
            <LinkRow
              key={production._id}
              href={`/demo/admin/production/${production._id}`}
              title={`${production.reference} · ${production.productName}`}
              meta={
                <>
                  {format(t.fromBatch, { maker: makerName, batch: batch?.reference ?? "-" })}
                  {project ? ` · ${project.title}` : ""} ·{" "}
                  {format(t.units, {
                    count: fmt.number(outputs.reduce((total, output) => total + (output.numberCompleted ?? 0), 0)),
                  })}
                  {production.materialYield !== undefined
                    ? format(t.yield, { percent: fmt.percent(production.materialYield) })
                    : ""}
                  {production.qtyUsed
                    ? format(t.used, { quantity: fmt.quantity(production.qtyUsed, production.unit) })
                    : ""}
                  {format(evidenceCount === 1 ? t.evidenceOne : t.evidenceMany, { count: evidenceCount })}
                  {production.plannedCompletionDate
                    ? format(t.due, { date: fmt.date(production.plannedCompletionDate) })
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
