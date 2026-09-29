"use client";

import { useParams, useRouter } from "next/navigation";
import { useDemoStore } from "../../../_mock/store";
import { getOrganisationDetails } from "../../../_mock/selectors-admin";
import { Button, Panel, EmptyState } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { SectionHeading, CirkaBadge, DataRow } from "../../../_components/cirka-ui";
import { OrganisationFacilities } from "../../../_components/organisation-facilities";
import { OrganisationPeople } from "../../../_components/organisation-people";
import { useFormat } from "../../../_components/use-format";
import { useLabels } from "../../../_components/use-labels";

export default function OrganisationDetailPage() {
  const { orgId } = useParams() as { orgId: string };
  const router = useRouter();
  const store = useDemoStore();
  const details = getOrganisationDetails(store.db, orgId);
  const { orgDetail: t, orgForm: f } = useMessages(demoAdmin);
  const labels = useLabels();
  const fmt = useFormat();
  const plural = (count: number, one: string, many: string) => format(count === 1 ? one : many, { count });

  if (!details) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => router.back()}>
          {t.back}
        </Button>
        <EmptyState title={t.notFound} />
      </div>
    );
  }

  const { organisation, users, facilities, batches, allocations, projects, requests } = details;

  return (
    <div className="space-y-10">
      <div>
        <Button variant="secondary" size="sm" onClick={() => router.back()} className="mb-6">
          {t.backToList}
        </Button>
        <SectionHeading
          title={organisation.name}
        />
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <CirkaBadge status={organisation.status} />
          <span className="text-sm text-[var(--ink-muted)] bg-[var(--surface)] px-2 py-1 rounded-md">
            {labels.ORGANISATION_TYPE_LABELS[organisation.type]}
          </span>
          <span className="text-sm text-[var(--ink-muted)] bg-[var(--surface)] px-2 py-1 rounded-md">
            {organisation.city ? `${organisation.city}, ` : ""}{organisation.country}
          </span>
          <span className="text-sm text-[var(--ink-muted)]">
            {format(t.joined, { date: fmt.date(organisation.createdAt) })}
          </span>
          <span className="text-sm tabular-nums text-[var(--ink-muted)]">
            {plural(facilities.length, t.sitesOne, t.sitesMany)}
            {plural(batches.length, t.batchesOne, t.batchesMany)}
            {plural(projects.length, t.projectsOne, t.projectsMany)}
            {format(t.transactions, { count: allocations.length + requests.length })}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
          {t.record}
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-6">
            <dl>
              <DataRow
                label={f.companyNumber}
                value={organisation.registrationNumber ?? "-"}
                hint={f.protected}
              />
              <DataRow
                label={f.taxReference}
                value={organisation.taxId ?? "-"}
                hint={f.protected}
              />
              <DataRow
                label={f.website}
                value={
                  organisation.websiteUrl ? (
                    <a
                      href={organisation.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                    >
                      {organisation.websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <DataRow
                label={t.lastUpdated}
                value={organisation.updatedAt ? fmt.date(organisation.updatedAt) : "-"}
              />
            </dl>
          </Panel>
          <Panel className="p-6">
            <dl>
              <DataRow label={f.address} value={organisation.addressLine ?? "-"} />
              <DataRow label={f.city} value={organisation.city ?? "-"} />
              <DataRow label={f.postcode} value={organisation.postcode ?? "-"} />
              <DataRow label={f.country} value={organisation.country} />
              <DataRow
                label={f.coordinates}
                value={
                  organisation.latitude !== undefined && organisation.longitude !== undefined
                    ? `${organisation.latitude.toFixed(4)}, ${organisation.longitude.toFixed(4)}`
                    : "-"
                }
              />
              <DataRow
                label={f.capabilityTags}
                value={
                  organisation.capabilityTags.length > 0 ? (
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {organisation.capabilityTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--ink)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
            </dl>
          </Panel>
        </div>
      </div>

      <OrganisationPeople organisation={organisation} people={users} />

      <OrganisationFacilities organisation={organisation} facilities={facilities} />
    </div>
  );
}
