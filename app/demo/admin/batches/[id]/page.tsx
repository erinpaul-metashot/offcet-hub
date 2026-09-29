"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { BatchDetailView } from "../../../_components/batch-detail";
import { getBatchDetail } from "../../../_mock/selectors-batches";
import { useDemoPersona, useDemoStore } from "../../../_mock/store";

export default function AdminBatchDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const { scope } = useDemoPersona("admin");

  const detail = getBatchDetail(db, scope, params.id);
  const { batches: t } = useMessages(demoAdmin);

  if (!detail) {
    return <EmptyState title={t.notFound} />;
  }

  return <BatchDetailView detail={detail} role="admin" backHref="/demo/admin/batches" />;
}
