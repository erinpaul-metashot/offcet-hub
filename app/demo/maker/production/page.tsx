"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { listMakerProduction } from "../../_mock/selectors-maker";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { SectionHeading, ViewModeToggle } from "../../_components/cirka-ui";
import { ProductionGridCard, ProductionListRow } from "./production-views";

export default function MakerProductionPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const rows = listMakerProduction(db, scope.orgId);
  const [view, setView] = useState<"grid" | "list">("list");
  const { production: t } = useMessages(demoMaker);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t.title}
        action={
          <div className="flex items-center gap-3">
            <ViewModeToggle value={view} onChange={setView} />
            <Button as={Link} href="/demo/maker/production/new" size="sm">
              {t.newProduction}
            </Button>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title={t.noProduction}
          body={t.noProductionBody}
        />
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)]">
          {rows.map(({ production, batch, outputs, overdue }) => (
            <ProductionListRow
              key={production._id}
              href={`/demo/maker/production/${production._id}`}
              production={production}
              batchReference={batch?.reference ?? t.aBatch}
              outputs={outputs}
              overdue={overdue}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {rows.map(({ production, batch, outputs, overdue }) => (
            <ProductionGridCard
              key={production._id}
              href={`/demo/maker/production/${production._id}`}
              production={production}
              batchReference={batch?.reference ?? t.aBatch}
              outputs={outputs}
              overdue={overdue}
            />
          ))}
        </div>
      )}
    </div>
  );
}
