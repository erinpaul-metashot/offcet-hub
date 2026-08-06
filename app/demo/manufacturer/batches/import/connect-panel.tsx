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
    <Panel className="space-y-5 p-6">
      <div className="flex items-start gap-3">
        <Plug size={18} className="mt-1 shrink-0 text-[var(--brand-primary)]" />
        <div className="space-y-1">
          <p className="font-semibold text-[var(--ink)]">
            Connect your {RETEXCIR.systemName} account
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            CIRKA registers a push endpoint on {RETEXCIR.systemName}, so everything you sort from
            then on arrives here on its own.
          </p>
        </div>
      </div>

      {error && (
        <NoticeBanner tone="blocking" title={`${RETEXCIR.systemName} refused the handshake`}>
          {error}
        </NoticeBanner>
      )}

      <div className="flex flex-wrap gap-3">
        <Button disabled={running} onClick={() => void connect()}>
          {running ? "Connecting" : "Connect"}
        </Button>
        <Button as="a" href={RETEXCIR.appUrl} target="_blank" rel="noreferrer" variant="secondary">
          Open {RETEXCIR.systemName}
          <ExternalLink size={15} className="ml-2" />
        </Button>
      </div>

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
                <Check size={15} className="text-[var(--brand-secondary)]" />
              ) : index === step ? (
                <Loader2 size={15} className="animate-spin text-[var(--brand-primary)]" />
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
