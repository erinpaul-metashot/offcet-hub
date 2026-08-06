"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { getBrandDashboard } from "../../_mock/selectors-brand";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, SectionHeading } from "../../_components/cirka-ui";

export default function BrandApprovalsPage() {
  const router = useRouter();
  const store = useDemoStore();
  const { scope } = useDemoPersona("brand");
  const view = getBrandDashboard(store.db, scope);

  return (
    <div className="space-y-6">
      <SectionHeading title="Pending Approvals" />

      {view.pendingApprovals.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          body="Proposed matches appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--surface-elevated)]">
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Project · batch
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Quantity
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Waiting
                </th>
                <th className="w-12" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {view.pendingApprovals.map(({ match, request, batch, waitingDays }) => {
                const href = `/demo/brand/approvals/${match._id}`;

                return (
                  <tr
                    key={match._id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(href)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(href);
                      }
                    }}
                    className="group cursor-pointer border-t border-[var(--line)] transition-colors duration-150 ease-[var(--ease-out)] first:border-t-0 hover:bg-[var(--surface)]"
                  >
                    <td className="px-5 py-4">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">
                        {batch?.name ?? "Unknown batch"}
                      </p>
                      <p className="truncate text-xs text-[var(--ink-muted)]">
                        {request?.reference} · {request?.title}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <CirkaBadge status={match.status} />
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {formatQuantity(match.quantityProposed, match.unit)}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        of {request ? formatQuantity(request.quantityNeeded, request.unit) : "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right text-[var(--ink-muted)]">
                      {waitingDays} day{waitingDays === 1 ? "" : "s"}
                    </td>
                    <td className="px-5 py-4">
                      <ChevronRight
                        size={16}
                        className="text-[var(--ink-muted)] opacity-0 transition-all duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
