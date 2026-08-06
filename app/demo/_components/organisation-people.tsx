"use client";

import { useState } from "react";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { ORG_ROLE_LABELS, ROLE_LABELS } from "../_mock/domain";
import type { UserInput } from "../_mock/operations/admin";
import type { OrganisationPerson } from "../_mock/selectors-admin";
import { useDemoStore } from "../_mock/store";
import type { Organisation, User } from "../_mock/types";
import { CirkaBadge, ConfirmDialog, Modal, NoticeBanner, formatDate } from "./cirka-ui";
import { PersonForm } from "./person-form";
import { useAction } from "./use-action";

/** A short, non-status fact about the person: kept visually below the badge. */
function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
      {icon}
      {children}
    </span>
  );
}

/**
 * The organisation's roster, and everything an admin can do to it.
 *
 * Nobody is ever hard-deleted: `removeUser` closes the account and leaves the
 * history attributed to them (05_SYSTEM_DESIGN §7.2, §20). Where a rule blocks
 * an action, the row says so rather than waiting for the click to fail.
 */
export function OrganisationPeople({
  organisation,
  people,
}: {
  organisation: Organisation;
  people: OrganisationPerson[];
}) {
  const store = useDemoStore();
  /* Three surfaces, three errors: a refused row action must not appear in the form. */
  const rowAction = useAction();
  const form = useAction();
  const removal = useAction();

  /** `null` = closed. An entry with no `person` is a new hire. */
  const [editing, setEditing] = useState<{ person?: User } | null>(null);
  const [removing, setRemoving] = useState<User | null>(null);

  const signedInAs = store.personaFor("admin");
  const ownerCount = people.filter(
    (entry) => entry.user.orgRole === "owner" && entry.user.status !== "disabled",
  ).length;

  const closeForm = () => {
    form.clearError();
    setEditing(null);
  };

  const closeRemoval = () => {
    removal.clearError();
    setRemoving(null);
  };

  const handleSubmit = async (input: UserInput) => {
    const target = editing?.person;

    const ok = await form.run(() =>
      target
        ? store.adminUpdateUser("admin", { userId: target._id, patch: input })
        : store.createUser("admin", input),
    );

    if (ok) {
      setEditing(null);
    }
  };

  const handleRemove = async (user: User) => {
    const ok = await removal.run(() => store.removeUser("admin", { userId: user._id }));

    if (ok) {
      setRemoving(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--ink)]">People ({people.length})</h3>
          <p className="text-xs text-[var(--ink-muted)]">
            {ownerCount === 0
              ? "Nobody here can manage the organisation's own settings."
              : `${ownerCount} of them can manage the organisation's own settings.`}
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing({})}>
          Add person
        </Button>
      </div>

      {rowAction.error && (
        <NoticeBanner tone="blocking" title="That change was refused">
          {rowAction.error}
        </NoticeBanner>
      )}

      {people.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">Nobody on the roster yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
            {organisation.name} cannot record anything until someone here has an account.
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden p-0">
          <ul className="animate-stagger-in">
            {people.map(({ user, reviewerName, isOnlyOwner }) => {
              const isSelf = user._id === signedInAs._id;
              const isCirkaAdmin = user.role === "admin";
              const isDisabled = user.status === "disabled";

              return (
                <li
                  key={user._id}
                  className="grid gap-3 border-b border-[var(--line)] px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">{user.name}</p>
                      <CirkaBadge status={user.status} />
                      {user.orgRole === "owner" && (
                        <Chip icon={<ShieldCheck size={11} />}>
                          {ORG_ROLE_LABELS[user.orgRole]}
                        </Chip>
                      )}
                      {isSelf && <Chip>You</Chip>}
                    </div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {ROLE_LABELS[user.role]}
                    </p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--ink-muted)]">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Mail size={13} className="shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </span>
                      {user.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={13} className="shrink-0" />
                          {user.phone}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--ink-muted)]">
                      Joined {formatDate(user.createdAt)}
                      {user.lastActiveAt ? ` · last active ${formatDate(user.lastActiveAt)}` : ""}
                      {reviewerName ? ` · reviewed by ${reviewerName}` : ""}
                    </p>

                    {isOnlyOwner && (
                      <p className="text-xs text-[#8A3D11]">
                        The only owner. Make someone else an owner before disabling or removing
                        them.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing({ person: user })}
                      disabled={rowAction.pending}
                    >
                      Edit
                    </Button>

                    {!isCirkaAdmin && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={rowAction.pending || (isOnlyOwner && !isDisabled)}
                        title={
                          isOnlyOwner && !isDisabled
                            ? "The organisation would be left without an owner."
                            : undefined
                        }
                        onClick={() =>
                          rowAction.run(() =>
                            store.setUserDisabled("admin", {
                              userId: user._id,
                              disabled: !isDisabled,
                              note: isDisabled
                                ? "Access restored by CIRKA."
                                : "Access suspended by CIRKA.",
                            }),
                          )
                        }
                      >
                        {isDisabled ? "Enable" : "Disable"}
                      </Button>
                    )}

                    {!isCirkaAdmin && !isSelf && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border-[#E4A9A9] text-[#B93A3A] hover:bg-[#FBE2E2]"
                        disabled={rowAction.pending || isOnlyOwner}
                        title={
                          isOnlyOwner
                            ? "The organisation would be left without an owner."
                            : undefined
                        }
                        onClick={() => setRemoving(user)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {editing && (
        <Modal
          eyebrow={editing.person ? "Edit person" : "New person"}
          title={editing.person?.name ?? `Add someone to ${organisation.name}`}
          description={
            editing.person
              ? undefined
              : "They join with access to everything this organisation can see."
          }
          onClose={closeForm}
        >
          <PersonForm
            key={editing.person?._id ?? "new"}
            organisation={organisation}
            person={editing.person}
            error={form.error}
            pending={form.pending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {removing && (
        <ConfirmDialog
          eyebrow="Remove person"
          title={`Remove ${removing.name}?`}
          confirmLabel="Remove them"
          error={removal.error}
          pending={removal.pending}
          onCancel={closeRemoval}
          onConfirm={() => handleRemove(removing)}
          body={
            <>
              Their account closes. Everything they recorded stays attributed to them.
            </>
          }
        />
      )}
    </section>
  );
}
