"use client";

/**
 * The brand's brief pack on a project: reference images, technical drawings and
 * spec documents the makers build the product from. Read-only for everyone but
 * the owning brand — adding is `addProjectReference`.
 */

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button, EmptyState, Field, Input } from "@/components/ui";
import type { EvidenceItem, Id } from "../_mock/types";
import type { ProjectReferenceInput } from "../_mock/operations/demand";
import { useDemoStore } from "../_mock/store";
import { NoticeBanner, formatDate } from "./cirka-ui";
import { useAction } from "./use-action";

export const BRIEF_KIND_LABELS: Record<string, string> = {
  design_reference: "Reference",
  technical_drawing: "Drawing",
  document: "Spec",
};

function fileSize(bytes: number): string {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.round(bytes / 1000)} KB`;
}

function KindTag({ kind }: { kind: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full bg-[var(--brand-primary-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
      {BRIEF_KIND_LABELS[kind] ?? kind.replace(/_/g, " ")}
    </span>
  );
}

/**
 * The demo has no file picker, so each button stands for an upload of that type
 * and the brand types the instruction that travels with it.
 */
const BRIEF_UPLOADS = [
  {
    kind: "design_reference" as const,
    label: "Reference image",
    fileUrl: "/cirka_batch_cotton_twill.png",
    fileName: "design-reference.png",
    mimeType: "image/png",
  },
  {
    kind: "technical_drawing" as const,
    label: "Drawing",
    fileUrl: "/cirka_pattern_maker.png",
    fileName: "construction-drawing.png",
    mimeType: "image/png",
  },
  {
    kind: "document" as const,
    label: "Spec document",
    fileUrl: "",
    fileName: "specification.pdf",
    mimeType: "application/pdf",
  },
];

/** One resource before it is attached: the same shape `addProjectReference` takes, minus the project. */
export type BriefResourceDraft = Omit<ProjectReferenceInput, "projectId">;

/**
 * The picker itself. `onAdd` resolves false when the resource was refused, so
 * the note stays in the field for another attempt.
 */
export function BriefResourcePicker({
  onAdd,
  pending,
}: {
  onAdd: (draft: BriefResourceDraft) => Promise<boolean>;
  pending?: boolean;
}) {
  const [caption, setCaption] = useState("");

  return (
    <div className="space-y-3">
      <Field
        label="What should the makers take from it?"
        hint="This note travels with the file — it is the instruction, not a filename."
      >
        <Input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Nest the side panels across the shade break, not around it."
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        {BRIEF_UPLOADS.map((upload) => (
          <Button
            key={upload.kind}
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={async () => {
              const added = await onAdd({
                kind: upload.kind,
                fileName: upload.fileName,
                fileUrl: upload.fileUrl,
                mimeType: upload.mimeType,
                caption: caption.trim() || undefined,
              });

              if (added) {
                setCaption("");
              }
            }}
          >
            Attach {upload.label.toLowerCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Brand-side, on a project that exists: attach another resource to the brief. */
export function AddBriefResource({ projectId }: { projectId: Id }) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();

  return (
    <div className="space-y-3">
      <BriefResourcePicker
        pending={pending}
        onAdd={(draft) => run(() => store.addProjectReference("brand", { projectId, ...draft }))}
      />

      {error && (
        <NoticeBanner tone="blocking" title="That resource was refused">
          {error}
        </NoticeBanner>
      )}
    </div>
  );
}

/** Staged resources on the create-brief form, before the project has an id. */
export function BriefResourceDraftList({
  drafts,
  onRemove,
}: {
  drafts: BriefResourceDraft[];
  onRemove: (index: number) => void;
}) {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
      {drafts.map((draft, index) => (
        <li
          key={`${draft.fileName}-${index}`}
          className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3 last:border-b-0"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-[var(--ink)]">
                {draft.fileName}
              </span>
              <KindTag kind={draft.kind} />
            </div>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {draft.caption ?? "No note for the makers yet."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[var(--brand-primary)]"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ProjectBriefPack({
  items,
  emptyBody,
}: {
  items: EvidenceItem[];
  emptyBody: string;
}) {
  if (items.length === 0) {
    return <EmptyState title="Nothing to work from yet" body={emptyBody} />;
  }

  const visuals = items.filter((item) => item.mimeType.startsWith("image/"));
  const documents = items.filter((item) => !item.mimeType.startsWith("image/"));

  return (
    <div className="space-y-4">
      {visuals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visuals.map((item) => (
            <figure
              key={item._id}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.fileUrl}
                alt={item.caption ?? item.fileName}
                className="h-44 w-full object-cover"
              />
              <figcaption className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <KindTag kind={item.kind} />
                  <span className="truncate text-[11px] text-[var(--ink-muted)]">
                    {item.fileName}
                  </span>
                </div>
                {item.caption && (
                  <p className="text-sm leading-relaxed text-[var(--ink)]">{item.caption}</p>
                )}
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Added {formatDate(item.createdAt)} · {fileSize(item.sizeBytes)}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
          {documents.map((item) => (
            <div
              key={item._id}
              className="flex items-start gap-4 border-b border-[var(--line)] px-5 py-4 last:border-b-0"
            >
              <FileText size={18} className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">{item.fileName}</p>
                  <KindTag kind={item.kind} />
                </div>
                {item.caption && (
                  <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{item.caption}</p>
                )}
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Added {formatDate(item.createdAt)} · {fileSize(item.sizeBytes)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
