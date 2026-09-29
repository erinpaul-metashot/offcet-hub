"use client";

import Link from "next/link";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoShell } from "@/lib/i18n/messages/demo-shell";

/** Demo replacement for `SignOutButton`: returns to the role selector. */
export function ExitDemoButton({ collapsed }: { collapsed?: boolean }) {
  const { shell } = useMessages(demoShell);

  if (collapsed) {
    return (
      <Link
        href="/demo"
        className="flex items-center justify-center p-2 rounded-full text-[var(--brand-primary)] hover:bg-[var(--sidebar-hover)] transition-colors"
        title={shell.switchRole}
        aria-label={shell.switchRole}
      >
        <Repeat size={20} />
      </Link>
    );
  }

  return (
    <Button as={Link} href="/demo" variant="secondary" className="w-full text-center">
      {shell.switchRole}
    </Button>
  );
}
