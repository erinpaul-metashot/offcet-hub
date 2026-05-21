"use client";

import { useDeferredValue, useMemo, useState, useTransition, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Button,
  Field,
  Input,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { classNames, formatDate } from "@/lib/utils";
import { ROLE_LABELS, type UserRole, type UserStatus } from "@/types/domain";
import { 
  Check, 
  Edit2, 
  Trash2, 
  X, 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Phone 
} from "lucide-react";

type ManagedUser = {
  _id: Id<"users">;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewNotes?: string;
  profileSummary: string;
  canDelete: boolean;
  deleteBlockReason?: string;
};

type UserEditorState = {
  userId: Id<"users">;
  name: string;
  phone: string;
  status?: UserStatus;
  reviewNotes: string;
};

type UserTab = "users" | "requests";
const EMPTY_USERS: ManagedUser[] = [];



function matchesSearch(user: ManagedUser, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    user.name,
    user.email,
    user.phone,
    ROLE_LABELS[user.role],
    user.status,
    user.profileSummary,
  ].some((value) => value.toLowerCase().includes(needle));
}

function createEditor(user: ManagedUser): UserEditorState {
  return {
    userId: user._id,
    name: user.name,
    phone: user.phone,
    status: user.role === "admin" ? undefined : user.status,
    reviewNotes: user.reviewNotes ?? "",
  };
}

