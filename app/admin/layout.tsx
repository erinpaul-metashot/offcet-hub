import { requireRole } from "@/lib/dashboard";
import { AppLayout, NavItem } from "@/components/app-layout";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("admin");

  const navItems: NavItem[] = [
    { label: "Overview", href: "/admin/dashboard", icon: "overview" },
    { label: "User Management", href: "/admin/users", icon: "users" },
    { label: "Supply Management", href: "/admin/lots", icon: "requests" },
    { label: "Assignments", href: "/admin/assignments", icon: "lots" },
  ];

  return (
    <AppLayout user={user} roleTitle="Admin" navItems={navItems}>
      {children}
    </AppLayout>
  );
}
