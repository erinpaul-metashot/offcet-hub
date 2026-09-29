"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Unit } from "../_mock/domain";
import { formatCurrency, formatNumber, formatPercent, formatQuantity } from "../_mock/selectors-shared";
import { formatDate, formatDateTime } from "./cirka-ui";

/** Number, quantity and date formatters bound to the viewer's language. */
export function useFormat() {
  const { locale } = useLocale();

  return useMemo(
    () => ({
      quantity: (quantity: number, unit: Unit) => formatQuantity(quantity, unit, locale),
      number: (value: number) => formatNumber(value, locale),
      percent: (fraction?: number) => formatPercent(fraction, locale),
      currency: (value?: number, currency?: string) => formatCurrency(value, currency, locale),
      date: (timestamp?: number) => formatDate(timestamp, locale),
      dateTime: (timestamp?: number) => formatDateTime(timestamp, locale),
    }),
    [locale],
  );
}
