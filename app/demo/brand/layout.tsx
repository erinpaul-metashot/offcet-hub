"use client";

import type { NavItem } from "@/components/app-layout";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

export default function DemoBrandLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("brand");
  const { nav } = useMessages(demoBrand);
  const navItems: NavItem[] = [
    { label: nav.dashboard, href: "/demo/brand/dashboard", icon: "overview" },
    { label: nav.marketplace, href: "/demo/brand/marketplace", icon: "lots" },
    { label: nav.projects, href: "/demo/brand/projects", icon: "projects" },
    { label: nav.newBrief, href: "/demo/brand/projects/new", icon: "new_batch" },
    { label: nav.approvals, href: "/demo/brand/approvals", icon: "matching" },
  ];

  return (
    <DemoAppLayout
      user={user}
      roleTitle={organisation ? `Brand · ${organisation.name}` : "Brand"}
      navItems={navItems}
    >
      {children}
    </DemoAppLayout>
  );
}
