"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input, Panel, Select } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { BATCH_STATUSES, MATERIAL_CATEGORIES } from "../../_mock/domain";
import { statusLabelIn } from "../../_mock/domain-labels";
import { listBatches } from "../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { BatchTable } from "../../_components/batch-table";
import { useLabels } from "../../_components/use-labels";

export default function ManufacturerBatchesPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    const requested = searchParams.get("status") ?? "";
    return (BATCH_STATUSES as readonly string[]).includes(requested) ? requested : "";
  });
  const [category, setCategory] = useState("");
  const { batches: t } = useMessages(demoManufacturer);
  const labels = useLabels();

  const rows = listBatches(db, scope, {
    ownerOrgId: scope.orgId,
    search: search || undefined,
    status: status || undefined,
    category: category || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-5">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--ink)]">
            {t.title}
          </h1>
          <div className="flex items-center gap-3">
            <Button 
              as={Link} 
              href="/demo/manufacturer/batches/new" 
              variant="secondary"
              className="h-9 border-[var(--line-strong)] text-[11px] font-bold uppercase tracking-[0.12em]"
            >
              {t.recordManually}
            </Button>
            <Button 
              as={Link} 
              href="/demo/manufacturer/batches/import" 
              className="h-9 bg-[var(--brand-primary)] text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-[#E55300]"
            >
              {t.intake}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder={t.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 flex-1 bg-[var(--surface)] border-transparent focus:border-[var(--brand-primary)] focus:bg-white"
          />
          <div className="flex shrink-0 gap-3">
            <Select 
              value={status} 
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 min-w-[140px] bg-[var(--surface)] border-transparent font-medium"
            >
              <option value="">{t.allStatuses}</option>
              {BATCH_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabelIn(labels, value)}
                </option>
              ))}
            </Select>
            <Select 
              value={category} 
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 min-w-[160px] bg-[var(--surface)] border-transparent font-medium"
            >
              <option value="">{t.allCategories}</option>
              {MATERIAL_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {labels.MATERIAL_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <BatchTable rows={rows} hrefPrefix="/demo/manufacturer/batches" />
    </div>
  );
}
