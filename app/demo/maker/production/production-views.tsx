"use client";

/** List (lifecycle ladder) and grid (material ledger) presentations for the maker production index. */

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import type { ProductionBatch, ProductionOutput } from "../../_mock/types";
import { formatPercent, formatQuantity } from "../../_mock/selectors-shared";
import {
  CirkaBadge,
  DataRow,
  FlowBar,
  ProductionLadder,
  formatDate,
  type FlowSegment,
} from "../../_components/cirka-ui";

const MATERIAL_FLOW_COLOUR = {
  incorporated: "bg-[var(--brand-secondary)]",
  prototypes: "bg-[var(--brand-primary)]",
  reusable: "bg-[#2F6F7A]",
  offcuts: "bg-[#C8A96B]",
  loss: "bg-[#D14343]",
} as const;

function buildFlowSegments(production: ProductionBatch): FlowSegment[] {
  const entries: { key: keyof typeof MATERIAL_FLOW_COLOUR; label: string; value?: number }[] = [
    { key: "incorporated", label: "Incorporated", value: production.qtyIncorporated },
    { key: "prototypes", label: "Prototypes", value: production.qtyPrototypes },
    { key: "reusable", label: "Reusable", value: production.qtyReusableRemaining },
    { key: "offcuts", label: "Offcuts", value: production.qtyOffcuts },
    { key: "loss", label: "Loss", value: production.qtyLoss },
  ];

  return entries
    .filter((entry) => entry.value !== undefined && entry.value > 0)
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      value: entry.value as number,
      colourClass: MATERIAL_FLOW_COLOUR[entry.key],
    }));
}

interface ProductionRowProps {
  href: string;
  production: ProductionBatch;
  batchReference: string;
  outputs: ProductionOutput[];
  overdue: boolean;
}

/** Variant A: one row per batch, the 8-stage lifecycle ladder standing in for a status badge. */
export function ProductionListRow({ href, production, batchReference, outputs, overdue }: ProductionRowProps) {
  const unitsSummary = `${production.actualQuantity ?? 0} / ${production.plannedQuantity} units`;

  return (
    <Link
      href={href}
      className="animate-stagger-in group flex flex-col gap-3 border-b border-[var(--line)] px-5 py-4 transition-[background-color,transform] duration-200 ease-[var(--ease-out)] last:border-b-0 hover:bg-[var(--surface)] hover:-translate-y-[1px] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="truncate text-sm font-medium text-[var(--ink)]">{production.productName}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {production.reference} · from {batchReference}
          </p>
        </div>
        <div className="max-w-md">
          <ProductionLadder status={production.status} />
        </div>
        {overdue && (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#8A3D11]">
            <AlertTriangle size={12} />
            Overdue: planned for {formatDate(production.plannedCompletionDate)}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
        <span className="text-[11px] font-medium text-[var(--ink-muted)]">
          {unitsSummary}
          {outputs.length > 0 && (
            <span className="block text-right">
              {outputs.length} output line{outputs.length === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <ArrowRight
          size={15}
          className="text-[var(--ink-muted)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
        />
      </div>
    </Link>
  );
}

/** Variant B: one card per batch, material yield as the headline and a flow bar for where the material went. */
export function ProductionGridCard({ href, production, batchReference, outputs, overdue }: ProductionRowProps) {
  const segments = buildFlowSegments(production);
  const flowMax = production.qtyUsed ?? segments.reduce((total, segment) => total + segment.value, 0);

  return (
    <Panel className="animate-stagger-in flex flex-col gap-5 p-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              {production.productName}
            </h2>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {production.reference} · from {batchReference}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <CirkaBadge status={production.status} />
            {overdue && <CirkaBadge status="overdue" />}
          </div>
        </div>

        {production.materialYield !== undefined ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              {formatPercent(production.materialYield)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              material yield
            </span>
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">Material yield not calculated yet.</p>
        )}

        {segments.length > 0 ? (
          <FlowBar segments={segments} max={flowMax} unit={production.unit} />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">
            Material use not recorded yet: {formatQuantity(production.qtyReceived ?? 0, production.unit)} received
            so far.
          </p>
        )}
      </div>

      <dl className="border-t border-[var(--line)] pt-1">
        <DataRow
          label="Units"
          value={`${production.actualQuantity ?? 0} of ${production.plannedQuantity} planned`}
          hint={
            outputs.length > 0 ? `${outputs.length} output line${outputs.length === 1 ? "" : "s"}` : undefined
          }
        />
        <DataRow
          label="Completion"
          value={formatDate(production.plannedCompletionDate)}
          hint={
            production.actualCompletionDate
              ? `Completed ${formatDate(production.actualCompletionDate)}`
              : overdue
                ? "Overdue"
                : undefined
          }
        />
        <DataRow
          label="Labour"
          value={
            production.totalLabourHours !== undefined
              ? `${production.totalLabourHours} hrs${
                  production.peopleInvolved ? ` · ${production.peopleInvolved} people` : ""
                }`
              : "Not recorded"
          }
        />
      </dl>

      <Button as={Link} href={href} size="sm">
        Open batch
      </Button>
    </Panel>
  );
}
