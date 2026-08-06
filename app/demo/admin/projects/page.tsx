"use client";

import { useState } from "react";
import { Input, Panel, Select } from "@/components/ui";
import { PROJECT_STATUSES, statusLabel } from "../../_mock/domain";
import { getProjectsOverview, listProjects } from "../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { ProjectTable } from "../../_components/project-table";
import { SectionHeading } from "../../_components/cirka-ui";

function OverviewStat({
  label,
  value,
  of,
  tone,
}: {
  label: string;
  value: number;
  of?: number;
  tone?: "warn";
}) {
  return (
    <div className="space-y-2 py-5 pr-6 sm:pl-6 sm:first:pl-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd
        className={`text-[38px] font-semibold leading-none tracking-[-0.05em] tabular-nums ${
          tone === "warn" && value > 0 ? "text-[#D14343]" : "text-[var(--ink)]"
        }`}
      >
        {value}
        {of !== undefined && (
          <span className="text-lg font-medium text-[var(--ink-muted)]"> / {of}</span>
        )}
      </dd>
    </div>
  );
}

export default function AdminProjectsPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [brandOrgId, setBrandOrgId] = useState("");

  const overview = getProjectsOverview(db, scope);
  const rows = listProjects(db, scope, {
    search: search || undefined,
    status: status || undefined,
    brandOrgId: brandOrgId || undefined,
  });

  const brands = db.organisations
    .filter((org) => org.type === "brand" && !org.deletedAt)
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Projects" title="Brand programmes CIRKA is coordinating" />

      <dl className="grid grid-cols-2 divide-[var(--line)] border-y border-[var(--line)] sm:grid-cols-4 sm:divide-x">
        <OverviewStat label="Active" value={overview.activeProjects} of={overview.totalProjects} />
        <OverviewStat label="Overdue" value={overview.overdueProjects} tone="warn" />
        <OverviewStat label="Open requests" value={overview.openRequests} />
        <OverviewStat label="In production" value={overview.inProduction} />
      </dl>

      <Panel className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder="Search title, reference or brand"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
          <Select value={brandOrgId} onChange={(event) => setBrandOrgId(event.target.value)}>
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      <ProjectTable rows={rows} hrefPrefix="/demo/admin/projects" />
    </div>
  );
}
