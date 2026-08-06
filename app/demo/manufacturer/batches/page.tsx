"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input, Panel, Select } from "@/components/ui";
import { BATCH_STATUSES, MATERIAL_CATEGORIES, statusLabel } from "../../_mock/domain";
import { categoryLabel } from "../../_mock/selectors-shared";
import { listBatches } from "../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { BatchTable } from "../../_components/batch-table";
import { SectionHeading } from "../../_components/cirka-ui";

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

  const rows = listBatches(db, scope, {
    ownerOrgId: scope.orgId,
    search: search || undefined,
    status: status || undefined,
    category: category || undefined,
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Resource batches"
        title="Everything your organisation has recorded"
        action={
          <div className="flex gap-3">
            <Button as={Link} href="/demo/manufacturer/batches/import" variant="secondary" size="sm">
              Import CSV
            </Button>
            <Button as={Link} href="/demo/manufacturer/batches/new" size="sm">
              Record a batch
            </Button>
          </div>
        }
      />

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

      <BatchTable rows={rows} hrefPrefix="/demo/manufacturer/batches" />
    </div>
  );
}
