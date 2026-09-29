"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { classNames } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  FileText,
  Users,
  FilePlus,
  Truck,
  Factory,
  FolderOpen,
  Inbox,
  Warehouse,
  Upload,
  Download,
  Plug,
  Building2,
  MapPin,
  Send,
  Handshake,
  ListChecks,
} from "lucide-react";
import { SignOutProvider, useSignOut } from "@/components/sign-out-context";
import { Spinner } from "@/components/ui";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  group?: string;
}

function parseRoleBadge(roleTitle?: string, userRole?: string) {
  let role = userRole || "";
  let org = "";

  if (roleTitle) {
    if (roleTitle.includes("·")) {
      const parts = roleTitle.split("·");
      role = role || parts[0]?.trim() || "";
      org = parts.slice(1).join("·").trim();
    } else {
      role = role || roleTitle.trim();
    }
  }

  const normalized = role.toLowerCase();
  let label = role;
  let badgeClasses = "bg-white/15 text-white border-white/20";

  if (normalized.includes("admin")) {
    label = "Admin";
    badgeClasses = "bg-[#8CC63F]/20 text-[#8CC63F] border-[#8CC63F]/40";
  } else if (normalized.includes("brand")) {
    label = "Brand";
    badgeClasses = "bg-[#FF5C00]/20 text-[#FF5C00] border-[#FF5C00]/40";
  } else if (normalized.includes("manufacturer")) {
    label = "Manufacturer";
    badgeClasses = "bg-[#FF5C00]/20 text-[#FF5C00] border-[#FF5C00]/40";
  } else if (normalized.includes("custodian")) {
    label = "Custodian";
    badgeClasses = "bg-white/20 text-white border-white/35";
  } else if (normalized.includes("maker")) {
    label = "Maker";
    badgeClasses = "bg-[#8CC63F]/20 text-[#8CC63F] border-[#8CC63F]/40";
  }

  return { label, org, badgeClasses };
}

const ICONS: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={18} />,
  lots: <Package size={18} />,
  new_lot: <FilePlus size={18} />,
  users: <Users size={18} />,
  requests: <FileText size={18} />,
  // CIRKA vocabulary: used by the /demo route tree
  batches: <Package size={18} />,
  new_batch: <FilePlus size={18} />,
  allocations: <Truck size={18} />,
  dispatch: <Send size={18} />,
  arrivals: <Inbox size={18} />,
  stock: <Warehouse size={18} />,
  production: <Factory size={18} />,
  projects: <FolderOpen size={18} />,
  matching: <Handshake size={18} />,
  queue: <ListChecks size={18} />,
  organisations: <Building2 size={18} />,
  facilities: <MapPin size={18} />,
  imports: <Upload size={18} />,
  exports: <Download size={18} />,
  integrations: <Plug size={18} />,
};

export function AppLayout(props: {
  user: { name: string; email: string; role?: string };
  roleTitle: string;
  navItems: NavItem[];
  pageTitle?: string;
  /** Replaces the sidebar sign-out control (used by the mock demo tree). */
  footerAction?: (collapsed: boolean) => React.ReactNode;
  /** Badge text in the viewer's language. The badge colour still comes from `user.role`. */
  roleLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <SignOutProvider>
      <AppLayoutInner {...props} />
    </SignOutProvider>
  );
}

