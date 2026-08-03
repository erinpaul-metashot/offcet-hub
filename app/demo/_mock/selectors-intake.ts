/**
 * Reads for the intake hub, the arrivals inbox, and the mapping wizard
 * (05_SYSTEM_DESIGN §7). Org-scoped like every other selector — a manufacturer
 * only ever sees its own channels, arrivals, and import history.
 */

import { INTAKE_CHANNELS, type DataSource, type IntakeChannelConfig } from "./domain";
import type { ImportJob, MockDatabase, PendingArrival } from "./types";
import type { ViewerScope } from "./visibility";

export interface IntakeChannelRow extends IntakeChannelConfig {
  pendingCount: number;
  lastActivityAt?: number;
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

    return { ...channel, pendingCount, lastActivityAt };
  });
}

export interface PendingArrivalRow extends PendingArrival {
  /** Set when this arrival's external key already matches a recorded batch — confirming it will update, not create. */
  updateOf?: { reference: string; name: string };
}

/**
 * Replicates `findByExternalKey` from `operations/batches.ts` (private to that
 * module) so the inbox can show the create-vs-update notice before a human
 * confirms — matching on the same (external system, external record) pair.
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

export function listIntakeJobs(db: MockDatabase, viewer: ViewerScope): ImportJob[] {
  return db.importJobs
    .filter((job) => job.orgId === viewer.orgId)
    .sort((left, right) => right.createdAt - left.createdAt);
}
