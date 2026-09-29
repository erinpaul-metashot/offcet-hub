"use client";

import type { NavItem } from "@/components/app-layout";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCustodian } from "@/lib/i18n/messages/demo-custodian";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";


export default function DemoCustodianLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("custodian");
  const { nav } = useMessages(demoCustodian);
  const navItems: NavItem[] = [
    { label: nav.dashboard, href: "/demo/custodian/dashboard", icon: "overview" },
    { label: nav.arrivals, href: "/demo/custodian/arrivals", icon: "arrivals" },
    { label: nav.stock, href: "/demo/custodian/stock", icon: "stock" },
    { label: nav.dispatches, href: "/demo/custodian/dispatches", icon: "allocations" },
    { label: nav.facilities, href: "/demo/custodian/facilities", icon: "facilities" },
  ];

  return (
    <DemoAppLayout
      user={user}
      roleTitle={organisation ? `Custodian · ${organisation.name}` : "Custodian"}
      navItems={navItems}
    >
      {children}
    </DemoAppLayout>
  );
}
