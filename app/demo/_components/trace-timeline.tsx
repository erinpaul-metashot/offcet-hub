"use client";

/**
 * The timeline surface.
 *
 * One vertical rail, one dot per event, days as the only headings. The rail is
 * the point: it is the same spine the ledger runs down, so a pour and a status
 * change sit on one line and the reader never has to reconcile two lists.
 *
 * Reads come from `selectors-timeline.ts` — this file renders, it never scopes.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Panel } from "@/components/ui";
import { INTL_LOCALE, format, type Locale } from "@/lib/i18n/locale";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { classNames } from "@/lib/utils";
import type { CirkaRole } from "../_mock/domain";
import { getRoleTimeline, getThreadTimeline, type EntityRef } from "../_mock/selectors-timeline";
import { useDemoDatabase, useDemoPersona } from "../_mock/store";
import { groupByDay, type TimelineEvent, type TimelineTone } from "../_mock/timeline";
import { BUCKET_COLOUR } from "./cirka-ui";
import { useFormat } from "./use-format";
import { useLabels } from "./use-labels";

/* The dot is the only colour on the row: tone tells you how to feel about the
   event before you have read it. Sourced from the established status palette. */
const TONE_DOT: Record<TimelineTone, string> = {
  neutral: "bg-[var(--line-strong)]",
  progress: "bg-[var(--brand-primary)]",
  success: "bg-[var(--brand-secondary)]",
  warning: "bg-[#C8A96B]",
  aborted: "bg-[#D14343]",
};

function timeOfDay(timestamp: number, locale: Locale): string {
  return new Date(timestamp).toLocaleTimeString(INTL_LOCALE[locale], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "295 kg · In transit → At custodian", with the destination pot's colour. */
function QuantityChip({ event }: { event: TimelineEvent }) {
  const delta = event.quantityDelta;
  const labels = useLabels();

  if (!delta) {
    return null;
  }

  const destination = delta.to ?? delta.from;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] tabular-nums text-[var(--ink)]">
      <span
        className={classNames(
          "size-2 shrink-0 rounded-full",
          destination ? BUCKET_COLOUR[destination] : "bg-[var(--line-strong)]",
        )}
      />
      {delta.quantity} {delta.unit}
      {delta.to && (
        <span className="text-[var(--ink-muted)]">· {labels.BUCKET_LABELS[delta.to]}</span>
      )}
    </span>
  );
}

function HeadlineWithSubject({
  headline,
  subject,
  href,
}: {
  headline: string;
  subject?: string;
  href?: string;
}) {
  if (!subject) {
    return <span>{headline}</span>;
  }

  const subjectStyle = classNames(
    "font-semibold",
    href &&
      "underline decoration-[var(--line-strong)] underline-offset-2 transition-colors duration-200 ease-[var(--ease-out)] group-hover:text-[var(--brand-primary)] group-hover:decoration-[var(--brand-primary)]",
  );

  const quoted = `"${subject}"`;
  if (headline.includes(quoted)) {
    const parts = headline.split(quoted);
    return (
      <>
        {parts[0]}
        <span className={subjectStyle}>&ldquo;{subject}&rdquo;</span>
        {parts.slice(1).join(quoted)}
      </>
    );
  }

  if (headline.includes(subject)) {
    const parts = headline.split(subject);
    return (
      <>
        {parts[0]}
        <span className={subjectStyle}>{subject}</span>
        {parts.slice(1).join(subject)}
      </>
    );
  }

  return (
    <>
      {headline}
      {" — "}
      <span className={subjectStyle}>{subject}</span>
    </>
  );
}

