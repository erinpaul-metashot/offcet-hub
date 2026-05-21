"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, EmptyState, Input, StatusBadge } from "@/components/ui";
import { classNames, formatDate, sentenceCase } from "@/lib/utils";
import { STATUS_LABELS, type LotStatus } from "@/types/domain";
import { 
  Boxes, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Banknote,
  Search,
  Building,
  MapPin,
  Package,
  CalendarDays,
  Inbox,
  AlertCircle,
  FileSignature,
  Users,
  XCircle
} from "lucide-react";

type SupplyTab = "managed" | "requests";

type PendingLot = NonNullable<ReturnType<typeof useQuery<typeof api.admin.listPendingLots>>>[number];
type OverviewLot = NonNullable<ReturnType<typeof useQuery<typeof api.admin.listLotOverview>>>[number];

const EMPTY_PENDING_LOTS: PendingLot[] = [];
const EMPTY_OVERVIEW_LOTS: OverviewLot[] = [];



function matchesPendingLot(lot: PendingLot, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    lot.title,
    lot.category,
    lot.location,
    lot.supplierName,
    lot.status,
  ].some((value) => value.toLowerCase().includes(needle));
}

function matchesManagedLot(lot: OverviewLot, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    lot.title,
    lot.category,
    lot.location,
    lot.supplierName,
    STATUS_LABELS[lot.status],
  ].some((value) => value.toLowerCase().includes(needle));
}

