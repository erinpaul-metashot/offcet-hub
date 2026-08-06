"use client";

/**
 * The network ledger as a node flow rather than a single stacked line.
 *
 * The nodes are the pots and the connectors are the legal moves between them
 * (`LEGAL_MOVES` in _mock/ledger.ts), so the shape on screen is the shape of the
 * ledger: material enters at Available, walks the chain, and leaves only into a
 * terminal pot. Empty pots stay drawn — a gap in the chain is information too.
 */

import { ChevronRight } from "lucide-react";
import { classNames } from "@/lib/utils";
import { BUCKET_LABELS, type QuantityBucket, type Unit } from "../_mock/domain";
import { formatQuantity } from "../_mock/selectors-shared";
import type { PotSlice } from "../_mock/selectors-batches";
import { BUCKET_COLOUR } from "./cirka-ui";

/** The main chain, in the order material actually travels it. */
const FLOW: readonly QuantityBucket[] = [
  "available",
  "reserved",
  "allocated",
  "in_transit",
  "at_custodian",
  "with_maker",
  "consumed",
];

/** Material that left the chain without being used. */
const OFF_FLOW: readonly QuantityBucket[] = ["written_off", "unexplained"];

/**
 * Literal so Tailwind can extract them: mirrors `BUCKET_COLOUR`. Sets the colour on
 * every edge; which edge is actually drawn is a width decision the node makes per
 * breakpoint — a left rule stacked, a top rule in the row.
 */
const BUCKET_RULE: Record<QuantityBucket, string> = {
  available: "border-[var(--brand-secondary)]",
  reserved: "border-[#C8A96B]",
  allocated: "border-[#B4531A]",
  in_transit: "border-[#7A5CC4]",
  at_custodian: "border-[#2F6F7A]",
  with_maker: "border-[var(--brand-primary)]",
  consumed: "border-[#5C3A21]",
  written_off: "border-[#9A9A9A]",
  unexplained: "border-[#D14343]",
};

interface NodeData {
  bucket: QuantityBucket;
  quantity: number;
  share: number;
}

function LedgerNode({ node, unit }: { node: NodeData; unit: Unit }) {
  const empty = node.quantity === 0;

  return (
    <div
      className={classNames(
        // Stacked: a left rule and one dense line. In a row: a top rule and a stat block.
        "flex min-w-0 flex-1 items-baseline justify-between gap-3 border-l-2 py-1.5 pl-3",
        "lg:block lg:border-l-0 lg:border-t-2 lg:py-0 lg:pl-0 lg:pt-3",
        empty ? "border-[var(--line)]" : BUCKET_RULE[node.bucket],
      )}
    >
      <p
        className={classNames(
          "text-[10px] font-bold uppercase tracking-[0.14em]",
          empty ? "text-[var(--line-strong)]" : "text-[var(--ink-muted)]",
        )}
      >
        {BUCKET_LABELS[node.bucket]}
      </p>
      <div className="flex shrink-0 items-baseline gap-2 lg:mt-1.5 lg:block">
        <p
          className={classNames(
            "text-[17px] font-semibold leading-none tracking-[-0.04em] tabular-nums lg:text-[22px]",
            empty ? "text-[var(--line-strong)]" : "text-[var(--ink)]",
          )}
        >
          {empty ? "—" : formatQuantity(node.quantity, unit)}
        </p>
        {!empty && (
          <p className="text-[11px] tabular-nums text-[var(--ink-muted)] lg:mt-1">
            {Math.round(node.share * 100)}%
          </p>
        )}
      </div>
    </div>
  );
}

/** Sequence is carried by adjacency when stacked, so the chevron is row-layout only. */
function Connector() {
  return (
    <ChevronRight
      size={16}
      strokeWidth={2.5}
      aria-hidden
      className="mt-3 hidden shrink-0 self-start text-[var(--line-strong)] lg:block"
    />
  );
}

export function NetworkLedgerNodes({ slices, unit }: { slices: PotSlice[]; unit: Unit }) {
  const byBucket = new Map(slices.map((slice) => [slice.bucket, slice]));

  const nodeFor = (bucket: QuantityBucket): NodeData => ({
    bucket,
    quantity: byBucket.get(bucket)?.quantity ?? 0,
    share: byBucket.get(bucket)?.share ?? 0,
  });

  const offFlow = OFF_FLOW.map(nodeFor).filter((node) => node.quantity > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 lg:flex-row lg:items-stretch lg:gap-3">
        {FLOW.map((bucket, index) => (
          <div key={bucket} className="contents">
            {index > 0 && <Connector />}
            <LedgerNode node={nodeFor(bucket)} unit={unit} />
          </div>
        ))}
      </div>

      {offFlow.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-dashed border-[var(--line)] pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Left the flow
          </p>
          {offFlow.map((node) => (
            <p key={node.bucket} className="flex items-baseline gap-2 text-sm">
              <span
                className={classNames(
                  "h-2 w-2 shrink-0 translate-y-[-1px] rounded-full",
                  BUCKET_COLOUR[node.bucket],
                )}
              />
              <span className="text-[var(--ink-muted)]">{BUCKET_LABELS[node.bucket]}</span>
              <span
                className={classNames(
                  "font-semibold tabular-nums",
                  node.bucket === "unexplained" ? "text-[#D14343]" : "text-[var(--ink)]",
                )}
              >
                {formatQuantity(node.quantity, unit)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
