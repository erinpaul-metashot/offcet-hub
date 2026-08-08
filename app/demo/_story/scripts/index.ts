/** The script catalogue. Order here is the order on the picker. */

import type { StoryScript } from "../types";
import { fullJourney } from "./full-journey";
import { followTheQuantity } from "./follow-the-quantity";
import { proveIt } from "./prove-it";
import { whenTheAnswerIsNo } from "./when-the-answer-is-no";
import { theDamagedArrival } from "./the-damaged-arrival";
import { theOpenWindow } from "./the-open-window";

export const STORY_SCRIPTS: StoryScript[] = [
  fullJourney,
  followTheQuantity,
  proveIt,
  whenTheAnswerIsNo,
  theDamagedArrival,
  theOpenWindow,
];

export function findScript(id: string): StoryScript | undefined {
  return STORY_SCRIPTS.find((script) => script.id === id);
}
