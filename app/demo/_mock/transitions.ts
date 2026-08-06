/**
 * Status is a path, not a free-text field (04_ARCHITECTURE §6.3).
 * Each record type has a defined list of steps and defined legal moves between
 * them; the store refuses illegal jumps exactly as the backend will.
 */

import { statusLabel } from "./domain";
import type {
  AllocationStatus,
  MatchStatus,
  ProductionStatus,
  ProjectStatus,
  RequestStatus,
} from "./domain";
import type { ProductionBatch } from "./types";
import { round } from "./ledger";

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransitionError";
  }
}

/* ------------------------------------------------------------------ *
 * The machines
 * ------------------------------------------------------------------ */

export const ALLOCATION_TRANSITIONS: Record<AllocationStatus, AllocationStatus[]> = {
  proposed: ["accepted", "declined", "cancelled"],
  accepted: ["awaiting_dispatch", "cancelled"],
  declined: [],
  awaiting_dispatch: ["in_transit", "cancelled"],
  in_transit: ["received", "discrepancy"],
  discrepancy: ["received", "returned"],
  received: ["completed", "returned"],
  returned: [],
  completed: [],
  cancelled: [],
};

export const PRODUCTION_TRANSITIONS: Record<ProductionStatus, ProductionStatus[]> = {
  planned: ["awaiting_material", "material_received", "cancelled"],
  awaiting_material: ["material_received", "cancelled"],
  material_received: ["in_production", "cancelled"],
  in_production: ["quality_review", "on_hold"],
  quality_review: ["in_production", "completed"],
  completed: ["evidence_submitted"],
  evidence_submitted: ["cirka_reviewed", "in_production"],
  cirka_reviewed: [],
  on_hold: ["in_production"],
  cancelled: [],
};

export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ["submitted", "cancelled"],
  /* Closing straight from submitted: CIRKA can look, find nothing, and say so
     without first opening a review the matching workspace already offers. */
  submitted: ["under_review", "unfulfillable", "cancelled"],
  under_review: ["matched", "partially_matched", "unfulfillable"],
  partially_matched: ["matched", "in_delivery"],
  matched: ["in_delivery"],
  unfulfillable: ["under_review"],
  in_delivery: ["fulfilled"],
  fulfilled: ["closed"],
  closed: [],
  cancelled: [],
};

export const MATCH_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  proposed: ["approved", "rejected", "withdrawn"],
  approved: ["superseded"],
  rejected: [],
  withdrawn: [],
  superseded: [],
};

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ["active", "cancelled"],
  active: ["on_hold", "completed", "cancelled"],
  on_hold: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

function assert<T extends string>(
  machine: Record<T, T[]>,
  entity: string,
  from: T,
  to: T,
): void {
  if (from === to) {
    return;
  }

  if (!machine[from]?.includes(to)) {
    throw new TransitionError(
      `${entity} cannot go from ${statusLabel(from)} to ${statusLabel(to)}.`,
    );
  }
}

export function assertAllocationTransition(from: AllocationStatus, to: AllocationStatus) {
  assert(ALLOCATION_TRANSITIONS, "This allocation", from, to);
}

export function assertProductionTransition(from: ProductionStatus, to: ProductionStatus) {
  assert(PRODUCTION_TRANSITIONS, "This production batch", from, to);
}

export function assertRequestTransition(from: RequestStatus, to: RequestStatus) {
  assert(REQUEST_TRANSITIONS, "This request", from, to);
}

export function assertMatchTransition(from: MatchStatus, to: MatchStatus) {
  assert(MATCH_TRANSITIONS, "This match", from, to);
}

export function assertProjectTransition(from: ProjectStatus, to: ProjectStatus) {
  assert(PROJECT_TRANSITIONS, "This project", from, to);
}

/* ------------------------------------------------------------------ *
 * The production balance check: 05_SYSTEM_DESIGN §4
 * ------------------------------------------------------------------ *
 *   received = used + reusable remaining + returned
 *   used     = incorporated + prototypes + offcuts + loss
 *
 * A production batch cannot reach Completed until both lines balance. This is
 * what makes the material yield figure meaningful rather than an estimate.
 */

export interface BalanceCheck {
  balanced: boolean;
  problems: string[];
  received: number;
  accountedFor: number;
  used: number;
  usedBreakdown: number;
}

export function checkMaterialBalance(production: ProductionBatch): BalanceCheck {
  const received = round(production.qtyReceived ?? 0);
  const used = round(production.qtyUsed ?? 0);
  const reusableRemaining = round(production.qtyReusableRemaining ?? 0);
  const returned = round(production.qtyReturned ?? 0);
  const incorporated = round(production.qtyIncorporated ?? 0);
  const prototypes = round(production.qtyPrototypes ?? 0);
  const offcuts = round(production.qtyOffcuts ?? 0);
  const loss = round(production.qtyLoss ?? 0);

  const accountedFor = round(used + reusableRemaining + returned);
  const usedBreakdown = round(incorporated + prototypes + offcuts + loss);
  const problems: string[] = [];

  if (received <= 0) {
    problems.push("Record the quantity received before completing the batch.");
  }

  if (Math.abs(accountedFor - received) > 0.001) {
    const gap = round(received - accountedFor);
    problems.push(
      gap > 0
        ? `${gap} ${production.unit} of the received material is unaccounted for: used, reusable remaining and returned must add up to ${received}.`
        : `Used, reusable remaining and returned add up to ${accountedFor} ${production.unit}, which is more than the ${received} ${production.unit} received.`,
    );
  }

  if (Math.abs(usedBreakdown - used) > 0.001) {
    const gap = round(used - usedBreakdown);
    problems.push(
      gap > 0
        ? `${gap} ${production.unit} of the material used is not broken down: incorporated, prototypes, offcuts and loss must add up to ${used}.`
        : `Incorporated, prototypes, offcuts and loss add up to ${usedBreakdown} ${production.unit}, which is more than the ${used} ${production.unit} used.`,
    );
  }

  return {
    balanced: problems.length === 0,
    problems,
    received,
    accountedFor,
    used,
    usedBreakdown,
  };
}

/** Material yield = quantity incorporated into finished outputs / total used. */
export function materialYield(production: Pick<ProductionBatch, "qtyIncorporated" | "qtyUsed">) {
  const used = production.qtyUsed ?? 0;
  const incorporated = production.qtyIncorporated ?? 0;

  if (used <= 0) {
    return undefined;
  }

  return Math.round((incorporated / used) * 1000) / 1000;
}
