"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Panel, Textarea } from "@/components/ui";
import { sentenceCase, formatDate, formatCurrency, classNames } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Info,
  UserPlus,
  Inbox,
  BadgeCheck,
  Building,
  ChevronRight,
  RefreshCw,
  X,
  FileText,
  DollarSign,
  Trash2,
  Users
} from "lucide-react";

export default function AssignmentsPage() {
  const assignableUsers = useQuery(api.admin.listAssignableUsers);
  const lotOverview = useQuery(api.admin.listLotOverview);
  const assignLot = useMutation(api.assignments.assignLot);
  const unassignLot = useMutation(api.assignments.unassignLot);

  const [selectedLotId, setSelectedLotId] = useState<Id<"lots"> | "">("");
  const [selectedAssignees, setSelectedAssignees] = useState<Id<"users">[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  // Search & Filter state for Lots
  const [lotSearch, setLotSearch] = useState("");
  const [lotStatusFilter, setLotStatusFilter] = useState<"all" | "approved" | "assigned">("all");

  // Search & Filter state for Recruits (Assignable Users)
  const [recruitSearch, setRecruitSearch] = useState("");
  const [recruitRoleFilter, setRecruitRoleFilter] = useState<"all" | "buyer" | "agent">("all");
  const [recruitMatchFilter, setRecruitMatchFilter] = useState(false);

  // Success Feedback Toast
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null);

  // Modal Open state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Active Tab for Right Workspace
  const [activeTab, setActiveTab] = useState<"recruit" | "manage">("recruit");

  // Fetch current assignments for the active lot
  const currentAssignments = useQuery(
    api.admin.listLotAssignments,
    selectedLotId ? { lotId: selectedLotId as Id<"lots"> } : "skip"
  );

  const assignableLots = useMemo(() => {
    return lotOverview?.filter((lot) => lot.status === "approved" || lot.status === "assigned") ?? [];
  }, [lotOverview]);

  const selectedLot = useMemo(() => {
    return assignableLots.find((lot) => lot._id === selectedLotId) ?? null;
  }, [selectedLotId, assignableLots]);

  // Filter Lots list based on search and status tabs
  const filteredLots = useMemo(() => {
    return assignableLots.filter((lot) => {
      const matchesSearch =
        lot.title.toLowerCase().includes(lotSearch.toLowerCase()) ||
        lot.supplierName.toLowerCase().includes(lotSearch.toLowerCase()) ||
        lot.category.toLowerCase().includes(lotSearch.toLowerCase()) ||
        lot.location.toLowerCase().includes(lotSearch.toLowerCase());

      const matchesStatus =
        lotStatusFilter === "all" ||
        lot.status === lotStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignableLots, lotSearch, lotStatusFilter]);

  // Filter Lots list based on search and status tabs
  const filteredRecruits = useMemo(() => {
    if (!assignableUsers) return [];

    // Help compute if a candidate is a smart match for the selected lot
    const isCandidateSmartMatch = (user: any) => {
      if (!selectedLot) return false;
      const lotCategory = selectedLot.category.toLowerCase();

      if (user.role === "buyer" && user.profile?.categoriesInterested) {
        return user.profile.categoriesInterested.some(
          (cat: string) => cat.toLowerCase() === lotCategory
        );
      }
      if (user.role === "agent" && user.profile?.preferredCategories) {
        return user.profile.preferredCategories.some(
          (cat: string) => cat.toLowerCase() === lotCategory
        );
      }
      return false;
    };

    return assignableUsers
      .map((user) => {
        const isAlreadyAssigned = currentAssignments?.some(
          (assignment) => assignment.assignedToUserId === user._id
        ) ?? false;

        const isMatch = isCandidateSmartMatch(user);

        return {
          ...user,
          isAlreadyAssigned,
          isSmartMatch: isMatch,
        };
      })
      .filter((user) => {
        // Search filter
        const businessName = user.role === "buyer"
          ? (user.profile as any)?.businessName ?? ""
          : (user.profile as any)?.fullName ?? "";

        const matchesSearch =
          user.name.toLowerCase().includes(recruitSearch.toLowerCase()) ||
          businessName.toLowerCase().includes(recruitSearch.toLowerCase()) ||
          (user.profile?.address ?? "").toLowerCase().includes(recruitSearch.toLowerCase());

        // Role filter
        const matchesRole = recruitRoleFilter === "all" || user.role === recruitRoleFilter;

        // Match filter
        const matchesRecommendation = !recruitMatchFilter || user.isSmartMatch;

        return matchesSearch && matchesRole && matchesRecommendation;
      })
      .sort((a, b) => {
        // Prioritize smart matches, then sort by name
        if (a.isSmartMatch && !b.isSmartMatch) return -1;
        if (!a.isSmartMatch && b.isSmartMatch) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [assignableUsers, recruitSearch, recruitRoleFilter, recruitMatchFilter, selectedLot, currentAssignments]);

  function toggleAssignee(userId: Id<"users">) {
    setSelectedAssignees((current) =>
      current.includes(userId)
        ? current.filter((value) => value !== userId)
        : [...current, userId]
    );
  }

  function handleAssignSelected() {
    if (!selectedLotId || selectedAssignees.length === 0) return;

    startTransition(async () => {
      try {
        await assignLot({
          lotId: selectedLotId as Id<"lots">,
          assignedToIds: selectedAssignees,
          notes: assignmentNotes.trim() || undefined,
        });
        setSelectedAssignees([]);
        setAssignmentNotes("");
        setSuccessToastMessage("Lot successfully assigned to the selected recruits!");
        setActiveTab("manage");
        setTimeout(() => setSuccessToastMessage(null), 5000);
      } catch (err) {
        console.error("Assignment failed: ", err);
      }
    });
  }

  function handleUnassign(assignmentId: Id<"assignments">, assigneeName: string) {
    if (!window.confirm(`Are you sure you want to unassign ${assigneeName} from this lot?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await unassignLot({ assignmentId });
        setSuccessToastMessage(`Lot successfully unassigned from ${assigneeName}!`);
        setTimeout(() => setSuccessToastMessage(null), 5000);
      } catch (err) {
        console.error("Unassignment failed: ", err);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {successToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-[var(--brand-green)] bg-[var(--brand-green-muted)] px-5 py-4 text-sm font-medium text-[var(--brand-green)] shadow-lg"
          >
            <CheckCircle2 size={18} />
            <span>{successToastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Split Screen Workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:h-[calc(100vh-140px)] min-h-[600px]">
        
        {/* Left Column: Supply Lots Explorer (4/12 width) */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-[500px] lg:h-full overflow-hidden bg-[var(--surface)] p-5 rounded-2xl border border-[var(--line)]">
          <div className="flex flex-col gap-4 shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center justify-between">
              <span>Supply Lots</span>
              <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-sm text-[var(--ink-muted)] font-medium">
                {assignableLots.length}
              </span>
            </h2>

            {/* Lot List Search & Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Search lots, suppliers, category..."
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] pl-9 pr-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand-green)] focus:ring-2 focus:ring-[var(--brand-green-muted)]"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex bg-[var(--paper)] p-1 rounded-xl border border-[var(--line)]">
                {(["all", "approved", "assigned"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLotStatusFilter(tab)}
                    className={classNames(
                      "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      lotStatusFilter === tab
                        ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    )}
                  >
                    {tab === "all" ? "All Lots" : sentenceCase(tab)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lots Cards List */}
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-4 flex-1">
            <AnimatePresence mode="popLayout">
              {filteredLots.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-muted)] bg-[var(--paper)]"
                >
                  <Inbox size={32} className="mx-auto mb-3 text-[var(--line-strong)] opacity-60" />
                  No lots found matching filters.
                </motion.div>
              ) : (
                filteredLots.map((lot) => {
                  const isSelected = lot._id === selectedLotId;
                  const hasAssigned = lot.status === "assigned";
                  
                  return (
                    <motion.div
                      key={lot._id}
                      layoutId={`lot-card-${lot._id}`}
                      onClick={() => {
                        if (selectedLotId !== lot._id) {
                          setSelectedLotId(lot._id);
                          setSelectedAssignees([]);
                          setAssignmentNotes("");
                          setActiveTab("recruit");
                        }
                      }}
                      className={classNames(
                        "group cursor-pointer rounded-xl p-4 transition-all relative overflow-hidden",
                        isSelected 
                          ? "bg-[var(--brand-green-muted)]/40 border border-[var(--brand-green)]/30 ring-1 ring-[var(--brand-green)]/30" 
                          : "bg-[var(--paper)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-sm"
                      )}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col gap-2 relative z-10">
                        {/* Upper row: category and status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--brand-green)] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)]"></span>
                            {sentenceCase(lot.category)}
                          </span>
                          {hasAssigned && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-[var(--brand-green)] bg-[var(--brand-green-muted)] border border-[var(--brand-green)]/20">
                              Assigned
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className={classNames(
                          "text-base font-semibold tracking-tight transition-colors line-clamp-2",
                          isSelected ? "text-[var(--brand-green)]" : "text-[var(--ink)] group-hover:text-[var(--brand-green)]"
                        )}>
                          {lot.title}
                        </h4>

                        {/* Supplier and brief details */}
                        <div className="flex flex-col gap-1.5 text-xs text-[var(--ink-muted)] mt-1">
                          <div className="flex items-center gap-2">
                            <Building size={14} className="opacity-70 shrink-0" />
                            <span className="font-medium truncate">{lot.supplierName}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-medium bg-[var(--surface)] px-2 py-1 rounded-md border border-[var(--line)]">{lot.quantity} {lot.unit}</span>
                            <span className="font-bold text-[var(--ink)]">{formatCurrency(lot.expectedPrice)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Active Indicator Line */}
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-[var(--brand-green)]" />
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Detail Workspace (8/12 width) */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedLot ? (
              /* No Selected Lot State */
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center"
              >
                <div className="rounded-full bg-[var(--brand-green-muted)] p-6 text-[var(--brand-green)] mb-6 shadow-sm">
                  <FileText size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                  Select a Supply Lot to Begin
                </h3>
                <p className="mt-3 text-sm text-[var(--ink-muted)] max-w-md leading-relaxed">
                  Choose a lot from the browser on the left. You will be able to view its details, recruit candidates, and manage active assignments all in one place.
                </p>
              </motion.div>
            ) : (
              /* Selected Lot Workspace */
              <motion.div
                key={`workspace-${selectedLot._id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col gap-6"
              >
                {/* Header Card */}
                <div className="bg-[var(--paper)] rounded-2xl border border-[var(--line)] p-6 shadow-sm shrink-0 flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--brand-green)] bg-[var(--brand-green-muted)]/50">
                        {sentenceCase(selectedLot.category)}
                      </span>
                      <span className="text-sm font-medium text-[var(--ink-muted)] flex items-center gap-1.5">
                        <MapPin size={14} />
                        {selectedLot.location}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight mb-2">
                      {selectedLot.title}
                    </h2>
                    <div className="flex items-center gap-6 text-sm text-[var(--ink-muted)]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--ink)]">{selectedLot.quantity} {selectedLot.unit}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[var(--line-strong)]"></div>
                      <div className="flex items-center gap-2">
                        <span>Expected Price:</span>
                        <span className="font-bold text-[var(--brand-green)]">{formatCurrency(selectedLot.expectedPrice)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setIsDetailModalOpen(true)}
                    variant="secondary"
                    className="shrink-0 flex items-center gap-2 bg-[var(--surface)] hover:bg-[var(--line)] border-[var(--line)] text-sm"
                  >
                    <Info size={16} />
                    View Details
                  </Button>
                </div>

                {/* Tabs & Content Area */}
                <div className="flex flex-col flex-1 bg-[var(--paper)] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
                  
                  {/* Tabs Header */}
                  <div className="flex items-center border-b border-[var(--line)] px-2 pt-2 bg-[var(--surface)] shrink-0 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setActiveTab("recruit")}
                      className={classNames(
                        "px-6 py-3 text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2",
                        activeTab === "recruit"
                          ? "bg-[var(--paper)] text-[var(--brand-green)] border-t border-x border-[var(--line)] shadow-[0_4px_0_0_var(--paper)] relative z-10 -mb-[1px]"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      )}
                    >
                      <UserPlus size={16} />
                      Recruit Candidates
                    </button>
                    <button
                      onClick={() => setActiveTab("manage")}
                      className={classNames(
                        "px-6 py-3 text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2",
                        activeTab === "manage"
                          ? "bg-[var(--paper)] text-[var(--brand-green)] border-t border-x border-[var(--line)] shadow-[0_4px_0_0_var(--paper)] relative z-10 -mb-[1px]"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      )}
                    >
                      <Users size={16} />
                      Active Assignments
                      <span className={classNames(
                        "ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
                        activeTab === "manage" ? "bg-[var(--brand-green-muted)]" : "bg-[var(--line)] text-[var(--ink)]"
                      )}>
                        {currentAssignments?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Tab Content Area */}
                  <div className="flex-1 overflow-hidden flex flex-col p-6">
                    {activeTab === "recruit" ? (
                      /* RECRUIT TAB CONTENT */
                      <motion.div
                        key="tab-recruit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col h-full gap-4"
                      >
                        {/* Recruits Search & Filter controls */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                          <div className="md:col-span-6 relative">
                            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ink-muted)]" />
                            <input
                              type="text"
                              placeholder="Search recruits by name, business, location..."
                              value={recruitSearch}
                              onChange={(e) => setRecruitSearch(e.target.value)}
                              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-9 pr-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand-green)] focus:ring-2 focus:ring-[var(--brand-green-muted)]"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <select
                              value={recruitRoleFilter}
                              onChange={(e) => setRecruitRoleFilter(e.target.value as any)}
                              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand-green)]"
                            >
                              <option value="all">All Roles</option>
                              <option value="buyer">Buyers Only</option>
                              <option value="agent">Agents Only</option>
                            </select>
                          </div>

                          <div className="md:col-span-3 flex items-center justify-end">
                            <label className="flex items-center gap-2 cursor-pointer text-sm select-none p-2 rounded-lg hover:bg-[var(--surface)] transition">
                              <input
                                type="checkbox"
                                checked={recruitMatchFilter}
                                onChange={(e) => setRecruitMatchFilter(e.target.checked)}
                                className="rounded text-[var(--brand-green)] focus:ring-[var(--brand-green)] w-4 h-4 border-[var(--line-strong)]"
                              />
                              <span className="font-medium text-[var(--ink)] flex items-center gap-1.5">
                                <Sparkles size={14} className="text-[var(--brand-green)]" />
                                Smart Matches
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Candidates List */}
                        <div className="flex-1 overflow-y-auto border border-[var(--line)] rounded-xl bg-[var(--surface)] p-2">
                          {assignableUsers === undefined ? (
                            <div className="flex flex-col items-center justify-center h-full text-sm text-[var(--ink-muted)] gap-3">
                              <RefreshCw size={24} className="animate-spin text-[var(--brand-green)]" />
                              <p>Syncing candidate roster...</p>
                            </div>
                          ) : filteredRecruits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                              <div className="w-16 h-16 rounded-full bg-[var(--line)] flex items-center justify-center mb-4 text-[var(--ink-muted)]">
                                <Users size={24} />
                              </div>
                              <h4 className="text-base font-semibold text-[var(--ink)]">No Candidates Found</h4>
                              <p className="text-sm text-[var(--ink-muted)] mt-1">Try adjusting your search or filters.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {filteredRecruits.map((user) => {
                                const isSelected = selectedAssignees.includes(user._id);
                                const alreadyAssigned = user.isAlreadyAssigned;
                                
                                const p = user.profile as any;
                                const businessName = user.role === "buyer" 
                                  ? p?.businessName ?? "Business Profile Pending"
                                  : p?.businessName ?? p?.fullName ?? "Agent Profile";
                                
                                return (
                                  <div
                                    key={user._id}
                                    onClick={() => {
                                      if (alreadyAssigned) return;
                                      toggleAssignee(user._id);
                                    }}
                                    className={classNames(
                                      "p-4 rounded-xl flex flex-col gap-3 transition-all relative select-none",
                                      alreadyAssigned
                                        ? "opacity-50 cursor-not-allowed bg-[var(--paper)] border border-[var(--line)]"
                                        : "cursor-pointer bg-[var(--paper)] border",
                                      isSelected && !alreadyAssigned
                                        ? "border-[var(--brand-green)] bg-[var(--brand-green-muted)]/20 shadow-sm ring-1 ring-[var(--brand-green)]/20"
                                        : "border-[var(--line)] hover:border-[var(--line-strong)]"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        {/* Simple Avatar Placeholder */}
                                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] border border-[var(--line)] flex items-center justify-center text-lg font-bold text-[var(--ink-muted)] shrink-0">
                                          {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-sm text-[var(--ink)]">
                                              {user.name}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">
                                              {user.role}
                                            </span>
                                          </div>
                                          <span className="text-xs text-[var(--ink-muted)] font-medium block mt-0.5">
                                            {businessName}
                                          </span>
                                        </div>
                                      </div>

                                      <input
                                        type="checkbox"
                                        checked={isSelected || alreadyAssigned}
                                        disabled={alreadyAssigned}
                                        onChange={() => {}} 
                                        className="rounded text-[var(--brand-green)] focus:ring-[var(--brand-green)] w-5 h-5 cursor-pointer disabled:cursor-not-allowed border-[var(--line-strong)]"
                                      />
                                    </div>

                                    {/* Smart Match / Location Info */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs mt-1">
                                      <span className="text-[var(--ink-muted)] flex items-center gap-1 w-full sm:w-auto" title={p?.address}>
                                        <MapPin size={12} className="shrink-0" />
                                        <span className="truncate max-w-[200px]">{p?.address || "No location provided"}</span>
                                      </span>

                                      {alreadyAssigned ? (
                                        <span className="font-bold text-[var(--ink-muted)] uppercase tracking-wider text-[10px] bg-[var(--surface)] px-2 py-1 rounded">
                                          Already Assigned
                                        </span>
                                      ) : user.isSmartMatch ? (
                                        <span className="inline-flex items-center gap-1 bg-[var(--brand-green-muted)] text-[var(--brand-green)] px-2 py-1 rounded-md font-bold text-[10px] uppercase tracking-wide">
                                          <Sparkles size={12} />
                                          Smart Match
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Assignment Composer */}
                        <AnimatePresence>
                          {selectedAssignees.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              className="shrink-0 flex flex-col gap-3 rounded-xl border border-[var(--line-strong)] bg-[var(--brand-green-muted)]/10 p-4"
                            >
                              <div>
                                <label className="text-xs font-semibold text-[var(--ink)] block mb-1.5 flex items-center gap-1.5">
                                  <FileText size={14} className="text-[var(--ink-muted)]" />
                                  Add Instructions / Notes (Optional)
                                </label>
                                <Textarea
                                  value={assignmentNotes}
                                  onChange={(e) => setAssignmentNotes(e.target.value)}
                                  placeholder="Describe logistics, price expectations, or key instructions for these recruits..."
                                  className="text-sm bg-[var(--paper)] resize-none"
                                  rows={2}
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-1">
                                <div className="text-sm text-[var(--ink)]">
                                  Assigning to <span className="font-bold text-[var(--brand-green)]">{selectedAssignees.length} candidate(s)</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                  <Button
                                    variant="secondary"
                                    onClick={() => setSelectedAssignees([])}
                                    className="text-sm bg-[var(--paper)] hover:bg-[var(--surface)] border-[var(--line)]"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    disabled={isPending}
                                    onClick={handleAssignSelected}
                                    className="text-sm flex items-center gap-2"
                                  >
                                    {isPending ? (
                                      <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Assigning...
                                      </>
                                    ) : (
                                      <>
                                        <UserPlus size={16} />
                                        Confirm Assignment
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      /* MANAGE ASSIGNMENTS TAB CONTENT */
                      <motion.div
                        key="tab-manage"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col h-full"
                      >
                        <div className="flex-1 overflow-y-auto">
                          {currentAssignments === undefined ? (
                            <div className="flex flex-col items-center justify-center h-full text-sm text-[var(--ink-muted)] gap-3">
                              <RefreshCw size={24} className="animate-spin text-[var(--brand-green)]" />
                              <p>Loading active assignments...</p>
                            </div>
                          ) : currentAssignments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-12 border-2 border-dashed border-[var(--line)] rounded-xl bg-[var(--surface)]">
                              <div className="w-16 h-16 rounded-full bg-[var(--paper)] flex items-center justify-center mb-4 text-[var(--ink-muted)] shadow-sm">
                                <Inbox size={24} />
                              </div>
                              <h4 className="text-lg font-semibold text-[var(--ink)] mb-2">No Active Assignments</h4>
                              <p className="text-sm text-[var(--ink-muted)] max-w-sm">
                                This lot has not been assigned to anyone yet. Switch to the Recruit Candidates tab to distribute it.
                              </p>
                              <Button 
                                variant="secondary" 
                                className="mt-6 bg-[var(--paper)] border-[var(--line)]"
                                onClick={() => setActiveTab("recruit")}
                              >
                                Go to Recruitment
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {currentAssignments.map((assignment) => {
                                const status = assignment.responseStatus ?? "pending";
                                
                                let statusColor = "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]";
                                let statusIcon = <Clock size={14} className="animate-pulse" />;
                                let statusText = "Pending Response";
                                
                                if (status === "interested") {
                                  statusColor = "bg-[var(--brand-green-muted)] text-[var(--brand-green)] border-[var(--brand-green)]/30";
                                  statusIcon = <CheckCircle2 size={14} />;
                                  statusText = "Interested";
                                } else if (status === "not_interested") {
                                  statusColor = "bg-red-50 text-red-700 border-red-200";
                                  statusIcon = <XCircle size={14} />;
                                  statusText = "Not Interested";
                                }

                                return (
                                  <div
                                    key={assignment._id}
                                    className="border border-[var(--line)] bg-[var(--paper)] p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:border-[var(--line-strong)] transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] border border-[var(--line)] flex items-center justify-center text-lg font-bold text-[var(--ink-muted)] shrink-0">
                                          {assignment.assigneeName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-base text-[var(--ink)] block">
                                              {assignment.assigneeName}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">
                                              {assignment.assigneeRole}
                                            </span>
                                          </div>
                                          <div className="text-xs text-[var(--ink-muted)] font-medium mt-1">
                                            Assigned {formatDate(assignment.assignedAt)}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className={classNames("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border", statusColor)}>
                                          {statusIcon}
                                          <span>{statusText}</span>
                                        </div>
                                        <button
                                          onClick={() => handleUnassign(assignment._id, assignment.assigneeName)}
                                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
                                          title="Revoke assignment"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </div>

                                    {assignment.notes && (
                                      <div className="bg-[var(--surface)]/50 p-3 rounded-lg border border-[var(--line)]/60 text-sm flex gap-3 items-start">
                                        <FileText size={16} className="text-[var(--ink-muted)] shrink-0 mt-0.5" />
                                        <div>
                                          <span className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider block mb-1">Assignment Note</span>
                                          <span className="text-[var(--ink)] leading-relaxed">{assignment.notes}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Simplified Lot Details Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedLot && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl bg-[var(--paper)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4 bg-[var(--surface)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-green)]">
                    Lot Specifications
                  </span>
                  <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight mt-0.5">
                    {selectedLot.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--muted)] transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex flex-col gap-6 max-h-[70vh]">
                {/* Image gallery */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center min-h-[260px] relative overflow-hidden">
                  {selectedLot.imageUrls && selectedLot.imageUrls.length > 0 ? (
                    <img
                      src={selectedLot.imageUrls[0]}
                      alt={selectedLot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[var(--ink-muted)] opacity-60">
                      <Building size={48} className="mb-3 text-[var(--brand-green)]" />
                      <span className="text-sm font-semibold">No Image Uploaded</span>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-[var(--surface)] p-5 rounded-xl border border-[var(--line)]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">Supplier</span>
                    <span className="font-semibold text-[var(--ink)]">{selectedLot.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">Expected Price</span>
                    <span className="font-bold text-[var(--brand-green)]">{formatCurrency(selectedLot.expectedPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">Quantity</span>
                    <span className="font-semibold text-[var(--ink)]">{selectedLot.quantity} {selectedLot.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">Category</span>
                    <span className="font-semibold text-[var(--ink)]">{sentenceCase(selectedLot.category)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">Location</span>
                    <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                      <MapPin size={14} className="text-[var(--brand-green)]" />
                      {selectedLot.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">Expiry Date</span>
                    <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                      <Calendar size={14} className="text-red-500" />
                      {formatDate(selectedLot.expiresAt)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-2">Description</span>
                  <p className="text-sm text-[var(--ink-muted)] leading-relaxed bg-[var(--surface)]/50 p-4 rounded-xl border border-[var(--line)]">
                    {selectedLot.description || "No description provided for this supply lot."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end p-4 border-t border-[var(--line)] bg-[var(--surface)]">
                <Button onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
