/** Administration: accounts, organisations, the action queue and transfers. */

import { appendAudit, diffFields } from "../audit";
import type { AccountStatus, OrganisationStatus, OrganisationType, CirkaRole, OrgRole } from "../domain";
import { makeId } from "../ids";
import type { Id, MockDatabase, Organisation, User } from "../types";
import type { ViewerScope } from "../visibility";
import {
  OperationError,
  insertRow,
  optionalCoordinate,
  optionalText,
  patchRow,
  requireCountryCode,
  requireEmail,
  requireRow,
  requireText,
} from "./helpers";
import { now as currentTime } from "../clock";

export function reviewUser(
  db: MockDatabase,
  actor: ViewerScope,
  args: { userId: Id; status: AccountStatus; reviewNotes?: string },
): MockDatabase {
  const user = requireRow(db, "users", args.userId, "User");

  if (user.role === "admin" && args.status !== user.status) {
    throw new OperationError("Admin accounts cannot have their approval status changed here.");
  }

  if (args.status === "rejected") {
    requireText(args.reviewNotes, "Give the applicant a reason for the rejection.");
  }

  const updated = patchRow(db, "users", args.userId, {
    status: args.status,
    reviewedAt: currentTime(),
    reviewedBy: actor.userId,
    reviewNotes: args.reviewNotes?.trim() || undefined,
  });

  return appendAudit(updated, {
    entityTable: "users",
    entityId: args.userId,
    action: args.status === "approved" ? "approved" : "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: user.status, newValue: args.status }],
    notes: args.reviewNotes,
  });
}

/**
 * Users are disabled, never deleted: §20 requires history to survive the
 * person leaving.
 */
export function setUserDisabled(
  db: MockDatabase,
  actor: ViewerScope,
  args: { userId: Id; disabled: boolean; note?: string },
): MockDatabase {
  const user = requireRow(db, "users", args.userId, "User");

  if (user.role === "admin") {
    throw new OperationError("Admin accounts cannot be disabled from this screen.");
  }

  if (args.disabled) {
    assertOwnerRemains(db, user);
  }

  const status: AccountStatus = args.disabled ? "disabled" : "approved";

  const updated = patchRow(db, "users", args.userId, {
    status,
    reviewedAt: currentTime(),
    reviewedBy: actor.userId,
    reviewNotes: args.note?.trim() || user.reviewNotes,
  });

  return appendAudit(updated, {
    entityTable: "users",
    entityId: args.userId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: user.status, newValue: status }],
    notes: args.disabled
      ? "Account disabled. Records and audit entries retained."
      : "Account re-enabled.",
  });
}

export function updateUserDetails(
  db: MockDatabase,
  actor: ViewerScope,
  args: { userId: Id; name: string; phone?: string },
): MockDatabase {
  const user = requireRow(db, "users", args.userId, "User");
  const name = requireText(args.name, "Enter a valid name.");

  const patch = { name, phone: args.phone?.trim() || undefined };
  const updated = patchRow(db, "users", args.userId, patch);

  return appendAudit(updated, {
    entityTable: "users",
    entityId: args.userId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: diffFields(user as unknown as Record<string, unknown>, patch),
  });
}

export interface UserInput {
  name: string;
  /** Protected: stripped for anyone outside the person's own organisation (§6). */
  email: string;
  /** Protected in the same way. Optional: data minimisation, per the compliance report. */
  phone?: string;
  role: CirkaRole;
  orgRole: OrgRole;
  orgId: Id;
}

/** One login per address, so an account is never ambiguous. */
function assertEmailFree(db: MockDatabase, email: string, exceptUserId?: Id): void {
  const clash = db.users.find(
    (user) =>
      user._id !== exceptUserId && !user.deletedAt && user.email.toLowerCase() === email,
  );

  if (clash) {
    throw new OperationError(`${email} already has an account on CIRKA.`);
  }
}

