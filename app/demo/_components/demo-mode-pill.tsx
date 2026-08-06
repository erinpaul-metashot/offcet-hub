"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";

/** Always-visible reminder that nothing in this tree touches the real backend. */
export function DemoModePill() {
  const pathname = usePathname();

  if (pathname === "/demo") {
    return null;
  }

  return (
    <Link
      href="/demo"
      title="Demo mode: mock data only. Click to switch role."
      className="fixed bottom-5 right-5 z-[200] inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)] bg-[var(--sidebar-bg)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5"
    >
      <FlaskConical size={14} className="text-[var(--brand-primary)]" />
      Demo Mode
    </Link>
  );
}
