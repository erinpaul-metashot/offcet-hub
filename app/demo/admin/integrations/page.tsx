"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plug,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button, EmptyState, Input, Panel, Select } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { listTransfers } from "../../_mock/selectors-admin";
import { useDemoStore } from "../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { useFormat } from "../../_components/use-format";
import { classNames } from "@/lib/utils";

/** Badge text lives in `demoAdmin.integrations.direction` / `.status`, keyed like these maps. */
const DIRECTION_BADGES = {
  inbound: {
    icon: ArrowDownLeft,
    className: "bg-[#8CC63F]/15 text-[#8CC63F] border-[#8CC63F]/30",
  },
  outbound: {
    icon: ArrowUpRight,
    className: "bg-[var(--surface)] text-[var(--charcoal)] border-[var(--charcoal)]/30",
  },
} as const;

const STATUS_BADGES: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "bg-[#8CC63F]/15 text-[#8CC63F] border-[#8CC63F]/30",
  },
  failed: {
    icon: AlertTriangle,
    className: "bg-[#D14343]/15 text-[#D14343] border-[#D14343]/30",
  },
  pending: {
    icon: Clock,
    className: "bg-[#FF5C00]/15 text-[#FF5C00] border-[#FF5C00]/30",
  },
  in_progress: {
    icon: Clock,
    className: "bg-[#FF5C00]/15 text-[#FF5C00] border-[#FF5C00]/30",
  },
  cancelled: {
    icon: AlertTriangle,
    className: "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]",
  },
  skipped: {
    icon: Clock,
    className: "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]",
  },
};

