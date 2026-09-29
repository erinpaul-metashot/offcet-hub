"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { useMessages } from "@/lib/i18n/locale-provider";
import { demoAdmin } from "@/lib/i18n/messages/demo-admin";
import { AllocationDetailView } from "../../../_components/allocation-detail";
import { getAllocationDetail } from "../../../_mock/selectors-admin";
import { useDemoStore } from "../../../_mock/store";

export default function AdminAllocationDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const detail = getAllocationDetail(db, params.id);
  const { allocations: t } = useMessages(demoAdmin);

  if (!detail) {
    return <EmptyState title={t.notFound} />;
  }

  return <AllocationDetailView detail={detail} backHref="/demo/admin/allocations" />;
}
