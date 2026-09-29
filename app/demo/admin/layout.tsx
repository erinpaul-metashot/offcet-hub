"use client";

import type { NavItem } from "@/components/app-layout";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

export default function DemoAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useDemoPersona("admin");
  const { nav } = useMessages(demoAdmin);
  const core = nav.groupCore;
  const resources = nav.groupResources;
  const system = nav.groupSystem;
  const navItems: NavItem[] = [
    { label: nav.dashboard, href: "/demo/admin/dashboard", icon: "queue", group: core },
    { label: nav.requests, href: "/demo/admin/requests", icon: "matching", group: core },
    { label: nav.projects, href: "/demo/admin/projects", icon: "projects", group: core },
    { label: nav.marketplace, href: "/demo/admin/marketplace", icon: "lots", group: resources },
    { label: nav.batches, href: "/demo/admin/batches", icon: "batches", group: resources },
    { label: nav.allocations, href: "/demo/admin/allocations", icon: "allocations", group: resources },
    { label: nav.production, href: "/demo/admin/production", icon: "production", group: resources },
    { label: nav.organisations, href: "/demo/admin/organisations", icon: "organisations", group: system },
    { label: nav.users, href: "/demo/admin/users", icon: "users", group: system },
    { label: nav.integrations, href: "/demo/admin/integrations", icon: "integrations", group: system },
    { label: nav.exports, href: "/demo/admin/exports", icon: "exports", group: system },
  ];

  return (
    <DemoAppLayout user={user} roleTitle={nav.roleTitle} navItems={navItems}>
      {children}
    </DemoAppLayout>
  );
}
