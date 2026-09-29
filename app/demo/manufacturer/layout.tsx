"use client";

import type { NavItem } from "@/components/app-layout";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { DemoAppLayout } from "../_components/demo-app-layout";
import { useDemoPersona } from "../_mock/store";

export default function DemoManufacturerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, organisation } = useDemoPersona("manufacturer");
  const { nav } = useMessages(demoManufacturer);
  const navItems: NavItem[] = [
    { label: nav.dashboard, href: "/demo/manufacturer/dashboard", icon: "overview", group: nav.inventory },
    { label: nav.batches, href: "/demo/manufacturer/batches", icon: "batches", group: nav.inventory },
    /** Intake is the Retexcir connector; manual entry hangs off it rather than the sidebar. */
    { label: nav.intake, href: "/demo/manufacturer/batches/import", icon: "imports", group: nav.inventory },
    { label: nav.dispatch, href: "/demo/manufacturer/dispatch", icon: "dispatch", group: nav.logistics },
    { label: nav.facilities, href: "/demo/manufacturer/facilities", icon: "facilities", group: nav.logistics },
  ];

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
