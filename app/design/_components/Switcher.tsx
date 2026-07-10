"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const CONCEPTS = [
  { id: "d1", n: "01", name: "Entropy" },
  { id: "d2", n: "02", name: "Torchlight" },
  { id: "d3", n: "03", name: "Redacted" },
  { id: "d4", n: "04", name: "Ballast" },
  { id: "d5", n: "05", name: "Sorting" },
] as const;

export function Switcher() {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = Math.max(
    0,
    CONCEPTS.findIndex((c) => pathname?.endsWith(`/${c.id}`)),
  );

  const go = useCallback(
    (i: number) => {
      const next = (i + CONCEPTS.length) % CONCEPTS.length;
      router.push(`/design/${CONCEPTS[next].id}`);
    },
    [router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") go(activeIndex + 1);
      else if (e.key === "ArrowLeft") go(activeIndex - 1);
      else if (e.key >= "1" && e.key <= "5") go(Number(e.key) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, go]);

  const active = CONCEPTS[activeIndex] ?? CONCEPTS[0];

  return (
    <nav
      aria-label="Concept gallery switcher"
      className="fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 px-3"
      style={{ fontFamily: "ui-monospace, 'JetBrains Mono', SFMono-Regular, Consolas, monospace" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-white/12 bg-black/75 p-1.5 pr-2.5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="hidden select-none items-baseline gap-2 px-3 sm:flex">
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">surpluslink</span>
          <span className="h-3 w-px bg-white/15" />
        </div>

        <div className="flex items-center gap-0.5">
          {CONCEPTS.map((c, i) => {
            const isActive = i === activeIndex;
            return (
              <Link
                key={c.id}
                href={`/design/${c.id}`}
                aria-current={isActive ? "page" : undefined}
                className="relative flex items-center rounded-full px-3 py-2 text-[11px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {isActive && (
                  <motion.span
                    layoutId="switch-pill"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 tabular-nums tracking-wider transition-colors ${
                    isActive ? "text-black" : "text-white/55 hover:text-white"
                  }`}
                >
                  <span className="font-semibold">{c.n}</span>
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                      isActive ? "max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                    }`}
                  >
                    {c.name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="ml-1 hidden select-none items-center gap-1.5 pl-2 sm:flex">
          <span className="h-3 w-px bg-white/15" />
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] text-white/40">←</kbd>
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] text-white/40">→</kbd>
        </div>
      </div>

      <p className="mt-2 text-center text-[9px] uppercase tracking-[0.3em] text-white/25 mix-blend-difference sm:hidden">
        {active.name}
      </p>
    </nav>
  );
}
