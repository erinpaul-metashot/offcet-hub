/**
 * The 21 entities of the revised CIRKA model (06_DATA_MODEL.md §5), expressed
 * as plain TypeScript records for the in-browser demo database.
 *
 * Ids are readable strings ("org_nordvast", "batch_1") rather than branded
 * database ids, so every mock record stays inspectable.
 */

import type {
  AccountStatus,
  ActionKind,
  ActionSeverity,
  ActorType,
  AllocationHop,
  AllocationStatus,
  ArrivalIssue,
  AssuranceLevel,
  AuditAction,
  BatchException,
  BatchStatus,
  CirkaRole,
  ColourConsistency,
  CompositionConfidence,
  CompositionMatch,
  DataSource,
  DiscrepancyResolution,
  EaseOfUse,
  EvidenceKind,
  EvidenceStatus,
  EvidenceVisibility,
  FacilityType,
  ImportSource,
  ImportStatus,
  InputType,
  MatchStatus,
  MaterialCategory,
  MaterialFormat,
  MilestoneStage,
  MilestoneStatus,
  MovementReason,
  OrgRole,
  OrganisationStatus,
  OrganisationType,
  ProductCategory,
  ProductionStatus,
  ProjectStatus,
  ProjectVisibility,
  QualityClass,
  QuantityBucket,
  RequestStatus,
  SourcingCategory,
  SuitabilityRating,
  TimeActivity,
  TransferDirection,
  TransferStatus,
  Unit,
} from "./domain";

export type Id = string;
export type Timestamp = number;

/* ------------------------------------------------------------------ *
 * Group A: who is involved
 * ------------------------------------------------------------------ */

export interface Organisation {
  _id: Id;
  name: string;
  type: OrganisationType;
  status: OrganisationStatus;
  registrationNumber?: string;
  /** Protected: never shown to brands. */
  taxId?: string;
  country: string;
  addressLine?: string;
  city?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  websiteUrl?: string;
  description?: string;
  capabilityTags: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}

export interface User {
  _id: Id;
  authUserId: string;
  orgId: Id;
  email: string;
  name: string;
  phone?: string;
  role: CirkaRole;
  orgRole: OrgRole;
  status: AccountStatus;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: Id;
  reviewNotes?: string;
  lastActiveAt?: Timestamp;
  deletedAt?: Timestamp;
  anonymisedAt?: Timestamp;
}

export interface Facility {
  _id: Id;
  orgId: Id;
  name: string;
  type: FacilityType;
  addressLine: string;
  city?: string;
  postcode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  /** Protected fields: never shown to brands. */
  contactName?: string;
  contactEmail?: string;
  /** Total storage volume this site can hold. Unset means no declared limit. */
  storageCapacityKg?: number;
  isActive: boolean;
  createdAt: Timestamp;
  deletedAt?: Timestamp;
}

/* ------------------------------------------------------------------ *
 * Group B: what material exists
 * ------------------------------------------------------------------ */

/** The nine pots. Their sum always equals `quantityOriginal`. */
export type QuantityPots = Record<QuantityBucket, number>;

export interface ResourceBatch {
  _id: Id;
  reference: string;
  ownerOrgId: Id;
  sourceFacilityId?: Id;
  createdByUserId?: Id;

  name: string;
  description: string;
  materialCategory: MaterialCategory;
  materialSubcategory?: string;
  composition?: string;
  compositionConfidence?: CompositionConfidence;
  format?: MaterialFormat;
  qualityClass?: QualityClass;
  colour?: string;
  weightPerUnit?: number;
  unit: Unit;

  quantityOriginal: number;
  pots: QuantityPots;

  availableFrom?: Timestamp;
  availableUntil?: Timestamp;
  /** Set when the manufacturer releases the batch for matching. */
  releasedAt?: Timestamp;
  locationText?: string;
  latitude?: number;
  longitude?: number;

  /** Derived from the pots: never set directly. See `ledger.deriveBatchStatus`. */
  status: BatchStatus;
  exceptionStatus?: BatchException;
  exceptionNote?: string;
  holdReason?: string;

  dataSource: DataSource;
  assuranceLevel: AssuranceLevel;
  externalSystemName?: string;
  externalRecordId?: string;
  externalRecordUrl?: string;
  importJobId?: Id;
  importedAt?: Timestamp;
  lastSyncedAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedByUserId?: Id;
  reviewNotes?: string;

