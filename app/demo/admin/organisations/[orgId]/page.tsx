"use client";

import { useParams, useRouter } from "next/navigation";
import { useDemoStore } from "../../../_mock/store";
import { getOrganisationDetails } from "../../../_mock/selectors-admin";
import { Button, Panel, EmptyState } from "@/components/ui";
import { SectionHeading, CirkaBadge, DataRow, formatDate } from "../../../_components/cirka-ui";
import { OrganisationFacilities } from "../../../_components/organisation-facilities";
import { OrganisationPeople } from "../../../_components/organisation-people";
import { ORGANISATION_TYPE_LABELS } from "../../../_mock/domain";

export default function OrganisationDetailPage() {
  const { orgId } = useParams() as { orgId: string };
  const router = useRouter();
  const store = useDemoStore();
  const details = getOrganisationDetails(store.db, orgId);

  if (!details) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => router.back()}>
          &larr; Back
        </Button>
        <EmptyState title="Organisation Not Found" body="The organisation you are looking for does not exist or has been deleted." />
      </div>
    );
  }

  const { organisation, users, facilities, batches, allocations, projects, requests } = details;

  return (
    <div className="space-y-10">
      <div>
        <Button variant="secondary" size="sm" onClick={() => router.back()} className="mb-6">
          &larr; Back to Organisations
        </Button>
        <SectionHeading
          eyebrow="Organisation Details"
          title={organisation.name}
          description={organisation.description || "No description provided."}
        />
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <CirkaBadge status={organisation.status} />
          <span className="text-sm text-[var(--ink-muted)] bg-[var(--surface)] px-2 py-1 rounded-md">
            {ORGANISATION_TYPE_LABELS[organisation.type]}
          </span>
          <span className="text-sm text-[var(--ink-muted)] bg-[var(--surface)] px-2 py-1 rounded-md">
            {organisation.city ? `${organisation.city}, ` : ""}{organisation.country}
          </span>
          <span className="text-sm text-[var(--ink-muted)]">
            Joined {formatDate(organisation.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Panel className="p-6 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-[var(--ink)]">{facilities.length}</p>
          <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)] mt-1">Facilities</p>
        </Panel>
        <Panel className="p-6 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-[var(--ink)]">{batches.length}</p>
          <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)] mt-1">Batches</p>
        </Panel>
        <Panel className="p-6 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-[var(--ink)]">{projects.length}</p>
          <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)] mt-1">Projects</p>
        </Panel>
        <Panel className="p-6 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-[var(--ink)]">{allocations.length + requests.length}</p>
          <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)] mt-1">Transactions</p>
        </Panel>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
          Organisation record
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-6">
            <dl>
              <DataRow label="Legal / trading name" value={organisation.name} />
              <DataRow label="Type" value={ORGANISATION_TYPE_LABELS[organisation.type]} />
              <DataRow
                label="Company number"
                value={organisation.registrationNumber ?? "Not recorded"}
                hint="Protected — CIRKA and the organisation only."
              />
              <DataRow
                label="Tax / VAT reference"
                value={organisation.taxId ?? "Not recorded"}
                hint="Protected — CIRKA and the organisation only."
              />
              <DataRow
                label="Website"
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
                    "Not recorded"
                  )
                }
              />
              <DataRow
                label="Last updated"
                value={organisation.updatedAt ? formatDate(organisation.updatedAt) : "Never edited"}
              />
            </dl>
          </Panel>
          <Panel className="p-6">
            <dl>
              <DataRow label="Address" value={organisation.addressLine ?? "Not recorded"} />
              <DataRow label="City" value={organisation.city ?? "Not recorded"} />
              <DataRow label="Postcode" value={organisation.postcode ?? "Not recorded"} />
              <DataRow label="Country" value={organisation.country} />
              <DataRow
                label="Coordinates"
                value={
                  organisation.latitude !== undefined && organisation.longitude !== undefined
                    ? `${organisation.latitude.toFixed(4)}, ${organisation.longitude.toFixed(4)}`
                    : "Not recorded"
                }
                hint="Used to rank custodians by distance."
              />
              <DataRow
                label="Capability tags"
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
                    "None recorded"
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
