/**
 * The admin action queue (05_SYSTEM_DESIGN §9).
 *
 * Most rows are derived from queries so they can never go stale. Stored
 * `actionItems` are merged in for the exceptions that need an owner and a
 * resolution note.
 */

import { ACTION_KIND_LABELS, type ActionKind, type ActionSeverity } from "./domain";
import type { Id, MockDatabase } from "./types";
import { formatQuantity, isOverdue, orgName } from "./selectors-shared";

export interface QueueRow {
  id: string;
  kind: ActionKind;
  severity: ActionSeverity;
  title: string;
  detail: string;
  href: string;
  since: number;
  dueDate?: number;
  stored?: boolean;
  actionItemId?: Id;
}

const STALE_PRODUCTION_DAYS = 7;

export function buildActionQueue(db: MockDatabase): QueueRow[] {
  const rows: QueueRow[] = [];
  const now = Date.now();

  /* Requests awaiting matching. */
  for (const request of db.resourceRequests) {
    const hasOpenMatch = db.matches.some(
      (match) => match.requestId === request._id && ["proposed", "approved"].includes(match.status),
    );

    if (["submitted", "under_review"].includes(request.status) && !hasOpenMatch) {
      rows.push({
        id: `match_${request._id}`,
        kind: "awaiting_match",
        severity: "info",
        title: request.title,
        detail: `${orgName(db, request.requesterOrgId)} · ${formatQuantity(request.quantityNeeded, request.unit)} needed`,
        href: `/demo/admin/matching/${request._id}`,
        since: request.submittedAt ?? request.createdAt,
        dueDate: request.neededBy,
      });
    }
  }

  /* Matches proposed and waiting on a brand decision. */
  for (const match of db.matches.filter((entry) => entry.status === "proposed")) {
    const request = db.resourceRequests.find((entry) => entry._id === match.requestId);

    rows.push({
      id: `decision_${match._id}`,
      kind: "awaiting_review",
      severity: "info",
      title: `Match awaiting a decision on ${request?.reference ?? "a request"}`,
      detail: `${formatQuantity(match.quantityProposed, match.unit)} reserved since the match was proposed`,
      href: `/demo/admin/matching/${match.requestId}`,
      since: match.proposedAt,
    });
  }

  /* Allocations awaiting acceptance, dispatch or receipt. */
  for (const allocation of db.allocations) {
    if (allocation.status === "proposed") {
      rows.push({
        id: `accept_${allocation._id}`,
        kind: "awaiting_acceptance",
        severity: "info",
        title: `${allocation.reference} awaiting acceptance`,
        detail: `${orgName(db, allocation.toOrgId)} · ${formatQuantity(allocation.quantityAllocated, allocation.unit)}`,
        href: `/demo/admin/allocations`,
        since: allocation.createdAt,
      });
    }

    if (["accepted", "awaiting_dispatch"].includes(allocation.status)) {
      rows.push({
        id: `dispatch_${allocation._id}`,
        kind: "awaiting_dispatch",
        severity: isOverdue(allocation.expectedDispatchDate) ? "warning" : "info",
        title: `${allocation.reference} awaiting dispatch`,
        detail: `${orgName(db, allocation.fromOrgId)} → ${orgName(db, allocation.toOrgId)} · ${formatQuantity(allocation.quantityAllocated, allocation.unit)}`,
        href: `/demo/admin/allocations`,
        since: allocation.respondedAt ?? allocation.createdAt,
        dueDate: allocation.expectedDispatchDate,
      });
    }

    if (allocation.status === "in_transit") {
      rows.push({
        id: `receipt_${allocation._id}`,
        kind: "awaiting_receipt",
        severity: isOverdue(allocation.expectedArrivalDate) ? "warning" : "info",
        title: `${allocation.reference} awaiting receipt confirmation`,
        detail: `${orgName(db, allocation.toOrgId)} · ${formatQuantity(allocation.quantityDispatched ?? allocation.quantityAllocated, allocation.unit)} in transit`,
        href: `/demo/admin/allocations`,
        since: allocation.dispatchedAt ?? allocation.updatedAt,
        dueDate: allocation.expectedArrivalDate,
      });
    }
  }

  /* Production that has gone quiet, and evidence waiting for review. */
  for (const production of db.productionBatches) {
    const staleFor = (now - production.updatedAt) / (24 * 60 * 60 * 1000);

    if (
      ["in_production", "material_received", "awaiting_material"].includes(production.status) &&
      staleFor > STALE_PRODUCTION_DAYS
    ) {
      rows.push({
        id: `stalled_${production._id}`,
        kind: "production_stalled",
        severity: "warning",
        title: `${production.reference} has had no update in ${Math.floor(staleFor)} days`,
        detail: `${orgName(db, production.makerOrgId)} · ${production.productName}`,
        href: `/demo/admin/production/${production._id}`,
        since: production.updatedAt,
        dueDate: production.plannedCompletionDate,
      });
    }

    if (production.status === "evidence_submitted") {
      rows.push({
        id: `review_${production._id}`,
        kind: "awaiting_review",
        severity: "info",
        title: `${production.reference} evidence awaiting CIRKA review`,
        detail: `${orgName(db, production.makerOrgId)} · ${production.productName}`,
        href: `/demo/admin/production/${production._id}`,
        since: production.evidenceSubmittedAt ?? production.updatedAt,
      });
    }

    if (
      production.status === "completed" &&
      !db.evidenceItems.some(
        (item) => item.entityTable === "productionBatches" && item.entityId === production._id,
      )
    ) {
      rows.push({
        id: `evidence_${production._id}`,
        kind: "missing_evidence",
        severity: "warning",
        title: `${production.reference} completed without evidence`,
        detail: `${orgName(db, production.makerOrgId)} · ${production.productName}`,
        href: `/demo/admin/production/${production._id}`,
        since: production.actualCompletionDate ?? production.updatedAt,
      });
    }
  }

  /* Failed transfers. */
  for (const transfer of db.integrationTransfers.filter((entry) => entry.status === "failed")) {
    rows.push({
      id: `transfer_${transfer._id}`,
      kind: "transfer_failed",
      severity: "blocking",
      title: `Transfer to ${transfer.externalSystemName} failed`,
      detail: transfer.errorMessage ?? "No error message recorded.",
      href: "/demo/admin/integrations",
      since: transfer.lastAttemptAt ?? transfer.createdAt,
    });
  }

  /* Stored exceptions that carry an owner and a resolution note. */
  for (const item of db.actionItems.filter((entry) => entry.status === "open")) {
    rows.push({
      id: `stored_${item._id}`,
      kind: item.kind,
      severity: item.severity,
      title: item.title,
      detail: item.assignedToOrgId
        ? `Assigned to ${orgName(db, item.assignedToOrgId)}`
        : `Assigned to ${item.assignedToRole}`,
      href:
        item.entityTable === "allocations"
          ? "/demo/admin/allocations"
          : item.entityTable === "integrationTransfers"
            ? "/demo/admin/integrations"
            : `/demo/admin/matching/${item.entityId}`,
      since: item.openedAt,
      dueDate: item.dueDate,
      stored: true,
      actionItemId: item._id,
    });
  }

  const severityRank: Record<ActionSeverity, number> = { blocking: 0, warning: 1, info: 2 };

  return rows.sort((left, right) => {
    const bySeverity = severityRank[left.severity] - severityRank[right.severity];
    return bySeverity !== 0 ? bySeverity : left.since - right.since;
  });
}

