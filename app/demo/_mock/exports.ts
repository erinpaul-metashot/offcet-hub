/**
 * Exports (05_SYSTEM_DESIGN §8.1).
 *
 * Every export carries the same provenance columns: `data_source`,
 * `assurance_level`, `recorded_by_org`, `recorded_at`, `last_reviewed_at`: so
 * a funder reading a spreadsheet can see which rows were checked and which were
 * self-reported.
 */

import type { MockDatabase } from "./types";
import { costsForViewer, type ViewerScope } from "./visibility";
import { orgName } from "./selectors-shared";

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

function escapeCell(value: ExportRow[string]): string {
  if (value === undefined || value === null) {
    return "";
  }

  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) {
    return "";
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column])).join(","));

  return [header, ...body].join("\n");
}

function download(fileName: string, contents: string, mimeType: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(name: string, rows: ExportRow[]) {
  download(`${name}.csv`, toCsv(rows), "text/csv;charset=utf-8");
}

export function downloadJson(name: string, payload: unknown) {
  download(`${name}.json`, JSON.stringify(payload, null, 2), "application/json");
}

const isoOrBlank = (timestamp?: number) => (timestamp ? new Date(timestamp).toISOString() : "");

/* ------------------------------------------------------------------ *
 * The export catalogue
 * ------------------------------------------------------------------ */

export interface ExportDefinition {
  key: string;
  label: string;
  description: string;
  build: (db: MockDatabase, viewer: ViewerScope) => ExportRow[];
  restricted?: boolean;
}

export const EXPORTS: ExportDefinition[] = [
  {
    key: "resource-batches",
    label: "Resource batches",
    description: "Every batch with its quantity pots, provenance and assurance level.",
    build: (db, viewer) =>
      db.resourceBatches.map((batch) => ({
        reference: batch.reference,
        name: batch.name,
        owner_org: orgName(db, batch.ownerOrgId),
        material_category: batch.materialCategory,
        composition: batch.composition,
        unit: batch.unit,
        quantity_original: batch.quantityOriginal,
        qty_available: batch.pots.available,
        qty_reserved: batch.pots.reserved,
        qty_allocated: batch.pots.allocated,
        qty_in_transit: batch.pots.in_transit,
        qty_at_custodian: batch.pots.at_custodian,
        qty_with_maker: batch.pots.with_maker,
        qty_consumed: batch.pots.consumed,
        qty_written_off: batch.pots.written_off,
        qty_unexplained: batch.pots.unexplained,
        status: batch.status,
        exception: batch.exceptionStatus,
        /* estimatedValue is protected: excluded from every non-owner export. */
        estimated_value:
          viewer.role === "admin" || viewer.orgId === batch.ownerOrgId
            ? batch.estimatedValue
            : undefined,
        data_source: batch.dataSource,
        assurance_level: batch.assuranceLevel,
        recorded_by_org: orgName(db, batch.ownerOrgId),
        recorded_at: isoOrBlank(batch.createdAt),
        last_reviewed_at: isoOrBlank(batch.reviewedAt),
      })),
  },
  {
    key: "demand-requests",
    label: "Demand requests",
    description: "Requests from brands and makers, with how much has been matched.",
    build: (db) =>
      db.resourceRequests.map((request) => ({
        reference: request.reference,
        title: request.title,
        requester_org: orgName(db, request.requesterOrgId),
        material_category: request.materialCategory,
        quantity_needed: request.quantityNeeded,
        quantity_matched: request.quantityMatched,
        unit: request.unit,
        status: request.status,
        needed_by: isoOrBlank(request.neededBy),
        data_source: "manual_entry",
        assurance_level: "self_reported",
        recorded_by_org: orgName(db, request.requesterOrgId),
        recorded_at: isoOrBlank(request.createdAt),
        last_reviewed_at: "",
      })),
  },
  {
    key: "matching-decisions",
    label: "Matching decisions",
    description: "Every proposal with its written rationale and outcome.",
    build: (db) =>
      db.matches.map((match) => ({
        request: db.resourceRequests.find((entry) => entry._id === match.requestId)?.reference,
        batch: db.resourceBatches.find((entry) => entry._id === match.batchId)?.reference,
        quantity_proposed: match.quantityProposed,
        unit: match.unit,
        rationale: match.rationale,
        distance_km: match.distanceKm,
        status: match.status,
        proposed_at: isoOrBlank(match.proposedAt),
        decided_at: isoOrBlank(match.decidedAt),
        decision_note: match.decisionNote,
        data_source: "manual_entry",
        assurance_level: "cirka_reviewed",
        recorded_by_org: "CIRKA",
        recorded_at: isoOrBlank(match.proposedAt),
        last_reviewed_at: isoOrBlank(match.decidedAt),
      })),
  },
  {
    key: "allocations",
    label: "Allocations",
    description: "Every hand-off, including dispatch, receipt and discrepancy resolution.",
    build: (db) =>
      db.allocations.map((allocation) => ({
        reference: allocation.reference,
        batch: db.resourceBatches.find((entry) => entry._id === allocation.batchId)?.reference,
        hop: allocation.hop,
        from_org: orgName(db, allocation.fromOrgId),
        to_org: orgName(db, allocation.toOrgId),
        quantity_allocated: allocation.quantityAllocated,
        quantity_dispatched: allocation.quantityDispatched,
        quantity_received: allocation.quantityReceived,
        quantity_discrepancy: allocation.quantityDiscrepancy,
        discrepancy_resolution: allocation.discrepancyResolution,
        unit: allocation.unit,
        status: allocation.status,
        expected_arrival: isoOrBlank(allocation.expectedArrivalDate),
        received_at: isoOrBlank(allocation.receivedAt),
        data_source: "manual_entry",
        assurance_level: allocation.discrepancyResolvedAt ? "cirka_reviewed" : "self_reported",
        recorded_by_org: orgName(db, allocation.fromOrgId),
        recorded_at: isoOrBlank(allocation.createdAt),
        last_reviewed_at: isoOrBlank(allocation.discrepancyResolvedAt),
      })),
  },
  {
    key: "quantity-movements",
    label: "Quantity movements",
    description: "The append-only ledger: every pour between pots.",
    build: (db) =>
      db.quantityMovements.map((movement) => ({
        batch: db.resourceBatches.find((entry) => entry._id === movement.batchId)?.reference,
        from_bucket: movement.fromBucket,
        to_bucket: movement.toBucket,
        quantity: movement.quantity,
        unit: movement.unit,
        reason: movement.reason,
        occurred_at: isoOrBlank(movement.occurredAt),
        recorded_at: isoOrBlank(movement.recordedAt),
        notes: movement.notes,
        data_source: "manual_entry",
        assurance_level: "self_reported",
        recorded_by_org: movement.performedByOrgId
          ? orgName(db, movement.performedByOrgId)
          : "CIRKA",
        last_reviewed_at: "",
      })),
  },
  {
    key: "production-batches",
    label: "Production batches",
    description: "Material use, yield and evidence status. Costs are not included.",
    build: (db) =>
      db.productionBatches.map((production) => ({
        reference: production.reference,
        maker_org: orgName(db, production.makerOrgId),
        batch: db.resourceBatches.find((entry) => entry._id === production.batchId)?.reference,
        product_name: production.productName,
        planned_quantity: production.plannedQuantity,
        actual_quantity: production.actualQuantity,
        qty_received: production.qtyReceived,
        qty_used: production.qtyUsed,
        qty_incorporated: production.qtyIncorporated,
        qty_offcuts: production.qtyOffcuts,
        qty_loss: production.qtyLoss,
        material_yield: production.materialYield,
        unit: production.unit,
        total_labour_hours: production.totalLabourHours,
        status: production.status,
        evidence_status: production.evidenceStatus,
        data_source: "manual_entry",
        assurance_level:
          production.evidenceStatus === "cirka_reviewed" ? "cirka_reviewed" : "self_reported",
        recorded_by_org: orgName(db, production.makerOrgId),
        recorded_at: isoOrBlank(production.createdAt),
        last_reviewed_at: isoOrBlank(production.reviewedAt),
      })),
  },
  {
    key: "production-inputs",
    label: "Production inputs",
    description: "Everything added alongside the secondary resource. Supplier and cost are protected.",
    build: (db, viewer) =>
      db.productionInputs.map((input) => {
        const production = db.productionBatches.find(
          (entry) => entry._id === input.productionBatchId,
        );
        const privileged =
          viewer.role === "admin" || (production && viewer.orgId === production.makerOrgId);

        return {
          production: production?.reference,
          input_type: input.inputType,
          description: input.description,
          quantity: input.quantity,
          unit: input.unit,
          sourcing_category: input.sourcingCategory,
          supplier_name: privileged ? input.supplierName : undefined,
          cost: privileged ? input.cost : undefined,
          data_source: "manual_entry",
          assurance_level: "self_reported",
          recorded_by_org: production ? orgName(db, production.makerOrgId) : "",
          recorded_at: isoOrBlank(input.createdAt),
          last_reviewed_at: "",
        };
      }),
  },
  {
    key: "production-time",
    label: "Production time",
    description: "Hours by activity. Labour rates are never included.",
    build: (db) =>
      db.productionTimeEntries.map((entry) => {
        const production = db.productionBatches.find(
          (batch) => batch._id === entry.productionBatchId,
        );

        return {
          production: production?.reference,
          activity: entry.activity,
          hours: entry.hours,
          people_involved: entry.peopleInvolved,
          is_estimated: entry.isEstimated,
          data_source: "manual_entry",
          assurance_level: entry.isEstimated ? "self_reported" : "self_reported",
          recorded_by_org: production ? orgName(db, production.makerOrgId) : "",
          recorded_at: isoOrBlank(entry.createdAt),
          last_reviewed_at: "",
        };
      }),
  },
  {
    key: "production-outputs",
    label: "Production outputs",
    description: "Finished products, rejects and rework.",
    build: (db) =>
      db.productionOutputs.map((output) => {
        const production = db.productionBatches.find(
          (batch) => batch._id === output.productionBatchId,
        );

        return {
          production: production?.reference,
          product_name: output.productName,
          product_category: output.productCategory,
          number_planned: output.numberPlanned,
          number_completed: output.numberCompleted,
          number_rejected: output.numberRejected,
          number_rework: output.numberRequiringRework,
          unit_weight: output.unitWeight,
          data_source: "manual_entry",
          assurance_level:
            production?.evidenceStatus === "cirka_reviewed" ? "cirka_reviewed" : "self_reported",
          recorded_by_org: production ? orgName(db, production.makerOrgId) : "",
          recorded_at: isoOrBlank(output.createdAt),
          last_reviewed_at: isoOrBlank(production?.reviewedAt),
        };
      }),
  },
  {
    key: "production-costs",
    label: "Production costs",
    description: "Restricted: the maker and CIRKA only. Blocked entirely for a brand.",
    restricted: true,
    build: (db, viewer) =>
      db.productionCosts
        .map((cost) => ({ cost, visible: costsForViewer(cost, viewer) }))
        .filter((row) => row.visible)
        .map(({ cost }) => {
          const production = db.productionBatches.find(
            (batch) => batch._id === cost.productionBatchId,
          );

          return {
            production: production?.reference,
            maker_org: orgName(db, cost.makerOrgId),
            currency: cost.currency,
            resource_cost: cost.resourceCost,
            additional_input_cost: cost.additionalInputCost,
            labour_cost: cost.labourCost,
            transport_cost: cost.transportCost,
            custodian_fees: cost.custodianFees,
            total_batch_cost: cost.totalBatchCost,
            saleable_units: cost.saleableUnits,
            base_cost_per_unit: cost.baseCostPerUnit,
            revenue_generated: cost.revenueGenerated,
            shared_with_brand: cost.shareCostPerUnitWithBrand,
            data_source: "manual_entry",
            assurance_level: "self_reported",
            recorded_by_org: orgName(db, cost.makerOrgId),
            recorded_at: isoOrBlank(cost.createdAt),
            last_reviewed_at: "",
          };
        }),
  },
  {
    key: "suitability-feedback",
    label: "Suitability feedback",
    description: "What makers thought of the material once it arrived.",
    build: (db) =>
      db.suitabilityFeedback.map((feedback) => ({
        batch: db.resourceBatches.find((entry) => entry._id === feedback.batchId)?.reference,
        allocation: db.allocations.find((entry) => entry._id === feedback.allocationId)?.reference,
        maker_org: orgName(db, feedback.makerOrgId),
        received_as_described: feedback.receivedAsDescribed,
        suitability: feedback.suitability,
        quality_rating: feedback.qualityRating,
        recommended_applications: feedback.recommendedApplications,
        limitations: feedback.limitations,
        data_source: "manual_entry",
        assurance_level: "self_reported",
        recorded_by_org: orgName(db, feedback.makerOrgId),
        recorded_at: isoOrBlank(feedback.createdAt),
        last_reviewed_at: "",
      })),
  },
  {
    key: "programme-milestones",
    label: "Programme milestones",
    description: "Planned against actual, per project stage.",
    build: (db) =>
      db.projectMilestones.map((milestone) => {
        const project = db.projects.find((entry) => entry._id === milestone.projectId);

        return {
          project: project?.reference,
          stage: milestone.stage,
          name: milestone.name,
          planned_date: isoOrBlank(milestone.plannedDate),
          actual_date: isoOrBlank(milestone.actualDate),
          status: milestone.status,
          responsible_org: milestone.responsibleOrgId
            ? orgName(db, milestone.responsibleOrgId)
            : "CIRKA",
          data_source: "manual_entry",
          assurance_level: "cirka_reviewed",
          recorded_by_org: "CIRKA",
          recorded_at: isoOrBlank(milestone.actualDate ?? milestone.plannedDate),
          last_reviewed_at: "",
        };
      }),
  },
  {
    key: "data-source-references",
    label: "Data-source references",
    description: "Where imported records came from, and every transfer attempt.",
    build: (db) =>
      db.integrationTransfers.map((transfer) => ({
        entity_table: transfer.entityTable,
        entity_reference:
          db.resourceBatches.find((entry) => entry._id === transfer.entityId)?.reference ??
          db.productionBatches.find((entry) => entry._id === transfer.entityId)?.reference,
        direction: transfer.direction,
        external_system: transfer.externalSystemName,
        external_record_id: transfer.externalRecordId,
        external_record_url: transfer.externalRecordUrl,
        status: transfer.status,
        attempts: transfer.attemptCount,
        error_message: transfer.errorMessage,
        data_source: transfer.direction === "inbound" ? "api_import" : "manual_entry",
        assurance_level: "self_reported",
        recorded_by_org: "CIRKA",
        recorded_at: isoOrBlank(transfer.createdAt),
        last_reviewed_at: isoOrBlank(transfer.lastAttemptAt),
      })),
  },
  {
    key: "project-summary",
    label: "Project summary",
    description: "One row per project: the funder-facing roll-up.",
    build: (db) =>
      db.projects.map((project) => {
        const requests = db.resourceRequests.filter((entry) => entry.projectId === project._id);
        const requestIds = new Set(requests.map((entry) => entry._id));
        const allocations = db.allocations.filter(
          (entry) =>
            entry.projectId === project._id ||
            (entry.requestId !== undefined && requestIds.has(entry.requestId)),
        );
        const allocationIds = new Set(allocations.map((entry) => entry._id));
        const production = db.productionBatches.filter((entry) =>
          allocationIds.has(entry.allocationId),
        );

        return {
          reference: project.reference,
          title: project.title,
          brand_org: orgName(db, project.brandOrgId),
          status: project.status,
          requests: requests.length,
          allocations: allocations.length,
          production_batches: production.length,
          quantity_activated: allocations
            .filter((entry) => entry.hop === "manufacturer_to_custodian")
            .reduce((total, entry) => total + entry.quantityAllocated, 0),
          quantity_incorporated: production.reduce(
            (total, entry) => total + (entry.qtyIncorporated ?? 0),
            0,
          ),
          units_completed: db.productionOutputs
            .filter((output) =>
              production.some((entry) => entry._id === output.productionBatchId),
            )
            .reduce((total, output) => total + (output.numberCompleted ?? 0), 0),
          data_source: "manual_entry",
          assurance_level: production.every(
            (entry) => entry.evidenceStatus === "cirka_reviewed",
          )
            ? "cirka_reviewed"
            : "self_reported",
          recorded_by_org: orgName(db, project.brandOrgId),
          recorded_at: isoOrBlank(project.createdAt),
          last_reviewed_at: "",
        };
      }),
  },
];
