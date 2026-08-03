"use client";

/** Record-level views reused across screens: audit trail, movements, evidence. */

import { classNames } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { MOVEMENT_REASON_LABELS, type Unit } from "../_mock/domain";
import { movementLabel } from "../_mock/ledger";
import type { AuditEntry, EvidenceItem, QuantityMovement } from "../_mock/types";
import { formatQuantity } from "../_mock/selectors-shared";
import { formatDateTime } from "./cirka-ui";

export function MovementTable({
  movements,
  unit,
  actorName,
}: {
  movements: QuantityMovement[];
  unit: Unit;
  actorName: (userId?: string) => string;
}) {
  if (movements.length === 0) {
    return (
      <EmptyState
        title="No movements yet"
        body="Every pour between pots is written down here, with the person and the time."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            <th className="py-3 pr-4">When</th>
            <th className="py-3 pr-4">Move</th>
            <th className="py-3 pr-4 text-right">Quantity</th>
            <th className="py-3 pr-4">Reason</th>
            <th className="py-3">By</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement._id} className="border-b border-[var(--line)] last:border-b-0 align-top">
              <td className="py-3 pr-4 whitespace-nowrap text-[var(--ink-muted)]">
                {formatDateTime(movement.occurredAt)}
              </td>
              <td className="py-3 pr-4">
                <p className="font-medium text-[var(--ink)]">{movementLabel(movement)}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {(movement.fromBucket ?? "—").replace(/_/g, " ")} →{" "}
                  {(movement.toBucket ?? "—").replace(/_/g, " ")}
                </p>
                {movement.notes && (
                  <p className="mt-1 text-xs italic text-[var(--ink-muted)]">{movement.notes}</p>
                )}
              </td>
              <td className="py-3 pr-4 text-right font-medium tabular-nums text-[var(--ink)]">
                {formatQuantity(movement.quantity, unit)}
              </td>
              <td className="py-3 pr-4 text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {MOVEMENT_REASON_LABELS[movement.reason]}
              </td>
              <td className="py-3 text-[var(--ink-muted)]">{actorName(movement.performedByUserId)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditTrail({
  entries,
  actorName,
  limit,
}: {
  entries: AuditEntry[];
  actorName: (userId?: string) => string;
  limit?: number;
}) {
  const rows = limit ? entries.slice(0, limit) : entries;

  if (rows.length === 0) {
    return <EmptyState title="No history yet" body="Changes to this record will appear here." />;
  }

  return (
    <ol className="space-y-4">
      {rows.map((entry) => (
        <li key={entry._id} className="flex gap-4">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-primary)]" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-[var(--ink)]">
              <span className="font-medium capitalize">{entry.action.replace(/_/g, " ")}</span>
              <span className="text-[var(--ink-muted)]"> · {entry.entityTable}</span>
            </p>
            {entry.fieldChanges && entry.fieldChanges.length > 0 && (
              <p className="text-xs text-[var(--ink-muted)]">
                {entry.fieldChanges
                  .map(
                    (change) =>
                      `${change.field}: ${change.previousValue ?? "—"} → ${change.newValue ?? "—"}`,
                  )
                  .join(" · ")}
              </p>
            )}
            {entry.notes && <p className="text-xs italic text-[var(--ink-muted)]">{entry.notes}</p>}
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {formatDateTime(entry.occurredAt)} · {actorName(entry.actorUserId)}
              {entry.actorType !== "user" && ` · ${entry.actorType}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EvidenceGrid({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No evidence uploaded"
        body="Photos and documents attached to this record will show here."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <figure
          key={item._id}
          className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.fileUrl}
            alt={item.caption ?? item.fileName}
            className="h-40 w-full object-cover"
          />
          <figcaption className="space-y-1 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {item.kind.replace(/_/g, " ")}
            </p>
            {item.caption && <p className="text-sm text-[var(--ink)]">{item.caption}</p>}
            <p className="text-[11px] text-[var(--ink-muted)]">
              {item.fileName} · {formatDateTime(item.createdAt)}
            </p>
            {item.containsPeople && (
              <p
                className={classNames(
                  "inline-flex rounded-full border border-dashed border-[var(--line-strong)] px-2 py-0.5",
                  "text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]",
                )}
              >
                Contains people
              </p>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
