"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, Plug, PlugZap, X, HardDrive, Webhook, Database } from "lucide-react";
import { Button } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { RETEXCIR } from "../../../_mock/domain";
import { useDemoStore } from "../../../_mock/store";
import type { IntegrationConnection } from "../../../_mock/types";
import { NoticeBanner, DataRow } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";
import { useFormat } from "../../../_components/use-format";

const STEP_MS = 420;

export function IntegrationSettingsModal({
  isOpen,
  onClose,
  connection,
}: {
  isOpen: boolean;
  onClose: () => void;
  connection?: IntegrationConnection;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const disconnect = useAction();
  const [step, setStep] = useState(-1);
  const [erpConnected, setErpConnected] = useState(false);
  const [erpStep, setErpStep] = useState(-1);
  const { integrationSettings: t } = useMessages(demoManufacturer);
  const { ui } = useMessages(demoCommon);
  const fmt = useFormat();

  if (!isOpen) return null;

  const running = step >= 0 || pending;

  const connect = async () => {
    for (let index = 0; index < RETEXCIR.handshakeSteps.length; index += 1) {
      setStep(index);
      await new Promise((resolve) => setTimeout(resolve, STEP_MS));
    }

    const ok = await run(() =>
      store.connectRetexcirAccount("manufacturer", { accountRef: RETEXCIR.accountRefExample }),
    );

    if (!ok) {
      setStep(-1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#545454]/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--ink)]">{t.title}</h2>
          <button
            onClick={onClose}
            aria-label={ui.close}
            className="rounded-full p-2 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-10">
          {/* Active Integrations */}
          <div className="space-y-8">
            {/* Retexcir Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-2">
                <PlugZap size={20} className="text-[#FF5C00]" />
                <h3 className="text-base font-semibold text-[var(--ink)]">{t.retexcirTitle}</h3>
              </div>
              
              {connection ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-[#8CC63F] font-medium">
                    <Check size={16} /> {t.connected}
                  </div>
                  
                  {disconnect.error && (
                    <NoticeBanner tone="blocking" title={t.disconnectFailed}>
                      {disconnect.error}
                    </NoticeBanner>
                  )}

                  <dl className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
                    <DataRow label={t.account} value={connection.accountRef} />
                    <DataRow label={t.connectedOn} value={fmt.date(connection.connectedAt)} />
                    <DataRow
                      label={t.pushEndpoint}
                      value={
                        <code className="font-mono text-[12px] break-all">
                          {RETEXCIR.webhookUrl(connection.accountRef)}
                        </code>
                      }
                    />
                  </dl>
                  
                  <div className="flex gap-3">
                    <Button
                      as="a"
                      href={RETEXCIR.appUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="secondary"
                    >
                      {format(t.open, { system: RETEXCIR.systemName })}
                      <ExternalLink size={15} className="ml-2" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#8A3D11] hover:bg-[#8A3D11]/10 hover:text-[#8A3D11]"
                      disabled={disconnect.pending}
                      onClick={() => void disconnect.run(() => store.disconnectRetexcirAccount("manufacturer"))}
                    >
                      {t.disconnect}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <NoticeBanner tone="blocking" title={format(t.handshakeRefused, { system: RETEXCIR.systemName })}>
                      {error}
                    </NoticeBanner>
                  )}
                  <div className="flex gap-3">
                    <Button disabled={running} onClick={() => void connect()}>
                      {running ? (
                        <>
                          <Loader2 size={15} className="mr-2 animate-spin" />
                          {t.connecting}
                        </>
                      ) : (
                        t.connectAccount
                      )}
                    </Button>
                  </div>
                  {step >= 0 && (
                    <ol className="space-y-2 pt-2">
                      {t.retexcirSteps.map((label, index) => (
                        <li
                          key={label}
                          className={`flex items-center gap-3 text-sm ${
                            index <= step ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
                          }`}
                        >
                          {index < step ? (
                            <Check size={15} className="text-[#8CC63F]" />
                          ) : index === step ? (
                            <Loader2 size={15} className="animate-spin text-[#FF5C00]" />
                          ) : (
                            <span className="h-[15px] w-[15px] rounded-full border border-dashed border-[var(--line-strong)]" />
                          )}
                          {label}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>

            {/* ERP Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-2">
                <Plug size={20} className="text-[#FF5C00]" />
                <h3 className="text-base font-semibold text-[var(--ink)]">Nordväst ERP</h3>
              </div>
              
              {erpConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-[#8CC63F] font-medium">
                    <Check size={16} /> {t.connected}
                  </div>
                  
                  <dl className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
                    <DataRow label={t.system} value="Nordväst AS/400" />
                    <DataRow label={t.connectedOn} value={t.justNow} />
                    <DataRow
                      label={t.syncSchedule}
                      value={t.nightly}
                    />
                  </dl>
                  
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#8A3D11] hover:bg-[#8A3D11]/10 hover:text-[#8A3D11]"
                      onClick={() => setErpConnected(false)}
                    >
                      {t.disconnect}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button disabled={erpStep >= 0} onClick={async () => {
                      for (let i = 0; i < t.erpSteps.length; i++) {
                        setErpStep(i);
                        await new Promise(r => setTimeout(r, 600));
                      }
                      setErpConnected(true);
                      setErpStep(-1);
                    }}>
                      {erpStep >= 0 ? (
                        <>
                          <Loader2 size={15} className="mr-2 animate-spin" />
                          {t.connecting}
                        </>
                      ) : (
                        t.connectErp
                      )}
                    </Button>
                  </div>
                  {erpStep >= 0 && (
                    <ol className="space-y-2 pt-2">
                      {t.erpSteps.map((label, index) => (
                        <li
                          key={label}
                          className={`flex items-center gap-3 text-sm ${
                            index <= erpStep ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
                          }`}
                        >
                          {index < erpStep ? (
                            <Check size={15} className="text-[#8CC63F]" />
                          ) : index === erpStep ? (
                            <Loader2 size={15} className="animate-spin text-[#FF5C00]" />
                          ) : (
                            <span className="h-[15px] w-[15px] rounded-full border border-dashed border-[var(--line-strong)]" />
                          )}
                          {label}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}

