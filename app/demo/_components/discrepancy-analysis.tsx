"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Scale,
  X,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { format, type Locale } from "@/lib/i18n/locale";
import { useLocale, useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import type { Allocation, ResourceBatch } from "../_mock/types";
import { orgName } from "../_mock/selectors-shared";
import { CirkaBadge } from "./cirka-ui";
import { useDemoStore } from "../_mock/store";
import { useFormat } from "./use-format";

/** One-decimal percentage with the viewer's decimal separator. */
const pct = (value: string, locale: Locale) => (locale === "en" ? value : value.replace(".", ","));

interface DiscrepancyAnalysisProps {
  allocation: Allocation;
  batch?: ResourceBatch;
  fromName?: string;
  toName?: string;
  onCloseModal?: () => void;
}

export function DiscrepancyAnalysisPanel({
  allocation,
  batch,
  fromName,
  toName,
  onCloseModal,
}: DiscrepancyAnalysisProps) {
  const store = useDemoStore();
  const { discrepancy: t } = useMessages(demoCommon);
  const { locale } = useLocale();
  const fmt = useFormat();

  const senderName = fromName ?? orgName(store.db, allocation.fromOrgId);
  const receiverName = toName ?? orgName(store.db, allocation.toOrgId);

  const dispatched = allocation.quantityDispatched ?? allocation.quantityAllocated;
  const received = allocation.quantityReceived ?? 0;
  const shortfall = allocation.quantityDiscrepancy ?? Math.max(0, dispatched - received);
  const unit = allocation.unit;

  const variancePercent = dispatched > 0 ? ((shortfall / dispatched) * 100).toFixed(1) : "0.0";
  const receivedPercent = dispatched > 0 ? Math.min(100, Math.max(0, (received / dispatched) * 100)).toFixed(1) : "100.0";

  const isResolved = Boolean(allocation.discrepancyResolvedAt || allocation.discrepancyResolution);
  const resolverName = allocation.discrepancyResolvedByUserId
    ? store.db.users.find((u) => u._id === allocation.discrepancyResolvedByUserId)?.name ?? t.cirkaAdmin
    : t.cirkaAdmin;

  return (
    <div className="space-y-5">
      {/* Visual Hero Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 ${
          isResolved
            ? "border-[var(--brand-secondary)]/40 bg-[#F4F9EE]"
            : "border-[#FF5C00]/30 bg-[#FFF6F2]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-xs ${
              isResolved ? "bg-[#8CC63F]" : "bg-[#FF5C00]"
            }`}
          >
            {isResolved ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#545454]">
                {isResolved ? t.resolved : t.open}
              </span>
              <CirkaBadge status={allocation.status} />
            </div>
            <p className="text-base font-extrabold tracking-[-0.02em] text-[#2A2A2A]">
              {format(t.short, { quantity: fmt.quantity(shortfall, unit), percent: pct(variancePercent, locale) })}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <p className="text-xs font-semibold text-[#2A2A2A]">
            {senderName} → {receiverName}
          </p>
          <p className="text-[11px] text-[#545454] mt-0.5">
            {t.ref} <span className="font-mono font-medium text-[#2A2A2A]">{allocation.reference}</span>
          </p>
        </div>
      </div>

      {/* 3 Metric Cards: Dispatched vs Received vs Shortfall */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            <span>{t.dispatched}</span>
            <Scale size={13} />
          </div>
          <p className="text-xl font-black text-[var(--ink)] tracking-tight">
            {fmt.quantity(dispatched, unit)}
          </p>
          <p className="text-[10px] text-[var(--ink-muted)] truncate">
            {senderName} · {fmt.date(allocation.dispatchedAt)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#8CC63F]">
            <span>{t.received}</span>
            <Building2 size={13} />
          </div>
          <p className="text-xl font-black text-[#8CC63F] tracking-tight">
            {fmt.quantity(received, unit)}
          </p>
          <p className="text-[10px] text-[var(--ink-muted)] truncate">
            {receiverName} · {fmt.date(allocation.receivedAt)}
          </p>
        </div>

        <div className="rounded-xl border border-[#FF5C00]/30 bg-[#FFF5F0] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#FF5C00]">
            <span>{t.shortfall}</span>
            <ShieldAlert size={13} />
          </div>
          <p className="text-xl font-black text-[#FF5C00] tracking-tight">
            -{fmt.quantity(shortfall, unit)}
          </p>
          <p className="text-[10px] font-semibold text-[#FF5C00] truncate">
            {format(t.ofDispatched, { percent: pct(variancePercent, locale) })}
          </p>
        </div>
      </div>

      {/* Sleek Visual Reconciliation Bar */}
      <Panel className="p-3.5 space-y-2">
        <p className="text-right text-xs font-bold font-mono text-[var(--ink-muted)]">
          {format(t.split, { received: pct(receivedPercent, locale), short: pct(variancePercent, locale) })}
        </p>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface)] p-0.5">
          <div
            style={{ width: `${receivedPercent}%` }}
            className="h-full rounded-l-full bg-[#8CC63F]"
          />
          <div
            style={{ width: `${variancePercent}%` }}
            className="h-full rounded-r-full bg-[#FF5C00]"
          />
        </div>
      </Panel>

      {/* 2-Column Minimal Facts */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Receiver Finding */}
        <Panel className="p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {t.observation}
          </p>
          {allocation.discrepancyReason || allocation.notes ? (
            <p className="text-xs font-semibold text-[var(--ink)] leading-relaxed italic">
              &ldquo;{allocation.discrepancyReason || allocation.notes}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-[var(--ink-muted)]">{t.noReason}</p>
          )}
          {batch && (
            <div className="pt-1">
              <Link
                href={`/demo/manufacturer/batches/${batch._id}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5C00] hover:underline"
              >
                <span>{format(t.batch, { name: batch.name })}</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
        </Panel>

        {/* Audit Status */}
        <Panel className="p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {t.status}
          </p>
          {isResolved ? (
            <div className="space-y-1">
              <span className="inline-flex rounded-full bg-[#8CC63F]/15 px-2.5 py-0.5 text-xs font-bold text-[#8CC63F]">
                {format(t.resolvedAs, {
                  resolution: allocation.discrepancyResolution
                    ? t.resolutions[allocation.discrepancyResolution]
                    : "",
                })}
              </span>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {format(t.closedBy, { name: resolverName, date: fmt.date(allocation.discrepancyResolvedAt) })}
              </p>
            </div>
          ) : (
            <span className="inline-flex rounded-full bg-[#FF5C00]/15 px-2.5 py-0.5 text-xs font-bold text-[#FF5C00]">
              {t.heldUnexplained}
            </span>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function DiscrepancyModal({
  allocation,
  batch,
  fromName,
  toName,
  isOpen,
  onClose,
}: DiscrepancyAnalysisProps & { isOpen: boolean; onClose: () => void }) {
  const { discrepancy: t, ui } = useMessages(demoCommon);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-3xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5 bg-[var(--paper)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#FF5C00] shadow-xs" />
            <h3 className="text-sm font-bold tracking-tight text-[var(--ink)]">
              {t.audit}
            </h3>
            <span className="text-xs font-mono text-[var(--ink-muted)]">({allocation.reference})</span>
          </div>
          <button
            onClick={onClose}
            aria-label={ui.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--line)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <DiscrepancyAnalysisPanel
            allocation={allocation}
            batch={batch}
            fromName={fromName}
            toName={toName}
          />
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end border-t border-[var(--line)] px-5 py-3 bg-[var(--surface)] shrink-0">
          <Button onClick={onClose} variant="secondary" size="sm" className="font-semibold rounded-full px-5">
            {t.done}
          </Button>
        </div>
      </div>
    </div>
  );
}
