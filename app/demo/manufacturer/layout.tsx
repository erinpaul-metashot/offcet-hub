"use client";

import type { NavItem } from "@/components/app-layout";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

const navItems: NavItem[] = [
  { label: "Overview", href: "/demo/manufacturer/dashboard", icon: "overview", group: "Inventory" },
  { label: "Resource batches", href: "/demo/manufacturer/batches", icon: "batches", group: "Inventory" },
  /** Intake is the Retexcir connector; manual entry hangs off it rather than the sidebar. */
  { label: "Intake", href: "/demo/manufacturer/batches/import", icon: "imports", group: "Inventory" },
  { label: "Dispatch", href: "/demo/manufacturer/dispatch", icon: "dispatch", group: "Logistics" },
  { label: "Facilities", href: "/demo/manufacturer/facilities", icon: "facilities", group: "Logistics" },
];

export default function DemoManufacturerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("manufacturer");

  return (
    <DemoAppLayout
      user={user}
      roleTitle={organisation ? `Manufacturer · ${organisation.name}` : "Manufacturer"}
      navItems={navItems}
    >
      {children}
    </DemoAppLayout>
  );
}
