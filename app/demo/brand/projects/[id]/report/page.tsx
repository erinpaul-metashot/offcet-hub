"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, EmptyState, Panel } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoBrand } from "@/lib/i18n/messages/demo-brand";
import { DEMO_NOW } from "../../../../_mock/data";
import { getProjectProofView } from "../../../../_mock/selectors-brand";
import { useDemoPersona, useDemoStore } from "../../../../_mock/store";
import { DataRow } from "../../../../_components/cirka-ui";
import { useFormat } from "../../../../_components/use-format";
import { useLabels } from "../../../../_components/use-labels";

export default function BrandProjectReportPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("brand");

  const proof = getProjectProofView(db, scope, params.id);
  const { report: t } = useMessages(demoBrand);
  const labels = useLabels();
  const fmt = useFormat();

  if (!proof) {
    return <EmptyState title={t.notFound} />;
  }

  const { project, material, operational, social, assurance } = proof;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button as={Link} href={`/demo/brand/projects/${project._id}`} variant="ghost" size="sm">
          {t.back}
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          {t.print}
        </Button>
      </div>

      <Panel className="space-y-8 p-8">
        <header className="space-y-2 border-b border-[var(--line)] pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
            {format(t.eyebrow, { reference: project.reference })}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            {project.title}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            {format(t.generated, { brand: proof.brandName, date: fmt.date(DEMO_NOW) })}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.objective}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink)]">{project.objective}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.materialAccount}
          </h2>
          <dl>
            <DataRow label={t.activated} value={fmt.quantity(material.activated, material.unit)} />
            <DataRow label={t.received} value={fmt.quantity(material.received, material.unit)} />
            <DataRow label={t.used} value={fmt.quantity(material.used, material.unit)} />
            <DataRow
              label={t.incorporated}
              value={fmt.quantity(material.incorporated, material.unit)}
            />
            <DataRow
              label={t.reusable}
              value={fmt.quantity(material.offcuts + material.remaining, material.unit)}
            />
            <DataRow
              label={t.loss}
              value={fmt.quantity(material.loss + material.writtenOffInTransit, material.unit)}
            />
            <DataRow label={t.yield} value={fmt.percent(material.yield)} />
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.operational}
          </h2>
          <dl>
            <DataRow
              label={t.demandToMatch}
              value={
                operational.demandToMatchDays !== undefined
                  ? format(t.days, { count: operational.demandToMatchDays })
                  : "-"
              }
            />
            <DataRow label={t.deliveryAccuracy} value={fmt.percent(operational.deliveryAccuracy)} />
            <DataRow label={t.completion} value={fmt.percent(operational.completionRate)} />
            <DataRow
              label={t.issues}
              value={format(t.issuesValue, { resolved: operational.issuesResolved, raised: operational.issuesRaised })}
            />
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.localValue}
          </h2>
          <dl>
            <DataRow label={t.makersEngaged} value={social.makersEngaged} />
            <DataRow label={t.organisations} value={social.organisationsParticipating} />
            <DataRow label={t.hours} value={social.productionHours} />
            <DataRow
              label={t.units}
              value={format(t.unitsValue, { completed: social.unitsCompleted, planned: social.unitsPlanned })}
            />
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.journey}
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <th className="py-2 pr-4">{t.stage}</th>
                <th className="py-2 pr-4">{t.responsible}</th>
                <th className="py-2 pr-4">{t.expected}</th>
                <th className="py-2 pr-4">{t.actual}</th>
                <th className="py-2">{t.note}</th>
              </tr>
            </thead>
            <tbody>
              {proof.journey.map((row) => (
                <tr key={row.stage} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="py-2 pr-4 font-medium text-[var(--ink)]">{labels.MILESTONE_LABELS[row.stage] ?? row.label}</td>
                  <td className="py-2 pr-4 text-[var(--ink-muted)]">{row.responsible}</td>
                  <td className="py-2 pr-4 text-[var(--ink-muted)]">{fmt.date(row.plannedDate)}</td>
                  <td className="py-2 pr-4 text-[var(--ink-muted)]">{fmt.date(row.actualDate)}</td>
                  <td className="py-2 text-[var(--ink-muted)]">{row.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.provenance}
          </h2>
          <dl>
            <DataRow
              label={t.dataSources}
              value={assurance.dataSources.map((source) => labels.DATA_SOURCE_LABELS[source]).join(", ")}
            />
            <DataRow
              label={t.cirkaReviewed}
              value={format(t.reviewedValue, { reviewed: assurance.reviewed, total: proof.production.length })}
              hint={format(t.stillSelfReported, { count: assurance.selfReported })}
            />
            <DataRow
              label={t.externalRecords}
              value={
                assurance.externalRecords.length > 0
                  ? assurance.externalRecords
                      .map((transfer) => transfer.externalRecordId ?? transfer.externalSystemName)
                      .join(", ")
                  : t.none
              }
            />
          </dl>
        </section>
      </Panel>
    </div>
  );
}
