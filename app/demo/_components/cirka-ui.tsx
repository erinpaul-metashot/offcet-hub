"use client";

/**
 * Presentational pieces the CIRKA screens share.
 *
 * The production `StatusBadge` is typed to the old status vocabulary, so the
 * demo carries its own badge with the same pill styling and a tone map for the
 * revised statuses.
 */

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Info,
  LayoutGrid,
  List,
  ShieldAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { Panel } from "@/components/ui";
import { classNames } from "@/lib/utils";
import {
  ASSURANCE_LABELS,
  DATA_SOURCE_LABELS,
  statusLabel,
  type AssuranceLevel,
  type DataSource,
} from "../_mock/domain";
import type { PotSlice } from "../_mock/selectors-batches";
import { formatQuantity } from "../_mock/selectors-shared";
import type { Unit } from "../_mock/domain";

type Tone = "neutral" | "progress" | "positive" | "warning" | "terminal" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border border-[var(--line)] text-[var(--ink-muted)]",
  progress: "border border-dashed border-[var(--brand-primary)] text-[var(--brand-primary)]",
  positive:
    "border border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted)] text-[var(--brand-secondary)]",
  warning: "border border-[#B4531A] bg-[#FBE9DC] text-[#8A3D11]",
  terminal: "bg-[var(--brand-primary)] text-white border-transparent",
  muted: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]",
};

const STATUS_TONE: Record<string, Tone> = {
  // accounts and organisations
  pending: "neutral",
  approved: "positive",
  rejected: "muted",
  disabled: "muted",
  suspended: "warning",
  // resource batches
  recorded: "neutral",
  imported: "neutral",
  available: "positive",
  reserved: "progress",
  assigned: "progress",
  awaiting_dispatch: "progress",
  in_transit: "progress",
  received: "progress",
  partially_allocated: "progress",
  fully_allocated: "progress",
  in_transformation: "terminal",
  completed: "positive",
  // exceptions
  receipt_discrepancy: "warning",
  cancelled: "muted",
  returned: "warning",
  damaged: "warning",
  reallocated: "warning",
  on_hold: "warning",
  // requests and matches
  draft: "neutral",
  submitted: "progress",
  under_review: "progress",
  partially_matched: "progress",
  matched: "positive",
  unfulfillable: "muted",
  in_delivery: "progress",
  fulfilled: "positive",
  closed: "muted",
  proposed: "progress",
  withdrawn: "muted",
  superseded: "muted",
  // allocations
  accepted: "positive",
  declined: "muted",
  discrepancy: "warning",
  // production
  planned: "neutral",
  awaiting_material: "progress",
  material_received: "progress",
  in_production: "terminal",
  quality_review: "progress",
  evidence_submitted: "progress",
  cirka_reviewed: "positive",
  maker_reported: "neutral",
  // projects and transfers
  active: "terminal",
  success: "positive",
  failed: "warning",
  in_progress: "progress",
  open: "warning",
  resolved: "positive",
  dismissed: "muted",
  overdue: "warning",
};

/** Inline warning-ochre text for a gap or caveat that doesn't warrant a full NoticeBanner. */
export function GapNote({ children }: { children: React.ReactNode }) {
  return <span className="text-[#8A3D11]">{children}</span>;
}

export function CirkaBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={classNames(
        "inline-flex min-h-7 items-center whitespace-nowrap rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.16em]",
        TONE_CLASS[STATUS_TONE[status] ?? "neutral"],
      )}
    >
      {label ?? statusLabel(status)}
    </span>
  );
}

/**
 * Grid/list switcher. The active option is filled with --brand-primary —
 * same "this is the active one" language as the active nav item and tab.
 */