export default function SupplyManagementPage() {
  const pendingLotsQuery = useQuery(api.admin.listPendingLots);
  const lotOverviewQuery = useQuery(api.admin.listLotOverview);
  const approveLot = useMutation(api.admin.approveLot);
  const rejectLot = useMutation(api.admin.rejectLot);
  const unapproveLot = useMutation(api.admin.unapproveLot);

  const [activeTab, setActiveTab] = useState<SupplyTab>("managed");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingLots = pendingLotsQuery ?? EMPTY_PENDING_LOTS;
  const lotOverview = lotOverviewQuery ?? EMPTY_OVERVIEW_LOTS;
  const managedLots = useMemo(
    () => lotOverview.filter((lot) => lot.status !== "pending_review"),
    [lotOverview],
  );

  const filteredPendingLots = useMemo(
    () => pendingLots.filter((lot) => matchesPendingLot(lot, deferredSearchQuery)),
    [deferredSearchQuery, pendingLots],
  );
  const filteredManagedLots = useMemo(
    () => managedLots.filter((lot) => matchesManagedLot(lot, deferredSearchQuery)),
    [deferredSearchQuery, managedLots],
  );



  function clearMessages() {
    setError(null);
    setFeedback(null);
  }

  function onApproveLot(lotId: PendingLot["_id"], title: string) {
    clearMessages();
    startTransition(async () => {
      try {
        await approveLot({ lotId });
        setFeedback(`${title} was approved and moved into managed supply.`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Could not approve lot.",
        );
      }
    });
  }

  function onRejectLot(lotId: PendingLot["_id"], title: string) {
    const note = window.prompt("Optional review note:");
    if (note === null) return;

    clearMessages();
    startTransition(async () => {
      try {
        await rejectLot({
          lotId,
          reviewNotes: note.trim() || undefined,
        });
        setFeedback(`${title} was returned to draft.`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Could not return lot.",
        );
      }
    });
  }

  function onUnapproveLot(lotId: OverviewLot["_id"], title: string) {
    const note = window.prompt("Optional unapproval / review note:");
    if (note === null) return;

    clearMessages();
    startTransition(async () => {
      try {
        await unapproveLot({
          lotId,
          reviewNotes: note.trim() || undefined,
        });
        setFeedback(`${title} was unapproved and returned to pending review.`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Could not unapprove lot.",
        );
      }
    });
  }

  if (pendingLotsQuery === undefined || lotOverviewQuery === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-[var(--ink-muted)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-green)] border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium">Loading supply inventory and queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      
      {/* Header & Metrics Dashboard */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--line)]">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
              Supply Management
            </h1>
            <p className="text-base text-[var(--ink-muted)] leading-relaxed">
              Review incoming supplier submissions, track active assignments, and manage your entire live inventory from one centralized dashboard.
            </p>
          </div>
        </div>


      </div>

      {/* Global Notifications */}
      {(error || feedback) && (
        <div className={classNames(
          "px-5 py-4 rounded-xl border flex items-center gap-3 shadow-sm",
          error ? "bg-red-50 border-red-200 text-red-700" : "bg-[var(--brand-green-muted)] border-[var(--brand-green)] text-[var(--brand-green)]"
        )}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-medium">{error || feedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col overflow-hidden min-h-[600px]">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              className={classNames(
                "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                activeTab === "managed"
                  ? "border-[var(--brand-green)] text-[var(--brand-green)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
              onClick={() => setActiveTab("managed")}
              type="button"
            >
              Managed Supply <span className="ml-1.5 bg-[var(--line)] text-[var(--ink)] px-2 py-0.5 rounded-full text-[10px]">{managedLots.length}</span>
            </button>
            <button
              className={classNames(
                "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                activeTab === "requests"
                  ? "border-[var(--brand-green)] text-[var(--brand-green)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
              onClick={() => setActiveTab("requests")}
              type="button"
            >
              Pending Lots <span className="ml-1.5 bg-[var(--line)] text-[var(--ink)] px-2 py-0.5 rounded-full text-[10px]">{pendingLots.length}</span>
            </button>
          </div>

          <div className="w-full sm:w-80 p-3 sm:p-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lots, suppliers, location..."
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-green-muted)] focus:border-[var(--brand-green)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 flex-1 bg-[var(--surface)]/10">
          
          {/* Managed Supply Tab */}
          {activeTab === "managed" && (
            <div className="space-y-4">
              {!filteredManagedLots.length ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--line)] rounded-2xl bg-[var(--paper)]">
                  <Inbox size={48} className="mb-4 text-[var(--ink-muted)] opacity-50" />
                  <h3 className="text-lg font-bold text-[var(--ink)] mb-1">No managed lots found</h3>
                  <p className="text-sm text-[var(--ink-muted)]">Approved and managed supply will appear here once reviewed.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredManagedLots.map((lot) => (
                    <div key={lot._id} className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[var(--line-strong)] transition-all flex flex-col xl:flex-row gap-6 justify-between group">
                      
                      {/* Left: Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand-green)] transition-colors">{lot.title}</h3>
                          <StatusBadge status={lot.status} />
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] bg-[var(--surface)] border border-[var(--line)]">
                            <Package size={12} /> {sentenceCase(lot.category)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--ink-muted)]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Building size={12}/> Supplier</span>
                            <span className="font-medium text-[var(--ink)]">{lot.supplierName}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><MapPin size={12}/> Location</span>
                            <span className="font-medium text-[var(--ink)]">{lot.location}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Package size={12}/> Quantity</span>
                            <span className="font-medium text-[var(--ink)]">{lot.quantity} {lot.unit}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Users size={12}/> Activity</span>
                            <span className="font-medium text-[var(--brand-green)]">{lot.assigneeCount} assignees</span>
                          </div>
                        </div>

                        {/* Responses summary if any */}
                        {lot.assigneeCount > 0 && (
                          <div className="flex flex-wrap items-center gap-4 text-xs mt-2 p-3 bg-[var(--surface)] rounded-lg border border-[var(--line)]">
                            <span className="font-semibold text-[var(--ink)]">Responses:</span>
                            <span className="flex items-center gap-1 text-[var(--brand-green)]"><CheckCircle2 size={14}/> {lot.responseSummary.interested} Interested</span>
                            <span className="flex items-center gap-1 text-red-600"><XCircle size={14}/> {lot.responseSummary.notInterested} Not Interested</span>
                            <span className="flex items-center gap-1 text-amber-600"><Clock size={14}/> {lot.responseSummary.pending} Pending</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col justify-center gap-3 shrink-0 xl:min-w-[200px] border-t xl:border-t-0 xl:border-l border-[var(--line)] pt-4 xl:pt-0 xl:pl-6">
                        <Button
                          as={Link}
                          href={`/admin/lots/${lot._id}`}
                          className="w-full justify-center"
                        >
                          View Details
                        </Button>
                        {lot.status === "approved" && (
                          <Button
                            disabled={isPending}
                            onClick={() => onUnapproveLot(lot._id, lot.title)}
                            variant="secondary"
                            className="w-full justify-center text-xs"
                          >
                            Unapprove
                          </Button>
                        )}
                        <p className="text-[10px] text-center text-[var(--ink-muted)] mt-1 flex items-center justify-center gap-1">
                          <CalendarDays size={12} /> Updated {formatDate(lot.updatedAt)}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Lots Tab */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {!filteredPendingLots.length ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--line)] rounded-2xl bg-[var(--paper)]">
                  <CheckCircle2 size={48} className="mb-4 text-[var(--brand-green)] opacity-80" />
                  <h3 className="text-lg font-bold text-[var(--ink)] mb-1">Queue Clear</h3>
                  <p className="text-sm text-[var(--ink-muted)]">No pending lots are waiting for review right now.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPendingLots.map((lot) => (
                    <div key={lot._id} className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[var(--brand-green)]/40 transition-all flex flex-col xl:flex-row gap-6 justify-between group">
                      
                      {/* Left: Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand-green)] transition-colors">{lot.title}</h3>
                          <StatusBadge status={lot.status} />
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] bg-[var(--surface)] border border-[var(--line)]">
                            <Package size={12} /> {sentenceCase(lot.category)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-[var(--ink-muted)]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Building size={12}/> Supplier</span>
                            <span className="font-medium text-[var(--ink)]">{lot.supplierName}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><MapPin size={12}/> Location</span>
                            <span className="font-medium text-[var(--ink)]">{lot.location}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Package size={12}/> Quantity</span>
                            <span className="font-medium text-[var(--ink)]">{lot.quantity} {lot.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col sm:flex-row flex-wrap xl:flex-col justify-center items-stretch gap-3 shrink-0 xl:min-w-[200px] border-t xl:border-t-0 xl:border-l border-[var(--line)] pt-4 xl:pt-0 xl:pl-6">
                        <Button
                          disabled={isPending}
                          onClick={() => onApproveLot(lot._id, lot.title)}
                          className="justify-center shadow-md bg-[var(--brand-green)] hover:bg-[var(--brand-green-dark)] text-white"
                        >
                          Approve Lot
                        </Button>
                        <Button
                          as={Link}
                          href={`/admin/lots/${lot._id}`}
                          variant="secondary"
                          className="justify-center"
                        >
                          Review Details
                        </Button>
                        <Button
                          disabled={isPending}
                          onClick={() => onRejectLot(lot._id, lot.title)}
                          variant="ghost"
                          className="justify-center text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                        >
                          Return To Draft
                        </Button>
                        <p className="text-[10px] text-center text-[var(--ink-muted)] mt-1 hidden xl:flex items-center justify-center gap-1">
                          <FileSignature size={12} /> Created {formatDate(lot.createdAt)}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
