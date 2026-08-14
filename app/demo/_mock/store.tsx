"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  DEMO_ADMIN_ID,
  DEMO_BRAND_ID,
  DEMO_CUSTODIAN_ID,
  DEMO_MAKER_ID,
  DEMO_MANUFACTURER_ID,
  createMockDatabase,
} from "./data";
import type { CirkaRole } from "./domain";
import type { Id, MockDatabase, User } from "./types";
import type { ViewerScope } from "./visibility";
import * as batchOps from "./operations/batches";
import * as demandOps from "./operations/demand";
import * as marketplaceOps from "./operations/marketplace";
import * as allocationOps from "./operations/allocations";
import * as productionOps from "./operations/production";
import * as adminOps from "./operations/admin";
import * as importOps from "./operations/imports";
import * as arrivalOps from "./operations/arrivals";
import * as integrationOps from "./operations/integrations";
import * as retexcirOps from "./operations/retexcir";
import * as facilityOps from "./operations/facilities";

/** The persona each section of the demo signs you in as. */
export const PERSONA_IDS: Record<CirkaRole, Id> = {
  admin: DEMO_ADMIN_ID,
  manufacturer: DEMO_MANUFACTURER_ID,
  custodian: DEMO_CUSTODIAN_ID,
  maker: DEMO_MAKER_ID,
  brand: DEMO_BRAND_ID,
};

/**
 * Every mutation is named after the internal function the backend will expose,
 * takes the acting persona, and returns a new database. Nothing here mutates
 * state in place, and every rule the backend must enforce is enforced here.
 */
interface DemoStoreValue {
  db: MockDatabase;
  resetDemo: () => void;
  /** Replaces the whole database. Story mode pushes each replayed beat in here. */
  loadDatabase: (next: MockDatabase) => void;
  personaFor: (role: CirkaRole) => User;
  scopeFor: (role: CirkaRole) => ViewerScope;

  // Resource batches
  createResourceBatch: (role: CirkaRole, input: batchOps.CreateBatchInput) => Promise<Id>;
  updateResourceBatch: (
    role: CirkaRole,
    args: { batchId: Id; patch: batchOps.UpdateBatchPatch },
  ) => Promise<void>;
  releaseBatchForMatching: (role: CirkaRole, args: { batchId: Id }) => Promise<void>;
  reviewBatch: (
    role: CirkaRole,
    args: Parameters<typeof batchOps.reviewBatch>[2],
  ) => Promise<void>;
  setBatchException: (
    role: CirkaRole,
    args: Parameters<typeof batchOps.setBatchException>[2],
  ) => Promise<void>;
  writeOffAvailableQuantity: (
    role: CirkaRole,
    args: Parameters<typeof batchOps.writeOffAvailableQuantity>[2],
  ) => Promise<void>;
  reportStorageDamage: (
    role: CirkaRole,
    args: Parameters<typeof batchOps.reportStorageDamage>[2],
  ) => Promise<void>;

  // Demand and matching
  createProject: (role: CirkaRole, input: demandOps.ProjectInput) => Promise<Id>;
  activateProject: (role: CirkaRole, args: { projectId: Id }) => Promise<void>;
  addProjectReference: (role: CirkaRole, input: demandOps.ProjectReferenceInput) => Promise<void>;
  createResourceRequest: (role: CirkaRole, input: demandOps.RequestInput) => Promise<Id>;
  /** Marketplace enquiry. Creates demand only — it never reserves quantity. */
  requestListedLot: (
    role: CirkaRole,
    input: marketplaceOps.RequestListedLotInput,
  ) => Promise<Id>;
  submitResourceRequest: (role: CirkaRole, args: { requestId: Id }) => Promise<void>;
  markRequestUnfulfillable: (
    role: CirkaRole,
    args: { requestId: Id; note: string },
  ) => Promise<void>;
  proposeMatch: (role: CirkaRole, input: demandOps.ProposeMatchInput) => Promise<void>;
  decideMatch: (
    role: CirkaRole,
    args: Parameters<typeof demandOps.decideMatch>[2],
  ) => Promise<void>;
  withdrawMatch: (role: CirkaRole, args: { matchId: Id; note?: string }) => Promise<void>;

