"use client";

/**
 * The narration layer.
 *
 * Deliberately dark and deliberately not a card: it sits on top of the product
 * rather than inside it, so nothing on screen behind it is ever mistaken for
 * part of the story chrome.
 *
 * Collapsed by default — a single pill with the minimum controls, so the screen
 * being narrated stays the thing you look at. Expanding reveals the beat detail
 * and the act rail (one tick per beat, grouped by act) for jumping around.
 */

import { useState } from "react";
import {
  AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play, X,
} from "lucide-react";
import { classNames } from "@/lib/utils";
import { ROLE_LABELS } from "../_mock/domain";
import { useStory } from "./store";

export function StoryDock() {
  const {
    script, beats, index, current, error, autoplay,
    atStart, atEnd, next, back, goTo, exitStory, setAutoplay,
  } = useStory();
  const [expanded, setExpanded] = useState(false);

  if (!script || !current) {
    return null;
  }

  const acts = script.acts.map((act) => ({
    act,
    beats: beats.filter((entry) => entry.act.id === act.id),
  }));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4">
      <div
        className={classNames(
          "pointer-events-auto w-full rounded-2xl border border-white/20 bg-[var(--charcoal,#545454)] text-white shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition-[max-width] duration-200 ease-[var(--ease-out)]",
          expanded ? "max-w-5xl" : "max-w-2xl",
        )}
      >
        {expanded ? (
          <>
            {/* Act rail: one tick per beat, grouped so the acts read as chapters. */}
            <div className="flex items-end gap-3 px-5 pt-4">
              {acts.map(({ act, beats: actBeats }) => {
                const active = actBeats.some((entry) => entry.index === index);

                return (
                  <div key={act.id} className="min-w-0 flex-1">
                    <p
                      className={classNames(
                        "truncate text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-200 ease-[var(--ease-out)]",
                        active ? "text-white" : "text-white/40",
                      )}
                    >
                      {act.title}
                    </p>
                    <div className="mt-1.5 flex gap-1">
                      {actBeats.map((entry) => (
                        <button
                          key={entry.beat.id}
                          type="button"
                          onClick={() => goTo(entry.index)}
                          title={entry.beat.title}
                          className={classNames(
                            "h-1 flex-1 rounded-full transition-colors duration-200 ease-[var(--ease-out)] hover:bg-[var(--brand-primary-light)]",
                            entry.index === index
                              ? "bg-[var(--brand-primary)]"
                              : entry.index < index
                                ? "bg-white/55"
                                : "bg-white/15",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-3 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
                {ROLE_LABELS[current.beat.role]}
              </p>
              <h2 className="mt-1 text-[17px] font-semibold leading-snug text-white">{current.beat.title}</h2>
              {current.beat.detail ? (
                <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-white/80">
                  {current.beat.detail}
                </p>
              ) : null}
              {error ? (
                <p className="mt-2 flex items-start gap-2 text-[13px] text-[#F0A0A0]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>This beat was refused by the mock: {error}</span>
                </p>
              ) : null}
            </div>
          </>
        ) : (
          /* Collapsed: whole-story progress as one hairline, no per-beat targets. */
          <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-300 ease-[var(--ease-out)]"
              style={{ width: `${((index + 1) / beats.length) * 100}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 px-5 pb-3 pt-2">
          <div className="min-w-0 flex-1">
            {expanded ? null : (
              <p className="flex items-baseline gap-2 truncate">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
                  {ROLE_LABELS[current.beat.role]}
                </span>
                <span className="truncate text-[13px] font-medium text-white">{current.beat.title}</span>
              </p>
            )}
            <p className="text-[11px] text-white/60">
              {index + 1} / {beats.length}
              {error && !expanded ? (
                <span className="ml-2 inline-flex items-center gap-1 text-[#F0A0A0]">
                  <AlertTriangle className="h-3 w-3" /> refused
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <DockButton
              label={expanded ? "Collapse" : "Show detail"}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </DockButton>

            <DockButton label="Previous beat" onClick={back} disabled={atStart}>
              <ChevronLeft className="h-4 w-4" />
            </DockButton>

            <DockButton
              label={autoplay ? "Pause" : "Play through"}
              onClick={() => setAutoplay(!autoplay)}
              disabled={atEnd}
            >
              {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </DockButton>

            <button
              type="button"
              onClick={next}
              disabled={atEnd}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-[transform,background-color] duration-[160ms] ease-[var(--ease-out)] hover:bg-[var(--brand-primary-light)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {atEnd ? "End" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>

            <DockButton label="Leave the story" onClick={exitStory}>
              <X className="h-4 w-4" />
            </DockButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function DockButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/90 transition-[background-color,color] duration-[160ms] ease-[var(--ease-out)] hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
