/**
 * Story mode: the walkthrough as a timeline being written live.
 *
 * A script is not a slideshow. Every beat that changes anything runs a real
 * `_mock/operations/` function against the same database the screens read, with
 * the clock pinned to the beat's date. What the viewer sees after pressing Next
 * is the product's actual response, not a picture of it — which means a script
 * that violates a ledger rule fails loudly rather than lying convincingly.
 */

import type { CirkaRole } from "../_mock/domain";
import type { Id, MockDatabase, Timestamp } from "../_mock/types";

/** Ids minted while the story runs, so a later beat can refer to an earlier one. */
export interface StoryContext {
  /** `ids.jerseyBatch` — set by the beat that created it. */
  ids: Record<string, Id>;
  remember: (key: string, id: Id) => void;
  /** The id a previous beat stored, or a thrown error naming the missing beat. */
  recall: (key: string) => Id;
}

export interface StoryBeat {
  id: string;
  /** Whose screen the viewer is on. Drives the persona and the accent colour. */
  role: CirkaRole;
  /** One sentence, present tense: "Nordväst records 500 kg of jersey offcuts." */
  title: string;
  /** One supporting line. Why this step exists, or what to look at. */
  detail?: string;
  /** The story's date for this beat. Pins the clock so the record reads true. */
  at?: Timestamp;
  /**
   * Where to send the viewer. Omit to stay put. A function form is for records
   * the story itself created, whose ids do not exist until the beat runs.
   */
  route?: string | ((context: StoryContext) => string);
  /**
   * The mutation. Omit for a read-only beat — several of the best beats change
   * nothing and simply point at what the previous one produced.
   */
  run?: (db: MockDatabase, context: StoryContext) => MockDatabase;
}

export interface StoryAct {
  id: string;
  title: string;
  summary?: string;
  beats: StoryBeat[];
}

export interface StoryScript {
  id: string;
  title: string;
  /** The one-line pitch on the picker. */
  blurb: string;
  /** Roughly how long it takes to click through, in minutes. */
  minutes: number;
  /**
   * `empty` starts from a network with no material in it at all: every batch,
   * project and movement the viewer sees was written by a beat they watched.
   * `seeded` starts from the demo fixtures, for scripts that explain what is
   * already there rather than building it.
   */
  start: "empty" | "seeded";
  acts: StoryAct[];
}

/** Beats flattened with their act, which is how the runner and the dock use them. */
export interface FlatBeat {
  beat: StoryBeat;
  actIndex: number;
  act: StoryAct;
  index: number;
}

export function flattenBeats(script: StoryScript): FlatBeat[] {
  return script.acts.flatMap((act, actIndex) =>
    act.beats.map((beat) => ({ beat, act, actIndex, index: 0 })),
  ).map((entry, index) => ({ ...entry, index }));
}