/** An organisation must keep someone who can manage its own settings (§20). */
function assertOwnerRemains(db: MockDatabase, user: User, next: { orgRole?: OrgRole } = {}): void {
  if (user.orgRole !== "owner" || next.orgRole === "owner") {
    return;
  }

  const otherOwners = db.users.filter(
    (entry) =>
      entry._id !== user._id &&
      entry.orgId === user.orgId &&
      entry.orgRole === "owner" &&
      entry.status !== "disabled" &&
      !entry.deletedAt,
  );

  if (otherOwners.length === 0) {
    throw new OperationError(
      "This is the organisation's only owner. Make someone else an owner first.",
    );
  }
}

export function createUser(
  db: MockDatabase,
  actor: ViewerScope,
  input: UserInput,
): { db: MockDatabase; userId: Id } {
  const name = requireText(input.name, "Name is required.");
  const email = requireEmail(input.email, "Email is required.");
  const org = requireRow(db, "organisations", input.orgId, "Organisation");

  if (org.deletedAt) {
    throw new OperationError(`${org.name} has been removed and cannot take on new people.`);
  }

  assertEmailFree(db, email);

  const userId = makeId("user");
  const user: User = {
    _id: userId,
    authUserId: `mock_auth_${userId}`,
    orgId: input.orgId,
    email,
    name,
    phone: optionalText(input.phone),
    role: input.role,
    orgRole: input.orgRole,
    status: "approved",
    createdAt: currentTime(),
    reviewedAt: currentTime(),
    reviewedBy: actor.userId,
  };

  return {
    db: appendAudit(insertRow(db, "users", user), {
      entityTable: "users",
      entityId: userId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      notes: `${name} added as a ${input.role} to ${org.name}.`,
    }),
    userId,
  };
}

/**
 * Key-presence patch, like `updateOrganisation`: a key sent as `undefined`
 * clears the column, an absent key leaves it alone.
 */
export function adminUpdateUser(
  db: MockDatabase,
  actor: ViewerScope,
  args: { userId: Id; patch: Partial<UserInput> },
): MockDatabase {
  const user = requireRow(db, "users", args.userId, "User");
  const input = args.patch;

  if (user.deletedAt) {
    throw new OperationError("That person has been removed and can no longer be edited.");
  }

  const patch: Partial<User> = {};

  if ("name" in input) {
    patch.name = requireText(input.name, "Name is required.");
  }

  if ("email" in input) {
    patch.email = requireEmail(input.email, "Email is required.");
    assertEmailFree(db, patch.email, user._id);
  }

  if ("phone" in input) {
    patch.phone = optionalText(input.phone);
  }

  if ("role" in input && input.role !== undefined && input.role !== user.role) {
    if (user.role === "admin") {
      throw new OperationError("A CIRKA admin cannot be reassigned to another role here.");
    }

    patch.role = input.role;
  }

  if ("orgRole" in input && input.orgRole !== undefined && input.orgRole !== user.orgRole) {
    assertOwnerRemains(db, user, { orgRole: input.orgRole });
    patch.orgRole = input.orgRole;
  }

  if ("orgId" in input && input.orgId !== undefined && input.orgId !== user.orgId) {
    const org = requireRow(db, "organisations", input.orgId, "Organisation");

    if (org.deletedAt) {
      throw new OperationError(`${org.name} has been removed and cannot take on new people.`);
    }

    assertOwnerRemains(db, user);
    patch.orgId = input.orgId;
  }

  const updated = patchRow(db, "users", args.userId, patch);

  return appendAudit(updated, {
    entityTable: "users",
    entityId: args.userId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: diffFields(
      user as unknown as Record<string, unknown>,
      patch as Record<string, unknown>,
    ),
  });
}

/**
 * Soft delete (§7.2). §20 requires the history to survive the person leaving,
 * so the row stays and every read model filters on `deletedAt`. The account is
 * also disabled, so a status-only query never treats it as live.
 *
 * `setUserDisabled` is the lighter action: use it when someone is expected
 * back. This one is for a person who has left the organisation for good.
 */
