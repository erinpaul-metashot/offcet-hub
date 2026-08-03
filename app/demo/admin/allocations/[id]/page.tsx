"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { AllocationDetailView } from "../../../_components/allocation-detail";
import { getAllocationDetail } from "../../../_mock/selectors-admin";
import { useDemoStore } from "../../../_mock/store";

export default function AdminAllocationDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useDemoStore();
  const detail = getAllocationDetail(db, params.id);

  if (!detail) {
    return <EmptyState title="Allocation not found" body="The demo data may have been reset." />;
  }

  return <AllocationDetailView detail={detail} backHref="/demo/admin/allocations" />;
}