  // Allocations
  respondToAllocation: (
    role: CirkaRole,
    args: { allocationId: Id; accept: boolean; note?: string },
  ) => Promise<void>;
  confirmDispatchReadiness: (
    role: CirkaRole,
    args: { allocationId: Id; expectedDispatchDate?: number },
  ) => Promise<void>;
  recordDispatch: (
    role: CirkaRole,
    args: Parameters<typeof allocationOps.recordDispatch>[2],
  ) => Promise<void>;
  confirmReceipt: (
    role: CirkaRole,
    args: { allocationId: Id; quantityReceived: number; note?: string },
  ) => Promise<void>;
  reportArrivalIssue: (
    role: CirkaRole,
    args: Parameters<typeof allocationOps.reportArrivalIssue>[2],
  ) => Promise<void>;
  resolveDiscrepancy: (
    role: CirkaRole,
    args: Parameters<typeof allocationOps.resolveDiscrepancy>[2],
  ) => Promise<void>;
  proposeAllocationToCustodian: (
    role: CirkaRole,
    args: Parameters<typeof allocationOps.proposeAllocationToCustodian>[2],
  ) => Promise<void>;
  proposeAllocationToMaker: (
    role: CirkaRole,
    args: Parameters<typeof allocationOps.proposeAllocationToMaker>[2],
  ) => Promise<void>;
  returnMaterial: (
    role: CirkaRole,
    args: { allocationId: Id; quantity: number; note: string },
  ) => Promise<void>;

  // Production
  createProductionBatch: (
    role: CirkaRole,
    input: productionOps.CreateProductionInput,
  ) => Promise<Id>;
  setProductionStatus: (
    role: CirkaRole,
    args: Parameters<typeof productionOps.setProductionStatus>[2],
  ) => Promise<void>;
  recordMaterialUse: (role: CirkaRole, input: productionOps.MaterialUseInput) => Promise<void>;
  completeProduction: (role: CirkaRole, args: { productionBatchId: Id }) => Promise<void>;
  submitEvidence: (
    role: CirkaRole,
    args: { productionBatchId: Id; makerNotes?: string },
  ) => Promise<void>;
  reviewEvidence: (
    role: CirkaRole,
    args: { productionBatchId: Id; approve: boolean; reviewNotes?: string },
  ) => Promise<void>;
  addProductionInput: (
    role: CirkaRole,
    args: Parameters<typeof productionOps.addProductionInput>[2],
  ) => Promise<void>;
  removeProductionInput: (role: CirkaRole, args: { inputId: Id }) => Promise<void>;
  addTimeEntry: (
    role: CirkaRole,
    args: Parameters<typeof productionOps.addTimeEntry>[2],
  ) => Promise<void>;
  removeTimeEntry: (role: CirkaRole, args: { timeEntryId: Id }) => Promise<void>;
  addProductionOutput: (
    role: CirkaRole,
    args: Parameters<typeof productionOps.addProductionOutput>[2],
  ) => Promise<void>;
  upsertProductionCosts: (
    role: CirkaRole,
    args: { productionBatchId: Id; input: productionOps.CostInput },
  ) => Promise<void>;
  setCostSharing: (
    role: CirkaRole,
    args: { productionBatchId: Id; share: boolean },
  ) => Promise<void>;
  submitSuitabilityFeedback: (
    role: CirkaRole,
    args: Parameters<typeof productionOps.submitSuitabilityFeedback>[2],
  ) => Promise<void>;
  addEvidenceItem: (
    role: CirkaRole,
    args: Parameters<typeof productionOps.addEvidenceItem>[2],
  ) => Promise<void>;

