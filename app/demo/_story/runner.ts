/**
 * The story runner.
 *
 * Going back replays from beat zero rather than undoing. That is not laziness
 * dressed as design — an undo stack for a ledger means storing the inverse of
 * every movement, and an inverse that drifts from its movement is exactly the
 * class of bug the ledger exists to prevent. Thirty beats over an in-memory
 * database rebuild in under a millisecond.
 */

import { atTime } from "../_mock/clock";
import { createMockDatabase } from "../_mock/data";
import type { Id, MockDatabase } from "../_mock/types";
import { createEmptyDatabase } from "./empty";
import { flattenBeats, type FlatBeat, type StoryContext, type StoryScript } from "./types";

export interface StoryState {
  db: MockDatabase;
  ids: Record<string, Id>;
  /** The beat the viewer is looking at, or `undefined` before the first one. */
  current?: FlatBeat;
  /** Set when a beat threw: the rule the script broke, shown in the dock. */
  error?: string;
}

function createContext(ids: Record<string, Id>): StoryContext {
  return {
    ids,
    remember: (key, id) => {
      ids[key] = id;
    },
    recall: (key) => {
      const id = ids[key];

      if (!id) {
        throw new Error(
          `Story beat asked for "${key}" before any earlier beat produced it.`,
        );
      }

      return id;
    },
  };
}

export function startingDatabase(script: StoryScript): MockDatabase {
  return script.start === "empty" ? createEmptyDatabase() : createMockDatabase();
}

/**
 * Replays the script up to and including `index`. Pass `-1` for the starting
 * state, which is what the title card shows.
 */
export function runTo(script: StoryScript, index: number): StoryState {
  const beats = flattenBeats(script);
  const ids: Record<string, Id> = {};
  const context = createContext(ids);

  let db = startingDatabase(script);

  for (const entry of beats.slice(0, index + 1)) {
    if (!entry.beat.run) {
      continue;
    }

    try {
      /* The clock pin is what makes `dispatchedAt`, milestone actuals and audit
         timestamps land on the story's date instead of this afternoon. */
      db = atTime(entry.beat.at, () => entry.beat.run!(db, context));
    } catch (cause) {
      return {
        db,
        ids,
        current: entry,
        error: cause instanceof Error ? cause.message : String(cause),
      };
    }
  }

  return { db, ids, current: index >= 0 ? beats[index] : undefined };
}