export default function AdminIntegrationsPage() {
  const store = useDemoStore();
  const searchParams = useSearchParams();
  const { run, pending, error } = useAction();
  const { integrations: t } = useMessages(demoAdmin);
  const fmt = useFormat();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get("status") ?? "all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const targetTransferId = searchParams.get("id");

  const transfers = useMemo(() => listTransfers(store.db), [store.db]);

  const connections = useMemo(() => {
    return store.db.integrationConnections.map((conn) => {
      const org = store.db.organisations.find((o) => o._id === conn.orgId);
      return { conn, orgName: org?.name ?? t.cirkaNetwork };
    });
  }, [store.db, t.cirkaNetwork]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter(({ transfer, entityLabel }) => {
      if (statusFilter !== "all" && transfer.status !== statusFilter) {
        return false;
      }
      if (directionFilter !== "all" && transfer.direction !== directionFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesSystem = transfer.externalSystemName.toLowerCase().includes(query);
        const matchesError = transfer.errorMessage?.toLowerCase().includes(query) ?? false;
        const matchesPayload = transfer.payloadSummary?.toLowerCase().includes(query) ?? false;
        const matchesRecord = transfer.externalRecordId?.toLowerCase().includes(query) ?? false;
        const matchesEntity = entityLabel?.toLowerCase().includes(query) ?? false;

        if (!matchesSystem && !matchesError && !matchesPayload && !matchesRecord && !matchesEntity) {
          return false;
        }
      }
      return true;
    });
  }, [transfers, statusFilter, directionFilter, search]);

  const failedCount = transfers.filter((t) => t.transfer.status === "failed").length;
  const successCount = transfers.filter((t) => t.transfer.status === "success").length;
  const pendingCount = transfers.filter((t) => t.transfer.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Header with back navigation to dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
        />
        <Button as={Link} href="/demo/admin/dashboard" variant="secondary" size="sm">
          {t.back}
        </Button>
      </div>

      {error && (
        <NoticeBanner tone="blocking" title={t.actionFailed}>
          {error}
        </NoticeBanner>
      )}

      {/* Integration Connections Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {t.connectedSystems}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Retexcir Connector Card */}
          <Panel className="p-5 flex flex-col justify-between space-y-4 border-[var(--line)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]">
                    <Plug size={14} />
                  </span>
                  <h3 className="font-semibold text-sm text-[var(--ink)]">{t.retexcirTitle}</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8CC63F]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8CC63F] border border-[#8CC63F]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8CC63F]" />
                  {t.active}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {t.retexcirBody}
              </p>
            </div>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
              <span>{t.connectedAccounts}</span>
              <strong className="text-[var(--ink)]">{connections.length || 1}</strong>
            </div>
          </Panel>

          {/* Traceability Partner API Card */}
          <Panel className="p-5 flex flex-col justify-between space-y-4 border-[var(--line)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--charcoal)]">
                    <ExternalLink size={14} />
                  </span>
                  <h3 className="font-semibold text-sm text-[var(--ink)]">{t.partnerTitle}</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8CC63F]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8CC63F] border border-[#8CC63F]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8CC63F]" />
                  {t.active}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {t.partnerBody}
              </p>
            </div>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
              <span>{t.endpointStatus}</span>
              <span className="text-[#8CC63F] font-semibold">200 OK</span>
            </div>
          </Panel>

          {/* Enterprise ERP Connectors Card */}
          <Panel className="p-5 flex flex-col justify-between space-y-4 border-[var(--line)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--charcoal)]">
                    <ShieldCheck size={14} />
                  </span>
                  <h3 className="font-semibold text-sm text-[var(--ink)]">{t.webhooksTitle}</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] border border-[var(--line-strong)]">
                  {t.configured}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {t.webhooksBody}
              </p>
            </div>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
              <span>{t.formatSupported}</span>
              <span className="text-[var(--ink)] font-mono">JSON / CSV</span>
            </div>
          </Panel>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {t.eventLog}
          </h2>
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D14343]">
              <AlertTriangle size={13} />
              {format(failedCount === 1 ? t.failedAttentionOne : t.failedAttentionMany, { count: failedCount })}
            </span>
          )}
        </div>

        <Panel className="p-4">
          <div className="grid gap-3 md:grid-cols-12 items-center">
            <div className="relative md:col-span-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-muted)]">
                <Search size={16} />
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="pl-10 h-11 py-0 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  {t.clear}
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 py-0 text-sm"
              >
                <option value="all">{format(t.allStatuses, { count: transfers.length })}</option>
                <option value="failed">{format(t.statusCount, { label: t.status.failed, count: failedCount })}</option>
                <option value="success">{format(t.statusCount, { label: t.status.success, count: successCount })}</option>
                <option value="pending">{format(t.statusCount, { label: t.status.pending, count: pendingCount })}</option>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="h-11 py-0 text-sm"
              >
                <option value="all">{t.allDirections}</option>
                <option value="inbound">{t.direction.inbound}</option>
                <option value="outbound">{t.direction.outbound}</option>
              </Select>
            </div>
          </div>
        </Panel>
      </div>

      {/* Transfers Table / List */}
      {filteredTransfers.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map(({ transfer, entityLabel }) => {
            const isTarget = targetTransferId === transfer._id;
            const statusKey = transfer.status in STATUS_BADGES ? transfer.status : "pending";
            const statusConfig = STATUS_BADGES[statusKey];
            const StatusIcon = statusConfig.icon;
            const directionConfig = DIRECTION_BADGES[transfer.direction];
            const DirectionIcon = directionConfig.icon;

            return (
              <Panel
                key={transfer._id}
                className={classNames(
                  "p-5 transition-all duration-200",
                  transfer.status === "failed"
                    ? "border-l-4 border-l-[#D14343] bg-[#D14343]/5"
                    : "border-[var(--line)]",
                  isTarget && "ring-2 ring-[var(--brand-primary)]"
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Transfer details */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={classNames(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] border",
                          directionConfig.className
                        )}
                      >
                        <DirectionIcon size={12} />
                        {t.direction[transfer.direction]}
                      </span>

                      <span
                        className={classNames(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] border",
                          statusConfig.className
                        )}
                      >
                        <StatusIcon size={12} />
                        {t.status[statusKey as keyof typeof t.status]}
                      </span>

                      <span className="text-xs font-semibold text-[var(--ink)]">
                        {transfer.externalSystemName}
                      </span>

                      {entityLabel && (
                        <span className="text-xs text-[var(--ink-muted)]">
                          {t.entity} <strong className="text-[var(--ink)]">{entityLabel}</strong>
                        </span>
                      )}
                    </div>

                    {/* Error / Description block */}
                    {transfer.status === "failed" && transfer.errorMessage && (
                      <div className="rounded-xl border border-[#D14343]/30 bg-[#D14343]/10 p-3 text-xs text-[#8A1F1F]">
                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={13} className="shrink-0" />
                          {t.failureReason}
                        </p>
                        <p className="font-mono text-[11px] leading-relaxed break-words">
                          {transfer.errorMessage}
                        </p>
                      </div>
                    )}

                    {transfer.payloadSummary && (
                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                        {transfer.payloadSummary}
                      </p>
                    )}

                    {/* Metadata strip */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-[var(--ink-muted)]">
                      <span>{format(t.created, { date: fmt.date(transfer.createdAt) })}</span>
                      {transfer.lastAttemptAt && (
                        <span>{format(t.lastAttempt, { date: fmt.date(transfer.lastAttemptAt) })}</span>
                      )}
                      <span>{format(t.attempts, { count: transfer.attemptCount })}</span>
                      {transfer.externalRecordId && (
                        <span>
                          {t.recordId}{" "}
                          <strong className="font-mono text-[var(--ink)]">
                            {transfer.externalRecordId}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
                    {transfer.externalRecordUrl && (
                      <Button
                        as="a"
                        href={transfer.externalRecordUrl}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        variant="ghost"
                        className="inline-flex items-center gap-1 text-xs"
                      >
                        {t.externalRecord} <ExternalLink size={13} />
                      </Button>
                    )}

                    {transfer.status === "failed" && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            await store.retryTransfer("admin", { transferId: transfer._id });
                          })
                        }
                        className="gap-1.5 bg-[#FF5C00] text-white hover:bg-[#E05200] shadow-xs font-semibold"
                      >
                        <RefreshCw size={13} className={pending ? "animate-spin" : ""} />
                        {t.retry}
                      </Button>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