export function ViewModeToggle({
  value,
  onChange,
}: {
  value: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}) {
  const options: { mode: "grid" | "list"; label: string; icon: typeof LayoutGrid }[] = [
    { mode: "grid", label: "Grid view", icon: LayoutGrid },
    { mode: "list", label: "List view", icon: List },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
      {options.map(({ mode, label, icon: Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            aria-pressed={active}
            className={classNames(
              "inline-flex h-7 w-8 items-center justify-center rounded-[0.35rem] transition-[background-color,color] duration-150 ease-[var(--ease-out)]",
              active
                ? "bg-[var(--brand-primary)] text-white"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            <Icon size={15} strokeWidth={active ? 2.25 : 2} />
          </button>
        );
      })}
    </div>
  );
}

/** Where a fact came from, and whether anyone checked it (04_ARCHITECTURE §6.4). */
export function ProvenanceChip({
  dataSource,
  assuranceLevel,
}: {
  dataSource: DataSource;
  assuranceLevel: AssuranceLevel;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
      <span className="rounded-full border border-[var(--line)] px-2.5 py-1">
        {DATA_SOURCE_LABELS[dataSource]}
      </span>
      <span
        className={classNames(
          "rounded-full px-2.5 py-1",
          assuranceLevel === "self_reported"
            ? "border border-dashed border-[var(--line-strong)]"
            : "border border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted)] text-[var(--brand-secondary)]",
        )}
      >
        {ASSURANCE_LABELS[assuranceLevel]}
      </span>
    </span>
  );
}

const BUCKET_COLOUR: Record<string, string> = {
  available: "bg-[var(--brand-secondary)]",
  reserved: "bg-[#C8A96B]",
  allocated: "bg-[#B4531A]",
  in_transit: "bg-[#7A5CC4]",
  at_custodian: "bg-[#2F6F7A]",
  with_maker: "bg-[var(--brand-primary)]",
  consumed: "bg-[#5C3A21]",
  written_off: "bg-[#9A9A9A]",
  unexplained: "bg-[#D14343]",
};

/** The stacked pot view — the invariant made visible. */
export function QuantityPotsBar({
  slices,
  total,
  unit,
  compact = false,
}: {
  slices: PotSlice[];
  total: number;
  unit: Unit;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface)]">
        {slices.map((slice) => (
          <div
            key={slice.bucket}
            className={classNames(BUCKET_COLOUR[slice.bucket] ?? "bg-[var(--line-strong)]")}
            style={{ width: `${Math.max(slice.share * 100, 1.5)}%` }}
            title={`${slice.label}: ${formatQuantity(slice.quantity, unit)}`}
          />
        ))}
      </div>

      {!compact && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {slices.map((slice) => (
            <div key={slice.bucket} className="flex items-center gap-2">
              <span
                className={classNames(
                  "h-2.5 w-2.5 rounded-full",
                  BUCKET_COLOUR[slice.bucket] ?? "bg-[var(--line-strong)]",
                )}
              />
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {slice.label}
              </dt>
              <dd className="text-sm font-medium text-[var(--ink)]">
                {formatQuantity(slice.quantity, unit)}
              </dd>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Recorded
            </dt>
            <dd className="text-sm font-semibold text-[var(--ink)]">
              {formatQuantity(total, unit)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

type RouteTone = "pending" | "current" | "done" | "warn";

const ROUTE_NODE_STYLES: Record<RouteTone, string> = {
  pending: "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink-muted)]",
  current: "border-dashed border-[var(--brand-primary)] bg-[var(--paper)] text-[var(--brand-primary)]",
  done: "border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-white",
  warn: "border-[#B4531A] bg-[#FBE9DC] text-[#8A3D11]",
};

const ROUTE_FILL_STYLES: Record<RouteTone, string> = {
  pending: "bg-[var(--line-strong)]",
  current: "bg-[var(--brand-primary)]",
  done: "bg-[var(--brand-secondary)]",
  warn: "bg-[#B4531A]",
};

/** Two endpoints and a positioned marker — where a consignment actually is between origin and destination. */
export function RouteProgress({
  fromLabel,
  toLabel,
  fraction,
  icon: Icon,
  tone = "current",
}: {
  fromLabel: string;
  toLabel: string;
  fraction: number;
  icon: LucideIcon;
  tone?: RouteTone;
}) {
  const clamped = Math.min(Math.max(fraction, 0), 1);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        <span className="truncate">{fromLabel}</span>
        <span className="truncate text-right">{toLabel}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-[var(--line)]" />
        <div
          className={classNames(
            "absolute left-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-[width] duration-300 ease-[var(--ease-out)]",
            ROUTE_FILL_STYLES[tone],
          )}
          style={{ width: `calc(${clamped} * (100% - 1.5rem))` }}
        />
        <span className="absolute left-3 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--line-strong)]" />
        <span className="absolute right-3 top-1/2 h-1.5 w-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--line-strong)]" />
        <span
          className={classNames(
            "absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-[left] duration-300 ease-[var(--ease-out)]",
            ROUTE_NODE_STYLES[tone],
          )}
          style={{ left: `calc(0.75rem + ${clamped} * (100% - 1.5rem))` }}
        >
          <Icon size={13} strokeWidth={2.25} />
        </span>
      </div>
    </div>
  );
}

export interface FlowSegment {
  key: string;
  label: string;
  value: number;
  colourClass: string;
}

/** A quantity relationship as a segmented bar — dispatched against allocated, received against dispatched. */
export function FlowBar({
  segments,
  max,
  unit,
}: {
  segments: FlowSegment[];
  max: number;
  unit: Unit;
}) {
  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={segment.colourClass}
            style={{ width: `${max > 0 ? Math.max((segment.value / max) * 100, 1.5) : 0}%` }}
            title={`${segment.label}: ${formatQuantity(segment.value, unit)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5">
            <span className={classNames("h-2 w-2 shrink-0 rounded-full", segment.colourClass)} />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {segment.label}
            </span>
            <span className="text-[11px] font-medium text-[var(--ink)]">
              {formatQuantity(segment.value, unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const LIFECYCLE_STATUSES = [
  "planned",
  "awaiting_material",
  "material_received",
  "in_production",
  "quality_review",
  "completed",
  "evidence_submitted",
  "cirka_reviewed",
] as const;

/**
 * The production lifecycle as a stepped ladder — where a batch actually sits
 * across its 8 linear stages. `on_hold`/`cancelled` fall outside the ladder
 * and render as an exception band instead of a false stage position.
 */
export function ProductionLadder({ status }: { status: string }) {
  const index = LIFECYCLE_STATUSES.indexOf(status as (typeof LIFECYCLE_STATUSES)[number]);

  if (index === -1) {
    return (
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-[#FBE9DC]" />
        <p className="text-[11px] font-medium text-[#8A3D11]">{statusLabel(status)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {LIFECYCLE_STATUSES.map((stage, i) => (
          <div
            key={stage}
            className={classNames(
              "h-1.5 flex-1 rounded-full transition-colors duration-300 ease-[var(--ease-out)]",
              i < index
                ? "bg-[var(--brand-secondary)]"
                : i === index
                  ? "bg-[var(--brand-primary)]"
                  : "bg-[var(--line)]",
            )}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium text-[var(--ink-muted)]">
        <span className="font-semibold text-[var(--ink)]">{statusLabel(status)}</span>
        {" · stage "}
        {index + 1} of {LIFECYCLE_STATUSES.length}
      </p>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function NoticeBanner({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "blocking";
  title: string;
  children?: React.ReactNode;
}) {
  const styles = {
    info: "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
    warning: "border-[#E0B48C] bg-[#FBE9DC] text-[#8A3D11]",
    blocking: "border-[#D14343] bg-[#FBE2E2] text-[#8A1F1F]",
  } as const;

  const icons = {
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
    blocking: <ShieldAlert size={16} />,
  } as const;

  return (
    <div className={classNames("flex gap-3 rounded-2xl border p-4", styles[tone])}>
      <span className="mt-0.5 shrink-0">{icons[tone]}</span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="text-sm leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export function DataRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--line)] py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--ink)] sm:max-w-[60%] sm:text-right">
        {value}
        {hint && <span className="block text-xs text-[var(--ink-muted)]">{hint}</span>}
      </dd>
    </div>
  );
}

export function LinkRow({
  href,
  title,
  meta,
  tags,
  right,
}: {
  href: string;
  title: string;
  meta?: React.ReactNode;
  tags?: Array<{ label: string; value: string }>;
  right?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-3.5 transition-[background-color,transform] duration-200 ease-[var(--ease-out)] last:border-b-0 hover:bg-[var(--surface)] hover:-translate-y-[1px]"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-[var(--ink)]">{title}</p>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--ink)]">{tag.label}:</span> {tag.value}
                {i < tags.length - 1 && <span className="text-[var(--line-strong)] ml-1.5">•</span>}
              </span>
            ))}
          </div>
        ) : meta ? (
          <div className="text-xs text-[var(--ink-muted)]">{meta}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {right}
        <ArrowRight
          size={15}
          className="text-[var(--ink-muted)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
        />
      </div>
    </Link>
  );
}

/**
 * A dialog over the screen it was opened from — used wherever an admin edits a
 * record without losing the list they picked it out of. Escape and a backdrop
 * click both close it, and the page behind stops scrolling while it is open.
 */
export function Modal({
  eyebrow,
  title,
  description,
  width = "lg",
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  width?: "md" | "lg";
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <Panel
        className={classNames(
          "animate-dialog-in max-h-[90vh] w-full space-y-6 overflow-y-auto p-6",
          width === "lg" ? "max-w-2xl" : "max-w-lg",
        )}
        /* The backdrop closes on click; the panel must not pass its own through. */
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {eyebrow}
            </p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h2>
            {description && (
              <div className="text-sm leading-relaxed text-[var(--ink-muted)]">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </Panel>
    </div>
  );
}

/**
 * Confirmation for something that cannot be undone from the UI. It states what
 * survives the action rather than asking "are you sure" — and stays open on a
 * refusal so the rule that blocked it is readable next to the button.
 */
export function ConfirmDialog({
  eyebrow,
  title,
  body,
  confirmLabel,
  error,
  pending,
  onConfirm,
  onCancel,
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  error?: string | null;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal eyebrow={eyebrow} title={title} width="md" onClose={onCancel}>
      <div className="space-y-5">
        {error && (
          <NoticeBanner tone="blocking" title="That change was refused">
            {error}
          </NoticeBanner>
        )}

        <div className="text-sm leading-relaxed text-[var(--ink-muted)]">{body}</div>

        <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--ink)] transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)]"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#D14343] bg-[#D14343] px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-[background-color,transform] duration-[160ms] ease-[var(--ease-out)] hover:bg-[#B93A3A] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** A titled group of fields. Dividers, not cards — a form is one object. */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-[var(--line)] pt-5 first:border-t-0 first:pt-0">
      <div className="space-y-1">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
          {title}
        </h3>
        {hint && <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}

export function formatDateTime(timestamp?: number): string {
  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(timestamp);
}
