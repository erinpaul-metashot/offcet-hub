"use client";

import { AppLayout, type NavItem } from "@/components/app-layout";
import { ExitDemoButton } from "./exit-demo-button";

/**
 * Wraps the production `AppLayout` with the demo persona and swaps the
 * sign-out control for a role switcher — no auth involved.
 */
export function DemoAppLayout({
  user,
  roleTitle,
  navItems,
  children,
}: {
  user: { name: string; email: string };
  roleTitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <AppLayout
      user={user}
      roleTitle={roleTitle}
      navItems={navItems}
      footerAction={(collapsed) => <ExitDemoButton collapsed={collapsed} />}
    >
      {children}
    </AppLayout>
  );
}
