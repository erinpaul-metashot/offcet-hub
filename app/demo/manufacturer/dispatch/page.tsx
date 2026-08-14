"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Truck, PackageCheck, AlertTriangle, Eye, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button, EmptyState, Input, Select } from "@/components/ui";
import { DEMO_NOW } from "../../_mock/data";
import { getManufacturerDashboard } from "../../_mock/selectors-manufacturer";
import { formatQuantity, orgName } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { ALLOCATION_STATUSES, statusLabel, type AllocationStatus } from "../../_mock/domain";
import {
  CirkaBadge,
  NoticeBanner,
  formatDate,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { DiscrepancyModal } from "../../_components/discrepancy-analysis";
import type { Allocation, ResourceBatch } from "../../_mock/types";

function getDispatchButtonConfig(status: AllocationStatus) {
  switch (status) {
    case "accepted":
      return {
        label: "Prepare Dispatch",
        icon: PackageCheck,
        className: "bg-[#FF5C00] text-white hover:bg-[#e05200] border-transparent font-semibold shadow-sm",
      };
    case "awaiting_dispatch":
      return {
        label: "Record Dispatch",
        icon: Truck,
        className: "bg-[#FF5C00] text-white hover:bg-[#e05200] border-transparent font-semibold shadow-sm",
      };
    case "discrepancy":
      return {
        label: "Inspect Discrepancy",
        icon: AlertTriangle,
        className: "bg-[#FF5C00] text-white hover:bg-[#e05200] border-transparent font-semibold shadow-sm",
      };
    case "in_transit":
      return {
        label: "Track Shipment",
        icon: ArrowUpRight,
        className: "border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface)] font-medium",
      };
    case "received":
    case "completed":
      return {
        label: "View Details",
        icon: CheckCircle2,
        className: "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] font-medium",
      };
    default:
      return {
        label: "View Details",
        icon: Eye,
        className: "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface)] font-medium",
      };
  }
}

export default function ManufacturerDispatchPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");
  const { run, error, pending } = useAction();

  const view = getManufacturerDashboard(store.db, scope);

  const [activeTab, setActiveTab] = useState<"active" | "discrepancy" | "completed" | "all">("active");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [activeModalAllocation, setActiveModalAllocation] = useState<{
    allocation: Allocation;
    batch?: ResourceBatch;
    toName: string;
  } | null>(null);

  // Combine dispatch queue with open discrepancies to ensure nothing is missed
  const allDispatchesMap = new Map<string, { allocation: Allocation; batch?: ResourceBatch; toName: string }>();

  // Add open discrepancies first
  view.discrepancies.forEach((entry) => {
    allDispatchesMap.set(entry.allocation._id, {
      allocation: entry.allocation,
      batch: entry.batch,
      toName: entry.counterpartyName,
    });
  });

  // Add standard queue items
  view.dispatchQueue.forEach((item) => {
    if (!allDispatchesMap.has(item.allocation._id)) {
      allDispatchesMap.set(item.allocation._id, item);
    }
  });

  const allDispatchesList = Array.from(allDispatchesMap.values());

  const filteredQueue = allDispatchesList.filter((item) => {
    // Tab level filter
    if (activeTab === "active") {
      if (!["proposed", "accepted", "awaiting_dispatch", "in_transit"].includes(item.allocation.status)) {
        return false;
      }
    } else if (activeTab === "discrepancy") {
      if (item.allocation.status !== "discrepancy" && !item.allocation.quantityDiscrepancy) {
        return false;
      }
    } else if (activeTab === "completed") {
      if (!["received", "completed"].includes(item.allocation.status)) {
        return false;
      }
    }

    if (status && item.allocation.status !== status) return false;
    if (search) {
      const query = search.toLowerCase();
      const matchesRef = item.allocation.reference?.toLowerCase().includes(query);
      const matchesBatch = item.batch?.name?.toLowerCase().includes(query) || item.batch?.reference?.toLowerCase().includes(query);
      const matchesTo = item.toName.toLowerCase().includes(query);
      if (!matchesRef && !matchesBatch && !matchesTo) return false;
    }
    return true;
  });

  const discrepancyCount = view.discrepancies.length;

  return (
    <div className="space-y-6">
      {/* Modal for Quick Discrepancy Inspection */}
      {activeModalAllocation && (
        <DiscrepancyModal
          isOpen={Boolean(activeModalAllocation)}
          onClose={() => setActiveModalAllocation(null)}
          allocation={activeModalAllocation.allocation}
          batch={activeModalAllocation.batch}
          fromName={orgName(store.db, scope.orgId)}
          toName={activeModalAllocation.toName}
        />
      )}

      <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--ink)]">
              Material Dispatch Log
            </h1>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all relative ${
              activeTab === "active"
                ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Active Queue
          </button>
          <button
            onClick={() => setActiveTab("discrepancy")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all relative ${
              activeTab === "discrepancy"
                ? "text-[#FF5C00] border-b-2 border-[#FF5C00]"
                : "text-[var(--ink-muted)] hover:text-[#FF5C00]"
            }`}
          >
            <AlertTriangle size={13} className="text-[#FF5C00]" />
            <span>Discrepancy Audits</span>
            {discrepancyCount > 0 && (
              <span className="ml-1 rounded-full bg-[#FF5C00] px-2 py-0.5 text-[10px] font-extrabold text-white">
                {discrepancyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all relative ${
              activeTab === "completed"
                ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Completed & Received
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all relative ${
              activeTab === "all"
                ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            All Logs
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-1">
          <Input
            placeholder="Search dispatch ref, batch, or destination..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 flex-1 bg-[var(--surface)] border-transparent focus:border-[var(--brand-primary)] focus:bg-white"
          />
          <div className="flex shrink-0 gap-3">
            <Select 
              value={status} 
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 min-w-[160px] bg-[var(--surface)] border-transparent font-medium"
            >
              <option value="">All statuses</option>
              {ALLOCATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {error && <NoticeBanner tone="blocking" title="That step was refused">{error}</NoticeBanner>}

      {activeTab === "active" && view.discrepancies.length > 0 && (
        <NoticeBanner tone="warning" title="Discrepancy Action Required">
          <div className="space-y-3">
            {view.discrepancies.map((entry) => {
              const dispatchedQty = entry.allocation.quantityDispatched ?? entry.allocation.quantityAllocated;
              const receivedQty = entry.allocation.quantityReceived ?? 0;
              const shortfallQty = entry.allocation.quantityDiscrepancy ?? (dispatchedQty - receivedQty);

              return (
                <div key={entry.allocation._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FF5C00]/20 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-semibold text-[#2A2A2A]">
                      <span className="font-bold text-[#FF5C00]">{entry.allocation.reference}</span> · Destination: {entry.counterpartyName}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      Received {formatQuantity(receivedQty, entry.allocation.unit)} of {formatQuantity(dispatchedQty, entry.allocation.unit)} dispatched. Shortfall: <strong className="text-[#FF5C00] font-bold">-{formatQuantity(shortfallQty, entry.allocation.unit)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setActiveModalAllocation({
                          allocation: entry.allocation,
                          batch: entry.batch,
                          toName: entry.counterpartyName,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00] px-3 py-1 text-xs font-bold text-white hover:bg-[#e05200] transition-colors shadow-xs"
                    >
                      <ShieldAlert size={13} />
                      <span>Inspect Audit</span>
                    </button>
                    <Link
                      href={`/demo/manufacturer/dispatch/${entry.allocation._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline shrink-0"
                    >
                      <span>Full Page</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </NoticeBanner>
      )}

      {filteredQueue.length === 0 ? (
        <EmptyState
          title="Nothing to dispatch"
          body="Allocations to custodians appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredQueue.map(({ allocation, batch, toName }) => {
            const isOverdue =
              allocation.expectedDispatchDate &&
              allocation.expectedDispatchDate < DEMO_NOW &&
              allocation.status !== "in_transit";
            const headlineQuantity = allocation.quantityDispatched ?? allocation.quantityAllocated;
            const buttonConfig = getDispatchButtonConfig(allocation.status);
            const ActionIcon = buttonConfig.icon;
            const hasShortfall = allocation.status === "discrepancy" || Boolean(allocation.quantityDiscrepancy);

            return (
              <div 
                key={allocation._id} 
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                  hasShortfall
                    ? "border-[#FF5C00]/40 bg-[#FFF9F6] hover:bg-[#FFF3EC]"
                    : "border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface)] hover:border-[var(--line-strong)]"
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="shrink-0 sm:w-[140px] space-y-1">
                    <CirkaBadge status={allocation.status} />
                    {isOverdue && (
                      <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A3D11]">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--ink)] truncate">
                        {batch ? batch.name : `Batch ${allocation.batchId}`}
                      </h3>
                      {hasShortfall && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF5C00]">
                          <AlertTriangle size={11} />
                          <span>{formatQuantity(allocation.quantityDiscrepancy ?? 0, allocation.unit)} Gap</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 mt-1 text-xs text-[var(--ink-muted)]">
                      <span className="font-medium text-[var(--ink)]">{allocation.reference}</span>
                      <span className="text-[var(--line-strong)]">•</span>
                      <span>To: <strong className="font-medium text-[var(--ink)]">{toName}</strong></span>
                      {allocation.status === "in_transit" && (
                        <>
                          <span className="text-[var(--line-strong)] hidden sm:inline">•</span>
                          <span className="hidden sm:inline">Sent {formatDate(allocation.dispatchedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between sm:justify-end gap-6 border-t border-[var(--line)] pt-3 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right min-w-[100px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {allocation.status === "in_transit" ? "Dispatched" : "Allocated"}
                    </p>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)] leading-tight mt-0.5">
                      {formatQuantity(headlineQuantity, allocation.unit)}
                    </p>
                  </div>

                  {allocation.status === "discrepancy" ? (
                    <button
                      onClick={() =>
                        setActiveModalAllocation({
                          allocation,
                          batch,
                          toName,
                        })
                      }
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs transition-all duration-200 shrink-0 hover:scale-[1.02] active:scale-[0.98] ${buttonConfig.className}`}
                    >
                      <ActionIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{buttonConfig.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={`/demo/manufacturer/dispatch/${allocation._id}`}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs transition-all duration-200 shrink-0 hover:scale-[1.02] active:scale-[0.98] ${buttonConfig.className}`}
                    >
                      <ActionIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{buttonConfig.label}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