export default function UserManagementPage() {
  const userManagement = useQuery(api.admin.getUserManagementView);
  const approveUser = useMutation(api.admin.approveUser);
  const rejectUser = useMutation(api.admin.rejectUser);
  const updateUserAccount = useMutation(api.admin.updateUserAccount);
  const deleteUserAccount = useMutation(api.admin.deleteUserAccount);

  const [activeTab, setActiveTab] = useState<UserTab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [editor, setEditor] = useState<UserEditorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const managedUsers = userManagement?.managedUsers ?? EMPTY_USERS;
  const pendingRequests = userManagement?.pendingRequests ?? EMPTY_USERS;

  const filteredManagedUsers = useMemo(
    () => managedUsers.filter((user) => matchesSearch(user, deferredSearchQuery)),
    [deferredSearchQuery, managedUsers],
  );

  const filteredPendingRequests = useMemo(
    () => pendingRequests.filter((user) => matchesSearch(user, deferredSearchQuery)),
    [deferredSearchQuery, pendingRequests],
  );

  function clearMessages() {
    setError(null);
    setFeedback(null);
  }

  function startEditing(user: ManagedUser, tab: UserTab) {
    clearMessages();
    setActiveTab(tab);
    setEditor(createEditor(user));
  }

  function cancelEditing() {
    setEditor(null);
  }

  function saveUserChanges() {
    if (!editor) return;
    clearMessages();

    startTransition(async () => {
      try {
        await updateUserAccount({
          userId: editor.userId,
          name: editor.name,
          phone: editor.phone,
          status: editor.status,
          reviewNotes: editor.reviewNotes.trim() || undefined,
        });
        setEditor(null);
        setFeedback("User details updated.");
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Could not save user changes.");
      }
    });
  }

  function approveRequest(user: ManagedUser) {
    clearMessages();

    startTransition(async () => {
      try {
        await approveUser({ userId: user._id });
        if (editor?.userId === user._id) {
          setEditor(null);
        }
        setFeedback(`${user.name} was approved.`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Approval failed.");
      }
    });
  }

  function rejectRequest(user: ManagedUser) {
    const note = window.prompt("Optional rejection note:");
    if (note === null) return;

    clearMessages();

    startTransition(async () => {
      try {
        await rejectUser({
          userId: user._id,
          reviewNotes: note.trim() || undefined,
        });
        if (editor?.userId === user._id) {
          setEditor(null);
        }
        setFeedback(`${user.name} was rejected.`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Rejection failed.");
      }
    });
  }

  function removeUser(user: ManagedUser) {
    if (!user.canDelete) {
      setError(user.deleteBlockReason ?? "This account cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete ${user.name}'s account record? This will remove their local profile data.`);
    if (!confirmed) return;

    clearMessages();

    startTransition(async () => {
      try {
        await deleteUserAccount({ userId: user._id });
        if (editor?.userId === user._id) {
          setEditor(null);
        }
        setFeedback(`${user.name} was deleted.`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Delete failed.");
      }
    });
  }

  function renderUserTable(users: ManagedUser[], tab: UserTab) {
    if (!users.length) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Users size={48} className="mb-4 text-[var(--ink-muted)] opacity-50" />
          <h3 className="text-lg font-bold text-[var(--ink)] mb-1">
            {tab === "users" ? "No users found" : "Queue Clear"}
          </h3>
          <p className="text-sm text-[var(--ink-muted)]">
            {tab === "users"
              ? "Try a different search term, or switch to the requests tab for pending registrations."
              : "No pending users are waiting for review right now."}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface)]">
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] w-1/4 rounded-tl-xl">
                  User Details
                </th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] w-1/4">
                  Contact & Role
                </th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] w-1/4">
                  Profile Info
                </th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Status
                </th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Joined Date
                </th>
                <th className="py-4 pr-6 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] rounded-tr-xl">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-[var(--paper)]">
              {users.map((user) => {
                const isEditing = editor?.userId === user._id;
                return (
                  <tr
                    key={user._id}
                    className={classNames(
                      "hover:bg-[var(--surface)] transition-colors group",
                      isEditing ? "bg-[var(--brand-green-muted)]/10" : ""
                    )}
                  >
                    <td className="py-4 px-6 align-top">
                      <div className="font-semibold text-base text-[var(--ink)] group-hover:text-[var(--brand-green)] transition-colors">
                        {user.name}
                      </div>
                      <div className="text-xs text-[var(--ink-muted)] mt-1 flex items-center gap-1.5">
                        <Mail size={12} /> {user.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="text-[var(--ink)] text-xs flex items-center gap-1.5 mb-2">
                        <Phone size={12} className="text-[var(--ink-muted)]" /> {user.phone}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-[var(--ink-muted)] bg-[var(--surface)] border border-[var(--line)]">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="py-4 px-6 align-top max-w-[280px]">
                      <p className="text-xs text-[var(--ink-muted)] line-clamp-3 leading-relaxed" title={user.profileSummary}>
                        {user.profileSummary || <span className="italic opacity-50">No profile summary</span>}
                      </p>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="py-4 px-6 align-top text-xs text-[var(--ink-muted)]">
                      <div className="font-medium text-[var(--ink)]">{formatDate(user.createdAt)}</div>
                      {user.reviewedAt && (
                        <div className="text-[10px] mt-1 flex flex-col gap-0.5">
                          <span className="opacity-70">Reviewed:</span>
                          <span className="font-medium text-[var(--ink)]">{formatDate(user.reviewedAt)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-6 align-top text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {tab === "requests" ? (
                          <>
                            <button
                              onClick={() => approveRequest(user)}
                              disabled={isPending}
                              title="Approve User"
                              className="p-2 bg-transparent text-[var(--brand-green)] hover:bg-[var(--brand-green-muted)]/50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => rejectRequest(user)}
                              disabled={isPending}
                              title="Reject User"
                              className="p-2 bg-transparent text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X size={18} />
                            </button>
                            <button
                              onClick={() => startEditing(user, "requests")}
                              disabled={isPending}
                              title="Edit Details"
                              className="p-2 bg-transparent text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Edit2 size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(user, "users")}
                              disabled={isPending}
                              title="Edit User"
                              className="p-2 bg-transparent text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => removeUser(user)}
                              disabled={isPending || !user.canDelete}
                              title={user.canDelete ? "Delete User" : user.deleteBlockReason}
                              className={classNames(
                                "p-2 bg-transparent rounded-lg transition-colors",
                                user.canDelete
                                  ? "text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  : "text-[var(--line-strong)] cursor-not-allowed"
                              )}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4 p-4">
          {users.map((user) => (
            <div key={user._id} className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[var(--ink)] text-base">{user.name}</h3>
                  <div className="text-xs text-[var(--ink-muted)] mt-1 flex items-center gap-1.5">
                    <Mail size={12} /> {user.email}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={user.status} />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-[var(--ink-muted)] bg-[var(--surface)] border border-[var(--line)]">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[var(--ink-muted)] space-y-2 pt-3 border-t border-[var(--line)]">
                <div className="flex items-center gap-1.5 text-[var(--ink)]">
                  <Phone size={12} className="text-[var(--ink-muted)]" /> {user.phone}
                </div>
                {user.profileSummary && (
                  <p className="line-clamp-2 leading-relaxed bg-[var(--surface)] p-2 rounded-lg border border-[var(--line)] text-[11px]">{user.profileSummary}</p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)] pt-1">
                  <Clock size={12} />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                {tab === "requests" ? (
                  <>
                    <Button onClick={() => approveRequest(user)} disabled={isPending} size="sm" className="px-3 py-1.5 text-xs bg-[var(--brand-green)] hover:bg-[var(--brand-green-dark)] text-white">Approve</Button>
                    <Button onClick={() => rejectRequest(user)} disabled={isPending} variant="secondary" size="sm" className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Reject</Button>
                    <Button onClick={() => startEditing(user, "requests")} disabled={isPending} variant="ghost" size="sm" className="px-3 py-1.5 text-xs">Edit</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => startEditing(user, "users")} disabled={isPending} variant="secondary" size="sm" className="px-3 py-1.5 text-xs">Edit User</Button>
                    <Button onClick={() => removeUser(user)} disabled={isPending || !user.canDelete} variant="ghost" size="sm" className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">Delete</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userManagement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-[var(--ink-muted)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-green)] border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium">Loading user accounts...</p>
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
              User Management
            </h1>
            <p className="text-base text-[var(--ink-muted)] leading-relaxed">
              Manage live accounts, review incoming registration requests, and maintain the platform's user roster securely.
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
                activeTab === "users"
                  ? "border-[var(--brand-green)] text-[var(--brand-green)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
              onClick={() => setActiveTab("users")}
              type="button"
            >
              Users <span className="ml-1.5 bg-[var(--line)] text-[var(--ink)] px-2 py-0.5 rounded-full text-[10px]">{managedUsers.length}</span>
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
              Requests <span className="ml-1.5 bg-[var(--line)] text-[var(--ink)] px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>
            </button>
          </div>

          <div className="w-full sm:w-80 p-3 sm:p-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-green-muted)] focus:border-[var(--brand-green)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 bg-[var(--surface)]/20 p-4 sm:p-6">
          {activeTab === "users" ? renderUserTable(filteredManagedUsers, "users") : renderUserTable(filteredPendingRequests, "requests")}
        </div>
      </div>

      {editor && (
        <UserEditDrawer
          editor={editor}
          setEditor={setEditor}
          isPending={isPending}
          onSave={saveUserChanges}
          onCancel={cancelEditing}
          userRole={
            managedUsers.find((u) => u._id === editor.userId)?.role ||
            pendingRequests.find((u) => u._id === editor.userId)?.role
          }
        />
      )}
    </div>
  );
}

interface UserEditDrawerProps {
  editor: UserEditorState;
  setEditor: React.Dispatch<React.SetStateAction<UserEditorState | null>>;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
  userRole?: UserRole;
}

function UserEditDrawer({
  editor,
  setEditor,
  isPending,
  onSave,
  onCancel,
  userRole,
}: UserEditDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isPending]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-drawer-fade-in {
          animation: drawerFadeIn 0.2s ease-out forwards;
        }
        .animate-drawer-slide-in {
          animation: drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-drawer-fade-in"
        onClick={() => {
          if (!isPending) onCancel();
        }}
      />

      {/* Drawer slide-over */}
      <div className="relative z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--paper)] shadow-2xl animate-drawer-slide-in sm:max-w-lg">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line)] px-6 bg-[var(--surface)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--ink)] tracking-tight">Edit User Details</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-2 text-[var(--ink-muted)] hover:bg-[var(--line)] hover:text-[var(--ink)] rounded-xl transition-colors cursor-pointer"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Field label="Name">
            <Input
              value={editor.name}
              onChange={(event) =>
                setEditor((current) =>
                  current ? { ...current, name: event.target.value } : current,
                )
              }
              required
            />
          </Field>

          <Field label="Phone">
            <Input
              value={editor.phone}
              onChange={(event) =>
                setEditor((current) =>
                  current ? { ...current, phone: event.target.value } : current,
                )
              }
              required
            />
          </Field>

          {userRole !== "admin" ? (
            <div className="space-y-6 pt-4 border-t border-[var(--line)]">
              <Field label="Account Status">
                <Select
                  value={editor.status}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, status: event.target.value as UserStatus }
                        : current,
                    )
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </Field>

              <Field label="Review Notes" hint="Useful for internal approval context.">
                <Textarea
                  value={editor.reviewNotes}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, reviewNotes: event.target.value } : current,
                    )
                  }
                  placeholder="Optional notes for the admin team"
                  className="min-h-[120px]"
                />
              </Field>
            </div>
          ) : (
            <div className="border border-dashed border-[var(--brand-green)]/30 bg-[var(--brand-green-muted)]/10 px-5 py-4 text-sm text-[var(--ink)] rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-[var(--brand-green)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Admin account status is locked. You can update contact details, but status changes and deletions stay disabled for admin users.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--line)] bg-[var(--surface)] p-5">
          <Button disabled={isPending} onClick={onCancel} variant="secondary" type="button">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onSave} type="button">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
