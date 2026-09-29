"use client";

import { AppLayout, type NavItem } from "@/components/app-layout";
import { LocaleToggle } from "@/components/locale-toggle";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoShell } from "@/lib/i18n/messages/demo-shell";
import { ExitDemoButton } from "./exit-demo-button";
import { useLabels } from "./use-labels";

/**
 * Wraps the production `AppLayout` with the demo persona and swaps the
 * sign-out control for a language switch and a role switcher: no auth involved.
 */
export function DemoAppLayout({
  user,
  roleTitle,
  navItems,
  children,
}: {
  user: { name: string; email: string; role?: string };
  roleTitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const { shell } = useMessages(demoShell);
  const { ROLE_LABELS } = useLabels();
  const roleLabel = user.role && user.role in ROLE_LABELS ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] : undefined;

  return (
    <AppLayout
      user={user}
      roleTitle={roleTitle}
      roleLabel={roleLabel}
      navItems={navItems}
      footerAction={(collapsed) => (
        <div className={collapsed ? "flex flex-col items-center gap-2" : "space-y-3"}>
          <div className={collapsed ? "" : "flex justify-center"}>
            <LocaleToggle label={shell.language} compact={collapsed} />
          </div>
          <ExitDemoButton collapsed={collapsed} />
        </div>
      )}
    >
      {children}
    </AppLayout>
  );
}