export function groupQueueByKind(rows: QueueRow[]) {
  const groups = new Map<ActionKind, QueueRow[]>();

  for (const row of rows) {
    groups.set(row.kind, [...(groups.get(row.kind) ?? []), row]);
  }

  return Array.from(groups.entries()).map(([kind, items]) => ({
    kind,
    label: ACTION_KIND_LABELS[kind],
    items,
  }));
}

const SEVERITY_ORDER: ActionSeverity[] = ["blocking", "warning", "info"];
const SEVERITY_LABELS: Record<ActionSeverity, string> = {
  blocking: "Blocking",
  warning: "Warning",
  info: "Info",
};

/** The same idea as `groupQueueByKind`, grouped by what actually orders attention. */
export function groupQueueBySeverity(rows: QueueRow[]) {
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    label: SEVERITY_LABELS[severity],
    items: rows.filter((row) => row.severity === severity),
  })).filter((group) => group.items.length > 0);
}

/** The same idea, scoped to one organisation — used on the role dashboards. */
export function queueForOrg(db: MockDatabase, orgId: Id): QueueRow[] {
  const rows: QueueRow[] = [];

  for (const allocation of db.allocations) {
    if (allocation.status === "proposed" && allocation.toOrgId === orgId) {
      rows.push({
        id: `accept_${allocation._id}`,
        kind: "awaiting_acceptance",
        severity: "info",
        title: `${allocation.reference} needs your decision`,
        detail: `${formatQuantity(allocation.quantityAllocated, allocation.unit)} offered by ${orgName(db, allocation.fromOrgId)}`,
        href: "",
        since: allocation.createdAt,
      });
    }

    if (
      ["accepted", "awaiting_dispatch"].includes(allocation.status) &&
      allocation.fromOrgId === orgId
    ) {
      rows.push({
        id: `dispatch_${allocation._id}`,
        kind: "awaiting_dispatch",
        severity: isOverdue(allocation.expectedDispatchDate) ? "warning" : "info",
        title: `${allocation.reference} is waiting to be dispatched`,
        detail: `${formatQuantity(allocation.quantityAllocated, allocation.unit)} to ${orgName(db, allocation.toOrgId)}`,
        href: "",
        since: allocation.respondedAt ?? allocation.createdAt,
        dueDate: allocation.expectedDispatchDate,
      });
    }

    if (allocation.status === "in_transit" && allocation.toOrgId === orgId) {
      rows.push({
        id: `receipt_${allocation._id}`,
        kind: "awaiting_receipt",
        severity: isOverdue(allocation.expectedArrivalDate) ? "warning" : "info",
        title: `${allocation.reference} is on its way to you`,
        detail: `${formatQuantity(allocation.quantityDispatched ?? allocation.quantityAllocated, allocation.unit)} from ${orgName(db, allocation.fromOrgId)}`,
        href: "",
        since: allocation.dispatchedAt ?? allocation.updatedAt,
        dueDate: allocation.expectedArrivalDate,
      });
    }

    if (allocation.status === "discrepancy" && (allocation.fromOrgId === orgId || allocation.toOrgId === orgId)) {
      rows.push({
        id: `discrepancy_${allocation._id}`,
        kind: "quantity_discrepancy",
        severity: "blocking",
        title: `${allocation.reference} has an open discrepancy`,
        detail: allocation.discrepancyReason ?? "Awaiting resolution by CIRKA.",
        href: "",
        since: allocation.receivedAt ?? allocation.updatedAt,
      });
    }
  }

  return rows.sort((left, right) => left.since - right.since);
}
