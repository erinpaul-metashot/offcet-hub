export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "cirka-locale";
export const INTL_LOCALE: Record<Locale, string> = { en: "en-GB", vi: "vi-VN" };

export type Messages<T> = Record<Locale, T>;

/** The cookie is untrusted input: anything unknown falls back to English. */
export function parseLocale(value: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

/** Fills `{name}` placeholders. Unknown names are left visible so a gap is obvious. */
export function format(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
