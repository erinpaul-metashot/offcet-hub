"use client";

/**
 * The walkthrough picker.
 *
 * Laid out as a contents page rather than a grid of cards: each script shows
 * its acts in order, because the shape of the story is the thing a viewer is
 * choosing between, not a thumbnail.
 */

import Link from "next/link";
import { ArrowLeft, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui";
import { useStory } from "../_story/store";
import { STORY_SCRIPTS } from "../_story/scripts";
import { flattenBeats } from "../_story/types";

export default function StoryPickerPage() {
  const { startScript } = useStory();

  return (
    <main className="min-h-screen bg-[var(--sidebar-bg)] px-5 py-8 sm:px-8 lg:py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-3">
          <Button
            as={Link}
            href="/demo"
            variant="ghost"
            size="sm"
            className="-ml-4 gap-2 text-white hover:bg-[var(--sidebar-hover)]"
          >
            <ArrowLeft size={14} />
            Personas
          </Button>

          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--brand-primary)]">
            Guided walkthroughs
          </p>
          <h1 className="max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            Watch the record being written.
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--sidebar-text-muted)]">
            Each walkthrough steps through the product one beat at a time, running the real
            operations against the real ledger. Advance with the Next button, the arrow keys, or let
            it play on its own. You can stop at any point and click around what the story built.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {STORY_SCRIPTS.map((script) => {
            const beats = flattenBeats(script);

            return (
              <button
                key={script.id}
                type="button"
                onClick={() => startScript(script.id)}
                className="group animate-stagger-in rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-[border-color,transform,background-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:bg-white/[0.08] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">
                      {script.title}
                    </h2>
                    <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--sidebar-text-muted)]">
                      {script.blurb}
                    </p>
                  </div>

                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 ease-[var(--ease-out)] group-hover:bg-[var(--brand-primary)]">
                    <Play size={16} />
                  </span>
                </div>

                {/* The acts, as a spine. This is what a viewer is choosing between. */}
                <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-white/10 pt-4">
                  {script.acts.map((act, position) => (
                    <li key={act.id} className="flex items-center gap-2">
                      {position > 0 ? <span className="text-white/25">·</span> : null}
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors duration-200 ease-[var(--ease-out)] group-hover:text-white/75">
                        {act.title}
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="mt-3 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    About {script.minutes} min
                  </span>
                  <span>{beats.length} beats</span>
                  <span>
                    {script.start === "empty"
                      ? "Starts from an empty network"
                      : "Starts from the seeded demo data"}
                  </span>
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
