"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Field, Input, Panel } from "@/components/ui";
import { DashboardHero, HorizontalBarChart } from "@/components/dashboard-widgets";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { getAdminDashboard } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../_components/cirka-ui";
import { useFormat } from "../../_components/use-format";
import { useLabels } from "../../_components/use-labels";
import { NetworkLedgerNodes } from "../../_components/network-ledger-nodes";
import { RoleActivityFeed } from "../../_components/trace-timeline";
import { useAction } from "../../_components/use-action";
import type { QueuePhrase, QueueRow } from "../../_mock/selectors-actions";

const SEVERITY_BORDER_STYLES = {
  blocking: "border-l-4 border-l-[#D14343]",
  warning: "border-l-4 border-l-[#FF5C00]",
  info: "border-l-4 border-l-[var(--line-strong)]",
} as const;

export default function AdminDashboardPage() {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const view = getAdminDashboard(store.db);
  const { dashboard: t, queuePhrase } = useMessages(demoAdmin);
  const labels = useLabels();
  const fmt = useFormat();

  /** Renders a queue phrase in the viewer's language; `fallback` is the English text the selector built. */
  const phrase = (value: QueuePhrase | undefined, fallback: string) => {
    const template = value ? queuePhrase[value.key as keyof typeof queuePhrase] : undefined;
    if (!value || !template) {
      return fallback;
    }
    const params = Object.fromEntries(
      Object.entries(value.params ?? {}).map(([name, param]) => [
        name,
        typeof param !== "object"
          ? param
          : "role" in param
            ? labels.ROLE_LABELS[param.role]
            : fmt.quantity(param.quantity, param.unit),
      ]),
    );
    return format(template, params);
  };
  const rowText = (row: QueueRow) => ({
    title: phrase(row.titlePhrase, row.title),
    detail: phrase(row.detailPhrase, row.detail),
  });

  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Filter states */
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "blocking" | "warning" | "info">("all");
  const [domainFilter, setDomainFilter] = useState<"all" | "matching" | "allocation" | "production" | "system">("all");

  /* Helper to classify items into domain buckets */
  const getDomainInfo = (row: QueueRow) => {
    if (row.kind === "awaiting_match" || (row.kind === "awaiting_review" && row.id.startsWith("decision_"))) {
      return { key: "matching" as const, badgeClass: "bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/30" };
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
      return { key: "allocation" as const, badgeClass: "bg-[var(--surface)] text-[var(--charcoal)] border-[var(--charcoal)]/30" };
    }
    if (
      row.kind.includes("production") ||
      row.kind.includes("evidence") ||
      row.id.startsWith("stalled_") ||
      row.id.startsWith("review_") ||
      row.id.startsWith("evidence_")
    ) {
      return { key: "production" as const, badgeClass: "bg-[#8CC63F]/10 text-[#8CC63F] border-[#8CC63F]/30" };
    }
    return { key: "system" as const, badgeClass: "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]" };
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
        const text = rowText(row);
        const matchesTitle = text.title.toLowerCase().includes(query) || row.title.toLowerCase().includes(query);
        const matchesDetail = text.detail.toLowerCase().includes(query) || row.detail.toLowerCase().includes(query);
        const matchesKind = row.kind.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDetail && !matchesKind) {
          return false;
        }
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rowText only changes with the locale, which re-renders anyway
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

  const isFiltered = Boolean(searchQuery) || severityFilter !== "all" || domainFilter !== "all";

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero Header */}
      <DashboardHero title={t.title} />

      {error && <NoticeBanner tone="blocking" title={t.refused}>{error}</NoticeBanner>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {t.pendingReview}
            </span>
            <Clock size={16} className="text-[var(--brand-secondary)]" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
            {view.metrics.pendingUsers + view.metrics.pendingOrganisations + view.metrics.productionAwaitingReview}
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
            <span>{t.users} <strong className="text-[var(--ink)]">{view.metrics.pendingUsers}</strong></span>
            <span className="text-[var(--line-strong)]">•</span>
            <span>{t.orgs} <strong className="text-[var(--ink)]">{view.metrics.pendingOrganisations}</strong></span>
            <span className="text-[var(--line-strong)]">•</span>
            <span>{t.evidence} <strong className="text-[var(--ink)]">{view.metrics.productionAwaitingReview}</strong></span>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {t.activeProjects}
            </span>
            <Activity size={16} className="text-[var(--brand-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
            {view.metrics.activeProjects}
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
            <span>{t.openRequests} <strong className="text-[var(--ink)]">{view.metrics.openRequests}</strong></span>
            {view.metrics.failedTransfers > 0 && (
              <>
                <span className="text-[var(--line-strong)]">•</span>
                <span className="font-bold text-[#D14343]">
                  {format(view.metrics.failedTransfers === 1 ? t.failedTransfersOne : t.failedTransfersMany, {
                    count: view.metrics.failedTransfers,
                  })}
                </span>
              </>
            )}
          </div>
        </Panel>
      </div>

      <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
            {format(t.ledger, { count: view.metrics.batchCount })}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-[var(--ink-muted)]">
            <span>
              {t.total} <strong className="text-[var(--ink)]">{fmt.quantity(view.metrics.recorded, "kg")}</strong>
            </span>
            <span>
              {t.inMotion} <strong className="text-[var(--ink)]">{fmt.quantity(view.metrics.inMotion, "kg")}</strong>
            </span>
            {view.metrics.unexplained > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-[#D14343]">
                <AlertTriangle size={12} /> {format(t.unexplained, { quantity: fmt.quantity(view.metrics.unexplained, "kg") })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--brand-secondary)]">
                <CheckCircle2 size={12} /> {t.balanced}
              </span>
            )}
          </p>
        </div>
        <NetworkLedgerNodes slices={view.potSlices} unit="kg" />
      </section>

      {/* Main Grid: Action Queue (Left) vs Controls & Insights (Right) */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left Column: Action Queue */}
        <div className="space-y-5">
          <SectionHeading
            title={t.openActions}
            action={
              filteredQueue.length !== view.queue.length ? (
                <span className="text-xs font-medium tabular-nums text-[var(--ink-muted)]">
                  {format(t.filteredCount, { shown: filteredQueue.length, total: view.queue.length })}
                </span>
              ) : undefined
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
                placeholder={t.search}
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  {t.clear}
                </button>
              )}
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-xs">
              {/* Severity Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <SlidersHorizontal size={12} className="mr-1 text-[var(--ink-muted)]" aria-label={t.filter} />
                <button
                  type="button"
                  onClick={() => setSeverityFilter("all")}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    severityFilter === "all"
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  {format(t.severity.all, { count: counts.total })}
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
                  {format(t.severity.blocking, { count: counts.blocking })}
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
                  {format(t.severity.warning, { count: counts.warning })}
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
                  {format(t.severity.info, { count: counts.info })}
                </button>
              </div>

              {/* Domain Category Filter */}
              <div className="flex flex-wrap items-center gap-1">
                {(["all", "matching", "allocation", "production", "system"] as const).map((domain) => {
                  const active = domainFilter === domain;
                  const labelMap = {
                    all: t.domainAll,
                    matching: format(t.domainCount, { label: t.domains.matching, count: counts.matching }),
                    allocation: format(t.domainCount, { label: t.domains.allocation, count: counts.allocation }),
                    production: format(t.domainCount, { label: t.domains.production, count: counts.production }),
                    system: format(t.domainCount, { label: t.domains.system, count: counts.system }),
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
                const text = rowText(row);

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
                            {t.domains[domain.key]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink-muted)]">
                            <Clock size={12} /> {format(t.openSince, { date: fmt.date(row.since) })}
                            {row.dueDate ? format(t.due, { date: fmt.date(row.dueDate) }) : ""}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-[var(--ink)] leading-snug">
                          {text.title}
                        </h3>

                        {/* Context Detail */}
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                          {text.detail}
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
                            {t.open} <ArrowUpRight size={14} />
                          </Button>
                        )}
                        {row.stored && row.actionItemId && (
                          <Button
                            size="sm"
                            variant={isExpanded ? "secondary" : "primary"}
                            onClick={() => setExpandedId(isExpanded ? null : row.id)}
                            className={!isExpanded ? "bg-[#FF5C00] text-white hover:bg-[#E05200]" : ""}
                          >
                            {isExpanded ? t.cancel : t.respond}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Respond Drawer Form */}
                    {isExpanded && row.stored && row.actionItemId && (
                      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 animate-stagger-in">
                        <div className="min-w-[16rem] flex-1">
                          <Field label={t.note}>
                            <Input
                              value={resolution[row.actionItemId] ?? ""}
                              onChange={(event) =>
                                setResolution((current) => ({
                                  ...current,
                                  [row.actionItemId as string]: event.target.value,
                                }))
                              }
                              placeholder={t.notePlaceholder}
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
                          {t.resolve}
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
                          {t.dismiss}
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
                {isFiltered ? t.noMatches : t.queueClear}
              </p>
              {isFiltered && (
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
                  {t.resetFilters}
                </Button>
              )}
            </Panel>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-5 xl:sticky xl:top-6">
          {/* Material Categories Chart */}
          <Panel className="space-y-4 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
              {t.materialCategories}
            </p>
            <HorizontalBarChart
              items={view.categories.map((item) => ({
                ...item,
                label: labels.MATERIAL_CATEGORY_LABELS[item.key] ?? item.label,
              }))}
              emptyLabel={t.nothingRecorded}
            />
          </Panel>

          {/* Recent Audit Timeline */}
          <RoleActivityFeed role="admin" limit={8} />
        </div>
      </div>
    </div>
  );
}

