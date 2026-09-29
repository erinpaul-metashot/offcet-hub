"use client";

import { useCallback, useState } from "react";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";

// ponytail: rule-violation messages are the mock backend's English; per-code translation is plan step 2e.
function messageFor(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * Runs a store mutation and surfaces the rule it broke.
 *
 * The mock store throws the same errors the backend will return: over
 * allocation, an illegal status jump, an unbalanced production batch: so
 * screens show them rather than failing silently.
 */
export function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { ui } = useMessages(demoCommon);

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    setError(null);
    setPending(true);

    try {
      await operation();
      return true;
    } catch (caught: unknown) {
      setError(messageFor(caught, ui.somethingWrong));
      return false;
    } finally {
      setPending(false);
    }
  }, [ui.somethingWrong]);

  const clearError = useCallback(() => {
    setError((prev) => (prev === null ? prev : null));
  }, []);

  return { run, error, pending, clearError };
}
