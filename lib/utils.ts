export function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isAuthError(error: unknown) {
  if (error instanceof Error) {
    return /auth|login|session|token|unauthori/i.test(error.message);
  }

  return false;
}

export function formatCurrency(value?: number) {
  if (typeof value !== "number") {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

export function sentenceCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
