/**
 * Facilities — the physical sites an organisation operates.
 *
 * A source facility is tracked separately from the organisation (§5), so a
 * batch can say which plant it actually came from. Site contact details are
 * personal data and are stripped for anyone outside the owning organisation.
 */

import { appendAudit, diffFields } from "../audit";
import type { FacilityType } from "../domain";
import { makeId } from "../ids";
import type { Facility, Id, MockDatabase } from "../types";
import type { ViewerScope } from "../visibility";
import {
  OperationError,
  insertRow,
  optionalCoordinate,
  optionalEmail,
  optionalText,
  patchRow,
  requireCountryCode,
  requireRow,
  requireText,
} from "./helpers";

/**
 * Every writable column of the `facilities` table (06_DATA_MODEL §facilities).
 * `isActive` is absent — it only ever moves through `setFacilityActive`.
 */
export interface FacilityInput {
  name: string;
  type: FacilityType;
  addressLine: string;
  city?: string;
  postcode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  /** Protected field — never shown to brands (§6). */
  contactName?: string;
  /** Protected field. */
  contactEmail?: string;
  /**
   * Whose site this is. Omitted, it is the actor's own organisation; only a
   * CIRKA admin may name a different one, managing that org on its behalf.
   */
  orgId?: Id;
}

/** Sites are addressed and mapped, so both are validated in one place. */
function facilityLocation(input: Pick<FacilityInput, "latitude" | "longitude">) {
  return {
    latitude: optionalCoordinate(input.latitude, 90, "Latitude must be between -90 and 90."),
    longitude: optionalCoordinate(input.longitude, 180, "Longitude must be between -180 and 180."),
  };
}

/** A site name has to be unambiguous within the organisation that reads it. */
function assertNameFree(db: MockDatabase, orgId: Id, name: string, exceptId?: Id): void {
  const clash = db.facilities.find(
    (facility) =>
      facility._id !== exceptId &&
      facility.orgId === orgId &&
      !facility.deletedAt &&
      facility.name.toLowerCase() === name.toLowerCase(),
  );

  if (clash) {
    throw new OperationError(`This organisation already has a site called ${clash.name}.`);
  }
}

function resolveOwningOrg(db: MockDatabase, actor: ViewerScope, orgId: Id | undefined): Id {
  const targetOrgId = orgId ?? actor.orgId;

  if (targetOrgId !== actor.orgId && actor.role !== "admin") {
    throw new OperationError("You can only add sites to your own organisation.");
  }

  const org = requireRow(db, "organisations", targetOrgId, "Organisation");

  if (org.deletedAt) {
    throw new OperationError(`${org.name} has been removed and cannot take on new sites.`);
  }

  return targetOrgId;
}

export function createFacility(
  db: MockDatabase,
  actor: ViewerScope,
  input: FacilityInput,
): { db: MockDatabase; facilityId: Id } {
  const orgId = resolveOwningOrg(db, actor, input.orgId);
  const name = requireText(input.name, "Give the facility a name.");
  const addressLine = requireText(input.addressLine, "A facility needs an address.");
  const country = requireCountryCode(input.country, "A facility needs a country.");

  assertNameFree(db, orgId, name);

  const facilityId = makeId("facility");

  const facility: Facility = {
    _id: facilityId,
    orgId,
    name,
    type: input.type,
    addressLine,
    city: optionalText(input.city),
    postcode: optionalText(input.postcode),
    country,
    ...facilityLocation(input),
    contactName: optionalText(input.contactName),
    contactEmail: optionalEmail(input.contactEmail),
    isActive: true,
    createdAt: Date.now(),
  };

  return {
    db: appendAudit(insertRow(db, "facilities", facility), {
      entityTable: "facilities",
      entityId: facilityId,
      action: "created",
      actorUserId: actor.userId,
      actorOrgId: actor.orgId,
      notes: `${name} added as a ${input.type} site.`,
    }),
    facilityId,
  };
}

export type FacilityPatch = Partial<Omit<FacilityInput, "orgId">>;

/**
 * Key-presence patch — a key sent as `undefined` clears the column, an absent
 * key leaves it alone. A site cannot change hands: the batches recorded at it
 * would silently move organisation with it.
 */
