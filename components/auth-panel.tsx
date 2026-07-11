"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";

type Mode = "login" | "register";

const TABS: { key: Mode; label: string }[] = [
  { key: "login", label: "Log in" },
  { key: "register", label: "Register" },
];

export function AuthPanel({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedMode, setDisplayedMode] = useState<Mode>(initialMode);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  const switchMode = useCallback(
    (newMode: Mode) => {
      if (newMode === mode || isTransitioning) return;

      // Update URL without full navigation
      router.replace(`/${newMode}`, { scroll: false });

      if (prefersReducedMotion.current) {
        setMode(newMode);
        setDisplayedMode(newMode);
        return;
      }

      // Phase 1: fade out current
      setIsTransitioning(true);
      setMode(newMode);

      // After fade-out completes, swap content and fade in
      setTimeout(() => {
        setDisplayedMode(newMode);
        // Small delay to let React render the new form before fading in
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      }, 150);
    },
    [mode, isTransitioning, router]
  );

  const handleRegistered = useCallback(() => {
    switchMode("login");
    // The login form will pick up ?registered=1 from the URL
    router.replace("/login?registered=1", { scroll: false });
  }, [switchMode, router]);

  return (
    <div
      className="auth-panel-entry w-full"
      style={{
        maxWidth: "640px",
      }}
    >
      {/* Panel container */}
      <div
        className="relative rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] overflow-hidden"
        style={{
          boxShadow:
            "0 4px 24px -8px rgba(0,0,0,0.06), 0 12px 48px -12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Top accent stripe */}
        <div
          className="h-[3px] w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-primary) 40%, var(--brand-secondary) 100%)",
          }}
        />

        {/* Content area */}
        <div className="p-6 sm:p-10">
          {/* Tab toggle */}
          <div className="mb-8">
            <div
              className="relative flex rounded-full p-1"
              style={{ backgroundColor: "rgba(84, 84, 84, 0.08)" }}
            >
              {/* Sliding indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-full bg-[var(--paper)]"
                style={{
                  width: "calc(50% - 4px)",
                  left: mode === "login" ? "4px" : "calc(50% + 0px)",
                  transition:
                    "left 280ms cubic-bezier(0.23, 1, 0.32, 1), width 280ms cubic-bezier(0.23, 1, 0.32, 1)",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                }}
              />

              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchMode(tab.key)}
                  className="relative z-10 flex-1 rounded-full py-2.5 text-[13px] font-semibold tracking-wide transition-colors duration-200"
                  style={{
                    color:
                      mode === tab.key
                        ? "var(--brand-primary)"
                        : "var(--ink-muted)",
                    cursor: mode === tab.key ? "default" : "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form area with crossfade */}
          <div
            ref={contentRef}
            style={{
              opacity: isTransitioning ? 0 : 1,
              filter: isTransitioning ? "blur(3px)" : "blur(0px)",
              transform: isTransitioning
                ? "translateY(6px)"
                : "translateY(0px)",
              transition: isTransitioning
                ? "opacity 120ms ease-out, filter 120ms ease-out, transform 120ms ease-out"
                : "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), filter 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            {displayedMode === "login" ? (
              <LoginForm />
            ) : (
              <RegisterForm onRegistered={handleRegistered} />
            )}
          </div>
        </div>
      </div>

      {/* Subtle footer hint */}
      <p className="mt-5 text-center text-xs text-[var(--ink-muted)]">
        {mode === "login"
          ? "All accounts require admin approval before access."
          : "Accounts are reviewed manually. You'll be notified by email."}
      </p>


    </div>
  );
}
