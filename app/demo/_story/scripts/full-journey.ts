/**
 * "From an empty network to a proven product" — the flagship script.
 *
 * Starts with nothing recorded and ends with a brand reading a proof view whose
 * every line was written by a beat the viewer watched run. Nothing here is
 * staged: each beat calls the same operation the screen's button calls, so the
 * 5 kg that go missing in Act 4 really do land in the `unexplained` pot and the
 * ledger really does refuse to balance until CIRKA resolves them.
 */

import {
  ORG_BYTHORN,
  ORG_MALMO_NODE,
  ORG_NORDVAST,
  ORG_RASK,
} from "../../_mock/data";
import { PHOTO } from "../../_mock/data/time";
import * as adminOps from "../../_mock/operations/admin";
import * as allocationOps from "../../_mock/operations/allocations";
import * as batchOps from "../../_mock/operations/batches";
import * as demandOps from "../../_mock/operations/demand";
import * as productionOps from "../../_mock/operations/production";
import { actor, newestAllocation, onlyMatch } from "../helpers";
import type { StoryScript } from "../types";

/** The story runs across one spring. Fixed dates keep every replay identical. */
const day = (offset: number) => Date.UTC(2026, 2, 2) + offset * 86_400_000;

export const fullJourney: StoryScript = {
  id: "full-journey",
  title: "From an empty network to a proven product",
  blurb:
    "Every screen in CIRKA, in the order the work actually happens: 500 kg of jersey offcuts become 380 tote bags a brand can prove the origin of.",
  minutes: 8,
  start: "empty",

  acts: [
    {
      id: "act-0",
      title: "An empty network",
      summary: "Five companies have applied. Nothing has been recorded yet.",
      beats: [
        {
          id: "empty",
          role: "admin",
          at: day(0),
          route: "/demo/admin/dashboard",
          title: "CIRKA has no material in it",
          detail:
            "No batches, no projects, no movements. Every number on this screen is a zero, and every one of them will be written by a beat you watch.",
        },
        {
          id: "approve-orgs",
          role: "admin",
          at: day(1),
          route: "/demo/admin/organisations",
          title: "CIRKA approves the four applicants",
          detail:
            "A manufacturer, a resource node, a maker and a brand. Approval is what lets an organisation own or receive material at all.",
          run: (db) =>
            [ORG_NORDVAST, ORG_MALMO_NODE, ORG_RASK, ORG_BYTHORN].reduce(
              (current, orgId) =>
                adminOps.reviewOrganisation(current, actor(current, "admin"), {
                  orgId,
                  status: "approved",
                  note: "Documents checked against the register.",
                }),
              db,
            ),
        },
        {
          id: "pending-accounts",
          role: "admin",
          at: day(1),
          route: "/demo/admin/users",
          title: "Five accounts are waiting to be let in",
          detail:
            "Approving an organisation does not approve the people inside it. Each account clears its own gate.",
        },
        {
          id: "approve-people",
          role: "admin",
          at: day(1),
          route: "/demo/admin/users?tab=approved",
          title: "…and the people who will act for them",
          detail: "An account is approved separately from its organisation. Both gates, every time.",
          run: (db) =>
            db.users
              .filter((user) => user.status === "pending")
              .reduce(
                (current, user) =>
                  adminOps.reviewUser(current, actor(current, "admin"), {
                    userId: user._id,
                    status: "approved",
                  }),
                db,
              ),
        },
      ],
    },

    {
      id: "act-1",
      title: "Supply",
      summary: "A manufacturer records material it would otherwise have thrown away.",
      beats: [
        {
          id: "record-batch",
          role: "manufacturer",
          at: day(4),
          route: (context) => `/demo/manufacturer/batches/${context.recall("batch")}`,
          title: "Nordväst Textil records 500 kg of jersey offcuts",
          detail:
            "The batch opens its ledger at 500 kg in the available pot. From here the pots must always add back up to 500.",
          run: (db, context) => {
            const { db: next, batchId } = batchOps.createResourceBatch(
              db,
              actor(db, "manufacturer"),
              {
                name: "Organic jersey offcuts — SS26 cutting room",
                description:
                  "Post-production offcuts from a single-colour jersey run. Clean, sorted, one composition throughout.",
                materialCategory: "cotton_offcuts",
                composition: "100% organic cotton jersey, 180 gsm",
                compositionConfidence: "tested",
                format: "cut_pieces",
                qualityClass: "a_grade",
                colour: "Ecru",
                quantity: 500,
                unit: "kg",
                locationText: "Norrköping cutting room",
                dataSource: "manual_entry",
              },
            );

            context.remember("batch", batchId);
            return next;
          },
        },
        {
          id: "release-batch",
          role: "manufacturer",
          at: day(5),
          title: "Nordväst releases the batch for matching",
          detail:
            "Recording material is private. Releasing it is what makes it visible to CIRKA's matching.",
          run: (db, context) =>
            batchOps.releaseBatchForMatching(db, actor(db, "manufacturer"), {
              batchId: context.recall("batch"),
            }),
        },
        {
          id: "review-batch",
          role: "admin",
          at: day(6),
          route: (context) => `/demo/admin/batches/${context.recall("batch")}`,
          title: "CIRKA verifies the composition claim",
          detail:
            "Assurance is a level, not a badge: CIRKA-reviewed means someone at CIRKA checked the paperwork behind the claim rather than taking the owner's word for it.",
          run: (db, context) =>
            batchOps.reviewBatch(db, actor(db, "admin"), {
              batchId: context.recall("batch"),
              assuranceLevel: "cirka_reviewed",
              reviewNotes: "Composition certificate and weighbridge ticket both seen.",
            }),
        },
      ],
    },

    {
      id: "act-2",
      title: "Demand",
      summary: "A brand describes what it wants to make, before it knows what exists.",
      beats: [
        {
          id: "create-project",
          role: "brand",
          at: day(8),
          route: (context) => `/demo/brand/projects/${context.recall("project")}`,
          title: "Bythorn opens a project",
          detail:
            "The brief comes first. A project is the thing the brand will eventually want proof about.",
          run: (db, context) => {
            const { db: next, projectId } = demandOps.createProject(db, actor(db, "brand"), {
              title: "Everyday tote — recovered jersey",
              objective:
                "Produce a market-tested tote from recovered Nordic jersey with a documented chain of custody.",
              intendedProduct: "Canvas-lined tote bag",
              designIntent: "Single-colour body, contrast strap, no dyeing step.",
              commercialObjectives: "380 units for the autumn drop, landed under the current tote cost.",
              impactObjectives: "Divert at least 250 kg from disposal and prove it line by line.",
              startDate: day(8),
              targetCompletionDate: day(120),
            });

            context.remember("project", projectId);
            return next;
          },
        },
        {
          id: "activate-project",
          role: "brand",
          at: day(8),
          title: "…and takes it live",
          detail: "A draft project cannot carry a demand request. Activating it opens the door.",
          run: (db, context) =>
            demandOps.activateProject(db, actor(db, "brand"), {
              projectId: context.recall("project"),
            }),
        },
        {
          id: "create-request",
          role: "brand",
          at: day(9),
          title: "Bythorn asks for 300 kg of cotton jersey",
          detail:
            "Note what the brand does not do: name a supplier. Demand is described, not sourced.",
          run: (db, context) => {
            const { db: next, requestId } = demandOps.createResourceRequest(
              db,
              actor(db, "brand"),
              {
                projectId: context.recall("project"),
                title: "Jersey body fabric — tote programme",
                materialCategory: "cotton_offcuts",
                materialDescription: "Single-composition cotton jersey, light colour, clean offcuts.",
                compositionRequirements: "100% cotton, no elastane.",
                qualityRequirements: "A-grade, no staining.",
                quantityNeeded: 300,
                unit: "kg",
                intendedProduct: "Tote bag body panels",
                neededBy: day(40),
                productionLocationPreference: "Southern Sweden",
                maxDistanceKm: 400,
              },
            );

            context.remember("request", requestId);
            return next;
          },
        },
        {
          id: "submit-request",
          role: "brand",
          at: day(9),
          title: "…and submits it to CIRKA",
          detail: "The request is now CIRKA's problem to solve.",
          run: (db, context) =>
            demandOps.submitResourceRequest(db, actor(db, "brand"), {
              requestId: context.recall("request"),
            }),
        },
      ],
    },

    {
      id: "act-3",
      title: "Matching",
      summary: "CIRKA proposes; the brand decides. The reasoning is kept.",
      beats: [
        {
          id: "propose-match",
          role: "admin",
          at: day(11),
          route: (context) => `/demo/admin/matching/${context.recall("request")}`,
          title: "CIRKA proposes the jersey against the request",
          detail:
            "The rationale is stored on the match, not lost in an email. This is what the brand will be shown when it asks why.",
          run: (db, context) => {
            const next = demandOps.proposeMatch(db, actor(db, "admin"), {
              requestId: context.recall("request"),
              batchId: context.recall("batch"),
              quantityProposed: 300,
              rationale:
                "Composition verified against the brief, A-grade, 240 km from the maker, and available inside the window.",
              suggestedCustodianOrgId: ORG_MALMO_NODE,
              suggestedMakerOrgId: ORG_RASK,
              categoryFitNote: "Exact category and composition match.",
              availabilityFitNote: "Available now; the brief needs it in five weeks.",
              distanceKm: 240,
            });

            context.remember("match", onlyMatch(next, context.recall("request")));
            return next;
          },
        },
        {
          id: "approve-match",
          role: "brand",
          at: day(12),
          route: (context) => `/demo/brand/approvals/${context.recall("match")}`,
          title: "Bythorn approves the match",
          detail:
            "Approval is what creates the allocation to the resource node. 300 kg move from available to reserved to allocated.",
          run: (db, context) =>
            demandOps.decideMatch(db, actor(db, "brand"), {
              matchId: onlyMatch(db, context.recall("request")),
              approve: true,
              note: "Composition and distance both work. Proceed.",
              custodianOrgId: ORG_MALMO_NODE,
            }),
        },
      ],
    },

    {
      id: "act-4",
      title: "Movement",
      summary: "The material physically moves — and 5 kg do not arrive.",
      beats: [
        {
          id: "accept-allocation",
          role: "custodian",
          at: day(13),
          route: "/demo/custodian/arrivals",
          title: "Malmö Resource Node accepts the allocation",
          detail: "A custodian can decline. Accepting is a commitment to take custody.",
          run: (db, context) => {
            const allocationId = newestAllocation(
              db,
              (allocation) => allocation.batchId === context.recall("batch"),
            );

            context.remember("allocationToNode", allocationId);

            return allocationOps.respondToAllocation(db, actor(db, "custodian"), {
              allocationId,
              accept: true,
              note: "Bay 4 is free from Thursday.",
            });
          },
        },
        {
          id: "ready-to-dispatch",
          role: "manufacturer",
          at: day(14),
          route: "/demo/manufacturer/dispatch",
          title: "Nordväst confirms it is ready to dispatch",
          run: (db, context) =>
            allocationOps.confirmDispatchReadiness(db, actor(db, "manufacturer"), {
              allocationId: context.recall("allocationToNode"),
              expectedDispatchDate: day(16),
            }),
        },
        {
          id: "dispatch",
          role: "manufacturer",
          at: day(16),
          title: "300 kg leave Norrköping",
          detail:
            "The quantity moves from allocated to in transit. Nobody holds it right now — that is what the in-transit pot is for.",
          run: (db, context) =>
            allocationOps.recordDispatch(db, actor(db, "manufacturer"), {
              allocationId: context.recall("allocationToNode"),
              quantityDispatched: 300,
              dispatchReference: "NVT-2026-0416",
              expectedArrivalDate: day(18),
            }),
        },
        {
          id: "receive-short",
          role: "custodian",
          at: day(18),
          route: "/demo/custodian/arrivals",
          title: "Only 295 kg arrive",
          detail:
            "The custodian weighs what turned up and records the truth. CIRKA does not quietly round the difference away.",
          run: (db, context) =>
            allocationOps.confirmReceipt(db, actor(db, "custodian"), {
              allocationId: context.recall("allocationToNode"),
              quantityReceived: 295,
              note: "Two bales, one visibly lighter than the manifest.",
            }),
        },
        {
          id: "see-unexplained",
          role: "manufacturer",
          at: day(18),
          route: (context) => `/demo/manufacturer/batches/${context.recall("batch")}`,
          title: "5 kg sit in the unexplained pot",
          detail:
            "The ledger still balances at 500 kg — it just refuses to pretend it knows where 5 of them are.",
        },
        {
          id: "resolve-discrepancy",
          role: "admin",
          at: day(21),
          route: (context) => `/demo/admin/allocations/${context.recall("allocationToNode")}`,
          title: "CIRKA closes the discrepancy as a confirmed loss",
          detail:
            "Someone has to decide. The 5 kg move from unexplained to written off, with a name and a reason attached.",
          run: (db, context) =>
            allocationOps.resolveDiscrepancy(db, actor(db, "admin"), {
              allocationId: context.recall("allocationToNode"),
              resolution: "loss_confirmed",
              note: "Weighbridge tickets reconciled: short-loaded at origin. Written off.",
            }),
        },
      ],
    },

    {
      id: "act-5",
      title: "Making",
      summary: "The maker turns 295 kg of fabric into something.",
      beats: [
        {
          id: "sub-allocate",
          role: "admin",
          at: day(24),
          route: "/demo/admin/allocations",
          title: "CIRKA sends Malmö's 295 kg on to Atelier Rask",
          detail:
            "The second hop. The custodian stores the lot; CIRKA decides who receives it.",
          run: (db, context) => {
            const next = allocationOps.proposeAllocationToMaker(
              db,
              actor(db, "admin"),
              {
                batchId: context.recall("batch"),
                fromOrgId: ORG_MALMO_NODE,
                toOrgId: ORG_RASK,
                quantity: 295,
                notes: "Whole consignment, no split.",
                expectedArrivalDate: day(27),
                projectId: context.recall("project"),
              },
            );

            context.remember(
              "allocationToMaker",
              newestAllocation(next, (allocation) => allocation.toOrgId === ORG_RASK),
            );

            return next;
          },
        },
        {
          id: "maker-accepts",
          role: "maker",
          at: day(25),
          route: "/demo/maker/allocations",
          title: "Atelier Rask accepts",
          run: (db, context) =>
            allocationOps.respondToAllocation(db, actor(db, "maker"), {
              allocationId: context.recall("allocationToMaker"),
              accept: true,
            }),
        },
        {
          id: "second-dispatch",
          role: "custodian",
          at: day(26),
          route: "/demo/custodian/dispatches",
          title: "Malmö dispatches to the workshop",
          run: (db, context) =>
            allocationOps.recordDispatch(
              allocationOps.confirmDispatchReadiness(db, actor(db, "custodian"), {
                allocationId: context.recall("allocationToMaker"),
                expectedDispatchDate: day(26),
              }),
              actor(db, "custodian"),
              {
                allocationId: context.recall("allocationToMaker"),
                quantityDispatched: 295,
                dispatchReference: "MRN-2026-0113",
                expectedArrivalDate: day(27),
              },
            ),
        },
        {
          id: "maker-receives",
          role: "maker",
          at: day(27),
          route: "/demo/maker/allocations",
          title: "All 295 kg arrive at the workshop",
          detail: "This hop is clean. The material is now in the with-maker pot.",
          run: (db, context) =>
            allocationOps.confirmReceipt(db, actor(db, "maker"), {
              allocationId: context.recall("allocationToMaker"),
              quantityReceived: 295,
            }),
        },
        {
          id: "open-production",
          role: "maker",
          at: day(30),
          route: (context) => `/demo/maker/production/${context.recall("production")}`,
          title: "Rask opens a production run for 380 totes",
          run: (db, context) => {
            const { db: next, productionBatchId } = productionOps.createProductionBatch(
              db,
              actor(db, "maker"),
              {
                allocationId: context.recall("allocationToMaker"),
                productCategory: "accessories",
                productName: "Everyday tote — recovered jersey",
                productDescription: "Jersey body, webbing strap, unlined.",
                plannedQuantity: 380,
                plannedStartDate: day(31),
                plannedCompletionDate: day(58),
              },
            );

            context.remember("production", productionBatchId);
            return next;
          },
        },
        {
          id: "start-production",
          role: "maker",
          at: day(31),
          title: "Cutting starts",
          run: (db, context) =>
            productionOps.setProductionStatus(db, actor(db, "maker"), {
              productionBatchId: context.recall("production"),
              status: "in_production",
            }),
        },
        {
          id: "record-use",
          role: "maker",
          at: day(52),
          title: "Rask records what the fabric actually became",
          detail:
            "260 kg incorporated, 10 kg of usable offcuts back, 10 kg genuine loss, 15 kg returned unused. Yield is measured, not estimated.",
          run: (db, context) =>
            productionOps.recordMaterialUse(db, actor(db, "maker"), {
              productionBatchId: context.recall("production"),
              qtyReceived: 295,
              qtyUsed: 280,
              qtyIncorporated: 260,
              qtyOffcuts: 10,
              qtyLoss: 10,
              qtyReturned: 15,
              makerNotes: "Straight-grain cutting; offcuts kept for a smaller pouch run.",
            }),
        },
        {
          id: "record-output",
          role: "maker",
          at: day(56),
          title: "372 totes finished, 8 rejected",
          detail: "The rejects are recorded too. A yield of 100% would be the suspicious number.",
          run: (db, context) =>
            productionOps.addProductionOutput(db, actor(db, "maker"), {
              productionBatchId: context.recall("production"),
              productName: "Everyday tote — recovered jersey",
              productCategory: "accessories",
              numberPlanned: 380,
              numberCompleted: 372,
              numberRejected: 8,
              unitWeight: 0.68,
              notes: "Eight rejected for seam slippage at the strap join.",
            }),
        },
        {
          id: "quality-review",
          role: "maker",
          at: day(57),
          title: "The run goes to quality review",
          detail:
            "A run cannot jump straight from the machines to complete. Someone has to look at it first.",
          run: (db, context) =>
            productionOps.setProductionStatus(db, actor(db, "maker"), {
              productionBatchId: context.recall("production"),
              status: "quality_review",
            }),
        },
        {
          id: "complete",
          role: "maker",
          at: day(58),
          title: "The run is closed",
          detail:
            "Completing is what moves the fabric out of the with-maker pot: 260 kg to consumed, 10 kg of offcuts and 15 kg unused back to available, 10 kg written off as loss.",
          run: (db, context) =>
            productionOps.completeProduction(db, actor(db, "maker"), {
              productionBatchId: context.recall("production"),
            }),
        },
      ],
    },

    {
      id: "act-6",
      title: "Proof",
      summary: "The brand reads back a chain nobody had to assemble by hand.",
      beats: [
        {
          id: "attach-evidence",
          role: "maker",
          at: day(59),
          route: (context) => `/demo/maker/production/${context.recall("production")}`,
          title: "Rask attaches the photographs",
          detail:
            "Evidence cannot be submitted empty. A claim with nothing behind it is the thing CIRKA exists to stop.",
          run: (db, context) => {
            const productionBatchId = context.recall("production");

            return [
              {
                kind: "wip_photo" as const,
                fileName: "tote-cutting-table.jpg",
                fileUrl: PHOTO.patternMaker,
                caption: "Body panels nested on the cutting table.",
              },
              {
                kind: "finished_product" as const,
                fileName: "tote-finished-run.jpg",
                fileUrl: PHOTO.shoppingBags,
                caption: "Finished units before packing.",
              },
              {
                kind: "remaining_material" as const,
                fileName: "tote-remaining-jersey.jpg",
                fileUrl: PHOTO.textileWaste,
                caption: "Offcuts and the 15 kg going back to stock.",
              },
            ].reduce(
              (current, item) =>
                productionOps.addEvidenceItem(current, actor(current, "maker"), {
                  entityTable: "productionBatches",
                  entityId: productionBatchId,
                  ...item,
                }),
              db,
            );
          },
        },
        {
          id: "submit-evidence",
          role: "maker",
          at: day(60),
          title: "Rask submits the evidence pack",
          run: (db, context) =>
            productionOps.submitEvidence(db, actor(db, "maker"), {
              productionBatchId: context.recall("production"),
              makerNotes: "Cutting sheets, weigh-in tickets and finished-unit photography attached.",
            }),
        },
        {
          id: "review-evidence",
          role: "admin",
          at: day(62),
          route: (context) => `/demo/admin/production/${context.recall("production")}`,
          title: "CIRKA reviews and approves it",
          detail: "Only after this does the brand's proof view claim anything as assured.",
          run: (db, context) =>
            productionOps.reviewEvidence(db, actor(db, "admin"), {
              productionBatchId: context.recall("production"),
              approve: true,
              reviewNotes: "Weights reconcile to the ledger. Photography matches the output count.",
            }),
        },
        {
          id: "proof-view",
          role: "brand",
          at: day(63),
          route: (context) => `/demo/brand/projects/${context.recall("project")}`,
          title: "Bythorn opens the proof view",
          detail:
            "Scroll to the bottom: the full record is the same timeline you have been writing, and nobody assembled it by hand.",
        },
        {
          id: "what-brand-cannot-see",
          role: "admin",
          at: day(63),
          route: "/demo/admin/allocations",
          title: "And what the brand is not shown",
          detail:
            "Open any journey as CIRKA and the panel says how many events are withheld from the brand. The count is visible; the content never is.",
        },
      ],
    },
  ],
};
