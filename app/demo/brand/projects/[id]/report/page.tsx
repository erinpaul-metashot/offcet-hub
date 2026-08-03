"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, EmptyState, Panel } from "@/components/ui";
import { ASSURANCE_LABELS, DATA_SOURCE_LABELS } from "../../../../_mock/domain";
import { DEMO_NOW } from "../../../../_mock/data";
import { getProjectProofView } from "../../../../_mock/selectors-brand";
import { formatPercent, formatQuantity } from "../../../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../../../_mock/store";
import { DataRow, formatDate } from "../../../../_components/cirka-ui";

export default function BrandProjectReportPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("brand");

  const proof = getProjectProofView(db, scope, params.id);

  if (!proof) {
    return <EmptyState title="Project not found" body="The demo data may have been reset." />;
  }

  const { project, material, operational, social, assurance } = proof;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button as={Link} href={`/demo/brand/projects/${project._id}`} variant="ghost" size="sm">
          ← Back to the proof view
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          Print or save as PDF
        </Button>
      </div>

      <Panel className="space-y-8 p-8">
        <header className="space-y-2 border-b border-[var(--line)] pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
            CIRKA project report · {project.reference}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            {project.title}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            {proof.brandName} · generated {formatDate(DEMO_NOW)}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Objective
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">{project.objective}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Material account
          </h2>
          <dl>
            <DataRow label="Activated" value={formatQuantity(material.activated, material.unit)} />
            <DataRow label="Received" value={formatQuantity(material.received, material.unit)} />
            <DataRow label="Used in production" value={formatQuantity(material.used, material.unit)} />
            <DataRow
              label="Incorporated into finished products"
              value={formatQuantity(material.incorporated, material.unit)}
            />
            <DataRow
              label="Reusable offcuts and remaining stock"
              value={formatQuantity(material.offcuts + material.remaining, material.unit)}
            />
            <DataRow
              label="Loss (production and transit)"
              value={formatQuantity(material.loss + material.writtenOffInTransit, material.unit)}
            />
            <DataRow label="Material yield" value={formatPercent(material.yield)} />
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Operational performance
          </h2>
          <dl>
            <DataRow
              label="Demand to match"
              value={
                operational.demandToMatchDays !== undefined
                  ? `${operational.demandToMatchDays} days`
                  : "—"
              }
            />
            <DataRow label="Delivery accuracy" value={formatPercent(operational.deliveryAccuracy)} />
            <DataRow label="Production completion" value={formatPercent(operational.completionRate)} />
            <DataRow
              label="Issues raised and resolved"
              value={`${operational.issuesResolved} of ${operational.issuesRaised}`}
            />
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Local value
          </h2>
          <dl>
            <DataRow label="Makers engaged" value={social.makersEngaged} />
            <DataRow label="Organisations participating" value={social.organisationsParticipating} />
            <DataRow label="Production hours" value={social.productionHours} />
            <DataRow
              label="Units completed"
              value={`${social.unitsCompleted} of ${social.unitsPlanned} planned`}
            />
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            The journey
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Responsible</th>
                <th className="py-2 pr-4">Expected</th>
                <th className="py-2 pr-4">Actual</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {proof.journey.map((row) => (
                <tr key={row.stage} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="py-2 pr-4 font-medium text-[var(--ink)]">{row.label}</td>
                  <td className="py-2 pr-4 text-[var(--ink-muted)]">{row.responsible}</td>
                  <td className="py-2 pr-4 text-[var(--ink-muted)]">{formatDate(row.plannedDate)}</td>
                  <td className="py-2 pr-4 text-[var(--ink-muted)]">{formatDate(row.actualDate)}</td>
                  <td className="py-2 text-[var(--ink-muted)]">{row.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Provenance and assurance
          </h2>
          <dl>
            <DataRow
              label="How the resource data arrived"
              value={assurance.dataSources.map((source) => DATA_SOURCE_LABELS[source]).join(", ")}
            />
            <DataRow
              label="CIRKA reviewed"
              value={`${assurance.reviewed} of ${proof.production.length} production batches`}
              hint={`${assurance.selfReported} still ${ASSURANCE_LABELS.self_reported.toLowerCase()}`}
            />
            <DataRow
              label="External traceability records"
              value={
                assurance.externalRecords.length > 0
                  ? assurance.externalRecords
                      .map((transfer) => transfer.externalRecordId ?? transfer.externalSystemName)
                      .join(", ")
                  : "None"
              }
            />
          </dl>
          <p className="rounded-2xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--ink-muted)]">
            This report contains no carbon or water figures. CIRKA publishes environmental indicators
            only where an agreed methodology and source factors exist. Maker cost breakdowns, labour
            rates, supplier prices and margins are excluded by design.
          </p>
        </section>
      </Panel>
    </div>
  );
}