  // Administration
  reviewUser: (role: CirkaRole, args: Parameters<typeof adminOps.reviewUser>[2]) => Promise<void>;
  setUserDisabled: (
    role: CirkaRole,
    args: { userId: Id; disabled: boolean; note?: string },
  ) => Promise<void>;
  updateUserDetails: (
    role: CirkaRole,
    args: { userId: Id; name: string; phone?: string },
  ) => Promise<void>;
  createUser: (role: CirkaRole, input: adminOps.UserInput) => Promise<Id>;
  adminUpdateUser: (
    role: CirkaRole,
    args: { userId: Id; patch: Partial<adminOps.UserInput> },
  ) => Promise<void>;
  removeUser: (role: CirkaRole, args: { userId: Id; note?: string }) => Promise<void>;
  reviewOrganisation: (
    role: CirkaRole,
    args: Parameters<typeof adminOps.reviewOrganisation>[2],
  ) => Promise<void>;
  createOrganisation: (role: CirkaRole, input: adminOps.OrganisationInput) => Promise<Id>;
  updateOrganisation: (
    role: CirkaRole,
    args: { orgId: Id; patch: Partial<adminOps.OrganisationInput> },
  ) => Promise<void>;
  deleteOrganisation: (role: CirkaRole, args: { orgId: Id }) => Promise<void>;
  createFacility: (role: CirkaRole, input: facilityOps.FacilityInput) => Promise<Id>;
  updateFacility: (
    role: CirkaRole,
    args: { facilityId: Id; patch: facilityOps.FacilityPatch },
  ) => Promise<void>;
  setFacilityActive: (
    role: CirkaRole,
    args: { facilityId: Id; isActive: boolean },
  ) => Promise<void>;
  removeFacility: (role: CirkaRole, args: { facilityId: Id }) => Promise<void>;
  closeActionItem: (
    role: CirkaRole,
    args: { actionItemId: Id; dismiss?: boolean; note: string },
  ) => Promise<void>;
  retryTransfer: (role: CirkaRole, args: { transferId: Id }) => Promise<void>;
  recordExport: (
    role: CirkaRole,
    args: { exportName: string; format: "csv" | "json"; rowCount: number },
  ) => Promise<void>;

  // Data in
  commitImport: (
    role: CirkaRole,
    args: Parameters<typeof importOps.commitImport>[2],
  ) => Promise<Omit<importOps.CommitImportResult, "db">>;
  queueOutboundTransfer: (
    role: CirkaRole,
    args: Parameters<typeof importOps.queueOutboundTransfer>[2],
  ) => Promise<void>;

