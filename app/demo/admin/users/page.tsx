"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Pencil, Phone, X } from "lucide-react";
import { Button, EmptyState, Field, Input, Panel, Select } from "@/components/ui";
import { classNames } from "@/lib/utils";
import { ROLE_LABELS, CIRKA_ROLES, ORG_ROLES, type CirkaRole, type OrgRole } from "../../_mock/domain";
import { getUserManagementView, listOrganisations } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  SectionHeading,
  ViewModeToggle,
  formatDate,
} from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";

const TAB_TITLES = ["Awaiting review", "Approved", "Disabled", "Rejected"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function AdminUsersPage() {
  const store = useDemoStore();
  const searchParams = useSearchParams();
  const { run, error, pending } = useAction();
  const view = getUserManagementView(store.db);
  const organisations = listOrganisations(store.db);

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = useState<Record<string, "reject" | "disable" | null>>({});
  const [activeTab, setActiveTab] = useState(() => {
    const requested = searchParams.get("tab");
    return TAB_TITLES.find((title) => title.toLowerCase() === requested?.toLowerCase()) ?? "Awaiting review";
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "brand" as CirkaRole,
    orgRole: "member" as OrgRole,
    orgId: "",
  });

  const openAddModal = () => {
    setModalMode("add");
    setCurrentUserId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "brand",
      orgRole: "member",
      orgId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setModalMode("edit");
    setCurrentUserId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      orgRole: user.orgRole,
      orgId: user.orgId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgId) {
      alert("Please select an organisation.");
      return;
    }
    
    run(async () => {
      if (modalMode === "add") {
        await store.createUser("admin", { ...formData });
      } else if (modalMode === "edit" && currentUserId) {
        await store.adminUpdateUser("admin", { userId: currentUserId, patch: formData });
      }
      setIsModalOpen(false);
    });
  };

  const filterRows = (rows: typeof view.approved) => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter(({ user, organisation }) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        ROLE_LABELS[user.role].toLowerCase().includes(query) ||
        (organisation?.name && organisation.name.toLowerCase().includes(query))
      );
    });
  };

  const groups = [
    { title: "Awaiting review", rows: filterRows(view.pending) },
    { title: "Approved", rows: filterRows(view.approved) },
    { title: "Disabled", rows: filterRows(view.disabled) },
    { title: "Rejected", rows: filterRows(view.rejected) },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading title="User Accounts & Access" />

      {error && <NoticeBanner tone="blocking" title="That change was refused">{error}</NoticeBanner>}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)]">
        <div className="flex gap-6 overflow-x-auto w-full md:w-auto">
          {groups.map((group) => (
            <button
              key={group.title}
              onClick={() => setActiveTab(group.title)}
              className={classNames(
                "pb-3 text-[11px] font-bold uppercase tracking-[0.16em] transition-[border-color,color] border-b-2 whitespace-nowrap",
                activeTab === group.title
                  ? "border-[var(--brand-primary)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]"
              )}
            >
              {group.title} <span className={classNames(
                "ml-1.5 rounded-full px-2 py-0.5",
                activeTab === group.title ? "bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]" : "bg-[var(--surface)]"
              )}>{group.rows.length}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 pb-3 flex-1 justify-end">
          <div className="relative max-w-sm w-full md:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button onClick={openAddModal} size="sm">Add Person</Button>
          <div className="border-l border-[var(--line)] pl-4">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </div>

      {groups.filter(g => g.title === activeTab).map((group) => (
        <div key={group.title} className="space-y-4 pt-2">
          {group.rows.length === 0 ? (
            <EmptyState title="Nobody here" body={searchQuery ? "No accounts match your search." : `No accounts are ${group.title.toLowerCase()}.`} />
          ) : (
            <div className={classNames("grid gap-4", viewMode === "grid" ? "lg:grid-cols-2" : "grid-cols-1")}>
              {group.rows.map(({ user, organisation, reviewerName }) => {
                const editing = Boolean(activeAction[user._id]);
                const stacked = viewMode === "grid" || editing;

                const railTone =
                  user.status === "approved"
                    ? "bg-[var(--brand-secondary)]"
                    : user.status === "pending"
                      ? "bg-[repeating-linear-gradient(-45deg,var(--brand-primary)_0px,var(--brand-primary)_4px,transparent_4px,transparent_8px)]"
                      : "bg-[var(--line-strong)]";

                const iconButtonClass =
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)] active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50";

                return (
                  <Panel
                    key={user._id}
                    className={classNames(
                      "relative overflow-hidden pl-8",
                      stacked ? "space-y-4 p-6 pl-8" : "flex flex-col gap-4 p-5 pl-8 lg:flex-row lg:items-center",
                    )}
                  >
                    <span aria-hidden="true" className={classNames("absolute inset-y-0 left-0 w-1", railTone)} />

                    <div className={classNames("flex flex-1 items-start gap-3 min-w-0", !stacked && "lg:items-center")}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.65rem] border border-[var(--line)] bg-[var(--surface-elevated)] text-[13px] font-bold text-[var(--charcoal)]">
                        {getInitials(user.name)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[15.5px] font-semibold text-[var(--ink)]">{user.name}</p>
                            <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              {ROLE_LABELS[user.role]} · {organisation?.name ?? "No organisation"} · {user.orgRole}
                            </p>
                          </div>
                          {stacked && <CirkaBadge status={user.status} />}
                        </div>
                        {!stacked && (
                          <p className="hidden truncate text-[13px] text-[var(--ink-muted)] md:block">
                            {user.email}
                            {user.phone ? ` · ${user.phone}` : ""}
                          </p>
                        )}
                      </div>
                      {!stacked && <CirkaBadge status={user.status} />}
                    </div>

                    {stacked && (
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-muted)]">
                          <Mail size={13} className="text-[var(--line-strong)]" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-muted)]">
                            <Phone size={13} className="text-[var(--line-strong)]" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    )}

                    {stacked && user.reviewNotes && (
                      <p className="rounded-2xl bg-[var(--surface)] p-3 text-sm text-[var(--ink-muted)]">
                        {user.reviewNotes}
                      </p>
                    )}

                    <div
                      className={classNames(
                        "space-y-3",
                        stacked ? "border-t border-[var(--line)] pt-4" : "shrink-0",
                      )}
                    >
                      {editing && (
                        <Field label={activeAction[user._id] === "reject" ? "Reason for rejection" : "Reason for disabling"}>
                          <Input
                            value={notes[user._id] ?? ""}
                            onChange={(event) =>
                              setNotes((current) => ({ ...current, [user._id]: event.target.value }))
                            }
                            placeholder="Required"
                            autoFocus
                          />
                        </Field>
                      )}

                      <div className={classNames("flex items-center gap-2", viewMode === "grid" && "justify-between")}>
                        {viewMode === "grid" && !editing && (
                          <span className="text-xs text-[var(--ink-muted)]">
                            Registered {formatDate(user.createdAt)}
                            {user.reviewedAt ? ` · reviewed ${formatDate(user.reviewedAt)}` : ""}
                            {reviewerName ? ` by ${reviewerName}` : ""}
                            {user.lastActiveAt ? ` · last active ${formatDate(user.lastActiveAt)}` : ""}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {!editing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                aria-label={`Edit ${user.name}`}
                                title="Edit"
                                className={iconButtonClass}
                              >
                                <Pencil size={16} />
                              </button>

                              {user.status === "pending" && user.role !== "admin" && (
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() => setActiveAction(s => ({ ...s, [user._id]: "reject" }))}
                                  aria-label={`Reject ${user.name}`}
                                  title="Reject"
                                  className={classNames(
                                    iconButtonClass,
                                    "hover:border-[#D14343] hover:bg-[#FBE2E2] hover:text-[#8A1F1F]",
                                  )}
                                >
                                  <X size={16} />
                                </button>
                              )}

                              {user.status === "approved" && user.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={pending}
                                  onClick={() => setActiveAction(s => ({ ...s, [user._id]: "disable" }))}
                                >
                                  Disable
                                </Button>
                              )}

                              {user.status !== "approved" && user.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant={user.status === "pending" ? "primary" : "secondary"}
                                  disabled={pending}
                                  onClick={() =>
                                    run(() =>
                                      store.reviewUser("admin", {
                                        userId: user._id,
                                        status: "approved",
                                        reviewNotes: notes[user._id],
                                      }),
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                disabled={pending}
                                onClick={() => {
                                  if (activeAction[user._id] === "reject") {
                                    run(() => store.reviewUser("admin", { userId: user._id, status: "rejected", reviewNotes: notes[user._id] }));
                                  } else {
                                    run(() => store.setUserDisabled("admin", { userId: user._id, disabled: true, note: notes[user._id] }));
                                  }
                                  setActiveAction(s => ({ ...s, [user._id]: null }));
                                  setNotes(s => ({ ...s, [user._id]: "" }));
                                }}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={pending}
                                onClick={() => {
                                  setActiveAction(s => ({ ...s, [user._id]: null }));
                                  setNotes(s => ({ ...s, [user._id]: "" }));
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-sm">
          <Panel className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-[var(--ink)]">
              {modalMode === "add" ? "Add Person" : "Edit Person"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </Field>
              
              <Field label="Email" required>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. jane@example.com"
                  required
                />
              </Field>

              <Field label="Phone">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +44 123 456 789"
                />
              </Field>
              
              <div className="grid grid-cols-2 gap-4">
                <Field label="Role" required>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as CirkaRole })}
                    required
                  >
                    {CIRKA_ROLES.map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Org Role" required>
                  <Select
                    value={formData.orgRole}
                    onChange={(e) => setFormData({ ...formData, orgRole: e.target.value as OrgRole })}
                    required
                  >
                    {ORG_ROLES.map((role) => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Organisation" required>
                <Select
                  value={formData.orgId}
                  onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select an organisation...</option>
                  {organisations.map(({ organisation }) => (
                    <option key={organisation._id} value={organisation._id}>
                      {organisation.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)] mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {modalMode === "add" ? "Add Person" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
}
