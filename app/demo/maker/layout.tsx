"use client";

import type { NavItem } from "@/components/app-layout";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoMaker } from "@/lib/i18n/messages/demo-maker";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";


export default function DemoMakerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("maker");
  const { nav } = useMessages(demoMaker);
  const navItems: NavItem[] = [
    { label: nav.dashboard, href: "/demo/maker/dashboard", icon: "overview" },
    { label: nav.marketplace, href: "/demo/maker/marketplace", icon: "lots" },
    { label: nav.allocations, href: "/demo/maker/allocations", icon: "allocations" },
    { label: nav.production, href: "/demo/maker/production", icon: "production" },
    { label: nav.projects, href: "/demo/maker/projects", icon: "projects" },
    { label: nav.requests, href: "/demo/maker/requests", icon: "requests" },
  ];

  return (
    <DemoAppLayout
      user={user}
      roleTitle={organisation ? `Maker · ${organisation.name}` : "Maker"}
      navItems={navItems}
    >
      {children}
    </DemoAppLayout>
  );
}
