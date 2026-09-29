"use client";

import Link from "next/link";
import { PlugZap, FileSpreadsheet, Database, Keyboard, RefreshCw, ArrowRight, Settings, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { NoticeBanner } from "../../../_components/cirka-ui";
import { useDemoStore } from "../../../_mock/store";
import { useAction } from "../../../_components/use-action";
import type { IntegrationConnection } from "../../../_mock/types";

interface ImportChannelsGridProps {
  connection?: IntegrationConnection;
  onOpenSettings: () => void;
}

export function ImportChannelsGrid({ connection, onOpenSettings }: ImportChannelsGridProps) {
  const store = useDemoStore();
  const pullRetexcir = useAction();
  const pullErp = useAction();
  const { channels: t } = useMessages(demoManufacturer);

  const handleRetexcirSync = async () => {
    if (!connection) {
      onOpenSettings();
      return;
    }
    await pullRetexcir.run(() => store.pullRetexcirRecords("manufacturer"));
  };

  const handleErpSync = async () => {
    await pullErp.run(() =>
      store.receiveArrival("manufacturer", {
        channel: "erp_import",
        externalSystemName: "Nordväst ERP",
      })
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Retexcir Channel Card */}
        <div className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[#FF5C00]/50 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF5C00]/10 text-[#FF5C00]">
                <PlugZap size={22} />
              </div>
              {connection ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8CC63F]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#5a8720]">
                  <CheckCircle2 size={12} /> {t.connected}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-[var(--paper)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                  {t.notConnected}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-[var(--ink)] group-hover:text-[#FF5C00] transition-colors">
              Retexcir
            </h3>
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--line)] flex items-center gap-2">
            <Button
              onClick={() => void handleRetexcirSync()}
              disabled={pullRetexcir.pending}
              className="w-full bg-[#FF5C00] text-white hover:bg-[#E55300] text-xs h-9 justify-center font-medium shadow-sm"
            >
              {pullRetexcir.pending ? (
                <>
                  <RefreshCw size={14} className="mr-1.5 animate-spin" />
                  {t.syncing}
                </>
              ) : connection ? (
                <>
                  <RefreshCw size={14} className="mr-1.5" />
                  {t.sync}
                </>
              ) : (
                t.connect
              )}
            </Button>
            {connection && (
              <button
                onClick={onOpenSettings}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--ink-muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
                title={t.settings} aria-label={t.settings}
              >
                <Settings size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Spreadsheet CSV Channel Card */}
        <div className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[#FF5C00]/50 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#545454]/10 text-[#545454]">
                <FileSpreadsheet size={22} />
              </div>
            </div>

            <h3 className="font-semibold text-[var(--ink)] group-hover:text-[#FF5C00] transition-colors">
              {t.spreadsheet}
            </h3>
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--line)]">
            <Button
              as={Link}
              href="/demo/manufacturer/batches/import/map"
              variant="secondary"
              className="w-full text-xs h-9 justify-center font-medium"
            >
              {t.uploadCsv}
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>

        {/* ERP Connector Channel Card */}
        <div className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[#FF5C00]/50 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8CC63F]/15 text-[#5a8720]">
                <Database size={22} />
              </div>
            </div>

            <h3 className="font-semibold text-[var(--ink)] group-hover:text-[#FF5C00] transition-colors">
              Nordväst ERP
            </h3>
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--line)]">
            <Button
              onClick={() => void handleErpSync()}
              disabled={pullErp.pending}
              variant="secondary"
              className="w-full text-xs h-9 justify-center font-medium"
            >
              {pullErp.pending ? (
                <>
                  <RefreshCw size={14} className="mr-1.5 animate-spin" />
                  {t.pulling}
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="mr-1.5" />
                  {t.pullRecords}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Manual Entry Channel Card */}
        <div className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[#FF5C00]/50 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--paper)] text-[var(--ink)]">
                <Keyboard size={22} />
              </div>
            </div>

            <h3 className="font-semibold text-[var(--ink)] group-hover:text-[#FF5C00] transition-colors">
              {t.manualEntry}
            </h3>
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--line)]">
            <Button
              as={Link}
              href="/demo/manufacturer/batches/new"
              variant="secondary"
              className="w-full text-xs h-9 justify-center font-medium"
            >
              <PlusCircle size={14} className="mr-1.5 text-[#FF5C00]" />
              {t.newBatch}
            </Button>
          </div>
        </div>
      </div>

      {(pullRetexcir.error || pullErp.error) && (
        <NoticeBanner tone="blocking" title={t.nothingReceived}>
          {pullRetexcir.error || pullErp.error}
        </NoticeBanner>
      )}
    </div>
  );
}
