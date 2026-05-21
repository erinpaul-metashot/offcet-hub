"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, sentenceCase, classNames } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Calendar, 
  Package, 
  DollarSign, 
  ImageIcon, 
  AlertCircle, 
  FileText,
  Clock,
  Edit2,
  CheckCircle2,
  Users,
  Phone,
  Mail
} from "lucide-react";

export default function LotDetailsPage() {
  const params = useParams();
  const lotId = params.id as Id<"lots">;
  const router = useRouter();
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lot = useQuery(api.lots.get, { lotId });
  const assignments = useQuery(api.assignments.getForLot, { lotId });
  const markSold = useMutation(api.lots.markSold);

  if (lot === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[var(--ink-muted)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-green)] border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium">Loading lot details...</p>
      </div>
    );
  }

  if (lot === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-[var(--surface)] rounded-2xl border border-[var(--line)]">
        <AlertCircle size={48} className="text-red-500 opacity-80" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-1">Lot Not Found</h2>
          <p className="text-sm text-[var(--ink-muted)] mb-6">The supply lot you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.back()} variant="secondary">Go Back</Button>
        </div>
      </div>
    );
  }

  const handleMarkSold = () => {
    startTransition(async () => {
      try {
        await markSold({ lotId });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not mark as sold.");
      }
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center text-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Back to Lots</span>
        </button>
      </div>

      {error && (
        <div className="px-5 py-4 rounded-xl border flex items-center gap-3 shadow-sm bg-red-50 border-red-200 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--brand-green)] bg-[var(--brand-green-muted)]/50 border border-[var(--brand-green)]/10">
              <Package size={14} />
              {sentenceCase(lot.category)}
            </span>
            <span className="text-sm font-medium text-[var(--ink-muted)] flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-lg border border-[var(--line)]">
              <MapPin size={14} />
              {lot.location}
            </span>
            <StatusBadge status={lot.status} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--ink)] tracking-tight mb-2">
            {lot.title}
          </h1>
          <div className="text-sm text-[var(--ink-muted)] flex items-center gap-2">
            <span>ID:</span>
            <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded text-[11px]">{lot._id}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 shrink-0">
          {lot.status === "draft" && (
            <Button onClick={() => router.push(`/supplier/lots/new?edit=${lot._id}`)} variant="secondary" className="w-full sm:w-auto flex items-center gap-2">
              <Edit2 size={16} />
              Edit Draft
            </Button>
          )}
          {lot.status !== "sold" && (
            <Button disabled={isPending} onClick={handleMarkSold} className="w-full sm:w-auto flex items-center gap-2 shadow-md bg-[var(--brand-green)] hover:bg-[var(--brand-green-dark)] text-white">
              <CheckCircle2 size={16} />
              Mark Sold
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Details (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Key Specifications Grid */}
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
            <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <FileText size={16} className="text-[var(--brand-green)]" />
                Key Specifications
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
                  <DollarSign size={14} /> Expected Price
                </span>
                <span className="font-bold text-lg text-[var(--brand-green)]">{formatCurrency(lot.expectedPrice)}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
                  <Package size={14} /> Quantity
                </span>
                <span className="font-semibold text-base text-[var(--ink)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--line)] self-start">
                  {lot.quantity} {lot.unit}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
                  <Calendar size={14} /> Expiry Date
                </span>
                <span className="font-semibold text-[var(--ink)]">{formatDate(lot.expiresAt)}</span>
              </div>

            </div>
          </div>

          {/* Description */}
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
            <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <FileText size={16} className="text-[var(--brand-green)]" />
                Description
              </h3>
            </div>
            <div className="p-6">
              <p className="text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap">
                {lot.description || "No description provided for this supply lot."}
              </p>
            </div>
          </div>

          {/* Review Notes */}
          {lot.reviewNotes && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="border-b border-amber-200 px-6 py-4 bg-amber-100/50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600" />
                  Admin Review Notes
                </h3>
              </div>
              <div className="p-6">
                <p className="text-amber-900 leading-relaxed">
                  {lot.reviewNotes}
                </p>
              </div>
            </div>
          )}

          {/* Assigned Buyers */}
          {lot.status !== "draft" && lot.status !== "pending_review" && assignments && assignments.length > 0 && (
            <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
              <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Users size={16} className="text-[var(--brand-green)]" />
                  Assigned Buyers
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignments.filter(a => a.responseStatus !== "not_interested").map((assignment) => (
                    <div key={assignment._id} className="border border-[var(--line)] rounded-xl p-4 bg-[var(--surface)] hover:border-[var(--brand-green)]/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-[var(--ink)]">
                            {assignment.user.businessName || "Business Profile Pending"}
                          </h4>
                          <p className="text-sm text-[var(--ink-muted)]">{assignment.user.name}</p>
                        </div>
                        <StatusBadge status={assignment.responseStatus || "pending"} />
                      </div>
                      <div className="space-y-2 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-[var(--ink-muted)]">
                          <Phone size={14} />
                          <span>{assignment.user.phone || "No phone provided"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--ink-muted)]">
                          <Mail size={14} />
                          <span>{assignment.user.email || "No email provided"}</span>
                        </div>
                      </div>
                      {assignment.notes && (
                        <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-sm text-amber-900">
                          <p className="font-semibold mb-1 text-xs uppercase tracking-wider">Assignment Notes</p>
                          <p>{assignment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {assignments.filter(a => a.responseStatus !== "not_interested").length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-[var(--ink-muted)] border border-dashed border-[var(--line)] rounded-xl">
                      <Users size={32} className="mb-2 opacity-30 text-[var(--ink-muted)]" />
                      <p className="font-medium text-sm">No active buyers currently assigned.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Photos Gallery */}
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
            <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <ImageIcon size={16} className="text-[var(--brand-green)]" />
                Photos ({lot.imageUrls?.length || 0})
              </h3>
            </div>
            <div className="p-6">
              {lot.imageUrls && lot.imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {lot.imageUrls.map((url, idx) => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--line)] group">
                      <Image
                         alt={`${lot.title} - Photo ${idx + 1}`}
                         className="object-cover transition-transform duration-300 group-hover:scale-105"
                         fill
                         sizes="(max-width: 768px) 50vw, 33vw"
                         src={url}
                         unoptimized
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--ink-muted)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--line)]">
                  <ImageIcon size={48} className="mb-3 opacity-50 text-[var(--brand-green)]" />
                  <p className="font-medium text-sm">No photos uploaded for this lot.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Activity / Status (1/3 width) */}
        <div className="xl:col-span-1">
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden sticky top-6">
            <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)] flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <Clock size={16} className="text-[var(--brand-green)]" />
                Activity Timeline
              </h3>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col gap-6">
                
                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--line-strong)]" />
                    <div className="w-0.5 h-full bg-[var(--line)] ml-1 mt-2" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-[var(--ink)]">Created Draft</p>
                    <p className="text-xs text-[var(--ink-muted)] mt-1">{formatDate(lot._creationTime)}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-green)] shadow-[0_0_0_4px_var(--brand-green-muted)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">Last Updated</p>
                    <p className="text-xs text-[var(--ink-muted)] mt-1">{lot.updatedAt ? formatDate(lot.updatedAt) : formatDate(lot._creationTime)}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
