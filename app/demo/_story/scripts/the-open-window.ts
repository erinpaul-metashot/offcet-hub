/**
 * "The open window" — the lot a requester can see but cannot take.
 *
 * A listed lot is visible because the manufacturer released it and CIRKA reviewed
 * it. That makes it available to enquire about, not available to claim: demand is
 * recorded, and CIRKA still decides who receives the material.
 */

import { DEMO_NOW } from "../../_mock/data";
import { BATCH_WOOL_COATING } from "../../_mock/data/batches";
import { ORG_GOTEBORG_HUB } from "../../_mock/data/orgs";
import * as demandOps from "../../_mock/operations/demand";
import * as marketplaceOps from "../../_mock/operations/marketplace";
import { actor, onlyMatch } from "../helpers";
import type { StoryScript } from "../types";

const hour = (offset: number) => DEMO_NOW + offset * 3_600_000;

export const theOpenWindow: StoryScript = {
  id: "the-open-window",
  title: "The open window",
  blurb:
    "A listed lot is a shop window, not a shelf. Makers and brands can enquire, but CIRKA still decides who receives it.",
  minutes: 4,
  start: "seeded",

  acts: [
    {
      id: "act-open-window",
      title: "The lot is visible",
      summary: "The material can be seen by the network, but it has not been promised to anyone.",
      beats: [
        {
          id: "marketplace",
          role: "maker",
          route: "/demo/maker/marketplace",
          title: "The maker sees the open window",
          detail:
            "Every lot here has been released by its manufacturer and reviewed by CIRKA. Nothing is hidden, and nothing is claimable.",
        },
        {
          id: "lot-detail",
          role: "maker",
          route: `/demo/maker/marketplace/${BATCH_WOOL_COATING}`,
          title: "The wool lot shows what is really uncommitted",
          detail:
            "The quantity pots bar separates what is genuinely available from what is already promised elsewhere. The listing is open because some of the batch is still uncommitted.",
        },
        {
          id: "maker-enquiry",
          role: "maker",
          at: hour(1),
          route: `/demo/maker/marketplace/${BATCH_WOOL_COATING}`,
          title: "The maker enquires for 120 kg",
          detail:
            "Not one kilo moved. No pot changed, because the enquiry is demand, not a hold.",
          run: (db, context) => {
            const next = marketplaceOps.requestListedLot(db, actor(db, "maker"), {
              batchId: BATCH_WOOL_COATING,
              quantity: 120,
              intendedUse: "Small-batch wool satchels and lined pouches",
              note: "Coating-weight wool preferred for structured accessories.",
            });

            context.remember("enquiry", next.requestId);
            return next.db;
          },
        },
        {
          id: "brand-enquiry",
          role: "brand",
          at: hour(2),
          route: `/demo/maker/marketplace/${BATCH_WOOL_COATING}`,
          title: "A brand enquires on the same lot",
          detail:
            "Two parties want the same material and both enquiries stand. The lot is not first-come-first-served.",
          run: (db, context) => {
            const next = marketplaceOps.requestListedLot(db, actor(db, "brand"), {
              batchId: BATCH_WOOL_COATING,
              quantity: 180,
              intendedUse: "Wool outerwear samples for a winter capsule",
              note: "Needs enough coating-weight wool for sampling before a larger brief.",
            });

            context.remember("brandEnquiry", next.requestId);
            return next.db;
          },
        },
        {
          id: "shortlist",
          role: "admin",
          route: (context) => `/demo/admin/matching/${context.recall("enquiry")}`,
          title: "CIRKA sees the named lot first",
          detail:
            "The enquired lot is pinned to the top of the shortlist because the requester named it. It is a stated preference, not a decision.",
        },
        {
          id: "reserve",
          role: "admin",
          at: hour(3),
          route: (context) => `/demo/admin/matching/${context.recall("enquiry")}`,
          title: "CIRKA proposes the maker's match",
          detail:
            "This is the moment quantity moves: available to reserved. Only an administrator can make that promise.",
          run: (db, context) =>
            demandOps.proposeMatch(db, actor(db, "admin"), {
              requestId: context.recall("enquiry"),
              batchId: BATCH_WOOL_COATING,
              quantityProposed: 120,
              rationale:
                "Atelier Rask asked for this exact coating-weight wool and only needs 120 kg, leaving enough uncommitted quantity for other demand on the lot.",
              suggestedCustodianOrgId: ORG_GOTEBORG_HUB,
              categoryFitNote: "Coating-weight wool suits structured accessories.",
              availabilityFitNote: "900 kg was uncommitted before this proposal.",
              distanceKm: 280,
            }),
        },
        {
          id: "approve",
          role: "admin",
          at: hour(4),
          route: (context) => `/demo/admin/matching/${context.recall("enquiry")}`,
          title: "CIRKA approves the allocation",
          detail:
            "The allocation now exists. The other enquiry is still open, and CIRKA owes that organisation an answer.",
          run: (db, context) =>
            demandOps.decideMatch(db, actor(db, "admin"), {
              matchId: onlyMatch(db, context.recall("enquiry")),
              approve: true,
              note: "Approved for the maker: the quantity is modest and the use fits the material.",
              custodianOrgId: ORG_GOTEBORG_HUB,
            }),
        },
      ],
    },
  ],
};
