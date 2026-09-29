"use client";

import { Button, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { EXPORTS, downloadCsv, downloadJson } from "../../_mock/exports";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { NoticeBanner, SectionHeading } from "../../_components/cirka-ui";
import { useAction } from "../../_components/use-action";

export default function AdminExportsPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("admin");
  const { run, error } = useAction();
  const { exports: t } = useMessages(demoAdmin);

  return (
    <div className="space-y-6">
      <SectionHeading title={t.title} />

      {error && <NoticeBanner tone="blocking" title={t.failed}>{error}</NoticeBanner>}

      <div className="grid gap-5 lg:grid-cols-2">
        {EXPORTS.map((definition) => {
          const rows = definition.build(store.db, scope);

          return (
            <Panel key={definition.key} className="flex flex-col justify-between gap-5 p-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    {t.labels[definition.key as keyof typeof t.labels] ?? definition.label}
                  </h2>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {format(rows.length === 1 ? t.rowsOne : t.rowsMany, { count: rows.length })}
                  </span>
                </div>
                {definition.restricted && (
                  <p className="inline-flex rounded-full border border-dashed border-[var(--line-strong)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {t.restricted}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    run(async () => {
                      downloadCsv(definition.key, rows);
                      await store.recordExport("admin", {
                        exportName: definition.label,
                        format: "csv",
                        rowCount: rows.length,
                      });
                    })
                  }
                >
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    run(async () => {
                      downloadJson(definition.key, rows);
                      await store.recordExport("admin", {
                        exportName: definition.label,
                        format: "json",
                        rowCount: rows.length,
                      });
                    })
                  }
                >
                  JSON
                </Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
