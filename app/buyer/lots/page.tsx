"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, sentenceCase, classNames } from "@/lib/utils";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  Package, 
  DollarSign, 
  Building,
  CalendarDays,
  Inbox,
  ArrowRight
} from "lucide-react";

export default function AssignedLotsPage() {
  const [searchText, setSearchText] = useState("");
  const [locationText, setLocationText] = useState("");
  
  const lots = useQuery(api.assignments.listAssignedLotsForCurrentUser, {
    searchText,
    locationText,
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      {/* Header & Search */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--line)]">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
              Assigned Inventory
            </h1>
            <p className="text-base text-[var(--ink-muted)] leading-relaxed">
              Review exclusive supply lots assigned to your business, manage your responses, and track your active inventory.
            </p>
          </div>
        </div>

        <div className="bg-[var(--surface)] px-6 py-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-green-muted)] focus:border-[var(--brand-green)] transition-all"
            />
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Filter by location..."
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-green-muted)] focus:border-[var(--brand-green)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {lots === undefined ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-[var(--ink-muted)] bg-[var(--paper)] rounded-2xl border border-[var(--line)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-green)] border-t-transparent animate-spin"></div>
          <p className="text-sm font-medium">Loading your assignments...</p>
        </div>
      ) : !lots.length ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-[var(--line)] rounded-2xl bg-[var(--paper)]">
          <Inbox size={48} className="mb-4 text-[var(--ink-muted)] opacity-50" />
          <h3 className="text-xl font-bold text-[var(--ink)] mb-2">No lots assigned yet</h3>
          <p className="text-base text-[var(--ink-muted)] max-w-md mx-auto">
            New inventory assignments will appear here in real time. We'll notify you when a lot matches your profile.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {lots.map((lot) => (
            <div key={lot._id} className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-[var(--brand-green)]/40 transition-all flex flex-col lg:flex-row gap-8 justify-between group">
              
              {/* Left Content */}
              <div className="flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand-green)] transition-colors">
                    {lot.title}
                  </h3>
                  <StatusBadge status={lot.status} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[var(--ink-muted)]">
                      <Package size={12}/> Category
                    </span>
                    <span className="font-semibold text-[var(--ink)]">{sentenceCase(lot.category)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[var(--ink-muted)]">
                      <MapPin size={12}/> Location
                    </span>
                    <span className="font-semibold text-[var(--ink)]">{lot.location}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[var(--ink-muted)]">
                      <DollarSign size={12}/> Expected Price
                    </span>
                    <span className="font-bold text-[var(--brand-green)]">{formatCurrency(lot.expectedPrice)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[var(--ink-muted)]">
                      <Package size={12}/> Quantity
                    </span>
                    <span className="font-semibold text-[var(--ink)] bg-[var(--surface)] px-2 py-0.5 rounded-md self-start border border-[var(--line)]">
                      {lot.quantity} {lot.unit}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-5 border-t border-[var(--line)]">
                  <div className="flex flex-wrap items-center gap-3 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--line)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">Your Reply:</span>
                    <StatusBadge status={lot.responseStatus} />
                  </div>
                  
                  <div className="text-[11px] font-medium text-[var(--ink-muted)] flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5"><Building size={14}/> Supplier: {lot.supplierName}</span>
                    <span className="hidden sm:flex items-center gap-1.5"><CalendarDays size={14}/> Assigned {formatDate(lot.assignedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Right Content: Photos & Actions */}
              <div className="flex flex-col justify-between shrink-0 lg:w-[260px] border-t lg:border-t-0 lg:border-l border-[var(--line)] pt-6 lg:pt-0 lg:pl-8">
                {lot.imageUrls.length > 0 ? (
                  <div className="flex gap-2 mb-6 h-[80px]">
                    {lot.imageUrls.slice(0, 3).map((url, i) => (
                      <div key={url} className={classNames(
                        "relative rounded-lg overflow-hidden border border-[var(--line)] h-full",
                        i === 0 ? "w-[120px] shrink-0" : "flex-1"
                      )}>
                        <Image
                          alt={lot.title}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          fill
                          sizes="(max-width: 768px) 33vw, 150px"
                          src={url}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[80px] bg-[var(--surface)] rounded-lg border border-dashed border-[var(--line)] flex items-center justify-center text-[var(--ink-muted)] mb-6">
                    <span className="text-xs font-medium">No photos</span>
                  </div>
                )}
                
                <Button 
                  as={Link} 
                  href={`/buyer/lots/${lot._id}`} 
                  className="w-full flex items-center justify-center gap-2 group/btn shadow-md"
                >
                  Review & Respond
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