function EventRow({ event }: { event: TimelineEvent }) {
  const { locale } = useLocale();
  const body = (
    <>
      {/* The rail passes behind the dot; the dot caps it. */}
      <span className="relative z-10 mt-[7px] flex size-[9px] shrink-0 items-center justify-center">
        <span
          className={classNames(
            "size-[9px] rounded-full ring-4 ring-[var(--paper)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-125",
            TONE_DOT[event.tone],
          )}
        />
      </span>

      <div className="min-w-0 flex-1 space-y-1 pb-5">
        <p className="text-sm leading-snug text-[var(--ink)]">
          <HeadlineWithSubject
            headline={event.headline}
            subject={event.subject}
            href={event.href}
          />
        </p>

        {event.detail && (
          <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{event.detail}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {timeOfDay(event.occurredAt, locale)}
          </span>
          <QuantityChip event={event} />
        </div>
      </div>

      {event.href && (
        <ArrowRight
          size={14}
          className="mt-2 shrink-0 text-[var(--line-strong)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
        />
      )}
    </>
  );

  const shell = "group flex gap-3.5 pl-1 pr-2";

  return event.href ? (
    <Link
      href={event.href}
      className={classNames(
        shell,
        "-ml-1 rounded-lg transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--surface)]",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/**
 * Who held the material, in order. Rendered once above the rail rather than per
 * row: custody changes four times in a journey, not forty.
 */
export function CustodyChain({ chain }: { chain: Array<{ orgId: string; name: string }> }) {
  const { timeline } = useMessages(demoCommon);

  if (chain.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-[var(--line)] px-5 py-3.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {timeline.custody}
      </span>
      {chain.map((entry, index) => (
        <span key={`${entry.orgId}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span className="text-[var(--line-strong)]">→</span>}
          <span className="text-[13px] text-[var(--ink)]">{entry.name}</span>
        </span>
      ))}
    </div>
  );
}

export function TraceTimeline({
  events,
  emptyLabel,
}: {
  events: TimelineEvent[];
  emptyLabel?: string;
}) {
  const { timeline } = useMessages(demoCommon);
  const fmt = useFormat();

  if (events.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-muted)]">{emptyLabel ?? timeline.nothingYet}</p>
    );
  }

  return (
    <div className="animate-stagger-in px-5 py-4">
      {groupByDay(events).map((day) => (
        <section key={day.key}>
          <p className="sticky top-0 z-20 -mx-5 bg-[var(--paper)] px-5 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {fmt.date(day.date)}
          </p>

          {/* The rail: one continuous line the dots sit on. */}
          <div className="relative before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-[var(--line)]">
            {day.events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * The whole cross-entity journey a record belongs to, ready to drop into a
 * detail screen. Does its own scoped read so wiring a screen is one element.
 */
export function ThreadTimelinePanel({
  role,
  anchor,
  title,
  collapsible = true,
  defaultExpanded = true,
  plain = false,
  showHeader = true,
}: {
  role: CirkaRole;
  anchor: EntityRef;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  plain?: boolean;
  showHeader?: boolean;
}) {
  const db = useDemoDatabase();
  const { scope } = useDemoPersona(role);
  const thread = getThreadTimeline(db, scope, anchor);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { timeline } = useMessages(demoCommon);

  const innerTimeline = (
    <>
      <CustodyChain chain={thread.custodyChain} />

      {/* The permission matrix, made visible to the only role allowed to see
          that it exists. A count, never the content. */}
      {thread.hiddenFromBrand && thread.hiddenFromBrand.count > 0 && (
        <p className="border-b border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-xs text-[var(--ink-muted)]">
          {format(thread.hiddenFromBrand.count === 1 ? timeline.withheldOne : timeline.withheldMany, {
            count: thread.hiddenFromBrand.count,
            org: thread.hiddenFromBrand.orgName,
          })}
        </p>
      )}

      <div className="max-h-[32rem] overflow-y-auto">
        <TraceTimeline events={thread.events} />
      </div>
    </>
  );

  const content = (
    <>
      {showHeader && (
        <div
          className={classNames(
            "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4",
            collapsible ? "cursor-pointer select-none hover:bg-[var(--surface)] transition-colors" : "",
          )}
          onClick={collapsible ? () => setIsExpanded((prev) => !prev) : undefined}
        >
          <h2 className="min-w-0 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{title ?? timeline.journey}</h2>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {format(timeline.events, { count: thread.events.length })}
            </span>
            {collapsible && (
              isExpanded ? (
                <ChevronUp className="size-4 text-[var(--ink-muted)]" />
              ) : (
                <ChevronDown className="size-4 text-[var(--ink-muted)]" />
              )
            )}
          </div>
        </div>
      )}

      {showHeader ? (isExpanded && innerTimeline) : innerTimeline}
    </>
  );

  if (plain) {
    return <div>{content}</div>;
  }

  return <Panel className="overflow-hidden">{content}</Panel>;
}

/**
 * "What happened in my world" — the dashboard feed. Scoped to the role, so a
 * brand's feed and CIRKA's feed of the same week are genuinely different lists,
 * not the same list with rows greyed out.
 */
export function RoleActivityFeed({
  role,
  limit = 8,
  title,
}: {
  role: CirkaRole;
  limit?: number;
  title?: string;
}) {
  const db = useDemoDatabase();
  const { scope } = useDemoPersona(role);
  const events = getRoleTimeline(db, scope, { limit });
  const [isExpanded, setIsExpanded] = useState(true);
  const { timeline } = useMessages(demoCommon);

  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between border-b border-[var(--line)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface)] focus:outline-none"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
          {title ?? timeline.recentActivity}
        </span>
        {isExpanded ? (
          <ChevronUp className="size-4 text-[var(--ink-muted)]" />
        ) : (
          <ChevronDown className="size-4 text-[var(--ink-muted)]" />
        )}
      </button>
      {isExpanded && (
        <div className="max-h-[22rem] overflow-y-auto">
          <TraceTimeline
            events={events}
            emptyLabel={timeline.noActivity}
          />
        </div>
      )}
    </Panel>
  );
}

/**
 * The compact variant for a detail screen's sidebar: the last few events with
 * no day headings and no links, for when the full thread lives elsewhere.
 */
export function TimelineStrip({ events, limit = 5 }: { events: TimelineEvent[]; limit?: number }) {
  const { timeline } = useMessages(demoCommon);
  const fmt = useFormat();

  if (events.length === 0) {
    return <p className="text-[13px] text-[var(--ink-muted)]">{timeline.noActivityRecorded}</p>;
  }

  return (
    <ol className="space-y-2.5">
      {events.slice(0, limit).map((event) => (
        <li key={event.id} className="flex gap-2.5">
          <span
            className={classNames("mt-[6px] size-[7px] shrink-0 rounded-full", TONE_DOT[event.tone])}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-[var(--ink)]">{event.headline}</p>
            <p className="text-[11px] tabular-nums text-[var(--ink-muted)]">
              {fmt.date(event.occurredAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
