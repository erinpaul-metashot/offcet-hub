"use client";

import { useState } from "react";
import { Input, Panel, Select } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { PROJECT_STATUSES } from "../../_mock/domain";
import { statusLabelIn } from "../../_mock/domain-labels";
import { getProjectsOverview, listProjects } from "../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { ProjectTable } from "../../_components/project-table";
import { SectionHeading } from "../../_components/cirka-ui";
import { useLabels } from "../../_components/use-labels";

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
  const { projects: t } = useMessages(demoAdmin);
  const labels = useLabels();
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
      <SectionHeading title={t.title} />

      <dl className="grid grid-cols-2 divide-[var(--line)] border-y border-[var(--line)] sm:grid-cols-4 sm:divide-x">
        <OverviewStat label={t.active} value={overview.activeProjects} of={overview.totalProjects} />
        <OverviewStat label={t.overdue} value={overview.overdueProjects} tone="warn" />
        <OverviewStat label={t.openRequests} value={overview.openRequests} />
        <OverviewStat label={t.inProduction} value={overview.inProduction} />
      </dl>

      <Panel className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder={t.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">{t.allStatuses}</option>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabelIn(labels, value)}
              </option>
            ))}
          </Select>
          <Select value={brandOrgId} onChange={(event) => setBrandOrgId(event.target.value)}>
            <option value="">{t.allBrands}</option>
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