export function removeUser(
  db: MockDatabase,
  actor: ViewerScope,
  args: { userId: Id; note?: string },
): MockDatabase {
  const user = requireRow(db, "users", args.userId, "User");

  if (user.deletedAt) {
    throw new OperationError("That person has already been removed.");
  }

  if (user.role === "admin") {
    throw new OperationError("CIRKA admin accounts cannot be removed from this screen.");
  }

  if (user._id === actor.userId) {
    throw new OperationError("You cannot remove your own account.");
  }

  assertOwnerRemains(db, user);

  const updated = patchRow(db, "users", args.userId, {
    status: "disabled",
    deletedAt: currentTime(),
    reviewedAt: currentTime(),
    reviewedBy: actor.userId,
    reviewNotes: optionalText(args.note) ?? user.reviewNotes,
  });

  return appendAudit(updated, {
    entityTable: "users",
    entityId: args.userId,
    action: "deleted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: user.status, newValue: "disabled" }],
    notes:
      optionalText(args.note) ??
      `${user.name} removed from the organisation. Their audit history is retained.`,
  });
}

export function reviewOrganisation(
  db: MockDatabase,
  actor: ViewerScope,
  args: { orgId: Id; status: OrganisationStatus; note?: string },
): MockDatabase {
  const org = requireRow(db, "organisations", args.orgId, "Organisation");

  const updated = patchRow(db, "organisations", args.orgId, {
    status: args.status,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "organisations",
    entityId: args.orgId,
    action: args.status === "approved" ? "approved" : "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: org.status, newValue: args.status }],
    notes: args.note,
  });
}

/* ------------------------------------------------------------------ *
 * Organisations: 06_DATA_MODEL §organisations
 * ------------------------------------------------------------------ */

/**
 * Every writable column of the `organisations` table. Two are deliberately
 * absent: `status` only ever moves through `reviewOrganisation`, and `_id`,
 * `createdAt`, `updatedAt`, `deletedAt` are the store's to set.
 */
export interface OrganisationInput {
  name: string;
  type: OrganisationType;
  /** Company number. Protected: stripped for anyone but the org and CIRKA (§6). */
  registrationNumber?: string;
  /** VAT / tax reference. Protected in the same way. */
  taxId?: string;
  country: string;
  addressLine?: string;
  city?: string;
  postcode?: string;
  /** Used for distance-based custodian suggestions. */
  latitude?: number;
  longitude?: number;
  websiteUrl?: string;
  description?: string;
  capabilityTags?: string[];
}

