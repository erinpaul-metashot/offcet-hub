/**
 * CIRKA domain vocabulary for the revised model (docs/revision-1).
 *
 * Deliberately demo-local: the live app still speaks the old
 * supplier/buyer/agent vocabulary via `@/types/domain`. This file is written so
 * it can be promoted verbatim to `types/domain.ts` when the rename reaches the
 * backend.
 */

/* ------------------------------------------------------------------ *
 * Group A: who is involved
 * ------------------------------------------------------------------ */

export const ORGANISATION_TYPES = [
  "manufacturer",
  "custodian",
  "maker",
  "brand",
  "cirka",
] as const;
export type OrganisationType = (typeof ORGANISATION_TYPES)[number];

export const ORGANISATION_STATUSES = ["pending", "approved", "suspended", "rejected"] as const;
export type OrganisationStatus = (typeof ORGANISATION_STATUSES)[number];

/** The five roles of 05_SYSTEM_DESIGN §1. */
export const CIRKA_ROLES = ["manufacturer", "custodian", "maker", "brand", "admin"] as const;
export type CirkaRole = (typeof CIRKA_ROLES)[number];

/** Roles a person can self-register as. */
export const PUBLIC_CIRKA_ROLES = ["manufacturer", "custodian", "maker", "brand"] as const;

