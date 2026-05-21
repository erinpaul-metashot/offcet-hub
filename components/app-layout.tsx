"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { classNames } from "@/lib/utils";
import { Menu, X, LayoutDashboard, Package, FileText, Users, FilePlus } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={18} />,
  lots: <Package size={18} />,
  new_lot: <FilePlus size={18} />,
  users: <Users size={18} />,
  requests: <FileText size={18} />,
};

export function AppLayout({
  user,
  roleTitle,
  navItems,
  pageTitle,
  children,
}: {
  user: { name: string; email: string };
  roleTitle: string;
  navItems: NavItem[];
  pageTitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);

  const toggleMobileSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleDesktopSidebar = () => setCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--surface)]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--line)] bg-[var(--paper)] transition-all duration-300 lg:static lg:z-auto w-64",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-[20%]"
        )}
      >
        <div className={classNames(
          "flex h-16 shrink-0 items-center border-b border-[var(--line)] px-4",
          isCollapsed ? "lg:justify-center lg:px-2" : "justify-between"
        )}>
          {!isCollapsed && (
            <Link
              href="/"
              className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--brand-green-light)]"
            >
              SurplusLink
            </Link>
          )}
          <div className={classNames("flex items-center gap-2", isCollapsed ? "lg:justify-center" : "")}>
            <button
              onClick={toggleDesktopSidebar}
              className="hidden p-1 text-[var(--ink-muted)] hover:bg-[var(--brand-green-muted)] hover:text-[var(--brand-green)] lg:block"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={toggleMobileSidebar}
              className="p-1 text-[var(--ink-muted)] hover:bg-[var(--brand-green-muted)] hover:text-[var(--brand-green)] lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className={classNames("flex-1 overflow-y-auto py-6 space-y-1", isCollapsed ? "px-2 lg:px-2" : "px-3")}>
          {navItems.map((item) => {
            const isBestMatch = navItems.reduce((best, current) => {
              if (pathname === current.href || pathname.startsWith(current.href + "/")) {
                if (!best || current.href.length > best.href.length) {
                  return current;
                }
              }
              return best;
            }, null as NavItem | null);
            
            const isActive = isBestMatch?.href === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--brand-green-muted)] text-[var(--brand-green)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--muted)] hover:text-[var(--ink)]",
                  isCollapsed ? "px-2 lg:px-2 lg:justify-center" : "px-3"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon && ICONS[item.icon] ? ICONS[item.icon] : <span className="w-4" />}
                <span className={classNames(isCollapsed ? "lg:hidden" : "block")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={classNames(
          "border-t border-[var(--line)] p-4",
          isCollapsed ? "lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-2" : ""
        )}>
          {!isCollapsed && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--ink)]">{user.name}</p>
              <p className="text-xs text-[var(--ink-muted)] truncate">{user.email}</p>
            </div>
          )}
          <SignOutButton collapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--line)] bg-[var(--paper)] px-4 sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-[var(--ink-muted)] hover:text-[var(--brand-green)]"
            onClick={toggleMobileSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu size={24} />
          </button>
          {pageTitle && (
            <div className="flex flex-1 font-semibold text-sm tracking-widest uppercase text-[var(--brand-green)]">
              {pageTitle}
            </div>
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
