"use client";

import { ExternalLink } from "lucide-react";

export const INBOX_HREF = "/demo/manufacturer/batches/import/inbox?channel=sorting_system";

export function RetexcirLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] transition-colors duration-200 ease-[var(--ease-out)] hover:text-[#FF5C00]"
    >
      {children}
      <ExternalLink size={14} />
    </a>
  );
}