function AppLayoutInner({
  user,
  roleTitle,
  navItems,
  pageTitle,
  footerAction,
  roleLabel,
  children,
}: {
  user: { name: string; email: string; role?: string };
  roleTitle: string;
  navItems: NavItem[];
  pageTitle?: string;
  footerAction?: (collapsed: boolean) => React.ReactNode;
  roleLabel?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const parsedBadge = parseRoleBadge(roleTitle, user.role);
  const roleBadge = roleLabel ? { ...parsedBadge, label: roleLabel } : parsedBadge;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const { isSigningOut } = useSignOut();

  const toggleMobileSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleDesktopSidebar = () => setCollapsed(!isCollapsed);

  if (isSigningOut) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--surface)]">
        <div className="space-y-3 text-center">
          <Spinner size="md" variant="white" />
          <p className="text-sm text-[var(--ink-muted)]">Signing out...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--surface)]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-transform duration-500 ease-[var(--ease-out)] lg:static lg:z-auto w-64",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-[20%]"
        )}
      >
        <div className={classNames(
          "flex h-16 shrink-0 items-center border-b border-[var(--sidebar-border)] px-4",
          isCollapsed ? "lg:justify-center lg:px-2" : "justify-between"
        )}>
          {!isCollapsed && (
            <Link
              href={navItems[0]?.href || "/"}
              className="flex items-center"
            >
              <img src="/cirka-logo-white.png" alt="Cirka" className="h-12 w-auto object-contain object-left scale-[1.3] origin-left" />
            </Link>
          )}
          <div className={classNames("flex items-center gap-2", isCollapsed ? "lg:justify-center" : "")}>
            <button
              onClick={toggleDesktopSidebar}
              className="hidden p-1 text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] transition-colors duration-200 lg:block rounded-md"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={toggleMobileSidebar}
              className="p-1 text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] transition-colors duration-200 lg:hidden rounded-md"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className={classNames("flex-1 overflow-y-auto py-4 space-y-0.5", isCollapsed ? "px-2 lg:px-2" : "px-3")}>
          {(() => {
            let lastGroup: string | undefined = undefined;
            return navItems.map((item, idx) => {
              const isBestMatch = navItems.reduce((best, current) => {
                if (pathname === current.href || pathname.startsWith(current.href + "/")) {
                  if (!best || current.href.length > best.href.length) {
                    return current;
                  }
                }
                return best;
              }, null as NavItem | null);
              
              const isActive = isBestMatch?.href === item.href;
              const showGroupLabel = !isCollapsed && item.group && item.group !== lastGroup;
              if (item.group) lastGroup = item.group;

              return (
                <div key={item.href}>
                  {showGroupLabel && (
                    <p className={classNames(
                      "text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--sidebar-text-muted)] px-3",
                      idx > 0 ? "mt-5 mb-2 pt-4 border-t border-[var(--sidebar-border)]" : "mb-2"
                    )}>
                      {item.group}
                    </p>
                  )}
                  <Link
                    href={item.href}
                    className={classNames(
                      "group flex items-center gap-3 rounded-lg py-2 text-[12px] font-medium transition-[background-color,color,border-color] duration-200 ease-[var(--ease-out)]",
                      isActive
                        ? "bg-[var(--sidebar-active-bg)] text-[var(--brand-primary)] border-l-2 border-[var(--brand-primary)]"
                        : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] border-l-2 border-transparent",
                      isCollapsed ? "px-2 lg:px-2 lg:justify-center lg:border-l-0" : "px-3"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon && ICONS[item.icon] ? (
                      <span className="transition-transform duration-300 ease-[var(--ease-out)] group-active:scale-95">
                        {ICONS[item.icon]}
                      </span>
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className={classNames(isCollapsed ? "lg:hidden" : "block")}>
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            });
          })()}
        </nav>

        <div className={classNames(
          "border-t border-[var(--sidebar-border)] p-4",
          isCollapsed ? "lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-2" : ""
        )}>
          {!isCollapsed ? (
            <div className="mb-4 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--sidebar-text)] truncate">{user.name}</p>
                {roleBadge.label && (
                  <span
                    className={classNames(
                      "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] border",
                      roleBadge.badgeClasses
                    )}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--sidebar-text-muted)] truncate">
                {roleBadge.org ? `${roleBadge.org} · ` : ""}{user.email}
              </p>
            </div>
          ) : (
            roleBadge.label && (
              <div
                className={classNames(
                  "mb-3 hidden lg:flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold uppercase border cursor-default",
                  roleBadge.badgeClasses
                )}
                title={`${user.name} (${roleBadge.label}${roleBadge.org ? ` · ${roleBadge.org}` : ""})`}
              >
                {roleBadge.label[0]}
              </div>
            )
          )}
          {footerAction ? footerAction(isCollapsed) : <SignOutButton collapsed={isCollapsed} />}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--surface)]">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-[var(--line)] bg-[var(--paper)] px-4 sm:gap-x-6 sm:px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-[var(--ink-muted)] hover:text-[var(--brand-primary)] transition-colors"
              onClick={toggleMobileSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu size={24} />
            </button>
            {pageTitle && (
              <div className="font-bold text-sm tracking-widest uppercase text-[var(--brand-primary)]">
                {pageTitle}
              </div>
            )}
          </div>
          {roleBadge.label && (
            <span
              className={classNames(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] border",
                roleBadge.badgeClasses
              )}
            >
              {roleBadge.label}
            </span>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto outline-none">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {pageTitle && (
              <div className="hidden lg:block mb-8 border-b border-[var(--line)] pb-6">
                <h1 className="text-3xl font-semibold tracking-[-0.05em]">
                  {pageTitle}
                </h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
