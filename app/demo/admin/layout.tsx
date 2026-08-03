"use client";

import type { NavItem } from "@/components/app-layout";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

const navItems: NavItem[] = [
  { label: "Action queue", href: "/demo/admin/dashboard", icon: "queue", group: "Core" },
  { label: "Requests & matching", href: "/demo/admin/requests", icon: "matching", group: "Core" },
  { label: "Projects", href: "/demo/admin/projects", icon: "projects", group: "Core" },
  { label: "Resource batches", href: "/demo/admin/batches", icon: "batches", group: "Resources" },
  { label: "Allocations", href: "/demo/admin/allocations", icon: "allocations", group: "Resources" },
  { label: "Production", href: "/demo/admin/production", icon: "production", group: "Resources" },
  { label: "Organisations", href: "/demo/admin/organisations", icon: "organisations", group: "System" },
  { label: "People", href: "/demo/admin/users", icon: "users", group: "System" },
  { label: "Imports", href: "/demo/admin/imports", icon: "imports", group: "System" },
  { label: "Integrations", href: "/demo/admin/integrations", icon: "integrations", group: "System" },
  { label: "Exports", href: "/demo/admin/exports", icon: "exports", group: "System" },
];

export default function DemoAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useDemoPersona("admin");

  return (
    <DemoAppLayout user={user} roleTitle="CIRKA Admin" navItems={navItems}>
      {children}
    </DemoAppLayout>
  );
}
