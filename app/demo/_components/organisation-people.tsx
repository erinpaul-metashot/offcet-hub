"use client";

import { useState } from "react";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import type { UserInput } from "../_mock/operations/admin";
import type { OrganisationPerson } from "../_mock/selectors-admin";
import { useDemoStore } from "../_mock/store";
import type { Organisation, User } from "../_mock/types";
import { CirkaBadge, ConfirmDialog, Modal, NoticeBanner } from "./cirka-ui";
import { PersonForm } from "./person-form";
import { useAction } from "./use-action";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

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
  const { orgPeople: t } = useMessages(demoAdmin);
  const labels = useLabels();
  const fmt = useFormat();

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
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{format(t.title, { count: people.length })}</h3>
          {people.length > 0 && ownerCount === 0 && <CirkaBadge status="overdue" label={t.noOwner} />}
        </div>
        <Button size="sm" onClick={() => setEditing({})}>
          {t.addPerson}
        </Button>
      </div>

      {rowAction.error && (
        <NoticeBanner tone="blocking" title={t.refused}>
          {rowAction.error}
        </NoticeBanner>
      )}

      {people.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">{t.empty}</p>
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
                          {labels.ORG_ROLE_LABELS[user.orgRole]}
                        </Chip>
                      )}
                      {isSelf && <Chip>{t.you}</Chip>}
                      {isOnlyOwner && <CirkaBadge status="overdue" label={t.onlyOwner} />}
                    </div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {labels.ROLE_LABELS[user.role]}
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
                      {format(t.joined, { date: fmt.date(user.createdAt) })}
                      {user.lastActiveAt ? format(t.lastActive, { date: fmt.date(user.lastActiveAt) }) : ""}
                      {reviewerName ? format(t.reviewedBy, { name: reviewerName }) : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing({ person: user })}
                      disabled={rowAction.pending}
                    >
                      {t.edit}
                    </Button>

                    {!isCirkaAdmin && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={rowAction.pending || (isOnlyOwner && !isDisabled)}
                        title={
                          isOnlyOwner && !isDisabled
                            ? t.noOwnerLeft
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
                        {isDisabled ? t.enable : t.disable}
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
                            ? t.noOwnerLeft
                            : undefined
                        }
                        onClick={() => setRemoving(user)}
                      >
                        {t.remove}
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
          eyebrow={editing.person ? t.editEyebrow : undefined}
          title={editing.person?.name ?? t.newTitle}
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
          title={format(t.removeTitle, { name: removing.name })}
          confirmLabel={t.removeConfirm}
          error={removal.error}
          pending={removal.pending}
          onCancel={closeRemoval}
          onConfirm={() => handleRemove(removing)}
          body={t.removeBody}
        />
      )}
    </section>
  );
}
