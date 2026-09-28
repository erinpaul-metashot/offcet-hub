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
import { listTransfers } from "../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { NoticeBanner, SectionHeading, formatDate } from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";
import { classNames } from "@/lib/utils";

const DIRECTION_BADGES = {
  inbound: {
    label: "Inbound",
    icon: ArrowDownLeft,
    className: "bg-[#8CC63F]/15 text-[#8CC63F] border-[#8CC63F]/30",
  },
  outbound: {
    label: "Outbound",
    icon: ArrowUpRight,
    className: "bg-[var(--surface)] text-[var(--charcoal)] border-[var(--charcoal)]/30",
  },
} as const;

const STATUS_BADGES: Record<
  string,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    className: "bg-[#8CC63F]/15 text-[#8CC63F] border-[#8CC63F]/30",
  },
  failed: {
    label: "Failed",
    icon: AlertTriangle,
    className: "bg-[#D14343]/15 text-[#D14343] border-[#D14343]/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-[#FF5C00]/15 text-[#FF5C00] border-[#FF5C00]/30",
  },
  in_progress: {
    label: "In progress",
    icon: Clock,
    className: "bg-[#FF5C00]/15 text-[#FF5C00] border-[#FF5C00]/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertTriangle,
    className: "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]",
  },
  skipped: {
    label: "Skipped",
    icon: Clock,
    className: "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--line-strong)]",
  },
};

export default function AdminIntegrationsPage() {
  const store = useDemoStore();
  const searchParams = useSearchParams();
  const { run, pending, error } = useAction();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get("status") ?? "all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const targetTransferId = searchParams.get("id");

  const transfers = useMemo(() => listTransfers(store.db), [store.db]);

  const connections = useMemo(() => {
    return store.db.integrationConnections.map((conn) => {
      const org = store.db.organisations.find((o) => o._id === conn.orgId);
      return { conn, orgName: org?.name ?? "CIRKA Network" };
    });
  }, [store.db]);

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
          eyebrow="System Console"
          title="Integrations & System Transfers"
        />
        <Button as={Link} href="/demo/admin/dashboard" variant="secondary" size="sm">
          ← Back to Action Queue
        </Button>
      </div>

      {error && (
        <NoticeBanner tone="blocking" title="Action failed">
          {error}
        </NoticeBanner>
      )}

      {/* Integration Connections Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Connected Systems & Services
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
                  <h3 className="font-semibold text-sm text-[var(--ink)]">Retexcir Hub</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8CC63F]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8CC63F] border border-[#8CC63F]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8CC63F]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Automated textile intake sync and digital passport record exchange.
              </p>
            </div>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
              <span>Connected accounts:</span>
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
                  <h3 className="font-semibold text-sm text-[var(--ink)]">Traceability Partner</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8CC63F]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8CC63F] border border-[#8CC63F]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8CC63F]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Outbound chain-of-custody proofs and ESG verification reporting.
              </p>
            </div>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
              <span>Endpoint status:</span>
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
                  <h3 className="font-semibold text-sm text-[var(--ink)]">Custom Webhooks</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)] border border-[var(--line-strong)]">
                  Configured
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Inbound surplus dumps from factory ERP systems (Västkust ERP).
              </p>
            </div>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
              <span>Format supported:</span>
              <span className="text-[var(--ink)] font-mono">JSON / CSV</span>
            </div>
          </Panel>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Transfer Event Log
          </h2>
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D14343]">
              <AlertTriangle size={13} />
              {failedCount} failed transfer{failedCount === 1 ? "" : "s"} requiring attention
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
                placeholder="Search system, entity, or error message..."
                className="pl-10 h-11 py-0 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 py-0 text-sm"
              >
                <option value="all">All statuses ({transfers.length})</option>
                <option value="failed">Failed ({failedCount})</option>
                <option value="success">Success ({successCount})</option>
                <option value="pending">Pending ({pendingCount})</option>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="h-11 py-0 text-sm"
              >
                <option value="all">All directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </Select>
            </div>
          </div>
        </Panel>
      </div>

      {/* Transfers Table / List */}
      {filteredTransfers.length === 0 ? (
        <EmptyState title="No integration transfers found" />
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map(({ transfer, entityLabel }) => {
            const isTarget = targetTransferId === transfer._id;
            const statusConfig = STATUS_BADGES[transfer.status] ?? STATUS_BADGES.pending;
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
                        {directionConfig.label}
                      </span>

                      <span
                        className={classNames(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] border",
                          statusConfig.className
                        )}
                      >
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>

                      <span className="text-xs font-semibold text-[var(--ink)]">
                        {transfer.externalSystemName}
                      </span>

                      {entityLabel && (
                        <span className="text-xs text-[var(--ink-muted)]">
                          · Entity: <strong className="text-[var(--ink)]">{entityLabel}</strong>
                        </span>
                      )}
                    </div>

                    {/* Error / Description block */}
                    {transfer.status === "failed" && transfer.errorMessage && (
                      <div className="rounded-xl border border-[#D14343]/30 bg-[#D14343]/10 p-3 text-xs text-[#8A1F1F]">
                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={13} className="shrink-0" />
                          Failure reason:
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
                      <span>Created: {formatDate(transfer.createdAt)}</span>
                      {transfer.lastAttemptAt && (
                        <span>Last attempt: {formatDate(transfer.lastAttemptAt)}</span>
                      )}
                      <span>Attempts: {transfer.attemptCount}</span>
                      {transfer.externalRecordId && (
                        <span>
                          Record ID:{" "}
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
                        External Record <ExternalLink size={13} />
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
                        Retry Transfer
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
