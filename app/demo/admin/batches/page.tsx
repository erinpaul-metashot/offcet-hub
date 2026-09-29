"use client";

import { useState } from "react";
import { Input, Panel, Select } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { BATCH_STATUSES, MATERIAL_CATEGORIES } from "../../_mock/domain";
import { statusLabelIn } from "../../_mock/domain-labels";
import { listBatches } from "../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { BatchTable } from "../../_components/batch-table";
import { SectionHeading } from "../../_components/cirka-ui";
import { useLabels } from "../../_components/use-labels";

export default function AdminBatchesPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");

  const [search, setSearch] = useState("");
  const { batches: t } = useMessages(demoAdmin);
  const labels = useLabels();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const rows = listBatches(db, scope, {
    search: search || undefined,
    status: status || undefined,
    category: category || undefined,
  });

  return (
    <div className="space-y-6">
      <SectionHeading title={t.title} />

      <Panel className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder={t.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">{t.allStatuses}</option>
            {BATCH_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabelIn(labels, value)}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t.allCategories}</option>
            {MATERIAL_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {labels.MATERIAL_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      <BatchTable rows={rows} hrefPrefix="/demo/admin/batches" showOwner />
    </div>
  );
}
