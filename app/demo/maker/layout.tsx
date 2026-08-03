"use client";

import type { NavItem } from "@/components/app-layout";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

const navItems: NavItem[] = [
  { label: "Overview", href: "/demo/maker/dashboard", icon: "overview" },
  { label: "Allocations", href: "/demo/maker/allocations", icon: "allocations" },
  { label: "Production", href: "/demo/maker/production", icon: "production" },
  { label: "My requests", href: "/demo/maker/requests", icon: "requests" },
];

export default function DemoMakerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("maker");

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
