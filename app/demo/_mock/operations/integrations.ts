/**
 * Linking an org to an external system it pulls records from
 * (05_SYSTEM_DESIGN §7). Today that is Retexcir on the `sorting_system`
 * channel: material is uploaded and graded there, and CIRKA may only pull
 * records once someone in the org has connected the account.
 *
 * A connection is per-org, not per-user: one facility manager connects it and
 * the whole org's intake hub switches on.
 */

import { appendAudit } from "../audit";
import { RETEXCIR, type DataSource } from "../domain";
import { makeId } from "../ids";
import type { Id, IntegrationConnection, MockDatabase } from "../types";
import type { ViewerScope } from "../visibility";
import { insertRow, OperationError, patchRow, removeRow } from "./helpers";
import { now as currentTime } from "../clock";

export function findConnection(
  db: MockDatabase,
  orgId: Id,
  channel: DataSource,
): IntegrationConnection | undefined {
  return db.integrationConnections.find(
    (connection) => connection.orgId === orgId && connection.channel === channel,
  );
}

export interface ConnectRetexcirInput {
  accountRef: string;
}

/**
 * Stands in for the OAuth handshake the real integration will use: the account
 * reference is what Retexcir calls this customer, and it is what their webhook
 * will send back on every record.
 */
export function connectRetexcirAccount(
  db: MockDatabase,
  actor: ViewerScope,
  input: ConnectRetexcirInput,
): MockDatabase {
  if (findConnection(db, actor.orgId, "sorting_system")) {
    throw new OperationError(`${RETEXCIR.systemName} is already connected for this organisation.`);
  }

  const accountRef = input.accountRef.trim().toUpperCase();

  if (!accountRef) {
    throw new OperationError(`Enter the ${RETEXCIR.systemName} account reference to connect.`);
  }

  if (!RETEXCIR.accountRefPattern.test(accountRef)) {
    throw new OperationError(
      `"${input.accountRef.trim()}" is not a ${RETEXCIR.systemName} account reference. They look like ${RETEXCIR.accountRefExample}.`,
    );
  }

  const connection: IntegrationConnection = {
    _id: makeId("connection"),
    orgId: actor.orgId,
    channel: "sorting_system",
    externalSystemName: RETEXCIR.systemName,
    accountRef,
    connectedAt: currentTime(),
    connectedByUserId: actor.userId,
  };

  return appendAudit(insertRow(db, "integrationConnections", connection), {
    entityTable: "integrationConnections",
    entityId: connection._id,
    action: "created",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Connected ${RETEXCIR.systemName} account ${accountRef}.`,
  });
}

/** Unlinks the account. Records already confirmed into batches are untouched. */
export function disconnectRetexcirAccount(db: MockDatabase, actor: ViewerScope): MockDatabase {
  const connection = findConnection(db, actor.orgId, "sorting_system");

  if (!connection) {
    throw new OperationError(`${RETEXCIR.systemName} is not connected for this organisation.`);
  }

  const stillPending = db.pendingArrivals.filter(
    (arrival) =>
      arrival.ownerOrgId === actor.orgId &&
      arrival.channel === "sorting_system" &&
      arrival.status === "pending",
  ).length;

  if (stillPending > 0) {
    throw new OperationError(
      `Confirm or skip the ${stillPending} pulled record${stillPending === 1 ? "" : "s"} before disconnecting.`,
    );
  }

  return appendAudit(removeRow(db, "integrationConnections", connection._id), {
    entityTable: "integrationConnections",
    entityId: connection._id,
    action: "deleted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `Disconnected ${RETEXCIR.systemName} account ${connection.accountRef}.`,
  });
}

/** Stamps the sync clock after a successful pull. */
export function markConnectionSynced(
  db: MockDatabase,
  connectionId: Id,
  at: number,
): MockDatabase {
  return patchRow(db, "integrationConnections", connectionId, { lastSyncedAt: at });
}
