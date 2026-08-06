"use client";

/**
 * Story mode state: which script, which beat, and whether it is advancing on
 * its own.
 *
 * The provider owns no database of its own. Each time the beat changes it
 * replays the script from the top and pushes the result into the demo store, so
 * story mode and free-roaming mode read from exactly the same place — a viewer
 * can stop mid-story, click into any screen, and everything they see is the
 * state the story built.
 */

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDemoStore } from "../_mock/store";
import { runTo } from "./runner";
import { findScript } from "./scripts";
import { flattenBeats, type FlatBeat, type StoryScript } from "./types";

/** How long an auto-advancing beat stays on screen. */
const AUTOPLAY_MS = 9_000;

interface StoryValue {
  script?: StoryScript;
  beats: FlatBeat[];
  index: number;
  current?: FlatBeat;
  /** The rule a beat broke, if one did. Shown in the dock rather than swallowed. */
  error?: string;
  autoplay: boolean;
  atStart: boolean;
  atEnd: boolean;
  startScript: (scriptId: string) => void;
  exitStory: () => void;
  goTo: (index: number) => void;
  next: () => void;
  back: () => void;
  setAutoplay: (on: boolean) => void;
}

const StoryContext = createContext<StoryValue | null>(null);

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const { loadDatabase, resetDemo } = useDemoStore();
  const router = useRouter();

  const [scriptId, setScriptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  const script = scriptId ? findScript(scriptId) : undefined;
  const beats = useMemo(() => (script ? flattenBeats(script) : []), [script]);
  const current = beats[index];

  /* Replaying is pure and takes under a millisecond, so it happens during
     render rather than in an effect: the dock and the screens then agree on the
     same beat in the same commit. */
  const state = useMemo(() => (script ? runTo(script, index) : undefined), [script, index]);

  /* Pushing the replayed state into the demo store and moving the viewer are
     both effects on things outside React, which is exactly what effects are for. */
  useEffect(() => {
    if (!state) return;

    loadDatabase(state.db);

    const { route } = state.current?.beat ?? {};
    const resolved =
      typeof route === "function"
        ? route({ ids: state.ids, remember: () => {}, recall: (key) => state.ids[key] ?? "" })
        : route;

    if (resolved) {
      router.push(resolved);
    }
  }, [state, loadDatabase, router]);

  const atStart = index <= 0;
  const atEnd = index >= beats.length - 1;

  const goTo = useCallback(
    (target: number) => setIndex(Math.max(0, Math.min(target, beats.length - 1))),
    [beats.length],
  );

  const next = useCallback(() => {
    setIndex((value) => (value >= beats.length - 1 ? value : value + 1));
  }, [beats.length]);

  const back = useCallback(() => setIndex((value) => Math.max(0, value - 1)), []);

  const startScript = useCallback((id: string) => {
    setScriptId(id);
    setIndex(0);
    setAutoplay(false);
  }, []);

  const exitStory = useCallback(() => {
    setScriptId(null);
    setAutoplay(false);
    resetDemo();
  }, [resetDemo]);

  /* Autoplay stops at the last beat rather than looping: a walkthrough that
     restarts itself behind you is disorienting in a room. */
  const playing = autoplay && !atEnd;

  useEffect(() => {
    if (!playing) return;

    const timer = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [playing, index, next]);

  /* Arrow keys and space, the way any deck works. Ignored while typing. */
  useEffect(() => {
    if (!script) return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      } else if (event.key === "Escape") {
        exitStory();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [script, next, back, exitStory]);

  const value = useMemo<StoryValue>(
    () => ({
      script,
      beats,
      index,
      current,
      error: state?.error,
      autoplay: playing,
      atStart,
      atEnd,
      startScript,
      exitStory,
      goTo,
      next,
      back,
      setAutoplay,
    }),
    [
      script, beats, index, current, state, playing, atStart, atEnd,
      startScript, exitStory, goTo, next, back,
    ],
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory(): StoryValue {
  const story = useContext(StoryContext);

  if (!story) {
    throw new Error("useStory must be used inside the /demo route tree.");
  }

  return story;
}
