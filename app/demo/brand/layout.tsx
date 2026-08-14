"use client";

import type { NavItem } from "@/components/app-layout";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

const navItems: NavItem[] = [
  { label: "Overview", href: "/demo/brand/dashboard", icon: "overview" },
  { label: "Marketplace", href: "/demo/brand/marketplace", icon: "lots" },
  { label: "Projects", href: "/demo/brand/projects", icon: "projects" },
  { label: "New brief", href: "/demo/brand/projects/new", icon: "new_batch" },
  { label: "Approvals", href: "/demo/brand/approvals", icon: "matching" },
];

export default function DemoBrandLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("brand");

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