/** A bare host is stored with a scheme so the link always resolves. */
function optionalWebsite(value: string | undefined): string | undefined {
  const trimmed = optionalText(value);

  if (!trimmed) {
    return undefined;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (!url.hostname.includes(".")) {
      throw new Error("hostname has no dot");
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    throw new OperationError("Website must be a valid address, for example https://example.com.");
  }
}

/** Tags are matched on, so they are trimmed, lower-cased and de-duplicated. */
function normaliseCapabilityTags(tags: string[] | undefined): string[] {
  const seen = new Set<string>();

  return (tags ?? []).reduce<string[]>((accumulated, raw) => {
    const tag = raw.trim().toLowerCase();

    if (!tag || seen.has(tag)) {
      return accumulated;
    }

    seen.add(tag);
    return [...accumulated, tag];
  }, []);
}

/** A company number identifies one legal entity, so it cannot be shared. */
function assertRegistrationNumberFree(
  db: MockDatabase,
  registrationNumber: string | undefined,
  exceptOrgId?: Id,
): void {
  if (!registrationNumber) {
    return;
  }

  const clash = db.organisations.find(
    (org) =>
      org._id !== exceptOrgId &&
      !org.deletedAt &&
      org.registrationNumber?.toLowerCase() === registrationNumber.toLowerCase(),
  );

  if (clash) {
    throw new OperationError(
      `${clash.name} is already registered with company number ${registrationNumber}.`,
    );
  }
}

export function createOrganisation(
  db: MockDatabase,
  actor: ViewerScope,
  input: OrganisationInput,
): { db: MockDatabase; orgId: Id } {
  const name = requireText(input.name, "Organisation name is required.");
  const country = requireCountryCode(input.country);
  const registrationNumber = optionalText(input.registrationNumber);

  if (input.type === "cirka" && db.organisations.some((org) => org.type === "cirka" && !org.deletedAt)) {
    throw new OperationError("CIRKA is already in the network. There can only be one.");
  }

  assertRegistrationNumberFree(db, registrationNumber);

  const orgId = makeId("org");
  const org: Organisation = {
    _id: orgId,
    name,
    type: input.type,
    status: "pending",
    registrationNumber,
    taxId: optionalText(input.taxId),
    country,
    addressLine: optionalText(input.addressLine),
    city: optionalText(input.city),
    postcode: optionalText(input.postcode),
    latitude: optionalCoordinate(input.latitude, 90, "Latitude must be between -90 and 90."),
    longitude: optionalCoordinate(input.longitude, 180, "Longitude must be between -180 and 180."),
    websiteUrl: optionalWebsite(input.websiteUrl),
    description: optionalText(input.description),
    capabilityTags: normaliseCapabilityTags(input.capabilityTags),
    createdAt: currentTime(),
  };

  return {
    db: appendAudit(insertRow(db, "organisations", org), {
      entityTable: "organisations",
      entityId: orgId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      notes: `${name} registered as a ${input.type}.`,
    }),
    orgId,
  };
}

/**
 * Only the keys present on the patch are touched, so a screen can send a
 * partial edit. A key present with `undefined` clears the column: that is how
 * an optional field is emptied.
 */
export function updateOrganisation(
  db: MockDatabase,
  actor: ViewerScope,
  args: { orgId: Id; patch: Partial<OrganisationInput> },
): MockDatabase {
  const org = requireRow(db, "organisations", args.orgId, "Organisation");
  const input = args.patch;

  if (org.deletedAt) {
    throw new OperationError("That organisation has been removed and can no longer be edited.");
  }

  if (input.type !== undefined && input.type !== org.type) {
    throw new OperationError(
      "An organisation's type is fixed at registration. Register a new organisation instead.",
    );
  }

  const patch: Partial<Organisation> = {};

  if ("name" in input) {
    patch.name = requireText(input.name, "Organisation name is required.");
  }

  if ("country" in input) {
    patch.country = requireCountryCode(input.country);
  }

  if ("registrationNumber" in input) {
    patch.registrationNumber = optionalText(input.registrationNumber);
    assertRegistrationNumberFree(db, patch.registrationNumber, org._id);
  }

  if ("taxId" in input) {
    patch.taxId = optionalText(input.taxId);
  }

  if ("addressLine" in input) {
    patch.addressLine = optionalText(input.addressLine);
  }

  if ("city" in input) {
    patch.city = optionalText(input.city);
  }

  if ("postcode" in input) {
    patch.postcode = optionalText(input.postcode);
  }

  if ("latitude" in input) {
    patch.latitude = optionalCoordinate(input.latitude, 90, "Latitude must be between -90 and 90.");
  }

  if ("longitude" in input) {
    patch.longitude = optionalCoordinate(
      input.longitude,
      180,
      "Longitude must be between -180 and 180.",
    );
  }

  if ("websiteUrl" in input) {
    patch.websiteUrl = optionalWebsite(input.websiteUrl);
  }

  if ("description" in input) {
    patch.description = optionalText(input.description);
  }

  if ("capabilityTags" in input) {
    const tags = normaliseCapabilityTags(input.capabilityTags);

    /* Arrays never compare equal by reference, so only send a real change. */
    if (tags.join(" ") !== org.capabilityTags.join(" ")) {
      patch.capabilityTags = tags;
    }
  }

  const updated = patchRow(db, "organisations", args.orgId, {
    ...patch,
    updatedAt: currentTime(),
  });

  return appendAudit(updated, {
    entityTable: "organisations",
    entityId: args.orgId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: diffFields(
      org as unknown as Record<string, unknown>,
      patch as Record<string, unknown>,
    ),
  });
}

/**
 * Soft delete (§7.2). Batches, allocations and audit entries keep pointing at a
 * real organisation row; every read model already filters on `deletedAt`.
 */
export function deleteOrganisation(
  db: MockDatabase,
  actor: ViewerScope,
  args: { orgId: Id },
): MockDatabase {
  const org = requireRow(db, "organisations", args.orgId, "Organisation");

  if (org.type === "cirka") {
    throw new OperationError("The CIRKA organisation cannot be removed.");
  }

  if (org.deletedAt) {
    throw new OperationError("That organisation has already been removed.");
  }

  const now = currentTime();
  const updated = patchRow(db, "organisations", args.orgId, { deletedAt: now, updatedAt: now });

  return appendAudit(updated, {
    entityTable: "organisations",
    entityId: args.orgId,
    action: "deleted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: "Organisation removed. Records that reference it keep their history.",
  });
}

export function closeActionItem(
  db: MockDatabase,
  actor: ViewerScope,
  args: { actionItemId: Id; dismiss?: boolean; note: string },
): MockDatabase {
  const item = requireRow(db, "actionItems", args.actionItemId, "Action item");
  const note = requireText(args.note, "Record how this was handled.");

  if (item.status !== "open") {
    throw new OperationError("This item is already closed.");
  }

  const updated = patchRow(db, "actionItems", args.actionItemId, {
    status: args.dismiss ? "dismissed" : "resolved",
    resolvedAt: currentTime(),
    resolvedByUserId: actor.userId,
    resolutionNote: note,
  });

  return appendAudit(updated, {
    entityTable: "actionItems",
    entityId: args.actionItemId,
    parentEntityTable: item.entityTable,
    parentEntityId: item.entityId,
    action: "reviewed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: note,
  });
}

/** Failed transfers surface on the admin queue and can be retried (§20). */
export function retryTransfer(
  db: MockDatabase,
  actor: ViewerScope,
  args: { transferId: Id },
): MockDatabase {
  const transfer = requireRow(db, "integrationTransfers", args.transferId, "Transfer");

  if (transfer.status === "success") {
    throw new OperationError("This transfer already succeeded.");
  }

  const updated = patchRow(db, "integrationTransfers", args.transferId, {
    status: "success",
    attemptCount: transfer.attemptCount + 1,
    lastAttemptAt: currentTime(),
    succeededAt: currentTime(),
    errorMessage: undefined,
    externalRecordId: transfer.externalRecordId ?? `TP-${currentTime().toString().slice(-6)}`,
    externalRecordUrl:
      transfer.externalRecordUrl ??
      `https://traceability.example/records/TP-${currentTime().toString().slice(-6)}`,
  });

  const withClosedAction: MockDatabase = {
    ...updated,
    actionItems: updated.actionItems.map((item) =>
      item.entityId === args.transferId && item.status === "open"
        ? {
            ...item,
            status: "resolved" as const,
            resolvedAt: currentTime(),
            resolvedByUserId: actor.userId,
            resolutionNote: "Transfer retried and succeeded.",
          }
        : item,
    ),
  };

  return appendAudit(withClosedAction, {
    entityTable: "integrationTransfers",
    entityId: args.transferId,
    parentEntityTable: transfer.entityTable,
    parentEntityId: transfer.entityId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [{ field: "status", previousValue: transfer.status, newValue: "success" }],
    notes: "Retried from the integration console.",
  });
}

/** Exports are audited so a funder can see who took what, and when. */
export function recordExport(
  db: MockDatabase,
  actor: ViewerScope,
  args: { exportName: string; format: "csv" | "json"; rowCount: number },
): MockDatabase {
  return appendAudit(db, {
    entityTable: "exports",
    entityId: args.exportName,
    action: "exported",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `${args.exportName} exported as ${args.format.toUpperCase()}: ${args.rowCount} rows.`,
  });
}
