"use client";

/** Record-level views reused across screens: audit trail, movements, evidence. */

import { classNames } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { Unit } from "../_mock/domain";
import { movementLabel } from "../_mock/ledger";
import type { AuditEntry, EvidenceItem, QuantityMovement } from "../_mock/types";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

type RecordsMessages = (typeof demoCommon)["en"]["records"];

/** The ledger's name for a move, in the viewer's language (keyed like `LEGAL_MOVES`). */
export function moveLabel(records: RecordsMessages, movement: Pick<QuantityMovement, "fromBucket" | "toBucket" | "reason">): string {
  const key = `${movement.fromBucket ?? "none"}__${movement.toBucket ?? "none"}__${movement.reason}`;
  return records.moves[key as keyof RecordsMessages["moves"]] ?? movementLabel(movement);
}

export function MovementTable({
  movements,
  unit,
  actorName,
}: {
  movements: QuantityMovement[];
  unit: Unit;
  actorName: (userId?: string) => string;
}) {
  const { records } = useMessages(demoCommon);
  const labels = useLabels();
  const fmt = useFormat();
  const bucket = (value?: string | null) =>
    value ? (labels.BUCKET_LABELS[value as keyof typeof labels.BUCKET_LABELS] ?? value.replace(/_/g, " ")) : "-";

  if (movements.length === 0) {
    return (
      <EmptyState title={records.noMovements} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            <th className="py-3 pr-4">{records.when}</th>
            <th className="py-3 pr-4">{records.move}</th>
            <th className="py-3 pr-4 text-right">{records.quantity}</th>
            <th className="py-3">{records.by}</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement._id} className="border-b border-[var(--line)] last:border-b-0 align-top">
              <td className="py-3 pr-4 whitespace-nowrap text-[var(--ink-muted)]">
                {fmt.dateTime(movement.occurredAt)}
              </td>
              <td className="py-3 pr-4">
                <p className="font-medium text-[var(--ink)]">
                  {moveLabel(records, movement)}
                  {labels.MOVEMENT_REASON_LABELS[movement.reason] !== moveLabel(records, movement) && (
                    <span className="font-normal text-[var(--ink-muted)]">
                      {" · "}
                      {labels.MOVEMENT_REASON_LABELS[movement.reason]}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {bucket(movement.fromBucket)} →{" "}
                  {bucket(movement.toBucket)}
                </p>
                {movement.notes && (
                  <p className="mt-1 text-xs italic text-[var(--ink-muted)]">{movement.notes}</p>
                )}
              </td>
              <td className="py-3 pr-4 text-right font-medium tabular-nums text-[var(--ink)]">
                {fmt.quantity(movement.quantity, unit)}
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
  const { records } = useMessages(demoCommon);
  const fmt = useFormat();

  if (rows.length === 0) {
    return <EmptyState title={records.noHistory} />;
  }

  return (
    <ol className="space-y-4">
      {rows.map((entry) => (
        <li key={entry._id} className="flex gap-4">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-primary)]" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-[var(--ink)]">
              <span className="font-medium">
                {records.actions[entry.action as keyof typeof records.actions] ?? entry.action.replace(/_/g, " ")}
              </span>
              {entry.entityTable !== "resourceBatches" && (
                <span className="text-[var(--ink-muted)]">
                  {" · "}
                  {entry.entityTable.replace(/([A-Z])/g, " $1").toLowerCase()}
                </span>
              )}
            </p>
            {entry.fieldChanges && entry.fieldChanges.length > 0 && (
              <p className="text-xs text-[var(--ink-muted)]">
                {entry.fieldChanges
                  .map(
                    (change) =>
                      `${change.field}: ${change.previousValue ?? "-"} → ${change.newValue ?? "-"}`,
                  )
                  .join(" · ")}
              </p>
            )}
            {entry.notes && <p className="text-xs italic text-[var(--ink-muted)]">{entry.notes}</p>}
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {fmt.dateTime(entry.occurredAt)} · {actorName(entry.actorUserId)}
              {entry.actorType !== "user" &&
                ` · ${records.actors[entry.actorType as keyof typeof records.actors] ?? entry.actorType}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EvidenceGrid({ items }: { items: EvidenceItem[] }) {
  const { records } = useMessages(demoCommon);
  const fmt = useFormat();

  if (items.length === 0) {
    return (
      <EmptyState title={records.noEvidence} />
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
              {records.evidenceKinds[item.kind as keyof typeof records.evidenceKinds] ?? item.kind.replace(/_/g, " ")}
            </p>
            {item.caption && <p className="text-sm text-[var(--ink)]">{item.caption}</p>}
            <p className="text-[11px] text-[var(--ink-muted)]">
              {item.fileName} · {fmt.dateTime(item.createdAt)}
            </p>
            {item.containsPeople && (
              <p
                className={classNames(
                  "inline-flex rounded-full border border-dashed border-[var(--line-strong)] px-2 py-0.5",
                  "text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]",
                )}
              >
                {records.containsPeople}
              </p>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
