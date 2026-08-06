"use client";

import { useState } from "react";
import { Input, Panel, Select } from "@/components/ui";
import { BATCH_STATUSES, MATERIAL_CATEGORIES, statusLabel } from "../../_mock/domain";
import { listBatches } from "../../_mock/selectors-batches";
import { categoryLabel } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { BatchTable } from "../../_components/batch-table";
import { SectionHeading } from "../../_components/cirka-ui";

export default function AdminBatchesPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const rows = listBatches(db, scope, {
    search: search || undefined,
    status: status || undefined,
    category: category || undefined,
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Resource batches" title="Everything in the system" />

      <Panel className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder="Search name, reference or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {BATCH_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {MATERIAL_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {categoryLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      <BatchTable rows={rows} hrefPrefix="/demo/admin/batches" showOwner />
    </div>
  );
}
