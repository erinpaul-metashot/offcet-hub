"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import type { ProjectRow } from "../_mock/selectors-admin";
import { CirkaBadge } from "./cirka-ui";
import { ProjectJourneyStepper } from "./project-journey-stepper";
import { useFormat } from "./use-format";

export function ProjectTable({
  rows,
  hrefPrefix,
  emptyTitle,
}: {
  rows: ProjectRow[];
  hrefPrefix: string;
  emptyTitle?: string;
}) {
  const { projectTable: t } = useMessages(demoAdmin);
  const fmt = useFormat();

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle ?? t.empty} />;
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const overdue = row.journey.some((entry) => entry.status === "overdue");

        return (
          <li key={row.project._id}>
            <Link
              href={`${hrefPrefix}/${row.project._id}`}
              className="block rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--ink)]">{row.project.title}</h3>
                    <CirkaBadge status={row.project.status} />
                    {overdue && <CirkaBadge status="overdue" />}
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {row.project.reference} · {row.brandName}
                  </p>
                  <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
                    {row.project.objective}
                  </p>
                </div>

                <div className="shrink-0 space-y-2 sm:text-right">
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                    {fmt.quantity(row.incorporated, row.unit)}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {t.intoProducts}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <ProjectJourneyStepper journey={row.journey} compact />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {format(row.requestCount === 1 ? t.requestsOne : t.requestsMany, { count: row.requestCount })} ·{" "}
                  {format(row.matchCount === 1 ? t.matchesOne : t.matchesMany, { count: row.matchCount })} ·{" "}
                  {format(row.productionCount === 1 ? t.runsOne : t.runsMany, { count: row.productionCount })}
                </p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {format(t.target, { date: fmt.date(row.project.targetCompletionDate) })}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
