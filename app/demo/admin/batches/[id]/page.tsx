"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { BatchDetailView } from "../../../_components/batch-detail";
import { getBatchDetail } from "../../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function AdminBatchDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");

  const detail = getBatchDetail(db, scope, params.id);

  if (!detail) {
    return <EmptyState title="Batch not found" body="The demo data may have been reset." />;
  }

  return <BatchDetailView detail={detail} role="admin" backHref="/demo/admin/batches" />;
}
