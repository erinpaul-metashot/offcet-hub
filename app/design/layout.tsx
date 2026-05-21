"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink font-sans antialiased">
      {/* Sticky Premium Design Selector Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-line bg-paper/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 sm:px-8">
          {/* Logo / Context */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-green bg-brand-green-muted px-2 py-0.5 transition-colors group-hover:bg-brand-green group-hover:text-paper">
                SURPLUSLINK
              </span>
              <span className="hidden text-[10px] font-semibold tracking-[0.2em] text-ink-muted sm:inline uppercase">
                / DESIGN SUITE
              </span>
            </Link>
          </div>

          {/* Navigation Grid (1 - 10) */}
          <nav className="flex items-center border border-line bg-surface p-0.5">
            <span className="hidden px-3 text-[9px] font-bold tracking-[0.15em] uppercase text-ink-muted lg:inline border-r border-line mr-0.5">
              VARIATIONS:
            </span>
            <div className="flex items-center gap-0.5">
              {[...Array(10)].map((_, i) => {
                const designNum = i + 1;
                const path = `/design/d${designNum}`;
                const isActive = pathname === path;

                return (
                  <Link
                    key={designNum}
                    href={path}
                    className={`flex h-8 w-8 items-center justify-center font-display text-xs font-semibold transition-all select-none border border-transparent
                      ${
                        isActive
                          ? "bg-brand-green text-paper border-brand-green font-bold shadow-sm"
                          : "text-ink hover:bg-muted hover:border-line"
                      }
                    `}
                  >
                    {designNum}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Design Playground */}
      <main className="flex-1 w-full bg-paper">
        {children}
      </main>
    </div>
  );
}
