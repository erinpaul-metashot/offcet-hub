/**
 * Small conveniences for writing beats.
 *
 * Scripts read as prose, so the noise of resolving a persona or digging an id
 * out of a table that an operation created but did not return lives here rather
 * than in the middle of a sentence about jersey offcuts.
 */

import { PERSONA_IDS } from "../_mock/store";
import type { CirkaRole } from "../_mock/domain";
import type { Allocation, Id, MockDatabase } from "../_mock/types";
import type { ViewerScope } from "../_mock/visibility";

/** The persona a beat acts as. */
export function actor(db: MockDatabase, role: CirkaRole): ViewerScope {
  const userId = PERSONA_IDS[role];
  const user = db.users.find((entry) => entry._id === userId);

  if (!user) {
    throw new Error(`Story tried to act as ${role} before that account existed.`);
  }

  return { userId: user._id, orgId: user.orgId, role: user.role };
}

/**
 * The allocation an operation just created. `decideMatch` and
 * `proposeAllocationToMaker` return only a database, so the beat that needs the
 * new allocation's id finds it the way the UI would: the newest one on the
 * batch heading where the beat sent it.
 */
export function newestAllocation(
  db: MockDatabase,
  predicate: (allocation: Allocation) => boolean,
): Id {
  const found = [...db.allocations]
    .filter(predicate)
    .sort((left, right) => right.createdAt - left.createdAt)[0];

  if (!found) {
    throw new Error("Story expected an allocation to have been created by now.");
  }

  return found._id;
}

/** The open action item an earlier beat raised, so a later beat can close it. */
export function openActionItem(db: MockDatabase, entityId: Id, kind: string): Id {
  const found = db.actionItems.find(
    (item) => item.entityId === entityId && item.kind === kind && item.status === "open",
  );

  if (!found) {
    throw new Error(`Story expected an open ${kind} action item by now.`);
  }

  return found._id;
}

/** The newest match on a request. Rejection scripts put two there. */
export function onlyMatch(db: MockDatabase, requestId: Id): Id {
  const found = [...db.matches]
    .filter((match) => match.requestId === requestId)
    .sort((left, right) => right.proposedAt - left.proposedAt)[0];

  if (!found) {
    throw new Error("Story expected a match on this request.");
  }

  return found._id;
}
