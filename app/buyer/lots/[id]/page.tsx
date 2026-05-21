"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { 
  ArrowLeft,
  MapPin,
  Package,
  DollarSign,
  CalendarDays,
  FileText,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare
} from "lucide-react";

export default function AssignedLotDetailsPage() {
  const params = useParams();
  const lotId = params.id as Id<"lots">;
  const router = useRouter();

  const lot = useQuery(api.lots.get, { lotId });
  const assignments = useQuery(api.assignments.listAssignedLotsForCurrentUser, {});
  const respondToAssignment = useMutation(api.assignments.respondToAssignment);
  const [isPending, startTransition] = useTransition();

  if (lot === undefined || assignments === undefined) {
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

  // Find the specific assignment object for this lot for the current user
  const assignment = assignments.find(a => a._id === lot._id);

  function setResponse(responseStatus: "interested" | "not_interested") {
    startTransition(async () => {
      await respondToAssignment({
        lotId,
        responseStatus,
      });
      // Scroll to top to show updated status badge
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-12">
      
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

      {/* Hero Header Card */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row gap-8 justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
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
          <h1 className="text-3xl font-bold text-[var(--ink)] tracking-tight mb-4">
            {lot.title}
          </h1>
          
          <div className="flex items-center gap-4 bg-[var(--surface)] border border-[var(--line)] px-4 py-3 rounded-xl w-fit">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Your Reply Status:</span>
            {assignment ? (
              <StatusBadge status={assignment.responseStatus} />
            ) : (
              <span className="text-sm text-[var(--ink-muted)] italic">Not Assigned</span>
            )}
          </div>
        </div>

        {/* Action Panel in Header */}
        {lot.status === "assigned" && assignment && (
          <div className="flex flex-col gap-3 lg:w-[280px] bg-[var(--surface)]/50 p-5 rounded-xl border border-[var(--line)] shrink-0">
            <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              <MessageSquare size={16} className="text-[var(--brand-green)]" />
              Respond to Assignment
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mb-1">
              Let the supplier know if you are interested in negotiating for this lot.
            </p>
            <Button
              disabled={isPending || assignment.responseStatus === "interested"}
              onClick={() => setResponse("interested")}
              className="w-full justify-center shadow-md bg-[var(--brand-green)] hover:bg-[var(--brand-green-dark)] text-white"
            >
              <CheckCircle2 size={16} className="mr-2" />
              Interested
            </Button>
            <Button
              disabled={isPending || assignment.responseStatus === "not_interested"}
              onClick={() => setResponse("not_interested")}
              variant="secondary"
              className="w-full justify-center"
            >
              <XCircle size={16} className="mr-2 text-red-500" />
              Not Interested
            </Button>
          </div>
        )}
      </div>

      {/* Admin Notes */}
      {assignment?.assignmentNotes && (
        <div className="bg-[var(--brand-green-muted)]/10 rounded-2xl border border-[var(--brand-green)]/30 shadow-sm overflow-hidden">
          <div className="border-b border-[var(--brand-green)]/20 px-6 py-4 bg-[var(--brand-green-muted)]/20">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand-green-dark)] flex items-center gap-2">
              <MessageSquare size={16} />
              Message from Admin
            </h3>
          </div>
          <div className="p-6">
            <p className="text-[var(--ink)] leading-relaxed font-medium">
              "{assignment.assignmentNotes}"
            </p>
          </div>
        </div>
      )}

      {/* Main Specifications */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
        <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
            <FileText size={16} className="text-[var(--brand-green)]" />
            Lot Specifications
          </h3>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-1.5">
                  <Package size={14} /> Category & Quantity
                </h4>
                <p className="text-base font-semibold text-[var(--ink)]">
                  {sentenceCase(lot.category)} • {lot.quantity} {lot.unit}
                </p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-1.5">
                  <DollarSign size={14} /> Pricing & Expiry
                </h4>
                <p className="text-base text-[var(--ink)]">
                  <span className="font-bold text-[var(--brand-green)]">{formatCurrency(lot.expectedPrice)}</span>
                  <span className="text-[var(--ink-muted)] mx-2">•</span>
                  Expires {formatDate(lot.expiresAt)}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-1.5">
                  <MapPin size={14} /> Location
                </h4>
                <p className="text-base text-[var(--ink)]">{lot.location}</p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-1.5">
                  <Clock size={14} /> Assigned On
                </h4>
                <p className="text-base text-[var(--ink)]">
                  {assignment ? formatDate(assignment.assignedAt) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--line)]">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-3">
              <FileText size={14} /> Description
            </h4>
            <p className="text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap">
              {lot.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>

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
  );
}
