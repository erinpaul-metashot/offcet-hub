"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { labelsFor, type DomainLabels } from "../_mock/domain-labels";

/** Domain vocabulary (roles, statuses, units, …) in the viewer's language. */
export function useLabels(): DomainLabels {
  return labelsFor(useLocale().locale);
}
