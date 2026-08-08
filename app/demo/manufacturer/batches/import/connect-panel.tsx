"use client";

/**
 * The connect handshake. The three steps are the ones the real integration will
 * run — authorise, exchange keys, register the push endpoint — so a viewer can
 * see where a connection fails rather than just that it did. No account entry:
 * this is a mock, so clicking Connect simulates the account Retexcir already
 * knows about.
 */

import { useState } from "react";
import { Check, ExternalLink, Loader2, Plug } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { RETEXCIR } from "../../../_mock/domain";
import { useDemoStore } from "../../../_mock/store";
import { NoticeBanner } from "../../../_components/cirka-ui";
import { useAction } from "../../../_components/use-action";

const STEP_MS = 420;

export function ConnectPanel() {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  /** How many handshake steps have completed. -1 while idle. */
  const [step, setStep] = useState(-1);

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
    <Panel className="space-y-4 p-5 border-[var(--line)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--line-strong)] text-[var(--ink-muted)]">
            <Plug size={20} />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Not connected to {RETEXCIR.systemName}
            </p>
            <p className="text-xs text-[var(--ink-muted)] max-w-md">
              Connect to receive sorted batches automatically.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button disabled={running} onClick={() => void connect()} size="sm">
            {running ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Connecting
              </>
            ) : (
              "Connect Account"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <NoticeBanner tone="blocking" title={`${RETEXCIR.systemName} refused the handshake`}>
          {error}
        </NoticeBanner>
      )}

      {step >= 0 && (
        <ol className="space-y-2 border-t border-[var(--line)] pt-4">
          {RETEXCIR.handshakeSteps.map((label, index) => (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm transition-colors duration-200 ease-[var(--ease-out)] ${
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
    </Panel>
  );
}
