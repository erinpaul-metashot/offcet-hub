"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  Package,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Field, Input, Panel } from "@/components/ui";
import { DashboardHero, HorizontalBarChart } from "@/components/dashboard-widgets";
import { getAdminDashboard } from "../../_mock/selectors-admin";
import { formatQuantity } from "../../_mock/selectors-shared";
import { useDemoStore } from "../../_mock/store";
import {
  CirkaBadge,
  NoticeBanner,
  SectionHeading,
  formatDate,
} from "../../_components/cirka-ui";
import { NetworkLedgerNodes } from "../../_components/network-ledger-nodes";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { useAction } from "../../_components/use-action";
import type { QueueRow } from "../../_mock/selectors-actions";

const SEVERITY_BORDER_STYLES = {
  blocking: "border-l-4 border-l-[#D14343]",
  warning: "border-l-4 border-l-[#FF5C00]",
  info: "border-l-4 border-l-[var(--line-strong)]",
} as const;

export default function AdminDashboardPage() {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const view = getAdminDashboard(store.db);

  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Filter states */
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "blocking" | "warning" | "info">("all");
  const [domainFilter, setDomainFilter] = useState<"all" | "matching" | "allocation" | "production" | "system">("all");

  /* Helper to classify items into domain buckets */
  const getDomainInfo = (row: QueueRow) => {
    if (row.kind === "awaiting_match" || (row.kind === "awaiting_review" && row.id.startsWith("decision_"))) {
      return { key: "matching" as const, label: "Matching", badgeClass: "bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/30" };
    }
    if (
      row.kind.includes("acceptance") ||
      row.kind.includes("dispatch") ||
      row.kind.includes("receipt") ||
      row.kind.includes("discrepancy") ||
      row.id.startsWith("accept_") ||
      row.id.startsWith("dispatch_") ||
      row.id.startsWith("receipt_")
    ) {
      return { key: "allocation" as const, label: "Allocation", badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
    }
    if (
      row.kind.includes("production") ||
      row.kind.includes("evidence") ||
      row.id.startsWith("stalled_") ||
      row.id.startsWith("review_") ||
      row.id.startsWith("evidence_")
    ) {
      return { key: "production" as const, label: "Production", badgeClass: "bg-[#8CC63F]/10 text-[#8CC63F] border-[#8CC63F]/30" };
    }
    return { key: "system" as const, label: "System", badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30" };
  };

  /* Filtered Queue */
  const filteredQueue = useMemo(() => {
    return view.queue.filter((row) => {
      if (severityFilter !== "all" && row.severity !== severityFilter) {
        return false;
      }

      const domain = getDomainInfo(row).key;
      if (domainFilter !== "all" && domain !== domainFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = row.title.toLowerCase().includes(query);
        const matchesDetail = row.detail.toLowerCase().includes(query);
        const matchesKind = row.kind.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDetail && !matchesKind) {
          return false;
        }
      }

      return true;
    });
  }, [view.queue, severityFilter, domainFilter, searchQuery]);

  /* Category Counts */
  const counts = useMemo(() => {
    const total = view.queue.length;
    const blocking = view.queue.filter((r) => r.severity === "blocking").length;
    const warning = view.queue.filter((r) => r.severity === "warning").length;
    const info = view.queue.filter((r) => r.severity === "info").length;

    const matching = view.queue.filter((r) => getDomainInfo(r).key === "matching").length;
    const allocation = view.queue.filter((r) => getDomainInfo(r).key === "allocation").length;
    const production = view.queue.filter((r) => getDomainInfo(r).key === "production").length;
    const system = view.queue.filter((r) => getDomainInfo(r).key === "system").length;

    return { total, blocking, warning, info, matching, allocation, production, system };
  }, [view.queue]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero Header */}
      <DashboardHero
        eyebrow="CIRKA ADMIN CONTROL TOWER"
        title="Operational Overview & Decision Center"
      />

      {error && <NoticeBanner tone="blocking" title="That action was refused">{error}</NoticeBanner>}

      {/* Control Tower Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Open Decisions */}
        <Panel className="relative overflow-hidden p-5 transition-all hover:border-[var(--line-strong)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Action Queue
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5C00]/10 text-[#FF5C00]">
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
              {view.metrics.openActions}
            </span>
            <span className="text-xs font-semibold text-[var(--ink-muted)]">open decisions</span>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-[#D14343]">
              <span className="h-2 w-2 rounded-full bg-[#D14343]" />
              {view.metrics.blocking} Blocking
            </span>
            <span className="text-[var(--line-strong)]">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#FF5C00]">
              <span className="h-2 w-2 rounded-full bg-[#FF5C00]" />
              {view.metrics.warning} Warning
            </span>
            <span className="text-[var(--line-strong)]">•</span>
            <span className="font-medium text-[var(--ink-muted)]">
              {view.metrics.info} Info
            </span>
          </div>
        </Panel>

        {/* Card 2: Pending Verification */}
        <Panel className="relative overflow-hidden p-5 transition-all hover:border-[var(--line-strong)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Pending Review
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8CC63F]/10 text-[#8CC63F]">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
              {view.metrics.pendingUsers + view.metrics.pendingOrganisations + view.metrics.productionAwaitingReview}
            </span>
            <span className="text-xs font-semibold text-[var(--ink-muted)]">awaiting action</span>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
            <span>Users: <strong className="text-[var(--ink)]">{view.metrics.pendingUsers}</strong></span>
            <span className="text-[var(--line-strong)]">•</span>
            <span>Orgs: <strong className="text-[var(--ink)]">{view.metrics.pendingOrganisations}</strong></span>
            <span className="text-[var(--line-strong)]">•</span>
            <span>Evidence: <strong className="text-[var(--ink)]">{view.metrics.productionAwaitingReview}</strong></span>
          </div>
        </Panel>

        {/* Card 3: Material Volume & Ledger */}
        <Panel className="relative overflow-hidden p-5 transition-all hover:border-[var(--line-strong)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Material Volume
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Package size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
              {formatQuantity(view.metrics.recorded, "kg")}
            </span>
            <span className="text-xs font-semibold text-[var(--ink-muted)]">recorded</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs">
            <span className="text-[var(--ink-muted)]">
              In motion: <strong className="font-semibold text-[var(--ink)]">{formatQuantity(view.metrics.inMotion, "kg")}</strong>
            </span>
            {view.metrics.unexplained > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-[#D14343]">
                <AlertTriangle size={12} /> {formatQuantity(view.metrics.unexplained, "kg")} gap
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-[#8CC63F]">
                <CheckCircle2 size={12} /> Balanced
              </span>
            )}
          </div>
        </Panel>

        {/* Card 4: System Operational Load */}
        <Panel className="relative overflow-hidden p-5 transition-all hover:border-[var(--line-strong)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Active System Load
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Activity size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
              {view.metrics.activeProjects}
            </span>
            <span className="text-xs font-semibold text-[var(--ink-muted)]">active projects</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
            <span>Requests: <strong className="text-[var(--ink)]">{view.metrics.openRequests}</strong></span>
            <span className="text-[var(--line-strong)]">•</span>
            <span>Batches: <strong className="text-[var(--ink)]">{view.metrics.batchCount}</strong></span>
            {view.metrics.failedTransfers > 0 && (
              <span className="font-bold text-[#D14343]">{view.metrics.failedTransfers} err</span>
            )}
          </div>
        </Panel>
      </div>

      {/* Network Ledger Visual Nodes */}
      <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#FF5C00]" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
              Network Ledger Slices · {view.metrics.batchCount} recorded batches
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--ink)]">
            Total {formatQuantity(view.metrics.recorded, "kg")}
          </p>
        </div>
        <NetworkLedgerNodes slices={view.potSlices} unit="kg" />
      </section>

      {/* Main Grid: Action Queue (Left) vs Controls & Insights (Right) */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left Column: Action Queue */}
        <div className="space-y-5">
          <SectionHeading
            eyebrow="ACTION REQUIRED"
            title="Decision Queue"
            action={
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Showing {filteredQueue.length} of {view.queue.length} items
              </span>
            }
          />

          {/* Interactive Search & Filter Toolbar */}
          <Panel className="space-y-4 p-4">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action items by title, detail, or entity reference..."
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-xs">
              {/* Severity Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  <SlidersHorizontal size={12} /> Severity:
                </span>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("all")}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    severityFilter === "all"
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  All ({counts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("blocking")}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    severityFilter === "blocking"
                      ? "bg-[#D14343] text-white"
                      : "bg-[#D14343]/10 text-[#D14343] hover:bg-[#D14343]/20"
                  }`}
                >
                  Blocking ({counts.blocking})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("warning")}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    severityFilter === "warning"
                      ? "bg-[#FF5C00] text-white"
                      : "bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20"
                  }`}
                >
                  Warning ({counts.warning})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("info")}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    severityFilter === "info"
                      ? "bg-[var(--line-strong)] text-white"
                      : "bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  Info ({counts.info})
                </button>
              </div>

              {/* Domain Category Filter */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Domain:
                </span>
                {(["all", "matching", "allocation", "production", "system"] as const).map((domain) => {
                  const active = domainFilter === domain;
                  const labelMap = {
                    all: "All",
                    matching: `Matching (${counts.matching})`,
                    allocation: `Allocation (${counts.allocation})`,
                    production: `Production (${counts.production})`,
                    system: `System (${counts.system})`,
                  };

                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setDomainFilter(domain)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                        active
                          ? "bg-[var(--ink)] text-white"
                          : "text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {labelMap[domain]}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* Action Queue Cards List */}
          {filteredQueue.length > 0 ? (
            <div className="space-y-3">
              {filteredQueue.map((row) => {
                const isExpanded = expandedId === row.id;
                const domain = getDomainInfo(row);

                return (
                  <Panel
                    key={row.id}
                    className={`p-5 transition-all ${SEVERITY_BORDER_STYLES[row.severity]} hover:border-[var(--line-strong)]`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: Domain tag, Title, Details */}
                      <div className="min-w-0 space-y-2">
                        {/* Domain Tag & Severity Badge */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${domain.badgeClass}`}
                          >
                            {domain.label}
                          </span>
                          <CirkaBadge
                            status={row.severity === "blocking" ? "failed" : "open"}
                            label={row.severity}
                          />
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink-muted)]">
                            <Clock size={12} /> Open since {formatDate(row.since)}
                            {row.dueDate ? ` · due ${formatDate(row.dueDate)}` : ""}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-[var(--ink)] leading-snug">
                          {row.title}
                        </h3>

                        {/* Context Detail */}
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                          {row.detail}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                        {row.href && (
                          <Button
                            as={Link}
                            href={row.href}
                            size="sm"
                            variant="secondary"
                            className="inline-flex items-center gap-1"
                          >
                            Open <ArrowUpRight size={14} />
                          </Button>
                        )}
                        {row.stored && row.actionItemId && (
                          <Button
                            size="sm"
                            variant={isExpanded ? "secondary" : "primary"}
                            onClick={() => setExpandedId(isExpanded ? null : row.id)}
                            className={!isExpanded ? "bg-[#FF5C00] text-white hover:bg-[#E05200]" : ""}
                          >
                            {isExpanded ? "Cancel" : "Respond"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Respond Drawer Form */}
                    {isExpanded && row.stored && row.actionItemId && (
                      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 animate-stagger-in">
                        <div className="min-w-[16rem] flex-1">
                          <Field label="Resolution Note / Decision Action">
                            <Input
                              value={resolution[row.actionItemId] ?? ""}
                              onChange={(event) =>
                                setResolution((current) => ({
                                  ...current,
                                  [row.actionItemId as string]: event.target.value,
                                }))
                              }
                              placeholder="Record what was done and key notes for audit ledger..."
                              autoFocus
                            />
                          </Field>
                        </div>
                        <Button
                          size="sm"
                          disabled={pending}
                          className="bg-[#FF5C00] text-white hover:bg-[#E05200]"
                          onClick={() =>
                            run(() =>
                              store.closeActionItem("admin", {
                                actionItemId: row.actionItemId as string,
                                note: resolution[row.actionItemId as string] ?? "",
                              }),
                            )
                          }
                        >
                          Resolve Item
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            run(() =>
                              store.closeActionItem("admin", {
                                actionItemId: row.actionItemId as string,
                                dismiss: true,
                                note: resolution[row.actionItemId as string] ?? "",
                              }),
                            )
                          }
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          ) : (
            <Panel className="p-8 text-center">
              <CheckCircle2 size={32} className="mx-auto text-[#8CC63F]" />
              <p className="mt-3 text-base font-semibold text-[var(--ink)]">
                No matching decisions found
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {searchQuery || severityFilter !== "all" || domainFilter !== "all"
                  ? "Try clearing the filters."
                  : "All operational queues are currently clear."}
              </p>
              {(searchQuery || severityFilter !== "all" || domainFilter !== "all") && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSeverityFilter("all");
                    setDomainFilter("all");
                  }}
                >
                  Reset All Filters
                </Button>
              )}
            </Panel>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-5 xl:sticky xl:top-6">
          {/* Decision Summary Widget */}
          <Panel className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
                Open Decisions
              </p>
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                {view.metrics.openActions} total
              </span>
            </div>

            <p className="text-4xl font-extrabold leading-none tracking-tight text-[var(--ink)] tabular-nums">
              {view.metrics.openActions}
            </p>

            <div className="space-y-2.5 border-t border-[var(--line)] pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#D14343]">
                  <span className="h-2 w-2 rounded-full bg-[#D14343]" /> Blocking
                </span>
                <span className="font-semibold tabular-nums text-[#D14343]">
                  {view.metrics.blocking}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#FF5C00]">
                  <span className="h-2 w-2 rounded-full bg-[#FF5C00]" /> Warning
                </span>
                <span className="font-semibold tabular-nums text-[var(--ink)]">
                  {view.metrics.warning}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[var(--ink-muted)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--line-strong)]" /> Info
                </span>
                <span className="font-semibold tabular-nums text-[var(--ink)]">
                  {view.metrics.info}
                </span>
              </div>
            </div>
          </Panel>

          {/* Material Categories Chart */}
          <Panel className="space-y-4 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
              Material Categories
            </p>
            <HorizontalBarChart items={view.categories} emptyLabel="Nothing recorded yet." />
          </Panel>

          {/* Recent Audit Timeline */}
          <RoleActivityFeed role="admin" limit={8} />
        </div>
      </div>
    </div>
  );
}

