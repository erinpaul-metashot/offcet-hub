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
      <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--ink)]">
              Resource Batches
            </h1>
            <p className="text-sm font-medium text-[var(--ink-muted)] mt-1">
              Recorded, imported, and pushed batches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              as={Link} 
              href="/demo/manufacturer/batches/new" 
              variant="secondary"
              className="h-9 border-[var(--line-strong)] text-[11px] font-bold uppercase tracking-[0.12em]"
            >
              Record Manually
            </Button>
            <Button 
              as={Link} 
              href="/demo/manufacturer/batches/import" 
              className="h-9 bg-[var(--brand-primary)] text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-[#E55300]"
            >
              Intake
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search name, reference or location..."
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
              <option value="">All statuses</option>
              {BATCH_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
            <Select 
              value={category} 
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 min-w-[160px] bg-[var(--surface)] border-transparent font-medium"
            >
              <option value="">All categories</option>
              {MATERIAL_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {categoryLabel(value)}
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
