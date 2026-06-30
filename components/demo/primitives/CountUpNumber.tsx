"use client";

import { easeOutCubic } from "@/components/demo/core/utils";

/**
 * CountUpNumber — animates a number counting up from 0 to target.
 * progress: 0 = shows 0, 1 = shows target value.
 */
export function CountUpNumber({
  target,
  progress,
  prefix = "",
  suffix = "",
  className,
  formatFn,
}: {
  target: number;
  progress: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatFn?: (n: number) => string;
}) {
  const easedProgress = easeOutCubic(progress);
  const currentValue = Math.round(target * easedProgress);
  const display = formatFn ? formatFn(currentValue) : currentValue.toLocaleString();

  return (
    <span className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}

/**
 * Format as USD currency without cents.
 */
export function formatDemoCurrency(value: number): string {
  if (value === 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