  /** Protected: never shown to brands. */
  estimatedValue?: number;
  currency?: string;
  imageUrls: string[];
  documentNames: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

/** Append-only. Never updated, never deleted. */
export interface QuantityMovement {
  _id: Id;
  batchId: Id;
  allocationId?: Id;
  productionBatchId?: Id;
  fromBucket: QuantityBucket | null;
  toBucket: QuantityBucket | null;
  quantity: number;
  unit: Unit;
  reason: MovementReason;
  performedByUserId?: Id;
  performedByOrgId?: Id;
  occurredAt: Timestamp;
  recordedAt: Timestamp;
  notes?: string;
  /** Snapshot of every pot after this move: auditing a single row needs no replay. */
  balanceAfter: QuantityPots;
}

/* ------------------------------------------------------------------ *
 * Group C: what is wanted
 * ------------------------------------------------------------------ */

export interface Project {
  _id: Id;
  reference: string;
  brandOrgId: Id;
  ownerUserId?: Id;
  title: string;
  objective: string;
  intendedProduct?: string;
  designIntent?: string;
  commercialObjectives?: string;
  impactObjectives?: string;
  startDate?: Timestamp;
  targetCompletionDate?: Timestamp;
  actualCompletionDate?: Timestamp;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}

export interface ResourceRequest {
  _id: Id;
  reference: string;
  projectId?: Id;
  requesterOrgId: Id;
  requesterUserId: Id;
  title: string;
  materialCategory: MaterialCategory;
  materialDescription?: string;
  compositionRequirements?: string;
  qualityRequirements?: string;
  formatPreference?: string;
  quantityNeeded: number;
  unit: Unit;
  quantityMatched: number;
  intendedProduct?: string;
  neededBy?: Timestamp;
  productionLocationPreference?: string;
  maxDistanceKm?: number;
  status: RequestStatus;
  attachmentNames: string[];
  createdAt: Timestamp;
  submittedAt?: Timestamp;
  closedAt?: Timestamp;
  deletedAt?: Timestamp;
}

/** A recorded matching decision: the rationale is stored, not just the outcome. */
export interface Match {
  _id: Id;
  requestId: Id;
  batchId: Id;
  quantityProposed: number;
  unit: Unit;
  rationale: string;
  suggestedCustodianOrgId?: Id;
  suggestedMakerOrgId?: Id;
  categoryFitNote?: string;
  distanceKm?: number;
  availabilityFitNote?: string;
  proposedByUserId: Id;
  proposedAt: Timestamp;
  status: MatchStatus;
  decidedByUserId?: Id;
  decidedAt?: Timestamp;
  decisionNote?: string;
}

/* ------------------------------------------------------------------ *
 * Group D: where it goes
 * ------------------------------------------------------------------ */

/** One row = one hand-off of a specific quantity between two organisations. */
export interface Allocation {
  _id: Id;
  reference: string;
  batchId: Id;
  matchId?: Id;
  requestId?: Id;
  projectId?: Id;
  hop: AllocationHop;
  fromOrgId: Id;
  fromFacilityId?: Id;
  toOrgId: Id;
  toFacilityId?: Id;
  toUserId?: Id;
  quantityAllocated: number;
  unit: Unit;
  quantityDispatched?: number;
  quantityReceived?: number;
  quantityDiscrepancy?: number;
  discrepancyReason?: string;
  discrepancyResolvedAt?: Timestamp;
  discrepancyResolvedByUserId?: Id;
  discrepancyResolution?: DiscrepancyResolution;
  /** Qualitative problem the receiver reported. Quantity gaps use the discrepancy fields above. */
  arrivalIssue?: ArrivalIssue;
  arrivalIssueNote?: string;
  arrivalIssueReportedAt?: Timestamp;
  status: AllocationStatus;
  expectedDispatchDate?: Timestamp;
  dispatchReadyAt?: Timestamp;
  dispatchedAt?: Timestamp;
  dispatchReference?: string;
  expectedArrivalDate?: Timestamp;
  receivedAt?: Timestamp;
  proposedByUserId?: Id;
  respondedByUserId?: Id;
  respondedAt?: Timestamp;
  responseNote?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

/* ------------------------------------------------------------------ *
 * Group E: what gets made
 * ------------------------------------------------------------------ */

export interface ProductionBatch {
  _id: Id;
  reference: string;
  allocationId: Id;
  batchId: Id;
  projectId?: Id;
  makerOrgId: Id;
  productionFacilityId?: Id;
  productCategory: ProductCategory;
  productName: string;
  productDescription?: string;
  plannedQuantity: number;
  actualQuantity?: number;
  plannedStartDate?: Timestamp;
  actualStartDate?: Timestamp;
  plannedCompletionDate?: Timestamp;
  actualCompletionDate?: Timestamp;
  status: ProductionStatus;