export const ORG_ROLES = ["owner", "member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** `disabled` is new: §20 requires disabling a user without deleting history. */
export const ACCOUNT_STATUSES = ["pending", "approved", "rejected", "disabled"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const FACILITY_TYPES = ["source", "storage", "production"] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

/* ------------------------------------------------------------------ *
 * Group B: what the material is
 * ------------------------------------------------------------------ */

/** Controlled list: free text makes matching and reporting unreliable. */
export const MATERIAL_CATEGORIES = [
  "cotton_offcuts",
  "denim",
  "knitwear",
  "wool",
  "linen",
  "polyester_blend",
  "trims",
  "leather",
  "mixed_textile",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const UNITS = ["kg", "m", "m2", "pieces", "rolls"] as const;
export type Unit = (typeof UNITS)[number];

export const MATERIAL_FORMATS = ["roll", "bale", "loose", "cut_pieces", "garment", "other"] as const;
export type MaterialFormat = (typeof MATERIAL_FORMATS)[number];

export const QUALITY_CLASSES = ["a_grade", "b_grade", "mixed", "unsorted"] as const;
export type QualityClass = (typeof QUALITY_CLASSES)[number];

export const COMPOSITION_CONFIDENCES = ["stated", "tested", "estimated"] as const;
export type CompositionConfidence = (typeof COMPOSITION_CONFIDENCES)[number];

/* ------------------------------------------------------------------ *
 * Provenance: 04_ARCHITECTURE §6.4
 * ------------------------------------------------------------------ */

export const DATA_SOURCES = [
  "manual_entry",
  "csv_import",
  "api_import",
  "erp_import",
  "sorting_system",
] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export const ASSURANCE_LEVELS = ["self_reported", "cirka_reviewed", "externally_verified"] as const;
export type AssuranceLevel = (typeof ASSURANCE_LEVELS)[number];

/**
 * The five intake channels of 05_SYSTEM_DESIGN §7: static vocabulary, not a
 * mutable entity. Connectors (erp/sorting) queue a `PendingArrival` for
 * confirmation; manual and csv write straight to a `ResourceBatch`; api has
 * no backend to connect to in the demo.
 */
export interface IntakeChannelConfig {
  id: DataSource;
  name: string;
  kind: "manual" | "upload" | "connector" | "unavailable";
  dataSource: DataSource;
  description: string;
}

/**
 * The sorting partner behind the `sorting_system` channel
 * (docs/retexcir_data_requirements.md). Material is uploaded and graded in
 * Retexcir; CIRKA pulls the finished batches once the account is connected.
 */
export const RETEXCIR = {
  systemName: "Retexcir",
  /** Host from docs/retexcir_data_requirements.md: swap it when the partner ships a live app. */
  appUrl: "https://retexcir.example.com",
  /** What an account reference looks like in Retexcir's own dashboard. */
  accountRefExample: "RETEXCIR-FAC-01",
  accountRefPattern: /^RETEXCIR-[A-Z0-9]+(-[A-Z0-9]+)*$/,
  recordUrl: (recordId: string) => `https://retexcir.example.com/batches/${recordId}`,
  /** Where Retexcir POSTs a sorted batch once the handshake has run. */
  webhookUrl: (accountRef: string) =>
    `https://api.cirka.example/integrations/retexcir/${accountRef.toLowerCase()}`,
  /** The events CIRKA subscribes to at connect time. */
  events: ["batch.sorted", "batch.updated"],
  /** The steps the connect handshake runs through, in order. */
  handshakeSteps: [
    "Authorising the account with Retexcir",
    "Exchanging signing keys",
    "Registering the CIRKA push endpoint",
  ],
} as const;

export const INTAKE_CHANNELS: IntakeChannelConfig[] = [
  {
    id: "manual_entry",
    name: "Manual entry",
    kind: "manual",
    dataSource: "manual_entry",
    description: "One at a time",
  },
  {
    id: "csv_import",
    name: "Spreadsheet import",
    kind: "upload",
    dataSource: "csv_import",
    description: "Paste or upload, then map columns",
  },
  {
    id: "erp_import",
    name: "ERP system",
    kind: "connector",
    dataSource: "erp_import",
    description: "Pushed records await confirmation",
  },
  {
    id: "sorting_system",
    name: `${RETEXCIR.systemName} sorting`,
    kind: "connector",
    dataSource: "sorting_system",
    description: "Connect the account, then pull sorted batches",
  },
];

/* ------------------------------------------------------------------ *
 * Quantity pots: 06_DATA_MODEL §3
 * ------------------------------------------------------------------ */

export const QUANTITY_BUCKETS = [
  "available",
  "reserved",
  "allocated",
  "in_transit",
  "at_custodian",
  "with_maker",
  "consumed",
  "written_off",
  "unexplained",
] as const;
export type QuantityBucket = (typeof QUANTITY_BUCKETS)[number];

/** Material never comes back out of these. */
export const TERMINAL_BUCKETS: readonly QuantityBucket[] = ["consumed", "written_off"];

export const MOVEMENT_REASONS = [
  "initial_record",
  "reserved",
  "reservation_released",
  "allocated",
  "dispatched",
  "received",
  "shortfall",
  "sub_allocated",
  "consumed",
  "offcut_returned",
  "returned",
  "written_off",
  "correction",
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

/* ------------------------------------------------------------------ *
 * Status journeys: 05_SYSTEM_DESIGN §2-§5
 * ------------------------------------------------------------------ */

/**
 * One journey, six steps. Movement detail lives in the pots and in the
 * allocation status; the batch badge answers only "how far through is it?".
 */
export const BATCH_STATUSES = [
  "draft",
  "awaiting_review",
  "awaiting_allocation",
  "partially_assigned",
  "completely_assigned",
  "closed",
] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const BATCH_EXCEPTIONS = [
  "receipt_discrepancy",
  "rejected",
  "cancelled",
  "returned",
  "damaged",
  "reallocated",
  "on_hold",
] as const;
export type BatchException = (typeof BATCH_EXCEPTIONS)[number];

export const REQUEST_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "partially_matched",
  "matched",
  "unfulfillable",
  "in_delivery",
  "fulfilled",
  "closed",
  "cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const MATCH_STATUSES = ["proposed", "approved", "rejected", "withdrawn", "superseded"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const ALLOCATION_HOPS = [
  "manufacturer_to_custodian",
  "custodian_to_maker",
  "direct_to_maker",
] as const;
export type AllocationHop = (typeof ALLOCATION_HOPS)[number];

export const ALLOCATION_STATUSES = [
  "proposed",
  "accepted",
  "declined",
  "awaiting_dispatch",
  "in_transit",
  "received",
  "discrepancy",
  "returned",
  "completed",
  "cancelled",
] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

/**
 * What a custodian can report about a consignment that the weight alone does
 * not say. Quantity shortfalls are not here: those are raised by
 * `confirmReceipt` and resolved through the discrepancy path.
 */
export const ARRIVAL_ISSUES = [
  "damaged",
  "contaminated",
  "wrong_material",
  "missing_paperwork",
  "late",
] as const;
export type ArrivalIssue = (typeof ARRIVAL_ISSUES)[number];

export const DISCREPANCY_RESOLUTIONS = [
  "loss_confirmed",
  "count_corrected",
  "returned",
  "accepted_as_is",
] as const;
export type DiscrepancyResolution = (typeof DISCREPANCY_RESOLUTIONS)[number];

export const PRODUCTION_STATUSES = [
  "planned",
  "awaiting_material",
  "material_received",
  "in_production",
  "quality_review",
  "completed",
  "evidence_submitted",
  "cirka_reviewed",
  "on_hold",
  "cancelled",
] as const;
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];

export const EVIDENCE_STATUSES = ["maker_reported", "evidence_submitted", "cirka_reviewed"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const PROJECT_STATUSES = ["draft", "active", "on_hold", "completed", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_VISIBILITIES = [
  "private",
  "shared_with_cirka",
  "shared_with_participants",
] as const;
export type ProjectVisibility = (typeof PROJECT_VISIBILITIES)[number];

/* ------------------------------------------------------------------ *
 * Group E: production detail
 * ------------------------------------------------------------------ */

export const PRODUCT_CATEGORIES = [
  "apparel",
  "accessories",
  "bags",
  "homeware",
  "footwear",
  "workwear",
  "other",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const INPUT_TYPES = [
  "fabric",
  "thread",
  "lining",
  "zips",
  "buttons",
  "labels",
  "dyes",
  "adhesives",
  "packaging",
  "trims",
  "other",
] as const;
export type InputType = (typeof INPUT_TYPES)[number];

export const SOURCING_CATEGORIES = ["new", "reused", "recycled", "unknown"] as const;
export type SourcingCategory = (typeof SOURCING_CATEGORIES)[number];

export const TIME_ACTIVITIES = [
  "design_development",
  "material_preparation",
  "cutting",
  "sewing_assembly",
  "finishing",
  "quality_control",
  "rework",
  "packaging",
  "other",
] as const;
export type TimeActivity = (typeof TIME_ACTIVITIES)[number];

export const SUITABILITY_RATINGS = ["suitable", "partly_suitable", "unsuitable"] as const;
export type SuitabilityRating = (typeof SUITABILITY_RATINGS)[number];

export const COLOUR_CONSISTENCIES = ["consistent", "minor_variation", "major_variation"] as const;
export type ColourConsistency = (typeof COLOUR_CONSISTENCIES)[number];

export const COMPOSITION_MATCHES = ["matched", "partly_matched", "did_not_match"] as const;
export type CompositionMatch = (typeof COMPOSITION_MATCHES)[number];

export const EASE_OF_USE = ["easy", "moderate", "difficult"] as const;
export type EaseOfUse = (typeof EASE_OF_USE)[number];

/* ------------------------------------------------------------------ *
 * Group F: proof and plumbing
 * ------------------------------------------------------------------ */

export const AUDIT_ACTIONS = [
  "created",
  "updated",
  "status_changed",
  "quantity_moved",
  "submitted",
  "approved",
  "rejected",
  "reviewed",
  "deleted",
  "restored",
  "exported",
  "permission_changed",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ACTOR_TYPES = ["user", "import", "api", "system"] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const EVIDENCE_KINDS = [
  "resource_photo",
  "dispatch_note",
  "arrival_photo",
  "wip_photo",
  "finished_product",
  "remaining_material",
  "certificate",
  "document",
  "other",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_VISIBILITIES = [
  "private",
  "cirka",
  "project_participants",
  "brand",
  "public",
] as const;
export type EvidenceVisibility = (typeof EVIDENCE_VISIBILITIES)[number];

export const IMPORT_STATUSES = [
  "uploaded",
  "validating",
  "preview_ready",
  "committing",
  "completed",
  "failed",
  "cancelled",
] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const IMPORT_SOURCES = ["csv_import", "api_import", "erp_import", "sorting_system"] as const;
export type ImportSource = (typeof IMPORT_SOURCES)[number];

export const TRANSFER_DIRECTIONS = ["inbound", "outbound"] as const;
export type TransferDirection = (typeof TRANSFER_DIRECTIONS)[number];

export const TRANSFER_STATUSES = ["pending", "in_progress", "success", "failed", "cancelled"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const MILESTONE_STAGES = [
  "demand_created",
  "resource_matched",
  "allocation_approved",
  "custodian_assigned",
  "material_received",
  "maker_allocated",
  "production_started",
  "output_completed",
  "evidence_reviewed",
] as const;
export type MilestoneStage = (typeof MILESTONE_STAGES)[number];

export const MILESTONE_STATUSES = ["pending", "completed", "overdue", "skipped"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const ACTION_KINDS = [
  "awaiting_match",
  "awaiting_acceptance",
  "awaiting_dispatch",
  "awaiting_receipt",
  "quantity_discrepancy",
  "arrival_issue",
  "production_stalled",
  "missing_evidence",
  "awaiting_review",
  "transfer_failed",
  "overdue",
] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

export const ACTION_SEVERITIES = ["info", "warning", "blocking"] as const;
export type ActionSeverity = (typeof ACTION_SEVERITIES)[number];

/* ------------------------------------------------------------------ *
 * Labels
 * ------------------------------------------------------------------ */

export const ROLE_LABELS: Record<CirkaRole, string> = {
  manufacturer: "Manufacturer",
  custodian: "Custodian",
  maker: "Maker",
  brand: "Brand",
  admin: "CIRKA Admin",
};

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  member: "Member",
};

export const ORG_ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  owner: "Can manage the organisation's own settings, sites and people.",
  member: "Works in the organisation but cannot change its settings.",
};

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  source: "Source site",
  storage: "Storage site",
  production: "Production site",
};

export const ROLE_DESCRIPTIONS: Record<CirkaRole, string> = {
  manufacturer: "Holds the leftover material. Records it, confirms it is ready, sends it.",
  custodian: "A verified local node that receives, stores and hands out material.",
  maker: "Turns secondary resources into products. Also called a transformation partner.",
  brand: "Commissions the work. Sets the brief, approves, and reads the results.",
  admin: "Runs matching, resolves exceptions and reviews evidence.",
};

export const ORGANISATION_TYPE_LABELS: Record<OrganisationType, string> = {
  manufacturer: "Manufacturer",
  custodian: "Custodian",
  maker: "Maker",
  brand: "Brand",
  cirka: "CIRKA",
};

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  cotton_offcuts: "Cotton offcuts",
  denim: "Denim",
  knitwear: "Knitwear",
  wool: "Wool",
  linen: "Linen",
  polyester_blend: "Polyester blend",
  trims: "Trims",
  leather: "Leather",
  mixed_textile: "Mixed textile",
};

export const UNIT_LABELS: Record<Unit, string> = {
  kg: "kg",
  m: "m",
  m2: "m²",
  pieces: "pieces",
  rolls: "rolls",
};

export const FORMAT_LABELS: Record<MaterialFormat, string> = {
  roll: "Roll",
  bale: "Bale",
  loose: "Loose",
  cut_pieces: "Cut pieces",
  garment: "Garment",
  other: "Other",
};

export const QUALITY_CLASS_LABELS: Record<QualityClass, string> = {
  a_grade: "A-grade",
  b_grade: "B-grade",
  mixed: "Mixed",
  unsorted: "Unsorted",
};

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  manual_entry: "Manual entry",
  csv_import: "CSV import",
  api_import: "API integration",
  erp_import: "ERP import",
  sorting_system: "Sorting technology",
};

export const ASSURANCE_LABELS: Record<AssuranceLevel, string> = {
  self_reported: "Self-reported",
  cirka_reviewed: "CIRKA reviewed",
  externally_verified: "Externally verified",
};

export const BUCKET_LABELS: Record<QuantityBucket, string> = {
  available: "Available",
  reserved: "Reserved",
  allocated: "Allocated",
  in_transit: "In transit",
  at_custodian: "At custodian",
  with_maker: "With maker",
  consumed: "Consumed",
  written_off: "Written off",
  unexplained: "Unexplained",
};

export const MOVEMENT_REASON_LABELS: Record<MovementReason, string> = {
  initial_record: "Initial record",
  reserved: "Reserved against a match",
  reservation_released: "Reservation released",
  allocated: "Allocation accepted",
  dispatched: "Dispatched",
  received: "Receipt confirmed",
  shortfall: "Receipt shortfall",
  sub_allocated: "Sub-allocated to maker",
  consumed: "Used in production",
  offcut_returned: "Offcut returned to stock",
  returned: "Returned unused",
  written_off: "Written off",
  correction: "Correction",
};

export const STATUS_LABELS: Record<string, string> = {
  // account + organisation
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  disabled: "Disabled",
  suspended: "Suspended",
  // resource batch
  awaiting_review: "Awaiting review",
  awaiting_allocation: "Awaiting allocation",
  partially_assigned: "Partially assigned",
  completely_assigned: "Completely assigned",
  // quantity pots + allocations
  available: "Available",
  reserved: "Reserved",
  awaiting_dispatch: "Awaiting dispatch",
  in_transit: "In transit",
  received: "Received",
  completed: "Completed",
  // batch exceptions
  receipt_discrepancy: "Receipt discrepancy",
  cancelled: "Cancelled",
  returned: "Returned",
  damaged: "Damaged",
  reallocated: "Reallocated",
  on_hold: "On hold",
  // requests
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  partially_matched: "Partially matched",
  matched: "Matched",
  unfulfillable: "Unfulfillable",
  in_delivery: "In delivery",
  fulfilled: "Fulfilled",
  closed: "Closed",
  // matches
  proposed: "Proposed",
  withdrawn: "Withdrawn",
  superseded: "Superseded",
  // allocations
  accepted: "Accepted",
  declined: "Declined",
  discrepancy: "Discrepancy",
  // production
  planned: "Planned",
  awaiting_material: "Awaiting material",
  material_received: "Material received",
  in_production: "In production",
  quality_review: "Quality review",
  evidence_submitted: "Evidence submitted",
  cirka_reviewed: "CIRKA reviewed",
  maker_reported: "Maker reported",
  // projects
  active: "Active",
  // transfers + imports
  in_progress: "In progress",
  success: "Success",
  failed: "Failed",
  uploaded: "Uploaded",
  validating: "Validating",
  preview_ready: "Preview ready",
  committing: "Committing",
  // milestones + actions
  overdue: "Overdue",
  skipped: "Skipped",
  open: "Open",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const ARRIVAL_ISSUE_LABELS: Record<ArrivalIssue, string> = {
  damaged: "Damaged in transit",
  contaminated: "Contaminated or soiled",
  wrong_material: "Not the material described",
  missing_paperwork: "Paperwork missing or wrong",
  late: "Arrived outside the expected window",
};

export const ACTION_KIND_LABELS: Record<ActionKind, string> = {
  awaiting_match: "Requests awaiting matching",
  awaiting_acceptance: "Allocations awaiting acceptance",
  awaiting_dispatch: "Resources awaiting dispatch",
  awaiting_receipt: "Receipts awaiting confirmation",
  quantity_discrepancy: "Quantity discrepancies",
  arrival_issue: "Issues reported on arrival",
  production_stalled: "Production batches with no recent update",
  missing_evidence: "Evidence missing",
  awaiting_review: "Records awaiting CIRKA review",
  transfer_failed: "Failed data transfers",
  overdue: "Past expected date",
};

export const MILESTONE_LABELS: Record<MilestoneStage, string> = {
  demand_created: "Demand created",
  resource_matched: "Resource matched",
  allocation_approved: "Allocation approved",
  custodian_assigned: "Custodian assigned",
  material_received: "Material received",
  maker_allocated: "Maker allocated",
  production_started: "Production started",
  output_completed: "Output completed",
  evidence_reviewed: "Evidence reviewed",
};

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  fabric: "Additional fabric",
  thread: "Thread",
  lining: "Lining",
  zips: "Zips",
  buttons: "Buttons",
  labels: "Labels",
  dyes: "Dyes",
  adhesives: "Adhesives",
  packaging: "Packaging",
  trims: "Trims",
  other: "Other",
};

export const TIME_ACTIVITY_LABELS: Record<TimeActivity, string> = {
  design_development: "Design and development",
  material_preparation: "Material preparation",
  cutting: "Cutting",
  sewing_assembly: "Sewing or assembly",
  finishing: "Finishing",
  quality_control: "Quality control",
  rework: "Rework",
  packaging: "Packaging",
  other: "Other",
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  apparel: "Apparel",
  accessories: "Accessories",
  bags: "Bags",
  homeware: "Homeware",
  footwear: "Footwear",
  workwear: "Workwear",
  other: "Other",
};

export const SOURCING_CATEGORY_LABELS: Record<SourcingCategory, string> = {
  new: "New",
  reused: "Reused",
  recycled: "Recycled",
  unknown: "Unknown",
};

export const SUITABILITY_LABELS: Record<SuitabilityRating, string> = {
  suitable: "Suitable",
  partly_suitable: "Partly suitable",
  unsuitable: "Unsuitable",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
