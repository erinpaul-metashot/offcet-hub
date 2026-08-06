"use client";

import type { NavItem } from "@/components/app-layout";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

const navItems: NavItem[] = [
  { label: "Overview", href: "/demo/custodian/dashboard", icon: "overview" },
  { label: "Expected arrivals", href: "/demo/custodian/arrivals", icon: "arrivals" },
  { label: "Stock held", href: "/demo/custodian/stock", icon: "stock" },
  { label: "Out to makers", href: "/demo/custodian/dispatches", icon: "allocations" },
  { label: "Sites", href: "/demo/custodian/facilities", icon: "facilities" },
];

export default function DemoCustodianLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("custodian");

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
