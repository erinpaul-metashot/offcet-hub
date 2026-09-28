"use client";

import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Each language names itself, so it reads correctly whichever one is active. */
const NATIVE_NAMES: Record<Locale, string> = { en: "English", vi: "Tiếng Việt" };

export function LocaleToggle({ label }: { label: string }) {
  const { locale, setLocale } = useLocale();

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
            className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-200 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pure-white md:px-2.5 ${
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
