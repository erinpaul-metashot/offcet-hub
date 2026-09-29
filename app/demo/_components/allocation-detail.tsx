"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Panel, Select } from "@/components/ui";
import { format } from "@/lib/i18n/locale";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { demoCommon } from "@/lib/i18n/messages/demo-common";
import { DISCREPANCY_RESOLUTIONS, type DiscrepancyResolution } from "../_mock/domain";
import type { AllocationDetail } from "../_mock/selectors-admin";
import { useDemoStore } from "../_mock/store";
import { AllocationJourney } from "./allocation-journey";
import { CirkaBadge, DataRow, NoticeBanner, SectionHeading } from "./cirka-ui";
import { useFormat } from "./use-format";
import { ThreadTimelinePanel } from "./trace-timeline";
import { useAction } from "./use-action";

export function AllocationDetailView({
  detail,
  backHref,
}: {
  detail: AllocationDetail;
  backHref: string;
}) {
  const store = useDemoStore();
  const { run, error, pending } = useAction();
  const { allocation, batch, fromName, toName, fromFacility, toFacility } = detail;

  const [resolution, setResolution] = useState<DiscrepancyResolution>("loss_confirmed");
  const [note, setNote] = useState("");
  const { allocationDetail: t } = useMessages(demoAdmin);
  const { ui } = useMessages(demoCommon);
  const fmt = useFormat();
  const resolutionLabel = (value?: DiscrepancyResolution) => (value ? t.resolutions[value] : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href={backHref} variant="ghost" size="sm">
          {t.back}
        </Button>
        <CirkaBadge status={allocation.status} />
      </div>

      <SectionHeading
        eyebrow={allocation.reference}
        title={`${fromName} → ${toName}`}
        action={
          batch ? (
            <Button as={Link} href={`/demo/admin/batches/${batch._id}`} variant="secondary" size="sm">
              {t.openBatch}
            </Button>
          ) : undefined
        }
      />

      {error && (
        <NoticeBanner tone="blocking" title={ui.stepRefused}>
          {error}
        </NoticeBanner>
      )}

      <Panel className="p-6">
        <AllocationJourney allocation={allocation} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.quantity}
          </h2>
          <dl>
            <DataRow label={t.allocated} value={fmt.quantity(allocation.quantityAllocated, allocation.unit)} />
            <DataRow
              label={t.dispatched}
              value={
                allocation.quantityDispatched !== undefined
                  ? fmt.quantity(allocation.quantityDispatched, allocation.unit)
                  : "-"
              }
              hint={fmt.date(allocation.dispatchedAt)}
            />
            <DataRow
              label={t.received}
              value={
                allocation.quantityReceived !== undefined
                  ? fmt.quantity(allocation.quantityReceived, allocation.unit)
                  : "-"
              }
              hint={fmt.date(allocation.receivedAt)}
            />
            <DataRow
              label={t.discrepancy}
              value={
                allocation.quantityDiscrepancy
                  ? fmt.quantity(allocation.quantityDiscrepancy, allocation.unit)
                  : t.none
              }
              hint={resolutionLabel(allocation.discrepancyResolution)}
            />
          </dl>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {t.routeAndTiming}
          </h2>
          <dl>
            <DataRow label={t.from} value={fromName} hint={fromFacility?.name} />
            <DataRow label={t.to} value={toName} hint={toFacility?.name} />
            <DataRow label={t.expectedDispatch} value={fmt.date(allocation.expectedDispatchDate)} />
            <DataRow label={t.dispatchReference} value={allocation.dispatchReference ?? "-"} />
            <DataRow label={t.expectedArrival} value={fmt.date(allocation.expectedArrivalDate)} />
            <DataRow
              label={t.proposed}
              value={`${fmt.date(allocation.createdAt)} · ${detail.proposedByName}`}
            />
            {detail.respondedByName && (
              <DataRow
                label={allocation.status === "declined" ? t.declined : t.accepted}
                value={`${fmt.date(allocation.respondedAt)} · ${detail.respondedByName}`}
                hint={allocation.responseNote}
              />
            )}
          </dl>
        </Panel>
      </div>

      {allocation.status === "discrepancy" && (
        <section className="space-y-4 rounded-2xl border border-[#B4531A] bg-[#FBE9DC] p-6">
          <div>
            <p className="text-sm font-semibold text-[#8A3D11]">
              {format(t.unexplained, { quantity: fmt.quantity(allocation.quantityDiscrepancy ?? 0, allocation.unit) })}
            </p>
            {allocation.discrepancyReason && (
              <p className="text-sm text-[#8A3D11]">{allocation.discrepancyReason}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.resolution}>
              <Select
                value={resolution}
                onChange={(event) => setResolution(event.target.value as DiscrepancyResolution)}
              >
                {DISCREPANCY_RESOLUTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === "loss_confirmed" || value === "count_corrected"
                      ? format(t.resolutionEffect[value], { label: t.resolutions[value] })
                      : t.resolutions[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.note}>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t.notePlaceholder}
              />
            </Field>
          </div>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() =>
                store.resolveDiscrepancy("admin", {
                  allocationId: allocation._id,
                  resolution,
                  note,
                }),
              )
            }
          >
            {t.closeDiscrepancy}
          </Button>
        </section>
      )}

      {allocation.discrepancyResolvedAt && (
        <NoticeBanner
          tone="info"
          title={format(t.resolved, { resolution: resolutionLabel(allocation.discrepancyResolution) ?? "-" })}
        >
          {fmt.date(allocation.discrepancyResolvedAt)} · {detail.discrepancyResolvedByName}
        </NoticeBanner>
      )}

      <ThreadTimelinePanel
        role="admin"
        anchor={{ table: "allocations", id: allocation._id }}
      />
    </div>
  );
}
