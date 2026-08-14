"use client";

/**
 * Material Intake Center — Redesigned for visual clarity, intuitive 1-click channel access,
 * and high scannability without complex modal pie menus or empty whitespace boxes.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Settings, Inbox, History, CheckCircle2 } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { categoryLabel, formatQuantity } from "../../../_mock/selectors-shared";
import {
  getRetexcirConnection,
  listPendingArrivals,
  listRetexcirBatches,
  listRetexcirTransfers,
} from "../../../_mock/selectors-intake";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";
import {
  CirkaBadge,
  SectionHeading,
  formatDateTime,
} from "../../../_components/cirka-ui";
import { INBOX_HREF, RetexcirLink } from "./retexcir-link";
import { ImportChannelsGrid } from "./import-channels";
import { IntegrationSettingsModal } from "./integration-settings-modal";

export default function IntakePage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const connection = getRetexcirConnection(db, scope);
  const waiting = listPendingArrivals(db, scope, { channel: "sorting_system" });
  const transfers = listRetexcirTransfers(db, scope);
  const imported = listRetexcirBatches(db, scope);

  return (
    <div className="space-y-8">
      <IntegrationSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        connection={connection}
      />

      {/* Header */}
      <SectionHeading
        eyebrow="Intake"
        title="Material Import Center"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={15} className="mr-2" />
              Integrations
            </Button>
            <Button as={Link} href="/demo/manufacturer/batches" variant="secondary" size="sm">
              All Batches
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        }
      />

      {/* 1. Direct Import Channel Action Cards Grid */}
      <ImportChannelsGrid 
        connection={connection} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />

      {/* 2. Intake Queue — Pending Arrivals Needing Review */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Received & Waiting for Review
            </h2>
            {waiting.length > 0 ? (
              <span className="flex h-5 items-center justify-center rounded-full bg-[#FF5C00] px-2.5 text-[11px] font-bold text-white shadow-sm">
                {waiting.length} Action{waiting.length === 1 ? "" : "s"} Required
              </span>
            ) : (
              <span className="flex h-5 items-center justify-center rounded-full bg-[#8CC63F]/20 px-2 text-[11px] font-semibold text-[#5a8720]">
                Queue Clear
              </span>
            )}
          </div>
          {waiting.length > 0 && (
            <Link 
              href={INBOX_HREF} 
              className="text-xs font-semibold text-[#FF5C00] hover:underline inline-flex items-center gap-1"
            >
              Open Intake Inbox <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {waiting.length === 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-[var(--ink-muted)]">
              <Inbox size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">No items waiting in intake queue</p>
            </div>
          </div>
        ) : (
          <Panel className="divide-y divide-[var(--line)] border-[#FF5C00]/30 p-0 shadow-sm ring-1 ring-[#FF5C00]/15 bg-[var(--surface)]">
            {waiting.map((arrival) => (
              <div
                key={arrival._id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-stone-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--ink)]">
                      {arrival.name ?? "Untitled Record"}
                    </p>
                    <span className="rounded bg-[#FF5C00]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF5C00]">
                      {arrival.externalRecordId}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">
                    <span className="font-medium text-[var(--ink)]">
                      {arrival.materialCategory ? categoryLabel(arrival.materialCategory) : "Unclassified Material"}
                    </span>
                    {" · "}
                    <span className="tabular-nums font-semibold text-[var(--ink)]">
                      {arrival.quantity !== undefined && arrival.unit
                        ? formatQuantity(arrival.quantity, arrival.unit)
                        : "Quantity Pending"}
                    </span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {arrival.externalRecordUrl && (
                    <RetexcirLink href={arrival.externalRecordUrl}>View in Retexcir</RetexcirLink>
                  )}
                  <Button
                    as={Link}
                    href={INBOX_HREF}
                    size="sm"
                    className="bg-[#FF5C00] text-white hover:bg-[#E55300] shadow-sm font-medium"
                  >
                    Review & Confirm
                  </Button>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      {/* 3. Activity & Ledger Section (Two Columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Already in Ledger */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Already in Your Ledger
            </h2>
            <span className="text-xs font-semibold text-[var(--ink-muted)]">
              {imported.length} Recorded
            </span>
          </div>

          {imported.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center bg-[var(--surface)]/50">
              <p className="text-xs font-medium text-[var(--ink-muted)]">No sorted batches recorded in ledger yet</p>
            </div>
          ) : (
            <Panel className="divide-y divide-[var(--line)] p-0 bg-[var(--surface)] shadow-sm">
              <div className="max-h-[320px] overflow-y-auto">
                {imported.map((batch) => (
                  <div
                    key={batch._id}
                    className="flex flex-col gap-1.5 px-5 py-3.5 hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/demo/manufacturer/batches/${batch._id}`}
                        className="group inline-flex items-center gap-1.5 font-medium text-[var(--ink)] transition-colors hover:text-[#FF5C00]"
                      >
                        {batch.name}
                        <ArrowRight
                          size={13}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                      <CirkaBadge status={batch.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
                      <span className="font-mono text-[11px]">{batch.reference}</span>
                      <span className="tabular-nums font-semibold text-[var(--ink)]">
                        {formatQuantity(batch.quantityOriginal, batch.unit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>

        {/* Right Column: Transfer Log */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              System Transfer Log
            </h2>
            <span className="text-xs font-semibold text-[var(--ink-muted)]">
              {transfers.length} Events
            </span>
          </div>

          {transfers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center bg-[var(--surface)]/50">
              <p className="text-xs font-medium text-[var(--ink-muted)]">No system transfer history recorded</p>
            </div>
          ) : (
            <Panel className="divide-y divide-[var(--line)] p-0 bg-[var(--surface)] shadow-sm">
              <div className="max-h-[320px] overflow-y-auto">
                {transfers.map((transfer) => (
                  <div
                    key={transfer._id}
                    className="flex flex-col gap-1.5 px-5 py-3.5 hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-mono text-[11px] font-semibold text-[var(--ink)] break-all">
                        {transfer.externalRecordId}
                      </p>
                      <CirkaBadge
                        status={transfer.status}
                        label={transfer.status === "success" ? "Accepted" : "Rejected"}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--ink-muted)]">
                        {formatDateTime(transfer.createdAt)} · {transfer.payloadSummary}
                      </p>
                      {transfer.errorMessage && (
                        <p className="text-xs leading-relaxed font-medium text-red-600">
                          {transfer.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}
