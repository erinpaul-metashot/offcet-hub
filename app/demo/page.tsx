"use client";

import Link from "next/link";
import {
  ArrowRight,
  Factory,
  FolderOpen,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui";
import { ROLE_DESCRIPTIONS, type CirkaRole } from "./_mock/domain";
import { checkLedgerIntegrity } from "./_mock/ledger";
import { PERSONA_IDS, useDemoStore } from "./_mock/store";
import { formatQuantity } from "./_mock/selectors-shared";
import { getAdminDashboard } from "./_mock/selectors-admin";

const ROLE_ORDER: CirkaRole[] = ["brand", "manufacturer", "custodian", "maker", "admin"];

const ROLE_ICONS: Record<CirkaRole, React.ReactNode> = {
  brand: <FolderOpen size={20} />,
  manufacturer: <Factory size={20} />,
  custodian: <Warehouse size={20} />,
  maker: <Factory size={20} />,
  admin: <ShieldCheck size={20} />,
};

export default function DemoRoleSelectorPage() {
  const { db, personaFor, resetDemo } = useDemoStore();

  const admin = getAdminDashboard(db);
  const integrity = checkLedgerIntegrity(db);

  const roleStat: Record<CirkaRole, string> = {
    brand: `${db.projects.filter((project) => project.status === "active").length} active projects`,
    manufacturer: `${db.resourceBatches.filter((batch) => batch.ownerOrgId === personaFor("manufacturer").orgId).length} batches recorded`,
    custodian: `${db.allocations.filter((allocation) => allocation.toOrgId === personaFor("custodian").orgId && allocation.status === "in_transit").length} arrivals expected`,
    maker: `${db.allocations.filter((allocation) => allocation.toOrgId === personaFor("maker").orgId && allocation.status === "proposed").length} allocations to answer`,
    admin: `${admin.metrics.openActions} open actions`,
  };

  return (
    <main className="min-h-screen bg-[var(--sidebar-bg)] px-5 py-8 sm:px-8 lg:py-12 flex flex-col justify-between">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 w-full">
        {/* Header: concise launchpad */}
        <header className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cirka-logo-white.png"
            alt="Cirka"
            className="h-10 w-auto object-contain object-left"
          />
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--brand-primary)]">
              Interactive product demo · revised MVP
            </p>
            <h1 className="max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              Select a persona.
            </h1>
          </div>

          {/* The alternative to exploring: let the product explain itself in order. */}
          <Link
            href="/demo/story"
            className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 py-2 pl-5 pr-2 transition-[border-color,background-color] duration-200 ease-[var(--ease-out)] hover:border-[var(--brand-primary)] hover:bg-white/10"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">
              Or take a guided walkthrough
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 ease-[var(--ease-out)] group-hover:bg-[var(--brand-primary)]">
              <PlayCircle size={16} />
            </span>
          </Link>
        </header>

        {/* 5-Role Cards Grid with Doppelrand Outer Shell */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_ORDER.map((role) => {
            const persona = personaFor(role);
            const organisation = db.organisations.find((org) => org._id === persona.orgId);

            return (
              <div
                key={role}
                className="animate-stagger-in rounded-[1.75rem] p-1 bg-white/5 ring-1 ring-white/10 transition-transform duration-200 hover:-translate-y-1"
              >
                <Link
                  href={`/demo/${role}/dashboard`}
                  className="group flex flex-col justify-between gap-6 rounded-[calc(1.75rem-4px)] border border-transparent bg-[var(--paper)] p-5 shadow-sm transition-colors duration-200 hover:border-[var(--brand-primary)] active:scale-[0.97] h-full"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]">
                        {ROLE_ICONS[role]}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {roleStat[role]}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold capitalize tracking-[-0.03em] text-[var(--ink)]">
                        {role === "admin" ? "CIRKA Admin" : role}
                      </h2>
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                        {persona.name}
                        {organisation ? ` · ${organisation.name}` : ""}
                      </p>
                    </div>

                    <p className="text-[13px] leading-relaxed text-[var(--ink-muted)] line-clamp-2">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
                    <span className="text-[11px] font-medium text-[var(--brand-primary)] group-hover:underline">
                      Enter workspace →
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)] transition-all duration-300 ease-[var(--ease-out)] group-hover:bg-[var(--brand-primary)] group-hover:text-white">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Database Summary Strip: Inline & Compact */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--sidebar-text-muted)]">
            <span className="text-white font-medium">Database state:</span>
            <span>Recorded: <strong className="text-white tabular-nums">{formatQuantity(admin.metrics.recorded, "kg")}</strong></span>
            <span>Available: <strong className="text-white tabular-nums">{formatQuantity(admin.metrics.available, "kg")}</strong></span>
            <span>In Motion: <strong className="text-white tabular-nums">{formatQuantity(admin.metrics.inMotion, "kg")}</strong></span>
            <span>Transformed: <strong className="text-white tabular-nums">{formatQuantity(admin.metrics.consumed, "kg")}</strong></span>
            <span>Written Off: <strong className="text-white tabular-nums">{formatQuantity(admin.metrics.writtenOff, "kg")}</strong></span>
          </div>

          <span
            className={
              integrity.length === 0
                ? "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)] shrink-0"
                : "text-[11px] font-bold uppercase tracking-[0.14em] text-[#F0A0A0] shrink-0"
            }
          >
            {integrity.length === 0
              ? "✓ Ledger balanced"
              : `⚠ ${integrity.length} discrepancy`}
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl w-full flex flex-col items-start gap-4 border-t border-[var(--sidebar-border)] pt-6 mt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-[var(--sidebar-text-muted)]">
          Mock dataset: {db.organisations.length} orgs · {Object.keys(PERSONA_IDS).length} personas · {db.resourceBatches.length} batches · {db.quantityMovements.length} movements. Safe browser sandbox.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={resetDemo}
            variant="secondary"
            size="sm"
            className="gap-2 border-[var(--sidebar-border)] bg-transparent text-white hover:bg-[var(--sidebar-hover)]"
          >
            <RotateCcw size={14} />
            Reset data
          </Button>
          <Button
            as={Link}
            href="/"
            variant="ghost"
            size="sm"
            className="text-white hover:bg-[var(--sidebar-hover)]"
          >
            Back to site
          </Button>
        </div>
      </footer>
    </main>
  );
}
