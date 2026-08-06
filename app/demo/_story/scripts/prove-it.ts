/**
 * "Prove it" — the claim, read backwards to its source.
 *
 * A brand says a bag is made from recovered jersey. This script takes that
 * sentence apart in the opposite direction to how the material travelled:
 * product, then production, then the hops, then the mill it left. Nothing here
 * mutates anything until the last act, where CIRKA approves the evidence that
 * turns "reported" into "assured".
 */

import { BATCH_JERSEY, DEMO_NOW, PROJECT_JERSEY } from "../../_mock/data";
import { ALLOC_JERSEY_TO_MAKER, ALLOC_JERSEY_TO_NODE } from "../../_mock/data/allocations";
import { PROD_FLEECE_LINER, PROD_JERSEY_TOTE } from "../../_mock/data/production";
import * as productionOps from "../../_mock/operations/production";
import { actor } from "../helpers";
import type { StoryScript } from "../types";

export const proveIt: StoryScript = {
  id: "prove-it",
  title: "Prove it",
  blurb:
    "A brand claims a tote is made from recovered jersey. Follow that claim backwards to the cutting room it came from — and see exactly where the record stops.",
  minutes: 4,
  start: "seeded",

  acts: [
    {
      id: "act-claim",
      title: "The claim",
      beats: [
        {
          id: "project",
          role: "brand",
          route: `/demo/brand/projects/${PROJECT_JERSEY}`,
          title: "Bythorn's project page makes a claim",
          detail:
            "Units produced, material diverted, an assurance level. Every one of those numbers is a link, not a statement — this is the difference between a sustainability report and a record.",
        },
        {
          id: "report",
          role: "brand",
          route: `/demo/brand/projects/${PROJECT_JERSEY}/report`,
          title: "The report is generated, not written",
          detail:
            "Nobody typed these figures. They are the ledger and the production log rendered — which is why they can be checked.",
        },
      ],
    },

    {
      id: "act-production",
      title: "Where the product was made",
      beats: [
        {
          id: "production",
          role: "maker",
          route: `/demo/maker/production/${PROD_JERSEY_TOTE}`,
          title: "The run that made them",
          detail:
            "Material in, product out, and the difference accounted for: incorporated, offcuts, loss, returned. A yield the maker measured rather than estimated.",
        },
        {
          id: "evidence",
          role: "admin",
          route: `/demo/admin/production/${PROD_JERSEY_TOTE}`,
          title: "The evidence behind the numbers",
          detail:
            "Photographs, weigh-in tickets, cutting sheets. CIRKA's review is what separates a reported figure from an assured one.",
        },
      ],
    },

    {
      id: "act-journey",
      title: "How it got there",
      beats: [
        {
          id: "maker-hop",
          role: "admin",
          route: `/demo/admin/allocations/${ALLOC_JERSEY_TO_MAKER}`,
          title: "Second hop: resource node to workshop",
          detail:
            "Open the journey panel. Proposed, accepted, dispatched, received — each with a date, an organisation and a person. The panel also says how many of those events are withheld from the brand: production costs, supplier pricing, a maker's margins. The count is visible; the content never is.",
        },
        {
          id: "node-hop",
          role: "admin",
          route: `/demo/admin/allocations/${ALLOC_JERSEY_TO_NODE}`,
          title: "First hop: mill to resource node",
          detail:
            "The chain of custody is not a diagram someone drew afterwards. It is what is left behind when each hop is recorded as it happens.",
        },
        {
          id: "origin",
          role: "manufacturer",
          route: `/demo/manufacturer/batches/${BATCH_JERSEY}`,
          title: "Origin: a cutting room in Norrköping",
          detail:
            "The batch the claim resolves to, with its composition verified by CIRKA rather than asserted by its owner. This is the end of the chain.",
        },
      ],
    },

    {
      id: "act-limits",
      title: "Where the record stops",
      summary: "Traceability is not transparency. The difference is deliberate.",
      beats: [
        {
          id: "assure",
          role: "admin",
          at: DEMO_NOW,
          route: `/demo/admin/production/${PROD_FLEECE_LINER}`,
          title: "And CIRKA is the only role that can assure it",
          detail:
            "Here is another run waiting on exactly that decision. Approving it is what turns its maker's report into an assured claim — recorded with a name against it, like everything else.",
          run: (db) =>
            productionOps.reviewEvidence(db, actor(db, "admin"), {
              productionBatchId: PROD_FLEECE_LINER,
              approve: true,
              reviewNotes: "Weights reconcile to the ledger; output count matches the photography.",
            }),
        },
      ],
    },
  ],
};
