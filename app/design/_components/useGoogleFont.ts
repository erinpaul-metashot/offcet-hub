"use client";

import { useEffect } from "react";

/**
 * Injects a Google Fonts stylesheet at runtime, scoped to whichever
 * /design concept page mounts it. Avoids touching the shared globals.css
 * and keeps each concept's typography self-contained. Idempotent.
 */
export function useGoogleFont(href: string): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = `gfont:${href}`;
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    // Intentionally not removed on unmount: caching across concept switches
    // keeps font flashes from reappearing when toggling the gallery.
  }, [href]);
}
