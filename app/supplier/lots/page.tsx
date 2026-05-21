"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, classNames, sentenceCase } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Boxes, 
  CheckCircle2, 
  Banknote,
  Search,
  MapPin,
  Package,
  CalendarDays,
  Inbox,
  AlertCircle,
  FileSignature,
  Edit2
} from "lucide-react";

type Lot = NonNullable<ReturnType<typeof useQuery<typeof api.lots.listForSupplier>>>[number];



function matchesLot(lot: Lot, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    lot.title,
    lot.category,
    lot.location,
    lot.status,
  ].some((value) => value.toLowerCase().includes(needle));
}

type TabType = "all" | "active" | "drafts" | "archived";

export default function MyLotsPage() {
  const lotsQuery = useQuery(api.lots.listForSupplier);
  const markSold = useMutation(api.lots.markSold);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const lots = lotsQuery ?? [];



  const filteredLots = useMemo(() => {
    return lots
      .filter((lot) => {
        if (activeTab === "drafts") return lot.status === "draft";
        if (activeTab === "active") return lot.status === "approved" || lot.status === "assigned" || lot.status === "pending_review";
        if (activeTab === "archived") return lot.status === "sold" || lot.status === "expired";
        return true;
      })
      .filter((lot) => matchesLot(lot, deferredSearchQuery));
  }, [lots, activeTab, deferredSearchQuery]);

  if (lotsQuery === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-[var(--ink-muted)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-green)] border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium">Loading your lots...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      
      {/* Header & Metrics Dashboard */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col gap-6 md:flex-row md:items-center justify-between border-b border-[var(--line)]">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
              My Lots
            </h1>
            <p className="text-base text-[var(--ink-muted)] leading-relaxed">
              Manage your surplus inventory, create new drafts, and track the status of your submissions.
            </p>
          </div>
          <Button as={Link} href="/supplier/lots/new" className="shadow-md whitespace-nowrap">
            Create New Lot
          </Button>
        </div>


      </div>

      {error && (
        <div className="px-5 py-4 rounded-xl border flex items-center gap-3 shadow-sm bg-red-50 border-red-200 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col overflow-hidden min-h-[500px]">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(["all", "active", "drafts", "archived"] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={classNames(
                  "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                  activeTab === tab
                    ? "border-[var(--brand-green)] text-[var(--brand-green)]"
                    : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
                )}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-80 p-3 sm:p-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lots, location, status..."
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-green-muted)] focus:border-[var(--brand-green)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 flex-1 bg-[var(--surface)]/10">
          {!filteredLots.length ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--line)] rounded-2xl bg-[var(--paper)] mt-4">
              <Inbox size={48} className="mb-4 text-[var(--ink-muted)] opacity-50" />
              <h3 className="text-lg font-bold text-[var(--ink)] mb-1">No lots found</h3>
              <p className="text-sm text-[var(--ink-muted)] mb-6">You don't have any lots matching these filters.</p>
              <Button as={Link} href="/supplier/lots/new" variant="secondary">Create a Lot</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredLots.map((lot) => (
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--ink-muted)]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><MapPin size={12}/> Location</span>
                        <span className="font-medium text-[var(--ink)]">{lot.location}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Package size={12}/> Quantity</span>
                        <span className="font-medium text-[var(--ink)]">{lot.quantity} {lot.unit}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Banknote size={12}/> Expected</span>
                        <span className="font-medium text-[var(--ink)]">{formatCurrency(lot.expectedPrice)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CalendarDays size={12}/> Expires</span>
                        <span className="font-medium text-[var(--ink)]">{formatDate(lot.expiresAt)}</span>
                      </div>
                    </div>

                    {lot.reviewNotes && (
                      <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <p><strong>Admin Note:</strong> {lot.reviewNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row flex-wrap xl:flex-col justify-center items-stretch gap-3 shrink-0 xl:min-w-[180px] border-t xl:border-t-0 xl:border-l border-[var(--line)] pt-4 xl:pt-0 xl:pl-6">
                    <Button
                      as={Link}
                      href={`/supplier/lots/${lot._id}`}
                      className="justify-center"
                    >
                      View Details
                    </Button>
                    
                    {lot.status === "draft" && (
                      <Button
                        onClick={() => router.push(`/supplier/lots/new?edit=${lot._id}`)}
                        variant="secondary"
                        className="justify-center gap-2"
                      >
                        <Edit2 size={14} />
                        Edit Draft
                      </Button>
                    )}

                    {lot.status !== "sold" && (
                      <Button
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            try {
                              await markSold({ lotId: lot._id });
                            } catch (markError) {
                              setError(
                                markError instanceof Error
                                  ? markError.message
                                  : "Could not mark the lot as sold.",
                              );
                            }
                          });
                        }}
                        variant="ghost"
                        className="justify-center text-xs hover:bg-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      >
                        Mark Sold
                      </Button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
