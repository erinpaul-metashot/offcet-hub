"use client";

import { useCallback, useState } from "react";

function messageFor(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Try again.";
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

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    setError(null);
    setPending(true);

    try {
      await operation();
      return true;
    } catch (caught: unknown) {
      setError(messageFor(caught));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, error, pending, clearError };
}
