/**
 * "The arrival that was damaged" — an exception handled by four people.
 *
 * The interesting part is not that something went wrong. It is that the
 * material stays accounted for the whole way through: flagged on arrival, split
 * between what was usable and what was not, and closed by a named decision
 * rather than an adjustment nobody signed.
 */

import { DEMO_NOW } from "../../_mock/data";
import { ALLOC_WEBBING_ACCEPTED } from "../../_mock/data/allocations";
import { BATCH_WEBBING } from "../../_mock/data/batches";
import * as adminOps from "../../_mock/operations/admin";
import * as allocationOps from "../../_mock/operations/allocations";
import { actor, openActionItem } from "../helpers";
import type { StoryScript } from "../types";

const hour = (offset: number) => DEMO_NOW + offset * 3_600_000;

export const theDamagedArrival: StoryScript = {
  id: "the-damaged-arrival",
  title: "The arrival that was damaged",
  blurb:
    "90 kg of webbing leaves the mill and 12 kg of it arrives unusable. Four roles, one exception, and a ledger that never stops balancing.",
  minutes: 4,
  start: "seeded",

  acts: [
    {
      id: "act-out",
      title: "It leaves",
      beats: [
        {
          id: "ready",
          role: "manufacturer",
          at: hour(1),
          route: "/demo/manufacturer/dispatch",
          title: "Nordväst confirms the webbing is ready",
          detail:
            "Readiness is its own step. It is what lets a custodian plan a bay before anything is on a lorry.",
          run: (db) =>
            allocationOps.confirmDispatchReadiness(db, actor(db, "manufacturer"), {
              allocationId: ALLOC_WEBBING_ACCEPTED,
              expectedDispatchDate: hour(2),
            }),
        },
        {
          id: "dispatch",
          role: "manufacturer",
          at: hour(2),
          route: "/demo/manufacturer/dispatch",
          title: "90 kg go out",
          detail:
            "Allocated becomes in transit. For the next two days nobody is holding this material, and the ledger says so plainly.",
          run: (db) =>
            allocationOps.recordDispatch(db, actor(db, "manufacturer"), {
              allocationId: ALLOC_WEBBING_ACCEPTED,
              quantityDispatched: 90,
              dispatchReference: "NVT-2026-0512",
              expectedArrivalDate: hour(30),
            }),
        },
      ],
    },

    {
      id: "act-issue",
      title: "It arrives wet",
      beats: [
        {
          id: "report",
          role: "custodian",
          at: hour(30),
          route: "/demo/custodian/arrivals",
          title: "Malmö flags the consignment before counting it",
          detail:
            "Raising an issue is separate from recording a quantity, because the two questions are different: what is wrong, and how much is there.",
          run: (db) =>
            allocationOps.reportArrivalIssue(db, actor(db, "custodian"), {
              allocationId: ALLOC_WEBBING_ACCEPTED,
              issue: "damaged",
              note: "Outer wrap torn on two rolls; tape water-stained through to the core.",
            }),
        },
        {
          id: "receive",
          role: "custodian",
          at: hour(32),
          route: "/demo/custodian/arrivals",
          title: "78 kg are taken into stock",
          detail:
            "The custodian accepts what is usable and stops there. The remaining 12 kg go to unexplained — not to a guess.",
          run: (db) =>
            allocationOps.confirmReceipt(db, actor(db, "custodian"), {
              allocationId: ALLOC_WEBBING_ACCEPTED,
              quantityReceived: 78,
              note: "Two rolls set aside unopened pending CIRKA's decision.",
            }),
        },
        {
          id: "batch-state",
          role: "custodian",
          route: `/demo/custodian/stock`,
          title: "The batch now carries an exception",
          detail:
            "Until this is closed the batch is flagged, and everyone who can see it can see the flag. An open problem is not allowed to be quiet.",
        },
      ],
    },

    {
      id: "act-close",
      title: "Someone decides",
      summary: "Exceptions are closed by CIRKA, with a name and a reason.",
      beats: [
        {
          id: "resolve",
          role: "admin",
          at: hour(54),
          route: `/demo/admin/allocations/${ALLOC_WEBBING_ACCEPTED}`,
          title: "CIRKA writes the 12 kg off",
          detail:
            "Unexplained empties into written off. The batch's exception clears, and the reasoning is now permanent.",
          run: (db) =>
            allocationOps.resolveDiscrepancy(db, actor(db, "admin"), {
              allocationId: ALLOC_WEBBING_ACCEPTED,
              resolution: "loss_confirmed",
              note: "Water damage confirmed on inspection photographs. Written off against the carrier claim.",
            }),
        },
        {
          id: "close-item",
          role: "admin",
          at: hour(55),
          route: `/demo/admin/allocations/${ALLOC_WEBBING_ACCEPTED}`,
          title: "…and closes the arrival issue itself",
          detail:
            "The quantity question and the quality question are closed separately, because they were asked separately.",
          run: (db) =>
            adminOps.closeActionItem(db, actor(db, "admin"), {
              actionItemId: openActionItem(db, ALLOC_WEBBING_ACCEPTED, "arrival_issue"),
              note: "Carrier claim filed; damage documented and material written off.",
            }),
        },
        {
          id: "ledger",
          role: "manufacturer",
          route: `/demo/manufacturer/batches/${BATCH_WEBBING}`,
          title: "180 kg, still adding up",
          detail:
            "90 available, 78 at the custodian, 12 written off. Something went wrong and nothing went missing — that is the whole point.",
        },
      ],
    },
  ],
};
