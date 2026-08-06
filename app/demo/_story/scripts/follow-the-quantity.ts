/**
 * "Follow the quantity" — the ledger explained on material that already exists.
 *
 * Starts seeded rather than empty: this script is not about building a record,
 * it is about reading one. It uses three batches that are already mid-flight and
 * moves quantity between pots live, so the invariant is demonstrated rather than
 * asserted — the totals on screen never change, only where the material sits.
 */

import { DEMO_NOW } from "../../_mock/data";
import { ALLOC_FLEECE_TO_RASK, ALLOC_JERSEY2_TO_NODE } from "../../_mock/data/allocations";
import { BATCH_FLEECE, BATCH_JERSEY, BATCH_JERSEY_SECOND } from "../../_mock/data/batches";
import * as allocationOps from "../../_mock/operations/allocations";
import * as batchOps from "../../_mock/operations/batches";
import { actor } from "../helpers";
import type { StoryScript } from "../types";

const hour = (offset: number) => DEMO_NOW + offset * 3_600_000;

export const followTheQuantity: StoryScript = {
  id: "follow-the-quantity",
  title: "Follow the quantity",
  blurb:
    "Nine pots, one invariant. Watch 500 kg move between them without the total ever changing — including the 5 kg nobody can account for.",
  minutes: 5,
  start: "seeded",

  acts: [
    {
      id: "act-pots",
      title: "The nine pots",
      summary: "Every batch's quantity is somewhere. CIRKA makes you say where.",
      beats: [
        {
          id: "open-batch",
          role: "manufacturer",
          route: `/demo/manufacturer/batches/${BATCH_JERSEY}`,
          title: "500 kg of jersey, split across four pots",
          detail:
            "225 available, 260 consumed, 15 written off. The bar at the top is the whole model: those numbers must add back to 500 or the batch would not have been allowed to reach this state.",
        },
        {
          id: "consumed",
          role: "manufacturer",
          route: `/demo/manufacturer/batches/${BATCH_JERSEY}`,
          title: "Consumed is the only pot that means success",
          detail:
            "260 kg became product. It got there by being allocated, dispatched, received and cut — each hop a movement with a name against it.",
        },
        {
          id: "write-off",
          role: "manufacturer",
          at: hour(1),
          route: `/demo/manufacturer/batches/${BATCH_JERSEY}`,
          title: "15 kg are found damaged in storage",
          detail:
            "Watch the bar: available drops to 210, written off climbs to 30. The total is still 500. Material never disappears, it only changes pot.",
          run: (db) =>
            batchOps.writeOffAvailableQuantity(db, actor(db, "manufacturer"), {
              batchId: BATCH_JERSEY,
              quantity: 15,
              reason: "Water ingress on the pallet nearest the loading door.",
            }),
        },
      ],
    },

    {
      id: "act-unexplained",
      title: "The pot nobody wants",
      summary: "What happens when the weight going out and the weight arriving disagree.",
      beats: [
        {
          id: "open-short",
          role: "custodian",
          route: `/demo/custodian/arrivals`,
          title: "300 kg were dispatched. 295 arrived.",
          detail:
            "The custodian recorded what was actually on the pallet. CIRKA did not average the difference away — it put 5 kg in the unexplained pot and stopped.",
        },
        {
          id: "see-short-batch",
          role: "admin",
          route: `/demo/admin/batches/${BATCH_JERSEY_SECOND}`,
          title: "Unexplained is a claim CIRKA refuses to make",
          detail:
            "The batch still totals 300 kg. Five of them are marked as quantity nobody can currently account for, and the batch carries a receipt-discrepancy exception until someone decides.",
        },
        {
          id: "resolve",
          role: "admin",
          at: hour(2),
          route: `/demo/admin/batches/${BATCH_JERSEY_SECOND}`,
          title: "CIRKA closes it as a confirmed loss",
          detail:
            "Unexplained empties into written off, with a person's name and a sentence of reasoning attached. That sentence is now part of the permanent record.",
          run: (db) =>
            allocationOps.resolveDiscrepancy(db, actor(db, "admin"), {
              allocationId: ALLOC_JERSEY2_TO_NODE,
              resolution: "loss_confirmed",
              note: "Weighbridge tickets reconciled against the manifest: short-loaded at origin.",
            }),
        },
      ],
    },

    {
      id: "act-back",
      title: "Quantity comes back too",
      summary: "The ledger runs in both directions.",
      beats: [
        {
          id: "with-maker",
          role: "maker",
          route: `/demo/maker/allocations`,
          title: "150 kg of fleece sit with the maker",
          detail:
            "While material is at a workshop it is in the with-maker pot: still owned by the manufacturer, still on the same batch, just held somewhere else.",
        },
        {
          id: "return",
          role: "maker",
          at: hour(3),
          route: `/demo/manufacturer/batches/${BATCH_FLEECE}`,
          title: "30 kg were never needed and go back",
          detail:
            "With-maker falls to 120, available rises by 30. The material is offered to the next project instead of quietly becoming waste.",
          run: (db) =>
            allocationOps.returnMaterial(db, actor(db, "maker"), {
              allocationId: ALLOC_FLEECE_TO_RASK,
              quantity: 30,
              note: "Pattern nested tighter than planned; surplus returned unopened.",
            }),
        },
        {
          id: "close",
          role: "admin",
          route: `/demo/admin/batches/${BATCH_FLEECE}`,
          title: "Nothing was created, nothing was destroyed",
          detail:
            "Three mutations, three different roles, three different reasons — and every batch still totals exactly what it started with. That is the whole product in one sentence.",
        },
      ],
    },
  ],
};
