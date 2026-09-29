"use client";

import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Each language names itself, so it reads correctly whichever one is active. */
const NATIVE_NAMES: Record<Locale, string> = { en: "English", vi: "Tiếng Việt" };

const OPTION_CLASS =
  "rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-200 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pure-white md:px-2.5";

/**
 * `EN | VI` pill for dark surfaces (landing nav, demo sidebar, role selector).
 * `compact` renders one button that switches to the other language, for the
 * collapsed sidebar.
 */
export function LocaleToggle({ label, compact = false }: { label: string; compact?: boolean }) {
  const { locale, setLocale } = useLocale();

  if (compact) {
    const next = LOCALES.find((option) => option !== locale) ?? locale;
    return (
      <button
        type="button"
        lang={next}
        aria-label={`${label}: ${NATIVE_NAMES[next]}`}
        title={NATIVE_NAMES[next]}
        onClick={() => setLocale(next)}
        className={`${OPTION_CLASS} border border-white/30 text-pure-white/80 hover:text-pure-white`}
      >
        {next}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded-full border border-white/30 bg-white/10 p-0.5 backdrop-blur-sm"
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-label={NATIVE_NAMES[option]}
            aria-pressed={active}
            onClick={() => setLocale(option)}
            className={`${OPTION_CLASS} ${
              active ? "bg-cirka-orange text-pure-white" : "text-pure-white/70 hover:text-pure-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
