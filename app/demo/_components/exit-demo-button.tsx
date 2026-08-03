"use client";

import Link from "next/link";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui";

/** Demo replacement for `SignOutButton` — returns to the role selector. */
export function ExitDemoButton({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Link
        href="/demo"
        className="flex items-center justify-center p-2 rounded-full text-[var(--brand-primary)] hover:bg-[var(--sidebar-hover)] transition-colors"
        title="Switch role"
      >
        <Repeat size={20} />
      </Link>
    );
  }

  return (
    <Button as={Link} href="/demo" variant="secondary" className="w-full text-center">
      Switch Role
    </Button>
  );
}
