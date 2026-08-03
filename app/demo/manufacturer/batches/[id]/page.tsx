"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { BatchDetailView } from "../../../_components/batch-detail";
import { getBatchDetail } from "../../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function ManufacturerBatchDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("manufacturer");

  const detail = getBatchDetail(db, scope, params.id);

  if (!detail) {
    return (
      <EmptyState
        title="Batch not found"
        body="It may have been removed, or the demo data was reset."
      />
    );
  }

  return (
    <BatchDetailView detail={detail} role="manufacturer" backHref="/demo/manufacturer/batches" />
  );
}
