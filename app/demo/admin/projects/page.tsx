"use client";

import { useState } from "react";
import { Input, Panel, Select } from "@/components/ui";
import { PROJECT_STATUSES, statusLabel } from "../../_mock/domain";
import { listProjects } from "../../_mock/selectors-admin";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { ProjectTable } from "../../_components/project-table";
import { SectionHeading } from "../../_components/cirka-ui";

export default function AdminProjectsPage() {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [brandOrgId, setBrandOrgId] = useState("");

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
      <SectionHeading
        eyebrow="Projects"
        title="Brand programmes CIRKA is coordinating"
        description="The project is the spine of the brand-facing view. Admins see everything on it, including what the brand does not."
      />

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
