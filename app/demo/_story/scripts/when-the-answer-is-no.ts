/**
 * "When the answer is no" — the paths that do not end in a product.
 *
 * A demo that only ever shows the happy flow teaches the wrong thing. Here a
 * brand turns a match down and a request is closed with nothing found, and in
 * both cases the reasoning survives: a rejection in CIRKA is a record, not a
 * dead end.
 */

import { ORG_GOTEBORG_HUB } from "../../_mock/data/orgs";
import { BATCH_WOOL_COATING } from "../../_mock/data/batches";
import {
  MATCH_WINTER,
  PROJECT_LINEN,
  PROJECT_WINTER,
  REQUEST_LINEN,
  REQUEST_WINTER,
} from "../../_mock/data/demand";
import { DEMO_NOW } from "../../_mock/data";
import * as demandOps from "../../_mock/operations/demand";
import { actor, onlyMatch } from "../helpers";
import type { StoryScript } from "../types";

const hour = (offset: number) => DEMO_NOW + offset * 3_600_000;

export const whenTheAnswerIsNo: StoryScript = {
  id: "when-the-answer-is-no",
  title: "When the answer is no",
  blurb:
    "A brand rejects a match and a request finds nothing at all. Both refusals are recorded with their reasoning — which is what makes the next attempt better.",
  minutes: 4,
  start: "seeded",

  acts: [
    {
      id: "act-reject",
      title: "The brand says no",
      summary: "Merino was proposed for the winter accessories brief. It is not right.",
      beats: [
        {
          id: "proposal",
          role: "brand",
          route: `/demo/brand/approvals/${MATCH_WINTER}`,
          title: "CIRKA has proposed 300 kg of merino knit",
          detail:
            "The rationale, the fit notes and the distance are all on the proposal. The brand is being asked to decide, not to guess.",
        },
        {
          id: "reject",
          role: "brand",
          at: hour(1),
          route: `/demo/brand/approvals/${MATCH_WINTER}`,
          title: "The brand turns it down, and says why",
          detail:
            "A rejection without a reason teaches CIRKA nothing. This one names the problem, so the next proposal can avoid it.",
          run: (db) =>
            demandOps.decideMatch(db, actor(db, "brand"), {
              matchId: onlyMatch(db, REQUEST_WINTER),
              approve: false,
              note: "Knit panels will not hold the hem shape we need. Looking for a woven or a heavier carded wool instead.",
            }),
        },
        {
          id: "re-propose",
          role: "admin",
          at: hour(4),
          route: `/demo/admin/matching/${REQUEST_WINTER}`,
          title: "CIRKA proposes the coating wool instead",
          detail:
            "The reserved merino went straight back to available when the match was rejected — nothing is left stranded by a no.",
          run: (db, context) => {
            const next = demandOps.proposeMatch(db, actor(db, "admin"), {
              requestId: REQUEST_WINTER,
              batchId: BATCH_WOOL_COATING,
              quantityProposed: 300,
              rationale:
                "Carded wool at coating weight: heavier and more stable than the knit, which answers the hem note directly. 900 kg uncommitted, so a second colourway stays possible.",
              suggestedCustodianOrgId: ORG_GOTEBORG_HUB,
              categoryFitNote: "Woven-weight carded wool rather than knit.",
              availabilityFitNote: "900 kg uncommitted on the batch.",
              distanceKm: 210,
            });

            context.remember("secondMatch", onlyMatch(next, REQUEST_WINTER));
            return next;
          },
        },
        {
          id: "approve",
          role: "brand",
          at: hour(6),
          route: (context) => `/demo/brand/approvals/${context.recall("secondMatch")}`,
          title: "This one the brand approves",
          detail:
            "Two proposals, one request, both kept. Anyone reading this later can see what was tried and why it changed.",
          run: (db) =>
            demandOps.decideMatch(db, actor(db, "brand"), {
              matchId: onlyMatch(db, REQUEST_WINTER),
              approve: true,
              note: "Weight and hand are right. Proceed.",
              custodianOrgId: ORG_GOTEBORG_HUB,
            }),
        },
        {
          id: "trail",
          role: "admin",
          route: `/demo/admin/projects/${PROJECT_WINTER}`,
          title: "The rejected proposal is still in the record",
          detail:
            "It did not disappear when it was superseded. The history of a decision is part of the decision.",
        },
      ],
    },

    {
      id: "act-unfulfillable",
      title: "Nothing exists",
      summary: "Sometimes the honest answer is that the material is not there.",
      beats: [
        {
          id: "linen-request",
          role: "admin",
          route: "/demo/admin/requests",
          title: "200 kg of linen, submitted and unmatched",
          detail:
            "The only linen recorded is either still in draft with its owner or waiting on review. Neither can be matched.",
        },
        {
          id: "mark-unfulfillable",
          role: "admin",
          at: hour(8),
          route: "/demo/admin/requests",
          title: "CIRKA closes it as unfulfillable",
          detail:
            "The brand gets a reason and a date rather than silence. That is the difference between a marketplace and a broker who stops replying.",
          run: (db) =>
            demandOps.markRequestUnfulfillable(db, actor(db, "admin"), {
              requestId: REQUEST_LINEN,
              note: "No released linen in the network at this weight. Two batches are close but neither has cleared review — we will re-open this if either does.",
            }),
        },
        {
          id: "brand-sees",
          role: "brand",
          route: `/demo/brand/projects/${PROJECT_LINEN}`,
          title: "And the brand sees exactly that",
          detail:
            "An unfulfillable request is not a failure state to be hidden. It is the network telling a brand what it does not yet have.",
        },
      ],
    },
  ],
};