  // Intake: connected-system arrivals
  connectRetexcirAccount: (role: CirkaRole, args: integrationOps.ConnectRetexcirInput) => Promise<void>;
  disconnectRetexcirAccount: (role: CirkaRole) => Promise<void>;
  pullRetexcirRecords: (
    role: CirkaRole,
  ) => Promise<Omit<retexcirOps.PullRetexcirResult, "db">>;
  receiveArrival: (role: CirkaRole, args: arrivalOps.ReceiveArrivalInput) => Promise<void>;
  confirmArrival: (
    role: CirkaRole,
    args: { arrivalId: Id; correction?: arrivalOps.ArrivalCorrection },
  ) => Promise<Id>;
  skipArrival: (role: CirkaRole, args: { arrivalId: Id }) => Promise<void>;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function findUser(db: MockDatabase, userId: Id): User {
  const user = db.users.find((entry) => entry._id === userId);

  if (!user) {
    throw new Error(`Demo persona ${userId} is missing from the seed data.`);
  }

  return user;
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<MockDatabase>(createMockDatabase);
  const dbRef = useRef(db);

  /** Applies an update against the latest snapshot; validation errors throw. */
  const commit = useCallback((update: (current: MockDatabase) => MockDatabase) => {
    const next = update(dbRef.current);
    dbRef.current = next;
    setDb(next);
    return next;
  }, []);

  const scopeFor = useCallback((role: CirkaRole): ViewerScope => {
    const user = findUser(dbRef.current, PERSONA_IDS[role]);
    return { userId: user._id, orgId: user.orgId, role: user.role };
  }, []);

  const personaFor = useCallback(
    (role: CirkaRole): User => findUser(db, PERSONA_IDS[role]),
    [db],
  );

  const loadDatabase = useCallback((next: MockDatabase) => {
    dbRef.current = next;
    setDb(next);
  }, []);

  const resetDemo = useCallback(() => {
    loadDatabase(createMockDatabase());
  }, [loadDatabase]);

  /** Runs an operation that also returns a value alongside the new database. */
  const commitWith = useCallback(
    <T,>(
      role: CirkaRole,
      operation: (current: MockDatabase, actor: ViewerScope) => { db: MockDatabase } & T,
    ): T => {
      let extra!: T;

      commit((current) => {
        const { db: next, ...rest } = operation(current, scopeFor(role));
        extra = rest as T;
        return next;
      });

      return extra;
    },
    [commit, scopeFor],
  );

  const value = useMemo<DemoStoreValue>(() => {
    const simple =
      <TArgs,>(operation: (db: MockDatabase, actor: ViewerScope, args: TArgs) => MockDatabase) =>
      async (role: CirkaRole, args: TArgs) => {
        commit((current) => operation(current, scopeFor(role), args));
      };

    return {
      db,
      resetDemo,
      loadDatabase,
      personaFor,
      scopeFor,

      createResourceBatch: async (role, input) =>
        commitWith(role, (current, actor) => batchOps.createResourceBatch(current, actor, input))
          .batchId,
      updateResourceBatch: simple(batchOps.updateResourceBatch),
      releaseBatchForMatching: simple(batchOps.releaseBatchForMatching),
      reviewBatch: simple(batchOps.reviewBatch),
      setBatchException: simple(batchOps.setBatchException),
      writeOffAvailableQuantity: simple(batchOps.writeOffAvailableQuantity),
      reportStorageDamage: simple(batchOps.reportStorageDamage),

      createProject: async (role, input) =>
        commitWith(role, (current, actor) => demandOps.createProject(current, actor, input))
          .projectId,
      activateProject: simple(demandOps.activateProject),
      addProjectReference: simple(demandOps.addProjectReference),
      createResourceRequest: async (role, input) =>
        commitWith(role, (current, actor) =>
          demandOps.createResourceRequest(current, actor, input),
        ).requestId,
      requestListedLot: async (role, input) =>
        commitWith(role, (current, actor) =>
          marketplaceOps.requestListedLot(current, actor, input),
        ).requestId,
      submitResourceRequest: simple(demandOps.submitResourceRequest),
      markRequestUnfulfillable: simple(demandOps.markRequestUnfulfillable),
      proposeMatch: simple(demandOps.proposeMatch),
      decideMatch: simple(demandOps.decideMatch),
      withdrawMatch: simple(demandOps.withdrawMatch),

      respondToAllocation: simple(allocationOps.respondToAllocation),
      confirmDispatchReadiness: simple(allocationOps.confirmDispatchReadiness),
      recordDispatch: simple(allocationOps.recordDispatch),
      confirmReceipt: simple(allocationOps.confirmReceipt),
      reportArrivalIssue: simple(allocationOps.reportArrivalIssue),
      resolveDiscrepancy: simple(allocationOps.resolveDiscrepancy),
      proposeAllocationToCustodian: simple(allocationOps.proposeAllocationToCustodian),
      proposeAllocationToMaker: simple(allocationOps.proposeAllocationToMaker),
      returnMaterial: simple(allocationOps.returnMaterial),

      createProductionBatch: async (role, input) =>
        commitWith(role, (current, actor) =>
          productionOps.createProductionBatch(current, actor, input),
        ).productionBatchId,
      setProductionStatus: simple(productionOps.setProductionStatus),
      recordMaterialUse: simple(productionOps.recordMaterialUse),
      completeProduction: simple(productionOps.completeProduction),
      submitEvidence: simple(productionOps.submitEvidence),
      reviewEvidence: simple(productionOps.reviewEvidence),
      addProductionInput: simple(productionOps.addProductionInput),
      removeProductionInput: simple(productionOps.removeProductionInput),
      addTimeEntry: simple(productionOps.addTimeEntry),
      removeTimeEntry: simple(productionOps.removeTimeEntry),
      addProductionOutput: simple(productionOps.addProductionOutput),
      upsertProductionCosts: simple(productionOps.upsertProductionCosts),
      setCostSharing: simple(productionOps.setCostSharing),
      submitSuitabilityFeedback: simple(productionOps.submitSuitabilityFeedback),
      addEvidenceItem: simple(productionOps.addEvidenceItem),

      reviewUser: simple(adminOps.reviewUser),
      setUserDisabled: simple(adminOps.setUserDisabled),
      updateUserDetails: simple(adminOps.updateUserDetails),
      createUser: async (role, input) =>
        commitWith(role, (current, actor) => adminOps.createUser(current, actor, input)).userId,
      adminUpdateUser: simple(adminOps.adminUpdateUser),
      removeUser: simple(adminOps.removeUser),
      reviewOrganisation: simple(adminOps.reviewOrganisation),
      createOrganisation: async (role, input) =>
        commitWith(role, (current, actor) => adminOps.createOrganisation(current, actor, input))
          .orgId,
      updateOrganisation: simple(adminOps.updateOrganisation),
      deleteOrganisation: simple(adminOps.deleteOrganisation),
      createFacility: async (role, input) =>
        commitWith(role, (current, actor) => facilityOps.createFacility(current, actor, input))
          .facilityId,
      updateFacility: simple(facilityOps.updateFacility),
      setFacilityActive: simple(facilityOps.setFacilityActive),
      removeFacility: simple(facilityOps.removeFacility),
      closeActionItem: simple(adminOps.closeActionItem),
      retryTransfer: simple(adminOps.retryTransfer),
      recordExport: simple(adminOps.recordExport),

      commitImport: async (role, args) =>
        commitWith(role, (current, actor) => importOps.commitImport(current, actor, args)),
      queueOutboundTransfer: simple(importOps.queueOutboundTransfer),

      connectRetexcirAccount: simple(integrationOps.connectRetexcirAccount),
      disconnectRetexcirAccount: async (role) => {
        commit((current) => integrationOps.disconnectRetexcirAccount(current, scopeFor(role)));
      },
      pullRetexcirRecords: async (role) =>
        commitWith(role, (current, actor) => retexcirOps.pullRetexcirRecords(current, actor)),
      receiveArrival: simple(arrivalOps.receiveArrival),
      confirmArrival: async (role, args) =>
        commitWith(role, (current, actor) =>
          arrivalOps.confirmArrival(current, actor, args.arrivalId, args.correction),
        ).batchId,
      skipArrival: async (role, args) => {
        commit((current) => arrivalOps.skipArrival(current, scopeFor(role), args.arrivalId));
      },
    };
  }, [commit, commitWith, db, loadDatabase, personaFor, resetDemo, scopeFor]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore(): DemoStoreValue {
  const store = useContext(DemoStoreContext);

  if (!store) {
    throw new Error("useDemoStore must be used inside the /demo route tree.");
  }

  return store;
}

/** Convenience hook for read-only screens. */
export function useDemoDatabase(): MockDatabase {
  return useDemoStore().db;
}

/** The signed-in persona and its scope for a given section of the demo. */
export function useDemoPersona(role: CirkaRole) {
  const store = useDemoStore();
  const user = store.personaFor(role);
  const organisation = store.db.organisations.find((org) => org._id === user.orgId);

  return { user, organisation, scope: { userId: user._id, orgId: user.orgId, role: user.role } };
}
