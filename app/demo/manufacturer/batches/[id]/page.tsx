"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoManufacturer } from "@/lib/i18n/messages/demo-manufacturer";
import { BatchDetailView } from "../../../_components/batch-detail";
import { getBatchDetail } from "../../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function ManufacturerBatchDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const detail = getBatchDetail(db, scope, params.id);
  const { batches: t } = useMessages(demoManufacturer);

  if (!detail) {
    return (
      <EmptyState
        title={t.notFound}
      />
    );
  }

  return (
    <BatchDetailView detail={detail} role="manufacturer" backHref="/demo/manufacturer/batches" />
  );
}
