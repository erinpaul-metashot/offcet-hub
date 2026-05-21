"use client";

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, sentenceCase, classNames } from "@/lib/utils";
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Calendar, 
  Package, 
  DollarSign, 
  ImageIcon, 
  Users, 
  AlertCircle, 
  FileText,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox
} from "lucide-react";

export default function AdminLotDetailsPage() {
  const params = useParams();
  const lotId = params.id as Id<"lots">;
  const router = useRouter();

  const lot = useQuery(api.lots.get, { lotId });
  const assignments = useQuery(api.admin.listLotAssignments, { lotId });
  const unapproveLot = useMutation(api.admin.unapproveLot);

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

  const handleUnapprove = async () => {
    const note = window.prompt("Optional unapproval / review note:");
    if (note === null) return;
    try {
      await unapproveLot({
        lotId: lot._id,
        reviewNotes: note.trim() || undefined,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unapprove lot");
    }
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

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {lot.status === "approved" && (
            <Button onClick={handleUnapprove} variant="secondary" className="w-full sm:w-auto bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)]">
              Unapprove Lot
            </Button>
          )}
          <Button onClick={() => router.push("/admin/assignments")} className="w-full sm:w-auto flex items-center gap-2 shadow-md">
            <UserPlus size={16} />
            Manage Assignments
          </Button>
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
                  <Building size={14} /> Supplier
                </span>
                <span className="font-semibold text-base text-[var(--ink)]">{lot.supplierName}</span>
              </div>

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

        {/* Right Column: Assignments Tracker (1/3 width) */}
        <div className="xl:col-span-1">
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden sticky top-6">
            <div className="border-b border-[var(--line)] px-6 py-4 bg-[var(--brand-green-muted)]/20 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <Users size={16} className="text-[var(--brand-green)]" />
                Active Assignments
              </h3>
              <span className="bg-[var(--brand-green)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {assignments.length}
              </span>
            </div>
            
            <div className="p-4">
              {!assignments.length ? (
                <div className="flex flex-col items-center text-center p-8 border-2 border-dashed border-[var(--line)] rounded-xl bg-[var(--surface)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--paper)] flex items-center justify-center mb-4 text-[var(--ink-muted)] shadow-sm">
                    <Inbox size={20} />
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--ink)] mb-1">No Active Assignments</h4>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4">
                    This lot has not been assigned to any buyers yet. Use the assignment workspace to distribute it.
                  </p>
                  <Button 
                    onClick={() => router.push("/admin/assignments")} 
                    variant="secondary"
                    className="text-xs w-full"
                  >
                    Go to Workspace
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {assignments.map((assignment) => {
                    const status = assignment.responseStatus ?? "pending";
                    
                    let statusColor = "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]";
                    let statusIcon = <Clock size={12} className="animate-pulse" />;
                    let statusText = "Pending";
                    
                    if (status === "interested") {
                      statusColor = "bg-[var(--brand-green-muted)] text-[var(--brand-green)] border-[var(--brand-green)]/30";
                      statusIcon = <CheckCircle2 size={12} />;
                      statusText = "Interested";
                    } else if (status === "not_interested") {
                      statusColor = "bg-red-50 text-red-700 border-red-200";
                      statusIcon = <XCircle size={12} />;
                      statusText = "Not Interested";
                    }

                    return (
                      <div key={assignment._id} className="border border-[var(--line)] bg-[var(--surface)]/50 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-[var(--line-strong)]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[var(--ink)] leading-tight">{assignment.assigneeName}</p>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--line)] inline-block mt-1">
                              {assignment.assigneeRole}
                            </span>
                          </div>
                          <div className={classNames("inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border", statusColor)}>
                            {statusIcon}
                            <span>{statusText}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 text-xs text-[var(--ink-muted)] border-t border-[var(--line)]/60 pt-2 mt-1">
                          <div className="flex items-center justify-between">
                            <span>Assigned:</span>
                            <span className="font-medium text-[var(--ink)]">{formatDate(assignment.assignedAt)}</span>
                          </div>
                          {assignment.responseUpdatedAt && (
                            <div className="flex items-center justify-between">
                              <span>Responded:</span>
                              <span className="font-medium text-[var(--ink)]">{formatDate(assignment.responseUpdatedAt)}</span>
                            </div>
                          )}
                        </div>

                        {assignment.notes && (
                          <div className="mt-1 bg-[var(--paper)] p-2.5 rounded-lg border border-[var(--line)] text-xs italic text-[var(--ink)]">
                            "{assignment.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <Button 
                    onClick={() => router.push("/admin/assignments")} 
                    variant="ghost"
                    className="w-full mt-2 text-xs border border-transparent hover:border-[var(--line-strong)]"
                  >
                    Manage all in Workspace
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
