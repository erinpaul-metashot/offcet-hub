import { requireRole } from "@/lib/dashboard";
import { AppLayout, NavItem } from "@/components/app-layout";

export default async function SupplierLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("supplier");

  const navItems: NavItem[] = [
    { label: "Overview", href: "/supplier/dashboard", icon: "overview" },
    { label: "My Lots", href: "/supplier/lots", icon: "lots" },
    { label: "New Lot", href: "/supplier/lots/new", icon: "new_lot" },
  ];

  return (
    <AppLayout user={user} roleTitle="Supplier" navItems={navItems}>
      {children}
    </AppLayout>
  );
}