  // Material use: §10
  qtyAllocated: number;
  qtyReceived?: number;
  qtyUsed?: number;
  qtyIncorporated?: number;
  qtyPrototypes?: number;
  qtyReusableRemaining?: number;
  qtyOffcuts?: number;
  qtyLoss?: number;
  qtyReturned?: number;
  /** Stored so historic reports do not shift if the formula changes. */
  materialYield?: number;
  unit: Unit;

  // Time summary: §12
  totalLabourHours?: number;
  peopleInvolved?: number;
  timeIsEstimated?: boolean;
  hoursPerSaleableUnit?: number;

  // Evidence: §15
  evidenceStatus: EvidenceStatus;
  evidenceSubmittedAt?: Timestamp;
  reviewedByUserId?: Id;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  makerNotes?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

export interface ProductionInput {
  _id: Id;
  productionBatchId: Id;
  inputType: InputType;
  description: string;
  quantity: number;
  unit: string;
  /** Protected: never shown to brands. */
  supplierName?: string;
  /** Protected. */
  cost?: number;
  currency?: string;
  sourcingCategory: SourcingCategory;
  createdAt: Timestamp;
}

export interface ProductionTimeEntry {
  _id: Id;
  productionBatchId: Id;
  activity: TimeActivity;
  hours: number;
  peopleInvolved?: number;
  isEstimated: boolean;
  entryDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
}

export interface ProductionOutput {
  _id: Id;
  productionBatchId: Id;
  productName: string;
  productCategory: ProductCategory;
  productDescription?: string;
  numberPlanned: number;
  numberCompleted?: number;
  numberRejected?: number;
  numberRequiringRework?: number;
  unitWeight?: number;
  weightUnit?: string;
  finishedImageUrls: string[];
  notes?: string;
  createdAt: Timestamp;
}

/**
 * A separate table on purpose (04_ARCHITECTURE §6.5). Brand-scoped selectors
 * never join to it, so cost data is structurally absent rather than hidden.
 */
export interface ProductionCost {
  _id: Id;
  productionBatchId: Id;
  makerOrgId: Id;
  currency: string;
  resourceCost?: number;
  additionalInputCost?: number;
  labourCost?: number;
  treatmentCost?: number;
  packagingCost?: number;
  transportCost?: number;
  custodianFees?: number;
  otherCosts?: number;
  totalBatchCost?: number;
  saleableUnits?: number;
  baseCostPerUnit?: number;
  intendedWholesalePrice?: number;
  intendedRetailPrice?: number;
  actualSellingPrice?: number;
  unitsSold?: number;
  revenueGenerated?: number;
  /** The maker's explicit opt-in. Defaults to false; changing it writes an audit entry. */
  shareCostPerUnitWithBrand: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SuitabilityFeedback {
  _id: Id;
  allocationId: Id;
  batchId: Id;
  makerOrgId: Id;
  submittedByUserId: Id;
  receivedAsDescribed: boolean;
  suitability: SuitabilityRating;
  qualityRating?: number;
  damageNote?: string;
  contaminationNote?: string;
  colourConsistency?: ColourConsistency;
  compositionConfidence?: CompositionMatch;
  easeOfUse?: EaseOfUse;
  recommendedApplications?: string;
  limitations?: string;
  notes?: string;
  imageUrls: string[];
  createdAt: Timestamp;
}

/* ------------------------------------------------------------------ *
 * Group F: proof and plumbing
 * ------------------------------------------------------------------ */

export interface FieldChange {
  field: string;
  previousValue?: string;
  newValue?: string;
}

/** Append-only. */
export interface AuditEntry {
  _id: Id;
  entityTable: string;
  entityId: Id;
  parentEntityTable?: string;
  parentEntityId?: Id;
  action: AuditAction;
  fieldChanges?: FieldChange[];
  actorUserId?: Id;
  actorOrgId?: Id;
  actorType: ActorType;
  occurredAt: Timestamp;
  notes?: string;
}

export interface EvidenceItem {
  _id: Id;
  fileUrl: string;
  entityTable: string;
  entityId: Id;
  kind: EvidenceKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId: Id;
  uploadedByOrgId: Id;
  visibility: EvidenceVisibility;
  caption?: string;
  /** Set by the uploader after the PII warning. */
  containsPeople?: boolean;
  createdAt: Timestamp;
  deletedAt?: Timestamp;
}

export interface ImportRowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportJob {
  _id: Id;
  orgId: Id;
  uploadedByUserId: Id;
  source: ImportSource;
  fileName?: string;
  targetTable: string;
  status: ImportStatus;
  rowCount?: number;
  validCount?: number;
  createdCount?: number;
  updatedCount?: number;
  failedCount?: number;
  rowErrors: ImportRowError[];
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export type ArrivalStatus = "pending" | "confirmed" | "skipped";

/**
 * A record a connected system (ERP, sorting tech) pushed at CIRKA, waiting for
 * a human to confirm or skip it. Batch-authoring fields are optional so a
 * fixture can represent a field the source system did not send.
 */
export interface PendingArrival {
  _id: Id;
  ownerOrgId: Id;
  channel: DataSource;
  externalSystemName: string;
  externalRecordId?: string;
  /** Deep link back to the record in the system that pushed it. */
  externalRecordUrl?: string;
  name?: string;
  description?: string;
  materialCategory?: MaterialCategory;
  quantity?: number;
  unit?: Unit;
  composition?: string;
  locationText?: string;
  availableFrom?: Timestamp;
  format?: MaterialFormat;
  /** The record exactly as the source system sent it, kept for the audit trail. */
  sourcePayload?: Record<string, unknown>;
  arrivedAt: Timestamp;
  status: ArrivalStatus;
  resolvedBatchId?: Id;
  resolvedAt?: Timestamp;
}

/**
 * An org's link to an external system it pulls records from (05_SYSTEM_DESIGN
 * §7). One row per org per channel: the account reference is what the partner
 * system calls this customer, and is echoed on every record it sends.
 */
export interface IntegrationConnection {
  _id: Id;
  orgId: Id;
  channel: DataSource;
  externalSystemName: string;
  accountRef: string;
  connectedAt: Timestamp;
  connectedByUserId?: Id;
  lastSyncedAt?: Timestamp;
}

export interface IntegrationTransfer {
  _id: Id;
  entityTable: string;
  entityId: Id;
  direction: TransferDirection;
  externalSystemName: string;
  externalRecordId?: string;
  externalRecordUrl?: string;
  status: TransferStatus;
  attemptCount: number;
  lastAttemptAt?: Timestamp;
  succeededAt?: Timestamp;
  errorMessage?: string;
  payloadSummary?: string;
  createdAt: Timestamp;
}

export interface ProjectMilestone {
  _id: Id;
  projectId: Id;
  name: string;
  stage: MilestoneStage;
  plannedDate?: Timestamp;
  actualDate?: Timestamp;
  status: MilestoneStatus;
  responsibleOrgId?: Id;
  notes?: string;
}

/**
 * Only stored where an exception needs an owner and a resolution note.
 * Everything else on the admin queue is derived (see `selectors-actions.ts`).
 */
export interface ActionItem {
  _id: Id;
  entityTable: string;
  entityId: Id;
  kind: ActionKind;
  severity: ActionSeverity;
  assignedToRole: CirkaRole;
  assignedToOrgId?: Id;
  status: "open" | "resolved" | "dismissed";
  dueDate?: Timestamp;
  openedAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedByUserId?: Id;
  resolutionNote?: string;
  title: string;
}

/* ------------------------------------------------------------------ *
 * The database
 * ------------------------------------------------------------------ */

export interface MockDatabase {
  organisations: Organisation[];
  users: User[];
  facilities: Facility[];
  resourceBatches: ResourceBatch[];
  quantityMovements: QuantityMovement[];
  projects: Project[];
  resourceRequests: ResourceRequest[];
  matches: Match[];
  allocations: Allocation[];
  productionBatches: ProductionBatch[];
  productionInputs: ProductionInput[];
  productionTimeEntries: ProductionTimeEntry[];
  productionOutputs: ProductionOutput[];
  productionCosts: ProductionCost[];
  suitabilityFeedback: SuitabilityFeedback[];
  auditLog: AuditEntry[];
  evidenceItems: EvidenceItem[];
  importJobs: ImportJob[];
  integrationConnections: IntegrationConnection[];
  integrationTransfers: IntegrationTransfer[];
  projectMilestones: ProjectMilestone[];
  actionItems: ActionItem[];
  pendingArrivals: PendingArrival[];
}

/* ------------------------------------------------------------------ *
 * View helpers shared by the dashboard widgets
 * ------------------------------------------------------------------ */

export interface ChartItem {
  label: string;
  value: number;
  tone?: "default" | "accent";
}
