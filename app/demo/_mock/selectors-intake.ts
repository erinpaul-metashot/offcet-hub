/**
 * Reads for the intake hub, the arrivals inbox, and the mapping wizard
 * (05_SYSTEM_DESIGN §7). Org-scoped like every other selector: a manufacturer
 * only ever sees its own channels, arrivals, and import history.
 */

import { INTAKE_CHANNELS, RETEXCIR, type DataSource, type IntakeChannelConfig } from "./domain";
import { findConnection } from "./operations/integrations";
import { ownsTransfer } from "./operations/retexcir";
import type {
  ImportJob,
  IntegrationTransfer,
  IntegrationConnection,
  MockDatabase,
  PendingArrival,
  ResourceBatch,
} from "./types";
import type { ViewerScope } from "./visibility";

export interface IntakeChannelRow extends IntakeChannelConfig {
  pendingCount: number;
  lastActivityAt?: number;
  /** Set on connector channels the viewer's org has linked an account to. */
  connection?: IntegrationConnection;
}

/** The viewer org's Retexcir link, or undefined while it is not connected. */
export function getRetexcirConnection(
  db: MockDatabase,
  viewer: ViewerScope,
): IntegrationConnection | undefined {
  return findConnection(db, viewer.orgId, "sorting_system");
}

export function listIntakeChannels(db: MockDatabase, viewer: ViewerScope): IntakeChannelRow[] {
  return INTAKE_CHANNELS.map((channel) => {
    const arrivals = db.pendingArrivals.filter(
      (arrival) => arrival.ownerOrgId === viewer.orgId && arrival.channel === channel.dataSource,
    );
    const jobs = db.importJobs.filter(
      (job) => job.orgId === viewer.orgId && job.source === channel.dataSource,
    );

    const pendingCount = arrivals.filter((arrival) => arrival.status === "pending").length;

    const lastActivityAt = [
      ...arrivals.map((arrival) => arrival.arrivedAt),
      ...jobs.map((job) => job.createdAt),
    ].reduce<number | undefined>(
      (latest, timestamp) => (latest === undefined || timestamp > latest ? timestamp : latest),
      undefined,
    );

    return {
      ...channel,
      pendingCount,
      lastActivityAt,
      connection: findConnection(db, viewer.orgId, channel.dataSource),
    };
  });
}

export interface PendingArrivalRow extends PendingArrival {
  /** Set when this arrival's external key already matches a recorded batch: confirming it will update, not create. */
  updateOf?: { reference: string; name: string };
}

/**
 * Replicates `findByExternalKey` from `operations/batches.ts` (private to that
 * module) so the inbox can show the create-vs-update notice before a human
 * confirms: matching on the same (external system, external record) pair.
 */
export function listPendingArrivals(
  db: MockDatabase,
  viewer: ViewerScope,
  opts: { channel?: DataSource } = {},
): PendingArrivalRow[] {
  return db.pendingArrivals
    .filter((arrival) => arrival.ownerOrgId === viewer.orgId && arrival.status === "pending")
    .filter((arrival) => !opts.channel || arrival.channel === opts.channel)
    .sort((left, right) => right.arrivedAt - left.arrivedAt)
    .map((arrival) => {
      const match = arrival.externalRecordId
        ? db.resourceBatches.find(
            (batch) =>
              batch.externalSystemName === arrival.externalSystemName &&
              batch.externalRecordId === arrival.externalRecordId,
          )
        : undefined;

      return {
        ...arrival,
        updateOf: match ? { reference: match.reference, name: match.name } : undefined,
      };
    });
}

/** Batches in the viewer's org that came in through the sorting channel, newest first. */
export function listRetexcirBatches(db: MockDatabase, viewer: ViewerScope): ResourceBatch[] {
  return db.resourceBatches
    .filter(
      (batch) =>
        batch.ownerOrgId === viewer.orgId &&
        batch.dataSource === "sorting_system" &&
        !batch.deletedAt,
    )
    .sort((left, right) => (right.importedAt ?? right.createdAt) - (left.importedAt ?? left.createdAt));
}

/**
 * Every record Retexcir has handed over, accepted or rejected. Transfers carry
 * no org of their own, so ownership is read from what each one points at.
 */
export function listRetexcirTransfers(
  db: MockDatabase,
  viewer: ViewerScope,
): IntegrationTransfer[] {
  return db.integrationTransfers
    .filter(
      (transfer) =>
        transfer.direction === "inbound" &&
        transfer.externalSystemName === RETEXCIR.systemName &&
        ownsTransfer(db, transfer, viewer.orgId),
    )
    .sort((left, right) => right.createdAt - left.createdAt);
}

export function listIntakeJobs(db: MockDatabase, viewer: ViewerScope): ImportJob[] {
  return db.importJobs
    .filter((job) => job.orgId === viewer.orgId)
    .sort((left, right) => right.createdAt - left.createdAt);
}