export function updateFacility(
  db: MockDatabase,
  actor: ViewerScope,
  args: { facilityId: Id; patch: FacilityPatch },
): MockDatabase {
  const facility = requireRow(db, "facilities", args.facilityId, "Facility");
  const input = args.patch;

  if (facility.orgId !== actor.orgId && actor.role !== "admin") {
    throw new OperationError("You can only edit your own organisation's sites.");
  }

  if (facility.deletedAt) {
    throw new OperationError("That site has been removed and can no longer be edited.");
  }

  const patch: Partial<Facility> = {};

  if ("name" in input) {
    patch.name = requireText(input.name, "Give the facility a name.");
    assertNameFree(db, facility.orgId, patch.name, facility._id);
  }

  if ("type" in input && input.type !== undefined) {
    patch.type = input.type;
  }

  if ("addressLine" in input) {
    patch.addressLine = requireText(input.addressLine, "A facility needs an address.");
  }

  if ("city" in input) {
    patch.city = optionalText(input.city);
  }

  if ("postcode" in input) {
    patch.postcode = optionalText(input.postcode);
  }

  if ("country" in input) {
    patch.country = requireCountryCode(input.country, "A facility needs a country.");
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

  if ("contactName" in input) {
    patch.contactName = optionalText(input.contactName);
  }

  if ("contactEmail" in input) {
    patch.contactEmail = optionalEmail(input.contactEmail);
  }

  const updated = patchRow(db, "facilities", args.facilityId, patch);

  return appendAudit(updated, {
    entityTable: "facilities",
    entityId: args.facilityId,
    action: "updated",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: diffFields(
      facility as unknown as Record<string, unknown>,
      patch as Record<string, unknown>,
    ),
  });
}

/**
 * Sites are deactivated rather than deleted — batches recorded against them
 * keep pointing at a real record.
 */
export function setFacilityActive(
  db: MockDatabase,
  actor: ViewerScope,
  args: { facilityId: Id; isActive: boolean },
): MockDatabase {
  const facility = requireRow(db, "facilities", args.facilityId, "Facility");

  if (facility.orgId !== actor.orgId && actor.role !== "admin") {
    throw new OperationError("You can only change your own organisation's sites.");
  }

  if (facility.deletedAt) {
    throw new OperationError("That site has been removed.");
  }

  if (facility.isActive === args.isActive) {
    throw new OperationError(
      args.isActive ? "That site is already active." : "That site is already deactivated.",
    );
  }

  const updated = patchRow(db, "facilities", args.facilityId, { isActive: args.isActive });

  return appendAudit(updated, {
    entityTable: "facilities",
    entityId: args.facilityId,
    action: "status_changed",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    fieldChanges: [
      {
        field: "isActive",
        previousValue: String(facility.isActive),
        newValue: String(args.isActive),
      },
    ],
    notes: args.isActive
      ? "Site reactivated."
      : "Site deactivated. Existing batches keep their reference to it.",
  });
}

/** Everything that would be left pointing at nothing if a site disappeared. */
export function countFacilityReferences(db: MockDatabase, facilityId: Id) {
  const batches = db.resourceBatches.filter(
    (batch) => batch.sourceFacilityId === facilityId && !batch.deletedAt,
  ).length;

  const allocations = db.allocations.filter(
    (allocation) =>
      (allocation.fromFacilityId === facilityId || allocation.toFacilityId === facilityId) &&
      !allocation.deletedAt,
  ).length;

  const production = db.productionBatches.filter(
    (batch) => batch.productionFacilityId === facilityId && !batch.deletedAt,
  ).length;

  return { batches, allocations, production, total: batches + allocations + production };
}

/**
 * Soft delete (§7.2), and only for a site nothing was ever recorded at. Once
 * material has moved through it the record has to survive, so the refusal
 * points at `setFacilityActive` instead — that is what "closed" means here.
 */
export function removeFacility(
  db: MockDatabase,
  actor: ViewerScope,
  args: { facilityId: Id },
): MockDatabase {
  const facility = requireRow(db, "facilities", args.facilityId, "Facility");

  if (facility.orgId !== actor.orgId && actor.role !== "admin") {
    throw new OperationError("You can only remove your own organisation's sites.");
  }

  if (facility.deletedAt) {
    throw new OperationError("That site has already been removed.");
  }

  const references = countFacilityReferences(db, args.facilityId);

  if (references.total > 0) {
    const parts = [
      references.batches > 0 && `${references.batches} resource batch(es)`,
      references.allocations > 0 && `${references.allocations} allocation(s)`,
      references.production > 0 && `${references.production} production batch(es)`,
    ].filter((part): part is string => typeof part === "string");

    throw new OperationError(
      `${parts.join(", ")} reference ${facility.name}. Deactivate it instead so that history keeps pointing at a real site.`,
    );
  }

  const updated = patchRow(db, "facilities", args.facilityId, {
    isActive: false,
    deletedAt: Date.now(),
  });

  return appendAudit(updated, {
    entityTable: "facilities",
    entityId: args.facilityId,
    action: "deleted",
    actorUserId: actor.userId,
    actorOrgId: actor.orgId,
    notes: `${facility.name} removed. Nothing had been recorded at it.`,
  });
}
