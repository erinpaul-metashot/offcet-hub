import { requireRole } from "@/lib/dashboard";
import { AppLayout, NavItem } from "@/components/app-layout";

export default async function BuyerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("buyer");

  const navItems: NavItem[] = [
    { label: "Overview", href: "/buyer/dashboard", icon: "overview" },
    { label: "Assigned Lots", href: "/buyer/lots", icon: "lots" },
  ];

  return (
    <AppLayout user={user} roleTitle="Buyer" navItems={navItems}>
      {children}
    </AppLayout>
  );
}
